const { Router } = require('express')
const controller = require('../controllers/authController');

const router = Router();

router.get('/signup', controller.signup_get);
router.post('/signup', controller.signup_post);
router.get('/login', controller.login_get);
router.post('/login', controller.login_post);
router.get('/logout', controller.logout_get);


module.exports = router;