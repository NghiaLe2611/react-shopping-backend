require('dotenv').config(); 

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount');
// console.log(123, serviceAccount);

admin.initializeApp({
	credential: admin.credential.cert({
		...serviceAccount,
		privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, '\n')
	}),
	databaseURL: process.env.FIREBASE_DB_URL,
});

module.exports = admin;