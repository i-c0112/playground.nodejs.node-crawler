"use strict";
var Crawler = require("crawler").Crawler;
var shell = require("shelljs");
var cheerio = require("cheerio");
var request = require("request");
var fs = require("fs");

var c = new Crawler({
	"maxConnections": 10,
	"userAgent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36",
	"jQuery": false,
});

var cookieData = shell.cat(".ehentai.cookie").split(","),
cookie = "ipb_member_id=" + cookieData[0] + ";ipb_pass_hash=" + cookieData[1];

c.queue([{
	uri: "http://g.e-hentai.org/hentaiathome.php",
	headers: {
		Cookie: cookie,
	},
	callback: checkIfLogin,
}]);

function checkIfLogin(error, result, $) {
	// bugfix: crawler somehow fail to load cheerio into $
	if (error) {
		shell.echo(error);
		shell.exit(1);
	}
	$ = cheerio.load(result.body);
	shell.echo("Login successfully. Detected running client: " + $("table:has(th:contains(Client)):has(th:contains(ID)) td a").text());
	c.queue({
		uri: "http://g.e-hentai.org/g/837796/576f26a4ed/",
		headers: {Cookie: cookie},
		callback: parseGallery,
	});
}

function parseGallery(error, result, $) {
	if (error) {
		shell.echo(error);
		return;
	}
	$ = cheerio.load(result.body);
	var pageLinks = $("#gdt .gdtm a");
	pageLinks.each(function (index, a) {
		shell.echo(a.attribs.href);
	});
	c.queue({
		uri: pageLinks.get(0).attribs.href,
		headers: {Cookie: cookie},
		callback: parsePage,
	});
}

function parsePage(error, result, $) {
	if (error) {
		shell.echo(error);
		return;
	}
	$ = cheerio.load(result.body);

	shell.echo("Parsing a page...");
	shell.echo($("body").html());
	shell.echo("\n\nFinding img...");
	var img = $("#i3 a img");
	shell.echo(img.length);
	shell.echo(img.get(0));

	request({
		uri: img.get(0).attribs.src,
		headers: {Cookie: cookie},
	}).pipe(fs.createWriteStream("output/ehentai.jpg"));
}
