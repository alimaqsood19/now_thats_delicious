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
    photo: String 
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


var Store = mongoose.model('Store', storeSchema);

module.exports = {
    Store: Store
}