FROM node:24-alpine
RUN apk add --no-cache bash git ca-certificates
ARG HOMEBOARD_COMMIT=unknown
ENV HOMEBOARD_COMMIT=$HOMEBOARD_COMMIT
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.mjs ./
COPY lib ./lib
COPY public ./public
COPY scripts ./scripts
RUN mkdir /app/data && chown node:node /app/data
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:8080/api/status').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "scripts/runner.mjs"]
