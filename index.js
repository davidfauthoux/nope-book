import * as async from "../modules/async.js";
import { Server, uuid, history } from "../modules/server.js";
import { EncryptionServer } from "../modules/encryption.js";

class Book {
	constructor() {
		this.knownUsers = {};
		this.helping = {};

		this.exposeTimeout = 5 * 60;
		this.recoverTimeout = 15 * 60;

		this.supervise = true;
		this.superviseEmail = "david.fauthoux@gmail.com";
		this.emailUser = "david.fauthoux@gmail.com";
		this.emailPassword = "";
		this.emailHost = "ssl0.ovh.net"; //"smtp.gmail.com"
		this.emailPort = 587;

		this.baseUrl = "http://localhost:8088/";

		this.encryptionServer = new EncryptionServer();

		this.superuserUserId = "users/book/" + "superuser"; //my_new_user_" + uuid();
		this.superuserPassword = "abc";
		this.superuserData = "david.fauthoux@gmail.com";
	
		this.exposePassword = "abc";
	}

	static now() {
		return new Date().getTime() / 1000.;
	}

	load() {
		let exposePasswordHash;
		let passwordHash;
		return [
			EncryptionServer.hash(this.exposePassword), (_) => { exposePasswordHash = _ },
			EncryptionServer.hash(this.superuserPassword), (_) => { passwordHash = _ },
			this.encryptionServer.cleanUser(this.superuserUserId),
			this.encryptionServer.clearUser(),
			{
				if: this.encryptionServer.userExists(this.superuserUserId),
				else: [
					() => console.log("CREATING SUPERUSER"),
					() => this.encryptionServer.createNewUser(this.superuserUserId, passwordHash, this.superuserData, exposePasswordHash),
					() => console.log("SUPERUSER CREATED"),
				],
			},

			() => this.encryptionServer.loadUser(this.superuserUserId, passwordHash, undefined, exposePasswordHash),
			() => console.log("SUPERUSER LOADED"),
		];
	}
	
	newUser(userId, hash) {
		if (this.knownUsers[userId] !== undefined) {
			console.log("COULD NOT CREATE NEW USER, ALREADY EXISTS", userId);
			return;
		}
		this.knownUsers[userId] = hash;
		console.log("NEW USER", userId, hash);
	}

	helpUser(title, userId, emailHtml, supervise) {
		let knownHash = this.knownUsers[userId];
		if (knownHash === undefined) {
			console.log("UNKNOWN USER", userId);
			return;
		}

		let s = new Server("/" + userId);

		console.log("KNOWN USER", userId, knownHash);

		let temp;
		let secret;

		return [
			() => {
				if (!supervise) {
					return [
						EncryptionServer.generateRandom(),
						(_) => { temp = _ },
					];
				} else {
					temp = knownHash;
				}
			},
			() => s.download("secret-" + knownHash), (_) => { secret = _ },
			() => s.download("data-" + secret),
			(data) => {
				// let helpedUser = dataContentsHeap.get();
				// if (helpedUser === null) {
				// 	console.log("DEPRECATED USER", userId, knownHash);
				// 	return;
				// }
				console.log("HELPED USER", userId, knownHash, data);

				this.helping[userId] = {
					timeout: Book.now() + this.recoverTimeout,
					temp: temp,
				};

				let url = this.baseUrl + "/" + userId.substring(0, userId.indexOf('/')) + "/?recover=" + encodeURIComponent(temp) + "&id=" + encodeURIComponent(userId);
				if (supervise) {
					url += "&supervise=" + encodeURIComponent("");
				}

				console.log("EMAIL:", data, temp, url);

				if (emailHtml === undefined) {
					emailHtml = {
						subject: "NO SUBJECT",
						text: "NO CONTENT\n{url}",
					}
				}

				let subject = emailHtml.subject;
				let text = emailHtml.text.replaceAll("{url}", url);

				if (!supervise) {
					return this.encryptionServer.mail({
						host: this.emailHost,
						port: this.emailPort,
						user: this.emailUser,
						password: this.emailPassword,
						to: data,
						subject: subject,
						text: text,
					});
				} else {
					return this.encryptionServer.mail({
						host: this.emailHost,
						port: this.emailPort,
						user: this.emailUser,
						password: this.emailPassword,
						to: this.superviseEmail,
						subject: "SUPERVISE / " + subject,
						text: text,
					});
				}
			},
		];
	};

