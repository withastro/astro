FROM mcr.microsoft.com/devcontainers/javascript-node:0-18

# Install latest pnpm
RUN npm install -g pnpm

# Install deno
ENV DENO_INSTALL=/usr/local
RUN curl -fsSL https://deno.land/x/install/install.sh | sh

COPY example-welcome-message.txt /usr/local/etc/vscode-dev-containers/first-run-notice.txt