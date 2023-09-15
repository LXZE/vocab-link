ARG VARIANT=20-bullseye
FROM mcr.microsoft.com/devcontainers/typescript-node:1-${VARIANT}

RUN echo 'alias p="pnpm"' >> /etc/bash.bashrc
# RUN npm install -g @microsoft/rush concurrently
