import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Resolve .env next to this file so the gateway starts from any cwd.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, ".env") });

const { default: app } = await import("./src/app.js");
const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => console.log(`api_gateway listening on port ${port}`));
