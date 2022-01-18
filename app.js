require('dotenv').config();

const express = require('express');
const app = express();
const mongoPractice = require('./mongoose');
const Product = require('./models/product');
const Review = require('./models/review');

const bodyParser = require('body-parser');

// const productsRoute = require('./routes/products');

// app.use(express.json());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

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
});

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