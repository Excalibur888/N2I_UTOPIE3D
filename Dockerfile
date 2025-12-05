FROM node:20-alpine AS runner

WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY server.js .
COPY public/ ./public/

RUN npm install --production

EXPOSE 80

CMD ["node", "server.js"]