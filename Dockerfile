FROM node:stretch-slim
RUN mkdir -p /node-app
RUN mkdir -p /node-app/src
COPY src /node-app/src
COPY package.json /node-app
COPY package-lock.json /node-app
WORKDIR /node-app
RUN npm install
CMD ["node", "./src/index.js"]