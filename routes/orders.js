const router = require('express').Router();
const ordersController = require('../app/controllers/OrdersController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, ordersController.getOrders);
router.get('/search', authMiddleware, ordersController.searchOrders);
router.get('/:orderId', authMiddleware, ordersController.getOrderDetail);
router.post('/', ordersController.submitOrder);

module.exports = router;