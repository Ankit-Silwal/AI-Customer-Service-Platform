import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Resolve .env next to this file so the service starts from any cwd
// (turbo, IDE tasks, or the service folder itself).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, ".env") });

const { default: app } = await import("./src/app.js");
const port = Number(process.env.PORT ?? 3006);
app.listen(port, () => console.log(`notification_service listening on port ${port}`));
