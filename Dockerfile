FROM node:20-alpine as angular
WORKDIR /ng-app
COPY package*.json .
RUN npm install --force
COPY . .
RUN npm run build --configuration=dev

FROM nginx:alpine
COPY --from=angular /ng-app/dist/vabanq-erp/browser /usr/share/nginx/html
EXPOSE 80
