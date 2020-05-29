FROM node:12
MAINTAINER marcomueller
WORKDIR /app
RUN mkdir certs
COPY /usr/local/psa/var/modules/letsencrypt/etc/archive/spiralingdown.de/privkey1.pem ./certs
COPY /usr/local/psa/var/modules/letsencrypt/etc/archive/spiralingdown.de/fullchain1.pem ./certs
COPY . /app
RUN npm install
CMD npm run start