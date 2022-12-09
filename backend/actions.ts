import { readFileSync } from 'fs';
import * as puppeteer from 'puppeteer';
import { ElementHandle } from 'puppeteer';

const headlessMode = true; //Debugging. False will show the browser window.
const PAGE_TIMEOUT = 10000; //10 Seconds. Defines how long until the puppeteer page times out.


//Loading in options.

interface environmentHandle {
    login_page: string,
    session_secret: string,
    port: string
}

interface scrapedData {
    status?: string,
    time?: string,
    payPeriodInfo?: string,
}

interface sessionHandle {
    clockStatus: string,
    clockTime: string,
    credentialsValid: boolean,
    username: string,
    password: string,
    payPeriodInfo: string,
}

//Setting constants for the first page (ESS login).
interface UIElements {
    usernameField: string,
    passwordField: string,
    submitButton: string,

    availableTimeSelector: string,
    earnedTimeSelector: string,
    launchExecutimeLink: string,

    clockInButton: string,
    clockOutButton: string,
    clockStatusSelector: string,
    currentTime: string,
}

//Defining the path that the browser will take to accomplish it's goal.
const UIelements: UIElements = {
    //Setting constants for the first page (ESS Login)
    usernameField: '#ctl00_ctl00_PrimaryPlaceHolder_ContentPlaceHolderMain_LoginControl_LogInServerControl_UserName',
    passwordField: '#ctl00_ctl00_PrimaryPlaceHolder_ContentPlaceHolderMain_LoginControl_LogInServerControl_Password',
    submitButton: '#ctl00_ctl00_PrimaryPlaceHolder_ContentPlaceHolderMain_LoginControl_LogInServerControl_LogInButton',

    //Setting constants for the second page (ESS).
    launchExecutimeLink: '#ctl00_ctl00_PrimaryPlaceHolder_ContentPlaceHolderMain_launchExecuTimeLink',
    //Setting constants for getting time information.
    availableTimeSelector: '#ctl00_ctl00_PrimaryPlaceHolder_ContentPlaceHolderMain_TimeOffUpdatePanel td:not([class]',
    earnedTimeSelector: '#ctl00_ctl00_PrimaryPlaceHolder_ContentPlaceHolderMain_TimeOffUpdatePanel td.maximum',

    //Setting constants for the third page (Executime).
    clockInButton: '#clockInBtn', //#clockInBtn
    clockOutButton: '#clockOutBtn', //#clockOutBtn
    clockStatusSelector: '#AvailabilityStatusChange > p > span',
    currentTime: '#headerTime',
}

interface webpage {
    browser: puppeteer.Browser | null,
    page: puppeteer.Page | null
}

export async function changeClockStatus(sessionHandle: sessionHandle, environmentHandle: environmentHandle): Promise<scrapedData | false>
{
    let webpage = await createWebPage();

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
    let webpage = await createWebPage()

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

    let executimeData = await getExecutimeTimeStatus(webpage); //Scraping the time and status.

    //Close the page and browser.
    await webpage.page.close();
    await webpage.browser.close();

    return executimeData;
}

//Scrape the Exucutime homepage, returning the status and current time shown on the page.
async function getExecutimeTimeStatus(webpage: webpage): Promise<scrapedData> {
    //Getting status.
    let statusElement: ElementHandle = await webpage.page.waitForSelector(UIelements.clockStatusSelector);
    let statusValue = await (await statusElement.getProperty('textContent')).jsonValue();

    //Getting time.
    let timeElement: ElementHandle = await webpage.page.waitForSelector(UIelements.currentTime);
    let timeValue: string = await (await timeElement.getProperty('textContent')).jsonValue();

    timeValue = timeValue.replace("document.write(moment().format('dddd, MMMM Do YYYY h:mm:ss A'))", ''); //Remove unnecessary JS left in by reading before JS is loaded on the page.

    let executimeData: scrapedData = {
        status: (statusValue !== null ? statusValue : 'ERROR. STATUS NOT FOUND.'),
        time: ((timeValue !== null) ? timeValue : 'ERROR. TIME NOT FOUND.')
    };

    return executimeData;
}

