# Featureful-ESS

Featureful-ESS is meant to create a simple dashboard for the Tyler ESS dashboard and Tyler Executime clocking in/out system.

## Configuration

All configuration is done via the ```./backend/environment.json``` file.
Most values are left empty and are **required** before deployment.

| Key | Description | Default Value |
| --- | --- | --- |
| LOGIN_PAGE | The login page for Tyler ESS. This provides a starting point for the headless browser. | {NULL} |
| MODE | Sets whether the application is running in a development environment or production. Use **dev** or **prod** here. It defaults to provide. |  |
| PORT | Sets the listening and operational port within the docker container. This port will be exposed. | 80 |
| SESSION_SECRET | The session secret is used for verifying the cookie, which identifies what session to use. This should be set to a long, randomized, string. (Up to 99 characters has been tested) | {NULL} |
| TIMEZONE | Sets the Docker containers [timezone](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List). | "America/Chicago" |

## Installation

Docker is the preferred installation method.

### Docker

#### Docker Compose Installation

Utilizing Docker Compose is the preferred method.

1. Download the source files.
2. Navigate to the source files root.
3. Edit the docker-compose.yml

#### Docker Troubleshooting

When modifying the included ```docker-compose.yml``` and ```Dockerfile```, a few errors *can* occur with Puppeteer. This is a collection of some that I encountered.

##### Puppetteer can not be run as root

Puppeteer can **not** be run as the root user, and it's better practice not to run as a root user anyways within the container.

##### Puppetteer has no usable sandbox

Getting an error saying "No usable sandbox" can be fixed by ensuring the following code is within the ```docker-compose.yml``` file:

```json
security_opt: 
    - seccomp=chrome.json
```

The [chrome.json](https://github.com/jessfraz/dotfiles/blob/master/etc/docker/seccomp/chrome.json) was found on GitHub via a [StackOverflow](https://stackoverflow.com/questions/62345581/node-js-puppeteer-on-docker-no-usable-sandbox) post.

### Local

## Usage

Ensure that [Node and NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) are installed. Installation is beyond the scope of this documentation.

Use ```npm install``` to install all dependencies.  
To run the node server, use: ```npm run start``` (or ```npm run dev``` for utilizing nodemon)

## Todo

- General
    - [ ] Allow a pay period to be submitted.
    - [ ] Allow dynamic credentials to be provided.
- Server Side
    - [ ] Add server side session locking to prevent multiple concurrent overlapping requests by a single user.
    - [ ] Optimize getting data asynchronously and modularly.
- client Side
    - [ ] Add section to display pay period information.
    - [ ] Create UI for hour accumulation data.
    - [ ] Style the log better.