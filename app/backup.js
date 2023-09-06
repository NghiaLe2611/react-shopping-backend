// // Check product is liked
// checkProductLiked: async(req, res) => {
//     const productId = req.params.productId;
//     console.log(productId);
//     if (ObjectId.isValid(productId)) {
//         const product = await Favorite.findOne({
//             'uuid': req.user.uid,
//             'data.product_id': productId,
//         }).exec();

//         if (product) {
//             return res.status(200).json({
//                 liked: true,
//                 product_id: productId
//             });
//         } else {
//             return res.json({
//                 liked: false,
//                 product_id: productId
//             });
//         }
//     } else {
//         res.status(400).json({
//             message: 'Product not found'
//         });
//     }
// }

// // Add to wishlist
// addToWishlist: async(req, res, next) => {
//     if (req.user) {
//         const userId = req.user.uid;
//         const { type } = req.body;
//         const productId = req.params.productId;
//         const product = await Product.findById(productId).exec();
    
//         const listReview = await Review.aggregate([{ $match: { productId: productId } }, { $unwind: '$reviews' }]).exec();
//         const totalStar = listReview.reduce((n, {reviews}) => n + reviews.star, 0);
//         const favOfUser = await Favorite.findOne({uuid: userId}).exec();
//         const favoriteItem = favOfUser?.data.filter(item => item['product_id'] === productId);

//         let pipeline = {};

//         if (product) {
//             // Add fav
//             if (type === 1) {

//                 Product.findOneAndUpdate(
//                     {_id: productId},
//                     {
//                         $inc: {
//                             favorite_count: 1
//                         }
//                     }
//                 ).then(result => {
//                     const data = {
//                         product_id: result._id,
//                         category: result.category,
//                         img: result.img,
//                         name: result.name,
//                         price: result.price,
//                         sale: result.sale,
//                         rating_average: result.rating_average,
//                         review_count: result.review_count,
//                         favorite_count: result.favorite_count + 1,
//                     };

//                     if (!favOfUser) {
//                         // If user's fav item not exist => create new

//                         let newFavoriteItem = {
//                             uuid: userId,
//                             data: [data],
//                         };

//                         Favorite.create(newFavoriteItem)
//                             .then(() => {
//                                 res.json({
//                                     success: true,
//                                     status: 1
//                                 });
//                             })
//                             .catch((err) => {
//                                 return res.json({
//                                     success: false,
//                                     message: err,
//                                 });
//                             });
//                     } else {
//                         // Update user's fav list
//                         Favorite.updateOne(
//                             {uuid: userId},
//                             {
//                                 $push: {
//                                     data: data,
//                                 },
//                             }
//                         ).then(() => {
//                             res.json({
//                                 success: true,
//                                 status: 1
//                             });
//                         })
//                         .catch((err) => {
//                             return res.json({
//                                 success: false,
//                                 message: err,
//                             });
//                         });
//                     }  
//                 }).catch(err => {
//                     console.log(err);
//                 })

//             } else if (type === 0) {
//                 // Remove fav
//                 Product.findOneAndUpdate(
//                     {_id: productId},
//                     {
//                         $inc: {
//                             favorite_count: -1
//                         }
//                     }
//                 ).then(() => {
//                     Favorite.updateOne(
//                         {
//                             uuid: userId,
//                         },
//                         {
//                             $pull: {data: { 'product_id': productId}},
//                         }
//                     ).then(() => {
//                         res.json({
//                             success: true,
//                             status: 0
//                         });
//                     })
//                     .catch((err) => {
//                         return res.json({
//                             success: false,
//                             message: err
//                         });
//                     });
//                 }).catch(err => {
//                     console.log(err);
//                 });
//             }
//         }
//     }
// },