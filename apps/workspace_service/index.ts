import "dotenv/config";
import app from "./app.js";

const port = 7999;

app.listen(port, () => {
	console.log(`workspace service listening on port ${port}`);
});
