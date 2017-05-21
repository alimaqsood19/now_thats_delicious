const passport = require('passport');//library that logs users in

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



module.exports = {
    login: login,
    logout,
    isLoggedIn
}