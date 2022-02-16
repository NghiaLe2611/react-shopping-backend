const mongoose = require('mongoose');

const Review = require('./review');
const Product = require('./product');

const userSchema = mongoose.Schema(
    {
		_id: {
			type: mongoose.Schema.Types.ObjectId,
			auto: true
		},
		uuid: String,
		fullName: String,
		displayName: String,
		phone: String,
		email: String,
		birthday: Date,
		photoURL: String,
		emailVerified: Boolean,
		listAddress: [{
			name: String,
			phone: String,
			city: Object,
			district: Object,
			ward: Object,
			address: String,
			default: Boolean
		}],
		favorite: [],
		// reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }]
		// reviews: [Review]
	},
	{ collection: 'users', versionKey: false }
);

module.exports = mongoose.model('User', userSchema);
