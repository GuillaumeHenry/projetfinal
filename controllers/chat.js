var User = require('../models/User');

var membres = [];
/**
 * GET /
 */
exports.chatGet = function(req, res) {
    User.findOne({email:req.body.email}, function (err, user) {
        res.render('chat', {
            title: 'Chat',
            user : user
        });
    });
       
    
};
