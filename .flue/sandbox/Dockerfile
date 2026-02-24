FROM node:24.13.1-bookworm-slim

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# --- System packages ---
# The slim image includes Node.js and npm but not git, curl, or wget.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ca-certificates curl wget git jq lsof procps \
    && rm -rf /var/lib/apt/lists/*

# --- pnpm ---
RUN npm install -g pnpm

# --- OpenCode CLI ---
# The installer puts the binary in $HOME/.opencode/bin (not configurable).
# Copy it to /usr/local/bin so it's accessible when running as a non-root
# user (the container uses --user to match the host workspace owner).
RUN curl -fsSL https://opencode.ai/install -o /tmp/install-opencode.sh \
    && bash /tmp/install-opencode.sh \
    && rm /tmp/install-opencode.sh \
    && cp /root/.opencode/bin/opencode /usr/local/bin/opencode \
    && opencode --version

# --- agent-browser + Chromium for headless browser testing ---
# 1. Install system deps required by Chromium
# 2. Install agent-browser + playwright (for the `playwright install` CLI)
# 3. Download Chromium to a shared location accessible to any UID
#    (the container runs as a non-root user via --user)
# 4. Remove the playwright package (agent-browser bundles its own)
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       libxcb-shm0 libx11-xcb1 libx11-6 libxcb1 libxext6 libxrandr2 \
       libxcomposite1 libxcursor1 libxdamage1 libxfixes3 libxi6 libgtk-3-0 \
       libpangocairo-1.0-0 libpango-1.0-0 libatk1.0-0 libcairo-gobject2 \
       libcairo2 libgdk-pixbuf-2.0-0 libxrender1 libasound2 libfreetype6 \
       libfontconfig1 libdbus-1-3 libnss3 libnspr4 libatk-bridge2.0-0 \
       libdrm2 libxkbcommon0 libatspi2.0-0 libcups2 libxshmfence1 libgbm1 \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g agent-browser playwright \
    && playwright install chromium \
    && chmod -R o+rx /opt/pw-browsers \
    && npm uninstall -g playwright

# --- GitHub CLI (for read-only public repo operations without auth) ---
RUN (type -p wget >/dev/null || (apt-get update && apt-get install wget -y)) \
    && mkdir -p -m 755 /etc/apt/keyrings \
    && out=$(mktemp) && wget -nv -O$out https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    && cat $out | tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
    && chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
       | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update \
    && apt-get install gh -y \
    && rm -rf /var/lib/apt/lists/*

# --- Compatibility fixes ---
# Allow any directory as a git safe.directory. The host workspace is bind-mounted
# at its original host path (e.g. /home/runner/work/astro/astro) and the container
# runs as a non-root UID via --user, so git would otherwise refuse to operate.
RUN git config --system --add safe.directory '*'

# --- Global OpenCode rules for CI sessions ---
# The flue CLI sets HOME=/tmp at runtime, so OpenCode reads global rules from
# /tmp/.config/opencode/AGENTS.md. This injects CI-specific instructions.
COPY .flue/sandbox/AGENTS.md /tmp/.config/opencode/AGENTS.md

EXPOSE 48765

# Default: start OpenCode server listening on all interfaces
CMD ["opencode", "serve", "--port", "48765", "--hostname", "0.0.0.0"]
