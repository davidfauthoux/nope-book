import * as async from "../modules/async.js";
import { Book } from "../modules/book.js";

let book = new Book("http://localhost:8086");

async.run(
	book.load(),
	book.run(),
);
