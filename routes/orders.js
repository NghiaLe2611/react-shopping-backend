const router = require('express').Router();
const ordersController = require('../app/controllers/OrdersController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware.verifyUser, ordersController.getOrders);
router.get('/search', authMiddleware.verifyUser, ordersController.searchOrders);
router.get('/:orderId', authMiddleware.verifyUser, ordersController.getOrderDetail);
router.post('/', ordersController.submitOrder);

module.exports = router;