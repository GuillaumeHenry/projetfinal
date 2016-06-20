var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var User = require('../models/User');


/**
 * Login required middleware
 */
exports.ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
};

/**
 * GET /login
 */
exports.loginGet = function(req, res) {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/login', {
    title: 'Connexion'
  });
};

/**
 * POST /login
 */
exports.loginPost = function(req, res, next) {
  req.assert('email', 'l\' email n\'est pas valide').isEmail();
  req.assert('email', 'l\' email ne peut être vide').notEmpty();
  req.assert('password', 'Le mot de passe ne peut être vide').notEmpty();
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  var errors = req.validationErrors();

  if (errors) {
    req.flash('error', errors);
    return res.redirect('/login');
  }

  passport.authenticate('local', function(err, user, info) {
    if (!user) {
      req.flash('error', info);
      return res.redirect('/login')
    }
    req.logIn(user, function(err) {
      res.redirect('/account');
    });
  })(req, res, next);
};

/**
 * GET /logout
 */
exports.logout = function(req, res) {
  req.logout();
  res.redirect('/');
};

/**
 * GET /signup
 */
exports.signupGet = function(req, res) {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/signup', {
    title: 'Inscription'
  });
};

/**
 * POST /signup
 */
exports.signupPost = function(req, res, next) {
  req.assert('name', 'le nom ne peut être vide').notEmpty();
  req.assert('email', 'l\' email n\'est pas valide').isEmail();
  req.assert('email', 'l\' email ne peut être vide').notEmpty();
  req.assert('password', 'Le mot de passe doit faire au minimum 4 caractères').len(4);
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  var errors = req.validationErrors();

  if (errors) {
    req.flash('error', errors);
    return res.redirect('/signup');
  }

  
  User.findOne({ email: req.body.email }, function(err, user) {
    if (user) {
      req.flash('error', { msg: 'L\'adresse email que vous avez entrée est déjà associée à un autre compte.' });
      return res.redirect('/signup');
    }
    user = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password
    });
    user.save(function(err) {
      req.logIn(user, function(err) {
        res.redirect('/');
      });
    });
  });
};

/**
 * GET /account
 */
exports.accountGet = function(req, res) {
  res.render('account/profile', {
    title: 'Mon compte'
  });
};

/**
 * PUT /account
 * Update profile information OR change password.
 */
