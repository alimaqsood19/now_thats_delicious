const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController.js');
const {catchErrors} = require('../handlers/errorHandlers.js');

// Do work here

router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));

router.get('/add', storeController.addStore);

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

module.exports = router;


