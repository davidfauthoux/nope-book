import * as forge_ from "node-forge";
global["forge"] = forge_.default;
import * as xmlhttprequest_ from "xmlhttprequest";
global["XMLHttpRequest"] = xmlhttprequest_.XMLHttpRequest;
XMLHttpRequest.DONE = 4;
import * as WebSocket_ from "isomorphic-ws";
global["WebSocket"] = WebSocket_.default;
import * as Blob_ from "cross-blob";
global["Blob"] = Blob_.default;

import * as async from "../modules/async.js";
import { Book } from "../modules/book.js";
import credentials from "./book-credentials.json" assert { type: "json" };

let book = new Book("http://localhost:8086", credentials);

async.run(
	book.load(),
	book.run(),
);
