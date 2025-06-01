FROM nginx:alpine

COPY dist/vabanq-erp/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
