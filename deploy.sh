#!/usr/bin/env bash
set -e

cd /srv/sites/edgeops.hax.nu/src
git pull

cd ..

docker compose up -d --build
