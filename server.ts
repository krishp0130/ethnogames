import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { attachGameSocket } from "./server/gameSocket";
import { allowedOrigins } from "./server/env";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);

    if (parsedUrl.pathname === "/health") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true, service: "ethnogames" }));
      return;
    }

    handle(req, res, parsedUrl);
  });

  attachGameSocket(httpServer);

  httpServer.listen(port, hostname, () => {
    console.log(
      `[server] Ethnogames listening on http://${hostname}:${port} (CORS: ${allowedOrigins.join(", ")})`
    );
  });
});
