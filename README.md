# Featureful-ESS


**Proof of Concept**

This project is meant to create a dashboard for Tyler ESS dashboard and Executime clocking in/out.

Documentation will be written soon on this proof of concept.

### Installation

#### Configuration

All configuration is done via the ```./backend/environment.json``` file.

|   Key | Description | Default Value |
| --- | --- | --- |
| Username | Your Tyler ESS username. | {NULL} |
| Password | Your Tyler ESS password. | {NULL} |
| login_page | The login page for Tyler ESS. This provides a starting point for the headless browser. | {NULL} |
| session_secret | The session secret is used for verifying the cookie, which identifies what session to use. This should be set to a long, randomized, string. | {NULL} |

## Usage

Use ```npm install``` to install all dependencies.  
To run the node server, use: ```npm run start``` (or ```npm run dev``` for utilizing nodemon)

**WiP**