const fs = require("fs");
const path = require("path");
const sendMail = require("./gmail");

let to = null;
let subject = null;
let textLines = [];
let htmlLines = null;
for (let line of fs.readFileSync(0).toString().split('\n')) {
	line = line.trim();
	if (line === "") {
		if (htmlLines === null) {
			htmlLines = [];
		}
		continue;
	}
	if (to === null) {
		to = line;
		continue;
	}
	if (subject == null) {
		subject = line;
		continue;
	}
	if (htmlLines !== null) {
		htmlLines.push(line);
		continue;
	}
	textLines.push(line);
}
let text = textLines.join('\n');
let html = htmlLines.join('\n');
console.log(to);
console.log(subject);
console.log(text);
console.log(html);

const main = async () => {
	// const fileAttachments = [
	// 	// {
	// 	// 	filename: 'attachment1.txt',
	// 	// 	content: 'This is a plain text file sent as an attachment',
	// 	// },
	// 	// {
	// 	//   path: path.join(__dirname, './attachment2.txt'),
	// 	// },
	// 	// {
	// 	// 	filename: 'websites.pdf',
	// 	// 	path: 'https://www.labnol.org/files/cool-websites.pdf',
	// 	// },
	// 	// {
	// 	// 	filename: 'image.png',
	// 	// 	content: fs.createReadStream(path.join(__dirname, './attach.png')),
	// 	// },
	// ];

	const options = {
		to: to,
		// cc:
		// replyTo:
		subject: subject,
		text: text,
		html: html,
		// attachments: fileAttachments,
		textEncoding: "base64",
		// headers: [
		// 	{ key: 'X-Application-Developer', value: '' },
		// 	{ key: 'X-Application-Version', value: '' },
		// ],
	};

	const messageId = await sendMail(options);
	return messageId;
};

main()
	.then((messageId) => {
		console.log("Message sent successfully:", messageId);
		process.exitCode = 0;
	})
	.catch((err) => {
		console.error(err);
		process.exitCode = 1;
	});