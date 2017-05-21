const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController.js');
const userController = require('../controllers/userController.js');
const {catchErrors} = require('../handlers/errorHandlers.js');
const authController = require('../controllers/authController.js');

// Do work here

router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));

router.get('/add', authController.isLoggedIn, storeController.addStore); //checks if they're logged in first

router.post('/add', 
  storeController.upload, 
  catchErrors(storeController.resize), 
  catchErrors(storeController.createStore)); //runs catchErrors, takes the function wraps it another
//function and returns us that function that has a .catch attached to it

router.post('/add/:id', 
  storeController.upload, 
  catchErrors(storeController.resize), 
  catchErrors(storeController.updateStore));//after hitting save calls this request redirected from POST form


router.get('/stores/:id/edit', catchErrors(storeController.editStore));//pressing edit button on store calls this request, redirects to /add/:id
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

router.get('/login', userController.loginForm);
router.post('/login', authController.login);

router.get('/register', userController.registerForm);
router.post('/register', 
  userController.validateRegister,
  userController.register,
  authController.login  
);

router.get('/logout', authController.logout);

router.get('/account', authController.isLoggedIn, userController.account); //user profile
router.post('/account', catchErrors(userController.updateAccount)); //changes to user profile
router.post('/account/forgot', catchErrors(authController.forgot)); //Sends email to user if user exists, sets token and expiry
router.get('/account/reset/:token', catchErrors(authController.reset)); //URL obtained from email
router.post('/account/reset/:token', authController.confirmedPasswords, catchErrors(authController.update));
//the post gets called once the user access the reset URL and hits submit

module.exports = router;


