console.log(Date());

interface FunctionLock {
    [key: string]: boolean;
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

    let username = document.getElementById('username-input') as HTMLInputElement;
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

    refreshData();
}

async function initializeListeners(): Promise<void> {
    document.getElementById('change-status').addEventListener('click', changeStatus);
    document.getElementById('get-status').addEventListener('click', refreshData);
    document.getElementById('main-menu-button').addEventListener('click', changeMainMenuState);
    document.getElementById('login-menu-toggle').addEventListener('click', changeLoginMenuState);
    document.getElementById('credential-submission-form').addEventListener('submit', authenticate);
}

async function changeLoginMenuState(): Promise<void> {
    //Get the main menu 
    let loginMenu = document.getElementById('login-menu');

    //Verify the element was found. - It should be.
    if (loginMenu === null)
        return;

    //Check what state the main menu is and update it.
    if (loginMenu.classList.contains('visible') === false) {
        loginMenu.classList.add('visible'); //Showing the menu.

        //Changing color of main-menu-icon.
        let loginToggle = document.getElementById('login-menu-toggle');
        if (loginToggle === null)
            return;

        if (loginToggle.classList.contains('activated') === false)
            loginToggle.classList.add('activated');
    }
    else {
        loginMenu.classList.remove('visible');

        //Changing color of main-menu-icon.
        let loginToggle = document.getElementById('login-menu-toggle');
        if (loginToggle === null)
            return;

        if (loginToggle.classList.contains('activated') === true)
            loginToggle.classList.remove('activated');
    }

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

    if (response.status === 401) {
        updateUIStatic('Unauthorized');
        logMessage('Unauthorized.');
        return;
    }
    else if (response.status !== 200) {
        updateUIStatic('Failure');
        logMessage('Failed to initialize. Please try again.');

        return;
    }

    let UIresponse: scrapedData = JSON.parse(await response.text()); //Saving json response.
    updateUI(UIresponse);

    logMessage('Data refreshed!');
    console.timeEnd();
}

async function updateUIStatic(condition: string) {
    if (condition === 'Failure') {
        document.getElementById('clock-status').textContent = 'Server Failure';
        document.getElementById('clock-status').setAttribute('data-status', 'Failure')
        document.getElementById("current-time").textContent = 'Failure';

        //Updating hour cards.
        document.querySelectorAll('#time-card-container .time-card-amount, #time-card-container .time-card-earned').forEach(element => {
            element.textContent = 'N/A';
        });
    }
    else if (condition === 'Unauthorized') {
        document.getElementById('clock-status').textContent = 'Unauthorized.';
        document.getElementById('clock-status').setAttribute('data-status', 'Unauthorized');
        document.getElementById("current-time").textContent = 'Unauthorized.';

        //Updating hour cards.
        document.querySelectorAll('#time-card-container .time-card-amount, #time-card-container .time-card-earned').forEach(element => {
            element.textContent = 'N/A';
        });


        //Opening login menu.
        changeLoginMenuState();
    }
    else if (condition === 'Update') {
        document.getElementById('clock-status').textContent = 'Updating...';
        document.getElementById('clock-status').setAttribute('data-status', 'Updating');
        document.getElementById("current-time").textContent = 'Updating...';

        //Updating hour cards.
        document.querySelectorAll('#time-card-container .time-card-amount, #time-card-container .time-card-earned').forEach(element => {
            element.textContent = '?';
        });
    }
}

async function updateUI(UIresponse: scrapedData): Promise<void> {
    //Setting the clock status.
    document.getElementById('clock-status').textContent = UIresponse.status;
    document.getElementById('clock-status').setAttribute('data-status', UIresponse.status);
    //Setting the time checked.
    document.getElementById("current-time").textContent = 'Checked: ' + UIresponse.time;

    //Updating hours.
    updateHourCards(UIresponse);
}

async function updateHourCards(UIresponse: scrapedData): Promise<void> {
    const cardLabelConversion = [
        '#vaca-card',
        '#fh-card',
        '#sick-card',
        '#comp-card',
        '#mili-card',
    ];

    for (let iterator = 0; iterator < UIresponse.ESSTimeData.label.length; iterator++) {
        document.querySelector(cardLabelConversion[iterator] + ' .time-card-amount').textContent = UIresponse.ESSTimeData.availableTime[iterator];
        document.querySelector(cardLabelConversion[iterator] + ' .time-card-earned').textContent = UIresponse.ESSTimeData.earnedTime[iterator];
    }
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
