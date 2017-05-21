const mongoose = require('mongoose');
const {User} = require('../models/User.js');
const promisify = require('es6-promisify');

var loginForm = function(req, res) {
    res.render('login', {title: 'Login'});
}

var registerForm = function(req, res) {
    res.render('register', {title: 'Register'});
}

var validateRegister = (req, res, next) => {
    req.sanitizeBody('name'); //all of these methods on the request object came from express-validator
    req.checkBody('name', 'You must supply a name!').notEmpty();
    req.checkBody('email', 'That Email is not valid').isEmail(); 
    req.sanitizeBody('email').normalizeEmail({ //prevents abuse, malicious attempts, sets to lowercase etc 
        remove_dots: false, 
        remove_extension: false,
        gmail_remove_subaddress: false 
    });
    req.checkBody('password', 'Password Cannot be Blank!').notEmpty();
    req.checkBody('password', 'Confirmed password cannot be blank!').notEmpty();
    req.checkBody('password-confirm', 'Passwords do not match').equals(req.body.password);

    const errors = req.validationErrors(); //calling this method checks all the above checks 
    if (errors) {
        req.flash('error', errors.map(function(err) {
            return err.msg
        }));
        res.render('register', {title: 'Register', body: req.body, flashes: req.flash()});
        return; //stops function from running
    }
    next(); //No errors
}

var register = async function(req, res, next) {
    const user = new User({
        email: req.body.email,
        name: req.body.name  
    });
    const register = promisify(User.register, User); //Pass the method you want to add Promises ability to, second since its a method 
    //on a object, you need to specify which object to bind to, so it knows wehre to bind itself to
    await register(user, req.body.password); //from the passport-local-mongoose package, doesn't store the acutal password
    //stores a hashed password in the DB, register method, takes the new instance created as the first param and the pw as thes econd param

    //CALLING REGISTER() automatically saves to DB, calls .save() once it hashes the pw etc
    next();

    //COULDVE DONE
   
/*
    User.register(user, req.body.password, function(err, user) {
        if (err) {
            return res.send(err);
        }
        res.send({
            success: true,
            user: user
        });
    });
*/
} 

var account = (req, res) => {
    res.render('account', {title: 'Edit Your Account'});
}


var updateAccount = async (req, res) => {
    const updates = {
        name: req.body.name,
        email: req.body.email 
    };

const user = await User.findOneAndUpdate({ //{Query}, {Fields to be updated using $set}, {options}
        _id: req.user._id //req.user comes from passport 
    }, {
        $set: updates 
    }, {
        new: true,
        runValidators: true,
        context: 'query' //for mongo to run the query
    });
    req.flash('success', 'Successfully Updated Profile!')
    res.redirect('back'); //sends them back to the endpoint from where they came

}





module.exports = {
    loginForm,
    registerForm,
    validateRegister,
    register,
    account,
    updateAccount
}