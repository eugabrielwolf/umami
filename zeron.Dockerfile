FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN yarn add npm-run-all dotenv prisma

# You only need to copy next.config.js if you are NOT using the default configuration
COPY next.config.js .
COPY --chown=nextjs:nodejs public ./public
COPY package.json ./package.json
COPY prisma ./prisma
COPY scripts ./scripts

COPY docker-wrapper.sh /docker-wrapper.sh
RUN chmod +x /docker-wrapper.sh

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --chown=nextjs:nodejs .next/standalone ./
COPY --chown=nextjs:nodejs .next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

ARG BASE_PATH
ENV BASE_PATH ${BASE_PATH}

CMD ["/docker-wrapper.sh", "yarn", "start-docker"]
