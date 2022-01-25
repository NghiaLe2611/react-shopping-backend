const mongoose = require('mongoose');

const provinceSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    id: Number,
    districts: Array
}, { collection: 'provinces', versionKey: false });

module.exports = mongoose.model('Province', provinceSchema);