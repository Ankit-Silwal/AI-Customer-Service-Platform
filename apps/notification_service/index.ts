import "dotenv/config";
import app from "./src/app.js";
const port = Number(process.env.PORT ?? 3006);
app.listen(port, () => console.log(`notification_service listening on port ${port}`));
