// Placeholder — replaced by esbuild during Vercel build (see buildCommand in vercel.json)
module.exports = async function(req, res) {
  res.status(503).json({ error: "Build not completed" });
};
