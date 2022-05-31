import { Book, BookClient } from "../modules/book.js";

export function launch() {
	let url = new URL(window.location.href);
	let getParam = (k) => {
		let v = url.searchParams.get(k);
		if (v === null) {
			v = undefined;
		}
		return v;
	};
	let recoverKey = getParam("recover");
	let id = Book.userId(getParam("id"));
	let password = getParam("password");
	let email = getParam("email");
	let clear = getParam("clear");

	let rebuildUrl = () => {
		let a = "";
		for (let k of url.searchParams.keys()) {
			if (k === "recover") {
				continue;
			}
			if (k === "clear") {
				continue;
			}
			if (a === "") {
				a += "?";
			} else {
				a += "&";
			}
			a += k + "=" + url.searchParams.get(k);
		}
		return url.protocol + "//" + url.host + url.pathname + a + url.hash;
	};

	window.history.pushState("", "", rebuildUrl());

	let book = new BookClient(url.protocol + "//" + url.host, id, password, email, window.location.href);

	let credentialsKey = "credentials:" + id;

	if (recoverKey !== undefined) {
		localStorage.removeItem(credentialsKey);
	}

	if (clear !== undefined) {
		localStorage.removeItem(credentialsKey);
	}

	let credentials = localStorage.getItem(credentialsKey);

	return [
		() => {
			if (credentials !== null) {
				console.log("FOUND CREDENTIALS");
				return credentials;
			}
			if (recoverKey !== undefined) {
				console.log("VALIDATING");
				return book.validate(recoverKey);
			}
			return {
				if: book.exists(),
				then: () => {
					if (book.password === undefined) {
						console.log("RECOVERING");
						return book.recover();
					} else {
						console.log("RESTORING");
						return book.restore();
					}
				},
				else: book.create(),
			};
		},
		(ser) => {
			if (ser !== null) {
				return [
					book.load(ser),
					() => localStorage.setItem(credentialsKey, ser),
					() => console.log("CLIENT LOADED", ser),
					() => book.history,
				];
			} else {
				return null;
			}
		},
	];
};
