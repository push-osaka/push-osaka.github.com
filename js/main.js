"use strict"

var categoryTable;
var areaTable;
var currentCategoryIndex;
var currentAreaIndex;
var currentDate;

$(function() {
	function makeFilter() {
		var filter ="";
		if (currentCategoryIndex != 0) {
			filter += "FILTER(?category = '" + categoryTable[0][currentCategoryIndex] + "')";
		}
		if (currentDate != "") {
			filter += "FILTER(xsd:dateTime(?date) >= '" + currentDate + "T00:00:00Z" + "'^^xsd:dateTime)";
		}
		if (currentAreaIndex != 0) {
			filter += "FILTER(regex(?area,'" + areaTable[0][currentAreaIndex] + "'))";
		}
		return filter;
	}
	
	// SPARQLで大阪市のRSSデータを取得する
	function getRSSData(completedFunc) {
		var sparql = new Sparql();
		var filter = makeFilter(categoryTable);
		var endpoint = "http://lod.hozo.jp/repositories/CHOsaka";
		var query = "SELECT ?category ?category_label ?title ?date ?link ?area ?area_label ?key ?key_label WHERE {" +
			 			"GRAPH <http://lodosaka.jp/osakarss> {"+
							"?s <http://lodosaka.jp/property#category> ?category." +
							"?s <http://lodosaka.jp/property#category_label> ?category_label." +
							"?s <http://lodosaka.jp/property#area> ?area." +
							"?s <http://lodosaka.jp/property#area_label> ?area_label." +
							"?s <http://lodosaka.jp/property#area> ?key." +
							"?s <http://lodosaka.jp/property#area_label> ?key_label." +
							"?s <http://purl.org/rss/2.0/title> ?title."+
							"?s <http://purl.org/rss/2.0/link> ?link."+
							"?s <http://purl.org/rss/2.0/pubDate> ?date. "+
							filter +
						"}" +
					"}ORDER BY DESC(?date)";
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

	// CSVデータを配列に取得する
	function csvToArray(fileName, completedFunc) {
		$.get(fileName, function(csvd) {
			// csvデータを行に分割
			var rows = csvd.replace(/\r/g, "").split("\n");
			// csvデータをテーブルにする
			var table = [];
			for (var i in rows) {
				table.push(rows[i].split(","));
			}
			// 完了通知関数を呼び出す
			completedFunc(table);
		});
	}

	// カテゴリメニューを作成する
	function makeCategoryMenu() {
		var html = "";
		for (var i in categoryTable[1]) {
			if (i == currentCategoryIndex) {
				html += "<option value='" + i + "' selected><img src='img/" + categoryTable[2][i] +"' width='25'>" + categoryTable[1][i] + "</option>";
			} else {
				html += "<option value='" + i + "'><img src='img/" + categoryTable[2][i] +"' width='25'>" + categoryTable[1][i] + "</option>";
			}
		}
		$("#categoryMenu").html(html);
		$("#categoryMenu").change(function() {
			currentCategoryIndex = $("#categoryMenu").val();
			localStorage.currentCategoryIndex = currentCategoryIndex;
			getRSSData(function(data) {
				// 広報を作成
				makePublicRelations(data);
			});
		});
	}

	// 地域メニューを作成する
	function makeAreaMenu() {
		var html = "";
		for (var i in areaTable[1]) {
			if (i == currentAreaIndex) {
				html += "<option value='" + i + "' selected>" + areaTable[1][i] + "</option>";
			} else {
				html += "<option value='" + i + "'>" + areaTable[1][i] + "</option>";
			}
		}
		$("#areaMenu").html(html);
		$("#areaMenu").change(function() {
			currentAreaIndex = $("#areaMenu").val();
			localStorage.currentAreaIndex = currentAreaIndex;
			getRSSData(function(data) {
				// 広報を作成
				makePublicRelations(data);
			});
		});
	}

	// 広報を作成する
	function makePublicRelations(data) {
		var html = "";
		for (var i in data) {
			var categoryIndex = categoryTable[0].indexOf(data[i].category.value);
			var svgCategory = categoryTable[2][categoryIndex];
			html +=	"<div class='accordion-group'>" + 
				   		"<div class='accordion-heading'>" +
							"<div class='pushOsakaDate'>" + data[i].date.value.replace("T", " ").replace("Z", "") +"</div>" +
							"<div class='pushOsakaCategoryLabel'>" + data[i].category_label.value +"</div>" +
							"<a class='accordion-toggle' data-toggle='collapse' data_parent='#rss-list' href='#rss" + i + "'>" +
								"<div class='accordion-table'><img src='img/" + svgCategory +"' width='30'></div>" +
								"<div class='accordion-table pushOsaka'>" + data[i].title.value +  "</div>" +
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
	}
	
	// 現在のカテゴリを取得
	currentCategoryIndex = (localStorage.currentCategoryIndex == null)? 0 : localStorage.currentCategoryIndex;
	// 現在の地域を取得
	currentAreaIndex = (localStorage.currentAreaIndex == null)? 0 : localStorage.currentAreaIndex;
	// 現在の日付を取得
	currentDate = (localStorage.currentDate == null)? "" : localStorage.currentDate;
	$("#dateValue").val(currentDate);

	// カテゴリ情報の取得
	csvToArray("data/category.csv", function(table) {
		categoryTable = table;
		csvToArray("data/area.csv", function(table) {
			areaTable = table;
			// 広報のカテゴリメニューの作成
			makeCategoryMenu();
			// 広報の地域メニューの作成
			makeAreaMenu();
			// 日付設定の作成
			$("#dateValue").change(function() {
				currentDate = localStorage.currentDate = $("#dateValue").val();
				getRSSData(function(data) {
					// 広報を作成
					makePublicRelations(data);
				});
			});
			// 大阪市RSSの取得
			getRSSData(function(data) {
				// 広報を作成
				makePublicRelations(data);
			});
		});
	});
	
});
