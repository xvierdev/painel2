FROM nginx:1.27-alpine

WORKDIR /usr/share/nginx/html
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY . .

EXPOSE 8080
