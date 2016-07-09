var User = require('../models/User');

/**
 * GET /chat
 */
exports.chatGet = function(req, res) {
    User.findOne({email:req.body.email}, function (err, user) {
        res.render('chat', {
            title: 'Chat',
            user : user
        });
    });
};
