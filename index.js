app.get("/productboard-webhook", async (req, res) => {
	res.setHeader("Content-type", "text/plain");
	res.status(200).send(res.req.query.validationToken);
});
