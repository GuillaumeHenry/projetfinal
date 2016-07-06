var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var mongoose = require('mongoose');

var schemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true
  }
};

var userSchema = new mongoose.Schema({
  name: String,
  prenom: String,
  pseudo: String,
  email: { type: String, unique: true},
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  gender: String,
  age: Number,
  location: String,
  website: String,
  picture: String,
  photo:  String,
  facebook: String,
  twitter: String,
  google: String,
  vk: String
}, schemaOptions);

userSchema.pre('save', function(next) {
  var user = this;
  if (!user.isModified('password')) { return next(); }
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(user.password, salt, null, function(err, hash) {
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(password, cb) {
  bcrypt.compare(password, this.password, function(err, isMatch) {
    cb(err, isMatch);
  });
};

var User = mongoose.model('User', userSchema);



module.exports = User;
