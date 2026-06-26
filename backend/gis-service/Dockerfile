FROM node:20-slim

WORKDIR /app

COPY package.json .
RUN npm install --omit=dev

COPY tsconfig.json .
COPY src/ src/

RUN npm run build

ENV GIS_PORT=8085
ENV CORS_ORIGIN=http://localhost:3000

EXPOSE 8085

CMD ["node", "dist/index.js"]
