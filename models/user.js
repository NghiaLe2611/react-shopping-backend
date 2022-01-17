const Review = require('./review');
const Product = require('./product');

const userSchema = mongoose.Schema(
    {
		_id: mongoose.Schema.Types.ObjectId,
		uuid: String,
		fullName: String,
		displayName: String,
		phone: String,
		email: String,
		birthday: Date,
		photoURL: String,
		emailVerified: Boolean,
		reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
		favorite: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
		// reviews: [Review]
	},
	{ collection: 'users', versionKey: false }
);

module.exports = mongoose.model('User', userSchema);
