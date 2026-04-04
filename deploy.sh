#!/bin/bash
export PATH=/opt/plesk/node/20/bin:/usr/local/bin:/usr/bin:/bin
cd /var/www/vhosts/timurlarsigorta724.com/quiz.timurlarsigorta724.com

echo "=== Prisma Generate ==="
npx prisma generate

echo "=== Create .env ==="
echo 'DATABASE_URL="file:./dev.db"' > .env

echo "=== Prisma DB Push ==="
npx prisma db push

echo "=== Seed ==="
npx tsx prisma/seed.ts

echo "=== Build ==="
npm run build

echo "=== DONE ==="
