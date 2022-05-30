import * as forge_ from "node-forge";
global["forge"] = forge_.default;
import * as xmlhttprequest_ from "xmlhttprequest";
global["XMLHttpRequest"] = xmlhttprequest_.XMLHttpRequest;
XMLHttpRequest.DONE = 4;

import * as async from "../modules/async.js";
import { Book } from "../modules/book.js";

let book = new Book("http://localhost:8086");

async.run(
	book.load(),
	book.run(),
);
