"use strict"

$(function() {
	function getRSSData(completedFunc) {
		var sparql = new Sparql();
		var filter = "";
		var endpoint = "http://lod.hozo.jp/repositories/CHOsaka";
		var query = "SELECT ?g ?title ?date ?link WHERE { GRAPH ?g "+
				"{ ?s <http://purl.org/rss/2.0/title> ?title."+
				" ?s <http://purl.org/rss/2.0/link> ?link."+
				" ?s <http://purl.org/rss/2.0/pubDate> ?date. }"+
				filter+
				"}"
		var qr = sendQuery(endpoint,query);
		qr.fail(
			function (xhr, textStatus, thrownError) {
				alert("Error: A '" + textStatus+ "' occurred.");
			}
		);
		qr.done(
			function (d) {
				completedFunc(d.results.bindings);
			}
		);
	}
	
	getRSSData(function(data) {
		var html = "";
		for (var i in data) {
			html +=	"<div class='accordion-group'>" + 
				   		"<div class='accordion-heading'>" +
							"<a class='accordion-toggle' data-toggle='collapse' data_parent='#rss-list' href='#rss" + i + "'>" +
								"<div class='accordion-table'><img src='img/mother9.svg' width='30'></div>" +
								"<div class='accordion-table pushOsaka'>" + data[i].title.value + "</div>" +
							"</a>" +
						"</div>" +
						"<div id='rss" + i +"' class='according-body collapse'>" +
							"<div class='accordion-inner'>" +
								"<a href='" + data[i].link.value + "'>" + data[i].link.value + "</a>" +
							"</div>" +
						"</div>" +
					"</div>";
		}
		$("#rss-list").html(html);
	});
});
