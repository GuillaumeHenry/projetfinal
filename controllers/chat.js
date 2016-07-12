var User = require('../models/User');

/**
 * GET /chat
 */
exports.chatGet = function (req, res) {
    res.render('chat', {
        title: 'Chat'
    });
};
