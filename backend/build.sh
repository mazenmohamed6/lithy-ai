#!/bin/bash
set -e
npx prisma generate
npx nest build
npx esbuild api/server.js --bundle --platform=node \
  --external:react --external:react-dom --external:@react-email/render \
  --external:@nestjs/websockets --external:@nestjs/microservices \
  --external:class-transformer/storage \
  --outfile=api/index.js