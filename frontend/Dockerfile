FROM node:22 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY src/ ./src/
COPY angular.json ./
COPY tsconfig.json ./
COPY tsconfig.app.json ./
COPY .dockerignore ./
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/frontend-riego /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

