const express = require('express');
const router = express.Router();
const mongoPractice = require('../mongoose');

// Get all
router.get('/featuredProducts', mongoPractice.getFeaturedProducts);

// Get product detail
router.get('/:productId', mongoPractice.getProductDetail);

// Get products by category, brand, filter...
app.get('/', mongoPractice.getProducts);

module.exports = router;
