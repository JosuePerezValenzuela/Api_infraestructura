FROM node:24-alpine

RUN apk add --no-cache \
    git \
    bash \
    curl \
    openssh-client

RUN npm install -g pnpm

RUN mkdir -p /home/node/.local/share/pnpm \
    && chown -R node:node /home/node/.local

USER node

RUN pnpm config set store-dir /home/node/.local/share/pnpm

WORKDIR /workspace

EXPOSE 3002 9229

CMD ["sh"]
