const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const User = require('../../models/user');
const Review = require('../../models/review');
const Product = require('../../models/product');

class UsersController {
    // Submit new user data
    async submitUserData(req, res, next) {
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
    }
    
    // Get user data
    async getUserData(req, res, next) {
        if (req.user) {
            const userId = req.user.uid;
            const data = await User.aggregate([
                { $match: { uuid: userId } },
                { $unwind: '$listAddress' },
                {
                    $sort: { 'listAddress.default': -1 }
                },
                // { $set: { reviews: reviews } },
                {
                    $group: {
                        _id: '$_id',
                        detail: { $first: '$$ROOT' },
                        listAddress: { $push: '$listAddress' }
                    },
                },
                {
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: [
                                '$detail', { listAddress: '$listAddress' }
                            ],
                        },
                    },
                },
            ]).exec();
        
            if (data) {
                res.json(data[0]);
            } else {
                res.json({
                    error: {
                        message: 'Error',
                    },
                });
            }
        } else {
            res.json({
                error: {
                    message: 'You are not authorized'
                }
            });
        }
    };

    // Update user data
    async updateUserData(req, res, next) {
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
                    listAddress: {
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
    
            // Recently viewed products
            const currentProduct = data.recentlyProduct;
            if (currentProduct) {
                const currentUser = await User.findOne({ uuid: userId }).exec();
                let recentlyProducts = currentUser.recentlyViewedProducts;
                const existingProductId = recentlyProducts?.findIndex(item => {
                    return item._id === currentProduct._id;
                });
    
                if (existingProductId < 0) {
                    // If length < 10 add to the beginning if not remove the last and and to the beginning
                    if (recentlyProducts.length < 10) {
                        recentlyProducts.unshift(currentProduct);
                    } else {
                        recentlyProducts.splice(-1);
                        recentlyProducts.unshift(currentProduct);
                    }
                } else {
                    // If length = 1 and product existed do nothing else move to the beginning (remove and add to the beginning)
                    if (recentlyProducts.length !== 1) {
                        recentlyProducts.splice(existingProductId, 1);
                        recentlyProducts.unshift(currentProduct);
                    }
                    // if (recentlyProducts.length === 1) {
                    //     return;
                    // } else {
                    //     recentlyProducts.splice(existingProductId, 1);
                    //     recentlyProducts.unshift(product);
                    // }
                }
    
                pipeline['$set'] = {
                    recentlyViewedProducts: recentlyProducts
                }
            }
    
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
    }

    // Get reviews of user
    async getUserReviews(req, res, next) {
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
                results: data,
            });
        }
    }

    // Add to wishlist
    async addToWishlist(req, res, next) {
        if (req.user) {
            const userId = req.user.uid;
            const productId = req.params.productId;
            const product = await Product.findById(productId).exec();
        
            const listReview = await Review.aggregate([{ $match: { productId: productId } }, { $unwind: '$reviews' }]).exec();
            const totalStar = listReview.reduce((n, {reviews}) => n + reviews.star, 0);
        
            let pipeline = {};
            const type = req.body.type;

            if (product) {
                if (type === 1) {
                    pipeline['$push'] = {
                        favorite: {
                           _id: productId,
                           name: product.name,
                           category: product.category,
                           price: product.price,
                           sale: product.sale,
                           img: product.img,
                           totalReviews: listReview.length,
                           averagePoint: Number(parseFloat(totalStar/listReview.length).toFixed(1))
                        },
                    };
                } else if (type === 0) {
                    pipeline['$pull'] = {
                        // favorite: { _id: mongoose.Types.ObjectId(productId) }
                        favorite: { _id: productId }
                    };
                }
            }
        
            if (Object.keys(pipeline).length) {
                const query = User.updateOne({ uuid: userId }, pipeline);
                // { upsert: type === 1 ? true : false }
                query.then(async function() {
                    const userData = await User.findOne({ uuid: userId }).exec();
        
                    return res.json({
                        message: true,
                        favorite: userData.favorite
                    });
                })
                .catch(function(err) {
                    // console.log(err);
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
    }

    // Update user address
    async updateAddress(req, res, next) {
        if (req.user) {
			const userId = req.user.uid;
			const addressId = req.params.addressId;
			const updatedAddressData = req.body.updatedAddress;

			let bulkOps = [];
			let update = {$set: {}},
				updateForMany = {$set: {}},
			    arrayFilters = [];

			// Remove address
			if (req.body.removeAddressId) {
				const query = User.updateOne(
					{uuid: userId},
					{
						$pull: {listAddress: {_id: addressId}},
					}
				);
				query
					.then(async function () {
						return res.json({
							message: true,
							addressId: addressId,
						});
					})
					.catch(function (err) {
						console.log(err);
						return res.json({
							error: {
								message: 'Error',
							},
						});
					});

				return;
			}

			if (updatedAddressData) {
				Object.keys(updatedAddressData).forEach(function (key) {
					update['$set']['listAddress.$[element].' + key] = updatedAddressData[key];
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
							updateForMany['$set']['listAddress.$[element].default'] = false;
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
						message: 'Error',
					},
				});
			}
		}
    }
}

module.exports = new UsersController();