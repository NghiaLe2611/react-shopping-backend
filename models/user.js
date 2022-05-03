const mongoose = require('mongoose');

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
		addresses: [{
			name: String,
			phone: String,
			city: Object,
			district: Object,
			ward: Object,
			address: String,
			default: Boolean
		}],
        recently_viewed_products: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        }],
        intended_cart: [],
        // favorite: [],
	},
	{ collection: 'users', versionKey: false }
);

module.exports = mongoose.model('User', userSchema);
