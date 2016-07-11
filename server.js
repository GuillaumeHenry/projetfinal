if ((process.env.NODE_ENV || 'development') === 'development') {
  require('dotenv').load();
}
var express = require('express');
var path = require('path');
var logger = require('morgan');
var compression = require('compression');
var methodOverride = require('method-override');
var session = require('express-session');
var flash = require('express-flash');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var mongoose = require('mongoose');
var passport = require('passport');
var multer = require('multer');
var upload = multer({dest:'public/uploads/'});
var User = require('./models/User');


// Controllers
var HomeController = require('./controllers/home');
var userController = require('./controllers/user');
var contactController = require('./controllers/contact');
var chatController = require('./controllers/chat');
//var socketController = require('./controllers/socket');

// Passport OAuth strategies
require('./config/passport');

var app = express();

var server = require('http').Server(app);
var io = require('socket.io').listen(server);


mongoose.connect(process.env.MONGODB);
mongoose.connection.on('error', function() {
  console.log('Problème de connexion à Mongo. Assurez vous que MongoDB est bien démarré.');
  process.exit(1);
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('port', process.env.PORT || 3000);
app.use(compression());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(methodOverride('_method'));
app.use(session({ secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: true }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', HomeController.index);
app.get('/chat', userController.ensureAuthenticated, chatController.chatGet);
app.post('/rechercheUtilisateur', userController.ensureAuthenticated, userController.rechercheUtilisateur);
app.get('/account/:membre', userController.ensureAuthenticated, userController.membreGet);
app.post('/account/:membre', userController.ensureAuthenticated, userController.amisPost);
app.get('/contact', contactController.contactGet);
app.post('/contact', contactController.contactPost);
app.get('/wall', userController.ensureAuthenticated, userController.wallGet);
app.post('/wall', userController.ensureAuthenticated, userController.wallPost)
app.get('/account', userController.ensureAuthenticated, userController.accountGet);
app.put('/account', userController.ensureAuthenticated, userController.accountPut);
app.post('/upload', upload.single('photo'), userController.uploadPost);
app.delete('/account', userController.ensureAuthenticated, userController.accountDelete);
app.get('/signup', userController.signupGet);
app.post('/signup', userController.signupPost);
app.get('/login', userController.loginGet);
app.post('/login', userController.loginPost);
app.get('/forgot', userController.forgotGet);
app.post('/forgot', userController.forgotPost);
app.get('/reset/:token', userController.resetGet);
app.post('/reset/:token', userController.resetPost);
app.get('/logout', userController.logout);
app.get('/unlink/:provider', userController.ensureAuthenticated, userController.unlink);
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }));
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback', passport.authenticate('google', { successRedirect: '/', failureRedirect: '/login' }));
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { successRedirect: '/', failureRedirect: '/login' }));

//Developpement environment

// Production error handler
if (app.get('env') === 'production') {
  app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.sendStatus(err.status || 500);
  });
}




var numUsers = 0;

io.on('connection', function (socket) {

  //chat multi
  var addedUser = false;
  socket.on('message mur', function (data) {
    socket.broadcast.emit('nouveau message', {message:data});
  })
  socket.emit('connecteOuPas');
  
  socket.emit('connecte', {connecte:true});
  
  socket.on('ami ?', function () {
    socket.broadcast.emit('voulez vous', {question:'Vous avez reçu une demande de contact de'});
  });
  
  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
    socket.emit('deco', {connecte:false});
  });
});

server.listen(app.get('port'), function() {
  console.log('Ecoute du serveur express sur le port: ' + app.get('port'));
});

module.exports = app;
