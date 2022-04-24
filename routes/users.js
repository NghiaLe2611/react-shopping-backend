const router = require('express').Router();
const usersController = require('../app/controllers/UsersController');

router.get('/reviews', usersController.getUserReviews);
router.put('/update', usersController.updateUserData);

module.exports = router;