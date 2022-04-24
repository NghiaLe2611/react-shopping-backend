const User = require('../../models/user');
const Review = require('../../models/review');

class UsersController {
    // Get reviews of user
    async getUserReviews(req, res, next) {
        const userId = req.query.id;

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

    async updateUserData(req, res, next) {
        const userId = req.params.userId;
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
        }

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

module.exports = new UsersController();