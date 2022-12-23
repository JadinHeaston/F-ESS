// @ts-nocheck

declare interface environmentHandle {
    login_page: string,
    port: string,
    session_secret: string,
    timezone: string,
    user_agent: string,
}

declare interface scrapedData {
    status?: string,
    time?: string,
    payPeriodInfo?: string,
    ESSTimeData?: ESSTimeData
}

declare interface ESSTimeData {
    label: Array<string>
    availableTime: Array<string>,
    earnedTime: Array<string>,
}

declare interface sessionHandle {
    clockStatus: string,
    clockTime: string,
    credentialsValid: boolean,
    username: string,
    password: string,
    payPeriodInfo: string,


    //Session stuff.
    save(),
}

//Setting constants for the first page (ESS login).
declare interface UIElements {
    usernameField: string,
    passwordField: string,
    submitButton: string,

    timeLabelSelector: string,
    availableTimeSelector: string,
    earnedTimeSelector: string,
    launchExecutimeLink: string,

    clockInButton: string,
    clockOutButton: string,
    clockStatusSelector: string,
    currentTime: string,
}

interface webpage {
    browser?: puppeteer.Browser,
    page?: puppeteer.Page
}