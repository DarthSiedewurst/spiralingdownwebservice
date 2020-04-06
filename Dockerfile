FROM node:12
MAINTAINER marcomuehler
EXPOSE 3000
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
CMD npm run start