exports.accountPut = function(req, res, next) {
  if ('password' in req.body) {
    req.assert('password', 'Le mot de passe doit contenir au moins 4 caractères').len(4);
    req.assert('confirm', 'Les mots de passe doivent correspondre').equals(req.body.password);
  } else {
    req.assert('email', 'L\'email n\'est pas valide').isEmail();
    req.assert('email', 'Le champ email doit être rempli').notEmpty();
    req.sanitize('email').normalizeEmail({ remove_dots: false });
  }



  var errors = req.validationErrors();

  if (errors) {
    req.flash('error', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, function(err, user) {
    if ('password' in req.body) {
      user.password = req.body.password;
    } else {
      user.email = req.body.email;
      user.pseudo = req.body.pseudo;
      user.name = req.body.name;
      user.prenom = req.body.prenom;
      user.gender = req.body.gender;
      user.age = req.body.age;
      user.location = req.body.location;
      user.website = req.body.website;
      user.photo = req.body.photo;
      user.presentation = req.body.presentation;
    }
    user.save(function(err) {
      if ('password' in req.body) {
        req.flash('success', { msg: 'Votre mot de passe a été changé.' });
      } else if (err && err.code === 11000) {
        req.flash('error', { msg: 'L\'adresse mail correspond déjà à une adresse existante .' });
      } else {
        req.flash('success', { msg: 'Vos informations ont été mises à jour.' });
      }
      res.redirect('/account');
    });
  });
};

/**
 * POST /upload
 */

exports.uploadPost= function (req, res, next) {

  User.findById(req.user.id, function (err, user) {
    if (err) {
      res.redirect('/account');
    } else {
      if ('originalname' in req.file) {
        user.photo = req.file.originalname;
        console.log(user.photo);
      }
      user.save(function () {
        req.flash('success', {msg: 'Votre image a bien été chargée.'});
        res.redirect('/account');
      });
    };
  });
};

/**
 * DELETE /account
 */
exports.accountDelete = function(req, res, next) {
  User.remove({ _id: req.user.id }, function(err) {
    req.logout();
    req.flash('info', { msg: 'Votre compte a été supprimé définitivement.' });
    res.redirect('/');
  });
};

/**
 * GET /unlink/:provider
 */
exports.unlink = function(req, res, next) {
  User.findById(req.user.id, function(err, user) {
    switch (req.params.provider) {
      case 'facebook':
        user.facebook = undefined;
        break;
      case 'google':
        user.google = undefined;
        break;
      case 'twitter':
        user.twitter = undefined;
        break;
      case 'vk':
        user.vk = undefined;
        break;
      default:
        req.flash('error', { msg: 'Invalid OAuth Provider' });
        return res.redirect('/account');
    }
    user.save(function(err) {
      req.flash('success', { msg: 'Votre compte a été détaché.' });
      res.redirect('/account');
    });
  });
};

/**
 * GET /forgot
 */
exports.forgotGet = function(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('account/forgot', {
    title: 'Mot de passe perdu'
  });
};

/**
 * POST /forgot
 */
exports.forgotPost = function(req, res, next) {
  req.assert('email', 'L\'email n\'est pas valide').isEmail();
  req.assert('email', 'L\'email doit être précisé').notEmpty();
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  var errors = req.validationErrors();

  if (errors) {
    req.flash('error', errors);
    return res.redirect('/forgot');
  }

  async.waterfall([
    function(done) {
      crypto.randomBytes(16, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', { msg: 'L\'adresse mail ' + req.body.email + ' n\'est associée à aucun compte.' });
          return res.redirect('/forgot');
        }
        user.passwordResetToken = token;
        user.passwordResetExpires = Date.now() + 3600000; // expire in 1 hour
        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var transporter = nodemailer.createTransport({
        service: 'Mailgun',
        auth: {
          user: process.env.MAILGUN_USERNAME,
          pass: process.env.MAILGUN_PASSWORD
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'henry_guillaume@hotmail.fr',
        subject: '✔ Changement de mot de passe',
        text: 'Vous recevez cet email car vous (ou quelqu\'un d\'autre) avez demandé de changer votre mot de passe.\n\n' +
        'Cliquer sur le lien suivant pour changer votre mot de passe:\n\n' +
        'http://' + req.headers.host + '/reset/' + token + '\n\n' +
        'Si vous n\'avez pas fait cette demande, ignorer ce message, votre mot de passe reste inchangé.\n'
      };
      transporter.sendMail(mailOptions, function(err) {
        req.flash('info', { msg: 'Un email a été envoyé à ' + user.email + ' avec plus d\'informations.' });
        res.redirect('/');
      });
    }
  ]);
};

/**
 * GET /reset
 */
exports.resetGet = function(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  User.findOne({ passwordResetToken: req.params.token })
    .where('passwordResetExpires').gt(Date.now())
    .exec(function(err, user) {
      if (!user) {
        req.flash('error', { msg: 'Le lien de réinitialisation du mot de passe est invalide ou a expiré.' });
        return res.redirect('/forgot');
      }
      res.render('account/reset', {
        title: 'Réinitialisation du mot de passe'
      });
    });
};

/**
 * POST /reset
 */
exports.resetPost = function(req, res, next) {
  req.assert('password', 'Le mot de passe doit faire au moins 4 caractères').len(4);
  req.assert('confirm', 'Les mots de passe doivent correspondre').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('error', errors);
    return res.redirect('back');
  }

  async.waterfall([
    function(done) {
      User.findOne({ passwordResetToken: req.params.token })
        .where('passwordResetExpires').gt(Date.now())
        .exec(function(err, user) {
          if (!user) {
            req.flash('error', { msg: 'Le lien de réinitialisation du mot de passe est invalide ou a expiré.' });
            return res.redirect('back');
          }
          user.password = req.body.password;
          user.passwordResetToken = undefined;
          user.passwordResetExpires = undefined;
          user.save(function(err) {
            req.logIn(user, function(err) {
              done(err, user);
            });
          });
        });
    },
    function(user, done) {
      var transporter = nodemailer.createTransport({
        service: 'Mailgun',
        auth: {
          user: process.env.MAILGUN_USERNAME,
          pass: process.env.MAILGUN_PASSWORD
        }
      });
      var mailOptions = {
        from: 'henry_guillaume@hotmail.fr',
        to: user.email,
        subject: 'Changement de mot de passe',
        text: 'Bonjour,\n\n' +
        'Ceci est un message de confirmation pour votre compte ' + user.email + ' dont le mot de passe vient d\'être changé.\n'
      };
      transporter.sendMail(mailOptions, function(err) {
        req.flash('success', { msg: 'Votre mot de passe a bien été changé.' });
        res.redirect('/account');
      });
    }
  ]);
};
