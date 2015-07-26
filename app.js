"use strict";
var Crawler = require("crawler").Crawler;
var shell = require("shelljs");
var cheerio = require("cheerio");

var c = new Crawler({
	"maxConnections": 10,
	"userAgent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36",
	"callback": function(error, result, $) {
		// bugfix: crawler somehow fail to load cheerio into $
		$ = cheerio.load(result.body);
		if (error) {
			shell.echo(error);
			shell.exit(1);
		}

		$("#rank > div").eq(2).children().eq(1).find("li > a").each(function (index, a) {
			shell.echo($(a).attr("href"));
		});
	},
});

c.queue([{
	uri: "https://tw.mall.yahoo.com/152982958-category.html",
	jQuery: false,
}]);
