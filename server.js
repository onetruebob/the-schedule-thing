const path = require("path");
const express = require("express");
const compression = require("compression");
const morgan = require("morgan");
const { createRequestHandler } = require("@remix-run/express");
const { request } = require("http");
const cron = require("node-cron");

require("dotenv").config();

const BUILD_DIR = path.join(process.cwd(), "build");

const app = express();

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

// Remix fingerprints its assets so we can cache forever.
app.use(
  "/build",
  express.static("public/build", { immutable: true, maxAge: "1y" })
);

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static("public", { maxAge: "1h" }));

app.use(morgan("tiny"));

app.all(
  "*",
  process.env.NODE_ENV === "development"
    ? (req, res, next) => {
        purgeRequireCache();

        return createRequestHandler({
          build: require(BUILD_DIR),
          mode: process.env.NODE_ENV,
        })(req, res, next);
      }
    : createRequestHandler({
        build: require(BUILD_DIR),
        mode: process.env.NODE_ENV,
      })
);
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});

function purgeRequireCache() {
  // purge require cache on requests for "server side HMR" this won't let
  // you have in-memory objects between requests in development,
  // alternatively you can set up nodemon/pm2-dev to restart the server on
  // file changes, but then you'll have to reconnect to databases/etc on each
  // change. We prefer the DX of this, so we've included it for you by default
  for (let key in require.cache) {
    if (key.startsWith(BUILD_DIR)) {
      delete require.cache[key];
    }
  }
}

cron.schedule("0 0-23 * * *", executeCron); // Execute once every hour

function executeCron() {
  const cron_token = process.env.CRON_TOKEN;
  if (!cron_token) {
    console.log("No cron token. Skipping cron run");
    return;
  }

  const data = {
    cron_token,
  };
  postToSelf({ path: "/api/cron", data });
}

function postToSelf({
  hostname = "127.0.0.1",
  port = process.env.PORT || 3000,
  path,
  data,
}) {
  const jsonData = data && JSON.stringify(data);
  const options = {
    hostname,
    port,
    path,
    method: "POST",
    headers: jsonData && {
      "Content-Type": "application/json",
      "Content-Length": jsonData.length,
    },
  };

  const req = request(options, (res) => {
    console.log(
      `Calling self at path '${path}' with status: ${res.statusCode}`
    );
  });

  req.on("error", (error) => {
    console.error(`Error calling '${path}'`, error);
  });

  jsonData && req.write(jsonData);
  req.end();
}
