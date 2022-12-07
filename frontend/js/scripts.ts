console.log(Date());

interface FunctionLock {
    [key: string]: boolean;
}

interface UIResponseData {
    status: string,
    time: string,
    payPeriodData: object
}

//Contains keys for each function that should not have more than one instance running at a time.
//False indicates that the function is NOT in use, and is okay to continue.
var functionLock: FunctionLock =
{
    changeStatus: false,
    getStatus: false
}

document.addEventListener('DOMContentLoaded', function (event) {
    initializeListeners();
    initialize();
    // getStatus(); //Getting initial status.
});

async function initializeListeners(): Promise<void> {
    document.getElementById('change-status').addEventListener('click', changeStatus);
    document.getElementById('get-status').addEventListener('click', getStatus);
    document.getElementById('main-menu-button').addEventListener('click', changeMainMenuState);
}

async function initialize(): Promise<void> {
    if (functionLock.getStatus === true) //Function lock to prevent running the same function multiple times. 
        return;
    functionLock.getStatus = true;
    
    logMessage('Initializing...');

    const xhttp = new XMLHttpRequest();
    xhttp.onload = function () {
        functionLock.getStatus = false; //Unlocking functions.
        if (this.status !== 200)
        {
            document.getElementById('clock-status').innerText = 'Server Failure';
            document.getElementById('clock-status').setAttribute('data-status', 'Failure')
            document.getElementById("current-time").innerHTML = 'Failure';
            logMessage('Failed to initialize. Please try again.');
            
            return false;
        }
        
        let UIresponse: UIResponseData = JSON.parse(this.responseText); //Saving json response.
        updateUI(UIresponse);

        logMessage('Initialized!');
    }
    xhttp.open("POST", "/retrieve-data", true);
    xhttp.send();
    document.getElementById('clock-status').innerHTML = 'Updating...';
    document.getElementById('clock-status').setAttribute('data-status', 'Updating');
    document.getElementById("current-time").innerHTML = 'Updating...';
}

async function updateUI(UIresponse: UIResponseData): Promise<void> {
    //Setting the clock status.
    document.getElementById('clock-status').innerHTML = UIresponse.status;
    document.getElementById('clock-status').setAttribute('data-status', UIresponse.status);
    //Setting the time checked.
    document.getElementById("current-time").innerHTML = 'Checked: ' + UIresponse.time;
    
}

async function getStatus(): Promise<void> {
    if (functionLock.getStatus === true) //Function lock to prevent running the same function multiple times. 
        return;
    functionLock.getStatus = true;

    logMessage('Getting status...');

    const xhttp = new XMLHttpRequest();
    xhttp.onload = function () {
        functionLock.getStatus = false; //Unlocking functions.
        if (this.status !== 200)
        {
            document.getElementById('clock-status').innerText = 'Server Failure';
            document.getElementById('clock-status').setAttribute('data-status', 'Failure')
            document.getElementById("current-time").innerHTML = 'Failure';
            logMessage('Server failure. Please try again.');
            
            return false;
        }
        
        let response = JSON.parse(this.responseText); //Saving json response.
        document.getElementById('clock-status').innerHTML = response.status;
        document.getElementById('clock-status').setAttribute('data-status', response.status)
        document.getElementById("current-time").innerHTML = 'Checked: ' + response.time;

        logMessage('Status: ' + response.status.bold());
    }
    xhttp.open("POST", "/get-status", true);
    xhttp.send();
    document.getElementById('clock-status').innerHTML = 'Updating...';
    document.getElementById('clock-status').setAttribute('data-status', 'Updating');
    document.getElementById("current-time").innerHTML = 'Updating...';
}

async function changeStatus(): Promise<void> {
    if (functionLock.changeStatus === true) //Function lock to prevent running the same function multiple times. 
        return;
    functionLock.changeStatus = true;

    logMessage('Changing status...');

    const xhttp = new XMLHttpRequest();
    xhttp.onload = function () {
        functionLock.changeStatus = false; //Unlocking functions.
        if (this.status !== 200)
        {
            document.getElementById('clock-status').innerText = 'Server Failure';
            document.getElementById('clock-status').setAttribute('data-status', 'Failure')
            document.getElementById("current-time").innerHTML = 'Failure';
            logMessage('Server failure. Please try again.');
            
            return false;
        }
        
        let response = JSON.parse(this.responseText); //Saving json response.
        document.getElementById('clock-status').innerText = response.status;
        document.getElementById('clock-status').setAttribute('data-status', response.status)
        document.getElementById("current-time").innerHTML = 'Checked: ' + response.time;

        logMessage('Status set to ' + response.status.bold() + ' at ' + response.time.bold());
    }
    xhttp.open("POST", "/change-status", true);
    xhttp.send();
    document.getElementById('clock-status').innerText = 'Updating...';
    document.getElementById('clock-status').setAttribute('data-status', 'Updating');
    document.getElementById("current-time").innerHTML = 'Updating...';
}

//Appends a message to the log console.
function logMessage(message: string): void {
    document.getElementById('log-content').innerHTML = document.getElementById('log-content').innerHTML + message + '<br>'; //Appending the message.
}


function changeMainMenuState(): void {
    //Get the main menu 
    let mainMenu = document.getElementById('main-menu');

    //Verify the element was found. - It should be.
    if (mainMenu === null)
        return;

    //Check what state the main menu is and update it.
    if (mainMenu.classList.contains('visible') === false) {
        mainMenu.classList.add('visible'); //Showing the menu.

        //Changing color of main-menu-icon.
        let mainMenuButton = document.getElementById('main-menu-button');
        if (mainMenuButton === null)
            return;

        if (mainMenuButton.classList.contains('activated') === false)
            mainMenuButton.classList.add('activated');
    }
    else {
        mainMenu.classList.remove('visible');

        //Changing color of main-menu-icon.
        let mainMenuButton = document.getElementById('main-menu-button');
        if (mainMenuButton === null)
            return;

        if (mainMenuButton.classList.contains('activated') === true)
            mainMenuButton.classList.remove('activated');

    }
}

//USAGE: waitForElm('<SELECTOR>').then((elm) => {<FUNCTION>});
function waitForElm(selector: string) {
    return new Promise<Element | null>(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}