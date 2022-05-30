import * as async from "../modules/async.js";
import { BookClient } from "../modules/book.js";
import credentials_json from "./credentials.json" assert { type: "json" };

window.addEventListener("load", function() {
	let book = new BookClient("http://localhost:8086", "users/welcome/dav", "pass", "david.fauthoux+toto@gmail.com");
	let recoverKey = null;

	let credentials = JSON.stringify(credentials_json);

	async.run(
		() => {
			if (credentials !== undefined) {
				return credentials;
			}
			if (recoverKey !== null) {
				return book.validate(recoverKey);
			}
			return {
				if: book.exists(),
				then: [
					book.recover(),
				],
				else: [
					book.create(),
				],
			};
		},
		(ser) => {
			if (ser !== null) {
				return [
					book.load(ser),
					() => console.log("CLIENT LOADED", ser),
					() => [
						{
							thread: {
								while: true,
								do: [
									book.history.history(),
									_ => console.log(_),
								],
							},
						},
						{
							thread: {
								while: true,
								do: [
									book.history.stack({
										ping: "pong",
										from: book.userId,
										to: book.userId,
									}),
									{ sleep: 10 },
								],
							},
						},
					],
				];
			}
		},
	);
});
