# Front end caddy caching reverse proxy (fecc-rp)

An experiment in using caddy with some plugins and redis to replace our frontend caching/reverse proxy CDN. Very WIP.

## Setup

If you have `nix` and `direnv` setup everything will be installed automatically. If you don't, you need to manually install `go`, `xcaddy`, and `redis`.

Run `./build.sh` to build a caddy image with the caching plugin. If you change anything in `./build.sh` you need to re-run it, but changing caddy config doesn't require this.

## Running test

There are basic tests in `tests/basic.spec.ts` that gives an out of starting processes so tests can be run against a caddy configuration to verify caching behaviour. You need to setup you environment as described above for them to run.

## Manually running services

If you want to run these services manually outside the tests you can commend out the `afterAll` block in the jest tests and they'll stay running until you kill the test process. Or you can fire stuff up manually like below, this is more work but outputs much clearer logs.

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
