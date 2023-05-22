#!/bin/sh
export DATABASE_URL=$(node make-db-url.js)
exec "$@"
