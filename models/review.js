// const mongoose = require('mongoose');

// const reviewSchema = mongoose.Schema({
//     _id: mongoose.Schema.Types.ObjectId,
//     productId: String,
//     customerName: String,
//     star: Number,
//     comment: String
// }, { collection : 'reviews' });

// module.exports = mongoose.model('review', reviewSchema);

const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    productId: String,
    reviews: [
        {
            userId: String,
            customerName: String,
            star: Number,
            comment: String,
            images: Array,
            createdAt: String
        }
    ]
}, { collection : 'reviews', versionKey: false });

module.exports = mongoose.model('Review', reviewSchema);