# Frontend Dockerfile (static build)
FROM node:18-alpine as build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
# copy a minimal nginx config if needed (optional)
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
