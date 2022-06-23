const express = require("express");
const bodyParser = require("body-parser"); // Parses JSON bodies
const cookieParser = require("cookie-parser");
const app = express().use(bodyParser.text());
const port = process.env.PORT || 3000;
const axios = require("axios"); // Helps by sending HTTP for us

app.get("/productboard-webhook", async (req, res) => {
	res.setHeader("Content-type", "text/plain");
	res.status(200).send(res.req.query.validationToken);
});

app.post("/productboard-webhook", async (req, res) => {
	console.log("Req is:", req);
	console.log("Res is:", res);
});

app.listen(port, () => {
	console.log(`Your integration is listening on port http://localhost:${port}`);
});
