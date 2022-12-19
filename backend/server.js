const compression = require('compression')
const express = require('express');
const session = require('express-session');
	const sessionFileStore = require('session-file-store')(session);
const actions = require('./actions.js');
const { exit } = require('process');
const { setTimeout } = require('timers/promises');

//Setting session secret.
try {
	var environmentHandle = {
		login_page: process.env.LOGIN_PAGE,
		port: process.env.PORT,
		session_secret: process.env.SESSION_SECRET,
		user_agent: process.env.USER_AGENT
	}
} catch (err) {
	console.log(err);
	exit(1); //Die!
}

const fess_app = express(); //Creating an express application.
const listening_port = environmentHandle.port; // Port to listen on.
const sessionExpiration = 1000 * 60 * 60 * 24 * 7 * 4; //One month (in ms)
const sessionExpirationClearing = 1 * 60 * 60 * 24 * 7; //One week (in seconds)

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
	name: 'fess.sid',
	resave: true, //False helps prevent race conditions.
	saveUninitialized: true,
	rolling: true,
	unset: 'destroy',
	secret: environmentHandle.session_secret,
	store: new sessionFileStore({
		fileExtension: ".sesh",
		path: "./backend/sessions/",
		secret: environmentHandle.session_secret, //Ensuring the sessions are encrypted.
		ttl: sessionExpiration,
		reapInterval: sessionExpirationClearing,
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
	req.session.destroy();

	//Show UI.
	res.redirect('/');
});

fess_app.get('/change-status', async function (req, res) {	
	if (req.session.credentialsValid !== true)
		return res.status(401).send('Credential Failure')
	
	let result; //Init

	try {
		result = await actions.changeClockStatus(req.session, environmentHandle);
	} catch (error) {
		console.log('Error: ' + error);
		res.status(500).send('Action Failed');
		return;
	}

	//Saving information
	req.session.clockStatus = result.status;
	req.session.clockTime = result.time;
	req.session.save();
	await setTimeout(100); //Delay is required to ensure the session gets saved.
	
	res.send(result);
});

fess_app.get('/get-status', async function (req, res) {	
	if (req.session.credentialsValid !== true)
		return res.status(401).send('Credential Failure')

	let result; //Init

	try {
		result = await actions.getClockStatus(req.session, environmentHandle);
	} catch (error) {
		console.log(error);
		res.status(500).send('Action Failed');
		return;
	}

	//Saving information
	req.session.clockStatus = result.status;
	req.session.clockTime = result.time;
	req.session.save();
	await setTimeout(100); //Delay is required to ensure the session gets saved.


	res.send(result);
});

fess_app.post('/authenticate', async function (req, res) {
	//Initializing information
	req.session.credentialsValid = false;
	req.session.username = req.body.username;
	req.session.password = req.body.password;
	req.session.save()
	var result;

	try {
		result = await actions.validateESSCredentials(environmentHandle, req.session);
	} catch (error) {
		console.log(error);
		res.status(500).send('Action Failed');
		return;
	}

	if (result === false)
		return res.status(401).send('Authentication Unsuccessful. Credentials rejected.');
	else {
		//Saving information
		req.session.credentialsValid = true;
		req.session.save();
		await setTimeout(100); //Delay is required to ensure the session gets saved.

		//Returning.
		res.status(200).send('Authenticated Successfully!');
	}


});

fess_app.get('/retrieve-data', async function (req, res) {
	if (req.session.credentialsValid !== true)
		return res.status(401).send('Credential Failure');

	var result;
	
	try {
		result = await actions.getAllData(req.session, environmentHandle);
	} catch (error) {
		console.log(error);
		res.status(500).send('Action Failed');
		return;
	}

	if (result === false) {
		//LOSER ALERT.
		console.log('Data retrieval failure.');
	}
	else {
		req.session.payPeriodInfo = result.payPeriodInfo;
		req.session.clockStatus = result.status;
		req.session.clockTime = result.time;
		req.session.save();
		await setTimeout(100); //Delay is required to ensure the session gets saved.
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