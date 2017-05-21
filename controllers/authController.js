const passport = require('passport');//library that logs users in
const {User} = require('../models/User.js');
const crypto = require('crypto');
const promisify = require('es6-promisify');

var login = passport.authenticate('local', { //logins the user automatically 
    //passport.authenticate middleware adds methods on the req object such as req.logout() or req.isAuthenticated() 
    //since its a middleware itll call next(), this authenticate
    failureRedirect: '/login',
    failureFlash: 'Failed Login!',
    successRedirect: '/',
    successFlash: 'You are now logged in'
});

var logout = (req, res) => { //Passport exposes a logout() function on req (also aliased as logOut()) that can be called from any route handler which needs to terminate a login session
    req.logout(); // Invoking logout() will remove the req.user property and clear the login session (if any).
    req.flash('success', 'You are now logged out!');
    res.redirect('/');
}

var isLoggedIn = (req, res, next) => {
    //check if user is authenticated
    if (req.isAuthenticated()) {//checks with passport if 
        next(); //carries on since user is logged in
        return;
    }
    req.flash('error', 'Oops you must be logged in to do that');
    res.redirect('/login');
}

var forgot = async (req, res) => {
    //See if user exists
    const user = await User.findOne({email: req.body.email}); //user document gets returned if it exists
    if (!user) {
        req.flash('error', 'No account with that email exists');
        return res.redirect('/login');
    }
    //setting the fields from the userSchema to equal a random crypted token string and an expiry date
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    await user.save(); //waits until user is saved, saves the new field values to the document
    const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`; //${req.headers.host} the URL that we are using
    req.flash('success', `You have been emailed a password reset link ${resetURL}`);
    res.redirect('/login');
}

var reset = async (req, res) => { //when user gets reset email, checks if token matches and not expired
    const token = req.params.token;
    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: {$gt: Date.now()} //if the current time is greater than the set expiry time then token no longer valid, $gt = greater than special query
    }); 
    if (!user) {
        req.flash('error', 'Password reset is invalid or has expired');
        return res.redirect('/login');
    }
    res.render('reset', {title: 'Reset your password'});
}

var confirmedPasswords = (req, res, next) => {
    if (req.body.password === req.body['password-confirm']) {
        next();
        return; 
    }
    req.flash('error', 'Passwords do not match');
    res.redirect('back');
}

var update = async (req, res) => {
        const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {$gt: Date.now()} //if the current time is greater than the set expiry time then token no longer valid, $gt = greater than special query
    }); //returns a user object when and if it finds it and makes it equal to the variable user
        if (!user) {
        req.flash('error', 'Password reset is invalid or has expired');
        return res.redirect('/login');
    } 
        const setPassword = promisify(user.setPassword, user);   //made available because of passportlocalmongoose
            //makes user.setPassword() into a promise, and then binds it to the user object 
        await setPassword(req.body.password); //hashes and salts it behinds the scene
        //since its been updated can now get rid of token and expiry by setting to undefined
        user.resetPasswordExpires = undefined;
        user.resetPasswordToken = undefined;
        const updatedUser = await user.save(); //saves the new fields to the user document
        //login them in automatically now
        await req.login(updatedUser); //pass a User and it automatically logs that user in without having to pass in
        //their username and password manually
        req.flash('success', 'Your password has been reset! You are now logged in.');
        res.redirect('/');
}



module.exports = {
    login: login,
    logout,
    isLoggedIn,
    forgot,
    reset,
    confirmedPasswords,
    update 
}