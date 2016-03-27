var express = require('express');
var router = express.Router();
var passport = require('passport');
var SteamStrategy = require('passport-steam').Strategy;
passport.serializeUser(function (user, done) {
	done(null, user);
});

passport.deserializeUser(function (obj, done) {
	done(null, obj);
});

passport.use(new SteamStrategy({ returnURL: 'http://steam.dev:3000/auth/steam/return', realm: 'http://steam.dev:3000/', apiKey: '0DC8C5171588E11BB048C220D830B44F' }, function (identifier, profile, done) {
	process.nextTick(function () {
		profile.identifier = identifier;
		return done(null, profile);
	});
}));


function renderHomePage(req, res) {
	var serverName = process.env.VCAP_APP_HOST ? process.env.VCAP_APP_HOST + ":" + process.env.VCAP_APP_PORT : 'localhost:3000';
	
	//save user from previous session (if it exists)
	var user = req.session.user;
	//regenerate new session & store user from previous session (if it exists)
	req.session.regenerate(function (err) {
		req.session.user = user;
		console.log('req.session.user ' + req.session.user);
		res.render('index', { title: 'Express', server: serverName, user: req.session.user });
	});
}

/* GET home page. */
router.get('/', renderHomePage);
router.post('/user', function (req, res) {
	req.session.user = req.body.user;//set username to session
	renderHomePage(req, res);
});
router.get('/logout', function (req, res) {
	req.logout();
	req.session.destroy();
	res.redirect('/');
});

/* STEAM */
router.get('/account', ensureAuthenticated, function (req, res) {
	res.render('account', { user: req.user });
});

router.get('/auth/steam', passport.authenticate('steam', { failureRedirect: '/' }), function (req, res) {
	res.redirect('/');
});

router.get('/auth/steam/return', passport.authenticate('steam', { failureRedirect: '/' }), function (req, res) {
	req.session.user = req.user.displayName;
	res.redirect('/');
});

// catch 404 and forward to error handler
router.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) { return next(); }
	res.redirect('/');
}

module.exports = router;
