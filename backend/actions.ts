import { readFileSync } from 'fs';
import * as puppeteer from 'puppeteer';


const headlessMode = true; //Debugging. False will show the browser window.
const PAGE_TIMEOUT = 30000; //30 Seconds. Defines how long until the puppeteer page times out.
// const ACTION_DELAY = 2000; //2 Seconds. Adds a delay to puppeteer actions.


//Defining the path that the browser will take to accomplish it's goal.
const UIelements: UIElements = {
    //Setting constants for the first page (ESS Login)
    usernameField: '#ctl00_ctl00_PrimaryPlaceHolder_ContentPlaceHolderMain_LoginControl_LogInServerControl_UserName',
    passwordField: '#ctl00_ctl00_PrimaryPlaceHolder_ContentPlaceHolderMain_LoginControl_LogInServerControl_Password',
    submitButton: '#ctl00_ctl00_PrimaryPlaceHolder_ContentPlaceHolderMain_LoginControl_LogInServerControl_LogInButton',

    //Setting constants for the second page (ESS).
    launchExecutimeLink: '#ctl00_ctl00_PrimaryPlaceHolder_ContentPlaceHolderMain_launchExecuTimeLink',
    //Setting constants for getting time information.
    timeLabelSelector: '#ctl00_ctl00_PrimaryPlaceHolder_ContentPlaceHolderMain_TimeOffUpdatePanel tr:not(:first-child) td:not([class])',
    availableTimeSelector: '#ctl00_ctl00_PrimaryPlaceHolder_ContentPlaceHolderMain_TimeOffUpdatePanel td:not([class]) > span.complete',
    earnedTimeSelector: '#ctl00_ctl00_PrimaryPlaceHolder_ContentPlaceHolderMain_TimeOffUpdatePanel td.maximum > span',

    //Setting constants for the third page (Executime).
    clockInButton: '#clockInBtn', //#clockInBtn
    clockOutButton: '#clockOutBtn', //#clockOutBtn
    clockStatusSelector: '#AvailabilityStatusChange > p > span',
    currentTime: '#headerTime',
}


export async function changeClockStatus(sessionHandle: sessionHandle, environmentHandle: environmentHandle): Promise<scrapedData | false>
{
    let webpage = await createWebPage(environmentHandle);

    //Log into ESS.
    let ESSResult = await ESSLogin(webpage, environmentHandle, sessionHandle);
    if (ESSResult === false)
        return false;
    webpage.page = ESSResult;

    //Opening executime
    let executimeResult = await openExecutime(webpage); //Navigating to Executime.
    if (executimeResult === false)
        return false;
    webpage.page = executimeResult;
    
    //Change the status test.
    const result = await performClockChangeAction(webpage); //Changing status.

    //Close the page and browser.
    await webpage.page.close();
    await webpage.browser.close();

    return result;
}

export async function getAllData(sessionHandle: sessionHandle, environmentHandle: environmentHandle): Promise<scrapedData | false> {
    let webpage = await createWebPage(environmentHandle)

    //Log into ESS.
    let ESSResult = await ESSLogin(webpage, environmentHandle, sessionHandle);
    if (ESSResult === false)
        return false;
    webpage.page = ESSResult;

    //Getting time off information.
    let timeOff = await getESSTimesheetData(webpage);

    //Opening executime
    let executimeResult = await openExecutime(webpage); //Navigating to Executime.
    if (executimeResult === false)
        return false;
    webpage.page = executimeResult

    // console.log(await webpage.page.content());
    let executimeData = await getExecutimeTimeStatus(webpage); //Scraping the time and status.
    executimeData.ESSTimeData = timeOff

    //Close the page and browser.
    await webpage.page.close();
    await webpage.browser.close();

    return executimeData;
}

async function getESSTimesheetData(webpage: webpage): Promise<ESSTimeData> {

    await Promise.all([
        webpage.page.waitForSelector(UIelements.timeLabelSelector),
        webpage.page.waitForSelector(UIelements.availableTimeSelector),
        webpage.page.waitForSelector(UIelements.earnedTimeSelector),
    ]);
    let ESSTimeData = await webpage.page.evaluate(parseESSTimesheetData, UIelements);

    return ESSTimeData;
}

