FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
