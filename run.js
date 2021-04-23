const puppeteer = require("puppeteer");

let url = process.argv[2].trim();
let login = process.argv[3].trim();
let supervise = process.argv[4].trim();
let password = process.argv[5].trim();

(async () => {
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();
	await page.goto(url, {
		waitUntil: "networkidle0"
	});
	await page.waitForSelector("#login", { visible: true });
	await page.waitForSelector("#login", { visible: true });
	await page.waitForSelector("#password", { visible: true });
	await page.waitForSelector("#supervise", { visible: true });
	await page.waitForSelector("#submit", { visible: true });

	await page.evaluate((login, password, supervise) => {
		document.querySelector("#login").value = login;
		document.querySelector("#password").value = password;
		document.querySelector("#supervise").value = supervise;
		document.querySelector("#submit").click();
	}, login, password, supervise);

	// await browser.close();
})();
