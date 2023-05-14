#!/bin/sh

caddy_version="2.6.4"
cache_handler_version="0.7.0"
binary_name="fecc"

xcaddy build v${caddy_version} \
  --output out/${binary_name} \
  --with github.com/abiosoft/caddy-json-schema \
  --with github.com/caddyserver/cache-handler@v${cache_handler_version}

# save a json-schema file, including config for plugins
./out/${binary_name} json-schema --vscode
