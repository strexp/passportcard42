# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

COPY . ./
RUN npm run build

FROM nginx:stable-alpine AS runtime

LABEL org.opencontainers.image.title="passcard42"
LABEL org.opencontainers.image.description="dn42 passport card generator"

# nginx renders this template to /etc/nginx/conf.d/default.conf at startup,
# substituting the PASSCARD42_FRONTEND_HOST / PASSCARD42_FRONTEND_PORT
# environment variables, so one image works for every listen address.
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

# Defaults for the template above; override them with `docker run -e ...`.
ENV PASSCARD42_FRONTEND_HOST=0.0.0.0 \
    PASSCARD42_FRONTEND_PORT=80

EXPOSE 80

STOPSIGNAL SIGQUIT
