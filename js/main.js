"use strict"

var categoryTable;
var areaTable;
var targetTable;
var currentCategoryIndex;
var currentAreaIndex;
var currentTargetIndex;
var currentDate;
var currentSexIndex;

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
		if (currentTargetIndex != 0) {
			filter += "FILTER(regex(?key,'" + targetTable[0][currentTargetIndex] + "'))";
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
							"?s <http://lodosaka.jp/property#keywords> ?key." +
							"?s <http://lodosaka.jp/property#keywords_label> ?key_label." +
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

	// 対象者メニューを作成する
	function makeTargetMenu() {
		var html = "";
		for (var i in targetTable[1]) {
			if (i == currentTargetIndex) {
				html += "<option value='" + i + "' selected>" + targetTable[1][i] + "</option>";
			} else {
				html += "<option value='" + i + "'>" + targetTable[1][i] + "</option>";
			}
		}
		$("#targetMenu").html(html);
		$("#targetMenu").change(function() {
			currentTargetIndex = $("#targetMenu").val();
			localStorage.currentTargetIndex = currentTargetIndex;
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
							"<div class='pushOsakaHeader'>" +
								"<div class='pushOsakaCategoryLabel'>" + data[i].category_label.value +"</div>" +
								"<div class='pushOsakaDate'>" + data[i].date.value.replace("T", " ").replace("Z", "") +"</div>" +
								"<div class='pushOsaka'><a class='pushOsakaTitle' href='" + data[i].link.value + "'>" + data[i].title.value +  "</a></div>" +
							"</div>" +
							"<a class='accordion-toggle' data-toggle='collapse' data_parent='#rss-list' href='#rss" + i + "'>" +
								"<img class='pushOsakaCategoryIcon' src='img/" + svgCategory +"' width='30'>" + 
							"</a>" +
						"</div>" +
						"<div id='rss" + i +"' class='according-body collapse'>" +
							"<div class='accordion-inner'>" +
								"<div class='pushOsakaInner'>分類：" + data[i].category_label.value + "</div>" +
								"<div class='pushOsakaInner'>地域：" + data[i].area_label.value + "</div>" +
								"<div class='pushOsakaInner'>職業：" + data[i].key_label.value + "</div>" +
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
	// 現在の対象者を取得
	currentTargetIndex = (localStorage.currentTargetIndex == null)? 0 : localStorage.currentTargetIndex;
	// 現在の日付を取得
	currentDate = (localStorage.currentDate == null)? "" : localStorage.currentDate;
	$("#dateValue").val(currentDate);
	// 現在の性別の取得
	currentSexIndex = (localStorage.currentSexIndex == null)? 0 : localStorage.currentSexIndex;
	$("[name='sex'] [value='0']").click();

	// カテゴリ情報の取得
	csvToArray("data/category.csv", function(table) {
		categoryTable = table;
		csvToArray("data/area.csv", function(table) {
			areaTable = table;
			csvToArray("data/target.csv", function(table) {
				targetTable = table;
				// カテゴリメニューの作成
				makeCategoryMenu();
				// 地域メニューの作成
				makeAreaMenu();
				// 対象者メニューの作成
				makeTargetMenu();
				// 日付設定の作成
				$("#dateValue").change(function() {
					currentDate = localStorage.currentDate = $("#dateValue").val();
					getRSSData(function(data) {
						// 広報を作成
						makePublicRelations(data);
					});
				});
				// 性別の取得
				$("[name='sex']").click(function() {
					currentSexIndex = $("[name='sex']:checked").val();
				});
				// 大阪市RSSの取得
				getRSSData(function(data) {
					// 広報を作成
					makePublicRelations(data);
				});
			});
		});
	});
	
});
