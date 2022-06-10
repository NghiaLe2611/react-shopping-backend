const Product = require('../../models/product');
const ObjectId = require('mongoose').Types.ObjectId;
const { escapeRegExp } = require('../../helpers/helpers');

class ProductsController {
	// Get featured products
	// getFeaturedProducts(req, res, next) {
	// 	Product.find({featured: true}).exec(function (err, data) {
	// 		if (err) {
	// 			res.json(err);
	// 		} else {
	// 			res.json({
	// 				results: data,
	// 			});
	// 		}
	// 	});
	// }

	// Get products & filter
	async getProducts(req, res, next) {
		// const products = await Product.find().exec();
		// res.json(products);

		// const count = await Product.countDocuments({}).exec();

		const limit = req.query.limit ? parseInt(req.query.limit) : 20;
		const offset = req.query.offset ? parseInt(req.query.offset) : 0;

		const featured = req.query.featured;
		const category = req.query.category;
		const brand = req.query.brand;
		const price = req.query.price;
		const battery = req.query.battery;
		const sort = req.query.sort;

		let query = {};

		if (price || battery) {
			query['$and'] = [];
		}

		if (featured === '1') {
			query['featured'] = true;
		}

		if (category) {
			query['category'] = category;
		}

		if (brand) {
			query['brand'] = brand.split(',');
		}

		if (price) {
			const priceArr = price.split(',');
			let prices = [];

			priceArr.forEach((val) => {
				if (val === 'duoi-2-trieu') {
					prices.push({price: {$lte: 2000000}});
				} else if (val === 'tu-2-5-trieu') {
					prices.push({price: {$gt: 2000000, $lte: 5000000}});
				} else if (val === 'tu-5-10-trieu') {
					prices.push({price: {$gt: 5000000, $lte: 10000000}});
				} else if (val === 'tu-10-20-trieu') {
					prices.push({price: {$gt: 10000000, $lte: 20000000}});
				} else if (val === 'tren-20-trieu') {
					prices.push({price: {$gt: 20000000}});
				}
			});

			if (prices.length > 0) {
                console.log(prices);
				query['$and'].push({'$or': prices});
			}

		}

		if (battery) {
			const batteryArr = battery.split(',');

			let batteries = [];
			batteryArr.forEach((val) => {
				let key = 'specs.pin';

				if (val === 'duoi-3000-mah') {
					batteries.push({
						[key]: {$lte: 3000},
					});
				} else if (val === 'tu-3000-4000-mah') {
					batteries.push({
						[key]: {$gt: 3000, $lte: 4000},
					});
				} else if (val === 'tren-4000-mah') {
					batteries.push({
						[key]: {$gt: 4000},
					});
				}
			});

			if (batteries.length > 0) {
				// query['$or'] = batteries;
				query['$and'].push({'$or': batteries})
			}
		}

		switch (sort) {
			case 'priceAscending': {
				Product.find(query)
					.sort({price: 1})
					.exec(function (err, data) {
						if (err) {
							res.json(err);
						} else {
							res.json({
								results: data,
							});
						}
					});

				break;
			}
			case 'priceDescending': {
				Product.find(query)
					.sort({price: -1})
					.exec(function (err, data) {
						if (err) {
							res.json(err);
						} else {
							res.json({
								results: data,
							});
						}
					});

				break;
			}
			default: {
				Product.find(query).exec(function (err, data) {
					if (err) {
						res.json(err);
					} else {
						res.json({
							results: data,
						});
					}
				});
			}
		}
	}

	// Search product
	searchProduct(req, res) {
		const category = req.query.category;
		let query = {};
		if (category) {
			query['category'] = category;
		}
		const limit = category ? 4 : 5;
		query['name'] = {$regex: new RegExp('.*' + escapeRegExp(req.query.name) + '.*', 'i')};

        Product.find(query)
			.limit(limit)
			.exec(function (err, data) {
				if (err) {
					res.json(err);
				} else {
					res.json({
						results: data,
					});
				}
			});
	}

	// Get product detail
	async getProductDetail(req, res, next) {
		const productId = req.params.productId;

		if (ObjectId.isValid(productId)) {
			const product = await Product.findById(productId).exec();
			res.json(product);
		} else {
			const queryName = req.params.productId.split('-').join(' ');
			let query = {};
			query['name'] = {$regex: new RegExp('^' + escapeRegExp(queryName) + '$', 'i')};
			Product.findOne(query).exec(function (err, data) {
				if (err) {
					res.json(err);
				} else {
					res.json(data);
				}
			});
		}
	}

	// Get brand list
	async getBrandList(req, res) {
		const category = req.query.category;
		const brand = await Product.find({category: category}).distinct('brand');
		res.json(brand);
	}
}

module.exports = new ProductsController();
