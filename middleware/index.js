const admin = require('../config/firebase-config');
class Middleware{
    async decodeToken(req, res, next) {
        // console.log(req.headers);
        const token = req.headers.authorization.split(' ')[1];
        try {
            const decodeValue = await admin.auth().verifyIdToken(token);
            // console.log('decodeValue', decodeValue);
            if (decodeValue) {
                // req['user_id'] = decodeValue.user['user_id'];
                return next();
            }
            return res.json({
                message: 'Unauthorized'
            });
        } catch {
            return res.json({
                message: 'Internal Error'
            });
        }
    }
}

module.exports = new Middleware();