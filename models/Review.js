const mongoose = require('mongoose');
mongoose.Promise = global.Promise; 

const reviewSchema = new mongoose.Schema({
    created: {
        type: Date,
        default: Date.now
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User', //reference another doc in our database aka the User docs
        required: 'You must supply an author'
    },
    store: {
        type: mongoose.Schema.ObjectId,
        ref: 'Store',
        required: 'You must supply a store!'
    },
    text: {
        type: String,
        required: 'Your review must have text!'
    },
    rating: {
        type: Number,
        min: 1,
        max: 5 
    }
});

function autopopulate(next) {
    this.populate('author');
    next();
}

//Anytime 'find' or 'findOne' called, it automatically populates the author field aka the User document for us each time
reviewSchema.pre('find', autopopulate);
reviewSchema.pre('findOne', autopopulate);

var Review = mongoose.model('Review', reviewSchema);


module.exports = {
    Review
}