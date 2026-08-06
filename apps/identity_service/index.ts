import "dotenv/config";
import app from "./app.js";
import { connect_redis } from "./src/config/redis.js";

const port = Number(process.env.PORT ?? 4000);

async function startServer() {
	await connect_redis();

	app.listen(port, () => {
		console.log(`identity_service listening on port ${port}`);
	});
}

void startServer();
