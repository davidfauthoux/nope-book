//npm install esm
//node -r esm <file>.js
"use strict"

import * as async from "../modules/async-ext.js";
import { Server, now, history } from "../modules/server-ext.js";
import { EncryptionServer } from "../modules/encryption.js";

let args = {};
for (let a of process.argv) {
	if (a.startsWith("--")) {
		a = a.substring("--".length);
		let i = a.indexOf('=');
		let k = a.substring(0, i);
		let v = a.substring(i + 1);
		args[k] = v;
	}
}
Server.BASE = args.base; // "http://localhost:8086";
let password = args.password;
let exposePassword = password; //TODO
let superviseEmail = args.email;

console.log("Server.BASE", Server.BASE);
console.log("password", password);
console.log("superviseEmail", superviseEmail);

let TIMEOUT = 5 * 60;

let globalUserId = "book/superuser";

let mailData = {
	host: "ssl0.ovh.net", //"smtp.gmail.com",
	port: 587,
	user: "admin@davfx.com",
	password: password,
};

let helpOldEvents = false;

let passwordHash;
let exposePasswordHash;

let encryptionServer = new EncryptionServer();

let knownUsers = {};
let helping = {};

let helpUser = function(userId, emailHtml, language, supervise) {
	console.log("HELPING USER", userId, supervise)
	let knownHash = knownUsers[userId];
	if (knownHash === undefined) {
		console.log("UNKNOWN USER", userId);
		return;
	}
	console.log("KNOWN USER", userId, knownHash);

	let secret;
	let data;
	let temp;
	let userServer = new Server("/" + userId);
	return async._([
		() => {
			if (supervise) {
				temp = knownHash;
			} else {
				return async._([
					EncryptionServer.generateRandom(),
					(r) => temp = r,
				]);
			}
		},

		userServer.download("secret-" + knownHash),
		(r) => secret = r,
		() => userServer.download("data-" + secret),
		(r) => data = r,
		() => {
			let helpedUser = data;
			if (helpedUser === null) {
				console.log("DEPRECATED USER", userId, knownHash);
				throw "deprecated hash";
			}

			console.log("HELPED USER", userId, knownHash, helpedUser);

			helping[userId] = {
				timeout: now() + TIMEOUT,
				temp: temp
			};

			let url = Server.BASE + "/" + userId.substring(0, userId.indexOf('/')) + "/?recover=" + encodeURIComponent(temp) + "&id=" + encodeURIComponent(userId) + "&language=" + encodeURIComponent(language);
			if (supervise) {
				url += "&supervise=" + encodeURIComponent("");
			}

			if (!supervise) {
				console.log("EMAILING TO", helpedUser);
				return userServer.mail({
					host: mailData.host,
					port: mailData.port,
					user: mailData.user,
					password: mailData.password,
					to: helpedUser,
					subject: (emailHtml === undefined) ? "" : emailHtml.subject,
					text: (emailHtml === undefined) ? url : emailHtml.text.replaceAll("{url}", url)
				});
			} else {
				console.log("EMAILING TO (SUPERVISE)", superviseEmail);
				return userServer.mail({
					host: mailData.host,
					port: mailData.port,
					user: mailData.user,
					password: mailData.password,
					to: superviseEmail,
					subject: "SUPERVISE / " + ((emailHtml === undefined) ? "" : emailHtml.subject),
					text: (emailHtml === undefined) ? url : emailHtml.text.replaceAll("{url}", url)
				});
			}
		},
	]);
};

