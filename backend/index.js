const express = require('express');
const fess_app = express();
const default_port = 80; // default port to listen


fess_app.use(express.static('frontend'));

fess_app.all('/', async function (req, res) {
    const actions = require('./actions.js');
    
    //Show UI.
    res.send(await actions.createUI());
});


fess_app.post('/change-status', async function (req, res) {
    const actions = require('./actions.js');
    let result = await actions.changeClockStatus();
    res.send(result);
});

var server = fess_app.listen(default_port, function () {
    const server_information = server.address();
    
    console.log("FESS listening at http://%s:%s", server_information.address, server_information.port);
})