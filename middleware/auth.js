const firebase = require('../config/firebase-config');
const jwt = require('jsonwebtoken');

function errorResponse(res) {
    return res.status(401).json({
        success: false,
        message: 'Unauthorized'
    });
}

const authMiddleware = {
     // Generate access token
     generateCsrfToken: (session) => {
        return jwt.sign({
            session: session
        }, 'JWT_CSRF_TOKEN', {
            expiresIn: '1d'
        });
    },

    verifyUserToken: async (req, res, next) => {
        const headerToken = req.headers.authorization;
        if ((!headerToken || headerToken.split(' ')[0] !== 'Bearer') && !(req.cookies && req.cookies.idToken)) {
            // && !(req.cookies && req.cookies._session)
            return errorResponse(res);
        }
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

    verifyUserSession: async(req, res, next) => {
        const sessionCookie = req.cookies.session || '';
        const csrfToken = req.body.csrfToken || req.cookies.csrfToken;

        if (sessionCookie) {
            firebase.auth()
        		.verifySessionCookie(req.cookies.session, true)
        		.then(function (decodedClaims) {
                    if (decodedClaims) {
                        // Guard against CSRF attacks.
                        if (csrfToken?.toString() !== req.cookies.csrfToken) {
                            console.log('NOT OK');
                            return res.status(401).json({
                                message: 'Unauthorized request. Token is not valid'
                            });
                        } else {
                            next();
                        }
                    } else {
                        return res.status(401).json({
                            message: 'Unauthorized request. Session is expired.'
                        });
                    }
        		})
        		.catch((err) => {
                    return res.status(401).json({
                        error: err,
                        message: 'Unauthorized request'
                    });
        		});
        } else {
            return res.status(401).json({
				message: 'Unauthorized request. Session is expired.'
			});
        }
    }
}

module.exports = authMiddleware;