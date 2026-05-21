FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY . .

RUN chmod +x ./start.sh

EXPOSE 8787
EXPOSE 18080

CMD ["./start.sh", "production"]
