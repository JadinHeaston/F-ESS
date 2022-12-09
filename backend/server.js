const compression = require('compression')
const express = require('express');
const session = require('express-session');
	const sessionFileStore = require('session-file-store')(session);
const actions = require('./actions.js');
const { exit } = require('process');

//Setting session secret.
try {
	var environmentHandle = {
		login_page: process.env.LOGIN_PAGE,
		session_secret: process.env.SESSION_SECRET,
		port: process.env.PORT
	}
} catch (err) {
	console.log(err);
	exit(1); //Die!
}

const fess_app = express(); //Creating an express application.
const listening_port = environmentHandle.port; // Port to listen on.
const sessionExpiration = 1000 * 60 * 60 * 24 * 7 * 4; //One month (in ms)
// const sessionExpirationClearing = 1000 * 60 * 60 * 24 * 7; //One week.

//Enabling compression
fess_app.use(compression({ level: 9 }))

//Enabling sessions.
fess_app.use(session({
	cookie: {
		maxAge: sessionExpiration,
		sameSite: 'strict',
		secure: false,
		httpOnly: false,
	},
	resave: false, //False helps prevent race conditions.
	saveUninitialized: true,
	secret: environmentHandle.session_secret,
	store: new sessionFileStore({
		fileExtension: ".sesh",
		logFn: function(){},
		path: "./backend/sessions/",
		secret: environmentHandle.session_secret, //Ensuring the sessions are encrypted.
		ttl: sessionExpiration,
	})
}));

//Setting POST data to be interpreted as JSON.
fess_app.use(express.json());

fess_app.get('/', async function (req, res) {
	fess_app.use(express.static('frontend')); //Setting root directory for front-end work.

	//Show UI.
	res.send(await actions.readIndexHTML());
});


fess_app.get('/logout', async function (req, res) {
	var userSession = req.session;
	userSession.destroy();

	//Show UI.
	res.redirect('/');
});

fess_app.get('/change-status', async function (req, res) {
	var userSession = req.session;
	if (userSession.credentialsValid !== true)
		return res.status(401).send('Credential Failure');

	let result; //Init

	try {
		result = await actions.changeClockStatus(userSession, environmentHandle);
	} catch (error) {
		res.status(500).send('Action Failed');
		console.log('Error: ' + error);
		return;
	}
	res.send(result);

	//Saving information
	userSession.clockStatus = result.status;
	userSession.clockTime = result.time;
});

fess_app.get('/get-status', async function (req, res) {
	var userSession = req.session;
	// console.log(req.sessionID);
	if (userSession.credentialsValid !== true)
		return res.status(401).send('Credential Failure');

	let result; //Init

	try {
		result = await actions.getClockStatus(userSession, environmentHandle);
	} catch (error) {
		res.status(500).send('Action Failed');
		console.log(error);
		return;
	}

	//Saving information
	userSession.clockStatus = result.status;
	userSession.clockTime = result.time;
	res.send(result);
});

fess_app.post('/authenticate', async function (req, res) {
	var userSession = req.session;
	// console.log(req.sessionID);
	//Initializing information
	userSession.credentialsValid = false;
	userSession.username = req.body.username;
	userSession.password = req.body.password;

	try {
		result = await actions.validateESSCredentials(environmentHandle, userSession);
	} catch (error) {
		res.status(500).send('Action Failed');
		console.log(error);
		return;
	}

	if (result === false)
		return res.status(401).send('Authentication Failure!');
	else {
		//Saving information
		userSession.credentialsValid = true;

		//Returning.
		return res.status(200).send('Authenticated!');
	}


});

fess_app.get('/retrieve-data', async function (req, res) {
	var userSession = req.session;
	// console.log(req.sessionID);
	if (userSession.credentialsValid !== true)
		return res.status(401).send('Credential Failure');

	try {
		result = await actions.getAllData(userSession, environmentHandle);
	} catch (error) {
		res.status(500).send('Action Failed');
		console.log(error);
		return;
	}

	if (result === false) {
		//LOSER ALERT.
		console.log('Data retrieval failure.');
	}
	else {
		userSession.payPeriodInfo = result.payPeriodInfo;
		userSession.clockStatus = result.status;
		userSession.clockTime = result.time;
		userSession.save();
		return res.status(200).send(result);
	}

});


var server = fess_app.listen(listening_port, function () {
	const server_information = server.address();

	console.log("FESS listening at http://%s:%s", server_information.address, server_information.port);
});

fess_app.on('uncaughtException', function (err) {
	console.log('Caught exception: ' + err);
});