//Simply gathers the table data.
function parseESSTimesheetData(UIelements: UIElements): ESSTimeData {
    function removeChildrenNodes(parent: Node) {
        console.log(parent);
        while (parent.lastChild && parent.lastChild.nodeType !== 3) {
            parent.removeChild(parent.lastChild);
        }
    }

    return {
        availableTime: Array.from(document.querySelectorAll(UIelements.availableTimeSelector), element => element.textContent),
        earnedTime: Array.from(document.querySelectorAll(UIelements.earnedTimeSelector), element => element.textContent),
        label: Array.from(document.querySelectorAll(UIelements.timeLabelSelector), function (element) {removeChildrenNodes(element); return element.textContent}),
    };
}

//Scrape the Exucutime homepage, returning the status and current time shown on the page.
async function getExecutimeTimeStatus(webpage: webpage): Promise<scrapedData> {
    //Getting status.
    let statusElement = await webpage.page.waitForSelector(UIelements.clockStatusSelector);
    let statusValue = await (await statusElement.getProperty('textContent')).jsonValue();

    //Getting time.
    let timeElement = await webpage.page.waitForSelector(UIelements.currentTime);
    let timeValue = await (await timeElement.getProperty('textContent')).jsonValue();

    timeValue = timeValue.replace("document.write(moment().format('dddd, MMMM Do YYYY h:mm:ss A'))", ''); //Remove unnecessary JS left in by reading before JS is loaded on the page.

    let executimeData: scrapedData = {
        status: (statusValue !== null ? statusValue : 'ERROR. STATUS NOT FOUND.'),
        time: ((timeValue !== null) ? timeValue : 'ERROR. TIME NOT FOUND.')
    };

    return executimeData;
}

//Changes the status of being clocked in/out.
async function performClockChangeAction(webpage: webpage): Promise<scrapedData> {
    let statusElement = await webpage.page.waitForSelector(UIelements.clockStatusSelector);
    let statusValue = await (await statusElement.getProperty('textContent')).jsonValue();

    //Init.
    let executimeData: scrapedData = {
        status: (statusValue !== null ? statusValue : 'ERROR. STATUS NOT FOUND.'),
        time: ''
    };

    //Check what the current status is and change it.
    if (executimeData.status === 'Clocked Out')
        await webpage.page.click(UIelements.clockInButton);
    else if (executimeData.status === 'Clocked In')
        await webpage.page.click(UIelements.clockOutButton);
    else
        return executimeData;

    //Getting the time.
    let timeElement = await webpage.page.waitForSelector(UIelements.currentTime);
    let timeValue = await (await timeElement.getProperty('textContent')).jsonValue();
    executimeData.time = ((timeValue !== null) ? timeValue : 'ERROR. TIME NOT FOUND.')

    await webpage.page.waitForNavigation(); //Wait for the page to change...

    //Get the new, updated, status.
    statusElement = await webpage.page.waitForSelector(UIelements.clockStatusSelector);
    statusValue = await (await statusElement.getProperty('textContent')).jsonValue();
    executimeData.status = (statusValue !== null ? statusValue : 'ERROR. STATUS NOT FOUND.')

    return executimeData;
}

export async function getClockStatus(sessionHandle: sessionHandle, environmentHandle: environmentHandle): Promise<scrapedData | false>
{
    let webpage = await createWebPage(environmentHandle);
    
    //Log into ESS.
    let ESSResult = await ESSLogin(webpage, environmentHandle, sessionHandle);
    if (ESSResult === false)
        return false;
    webpage.page = ESSResult;

    //Change the status test.
    let executimeResult = await openExecutime(webpage); //Navigating to Executime.
    if (executimeResult === false)
        return false;
    webpage.page = executimeResult;

    //Getting status.
    let statusElement = await webpage.page.waitForSelector(UIelements.clockStatusSelector);
    let statusValue = await (await statusElement.getProperty('textContent')).jsonValue();

    //Getting time.
    let timeElement = await webpage.page.waitForSelector(UIelements.currentTime);
    let timeValue = await (await timeElement.getProperty('textContent')).jsonValue();

    timeValue = timeValue.replace("document.write(moment().format('dddd, MMMM Do YYYY h:mm:ss A'))", ''); //Remove unnecessary JS.

    //Close the page and browser.
    await webpage.page.close();
    await webpage.browser.close();

    let executimeData: scrapedData = {
        status: (statusValue !== null ? statusValue : 'ERROR. STATUS NOT FOUND.'),
        time: ((timeValue !== null) ? timeValue : 'ERROR. TIME NOT FOUND.')
    };

    return executimeData;
}

