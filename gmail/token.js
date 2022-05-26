const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");
const credentials = require("./gmail-davfxx-credentials.json");

const code = fs.readFileSync(0).toString().trim();
const { client_secret, client_id, redirect_uris } = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

oAuth2Client.getToken(code).then(({ tokens }) => {
	const tokenPath = path.join(__dirname, "token.json");
	fs.writeFileSync(tokenPath, JSON.stringify(tokens));
});