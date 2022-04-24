const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");
// const csrf = require('csurf');
const mongoPractice = require('./mongoose');
const bodyParser = require('body-parser');
const authMiddleware = require('./middleware/auth');
const admin = require('./config/firebase-config');
const app = express();

const route = require('./routes');


// const productsRoute = require('./routes/products');
// const reviewsRoute = require('./routes/reviews');
// const usersRoute = require('./routes/users');

// Connect to db
// const db = require('./config/db');
// db.connect();


// const csrfMiddleware = csrf({ cookie: true });
require('dotenv').config();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// app.use(csrfMiddleware);

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


// function attachCsrfToken(url, cookie, value) {
// 	return function (req, res, next) {
// 		if (req.url == url) {
// 			res.cookie(cookie, value);
// 		}
// 		next();
// 	};
// }

// Routes
route(app);
// app.use('/api/v1/products', productsRoute);
// app.use('/api/v1/reviews', reviewsRoute);
// app.use('/api/v1/me', usersRoute);

// Login
app.post('/sessionLogin', async function(req, res, next) {
    const token = req.body.token.toString();
    const expiresIn = 60 * 60 * 24 * 1000; //24h in milliseconds

    admin.auth().createSessionCookie(token, { expiresIn })
        .then((sessionCookie) => {
                const options = { maxAge: expiresIn, httpOnly: true };
                res.cookie('session', sessionCookie, options);
                res.end(JSON.stringify({ status: 'success' }));
            },
            (error) => {
                res.status(401).send('Unauthorized request!');
            }
        );
});

// Logout
app.get('/sessionLogout', (req, res) => {
    res.clearCookie('session');
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