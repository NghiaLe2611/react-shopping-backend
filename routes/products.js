const express = require('express');
const router = express.Router();
const mongoPractice = require('../mongoose');

// Get all
router.get('/', mongoPractice.getProducts);

// Get detail
router.get('/:productId', mongoPractice.getProductDetail);

module.exports = router;
