FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY src ./src
ENV NODE_ENV=production
EXPOSE 1234
CMD ["node_modules/.bin/tsx", "src/index.ts"]
