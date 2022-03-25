const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: 'https://learn-react-2816d-default-rtdb.firebaseio.com',
});

module.exports = admin;