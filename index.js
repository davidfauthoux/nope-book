import * as nope from "./nope.js";
import * as async from "../modules/async.js";
// import credentials_json from "./credentials.json" assert { type: "json" };

window.addEventListener("load", function() {
	async.run(
		nope.launch(),
		(history) => {
			if (history !== null) {
				return [
					{
						thread: {
							while: true,
							do: [
								history.history(),
								_ => console.log(_),
							],
						},
					},
					{
						thread: {
							while: true,
							do: [
								history.stack({
									ping: "pong",
									from: history._history.encryption.id,
									to: history._history.encryption.id,
								}),
								{ sleep: 10 },
							],
						},
					},
				];
			}
		},
	);
});
