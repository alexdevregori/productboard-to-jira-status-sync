const express = require("express");
const bodyParser = require("body-parser"); // Parses JSON bodies
const cookieParser = require("cookie-parser");
const app = express().use(bodyParser.text());
const port = process.env.PORT || 3000;
const axios = require("axios"); // Helps by sending HTTP for us

// Config of server
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// GET route to authenticate the Productboard webhook
app.get("/productboard-webhook", async (req, res) => {
	res.setHeader("Content-type", "text/plain");
	res.status(200).send(res.req.query.validationToken);
});

// POST route to handle Productboard webhook updates
app.post("/productboard-webhook", async (req, res) => {
	// Grabbing feature ID from the webhook POST
	const productboardFeatureID = req.body.data.id;
	// 🛑 Add your Jira integration ID below. You can access the ID by going to your Jira integration settings in Productboard and copying the string in the final slash
	const jiraIntegrationId = "JIRA INTEGRATION ID HERE";
	// 🛑 Add your PB API token below. More info on creating an API token here: https://developer.productboard.com/#section/Authentication/Getting-a-token
	const pbAPITokenID = "ENTER TOKEN HERE";
	// 🛑 Enter the base URL of your Jira instance
	const jiraCloudURL = "https://your-url-here.atlassian.net";
	// 🛑 Enter your Jira Basic authentication below. (You will want this token hidden in something like a .env file)
	// In order to create your Jira Auth token you need to encode the following string into Base64
	// The string will have your email | colon | Jira API Key. Example:  "youremail@company.com:YOURJIREAPIKEY"
	// To obtain your Jira API key go to this link: https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/
	// Once you have the key enter the string into https://www.base64encode.org/ and click > ENCODE < ... You will habe to copy/paste the string provided to you as that is your Jira Auth Token
	const jiraAuth = "BASE64 AUTH TOKEN HERE";
	let jiraPBStatusMap;

	// Configuration for GET request to grab feature status
	const getFeatureInfoConfig = {
		method: "get",
		url: `https://api.productboard.com/features/${productboardFeatureID}`,
		headers: {
			"X-Version": "1",
			Authorization: `Bearer ${pbAPITokenID}`,
		},
	};

	// Configuration for GET request to grab the Jira ID the PB feature is connected to
	const getPbJiraInfoConfig = {
		method: "get",
		url: `https://api.productboard.com/jira-integrations/${jiraIntegrationId}/connections/${productboardFeatureID}`,
		headers: {
			"X-Version": "1",
			Authorization: `Bearer ${pbAPITokenID}`,
		},
	};

	// GET request is sent to grab feature status
	axios(getFeatureInfoConfig)
		.then(function (response) {
			console.log("Feature status is", response.data.data.status.name);
			const pbFeatureStatus = response.data.data.status.name;

			// 🛑 Add PB <> Jira Status mappings below through the IF Statement block of code.
			// The variable pbFeatureStatus is the status name of the feature in Productboard and the jiraPBStatusMap variable represents the Jira status.
			// Note that a transistion ID is provided to you for each Jira Status. In order to update a Jira issue's status via the API, you must send the Transistion ID in the body of your request.
			// To easily find your Transition IDs, make a GET request via the your webbrowser by entering in the following URL: https://<Enter Jira URL>.atlassian.net/rest/api/3/issue/<Enter Jira ID here>/transitions
			// The response will show you what the Transition IDs are for each Jira status

			if (pbFeatureStatus == "Candidate") {
				jiraPBStatusMap = {
					transition: {
						id: "11",
					},
				};
			} else if (pbFeatureStatus == "In Progress") {
				jiraPBStatusMap = {
					transition: {
						id: "21",
					},
				};
			} else if (pbFeatureStatus == "Released") {
				jiraPBStatusMap = {
					transition: {
						id: "41",
					},
				};
			} else {
				jiraPBStatusMap = null;
			}

			console.log("Transition ID is", jiraPBStatusMap);

			// Request to find Jira issue ID the PB feature is connected to
			axios(getPbJiraInfoConfig)
				.then(function (response) {
					console.log(
						"Feature Jira ID is",
						response.data.data.connection.issueId
					);

					// Get Jira integration ID, Transition ID, and configure the request to update Jira status
					const pbFeatureJiraId = response.data.data.connection.issueId;
					const transitionData = JSON.stringify(jiraPBStatusMap);

					const jiraConfig = {
						method: "post",
						url: `${jiraCloudURL}/rest/api/3/issue/${pbFeatureJiraId}/transitions`,
						headers: {
							Authorization: `Basic ${jiraAuth}`,
							"Content-Type": "application/json",
						},
						data: transitionData,
					};
					console.log(jiraConfig);

					// Send request to Jira to update status
					axios(jiraConfig)
						.then(function (response) {
							// Confirm status update went through with response code 204
							console.log("Response from Jira:", response.status);
						})
						.catch(function (error) {
							console.log(error.code);
						});
				})
				.catch(function (error) {
					console.log(error);
				});
		})
		.catch(function (error) {
			console.log(error);
		});
	res.end();
});

app.listen(port, () => {
	console.log(`Your integration is listening on port http://localhost:${port}`);
});
