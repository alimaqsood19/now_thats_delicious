const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs'); //Allow us to make url friendly names for our slugs

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true, //Any String with spaces before or after removes white space
        required: 'Please enter a store name!' //Acts as a boolean and error
    },
    slug: {
        type: String
    },
    description: {
        type: String,
        trim: true
    },
    tags: {
        type: [String]
    },
    created: {
        type: Date,
        default: Date.now //The created property will store the time the doc was created in MS
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [{
            type: Number,
            required: 'You must supply coordinates!'
        }],
        address: {
            type: String,
            required: true
        }
    },
    photo: String,
    author: {
        type: mongoose.Schema.ObjectId, //ObjectId
        ref: 'User', //tells mongodb, the author field is referenced to our User, points to another collection User that will provide the info
        required: 'You must supply an author'
    } 
});

//Define our indexes
storeSchema.index({
    name: 'text', //Index it AS, this is indexed as text so we can scrub through them efficiently, case sensitivity etc
    description: 'text'
});

storeSchema.pre('save', async function (next) {
    if (!this.isModified('name')) { //if name is not modified
        next(); //skip it
        return;//stops function from running
    }
    this.slug = slug(this.name); //take the name that is passed and runs it through slug method, and the value
    //that is returned will be set as the slug property
    //Stores with similar name will add a -1, -2 etc to it

    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i'); //case insensitive 
    const storesWithSlug = await this.constructor.find({slug: slugRegEx}); //this.constructor means the model Store 
    if (storesWithSlug.length) {
        this.slug = `${this.slug}-${storesWithSlug.length + 1}`; //adds a 1, 2, 3 etc onto stores with similar names
    }
    next();
})

storeSchema.statics.getTagsList = function() { //for aggregating
    return this.aggregate([
        {$unwind: '$tags'}, //unwinds it creates a duplication of the document of the specified tag
        {$group: {_id: '$tags', count: {$sum: 1}}}, //group everything based on tag field, create a new field in each group
        //called count, each time we group one of these items, the count will add +1 to the count
        {$sort: {count: -1}} //sort it by descending 
    ]);
}

var Store = mongoose.model('Store', storeSchema);


module.exports = {
    Store: Store
}