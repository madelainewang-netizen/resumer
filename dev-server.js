import { createServer } from "node:http";
import { loadEnv } from "vite";
import { createServer as createViteServer } from "vite";

const mode = process.env.NODE_ENV || "development";
const env = loadEnv(mode, process.cwd(), "");
Object.assign(process.env, env);

const apiHandlers = {
  "/api/analyze-jd": () => import("./api/analyze-jd.js"),
  "/api/tailor-resume": () => import("./api/tailor-resume.js"),
  "/api/condense-resume": () => import("./api/condense-resume.js"),
  "/api/explain-match": () => import("./api/explain-match.js"),
  "/api/import-resume": () => import("./api/import-resume.js"),
  "/api/evidence-coach": () => import("./api/evidence-coach.js"),
  "/api/status": () => import("./api/status.js"),
};

const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "spa",
});

const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  const loadHandler = apiHandlers[pathname];
  if (!loadHandler) {
    vite.middlewares(req, res, () => {
      res.statusCode = 404;
      res.end("Not found");
    });
    return;
  }

  try {
    req.body = await readJSONBody(req);
    decorateResponse(res);
    const { default: handler } = await loadHandler();
    await handler(req, res);
  } catch (error) {
    if (!res.headersSent) {
      res.statusCode = error.status || 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
    }
    if (!res.writableEnded) {
      res.end(JSON.stringify({ error: error.message || "Local API error" }));
    }
  }
});

server.listen(5173, "127.0.0.1", () => {
  console.log("Resumer ready at http://127.0.0.1:5173/");
  if (!process.env.DEEPSEEK_API_KEY) {
    console.log("AI APIs disabled: add DEEPSEEK_API_KEY to .env.local");
  }
});

function readJSONBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 6 * 1024 * 1024) {
        const error = new Error("请求内容超过 6MB");
        error.status = 413;
        reject(error);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        const error = new Error("请求 JSON 格式无效");
        error.status = 400;
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function decorateResponse(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (value) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(value));
  };
  res.flushHeaders = res.flushHeaders?.bind(res) || (() => {});
}
