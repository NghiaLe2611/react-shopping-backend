const firebase = require('../config/firebase-config');

async function authMiddleware(req, res, next) {
	const headerToken = req.headers.authorization;
    
    if ((!headerToken || headerToken.split(' ')[0] !== 'Bearer') && !(req.cookies && req.cookies._session)) {
        // && !(req.cookies && req.cookies._session)
        return res.status(403).send('Unauthorized 1');
    }

    let token;

    if (headerToken && headerToken.split(' ')[0] === 'Bearer') {
        token = headerToken.split(' ')[1]
    } else if (req.cookies) {
        console.log(req.cookies);
        return res.send('cookies');
    } else {
        return res.status(403).send('Unauthorized 2');
    }

    // try {
    //     const decodedIdToken = await firebase.auth().verifyIdToken(token);
    //     req.user = decodedIdToken;
    //     next();
    //     return;
    // } catch (error) {
    //     return res.status(403).send('Unauthorized');
    // }


	firebase.auth().verifyIdToken(token)
		.then(() => next())
		.catch(() => res.send({message: 'Could not authorize'}).status(403));
}

module.exports = authMiddleware;
