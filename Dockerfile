FROM node:12
MAINTAINER marcomueller
WORKDIR /app
COPY . /app
RUN npm install
CMD npm run start