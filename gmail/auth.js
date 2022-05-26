const { google } = require("googleapis");
const credentials = require("./gmail-davfxx-credentials.json");

const { client_secret, client_id, redirect_uris } = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const url = oAuth2Client.generateAuthUrl({
	access_type: "offline",
	prompt: "consent",
	scope: ["https://www.googleapis.com/auth/gmail.send"],
});

console.log(url);