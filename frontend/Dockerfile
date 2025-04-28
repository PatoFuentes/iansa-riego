FROM node:22 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY src/ ./src/
COPY angular.json ./
COPY tsconfig.json ./
COPY tsconfig.app.json ./
RUN npm run build -- --configuration production --base-href /

FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*  
COPY --from=build /app/dist/frontend-riego /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
