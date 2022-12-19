
declare interface environmentHandle {
    login_page: string,
    session_secret: string,
    port: string
}

declare interface scrapedData {
    status?: string,
    time?: string,
    payPeriodInfo?: string,
}

declare interface ESSTimeData {

}

declare interface sessionHandle {
    clockStatus: string,
    clockTime: string,
    credentialsValid: boolean,
    username: string,
    password: string,
    payPeriodInfo: string,
}

//Setting constants for the first page (ESS login).
declare interface UIElements {
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
