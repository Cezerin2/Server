#!/bin/sh
set -e

envsubst '${API_PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

nginx
exec pm2 start process.json --no-daemon
