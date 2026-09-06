import "dotenv/config";
import app from "./src/app.js";
const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => console.log(`api_gateway listening on port ${port}`));
