# Development image — tools only, code mounts via volume
FROM node:24-alpine

# Install development utilities
RUN apk add --no-cache \
    git \
    bash \
    curl \
    openssh-client

# Install pnpm globally
RUN npm install -g pnpm

# The node:alpine image already includes user "node" (uid 1000).
# We use it as-is via remoteUser in devcontainer.json.

WORKDIR /workspace

EXPOSE 3002 9229

CMD ["sh"]
