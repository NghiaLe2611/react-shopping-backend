require('dotenv').config();

const express = require('express');
const app = express();
const mongoPractice = require('./mongoose');
const Product = require('./models/product');
const Review = require('./models/review');
const bodyParser = require('body-parser');
const cors = require('cors')
const middleware = require('./middleware');
const authMiddleware  = require('./middleware/auth');

// const productsRoute = require('./routes/products');

// app.use(express.json());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(cors());

// app.use(middleware.decodeToken);

/*
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    if (req.method === 'OPTIONS') {
        res.header(
            'Access-Control-Allow-Methods',
            'PUT, POST, PATCH, DELETE, GET'
        );
        return res.status(200).json({});
    }
    next();

    // // Website you wish to allow to connect
    // res.setHeader('Access-Control-Allow-Origin', '*');

    // // Request methods you wish to allow
    // res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // // Request headers you wish to allow
    // res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // // Set to true if you need the website to include cookies in the requests sent
    // // to the API (e.g. in case you use sessions)
    // res.setHeader('Access-Control-Allow-Credentials', true);

    // // Pass to next layer of middleware
    // next();
});
*/

// app.use('/products', productsRoute);

// Get all products
app.get('/getProducts', mongoPractice.getFeaturedProducts);

// Get product detail
app.get('/product/:productId', mongoPractice.getProductDetail);

// Get products by category, brand, filter...
app.get('/products', mongoPractice.getProducts);

// Search product
app.get('/productSearch', mongoPractice.searchProduct);

// Compare product
app.get('/compare', mongoPractice.compareProduct);

// Get brand list
app.get('/getBrandList', mongoPractice.getBrandList);

// Get product's review
app.get('/product/:productId/reviews', mongoPractice.getReviews);

// Get user's review
app.get('/:userId/reviews', mongoPractice.getReviewsByUser);

// Post review
app.post('/submitReview/:productId', mongoPractice.submitReview);

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

// Post order
app.post('/submitOrder', mongoPractice.submitOrder);

// Get user's orders
// app.get('/orders', middleware.decodeToken, mongoPractice.getOrders);
app.get('/orders', authMiddleware, mongoPractice.getOrders);

// Search orders
app.get('/orders/search', mongoPractice.searchOrders);

// Get order detail
app.get('/order/:orderId', mongoPractice.getOrderDetail);

// Test auth
app.get('/testAuth', authMiddleware, async function(req, res, next) {
    res.json({
        message: "OK"
    })
});


app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
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