FROM centos:8.3.2011
LABEL maintainer="marco_mueller_1993@hotmail.de"
RUN dnf module enable nodejs:14 -qy
RUN dnf install nodejs -qy
WORKDIR /app
VOLUME [ "/app" ]