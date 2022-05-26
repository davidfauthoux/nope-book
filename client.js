import * as async from "../modules/async.js";
import { Server } from "../modules/server.js";
import { BookClient } from "../modules/book.js";
import * as fs from "fs";

Server.BASE = "http://localhost:8086"

// window.addEventListener("load", function() {
// });
let bookClient = new BookClient("users/welcome/dav", "pass", "david.fauthoux+toto@gmail.com");
let recoverKey = null;
try {
	recoverKey = fs.readFileSync("recover").toString().trim();
} catch (e) {
}
console.log(recoverKey);

let credentials = undefined;
try {
	credentials = fs.readFileSync("credentials").toString().trim();
} catch (e) {
}
console.log(credentials);

async.run(
	() => {
		if (credentials === undefined) {
			return {
				if: bookClient.exists(),
				then: bookClient.recover("pass", recoverKey),
			};
		} else {
			return credentials;
		}
	},
	(credentials_) => bookClient.load(credentials_),
	(credentials_) => {
		if (credentials_ !== null) {
			fs.writeFileSync("credentials", credentials_);
			console.log("CLIENT LOADED", credentials_);
		}
	},
);
