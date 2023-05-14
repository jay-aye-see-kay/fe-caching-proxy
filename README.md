# Front end caddy caching reverse proxy (fecc-rp)

An experiment in using caddy with some plugins and redis to replace our frontend caching/reverse proxy CDN. Very WIP.

## Setup

If you have `nix` and `direnv` setup everything will be installed automattically. If you don't, you need to manually install `go`, `xcaddy`, and `redis`.

## Testing configurations

There's not automated tests setup yet, just opening a bunch of terminals and running stuff.

```bash
# start redis (this will persist data to ./dump.rdb)
redis-server

# in another terminal, run a file server so we have something to proxy
python3 -m http.server 8080

# in another terminal, build and run our custom caddy server
./build.sh
./out/fecc run --config Caddyfile

# in another terminal, hit the caddy server and observe it's caching behaviour (either via headers or logs from the python server)
curl -i localhost:3000/<path>
```

## Potentially useful plugins

- https://caddyserver.com/docs/json/apps/http/servers/routes/handle/s3proxy/
- https://caddyserver.com/docs/json/storage/s3/
- https://caddyserver.com/docs/json/apps/http/servers/routes/handle/cache/ (in use already)
- https://github.com/sillygod/cdp-cache (probably not worth using)
