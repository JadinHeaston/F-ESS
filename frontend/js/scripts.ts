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
    authenticate: false,
    changeStatus: false,
    getStatus: false
}

document.addEventListener('DOMContentLoaded', async function (event) {
    initializeListeners();
    refreshData();
});

async function authenticate(event: Event): Promise<void> {
    event.preventDefault();
    if (functionLock.authenticate === true) //Function lock to prevent running the same function multiple times. 
        return;
    functionLock.authenticate = true;

    logMessage('Authenticating...');

    let username: HTMLInputElement = document.getElementById('username-input') as HTMLInputElement;
    let password = document.getElementById('password-input') as HTMLInputElement;

    let data = {
        username: username.value,
        password: password.value
    };

    let response = await fetch('/authenticate', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    functionLock.authenticate = false; //Unlocking functions.

    if (response.status === 401) {
        logMessage('Unauthorized.');
        return;
    }
    else if (response.status !== 200) {
        logMessage('Failed to authenticate. Please try again.');
        return;
    }
    logMessage('Authenticated!');
    
    // refreshData();
}

async function initializeListeners(): Promise<void> {
    document.getElementById('change-status').addEventListener('click', changeStatus);
    document.getElementById('get-status').addEventListener('click', refreshData);
    document.getElementById('main-menu-button').addEventListener('click', changeMainMenuState);
    document.getElementById('credential-submission-form').addEventListener('submit', authenticate);
}

async function refreshData(): Promise<void> {
    if (functionLock.initialize === true) //Function lock to prevent running the same function multiple times. 
        return;
    functionLock.initialize = true;

    console.time();

    updateUIStatic('Update');
    logMessage('Refreshing data...');

    let response = await fetch('/retrieve-data', {
        method: 'get'
    });
    functionLock.initialize = false; //Unlocking function.

    if (response.status !== 200) {
        updateUIStatic('Failure');
        logMessage('Failed to initialize. Please try again.');

        return;
    }

    let UIresponse: UIResponseData = JSON.parse(await response.text()); //Saving json response.
    updateUI(UIresponse);

    logMessage('Data refreshed!');
    console.timeEnd();
}

async function updateUIStatic(condition: string) {
    if (condition === 'Update')
    {
        document.getElementById('clock-status').innerHTML = 'Updating...';
        document.getElementById('clock-status').setAttribute('data-status', 'Updating');
        document.getElementById("current-time").innerHTML = 'Updating...';
    }
    else if (condition === 'Failure')
    {
        document.getElementById('clock-status').innerText = 'Server Failure';
        document.getElementById('clock-status').setAttribute('data-status', 'Failure')
        document.getElementById("current-time").innerHTML = 'Failure';
    }

}

async function updateUI(UIresponse: UIResponseData): Promise<void> {
    //Setting the clock status.
    document.getElementById('clock-status').innerHTML = UIresponse.status;
    document.getElementById('clock-status').setAttribute('data-status', UIresponse.status);
    //Setting the time checked.
    document.getElementById("current-time").innerHTML = 'Checked: ' + UIresponse.time;

}

async function changeStatus(): Promise<void> {
    if (functionLock.changeStatus === true) //Function lock to prevent running the same function multiple times. 
        return;
    functionLock.changeStatus = true;

    logMessage('Changing status...');
    document.getElementById('clock-status').innerText = 'Updating...';
    document.getElementById('clock-status').setAttribute('data-status', 'Updating');
    document.getElementById("current-time").innerHTML = 'Updating...';

    let response = await fetch('/change-status', {
        method: 'get'
    });
    functionLock.changeStatus = false; //Unlocking function.

    if (response.status !== 200) {
        document.getElementById('clock-status').innerText = 'Server Failure';
        document.getElementById('clock-status').setAttribute('data-status', 'Failure')
        document.getElementById("current-time").innerHTML = 'Failure';
        logMessage('Server failure. Please try again.');

        return;
    }

    let responseData = JSON.parse(await response.text());

    document.getElementById('clock-status').innerText = responseData.status;
    document.getElementById('clock-status').setAttribute('data-status', responseData.status)
    document.getElementById("current-time").innerHTML = 'Checked: ' + responseData.time;

    logMessage('Status set to ' + responseData.status.bold() + ' at ' + responseData.time.bold());
}

//Appends a message to the log console.
async function logMessage(message: string): Promise<void> {
    document.getElementById('log-content').innerHTML = document.getElementById('log-content').innerHTML + message + '<br>'; //Appending the message.
}

async function changeMainMenuState(): Promise<void> {
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
