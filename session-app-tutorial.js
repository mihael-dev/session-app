/*
 * Basic responsive mashup template
 * @owner Enter you name here (xxx)
 */
/*
 *    Fill in host and port for Qlik engine
 */
var prefix = window.location.pathname.substr(0, window.location.pathname.toLowerCase().lastIndexOf("/extensions") + 1);
var config = {
	host: window.location.hostname,
	prefix: prefix,
	port: window.location.port,
	isSecure: window.location.protocol === "https:"
};
require.config({
	baseUrl: (config.isSecure ? "https://" : "http://") + config.host + (config.port ? ":" + config.port : "") + config.prefix + "resources"
});

require(["js/qlik"], function (qlik) {

	//var obj = require('./vizdata.json'); 
	qlik.setOnError(function (error) {
		$('#popupText').empty();
		$('#popupText').append(error.message + "<br>");
		$('#popup').fadeIn(1000);
	});

	$("#closePopup").click(function () {
		$('#popup').hide();
	});

	$(".create-viz").addClass("lui-disabled");
	$(".stop-reload").addClass("lui-disabled");

	$(".section-3").click(function () {
		$(".content-3").toggleClass("show-section");
	});

	$(".get-script").click(function () {
		var appId = $(".app-id").val();
		app1 = qlik.openApp(appId, config);
		app1.getScript().then(function (script) {
			$(".get-script-result").val(script.qScript);
			//console.log( script );
		});
	});



	$(".set-script").click(function () {
		$(".msg-success").removeClass("show");
		$(".msg-fail").removeClass("show");

		var script = $(".set-script-input").val();
		var app2 = qlik.sessionApp(config);
		app2.setScript(script).then(function () {
			var stop = setInterval(function () {
				app2.global.getProgress(app2.model.handle).then(function (progress) {
					//console.log("DoReload progress", progress);
				});
			}, 100);
			app2.doReload().then(function (result) {
				if (result) {
					$(".msg-success").addClass("show");
				} else {
					$(".msg-fail").addClass("show");
				}

			}).finally(function () {
				clearInterval(stop);
			}).catch(function (error) {
				console.log(error);
			});

			app2.getScript().then(function (script) {
				$(".set-script-result").val(script.qScript);
			});
		});
	});

	var sessionApp = null;
	var vizArray = [];

	$(".close-session-app").click(function () {

		$(".create-session-app").removeClass("lui-disabled");
		$(".close-session-app").addClass("lui-disabled");

		if (sessionApp !== null) {

			vizArray.forEach(viz => {
				viz.close();
			});
			sessionApp.close().then(function () {
				close.info("session app closed");
			});
		}

	});
	$(".close-session-app").addClass("lui-disabled");


	$(".create-session-app").click(function () {

		$(".create-session-app").addClass("lui-disabled");
		$(".close-session-app").removeClass("lui-disabled");

		//var app1 = qlik.openApp('5921821f-92d4-4739-b684-a96426c2b4cf', config);
		//app1.getObject("QV01", "LLcbhj");

		sessionApp = qlik.sessionApp(config);


		qlik.theme.apply('breeze');

		//var app1 = qlik.openApp('addScript.qvf', config);

		/*app1.setScript(appconfig.script).then(function() {
			app1.variable.create({qName : 'vLastExectued', qDefinition: '0'}).then(function() {
				app1.doSave().then(function() {
					sessionApp.doSave().then(function(progress){
						})

					
				});
			});
			
		});*/

		//createdApp.getScript().then(function(script){

		$.getJSON("./vizdata.json").then(function (vizData) {
			sessionApp.setScript(vizData.script).then(function () {
				var stop = setInterval(function () {
					sessionApp.global.getProgress(sessionApp.model.handle).then(function (progress) {
						console.log("DoReload progress", progress);
					});
				}, 1000);


				//sessionApp.variable.createSessionVariable({ qName: 'vLastExectued', qDefinition: '0' }).then(function (result) {


					sessionApp.doReload().then(function (result) {

						sessionApp.visualization.create('linechart', [], vizData.lineTrend).then(function (vis) {
							vis.show("QV01");
							//sessionApp.getObject("QV01", vis.id);
							vizArray.push(vis);
						});
						sessionApp.visualization.create('kpi', [], vizData.timestamp).then(function (vis) {
							vis.show("QV02");

							vizArray.push(vis);
						});
						sessionApp.visualization.create('listbox', ["MachineName"], {}).then(function (vis) {
							vis.show("QV03");
							vizArray.push(vis);
						});
						sessionApp.getObject('CurrentSelections', 'CurrentSelections');


						var reload;
						var reloadStarted = false;

						$(".clear-all").click(function () {
							sessionApp.clearAll();
						});

						$(".step-forward").click(function () {
							sessionApp.forward();
						});

						$(".step-back").click(function () {
							sessionApp.back();
						});

						$(".lock-all").click(function () {
							sessionApp.lockAll();

						});

						$(".show-all").click(function () {
							sessionApp.visualization.create('linechart', [], vizData.lineTrend).then(function (vis) {
								vis.show("QV01");
							});

						});

						$(".show-50").click(function () {
							let lineProp = JSON.parse(JSON.stringify(vizData.lineTrend));
							lineProp.qHyperCubeDef.qMeasures[0].qDef.qDef = 'Avg({<Timestamp={">=$(=(Timestamp(max(Timestamp) - (1/24/60))))"}>} Temperature)';
							sessionApp.visualization.create('linechart', [], lineProp).then(function (vis) {
								vis.show("QV01");
							});

							//sessionApp.lockAll();

						});



						$(".full-reload").click(function () {
							$(".full-reload").addClass("lui-disabled");
							sessionApp.doReload().then(function (result) {
								$(".full-reload").removeClass("lui-disabled");
							});

						});

						$(".partial-reload").click(function () {

							$(".partial-reload").addClass("lui-disabled");
							$(".stop-reload").removeClass("lui-disabled");
							try {
								reload = setInterval(function () {
									if (!reloadStarted) {
										//$( '#popupText' ).remove();
										reloadStarted = true;
										sessionApp.doReload(0, true).then(function (result) {
											reloadStarted = false;
										});
									}
								}, 2000);
							} catch (e) {
								console.info(e);
							}
						});

						$(".stop-reload").click(function () {
							try {
								clearInterval(reload);
								$(".partial-reload").removeClass("lui-disabled");
								$(".stop-reload").addClass("lui-disabled");

							} catch (e) {
								console.info(e);
							} finally {
								clearInterval(reload);
							}
						});

						$(".create-ODAG").click(function () {



						});



					}).finally(function () {
						clearInterval(stop);
					}).catch(function (error) {
						console.log(error);
					});
				//});


			});
		});





	});
});