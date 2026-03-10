FROM node:20-alpine

WORKDIR /usr/src/app

# Install build tools for native modules like serialport
RUN apk add --no-cache python3 make g++ linux-headers udev

COPY package*.json ./
RUN npm install

COPY . .

RUN npm install -g ts-node typescript

EXPOSE 8080

CMD ["npx", "ts-node", "src/server.ts"]
