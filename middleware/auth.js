const firebase = require('../config/firebase-config');

function errorResponse(res) {
    return res.status(401).json({
        success: false,
        message: 'Unauthorized'
    });
}

const authMiddleware = {
    verifyUser: async (req, res, next) => {
        const headerToken = req.headers.authorization;
        if ((!headerToken || headerToken.split(' ')[0] !== 'Bearer') && !(req.cookies && req.cookies.idToken)) {
            // && !(req.cookies && req.cookies._session)
            return errorResponse(res);
        }
    
        // const sessionCookie = req.cookies.session || '';
        console.log(req.cookies);

        let token;
        if (headerToken && headerToken.split(' ')[0] === 'Bearer') {
            token = headerToken.split(' ')[1];
        } else if (req.cookies && req.cookies.idToken) {
            token = req.cookies.idToken ? req.cookies.idToken : '';
        } else {
            return errorResponse(res);
        }
        
        try {
            const decodedIdToken = await firebase.auth().verifyIdToken(token);
            req.user = decodedIdToken;
            next();
        } catch (error) {
            console.log(error);
            return errorResponse(res);
        }
    
        // firebase.auth().verifyIdToken(token)
        // 	.then(() => next())
        // 	.catch(() => res.send({message: 'Could not authorize'}).status(403));
    },
    generateCsrfToken: async(req, res, next) => {
        
    }
}

module.exports = authMiddleware;