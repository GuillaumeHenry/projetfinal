var User = require('../models/User');

/**
 * GET /chat
 */
exports.chatGet = function (req, res) {
    res.render('chat', {
        title: 'Chat'
    });
};

/**
 * GET /chat privé
 */
exports.chatPriveGet = function (req, res) {
    res.render('chatprive', {
        title: 'Chat privé'
    });
};
