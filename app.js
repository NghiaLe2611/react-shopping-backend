const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const csrf = require('csurf');
const mongoPractice = require('./mongoose');
const bodyParser = require('body-parser');
// const authMiddleware = require('./middleware/auth');
const admin = require('./config/firebase-config');
const app = express();

const route = require('./routes');

// const productsRoute = require('./routes/products');
// const reviewsRoute = require('./routes/reviews');
// const usersRoute = require('./routes/users');

// Connect to db
// const db = require('./config/db');
// db.connect();

require('dotenv').config();

app.use(cookieParser());
// const csrfMiddleware = csrf({ cookie: true });
// app.use(csrf({ cookie: true }))

const corsConfig = {
	origin: true,
	credentials: true
};

app.use(cors(corsConfig));
// app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());


// app.use(middleware.decodeToken);

// app.use((req, res, next) => {
// res.header('Access-Control-Allow-Origin', '*');
// res.header(
//     'Access-Control-Allow-Headers',
//     'Origin, X-Requested-With, Content-Type, Accept, Authorization'
// );
// if (req.method === 'OPTIONS') {
//     res.header(
//         'Access-Control-Allow-Methods',
//         'PUT, POST, PATCH, DELETE, GET'
//     );
//     return res.status(200).json({});
// }
// next();

// // Website you wish to allow to connect
// res.setHeader('Access-Control-Allow-Origin', '*');

// // Request methods you wish to allow
// res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

// // Request headers you wish to allow
// res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

// // Set to true if you need the website to include cookies in the requests sent to the API (e.g. in case you use sessions)
// res.setHeader('Access-Control-Allow-Credentials', true);

// // Pass to next layer of middleware
// next();
// });


function attachCsrfToken(url, cookie, value) {
	return function (req, res, next) {
		if (req.url === url) {
			res.cookie(cookie, value);
		}
		next();
	};
}

// Attach CSRF token on each request.
// app.use(attachCsrfToken('/', 'csrfToken', (Math.random()* 10000000).toString()));

// app.all('*', (req, res, next) => {
// 	res.cookie('csrfToken', (Math.random() * 10000000).toString());
// 	next();
// });

// app.all('*', (req, res, next) => {
// 	const csrfToken = (Math.random()* 10000000).toString();
// 	res.cookie('csrfToken', csrfToken);
// 	next();
// });

app.get('/test', function(req, res) {
	return res.json({ csrfToken: 'abc' });
});

// Routes
route(app);
// app.use('/api/v1/products', productsRoute);
// app.use('/api/v1/reviews', reviewsRoute);
// app.use('/api/v1/me', usersRoute);



// Login
app.post('/sessionLogin', async function(req, res, next) {
	const idToken = req.body.idToken.toString();
	const expiresIn = 60 * 60 * 24 * 1000; //24h in milliseconds

	// console.log(req.cookies);

	//If cookies.csrfToken not found, it will set as -1 otherwise it gets the value from cookie
	// const csrfToken = !req.cookies.csrfToken ? -1 : req.body.csrfToken.toString();

	// Guard against CSRF attacks.
	// if (!req.cookies || csrfToken !== req.cookies.csrfToken) {
	// 	console.log(`In ${req.path}, csrfToken=${csrfToken}, req.cookies.csrfToken=${req.cookies.csrfToken}`);
	// }

	//req.headers.csrfToken
	// const csrfToken = req.body.csrfToken.toString();
	// console.log('body', req.body);

	// admin.auth().verifySessionCookie(idToken, true).then(function(decodedClaims) { // true: checkRevoked
	//     console.log('verifySessionCookie', decodedClaims);
	// }).catch(function(error) {
	//     console.log(error);
	// });

	admin.auth()
		.createSessionCookie(idToken, {expiresIn})
		.then((sessionCookie) => {
			const options = {maxAge: expiresIn, httpOnly: true};
			res.cookie('__session', sessionCookie, options);
			return res.status(200).json({status: 'success'});
			// res.end(JSON.stringify({ status: 'success' }));
		},
		(error) => {
			return res.status(401).json({
				error: error,
				message: 'Unauthorized'
			});
		}
	);
});
// Source: https://github.com/firebase/quickstart-nodejs/blob/b2fcc5c36e1194dad3aeb4f176016deb281ca8a4/auth-sessions/app.js#L145

// Logout
app.post('/sessionLogout', async function (req, res) {
	// const sessionCookie = req.cookies.__session;
	// let user = await admin.auth().verifySessionCookie(sessionCookie, true /** checkRevoked */);
	res.clearCookie('csrfToken');
	res.clearCookie('__session');
});

// Get user data
app.get('/getUserData/:userId', mongoPractice.getUserData);

// Set user data
app.post('/submitUserData', mongoPractice.submitUserData);

// Update user data
app.put('/updateUserData/:userId', mongoPractice.updateUserData);
app.put('/updateUserAddress/:userId/:addressId', mongoPractice.updateUserAddress);
app.put('/addToWishlist/:userId/:productId', mongoPractice.addToWishlist);

// Get province
app.get('/cities', mongoPractice.getCities);

// Get districts
app.get('/districts/:id', mongoPractice.getDistricts);

// Get wards
app.get('/wards', mongoPractice.getWards);

// app.use((req, res, next) => {
//     const error = new Error('Not found');
//     error.status = 404;
//     next(error);
// });

app.use(function(req, res, next) {

	// Website you wish to allow to connect
	res.setHeader('Access-Control-Allow-Origin', '*');

	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization'
	);

	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);

	// Pass to next layer of middleware
	next();
});

app.use((error, req, res, next) => {
	res.status(error.status || 500);
	res.json({
		error: {
			message: error.message,
		},
	});
});

module.exports = app;