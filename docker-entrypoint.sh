#!/bin/sh
set -e

envsubst '${API_PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

nginx
exec npm run setup admin@example.com http://localhost:3000
exec pm2 start process.json --no-daemon
