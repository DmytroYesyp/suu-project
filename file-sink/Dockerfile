FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
VOLUME ["/data"]
EXPOSE 8080
CMD ["node", "index.js"]
