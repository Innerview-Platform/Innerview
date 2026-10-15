# Chromium + Lighthouse 12 + puppeteer-core, for tests/seo/browser.check.mjs and Lighthouse runs.
# fonts-liberation: Arial/Times/Courier-metric fonts, as on typical desktops, so the metric-matched
# fallbacks in frontend/src/styles/fonts.css apply in the lab as they do for real visitors.
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends chromium fonts-dejavu-core fonts-liberation ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm i -g lighthouse@12 && npm cache clean --force
ENV CHROME_PATH=/usr/bin/chromium
