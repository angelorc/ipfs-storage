# syntax = docker/dockerfile:1

# - https://markus.oberlehner.net/blog/running-nuxt-3-in-a-docker-container/
# - https://pnpm.io/docker

ARG NODE_VERSION=20.17.0

FROM node:${NODE_VERSION}-slim as base

ENV NODE_ENV=development
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /src

# Build
FROM base as build

COPY --link package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile
RUN pnpm build

# Run
FROM base

COPY --from=build /src/node_modules /src/node_modules

CMD [ "node", ".output/server/index.mjs" ]