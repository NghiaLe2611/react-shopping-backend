const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const User = require('../../models/user');
const Review = require('../../models/review');
const Product = require('../../models/product');
const Favorite = require('../../models/favorite');

const UsersController = {
	// Submit new user data
	submitUserData: async(req, res) => {
		const data = req.body;
		const userData = new User({
			uuid: data.uuid ? data.uuid : null,
			fullName: data.fullName ? data.fullName : null,
			displayName: data.displayName ? data.displayName : null,
			phone: data.phone ? data.phone : null,
			email: data.email ? data.email : null,
			birthday: data.birthday ? data.birthday : null,
			photoURL: data.photoURL ? data.photoURL : null,
			emailVerified: data.emailVerified ? data.emailVerified : false,
		});

		if (req.body.uuid) {
			User.create(userData)
				.then(async function() {
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
					message: 'Error',
				},
			});
		}
	},
	
	// Get user data
	getUserData: async(req, res) => {
		if (req.user) {
			const userId = req.user.uid;
			const data = await User.aggregate([
				{ $match: { uuid: userId } },
                { $project : {
                    favorite: 0,
                    intended_cart: 0,
                    // addresses: 0,
                    recently_viewed_products: 0
                }}

				// { $unwind: '$listAddress' },
				// {
				// 	$sort: { 'listAddress.default': -1 }
				// },
				// { $set: { reviews: reviews } },
				// {
				// 	$group: {
				// 		_id: '$_id',
				// 		detail: { $first: '$$ROOT' },
				// 		listAddress: { $push: '$listAddress' }
				// 	},
				// },
				// {
				// 	$replaceRoot: {
				// 		newRoot: {
				// 			$mergeObjects: [
				// 				'$detail', { listAddress: '$listAddress' }
				// 			],
				// 		},
				// 	},
				// },
			]).exec();
		
			if (data) {
				res.json(data[0]);
			} else {
				return res.status(404).json({
					error: {
						message: 'Error',
					},
				});
			}
		} else {
			return res.status(401).res.json({
				error: {
					message: 'You are not authorized'
				}
			});
		}
	},

	// Update user data
	updateUserData: async(req, res) => {
		if (req.user) {
			const userId = req.user.uid;
			const data = req.body;
			let updatedData = {};
			let pipeline = {};
	
			const { fullName, displayName, photoURL, phone, birthday } = data;
			if (fullName) {
				updatedData = {...updatedData, fullName: fullName };
			}
			if (displayName) {
				updatedData = {...updatedData, displayName: displayName };
			}
			if (photoURL) {
				updatedData = {...updatedData, photoURL: photoURL };
			}
			if (phone) {
				updatedData = {...updatedData, phone: phone };
			}
			if (birthday) {
				updatedData = {...updatedData, birthday: birthday };
			}
	
			// Profile info
			if (Object.keys(updatedData).length) {
				pipeline['$set'] = updatedData;
			}
	
			// New address
			const newAddress = data.newAddress;
	
			if (newAddress && Object.keys(newAddress).length) {
				pipeline['$push'] = {
					addresses: {
						name: newAddress.name,
						phone: newAddress.phone,
						city: newAddress.city,
						district: newAddress.district ? newAddress.district : '',
						ward: newAddress.ward ? newAddress.ward : '',
						address: newAddress.address,
						default: newAddress.default,
					},
				};
			};
	
			if (Object.keys(pipeline).length) {
				const query = User.updateOne({ uuid: userId }, pipeline, { upsert: true });
				query.then(async function() {
						return res.json({
							message: true,
						});
					})
					.catch(function(err) {
						return res.json({
							error: {
								message: 'Error',
							},
						});
					});
			} else {
				res.json({
					error: {
						message: 'Error',
					},
				});
			}
		}
	},

    // Add recently viewed product
    addRecentlyViewedProduct: async(req, res) => {
        const userId = req.user.uid;
        const recentlyProductId = req.body.product_id;
        
        // Recently viewed products
        if (ObjectId.isValid(recentlyProductId)) {
			const currentUser = await User.findOne({ uuid: userId }).exec();
			let recentlyProducts = currentUser.recently_viewed_products ? currentUser.recently_viewed_products : [];
			const existingProductId = recentlyProducts.findIndex(itemId => {
				return itemId.toString() === recentlyProductId.toString();
			});

			if (existingProductId < 0) {
				// If length < 10 add to the beginning if not remove the last and and to the beginning
				if (recentlyProducts.length < 10) {
					recentlyProducts.unshift(recentlyProductId);
				} else {
					recentlyProducts.splice(-1);
					recentlyProducts.unshift(recentlyProductId);
				}
			} else {
				// If length = 1 and product existed do nothing else move to the beginning (remove and add to the beginning)
				if (recentlyProducts.length !== 1) {
					recentlyProducts.splice(existingProductId, 1);
					recentlyProducts.unshift(recentlyProductId);
				}
			}

            User.updateOne({ uuid: userId },
                { $set: { recently_viewed_products: recentlyProducts } },
                { upsert: true }
            ).then(async function() {
                return res.json({
                    success: true,
                });
            })
            .catch(function(err) {
                return res.json({
                    error: {
                        error: err,
                        success: false,
                    },
                });
            });
		}
    },

    // Get recently viewed products
    getRecentlyViewedProducts: async(req, res) => {  
        User.findOne({uuid: req.user.uid})
			.populate({
				path: 'recently_viewed_products',
				select: {
					_id: 1,
					name: 1,
					category: 1,
					price: 1,
					sale: 1,
					img: 1,
					rating_average: 4.1,
					review_count: 8,
					favorite_count: 1
				},
			})
			.then(data => {
				res.status(200).json(data.recently_viewed_products);
			})
			.catch(err => {
				return res.json({
                    error: {
                        error: err,
                        success: false,
                    },
                });
			});


        // Using lookup
    
        // const data = await User.aggregate([
		// 	{
		// 		$lookup: {
		// 			from: 'products',
		// 			localField: 'recentlyViewedProducts.product_id',
		// 			foreignField: '_id',
		// 			as: 'products',
		// 		},
		// 	},
		// 	// {
		// 	// 	$unwind: '$products',
		// 	// },
		// 	{
		// 		$project: {
        //             _id: 0,
		// 			'products.name': 1,
        //             'products.price': 1,
        //             'products.category': 1,
		// 		},
		// 	},
		// ]);
    },

	// Get reviews of user
	getUserReviews: async(req, res) => {
		if (req.user) {
			const userId = req.user.uid;
			let query = [];
			query.push({ $unwind: '$reviews' }, { $match: { 'reviews.userId': userId } }, {
				$group: {
					_id: '$reviews._id',
					userId: { $first: '$reviews.userId' },
					productId: { $first: '$productId' },
					product_name: { $first: '$product_name' },
					product_category: { $first: '$product_category' },
					thumbnail_url: { $first: '$thumbnail_url' },
					star: { $first: '$reviews.star' },
					comment: { $first: '$reviews.comment' },
					images: { $first: '$reviews.images' },
					createdAt: { $first: '$reviews.createdAt' },
				},
			}, { $sort: { createdAt: -1 } });
	
			const totalReviews = await Review.aggregate(query).exec();
	
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
	
			const data = await Review.aggregate(query).exec();
	
			res.json({
				count: totalReviews.length,
				results: data
			});
		}
	},

	// Check product is liked
	checkProductLiked: async(req, res) => {
		const productId = req.params.productId;

		if (ObjectId.isValid(productId)) {
			const product = await Favorite.findOne({
				'uuid': req.user.uid,
				'data.product_id': productId,
			}).exec();
	
			if (product) {
				return res.status(200).json({
					liked: true,
					product_id: productId
				});
			} else {
				return res.json({
					liked: false,
					product_id: productId
				});
			}
		} else {
			res.status(400).json({
				message: 'Product not found'
			});
		}
	},

	// Add to wishlist
	addToWishlist: async(req, res) => {
		if (req.user) {
			const userId = req.user.uid;
			const productId = req.params.productId;
			const product = await Product.findById(productId).exec();
		
            const favOfUser = await Favorite.findOne({uuid: userId}).exec();
			// const listReview = await Review.aggregate([{ $match: { productId: productId } }, { $unwind: '$reviews' }]).exec();
            // const totalStar = listReview.reduce((n, {reviews}) => n + reviews.star, 0);
			// const favoriteItem = favOfUser?.data.filter(item => item['product_id'] === productId);

			if (product) {
                Product.findOneAndUpdate(
                    {_id: productId},
                    {$inc: {favorite_count: 1}}
                ).then(result => {
                    const data = {
                        product_id: result._id,
                        category: result.category,
                        img: result.img,
                        name: result.name,
                        price: result.price,
                        sale: result.sale,
                        rating_average: result.rating_average,
                        review_count: result.review_count,
                        favorite_count: result.favorite_count + 1,
                    };

                    if (!favOfUser) {
                        // If user's fav item not exist => create new

                        let newFavoriteItem = {
                            uuid: userId,
                            data: [data],
                        };

                        Favorite.create(newFavoriteItem)
                            .then(() => {
                                res.json({
                                    success: true,
                                    status: 1
                                });
                            })
                            .catch((err) => {
                                return res.json({
                                    success: false,
                                    message: err,
                                });
                            });
                    } else {
                        // Update user's fav list
                        Favorite.updateOne(
                            {uuid: userId},
                            {
                                $push: {
                                    data: data,
                                },
                            }
                        ).then(() => {
                            res.json({
                                success: true,
                                status: 1
                            });
                        })
                        .catch((err) => {
                            return res.json({
                                success: false,
                                message: err,
                            });
                        });
                    }  
                }).catch(err => {
                    res.status(404).json(err);
                });
			} else {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
		}
	},

    // Remove from wishlist
    removeFromWishlist: async(req, res) => {
        const userId = req.user.uid;
		const productId = req.params.productId;

        Product.findOneAndUpdate(
            {_id: productId},
            {$inc: {favorite_count: -1}}
        ).then(() => {
            Favorite.updateOne(
                {uuid: userId},
                {$pull: {data: {'product_id': productId}}}
            ).then(() => {
                res.json({
                    success: true,
                    status: 0
                });
            })
            .catch((err) => {
                return res.json({
                    success: false,
                    message: err
                });
            });
        }).catch(err => {
            return res.json({
                success: false,
                message: err
            });
        });
    },

    // Get wishlist
	getWishlist: async(req, res) => {
		const data = await Favorite.findOne(
            {uuid: req.user.uid}).exec();

		if (data) {
			res.status(200).json(data.data);
		} else {
			res.status(404).json({
				message: 'error'
			})
		}
	},

	// Get all address
	getAddresses: async(req, res) => {
        User.findOne({uuid: req.user.uid}).select({addresses: 1, _id: 0})
            .then(data => {
                res.json(data.addresses);
            }).catch(err => {
                return res.status(404).json({
                    message: err
                });
            });
	},

	// Update user address
	updateAddress: async(req, res) => {
		if (req.user) {
			const userId = req.user.uid;
			const addressId = req.params.addressId;
			const updatedAddressData = req.body.updatedAddress;

			let bulkOps = [];
			let update = {$set: {}},
				updateForMany = {$set: {}},
				arrayFilters = [];

			// Remove address
			if (req.body.address_id) {
				User.updateOne(
					{uuid: userId},
					{$pull: {addresses: {_id: addressId}}}
				).then(async function () {
                    return res.json({
                        success: true,
                        addressId: addressId,
                    });
                })
                .catch(function (err) {
                    return res.json({
                        success: false,
                        message: err
                    });
                });

				return;
			}

			if (updatedAddressData) {
				Object.keys(updatedAddressData).forEach(function (key) {
					update['$set']['addresses.$[element].' + key] = updatedAddressData[key];
				});

				arrayFilters.push({'element._id': addressId});

				bulkOps.push({
					updateOne: {
						filter: {uuid: userId},
						update: update,
						arrayFilters: [{'element._id': ObjectId(addressId)}],
					},
				});

				if (updatedAddressData.default === true) {
					Object.keys(updatedAddressData).forEach(function (key) {
						if (key === 'default') {
							updateForMany['$set']['addresses.$[element].default'] = false;
						}
					});

					bulkOps.push({
						updateMany: {
							filter: {uuid: userId},
							update: {$set: {'listAddress.$[element].default': false}},
							arrayFilters: [{'element._id': {$ne: mongoose.Types.ObjectId(addressId)}}],

							// 'filter': { 'listAddress._id': { $ne: addressId } },
							// 'update': updateForMany,
							// 'arrayFilters': [ { uuid: userId } ]

							// { 'element.default': { default: true } }
						},
					});
				}
			}

			if (bulkOps.length) {
				User.bulkWrite(bulkOps)
					.then((result) => {
						return res.json({
							message: true,
						});
					})
					.catch((err) => {
						return res.json({
							error: {
								message: 'Error',
							},
						});
					});
			} else {
				return res.json({
					error: {
						message: 'Error'
					}
				});
			}
		}
	},

    // Get user cart
    getIntendedCart: async(req, res) => {
        User.findOne({uuid: req.user.uid}).select({intended_cart: 1, _id: 0})
            .then(data => {
                res.json(data.intended_cart);
            }).catch(err => {
                return res.status(404).json({
                    message: err
                });
            });
    },

    // Update cart
    updateCart: async(req, res) => {
        const userId = req.user.uid;
        User.updateOne({ uuid: userId },
            { $set: { intended_cart: req.body.intended_cart }},
            { upsert: true }
        ).then(async function() {
            return res.json({
                success: true,
            });
        })
        .catch(function(err) {
            return res.json({
                error: {
                    error: err,
                    success: false
                },
            });
        });
    },
}

// module.exports = new UsersController();
module.exports = UsersController;


/*  
	$unwind: được dùng để phân tách giá trị của một array field trong các input document. 
	Nếu như array field của một input document có N phần tử thì trong output sẽ có N document.
*/

/*
	upsert: default is false, if true: If match query, update else create new
*/