import axios from "axios";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import express from "express";
import fs from "fs/promises";
import { Server } from "node:http";
import os from "node:os";
import path from "node:path";

// toggle this to enable logging from redis and caddy, very noisey but necessary for debuging
const DEBUG_LOG = process.env.DEBUG_LOG ?? false;

const CADDY_PORT = "3000";
const REDIS_PORT = "6379";
const UPSTREAM_PORT = "8080";

let processes: BackgroundProcess[];

describe("it works", () => {
  // CAUTION: currently these only run once per describe block so the cache isn't independent between tests
  // TODO wipe redis after each test
  beforeAll(async () => {
    processes = await Promise.all([
      startFecc(),
      startRedis(),
      startDummyUpstream(),
    ]);
  });
  afterAll(async () => {
    processes.forEach((p) => p.kill());
    await new Promise((resolve) => setTimeout(resolve, 100)); // HACK: a bit of extra time for stuff to stop
  });

  it("test servers are up", async () => {
    const upstreamReq = await axios.get(
      `http://localhost:${UPSTREAM_PORT}/healthcheck`
    );
    const proxiedReq = await axios.get(
      `http://localhost:${CADDY_PORT}/healthcheck`
    );
    expect(upstreamReq.status).toBe(200);
    expect(proxiedReq.status).toBe(200);
  });

  it("caddy caches requests to /", async () => {
    const initialReq = await axios.get(`http://localhost:${CADDY_PORT}`);
    const secondReq = await axios.get(`http://localhost:${CADDY_PORT}`);
    expect(initialReq.headers["cache-status"]).toContain("uri-miss;");
    expect(initialReq.headers["cache-status"]).toContain("stored;");
    expect(secondReq.headers["cache-status"]).toContain("hit;");
  });

  it("caddy doesn't cache /heathcheck", async () => {
    const url = `http://localhost:${CADDY_PORT}/healthcheck`;
    const initialReq = await axios.get(url);
    expect(initialReq.headers["cache-status"]).toBeUndefined();
  });
});

//
// =====================
// Helper functions that should probably move to own file
// =====================
//

type BackgroundProcess = {
  kill: () => void;
};

function attachLogsToProcess(
  process: ChildProcessWithoutNullStreams,
  name: string
) {
  const red = { start: `\x1b[31m`, end: `\x1b[0m` };
  if (DEBUG_LOG) {
    process.stdout.on("data", (d) => console.log(`[${name}]: ${d}`));
    process.stderr.on("data", (d) =>
      console.log(`${red.start}[${name}]: ${d}${red.end}`)
    );
  }
}

/** start redis server */
async function startRedis(): Promise<BackgroundProcess> {
  // redis will save it's db on close, so save it to a temp dir to keep tests independent
  const dbDir = await fs.mkdtemp(path.join(os.tmpdir(), "test-"));
  const process = spawn("redis-server", ["--dir", dbDir, "--port", REDIS_PORT]);
  attachLogsToProcess(process, "redis");
  await new Promise((resolve) => setTimeout(resolve, 500)); // HACK: wait for the process to be up
  return process;
}

/** start caddy server */
async function startFecc(): Promise<BackgroundProcess> {
  const process = spawn("./out/fecc", ["run", "--config", "Caddyfile"], {
    env: { CADDY_PORT, REDIS_PORT, UPSTREAM_PORT },
  });
  attachLogsToProcess(process, "caddy");
  await new Promise((resolve) => setTimeout(resolve, 500)); // HACK: wait for the process to be up
  return process;
}

/** a server to use as an upstream of the cache */
async function startDummyUpstream(): Promise<BackgroundProcess> {
  const app = express();
  app.get("/healthcheck", (_req, res) => {
    res.send("ok");
  });
  app.get("/", (_req, res) => {
    res.send("Hello World!");
  });
  const server = await new Promise<Server>((resolve) => {
    const _server = app.listen(UPSTREAM_PORT, () => {
      if (DEBUG_LOG) {
        console.log(`Dummy upstream listening on port ${UPSTREAM_PORT}`);
      }
      resolve(_server);
    });
  });
  return { kill: () => server.close() };
}
