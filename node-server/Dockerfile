# Use a base image with Node.js
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Оновлюємо npm до останньої версії (тепер вона має бути сумісною з Node.js 20)
RUN npm install -g npm@latest

# Install dependencies
RUN npm install

# Copy the application code to the container
COPY . .

# Expose the port on which the application will run
EXPOSE 8000

# Specify the command to start the application
CMD ["node", "-r", "./tracing.js", "index.js"]