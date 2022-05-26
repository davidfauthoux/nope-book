import * as async from "../modules/async.js";
import { Server } from "../modules/server.js";
import { Book } from "../modules/book.js";

Server.BASE = "http://localhost:8086"

let book = new Book();

async.run(
	book.load(),
	book.run(),
);
