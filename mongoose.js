require('dotenv').config();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const Product = require('./models/product');
const Review = require('./models/review');
const User = require('./models/user');
const Province = require('./models/province')

function escapeRegExp(stringToGoIntoTheRegex) {
    return stringToGoIntoTheRegex.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

mongoose
    .connect(process.env.DATABASE_URL)
    .then(() => {
        console.log('Connected to database!');
    })
    .catch(() => {
        console.log('Connection failed!');
    });

const getFeaturedProducts = async(req, res, next) => {
    Product.find({ featured: true }).exec(function(err, data) {
        if (err) {
            res.json(err);
        } else {
            res.json({
                results: data
            });
        }
    });
};

const getProducts = async(req, res, next) => {
    // const products = await Product.find().exec();
    // res.json(products);

    // const count = await Product.countDocuments({}).exec();

    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;

    const category = req.query.category;
    const brand = req.query.brand;
    const price = req.query.price;
    const battery = req.query.battery;
    const sort = req.query.sort;

    let query = {};

    if (category) {
        query['category'] = category;
    }

    if (brand) {
        query['brand'] = brand.split(",");
        console.log(query['brand']);
    }

    if (price) {
        const priceArr = price.split(",");

        let prices = [];

        priceArr.forEach(val => {
            if (val === 'duoi-2-trieu') {
                prices.push({ price: { $lte: 2000000 } });
            } else if (val === 'tu-2-5-trieu') {
                prices.push({ price: { $gt: 2000000, $lte: 5000000 } });
            } else if (val === 'tu-5-10-trieu') {
                prices.push({ price: { $gt: 5000000, $lte: 10000000 } });
            } else if (val === 'tu-10-20-trieu') {
                prices.push({ price: { $gt: 10000000, $lte: 20000000 } });
            } else if (val === 'tren-20-trieu') {
                prices.push({ price: { $gt: 20000000 } });
            }
        });

        if (prices.length > 0) {
            query['$or'] = prices;
            console.log(query);
        }
    }

    if (battery) {
        const batteryArr = battery.split(",");

        let batteries = [];
        batteryArr.forEach(val => {
            let key = 'specs.pin';

            if (val === 'duoi-3000-mah') {
                batteries.push({
                    [key]: { $lte: 3000 }
                });
            } else if (val === 'tu-3000-4000-mah') {
                batteries.push({
                    [key]: { $gt: 3000, $lte: 4000 }
                });
            } else if (val === 'tren-4000-mah') {
                batteries.push({
                    [key]: { $gt: 4000 }
                });
            }
        });

        if (batteries.length > 0) {
            query['$or'] = batteries;
        }
    }

    switch (sort) {
        case 'priceAscending':
            {
                Product.find(query).sort({ price: 1 }).exec(function(err, data) {
                    if (err) {
                        res.json(err);
                    } else {
                        res.json({
                            results: data
                        });
                    }
                });

                break;;
            }
        case 'priceDescending':
            {
                Product.find(query).sort({ price: -1 }).exec(function(err, data) {
                    if (err) {
                        res.json(err);
                    } else {
                        res.json({
                            results: data
                        });
                    }
                });

                break;
            }
        default:
            {
                Product.find(query).exec(function(err, data) {
                    if (err) {
                        res.json(err);
                    } else {
                        res.json({
                            results: data
                        });
                    }
                });
            }

    }
};

const searchProduct = async(req, res, next) => {
    const category = req.query.category;
    let query = {};
    if (category) {
        query['category'] = category;
    }
    const limit = category ? 4 : 5;
    query['name'] = { $regex: new RegExp('.*' + escapeRegExp(req.query.name) + '.*', 'i') };

    Product.find(query).limit(limit).exec(function(err, data) {
        if (err) {
            res.json(err);
        } else {
            res.json({
                results: data
            });
        }
    });
};

const getProductDetail = async(req, res, next) => {

    const productId = req.params.productId;

    if (ObjectId.isValid(productId)) {
        const product = await Product.findById(productId).exec();
        res.json(product);
    } else {
        const queryName = req.params.productId.split('-').join(' ');
        let query = {};
        query['name'] = { $regex: new RegExp('^' + escapeRegExp(queryName) + '$', 'i') };
        Product.findOne(query).exec(function(err, data) {
            if (err) {
                res.json(err);
            } else {
                res.json(data);
            }
        });
    }
};

const compareProduct = async(req, res, next) => {
    const queryListId = req.query.id;
    res.json(queryListId);
};

const getBrandList = async(req, res, next) => {
    const category = req.query.category;
    const brand = await Product.find({ category: category }).distinct('brand');
    res.json(brand)
};

const getReviews = async(req, res, next) => {
    const productId = req.params.productId;
    const listReview = await Review.aggregate([
        { '$match': { productId: productId } },
        { $unwind: '$reviews' }
    ]).exec();

    let query = [];
    query.push({ $match: { productId: productId } }, { $unwind: '$reviews' }, {
        $group: {
            _id: '$reviews._id',
            userId: { $first: '$reviews.userId' },
            customerName: { $first: '$reviews.customerName' },
            star: { $first: '$reviews.star' },
            comment: { $first: '$reviews.comment' },
            images: { $first: '$reviews.images' },
            createdAt: { $first: '$reviews.createdAt' },
        },
    }, {
        $sort: { createdAt: -1 },
    });

    if (req.query.page) {
        const limit = 5;
        const page = parseInt(req.query.page, 10) || 1;
        const startIndex = (page - 1) * limit;
        query.push({
            $skip: startIndex
        });
        query.push({
            $limit: limit
        });
    }

    const review = await Review.aggregate(query).exec();

    res.json({
        count: listReview.length,
        reviews: review
    });
};

const getReviewsByUser = async(req, res, next) => {
    const userId = req.params.userId;
    const data = await Review.aggregate([
        { $unwind: '$reviews' },
        { $match: { 'reviews.userId': userId } },
        {
            $group: {
                _id: '$reviews._id',
                productId: { $first: '$productId' },
                userId: { $first: '$reviews.userId' },
                star: { $first: '$reviews.star' },
                comment: { $first: '$reviews.comment' },
                images: { $first: '$reviews.images' },
                createdAt: { $first: '$reviews.createdAt' },
            },
        },
        { $sort: { createdAt: -1 } }
    ]).exec();

    res.json(data);
};

const submitReview = async(req, res, next) => {
    const productId = req.params.productId;

    const reviewData = {
        userId: req.body.userId ? req.body.userId : null,
        customerName: req.body.customerName,
        star: req.body.star,
        comment: req.body.comment,
        createdAt: req.body.createdAt ? req.body.createdAt : Date.now()
    };

    if (req.body.customerName && req.body.star && req.body.comment) {
        // create new object or update existing object
        const query = Review.updateOne({ productId: productId }, { $push: { reviews: reviewData } }, { upsert: true });
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
                message: 'Error',
            },
        });
    }
};