	validateUser(userId, temp, newHash, emailHtml) {
		let h = this.helping[userId];

		if (h === undefined) {
			console.log("NOT HELPING", userId);
			return;
		}

		if (temp !== h.temp) {
			console.log("INVALID TEMP", temp, h.temp);
			if (emailHtml === undefined) {
				return;
			}
			return this.helpUser("RECOVER AGAIN (INVALID LINK)", userId, emailHtml, false);
		}
		if (Book.now() > h.timeout) {
			console.log("TEMP TOO OLD", temp, h.temp);
			if (emailHtml === undefined) {
				return;
			}
			return this.helpUser("RECOVER AGAIN (OBSOLETE LINK)", userId, emailHtml, false);
		}

		let knownHash = this.knownUsers[userId];

		let vault = new Server("/vault/" + userId);
		let s = new Server("/" + userId);

		let exposePasswordHash;
		let secret;

		return [
			EncryptionServer.hash(exposePassword), (_) => { exposePasswordHash = _ },
			() => s.download("secret-" + knownHash), (_) => { secret = _ },
			() => vault.expose("private-" + secret, exposePasswordHash, temp, this.exposeTimeout),
			() => vault.expose("private-encrypted-" + secret, exposePasswordHash, temp, this.exposeTimeout),
			() => {
				if (newHash !== knownHash) {
					return [
						() => s.upload("secret-" + newHash, secret),
						() => s.delete("secret-" + knownHash),
					];
				}
			},
			() => s.download("data-" + secret),
			(data) => {
				console.log("EMAIL:", data, "VALIDATED");
				return this.encryptionServer.stack({
					from: this.superuserUserId,
					to: this.superuserUserId,
					validated: {
						id: userId,
						hash: newHash
					}
				});
			},
		];
	}

	validatedUser(userId, hash) {
		if (hash === undefined) {
			return;
		}
		this.knownUsers[userId] = hash;
		delete this.helping[userId];
		console.log("VALIDATED USER", userId, hash);
	}

	ping() {
		return this.encryptionServer.stack({
			from: this.superuserUserId,
			to: this.superuserUserId,
			ping: "pong",
		});
	}

	run() {
		return {
			while: true,
			do: [
				history(this.encryptionServer),
				(r) => {
					if (r.old !== undefined) {
						let seq = [];
						for (let event of r.old) {
							if (event.to !== this.superuserUserId) {
								continue;
							}

							if (event.ping !== undefined) {
								continue;
							}

							if (event.new !== undefined) {
								delete willHelp[event.new.id];
								seq.push(newUser(event.new.id, event.new.hash, event.new.html));
								continue;
							}		

							if (event.validated !== undefined) {
								delete willHelp[event.validated.id];
								seq.push(validatedUser(event.validated.id, event.validated.hash));
								continue;
							}

							if (event.help !== undefined) {
								continue;
							}

							if (event.validate !== undefined) {
								continue;
							}		
						}								
						return seq;
					}

					if (r.to !== this.superuserUserId) {
						console.log("IGNORED REGISTER ID", r.to, "EXPECTING", this.superuserUserId);
						return;
					}
					
					if (r.ping !== undefined) {
						console.log("PING", r.ping);
						return;
					}

					if (r.new !== undefined) {
						return this.newUser(r.new.id, r.new.hash, r.new.html);
					}

					if (r.validated !== undefined) {
						return this.validatedUser(r.validated.id, r.validated.hash);
					}

					if (r.help !== undefined) {
						return this.helpUser("RECOVER/VALIDATE EMAIL", r.help.id, r.help.html, r.help.supervise);
					}
					
					if (r.validate !== undefined) {
						return this.validateUser(r.validate.id, r.validate.temp, r.validate.hash, r.validate.html);
					}
				},
			],
		};
	}
}

class BookClient {
	// data == email
	constructor(userId, password, data) {
		this.bookSuperuserUserId = "users/book/" + "superuser";

		this.encryptionServer = new EncryptionServer();
		this.urlBase = "HTTP://BASE/";

		this.userId = userId;
		this.password = password;
		this.data = data;

		this.supervise = true;
		this.exposePassword = password; // Providing a password reduces the security level because a .expose file will be created
	}

