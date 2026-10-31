FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY . .
RUN chown -R node:node /app
USER node
ENV NODE_ENV=production
ENV PORT=4173
EXPOSE 4173
CMD ["node","server.js"]
