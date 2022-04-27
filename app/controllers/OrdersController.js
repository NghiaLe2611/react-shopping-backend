const mongoose = require('mongoose');
const Order = require('../../models/order');
const User = require('../../models/user');
const { escapeRegExp, isEmpty } = require('../../helpers/helpers');
const ObjectId = mongoose.Types.ObjectId;

class OrdersController {
    // Get user's orders
    async getOrders(req, res, next) {
        const status = req.query.status;
        let offset = 0;
        let query = {};

        if (status) {
            query['status'] = parseInt(status);
        }

        if (req.query.page) {
            const limit = 5;
            const page = parseInt(req.query.page, 10) || 1;
            offset = (page - 1) * limit;
        }

        if (req.user) {
            const userId = req.user.uid;
            const userExists = await User.findOne({ uuid: userId }).exec();
            if (userExists) {
                query['customerId'] = userId;
                const orders = await Order.find({ customerId: userId }).exec();
                Order.find(query)
                    .skip(offset)
                    .limit(5)
                    .sort({ orderDate: -1 })
                    .exec(function(err, data) {
                        if (err) {
                            res.json(err);
                        } else {
                            res.json({
                                count: !status ? orders.length : data.length,
                                results: data,
                            });
                        }
                    });
            } else {
                res.json({
                    error: {
                        message: 'User does not exist',
                    },
                });
            }
        }
        // else {
        //     res.json({
        //         error: {
        //             message: 'You are not authorized'
        //         }
        //     });
        // }
    }

    // Get order (tracking)
    async trackingOrder(req, res, next) {
        const orderId = req.params.orderId;
        if (ObjectId.isValid(orderId)) {
			const data = await Order.findById(orderId).exec();
			res.json({
                result: data
            });
		} else {
			res.json({
                result: null
            });
		}
    }

    // Get order detail
    async getOrderDetail(req, res, next) {
        const orderId = req.params.orderId;

        let query = {};

        if (req.user) {
            if (orderId) {
                const userId = req.user.uid;
                const userExists = await User.findOne({ uuid: userId }).exec();
                if (userExists) {
                    query['_id'] = new ObjectId(orderId);
                    Order.findOne(query).exec(function(err, data) {
                        if (err) {
                            res.json(err);
                        } else {
                            res.json(data);
                        }
                    });
                } else {
                    res.json({
                        error: {
                            message: 'User doesn not exist',
                        },
                    });
                }
            } else {
                res.json({
                    error: {
                        message: 'OrderId not found',
                    },
                });
            }
        } else {
            res.json({
                error: {
                    message: 'Authorized failed',
                },
            });
        }
    }

    // Search orders
    async searchOrders(req, res, next) {
        const status = req.query.status;
        const text = req.query.text;

        let query = {};

        if (status) {
            query['status'] = parseInt(status);
        }

        if (req.user) {
            const userId = req.user.uid;
            const userExists = await User.findOne({ uuid: userId }).exec();
            if (userExists) {
                query['customerId'] = userId;

                const keyword = { $regex: new RegExp('.*' + escapeRegExp(text) + '.*', 'i') };

                if (ObjectId.isValid(text)) {
                    query['_id'] = new ObjectId(text);

                    Order.find(query).exec(function(err, data) {
                        if (err) {
                            res.json(err);
                        } else {
                            res.json({
                                results: data,
                                count: data.length
                            });
                        }
                    });
                } else {
                    query['products'] = { $elemMatch: { name: keyword } };
                    Order.find(query).exec(function(err, data) {
                        if (err) {
                            res.json(err);
                        } else {
                            res.json({
                                results: data,
                                count: data.length
                            });
                        }
                    });
                }
            } else {
                res.json({
                    error: {
                        message: 'User doesn not exist'
                    }
                });
            }
        } else {
            res.json({
                error: {
                    message: 'Authorized failed'
                }
            });
        }
    }

    // Submit order
    async submitOrder(req, res, next) {
        const {
            products,
            customerId,
            customerName,
            address,
            phone,
            orderDate,
            shippingFee,
            shippingMethod,
            paymentMethod,
            discount,
            totalPrice,
            finalPrice,
        } = req.body;

        const orderData = await new Order({
            products,
            customerId,
            customerName,
            address,
            phone,
            orderDate,
            shippingFee,
            shippingMethod,
            paymentMethod,
            discount,
            totalPrice,
            finalPrice,
            status: 1
        });

        if (isEmpty(orderData)) {
            return res.json({
                message: false
            });
        } else {
            // const updatedOrderData = {...orderData, status: 1};
            Order.create(orderData)
                .then(async function(result) {
                    return res.json({
                        message: true,
                        orderId: result._id.toString()
                    });
                })
                .catch(function() {
                    return res.json({
                        message: false
                    });
                });
        }
    }
}

module.exports = new OrdersController();