FROM node:12
MAINTAINER marcomueller
EXPOSE 3000
WORKDIR /app
COPY . /app
RUN npm install
CMD npm run start