//Changes the status of being clocked in/out.
async function performClockChangeAction(webpage: webpage): Promise<scrapedData> {
    let statusElement: ElementHandle = await webpage.page.waitForSelector(UIelements.clockStatusSelector);
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
    let timeElement: ElementHandle = await webpage.page.waitForSelector(UIelements.currentTime);
    let timeValue = await (await timeElement.getProperty('textContent')).jsonValue();
    executimeData.time = ((timeValue !== null) ? timeValue : 'ERROR. TIME NOT FOUND.')

    await webpage.page.waitForNavigation({ waitUntil: 'networkidle0' }); //Wait for the page to change...

    //Get the new, updated, status.
    statusElement = await webpage.page.waitForSelector(UIelements.clockStatusSelector);
    statusValue = await (await statusElement.getProperty('textContent')).jsonValue();
    executimeData.status = (statusValue !== null ? statusValue : 'ERROR. STATUS NOT FOUND.')

    return executimeData;
}

export async function getClockStatus(sessionHandle: sessionHandle, environmentHandle: environmentHandle): Promise<scrapedData | false>
{
    let webpage = await createWebPage();
    
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
    let statusElement: ElementHandle = await webpage.page.waitForSelector(UIelements.clockStatusSelector);
    let statusValue: string = await (await statusElement.getProperty('textContent')).jsonValue();

    //Getting time.
    let timeElement: ElementHandle = await webpage.page.waitForSelector(UIelements.currentTime);
    let timeValue: string = await (await timeElement.getProperty('textContent')).jsonValue();

    timeValue = timeValue.replace("document.write(moment().format('dddd, MMMM Do YYYY h:mm:ss A'))", ''); //Remove unnecessary JS.
    
    console.log(timeValue);

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

    let webpage = await createWebPage();
    let ESSResult = await ESSLogin(webpage, environmentHandle, sessionHandle); //Log into ESS.

    //Close the page and browser.
    await webpage.page.close();
    await webpage.browser.close();

    sessionHandle.credentialsValid = (ESSResult === false ? false : true); //Save the status in a session.
    
    if (ESSResult === false)
        return false;
    else
        return true;
}

async function createWebPage(): Promise<webpage> {
    let webpage: webpage = {
        browser: await puppeteer.launch({
            headless: headlessMode, 
            defaultViewport: null,
        }),
        page: null
    }

    //Create a new page.
    webpage.page = await webpage.browser.newPage();
    webpage.page.setDefaultTimeout(PAGE_TIMEOUT);
    webpage.page.setRequestInterception(true); //Disables any caching. :(

    //Creating request listener to block unnecessary requests.
    webpage.page.on('request', (request) => {
        // Block anything that isn't HTML or JS.
        if (request.resourceType() !== 'xhr' && request.resourceType() !== 'document' && request.resourceType() !== 'script')
            request.abort();
        else
            request.continue();
    });

    return webpage;
}

async function ESSLogin(webpage: webpage, environmentHandle: environmentHandle, sessionHandle: sessionHandle): Promise<puppeteer.Page | false> {
    await webpage.page.goto(environmentHandle.login_page); //Go to the login page.

    //Type the username and password.
    await webpage.page.type(UIelements.usernameField, sessionHandle.username.toString());
    await webpage.page.type(UIelements.passwordField, sessionHandle.password.toString());

    //Submit the credentials.
    Promise.all([
        webpage.page.click(UIelements.submitButton),
        await webpage.page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    ]);

    //Check if they worked...

    return webpage.page;
}

async function openExecutime(webpage: webpage): Promise<puppeteer.Page | false>
{
    //Clicking the launch executime link.
    await Promise.all([
        webpage.page.click(UIelements.launchExecutimeLink),
        webpage.page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    ]);

    return webpage.page;
}

export async function readIndexHTML(): Promise<string> {
    var HTMLOutput: string = '';
    
    HTMLOutput = HTMLOutput.concat(readFileSync('./frontend/index.html').toString());

    return HTMLOutput;
}


// async function collectionInformation(page: any) {
//     page.waitForNavigation({ waitUntil: 'networkidle0' });
    
//     let timeInformation: ElementHandle[] = await page.waitForSelector(elements.clockStatusSelector);
//     // let clockStatusValue: string | null = await timeInformation.;

//     await page.evaluate(() => {
//         let elements = $('a.showGoals').toArray();
//         for (let iterator = 0; iterator < elements.length; ++iterator) {
//             page.click(elements[iterator]);
//         }
//     });
// }