const getUserData = async(req, res, next) => {
    const userId = req.params.userId;
    const data = await User.findOne({ uuid: userId }).exec();
    res.json(data);
};

const submitUserData = async(req, res, next) => {
    const data = req.body;
    const userData = new User({
        uuid: data.uuid ? data.uuid : null,
        fullName: data.fullName ? data.fullName : null,
        displayName: data.displayName ? data.displayName : null,
        phone: data.phone ? data.phone : null,
        email: data.email ? data.email : null,
        birthday: data.birthday ? data.birthday : null,
        photoURL: data.photoURL ? data.photoURL : null,
        emailVerified: data.emailVerified ? data.emailVerified : false
    });

    if (req.body.uuid) {
        User.create(userData)
            .then(async function(data) {
                console.log(data);
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
};

const updateUserData = async(req, res, next) => {
    const userId = req.params.userId;
    const data = req.body;
    let updatedData = {};
    let update = [];

    const { fullName, displayName, photoURL, phone, birthday, newAddress } = data
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

    if (Object.keys(updatedData).length) {
        update.push({
            $set: updatedData
        });
    }
    const info = data.newAddress;

    if (Object.keys(info).length) {
        update.push({
            $addToSet: {
                listAddress: {
                    name: info.name,
                    phone: info.phone,
                    city: info.city,
                    district: info.district ? info.district : '',
                    ward: info.ward ? info.ward : '',
                    address: info.address,
                    default: info.default
                }
            }
        })
    }

    console.log(1, info);
    console.log(2, update.length);

    // updatedData = {...updatedData, fullName: data.fullName ? data.fullName : null };
    // updatedData = {...updatedData, displayName: data.displayName ? data.displayName : null };
    // updatedData = {...updatedData, photoURL: data.photoURL ? data.photoURL : null };
    // updatedData = {...updatedData, phone: data.phone ? data.phone : null };
    // updatedData = {...updatedData, birthday: data.birthday ? data.birthday : null };
    // updatedData = {...updatedData, listAddress: data.listAddress ? data.listAddress : [] };

    if (update.length) {
        const query = User.updateOne({ uuid: userId }, update, { upsert: true });
        query.then(async function(data) {
                return res.json({
                    message: true
                });
            })
            .catch(function(err) {
                return res.json({
                    error: {
                        message: 'Error',
                    },
                });;
            });
    } else {
        res.json({
            error: {
                message: 'Error',
            },
        });;
    }
};

const getCities = async(req, res, next) => {
    const data = await Province.find({}, { id: 1, name: 1 }).sort({ id: 1 }).exec();
    res.json(data);
};


const getDistricts = async(req, res, next) => {
    const id = req.params.id;
    const data = await Province.aggregate([{
            $unwind: '$districts'
        }, { $match: { id: parseInt(id) } }, {
            $group: {
                _id: null,
                districts: {
                    $push: {
                        id: '$districts.id',
                        name: '$districts.name'
                    }
                }
            }
        },
        {
            $project: { _id: 0, districts: 1 }
        }
    ]).exec();

    if (data) {
        if (data.length) {
            res.json(data[0].districts);
        } else {
            res.json([]);
        }
    }
};

const getWards = async(req, res, next) => {
    const cityId = req.query.city;
    const districtId = req.query.district;
    // console.log(cityId, districtId);
    if (cityId && districtId) {
        const data = await Province.aggregate([{
                $unwind: '$districts',
            },
            {
                $match: {
                    'id': parseInt(cityId),
                    'districts.id': parseInt(districtId)
                }
            },
            {
                $group: {
                    _id: null,
                    wards: { $first: '$districts.wards' }
                },
            },
            {
                $project: { _id: 0, wards: 1 }
            }
        ]).exec();

        if (data.length) {
            res.json(data[0].wards);
        } else {
            res.json([]);
        }
    }
};

exports.getFeaturedProducts = getFeaturedProducts;
exports.getProducts = getProducts;
exports.getProductDetail = getProductDetail;
exports.searchProduct = searchProduct;
exports.compareProduct = compareProduct;
exports.getBrandList = getBrandList;
exports.getReviews = getReviews;
exports.submitReview = submitReview;
exports.getReviewsByUser = getReviewsByUser;
exports.getUserData = getUserData;
exports.submitUserData = submitUserData;
exports.updateUserData = updateUserData;

exports.getCities = getCities;
exports.getDistricts = getDistricts;
exports.getWards = getWards;