import * as async from "../modules/async.js";
import { Server, uuid, history } from "../modules/server.js";
import { EncryptionServer } from "../modules/encryption.js";

window.addEventListener("load", function() {
	let encryptionServer = new EncryptionServer();

	let userId = "users/book/" + "superuser_"; //my_new_user_" + uuid();
	let password = "abc";
	let userData = "david.fauthoux@gmail.com";
	console.log(userId, password);

	let exposePassword = "abc";

	let exposePasswordHash;
	let passwordHash;

	async.run([
		EncryptionServer.hash(exposePassword),
		(hash) => { exposePasswordHash = hash },
		EncryptionServer.hash(password),
		(hash) => { passwordHash = hash },
		() => encryptionServer.cleanUser(userId),
		() => encryptionServer.cleanUser(),
		() => encryptionServer.userExists(userId),
		(pub) => console.log("USER == ", pub),
		// () => encryptionServer.createNewUser(userId, passwordHash, userData, exposePasswordHash),
		// () => console.log("USER CREATED"),
		// encryptionServer.clearUser(userId),
		// () => console.log("USER CLEARED"),
		// encryptionServer.recoverUser(userId, { subject: "NO SUBJECT", text: "CLICK {url}" }, true),
		// () => console.log("USER RECOVERING"),
	]);

	// async.run([
	// 	EncryptionServer.hash(exposePassword),
	// 	(hash) => { exposePasswordHash = hash },
	// 	EncryptionServer.hash(password),
	// 	(hash) => { passwordHash = hash },
	// 	() => console.log(":", exposePasswordHash, "/", passwordHash),
	// 	() => encryptionServer.loadUser(userId, passwordHash, undefined, exposePasswordHash),
	// 	() => {
	// 		let h = history(encryptionServer);
	// 		return async.while_(() => true).do_([
	// 			async.sleep(1),
	// 			h,
	// 			(e) => console.log("OK", e),
	// 		]);
	// 	}
	// ]);

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
