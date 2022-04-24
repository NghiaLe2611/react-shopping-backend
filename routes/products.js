const router = require('express').Router();
const productsController = require('../app/controllers/ProductsController');

// router.get('/featuredProducts', productsController.getFeaturedProducts);
router.get('/search', productsController.searchProduct);
router.get('/brand_list', productsController.getBrandList);
router.get('/:productId', productsController.getProductDetail);
router.get('/compare', productsController.compareProduct);
router.get('/', productsController.getProducts);

module.exports = router;
