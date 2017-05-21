const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true, //unique email address required
        lowercase: true, //Always saves the email in the DB as lowercase
        trim: true, //trims white space before and after string 
        validate: [validator.isEmail, 'Invalid Email Address'], //validator package, first to check if is correct email, error message
        required: 'Please supply an email address'
    },
    name: {
        type: String,
        required: 'Please supply a name',
        trim: true 
    },
    resetPasswordToken: {
        type: String 
    },
    resetPasswordExpires: {
        type: Date
    }
});
//virtual field not stored in database, it gets created on the fly, in layout for the avatar it uses user.gravatar
//so whenever user.gravatar is used it creates the field then automatically and populates it with whatever is specified 
userSchema.virtual('gravatar').get(function() {
    const hash = md5(this.email); //this = user instance, hashes your email with md5 
    return `https://gravatar.com/avatar/${hash}?s=200` //s=200 is size
});

userSchema.plugin(passportLocalMongoose, {usernameField: 'email'}); //use passport for the hashing of password and local strategy
//telling passport to use our schema field 'email' alongside its own, cuz it does the password hashing, token, auth for us
//it gives us a method .register() that takes care of hashing etc
userSchema.plugin(mongodbErrorHandler); //Change the 'ugly' mongo errors into a nice error that is useful for user 

var User = mongoose.model('User', userSchema);

module.exports = {
    User
}
