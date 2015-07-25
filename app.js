/*eslint-env node*/
"use strict";
var Crawler = require("crawler").Crawler;
var shell = require("shelljs");

var youtubeURL = "https://www.youtube.com/watch?v=";

var c = new Crawler({
	"maxConnections": 10,
	"userAgent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36",
	"callback": function(error, result, $) {
		$(".related-video").each(function(index, a) {
			var ID = a.href.substr(32);
			setTimeout(function(){
				c.queue([{
					"uri": "https://gdata.youtube.com/feeds/api/videos/" + ID + "?v=2&alt=json",
					"jQuery": false,
					"callback": function(error_, result_) {
						if (error_) {	return;	}
						var entry = JSON.parse(result_.body).entry;
						if (entry.yt$statistics.viewCount > 100000){
							shell.echo("title:" + entry.title.$t + " ,viewerCount:" + entry.yt$statistics.viewCount +
							" ,ID:" + entry.media$group.yt$videoid.$t + "\n").toEnd("output.txt");
						}
						setTimeout(function(){ c.queue(a.href); }, 1000 * index);
					}
				}]);
			}, 1000 * index);

		});
	}
});

//關鍵字搜尋"新聞"後的10筆結果，遞迴向下取得"相關影音"的資訊，級數成長
c.queue([{
	"uri": "https://gdata.youtube.com/feeds/api/videos?q=新聞&orderby=viewCount&start-index=11&max-results=10&v=2&alt=json",
	"jQuery": false,
	"callback": function(error, result) {
		if (error) { return; }
		var entry = JSON.parse(result.body).feed.entry;
		for (var i = 0; i < entry.length; ++i){
			if (entry[i].yt$statistics.viewCount > 100000){
				shell.echo("title:" + entry[i].title.$t + " ,viewerCount:" + entry[i].yt$statistics.viewCount +
				" ,ID:" + entry[i].media$group.yt$videoid.$t + "\n").toEnd("output.txt");
				c.queue(youtubeURL + entry[i].media$group.yt$videoid.$t);
			}
		}
	}
}]);
