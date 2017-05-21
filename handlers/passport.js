const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User'); //access to User model

passport.use(User.createStrategy()); //in User model we used passportLocalMongoose plugin

//Everytime we have a request, it asks passport what we do with the User
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
