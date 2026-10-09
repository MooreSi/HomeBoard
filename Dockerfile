FROM node:24-alpine
WORKDIR /app
COPY package.json server.mjs ./
COPY public ./public
RUN mkdir /app/data && chown -R node:node /app
USER node
EXPOSE 8080
CMD ["node", "server.mjs"]
