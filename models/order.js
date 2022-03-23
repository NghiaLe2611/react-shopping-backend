const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true
    },
    status: Number, // 1: Đang xử lý, 2: Đang vận chuyển, 3: Đã giao, 4: Đã huỷ
    products: Array,
    customerId: String,
    customerName: String,
    address: String,
    phone: String,
    orderDate: String,
    shippingFee: Number,
    shippingMethod: String,
    paymentMethod: mongoose.Schema.Types.Mixed,
    discount: Number,
    totalPrice: Number,
    finalPrice: Number
}, { collection : 'orders', versionKey: false });

module.exports = mongoose.model('Order', orderSchema);