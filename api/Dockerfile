FROM node:18-alpine

WORKDIR /app
COPY package* ./
RUN npm ci

COPY web.js ./

USER node
CMD node web.js