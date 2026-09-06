import "dotenv/config";
import app from "./src/app.js";
const port = Number(process.env.PORT ?? 3007);
app.listen(port, () => console.log(`analytics_service listening on port ${port}`));
