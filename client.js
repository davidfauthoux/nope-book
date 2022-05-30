import * as async from "../modules/async.js";
import { BookClient } from "../modules/book.js";
import * as fs from "fs";

// window.addEventListener("load", function() {
// });
let bookClient = new BookClient("http://localhost:8086", "users/welcome/dav", "pass", "david.fauthoux+toto@gmail.com");
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
		if (credentials !== undefined) {
			return credentials;
		}
		if (recoverKey !== null) {
			return bookClient.validate(recoverKey);
		}
		return {
			if: bookClient.exists(),
			then: [
				bookClient.recover(),
			],
			else: [
				bookClient.create(),
			],
		};
	},
	(ser) => {
		if (ser !== null) {
			return [
				bookClient.load(ser),
				() => fs.writeFileSync("credentials", ser),
				() => console.log("CLIENT LOADED", ser),
				() => [
					{
						thread: {
							while: true,
							do: [
								bookClient.history.history(),
								_ => console.log(_),
							],
						},
					},
					{
						thread: {
							while: true,
							do: [
								bookClient.history.stack({
									ping: "pong",
									from: bookClient.userId,
									to: bookClient.userId,
								}),
								{ sleep: 1 },
							],
						},
					},
				],
			];
		}
	},
);
