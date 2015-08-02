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

var utils = (function (){
	return {
		getTokenFromPath: function (path){
			if (typeof path.split !== "function"){
				throw new TypeError("path is not a string!");
			}
			// "/s/<pageToken>/<gid>-<pageNum>"
			path = path.split("/");
			var tmp = path[3].split("-");
			return {
				pageNum: tmp[1],
				pageToken: path[2],
				gid: tmp[0],
			};
		},
	};
})();

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
		callback: crawlGallery,
	});
}

function crawlGallery(error, result, $) {
	if (error) {
		shell.echo(error);
		return;
	}
	$ = cheerio.load(result.body);
	shell.echo("Crawling:\n" + result.uri);

	var pageLinks = $("#gdt .gdtm a");
	pageLinks.each(function (index, a) {
		shell.echo(a.attribs.href);
		c.queue({
			uri: a.attribs.href,
			headers: {Cookie: cookie},
			callback: downloadPage,
		});
	});

	// exclude prev, next navigator
	var numThumbnailPages = $(".ptt td").length - 2;
	var current = Number($(".ptt .ptds").text());
	shell.echo(current + " / " + numThumbnailPages);
	if (current === numThumbnailPages) {
		return;
	}
	var tmp = result.uri.replace(/\?p=\d+/, "");
	tmp += "?p=" + current;
	c.queue({
		uri: tmp,
		headers: {Cookie: cookie},
		callback: crawlGallery,
	});
}

function downloadPage(error, result, $) {
	if (error) {
		shell.echo(error);
		return;
	}
	$ = cheerio.load(result.body);

	var token = utils.getTokenFromPath(result.req.path);
	shell.echo("Parsing page " + token.pageNum + "...");
	var src = $("#i3 a img").get(0).attribs.src;
	shell.echo(src);

	request({
		uri: src,
		headers: {Cookie: cookie},
	}).pipe(fs.createWriteStream("output/ehentai-" + token.gid + "-" + token.pageNum + ".jpg"));
}
