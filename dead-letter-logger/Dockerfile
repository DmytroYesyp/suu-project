FROM node:18-alpine
WORKDIR /app
COPY ./index.js .
RUN npm install express
VOLUME ["/data"]
EXPOSE 8080
CMD ["node", "index.js"]
