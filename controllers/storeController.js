const mongoose = require('mongoose');
const {Store} = require('../models/Store.js');
//Once imported mongoose creates a singleton allowing us to globally access any of the models
//const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = { //where to put the images in storage and what type of files
    storage: multer.memoryStorage(), //saving right into memory, dont want to keep the original uploaded file, 
    //we want to read it into memory and then resize
    fileFilter: function(req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/');  //mimetype what type of img it is, .jpeg, .png etc
        if(isPhoto) {
            next(null, true);
        } else {
            next({message: 'That filetype is not allowed!'}, false);
        }        
    }
}

var homePage = function(req, res) {
    res.render('index');
}

var addStore = function(req, res) {
    res.render('editStore', {
        title: 'Add Store'
    });
}

var upload = multer(multerOptions).single('photo');

var resize = async function (req, res, next) { //saving image, recording file name, passing to createStore
    //Check if there is no new file to resize
    if(!req.file) {
        next(); //skips to next middleware
        return;
    }
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`; //name of the photo
    //now we resize
    const photo = await jimp.read(req.file.buffer); //jimp reads the file in memory as a buffer
    await photo.resize(800, jimp.AUTO); //resizes it as 800px width and auto height
    await photo.write(`./public/uploads/${req.body.photo}`); //writes resized file to the destination with unique ID
    //Once photo has been written to file system, keep going 
    //The name of the image/photo has been saved in the database, so in storeForm.pug it looks for that file name
    // i.e. store.photo and pulls it out of the uploads folder
    next();
}

var createStore = async function(req, res) { //add async infront of the function
    //res.json(req.body);
    const store = await (new Store(req.body)).save();


   // await store.save(); //means will not perform any other tasks until the document has been saved to DB
    req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
    res.redirect(`/store/${store.slug}`); //THEN it will execute this

    //OTHER way of using Promises to save to DB
    // store.save().then((store) => {
    //     res.json(store);
    // }).catch((err) => {
    //     console.log(err);
    // });
}


var getStores = async function(req, res) {
    const stores = await Store.find();
    res.render('stores', {title: 'Stores', stores: stores});
}

var editStore = async function(req, res) {
    storeId = req.params.id
    const store = await Store.findById({_id: storeId});
    res.render('editStore', {title: `Edit ${store.name}`, store: store}); //passes store document to editStore.pug to
    //be used by the mixin function _storeForm.pug 
}

var updateStore = async function(req, res) {
    //Set the location data to be a point
    req.body.location.type = 'Point'; //Used to Search for ones that are close to us
    const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body, {
        new: true, //return the new store document instead of old one
        runValidators: true //forces model to run the validators 
    }).exec(); //runs query 
    req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store</a>`);
    res.redirect(`/stores/${store._id}/edit`); //redirects back to the page where they were editting 
}

var getStoreBySlug = async function (req, res, next) {
    const store = await Store.findOne({slug: req.params.slug});
    if (!store) {
        return next();
    }
    res.render('store', {store: store, title: store.name});
}

var getStoresByTag = async function (req, res) {
    const tag = req.params.tag;
    const tagQuery = tag || {$exists: true}; //if there is no tag it will show any store that has atleast one tag on it
    const tagsPromise = Store.getTagsList(); //model static function getTagsList that aggregates() groups by tags
    const storesPromise = Store.find({tags: tagQuery})//finding all docs with the specified tags
    const result = await Promise.all([tagsPromise, storesPromise]); //Waits for all the promises to be fired of at the same time
     //clicking on tag adds it the params, allows us to display tag name as h2 header
    var tags = result[0];
    var stores = result[1];
    res.render('tag', {tags: tags, title: 'Tags', tag, stores}); //passes aggregated docs, title, and params.tag 
}

module.exports = {
    homePage: homePage,
    addStore: addStore,
    createStore,
    getStores,
    editStore,
    updateStore,
    upload,
    resize,
    getStoreBySlug,
    getStoresByTag
}