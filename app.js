const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoPractice = require('./mongoose');
const bodyParser = require('body-parser');
const admin = require('./config/firebase-config');
const app = express();
const https = require('https');
const route = require('./routes');
const authMiddleware = require('./middleware/auth');

// Connect to db
// const db = require('./config/db');
// db.connect();

require('dotenv').config();

// const csrfMiddleware = csrf({ cookie: true });
// app.use(csrf({ cookie: true }))

const corsConfig = {
	origin: true,
	// origin: ['http://localhost:3000', process.env.FRONTEND_APP_URL],
	credentials: true,
};

app.set('trust proxy', 1); // Heroku
app.use(cors(corsConfig));
// app.use(cors());
// app.options('*', cors());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

// app.use(middleware.decodeToken);

// function attachCsrfToken(url, cookie, value) {
// 	return function (req, res, next) {
// 		if (req.url === url) {
// 			res.cookie(cookie, value);
// 		}
// 		next();
// 	};
// }

// Attach CSRF token on each request.
// app.use(attachCsrfToken('/', 'csrfToken', (Math.random()* 10000000).toString()));
// app.use(attachCsrfToken('/sessionLogin', 'csrfToken', (Math.random()* 100000000000000000).toString()));

// Routes
route(app);
// app.use('/api/v1/products', productsRoute);
// app.use('/api/v1/reviews', reviewsRoute);
// app.use('/api/v1/me', usersRoute);

app.get('/', function (req, res) {
	return res.status(200).json({
		status: 'ok',
		env: process.env.NODE_ENV === 'production' ? 'production' : 'development',
	});
});

// Login
app.post('/sessionLogin', async function (req, res) {
	const idToken = req.body.idToken;
	const expiresIn = 60 * 60 * 1 * 1000; // 1h in milliseconds

	admin
		.auth()
		.createSessionCookie(idToken.toString(), { expiresIn })
		.then(
			(sessionCookie) => {
				const options = {
					maxAge: expiresIn,
					httpOnly: true,
					path: '/',
					// domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : 'localhost',
					sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
					secure: process.env.NODE_ENV === 'production' ? true : false, // must be true if sameSite='none'
				};
				res.cookie('session', sessionCookie, options);
				res.cookie('csrfToken', authMiddleware.generateCsrfToken(sessionCookie), options);
				return res.status(200).json({ status: 'success' });
			},
			(err) => {
				return res.status(401).json({
					error: err,
					message: 'Unauthorized request',
				});
			}
		);
});
// Source: https://github.com/firebase/quickstart-nodejs/blob/b2fcc5c36e1194dad3aeb4f176016deb281ca8a4/auth-sessions/app.js#L145

// Logout
app.post('/sessionLogout', async function (req, res) {
	const sessionCookie = req.cookies.session || '';
	const idToken = req.body.idToken || '';

	if (sessionCookie) {
		res.clearCookie('session');
		res.clearCookie('csrfToken');
		res.clearCookie('idToken');
		admin
			.auth()
			.verifySessionCookie(sessionCookie, true)
			.then(function (decodedClaims) {
				// console.log('decodedClaims', decodedClaims);
				return admin.auth().revokeRefreshTokens(decodedClaims.sub);
			})
			.then(() => {
				res.status(200).json({
					success: true,
				});
			})
			.catch((err) => {
				return res.status(401).json({
					error: err,
					message: 'Verify session failed.',
				});
			});
	} else {
		if (req.body.idToken) {
			try {
				const decodedIdToken = await admin.auth().verifyIdToken(idToken);
				if (decodedIdToken) {
					res.clearCookie('session');
					res.clearCookie('csrfToken');
					res.clearCookie('idToken');
					res.status(200).json({
						success: true,
					});
				}
			} catch (error) {
				return res.status(401).json({
					message: error,
				});
			}
		} else {
			return res.status(401).json({
				message: 'Session is invalid.',
			});
		}
	}
});

async function getStockInformation(date) {
	let data = '';

	return new Promise((resolve) => {
		https
			.get(`https://jsonmock.hackerrank.com/api/stocks?date=${date}`, (res) => {
				let obj = '';
				res.on('data', (chunk) => {
					obj += chunk;
				});

				res.on('end', () => {
					// const response = JSON.parse(data).data[0];
					// const {open, close, low, high} = response;
					const response = JSON.parse(obj);
					data = response.data[0];
					delete data.date;
					resolve(data);
					// console.log('Open: ' + open);
					// console.log('Close: ' + close);
					// console.log('High: ' + high);
					// console.log('Low: ' + low);
				});
			})
			.on('error', (err) => {
				console.log('Error: ' + err.message);
			});
	});
}

app.get('/test', async function (req, res) {
	try {
		const result = await getStockInformation('5-January-2000');
		const isEmpty = !Object.keys(result).length;
		if (isEmpty) {
			console.log('No Results Found');
		} else {
			console.log(11111, result);
		}
	} catch (err) {
		console.log(err);
	}
	res.json('OK');
});

// Get province
app.get('/cities', mongoPractice.getCities);

// Get districts
app.get('/districts/:id', mongoPractice.getDistricts);

// Get wards
app.get('/wards', mongoPractice.getWards);

// app.use(function(req, res, next) {

// 	// Website you wish to allow to connect
// 	res.setHeader('Access-Control-Allow-Origin', '*');

// 	res.header(
// 		'Access-Control-Allow-Headers',
// 		'Origin, X-Requested-With, Content-Type, Accept, Authorization'
// 	);

// 	// Set to true if you need the website to include cookies in the requests sent
// 	// to the API (e.g. in case you use sessions)
// 	res.setHeader('Access-Control-Allow-Credentials', true);

// 	// Pass to next layer of middleware
// 	next();
// });

app.use((error, req, res, next) => {
	res.status(error.status || 500).json({
		error: {
			message: error.message,
		},
	});
});

module.exports = app;
