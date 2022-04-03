const firebase = require('../config/firebase-config');

async function authMiddleware(req, res, next) {
	const headerToken = req.headers.authorization;
    if ((!headerToken || headerToken.split(' ')[0] !== 'Bearer') && !(req.cookies && req.cookies.csrfToken)) {
        // && !(req.cookies && req.cookies._session)
        return res.status(401).json({
            code: 401,
            message: 'Unauthorized'
        });
    }

    let token;
    if (headerToken && headerToken.split(' ')[0] === 'Bearer') {
        token = headerToken.split(' ')[1];
    } else if (req.cookies && req.cookies.csrfToken) {
        token = req.cookies.csrfToken ? req.cookies.csrfToken : '';
    } else {
        return res.status(401).json({
            code: 401,
            message: 'Unauthorized'
        });
    }

    try {
        const decodedIdToken = await firebase.auth().verifyIdToken(token);
        req.user = decodedIdToken;
        next();
        // return;
    } catch (error) {
        return res.status(401).json({
            code: 401,
            message: 'Unauthorized'
        });
    }


	// firebase.auth().verifyIdToken(token)
	// 	.then(() => next())
	// 	.catch(() => res.send({message: 'Could not authorize'}).status(403));
}

module.exports = authMiddleware;