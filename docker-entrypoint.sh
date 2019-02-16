#!/bin/sh
set -e

exec pm2 start process.json --no-daemon
