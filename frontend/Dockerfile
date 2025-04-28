FROM node:22 AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/frontend-riego /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
