// This file is overwritten by esbuild during Vercel build.
// See vercel.json buildCommand.
module.exports = (_req, res) => res.status(503).json({ error: "Build in progress" });