export async function validateESSCredentials(environmentHandle: environmentHandle, sessionHandle: sessionHandle): Promise<boolean> {
    //Verify that the session is accessible.
    if (sessionHandle === undefined)
        return false;

    //Verify credentials were given.
    if (sessionHandle.username === undefined || sessionHandle.password === undefined)
        return false;

    let webpage = await createWebPage(environmentHandle);
    let ESSResult = await ESSLogin(webpage, environmentHandle, sessionHandle); //Log into ESS.

    //Close the page and browser.
    await webpage.page.close();
    await webpage.browser.close();


    sessionHandle.credentialsValid = (ESSResult === false ? false : true); //Save the status in a session.
    sessionHandle.save();
    setTimeout(()=>{}, 100); //Delay is required to ensure the session gets saved.
    
    if (ESSResult === false)
        return false;
    else
        return true;
}

async function createWebPage(environmentHandle: environmentHandle): Promise<webpage> {
    let webpage: webpage = {
        browser: await puppeteer.launch({
            headless: headlessMode,
        })
    }

    //Create a new page.
    webpage.page = await webpage.browser.newPage();
    webpage.page.setDefaultTimeout(PAGE_TIMEOUT);
    webpage.page.setUserAgent(environmentHandle.user_agent);
    webpage.page.setRequestInterception(true); //Allowing request blocking. Disables any caching. :(
    webpage.page.emulateTimezone(environmentHandle.timezone); //Setting timezone.

    //Creating request listener to block unnecessary requests.
    webpage.page.on('request', (request: { resourceType: () => string; abort: () => void; continue: () => void; }) => {
        // Block anything that isn't HTML or JS.
        if (request.resourceType() !== 'xhr' && request.resourceType() !== 'document' && request.resourceType() !== 'script')
            request.abort();
        else
            request.continue();
    });

    return webpage;
}

async function ESSLogin(webpage: webpage, environmentHandle: environmentHandle, sessionHandle: sessionHandle): Promise<puppeteer.Page | false> {
    await webpage.page.goto(environmentHandle.login_page, {waitUntil: 'domcontentloaded'}); //Go to the login page.

    await Promise.all([
        webpage.page.waitForSelector(UIelements.usernameField),
        webpage.page.waitForSelector(UIelements.passwordField),
        webpage.page.waitForSelector(UIelements.submitButton),
    ]);

    await webpage.page.type(UIelements.usernameField, sessionHandle.username.toString());
    await webpage.page.type(UIelements.passwordField, sessionHandle.password.toString());
    await webpage.page.type(UIelements.submitButton, String.fromCharCode(13)); //Pressing enter.
    let navigationResult = webpage.page.waitForNavigation(); //Create navigation promise.
    let result = await promiseWithTimeout(navigationResult, 1000, false); //Wait for a response or timeout.

    if (result !== false)
        return webpage.page;
    else
        return false;
}

async function openExecutime(webpage: webpage): Promise<puppeteer.Page | false>
{
    //Clicking the launch executime link.
    let executimeButton = await webpage.page.waitForSelector(UIelements.launchExecutimeLink);
    await executimeButton.press('Enter');
    let navigationResult = await webpage.page.waitForNavigation({waitUntil: 'networkidle0'}); //Create navigation promise.

    if (navigationResult !== false)
        return webpage.page;
    else
        return false;
}

export async function readIndexHTML(): Promise<string> {
    var HTMLOutput = '';
    
    HTMLOutput = HTMLOutput.concat(readFileSync('./frontend/index.html').toString());

    return HTMLOutput;
}

//Accepts a promise, a timeout, and a failure value.
//If the promise doesn't finish within that time, return the failure value. 
function promiseWithTimeout<T>(
    promise: Promise<T>,
    ms: number = 100,
    timeoutError: any = new Error('Promise timed out')
): Promise<T> {
    //Create a promise that rejects in milliseconds
    const timeout = new Promise<never>((reject) => {
        setTimeout(() => {
            reject(timeoutError);
        }, ms);
    });
    
    //Returns a race between timeout and the passed promise
    return Promise.race<T>([promise, timeout]);
}