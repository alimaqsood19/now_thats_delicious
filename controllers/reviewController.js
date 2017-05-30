const mongoose = require('mongoose');
const {Review} = require('../models/Review');

var addReview = async (req, res) => {
    req.body.author = req.user._id; //currently logged in user
    req.body.store = req.params.id; //the store ID passed in as params
    const newReview = new Review(req.body); //req.body has text, rating, author and store on it all required fields
    await newReview.save();
    req.flash('success', 'Review Saved!');
    res.redirect('back');
}

module.exports = {
    addReview
}