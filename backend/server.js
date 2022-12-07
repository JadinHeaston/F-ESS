const express = require('express');
const filesystem = require('fs');
const session = require('express-session'); //Starting session.
const actions = require('./actions.js');

const fess_app = express(); //Creating an express application.
const default_port = 80; // default port to listen

const cookieExpiration = 1000 * 60 * 60 * 24 * 30; //One month.

//Setting session secret.
try {
    var environment = JSON.parse(filesystem.readFileSync('./backend/environment.json').toString()); //Loading in credentials.
    //Enabling session.
    fess_app.use(session({
        secret: environment.session_secret,
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: cookieExpiration,
            sameSite: "lax",
            secure: false
        }
    }));
} catch (err) {
    console.log(err);
}



fess_app.all('/', async function (req, res) {
    fess_app.use(express.static('frontend')); //Setting root directory for front-end work.

    //Show UI.
    res.send(await actions.readIndexHTML());
});


fess_app.post('/change-status', async function (req, res) {
    let result = await actions.changeClockStatus();
    res.send(result);
    
    //Setting session information.
    sessionData = req.session;
    sessionData.clockStatus = result.status;
    sessionData.clockTime = result.time;
});

fess_app.post('/get-status', async function (req, res) {
    let result = await actions.getClockStatus();
    res.send(result);

    //Setting session information.
    sessionData = req.session;
    sessionData.clockStatus = result.status;
    sessionData.clockTime = result.time;
});

var server = fess_app.listen(default_port, function () {
    const server_information = server.address();

    console.log("FESS listening at http://%s:%s", server_information.address, server_information.port);
});