	_new(passwordHash) {
		return this.encryptionServer.stack({
			to: this.bookSuperuserUserId,
			new: {
				id: this.userId,
				hash: passwordHash,
			}
		});
	}

	_recover() {
		return this.encryptionServer.stack({
			to: this.bookSuperuserUserId,
			help: {
				id: this.userId,
				base: this.urlBase,
				html: {
					subject: "RECOVER",
					text: "CLICK {url}",
				},
				parameters: {},
				supervise: this.supervise,
			}
		});
	}

	clear() {
		return [
			this.encryptionServer.cleanUser(this.superuserUserId),
			this.encryptionServer.clearUser(),
		];
	}

	load() {
		let passwordHash;
		return [
			{
				try: [
					() => this.encryptionServer.retreiveUser(this.userId),
					() => this.encryptionServer.loadUser(this.userId, undefined, undefined, undefined),
					true,
				],
				catch: (e) => [
					() => console.log("USER NOT RETREIVED"),
					this.encryptionServer.cleanUser(this.userId),
					this.encryptionServer.clearUser(),
					{
						if: this.encryptionServer.userExists(this.userId),
						then: [
							() => console.log("USER EXISTS", this.userId),
							() => {
								if (this.password === undefined) {
									return [
										this._recover(),
										() => console.log("USER RECOVERING"),
										false,
									];
								} else {
									return [
										() => console.log("LOADING USER WITH PASSWORD", this.password),
										EncryptionServer.hash(this.password), (_) => { passwordHash = _ },
										() => this.encryptionServer.loadUser(this.userId, passwordHash, undefined, this.exposePassword),
										true,
									];
								}
							},
						],
						else: [
							() => console.log("CREATING USER"),
							EncryptionServer.hash(this.password), (_) => { passwordHash = _ },
							() => this.encryptionServer.createNewUser(this.userId, passwordHash, this.data, this.exposePassword),
							() => this._new(passwordHash),
							() => console.log("USER CREATED"),
							() => this._recover(),
							() => console.log("USER RECOVERING"),
							false,
						],
					},
				],
			}
		];
	}
	
	recover(password, tempPassword) {
		let waitTime = 1;
		let count = 0;
		let getSleepTime = () => {
			count++;
			if (count === 5) {
				throw e;
			}
			let t = waitTime;
			waitTime = Math.min(30, waitTime * 2);
			return t;
		};

		return [
			() => {
				if (supervise) {
					return tempPassword;
				}
				if (password === undefined) {
					return [
						EncryptionServer.generateRandom(),
						(r) => EncryptionServer.hash(r),
					];
				} else {
					return EncryptionServer.hash(password)
				}
			},
			(passwordHash) => {
				return [
					this.bookServer.stack({
						to: this.bookSuperuserUserId,
						validate: {
							id: this.userId,
							temp: tempPassword,
							hash: passwordHash,
						}
					}),
					{
						while: () => this.bookServer.user === undefined,
						do: {
							try: this.bookServer.loadUser(userId, passwordHash, tempPassword, undefined),
							catch: (e) => {
								console.log("ERROR", e);
								return { sleep: getSleepTime() };
							},
						},
					},
				];
			},
		];
	}
}

