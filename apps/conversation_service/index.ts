import "dotenv/config";
import app from "./src/app.js";
const port = Number(process.env.PORT ?? 3004);
app.listen(port, () => console.log(`conversation_service listening on port ${port}`));
