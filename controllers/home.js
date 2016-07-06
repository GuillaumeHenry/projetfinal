var User = require('../models/User');

/**
 * GET /
 */

exports.index = function(req, res) {
  User.find(function (err, users) {
    if (err) return console.error(err);
    res.render('home', {
      title: 'Accueil',
      membres: users
    });
  });
};

