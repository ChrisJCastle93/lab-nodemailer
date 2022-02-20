const passport      = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User          = require('../models/User');
const bcrypt        = require('bcryptjs');

passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback:true
  }, 
  (req, username, password, done) => {
    User.findOne({ username })
    .then(foundUser => {
      console.log(foundUser)
      console.log(typeof foundUser.password)
      if (!foundUser) {
        console.log('no found user')
        done(null, false, { message: 'Incorrect username' });
        return;
      }
      if (!bcrypt.compareSync(password, foundUser.password)) {
        console.log('password no match')
        done(null, false, { message: 'Incorrect password' });
        return;
      }
      console.log('password does match')
      req.session.currentUser = foundUser;
      return done(null, foundUser);
    })
    .catch(err => done(err));
  }
));
