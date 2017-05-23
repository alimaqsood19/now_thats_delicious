//node mailer, it interfaces with smtp transports and will do the sending of the email for you
//transport is how we interface with sending emails, smtp being most common
const nodemailer = require('nodemailer'); //uses node to send mail via diff methods we use smtp and mailtraper
const pug = require('pug'); //renders pug to html
const juice = require('juice'); //give it html with style tags, and it basically inlines the css for us
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

const transport = nodemailer.createTransport({ //used to send the email through nodemailer, we created a transport 
    host: process.env.MAIL_HOST, //currently using mailtrap for developemnt
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

var generateHTML = (filename, options = {}) => {
    const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
    //This renders the pug file converts it into html format, looks into the current directory, up a level, into views/email/filename specified,
    //With the options parameter that will include the reset variable and user email address
    const inlined = juice(html); //takes all the html and css and inlines it all into one line
    return inlined;
}

var send = async (options) => {
    const html = generateHTML(options.filename, options);
    const text = htmlToText.fromString(html); //converts from html to text
    const mailOptions = {
        from: `Ali Maq <noreply@alimaq.com>`,
        to: options.user.email,
        subject: options.subject,
        html: html, //the html called the generateHTML function which renders the .pug file into html format 
        text: text
    };
    const sendMail = promisify(transport.sendMail, transport);
    return sendMail(mailOptions); //instead of doing transport.sendMail(mailOptions, cb), calls the function requried
    //to send the mail
}



// transport.sendMail({
//     from: 'Hello <alimaqsood@gmail.com>',
//     to: 'booby@example.com',
//     subject: 'Just tesing this out',
//     html: 'Hey i <strong> love</strong> you',
//     text: 'Hey I love you'
// });

module.exports = {
    send: send 
}