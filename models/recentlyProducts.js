const mongoose = require('mongoose');
// const product = require('./product');

const RecentlyProducts = mongoose.Schema({
    userId: String,
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
    }]
}, { collection : 'recently_products', versionKey: false });

module.exports = mongoose.model('RecentlyProducts', RecentlyProducts);