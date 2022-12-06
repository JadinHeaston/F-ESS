FROM node:19

#Setting the directory.
WORKDIR /usr/app

# Installing Chrome for Puppeteer.
RUN apt-get update && apt-get install curl gnupg -y \
    && curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install google-chrome-stable -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

#Install app dependencies
#A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json .

#Install dependencies.
RUN npm ci --quiet

# install libraries
RUN apt-get -qq update
RUN apt-get install -qq -yyq libappindicator1 libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6

#Copy the files into the container.
COPY . .

#Expose the Docker port.
EXPOSE 80

RUN groupadd -r fessuser
RUN useradd -r -g fessuser -G audio,video fessuser
# change owner of app folder
RUN mkdir /home/fessuser/ \
    && chown -R fessuser:fessuser . \ 
    && chown -R fessuser:fessuser /home/fessuser/
USER fessuser