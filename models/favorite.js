const mongoose = require('mongoose');

const favoriteSchema = mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId, auto: true
    },
    uuid: {
        type: String,
        ref: 'User'
    },
    data: [
        {
            product_id: String,
            category: String,
            img: String,
            name: String,
            price: Number,
            sale: Number,
            rating_average: Number,
            review_count: Number,
            favorite_count: Number
        }
    ]
}, { collection: 'favorites', versionKey: false });

module.exports = mongoose.model('favorite', favoriteSchema);