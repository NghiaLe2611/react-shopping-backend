const Review = require('../../models/review');
const Product = require('../../models/product');

class ReviewsController {
	// Get reviews by product_id
	async getReviews(req, res, next) {
		const productId = req.query['product_id'];
		if (!productId) {
			return res.status(404).json({
				success: false,
				message: 'product_id not found',
			});
		}

		const listReview = await Review.aggregate([{$match: {productId: productId}}, {$unwind: '$reviews'}]).exec();
		const totalStar = listReview.reduce((n, {reviews}) => n + reviews.star, 0);

		const amount1Point = listReview.filter((val) => val.reviews.star === 1).length;
		const amount2Point = listReview.filter((val) => val.reviews.star === 2).length;
		const amount3Point = listReview.filter((val) => val.reviews.star === 3).length;
		const amount4Point = listReview.filter((val) => val.reviews.star === 4).length;
		const amount5Point = listReview.filter((val) => val.reviews.star === 5).length;

		let query = [];
		query.push(
			{$match: {productId: productId}},
			{$unwind: '$reviews'},
			{
				$group: {
					_id: '$reviews._id',
					userId: {$first: '$reviews.userId'},
					customerName: {$first: '$reviews.customerName'},
					star: {$first: '$reviews.star'},
					comment: {$first: '$reviews.comment'},
					images: {$first: '$reviews.images'},
					createdAt: {$first: '$reviews.createdAt'},
				},
			},
			{
				$sort: {createdAt: -1},
			}
		);

		if (req.query.page) {
			const limit = 5;
			const page = parseInt(req.query.page, 10) || 1;
			const startIndex = (page - 1) * limit;
			query.push({
				$skip: startIndex,
			});
			query.push({
				$limit: limit,
			});
		}

		const reviewsResult = await Review.aggregate(query).exec();

		if (listReview.length) {
			res.json({
				reviews_count: listReview.length,
				rating_average: Number(parseFloat(totalStar / listReview.length).toFixed(1)),
				stars: {
					1: {
						count: amount1Point,
						percent: parseFloat((amount1Point / listReview.length) * 100).toFixed(0),
					},
					2: {
						count: amount2Point,
						percent: parseFloat((amount2Point / listReview.length) * 100).toFixed(0),
					},
					3: {
						count: amount3Point,
						percent: parseFloat((amount3Point / listReview.length) * 100).toFixed(0),
					},
					4: {
						count: amount4Point,
						percent: parseFloat((amount4Point / listReview.length) * 100).toFixed(0),
					},
					5: {
						count: amount5Point,
						percent: parseFloat((amount5Point / listReview.length) * 100).toFixed(0),
					},
				},
				pointPercent: [
					parseFloat((amount5Point / listReview.length) * 100).toFixed(0),
					parseFloat((amount4Point / listReview.length) * 100).toFixed(0),
					parseFloat((amount3Point / listReview.length) * 100).toFixed(0),
					parseFloat((amount2Point / listReview.length) * 100).toFixed(0),
					parseFloat((amount1Point / listReview.length) * 100).toFixed(0),
				],
				reviews: reviewsResult,
			});
		} else {
			res.json({
				count: 0,
				reviews: [],
			});
		}
	}

    // Submit review
    async submitReview(req, res, next) {
        const productId = req.params.productId;
        const product = await Product.findById(productId).exec();

        const reviewData = {
            userId: req.body.userId ? req.body.userId : null,
            customerName: req.body.customerName,
            star: req.body.star,
            comment: req.body.comment,
            createdAt: req.body.createdAt ? req.body.createdAt : Date.now(),
        };

        if (req.body.customerName && req.body.star && req.body.comment) {
            // create new object or update existing object
            const query = Review.updateOne(
                { productId: productId },
                { 
                    $set: { 
                        'product_name': product.name,
                        'product_category': product.category,
                        'thumbnail_url': product.img
                    },
                    $push: { reviews: reviewData }
                }, 
                { upsert: true }
            );
            query.then(async function(data) {
                return res.json({
                    message: true
                });
            })
            .catch(function(err) {
                return res.json(err);
            });
        } else {
            res.json({
                error: {
                    message: 'Error'
                },
            });
        }
    }
}

module.exports = new ReviewsController();
