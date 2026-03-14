import express from "express";
import { createServer } from "http";
import { registerRoutes } from "../server/routes.js";

const app = express();
const httpServer = createServer(app);

// Trust Vercel's proxy so secure cookies work on HTTPS
app.set("trust proxy", 1);

app.use(express.json({
  verify: (req: any, _res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ extended: false }));

// Initialize routes once (Vercel may reuse the lambda)
let ready: Promise<any>;
try {
  ready = registerRoutes(httpServer, app);
} catch (e) {
  console.error("Failed to register routes:", e);
  ready = Promise.reject(e);
}

export default async function handler(req: any, res: any) {
  try {
    await ready;
    app(req, res);
  } catch (e) {
    console.error("Handler error:", e);
    res.status(500).json({ error: "Internal server error", detail: String(e) });
  }
}
