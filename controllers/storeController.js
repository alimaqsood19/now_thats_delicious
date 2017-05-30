const mongoose = require('mongoose');
const {Store} = require('../models/Store.js');
//Once imported mongoose creates a singleton allowing us to globally access any of the models
//const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');
const {User} = require('../models/User.js');

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
    req.body.author = req.user._id; //Since Passport gives us req.user of the currently logged in user, grabs the _id
    //Then populates the author field in the Store model
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
    const page = req.params.page || 1;
    const limit = 6;
    const skip = (page * limit ) - limit; 
    //Query database for a list of all stores
    const storesPromise = Store
        .find()
        .skip(skip)
        .limit(limit)
        .sort({created: 'desc'});

    const countPromise = Store.count(); //returns the total number of documents 

    const [stores, count] = await Promise.all([storesPromise, countPromise]);

    const pages = Math.ceil(count / limit); //.ceil gives the upper bound rounds up
    if (!stores.length && skip) {
        req.flash('info', `Invalid page ${page}`);
        res.redirect(`/stores/page/${pages}`);
        return;
    }
    res.render('stores', {title: 'Stores', stores: stores, page: page, pages: pages, count: count });
}

//Ensures store.author objectId is equal to logged in user Id
var confirmOwner = (store, user)  => {
    if (!store.author.equals(user._id)) {
        throw Error('You must own a store in order to edit it!');
    }
};

var editStore = async function(req, res) {
    //Finds Store by store ID
    storeId = req.params.id
    const store = await Store.findById({_id: storeId});
    //confirms if user is owner of store 
    confirmOwner(store, req.user) //call the function to see if the store.author field === req.user._id again req.user is from passport when user logs in
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
    const store = await Store.findOne({slug: req.params.slug}).populate('author reviews'); //Finds the Object ID specified in the author
    // field and review field and populates that field instead of just the object ID
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

var searchStores = async function(req, res) {
    const stores = await Store.find({
        $text: { //$text operator, basically saying look for the indexed documents as text, and search for the specified query 'q'
            $search: req.query.q
        }
    }, {
        score: { $meta: 'textScore'} //first query .find({what to look for}, {projection}) project in mongodb just means
        //to add a field, and in this case the field is score, and the operator $meta 'textScore' basically assigns a score
        ///to the matching documents based on how well the document matched the search term or terms, must be used in conjunction with $text query
    }).sort({//this sorts the documents by score, highest score first
        score: { $meta: 'textScore'}
    }).limit(5); //Limits it to 5 documents with highest score

    res.json(stores);
}

var mapStores = async (req, res) => {
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat); //an array of coordinate numbers, .map(parseFloat) converts to number from string
    const q = {
        location: {
            $near:{ //$near operator in mongodb that searches for stores near the specified lat and lng
                $geometry: {
                    type: 'Point',
                    coordinates: coordinates //the specified lat and lng values in the query
                },
                $maxDistance: 10000 //10km
            }
        }
    }

    const stores = await Store.find(q).select('slug name description location photo').limit(10); 
    //.select only shows you the specified fields can also do -author -tags to NOT include those
    //.limit limits to only 10 documents
    res.json(stores);
}

var mapPage = (req, res) => {
    res.render('map', {title: 'Map'});
}

var heartStore = async (req, res) => {
    const hearts = req.user.hearts.map(function(obj) {
        return obj.toString();
    });
    //check the hearts field to see if it already has the same store Id in it
    //Since hearts is a field that is an array of objects, need to iterate over each object
        //and covert it to just a string

        // var operator;
        // if (hearts.includes(req.params.id)) {
        //     operator = '$pull';
        // }else {
        //     operator = '$addToSet';
        // }
        //Using ternary operator
        const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet'; //$pull is to remove, $addToSet adds it only once for a specific user 
        const user = await User.findByIdAndUpdate(req.user._id, 
            { [operator]: {hearts: req.params.id} }, //computed property
            {new: true}); //provides back the updated doc
        //find a user with the specified id because they're logged in already, [operator] is replaced with either $pull or $addToSet
        //so it'll either remove or add the store Id to the hearts field
        res.json(user);
}

var getHearts = async (req, res) => {
    const stores = await Store.find({
        _id: { $in: req.user.hearts} //find any stores id that are in an array which in this case is req.user.hearts
    });
    res.render('stores', {title: 'Hearted Stores', stores});
};

var getTopStores = async (req, res) => {
    const stores = await Store.getTopStores(); //adding method to model is a static
    res.render('topStores', {title: 'Top Stores!', stores});
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
    getStoresByTag,
    searchStores,
    mapStores,
    mapPage,
    heartStore,
    getHearts,
    getTopStores
}