
import { readFileSync } from 'fs';
import * as puppeteer from 'puppeteer';
import { ElementHandle } from 'puppeteer';

//Loading in options.
interface environment {
    username: number,
    password: string,
    login_page: string,
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

interface ESSinformation {

}

interface executimeInformation {
    status: string,
    time: string,
}

//Defining the path that the browser will take to accomplish it's goal.
const elements: UIElements = {
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
    clockInButton: '#content_area', //#clockInBtn
    clockOutButton: '#content_area', //#clockOutBtn
    clockStatusSelector: '#AvailabilityStatusChange > p > span',
    currentTime: '#headerTime',
}

export async function changeClockStatus()
{
    console.time(); //Start the clock!

    //Getting login credentials.
    try {
        var environment: environment = JSON.parse(readFileSync('./backend/environment.json').toString()); //Loading in credentials.
    } catch (err) {
        console.log(err)
        
        let executimeData: executimeInformation = {
            status: 'Status: FAILURE - No credentials supplied.',
            time: Date(),
        };
        return executimeData;
    }

    //Debugging. False will show the browser window.
    const headlessMode = false;

    const browser = await puppeteer.launch({
        headless: headlessMode, 
        defaultViewport: null
    });

    //Create a new page.
    const page = await browser.newPage();

    //Change the status test.
    const result = await performClockChangeAction(page, elements, environment); //Changing status.
    console.timeEnd(); //Time!

    //Close the page and browser.
    await page.close();
    await browser.close();

    return result;
}



//Changes the status of being clock in/out.
async function performClockChangeAction(page: any, elements: UIElements, environment: environment) {
    await page.goto(environment.login_page);

    //Type the username and password.
    await page.type(elements.usernameField, environment.username);
    await page.type(elements.passwordField, environment.password);

    //Submit the credentials.
    await Promise.all([
        page.click(elements.submitButton),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    // const information = await collectionInformation(page, elements); //Collecting ESS information.

    await Promise.all([
        page.click(elements.launchExecutimeLink),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    
    let statusElement: ElementHandle = await page.waitForSelector(elements.clockStatusSelector);
    let statusValue = await (await statusElement.getProperty('textContent')).jsonValue();

    let executimeData: executimeInformation = {
        status: (statusValue !== null ? statusValue : 'ERROR. STATUS NOT FOUND.'),
        time: '',
    };

    //Check what the current status is and change it.
    if (executimeData.status === 'Clocked Out')
        await page.click(elements.clockInButton);
    else if (executimeData.status === 'Clocked In')
        await page.click(elements.clockOutButton);
    else
        return executimeData;

    //Getting the time.
    let timeElement: ElementHandle = await page.waitForSelector(elements.currentTime);
    let timeValue = await (await timeElement.getProperty('textContent')).jsonValue();
    executimeData.time = ((timeValue !== null) ? timeValue : 'ERROR. TIME NOT FOUND.')

    // await page.waitForNavigation({ waitUntil: 'networkidle0' }); //Wait for the page to change...

    //Get the new, updated, status.
    statusElement = await page.waitForSelector(elements.clockStatusSelector);
    statusValue = await (await statusElement.getProperty('textContent')).jsonValue();
    executimeData.status = (statusValue !== null ? statusValue : 'ERROR. STATUS NOT FOUND.')


    return executimeData;
}

export async function createUI(): Promise<string> {
    var HTMLOutput: string = '';
    
    HTMLOutput = HTMLOutput.concat(readFileSync('./frontend/index.html').toString());

    return HTMLOutput;
}

// async function collectionInformation(page: any, elements: UIElements) {
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