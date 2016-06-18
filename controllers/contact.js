var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
  service: 'Mailgun',
  auth: {
    user: process.env.MAILGUN_USERNAME,
    pass: process.env.MAILGUN_PASSWORD
  }
});

/**
 * GET /contact
 */
exports.contactGet = function(req, res) {
  res.render('contact', {
    title: 'Contact'
  });
};

/**
 * POST /contact
 */
exports.contactPost = function(req, res) {
  req.assert('name', 'Le nom doit être précisé').notEmpty();
  req.assert('email', 'L\'adresse mail n\'est pas valide').isEmail();
  req.assert('email', 'L\'email doit être précisé').notEmpty();
  req.assert('message', 'Le message ne peut être vierge').notEmpty();
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  var errors = req.validationErrors();

  if (errors) {
    req.flash('error', errors);
    return res.redirect('/contact');
  }

  var mailOptions = {
    from: req.body.name + ' ' + '<'+ req.body.email + '>',
    to: 'billyzob@msn.com',
    subject: '✔ Formulaire de contact',
    text: req.body.message
  };

  transporter.sendMail(mailOptions, function(err) {
    req.flash('success', { msg: 'Merci! Votre message a bien été transmis.' });
    res.redirect('/contact');
  });
};
