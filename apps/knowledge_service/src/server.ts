import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// server.ts lives in src/, so .env is one level up. Explicit path keeps
// startup independent of the cwd turbo/IDE tasks use.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, "..", ".env") });

const { default: app } = await import("./app.js");

const PORT = process.env.PORT ?? 7998;

app.listen(PORT, () => {
  console.log(`Knowledge server is running at port ${PORT}`);
});
