import express from "express";
import path from "node:path";
import { createApp } from "./app.js";
const production = process.env.NODE_ENV === "production";
const app = createApp({
  dataDir: process.env.PLANLY_DATA_DIR || path.resolve(".data"),
  production,
});
if (production) {
  app.use(express.static(path.resolve("dist")));
  app.get("/{*path}", (_, res) =>
    res.sendFile(path.resolve("dist/index.html")),
  );
}
const port = Number(process.env.PORT || (production ? 3000 : 3001));
app.listen(port, production ? "0.0.0.0" : "127.0.0.1", () =>
  console.log(`Planly ${production ? "app" : "API"} listening on port ${port}`),
);
