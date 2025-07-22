import serverless from "serverless-http";

import app from "./server.js";

export const handler = serverless(app, {
	request: (req, res) => {
		// Add any custom request handling here if needed
	},
});