let validateUser = function(userId, temp, newHash) {
	let h = helping[userId];

	if (h === undefined) {
		console.log("NOT HELPING", userId);
		return;
	}

	if (temp !== h.temp) {
		console.log("INVALID TEMP", temp, h.temp);
		return;
	}
	if (now() > h.timeout) {
		console.log("TEMP TOO OLD", temp, h.temp);
		return;
	}

	let vaultServer = new Server("/vault/" + userId);

	let knownHash = knownUsers[userId];
	let secret;
	let userServer = new Server("/" + userId);
	return async._([
		userServer.download("secret-" + knownHash),
		(r) => secret = r,
		() => vaultServer.expose("private-" + secret, exposePasswordHash, temp, TIMEOUT),
		() => vaultServer.expose("private-encrypted-" + secret, exposePasswordHash, temp, TIMEOUT),
		() => {
			if (newHash !== knownHash) {
				return async._([
					userServer.upload("secret-" + newHash, secret),
					userServer.delete("secret-" + knownHash),
				]);
			}
		},
		encryptionServer.stack({
			from: globalUserId,
			to: globalUserId,
			validated: {
				id: userId,
				hash: newHash
			}
		}),
	]);
};

let newUser = function(userId, hash) {
	if (knownUsers[userId] !== undefined) {
		console.log("COULD NOT CREATE NEW USER, ALREADY EXISTS", userId);
		return;
	}
	knownUsers[userId] = hash;
	console.log("NEW USER", userId, hash);
};

let validatedUser = function(userId, hash) {
	if (hash === undefined) {
		return;
	}
	knownUsers[userId] = hash;
	delete helping[userId];
	console.log("VALIDATED USER", userId, hash);
};

async.run([
	EncryptionServer.hash(password),
	(hash) => passwordHash = hash,
	EncryptionServer.hash(exposePassword),
	(hash) => exposePasswordHash = hash,
	async.try_(new EncryptionServer().getPublicKey(globalUserId))
		.catch_((_e) => {
			let vaultServer = new Server("/vault");
			return async._([
				encryptionServer.createNewUser(globalUserId, passwordHash, ""),
				vaultServer.upload(".expose", exposePasswordHash),
				vaultServer.upload(".restricted+",
					"\\.expose" + "\n" +
					"\\.restricted.*" + "\n" +
					""),
				vaultServer.upload(".restricted-",
					"\\.expose" + "\n" +
					"\\.restricted.*" + "\n" +
					""),
			]);
		})
		.finally_(encryptionServer.loadUser(globalUserId, passwordHash, undefined, exposePasswordHash)),

	() => async.while_(() => true).do_([
		history(encryptionServer),
		(r) => {
			console.log(r);

			if (r.old !== undefined) {
				let seq = [];
				let willHelp = {};
				for (let event of r.old) {
					console.log("-", event);
					if (event.new !== undefined) {
						delete willHelp[event.new.id];
						seq.push(newUser(event.new.id, event.new.hash));
					}		
					if (event.validated !== undefined) {
						delete willHelp[event.validated.id];
						seq.push(validatedUser(event.validated.id, event.validated.hash));
					}
					if (event.help !== undefined) {
						willHelp[event.help.id] = {
							html: event.help.html,
							supervise: event.help.supervise
						};
					}
					if (event.validate !== undefined) {
					}		
				}								
				if (helpOldEvents) {
					console.log("WILL HELP", willHelp);
					for (let willHelpUserId in willHelp) {
						let w = willHelp[willHelpUserId];
						seq.push(helpUser(willHelpUserId, w.html, w.language, w.supervise === true));
					}
				}
				return async.sequence_(...seq);
			}

			if (r.to !== globalUserId) {
				console.log("IGNORED (UNSECURE)", r);
				return;
			}
			
			if (r.new !== undefined) {
				return newUser(r.new.id, r.new.hash);
			}

			if (r.validated !== undefined) {
				return validatedUser(r.validated.id, r.validated.hash);
			}

			if (r.help !== undefined) {
				return helpUser(r.help.id, r.help.html, r.help.language, r.help.supervise === true);
			}
			
			if (r.validate !== undefined) {
				return validateUser(r.validate.id, r.validate.temp, r.validate.hash);
			}			
		},
	]),	
]);