window.addEventListener("load", function() {
	let book = new Book();
	let bookClient = new BookClient("users/welcome/dav", "pass", "david.fauthoux+toto@gmail.com");

	let loopStack = 0;
	async.run(
		book.load(),
		() => [
			{ thread: book.run() },
			{
				thread: {
					while: () => loopStack < 5,
					do: [
						{ sleep: 2 },
						() => console.log("PINGING", loopStack),
						book.ping(),
						() => loopStack++,
					],
				},
			},
			{
				thread: [
					bookClient.load(),
					(result) => console.log("CLIENT LOADED", result), // true if no need to recover
				]
			},
		],
		() => console.log("DONE"),
	);


		// 			return sequence_(
	// 				while_(true_())
	// 					.do_(try_(
	// 						sequence_(

	// 		EncryptionServer.hash(password),
	// 		(hash) => { password = hash },
	// 		EncryptionServer.loadUser(userIdHeap, passwordHashHeap, userHeap, new Heap(), exposePasswordHashHeap)))
	// (passwordHash) => {
					
	// 			}
	// 		}


			
	// 		async.run([
	// 		]);
			
	// 		sequence_(
	// // 				EncryptingServer.hash(exposePassword, exposePasswordHashHeap),
	// // 				EncryptingServer.hash(passwordHeap, passwordHashHeap),
	// // 				EncryptingServer.loadUser(userIdHeap, passwordHashHeap, userHeap, new Heap(), exposePasswordHashHeap)))

	// 	EncryptionServer.hash("abc"),
	// 	(r) => {
	// 		console.log(r);
	// 	}
	// ]).run();

	// let location = Server.location();

	// let TIMEOUT = 5 * 60;

	// if (DomUtils.windowUrlParameters()["clear"] !== undefined) {
	// 	EncryptingServer.clearUser(new Heap(location.id))
	// 		.res(function() {
	// 			let url = location.url + "/" + location.id + "/";
	// 			console.log(url);
	// 			window.location.href = url;
	// 		}).run();
	// 	return;
	// }

	// let launch = function(id, password, superviseEmail) {
	// 	console.log("ID", id, password);

	// 	let passwordHeap = new Heap(password);
	// 	let passwordHashHeap = new Heap();
	// 	let userIdHeap = new Heap(location.id);

	// 	let exposePassword = new Heap(password); //TODO Another input for more security
	// 	let exposePasswordHashHeap = new Heap();

	// 	let userHeap = new Heap();
	// 	sequence_(
	// 		try_(sequence_(
	// 				EncryptingServer.hash(exposePassword, exposePasswordHashHeap),
	// 				EncryptingServer.hash(passwordHeap, passwordHashHeap),
	// 				EncryptingServer.loadUser(userIdHeap, passwordHashHeap, userHeap, new Heap(), exposePasswordHashHeap)))
	// 			.catch_(function(e) {
	// 				console.log("NEED TO CREATE", e);
	// 				let vault = new Server("/vault");
	// 				return sequence_(
	// 					EncryptingServer.hash(passwordHeap, passwordHashHeap),
	// 					EncryptingServer.newUser(userIdHeap, passwordHashHeap, new Heap(id)),
	// 					//%% EncryptingServer.hash(exposePassword, exposePasswordHashHeap),
	// 					vault.upload(new Heap(".expose"), exposePasswordHashHeap),
	// 					vault.upload(new Heap(".restricted+"), new Heap(
	// 						"\\.expose" + "\n" +
	// 						"\\.restricted.*" + "\n" +
	// 						"")),
	// 					vault.upload(new Heap(".restricted-"), new Heap(
	// 						"\\.expose" + "\n" +
	// 						"\\.restricted.*" + "\n" +
	// 						"")),
			
	// 					EncryptingServer.loadUser(userIdHeap, passwordHashHeap, userHeap, new Heap(), exposePasswordHashHeap));
	// 			}),
	// 		do_(function() {
	// 			let user = userHeap.get();
	// 			console.log(user);
				
	// 			let server = new EncryptingServer(user, new Server("/" + user.id));

	// 			let knownUsers = {};
	// 			let helping = {};

	// 			let helpUser = function(title, userId, emailHtml, supervise) {
	// 				let knownHash = knownUsers[userId];
	// 				if (knownHash === undefined) {
	// 					console.log("UNKNOWN USER", userId);
	// 					return noop_();
	// 				}
	// 				let secretContentsHeap = new Heap();
	// 				let dataContentsHeap = new Heap();
	// 				let tempHeap = new Heap();
	// 				let s = new Server("/" + userId);
	// 				console.log("KNOWN USER", userId, knownHash);
	// 				return sequence_(
	// 					if_(equals_(new Heap(supervise), true))
	// 						.then_(set_(tempHeap, knownHash))
	// 						.else_(EncryptingServer.generateRandom(tempHeap)),
	// 					s.download(new Heap("secret-" + knownHash), secretContentsHeap),
	// 					s.download(append_("data-", secretContentsHeap), dataContentsHeap),
	// 					do_(function() {
	// 						let helpedUser = dataContentsHeap.get();
	// 						if (helpedUser === null) {
	// 							console.log("DEPRECATED USER", userId, knownHash);
	// 							return throw_("deprecated hash");
	// 						}
	// 						console.log("HELPED USER", userId, knownHash, helpedUser);
	// 						helping[userId] = {
	// 							timeout: Server.now() + TIMEOUT,
	// 							temp: tempHeap.get()
	// 						};
	// 						let url = location.url + "/" + userId.substring(0, userId.indexOf('/')) + "/?recover=" + encodeURIComponent(tempHeap.get()) + "&id=" + encodeURIComponent(userId);
	// 						if (supervise === true) {
	// 							url += "&supervise=" + encodeURIComponent("");
	// 						}

	// 						let host = "ssl0.ovh.net"; //"smtp.gmail.com"
	// 						let port = 587;

	// 						return sequence_(
	// 							if_(equals_(new Heap(supervise), true))
	// 								.else_(server.mail(new Heap({
	// 									host: host,
	// 									port: port,
	// 									user: id,
	// 									password: password,
	// 									to: helpedUser,
	// 									subject: (emailHtml === undefined) ? "" : emailHtml.subject,
	// 									text: (emailHtml === undefined) ? url : emailHtml.text.replaceAll("{url}", url)
	// 								}))),
	// 							if_(not_(equals_(new Heap(superviseEmail), undefined)))
	// 								.then_(server.mail(new Heap({
	// 									host: host,
	// 									port: port,
	// 									user: id,
	// 									password: password,
	// 									to: superviseEmail,
	// 									subject: "SUPERVISE / " + ((emailHtml === undefined) ? "" : emailHtml.subject),
	// 									text: (emailHtml === undefined) ? url : emailHtml.text.replaceAll("{url}", url)
	// 								}))),
	// 							log_("EMAIL:", helpedUser, tempHeap.get()));
	// 						}));
	// 			};

	// 			let validateUser = function(userId, temp, newHash, emailHtml) {
	// 				let h = helping[userId];

	// 				if (h === undefined) {
	// 					console.log("NOT HELPING", userId);
	// 					return noop_();
	// 				}

	// 				if (temp !== h.temp) {
	// 					console.log("INVALID TEMP", temp, h.temp);
	// 					if (emailHtml === undefined) {
	// 						return noop_();
	// 					}
	// 					return helpUser("RECOVER AGAIN (INVALID LINK)", userId, emailHtml, false);
	// 				}
	// 				if (Server.now() > h.timeout) {
	// 					console.log("TEMP TOO OLD", temp, h.temp);
	// 					if (emailHtml === undefined) {
	// 						return noop_();
	// 					}
	// 					return helpUser("RECOVER AGAIN (OBSOLETE LINK)", userId, emailHtml, false);
	// 				}

	// 				let tempHeap = new Heap(temp);
	// 				let vault = new Server("/vault/" + userId);

	// 				let knownHash = knownUsers[userId];
	// 				let secretContentsHeap = new Heap();
	// 				let dataContentsHeap = new Heap();
	// 				let s = new Server("/" + userId);
	// 				return sequence_(
	// 					s.download(new Heap("secret-" + knownHash), secretContentsHeap),
	// 					vault.expose(append_("private-", secretContentsHeap), exposePasswordHashHeap, tempHeap, new Heap(TIMEOUT)),
	// 					vault.expose(append_("private-encrypted-", secretContentsHeap), exposePasswordHashHeap, tempHeap, new Heap(TIMEOUT)),
	// 					if_(not_(equals_(newHash, knownHash))).then_(sequence_(
	// 						s.upload(new Heap("secret-" + newHash), secretContentsHeap),
	// 						s.delete(new Heap("secret-" + knownHash)))),
	// 					s.download(append_("data-", secretContentsHeap), dataContentsHeap),
	// 					do_(function() {
	// 						let helpedUser = dataContentsHeap.get();
	// 						return sequence_(
	// 							server.stack(new Heap({
	// 								from: user.id,
	// 								to: user.id,
	// 								validated: {
	// 									id: userId,
	// 									hash: newHash
	// 								}
	// 							})),
	// 							log_("EMAIL:", helpedUser, "VALIDATED"));
	// 					}));
	// 			}

	// 			let newUser = function(userId, hash) {
	// 				if (knownUsers[userId] !== undefined) {
	// 					console.log("COULD NOT CREATE NEW USER, ALREADY EXISTS", userId);
	// 					return noop_();
	// 				}
	// 				knownUsers[userId] = hash;
	// 				console.log("NEW USER", userId, hash);
	// 				return noop_();
	// 			};

	// 			let validatedUser = function(userId, hash) {
	// 				if (hash === undefined) {
	// 					return noop_();
	// 				}
	// 				knownUsers[userId] = hash;
	// 				delete helping[userId];
	// 				console.log("VALIDATED USER", userId, hash);
	// 				return noop_();
	// 			};

	// 			let eventHeap = new Heap();
	// 			return sequence_(
	// 				while_(true_())
	// 					.do_(try_(
	// 						sequence_(
	// 							Server.fullHistory(server, eventHeap),
	// 							// sleep_(0.1),
	// 							do_(function() {
	// 								let r = eventHeap.get();
	// 								console.log(r);
									
	// 								if (r.old !== undefined) {
	// 									let seq = [];
	// 									let willHelp = {};
	// 									for (let event of r.old) {
	// 										if (event.new !== undefined) {
	// 											delete willHelp[event.new.id];
	// 											seq.push(newUser(event.new.id, event.new.hash, event.new.html));
	// 										}		
	// 										if (event.validated !== undefined) {
	// 											delete willHelp[event.validated.id];
	// 											seq.push(validatedUser(event.validated.id, event.validated.hash));
	// 										}
	// 										if (event.help !== undefined) {
	// 											willHelp[event.help.id] = {
	// 												html: event.help.html,
	// 												supervise: event.help.supervise
	// 											};
	// 										}
	// 										if (event.validate !== undefined) {
	// 										}		
	// 									}								
	// 									if (false) {
	// 										console.log("WILL HELP", willHelp);
	// 										Utils.each(willHelp, function(w, willHelpUserId) {
	// 											seq.push(helpUser("RECOVER/VALIDATE EMAIL", willHelpUserId, w.html, w.supervise));
	// 										});
	// 									}
	// 									return sequence_(...seq);
	// 								}

	// 								if (r.action === "") {
	// 									debugger;
	// 								}

	// 								if (!r.secure || (r.to !== userIdHeap.get())) {
	// 									console.log("IGNORED REGISTER ID", r.to);
	// 									return noop_();
	// 								}
									
	// 								if (r.new !== undefined) {
	// 									return newUser(r.new.id, r.new.hash, r.new.html);
	// 								}

	// 								if (r.validated !== undefined) {
	// 									return validatedUser(r.validated.id, r.validated.hash);
	// 								}

	// 								if (r.help !== undefined) {
	// 									return helpUser("RECOVER/VALIDATE EMAIL", r.help.id, r.help.html, r.help.supervise);
	// 								}
									
	// 								if (r.validate !== undefined) {
	// 									return validateUser(r.validate.id, r.validate.temp, r.validate.hash, r.validate.html);
	// 								}

	// 								return noop_();
	// 							})))
	// 						.catch_(function(e) {
	// 							return sequence_(
	// 								log_("ERROR", e),
	// 								sleep_(5));
	// 						})));
	// 			})).run();
	// };

	// let idInput = $("<input>").attr("id", "login").attr("placeholder", "Login");
	// let passwordInput = $("<input>").attr("id", "password").attr("type", "password").attr("placeholder", "Password");
	// let superviseInput = $("<input>").attr("id", "supervise").attr("placeholder", "Superviser email");
	// let button = $("<div>").attr("id", "submit").addClass("button").text("Run").click(function() {
	// 	let id = idInput.val().trim();
	// 	let password = passwordInput.val().trim();
	// 	let supervise = superviseInput.val().trim();
	// 	if (supervise === "") {
	// 		supervise = undefined;
	// 	}
	// 	idInput.remove();
	// 	passwordInput.remove();
	// 	superviseInput.remove();
	// 	button.remove();
	// 	console.log("LAUNCH", id, password, supervise);
	// 	launch(id, password, supervise);
	// });
	// $("body").append($("<div>").addClass("body").append(idInput).append(passwordInput).append(superviseInput).append(button));
});
