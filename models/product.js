const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    category: String,
    parent: String,
    brand: String,
    name: String,
    price: Number,
    img: String,
    featureImgs: Array,
    variations: Object,
    specs: Object,
    sale: Number,
    featured: Boolean,
    released: String,
    description: String,
    rating_average: {
        type: Number, default: 0
    },
    review_count: {
        type: Number, default: 0
    },
    favorite_count: {
        type: Number, default: 0
    }
}, { collection : 'products', versionKey: false });

module.exports = mongoose.model('Product', productSchema);