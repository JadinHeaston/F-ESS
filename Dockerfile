FROM node:19-slim

#Setting the directory.
WORKDIR /usr/app

#Installing Chromium for Puppeteer
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
        --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

#Copy the files into the container.
COPY . .

# Install puppeteer so it's available in the container.
    # Add user so we don't need --no-sandbox.
    # same layer as npm install to keep re-chowned files from using up several hundred MBs more space
RUN groupadd -r fessuser && useradd -r -g fessuser -G audio,video fessuser \
    && mkdir -p /home/fessuser/Downloads \
    && chown -R fessuser:fessuser /home/fessuser \
    && chown -R fessuser:fessuser .

# Run everything after as non-privileged user.
USER fessuser

#Install dependencies.
RUN mkdir node_modules
RUN npm ci --quiet

#Expose the Docker port.
EXPOSE 80

#Creating healthcheck.