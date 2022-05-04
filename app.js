const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const csrf = require('csurf');
const mongoPractice = require('./mongoose');
const bodyParser = require('body-parser');
const admin = require('./config/firebase-config');
const app = express();

const route = require('./routes');
const authMiddleware = require('./middleware/auth');
const Favorite = require('./models/favorite');
const Product = require('./models/product');
const Review = require('./models/review');

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
// app.use(attachCsrfToken('/sessionLogin', 'csrfToken', (Math.random()* 100000000000000000).toString()));

// app.get('/test', function(req, res) {
//     console.log(req.cookies);
// 	return res.json({ csrfToken: req.cookies.csrfToken });
// });

// app.all('*', function(req, res, next) {
//     console.log(111,req.cookies.session);
//     next();
// });


// app.post('/auth', csrfMiddleware, function(req, res) {
//     console.log(req.cookies);
// 	return res.json({
//         data: req.body.data
//     });
// });

app.get('/update_product', async function(req, res) {
    const products = await Product.find({}).exec();
    products.forEach(async (item) => {
        const obj = await Review.findOne({productId: item._id}).exec();

        if (obj) {
            if (obj.reviews && obj.reviews.length) {
                const totalStar = obj.reviews.map(item => item.star).reduce((prev, next) => prev + next);
                Product.updateOne({_id: item._id}, {$set: {'rating_average': Number(parseFloat(totalStar/obj.reviews.length).toFixed(1))}})
                .then(result => {
                    res.json(111);
                }).catch(err => {
                    return res.json(err);
                })
            }
        }
    })
});

app.post('/favorite', async function(req, res) {
    const productId = req.body.product_id;
    const product = await Product.findById(productId).exec();

    if (product) {
        const favoriteItem = await new Favorite(req.body);
        
        Favorite.create(favoriteItem)
            .then(function(result) {
                return res.json({
                    success: true
                });
            })
            .catch(function(err) {
                console.log(err);
                return res.json({
                    success: false
                });
            });
    } else {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }
   
});

app.delete('/favorite', async function(req, res) {
    const productId = req.body.product_id;
    const uuid = req.body.uuid;
    const data = await Favorite.findOne({ 
        uuid: uuid, product_id: productId
    }).exec();
    
    if (data) {
        Favorite.findOne({ 
            uuid: uuid, product_id: productId
        }).deleteOne().then(result => {
            return res.json({
                success: true
            });
        }).catch(err => {
            return res.json(err);
        })
    } else {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }
});

// Routes
route(app);
// app.use('/api/v1/products', productsRoute);
// app.use('/api/v1/reviews', reviewsRoute);
// app.use('/api/v1/me', usersRoute);


// Login
app.post('/sessionLogin', async function(req, res) {
	const idToken = req.body.idToken;
	const expiresIn = 60 * 60 * 24 * 1000; //24h in milliseconds

	admin.auth()
		.createSessionCookie(idToken.toString(), {expiresIn})
		.then((sessionCookie) => {
			const options = {
                maxAge: expiresIn,
                httpOnly: false,
                secure: false,
                path: '/',
                sameSite: 'strict'
            };
			res.cookie('session', sessionCookie, options);
            res.cookie('csrfToken', authMiddleware.generateCsrfToken(sessionCookie), options);
			return res.status(200).json({status: 'success'});
			// res.end(JSON.stringify({ status: 'success' }));
		},
		(err) => {
			return res.status(401).json({
				error: err,
				message: 'Unauthorized request'
			});
		}
	);
});
// Source: https://github.com/firebase/quickstart-nodejs/blob/b2fcc5c36e1194dad3aeb4f176016deb281ca8a4/auth-sessions/app.js#L145

// Logout
app.post('/sessionLogout', async function (req, res) {
	const sessionCookie = req.cookies.session || '';
    // console.log('log out', sessionCookie);

    res.clearCookie('session');
    res.clearCookie('csrfToken');
	res.clearCookie('idToken');

    if (sessionCookie) {
		admin.auth()
			.verifySessionCookie(sessionCookie, true)
			.then(function (decodedClaims) {
                // console.log('decodedClaims', decodedClaims);
				return admin.auth().revokeRefreshTokens(decodedClaims.sub);
			})
			.then(() => {
                return res.status(200).json({
                    success: true
                });
			})
			.catch((err) => {
                return res.status(401).json({
                    error: err,
                    message: 'Unauthorized'
                });
			});
	} else {
		return res.status(401).json({
            message: 'Unauthorized'
        });
	}
});

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

app.set('trust proxy', 1); // Heroku
app.use((error, req, res) => {
	res.status(error.status || 500);
	res.json({
		error: {
			message: error.message,
		},
	});
});

module.exports = app;