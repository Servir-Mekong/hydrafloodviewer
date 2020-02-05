(function () {
	'use strict';
	angular.module('baseApp')
	.controller('hydrafloodviewer' ,function ($scope, $timeout, MapService) {

		/* global variables to be tossed around like hot potatoes */
		$scope.initdate = '';
		$scope.showAlert = false;

		var map,
		selected_date,
		browse_layer,
		basemap_layer,
		precip_layer,
		historical_layer,
		sentinel1_layer,
		recent_date,
		admin_layer,
		flood_layer,
		drawing_polygon,
		$layers_element;

		$('.js-range-slider').ionRangeSlider({
			skin: "round",
			type: "double",
			grid: true,
			from: 0,
			to: 11,
			values: [
				"Jan", "Feb", "Mar", "Apr", "May", "Jun",
				"Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
			]
		});
		$layers_element = $('#layers');
		var browseSlider = $('#browse-opacity').slider();
		var precipSlider = $('#precip-opacity').slider();
		var historicalSlider = $('#historical-opacity').slider();
		var sentinel1Slider = $('#sentinel1-opacity').slider();
		var floodSlider = $('#flood-opacity').slider();
		var floodSlider1 = $('#flood1-opacity').slider();
		var ip_lat = 17.5;
		var ip_long = 95.7;

		// init map
		map = L.map('map',{
			center: [ip_lat,ip_long],
			zoom: 6,
			minZoom:2,
			maxZoom: 16,
			maxBounds: [
				[-120, -220],
				[120, 220]
			]
		});
		map.createPane('floodsLayer');
		map.createPane('waterLayer');
		map.getPane('floodsLayer').style.zIndex = 998;
		map.getPane('waterLayer').style.zIndex = 999;

		$.ajax({
				url: "http://gd.geobytes.com/GetCityDetails?callback=?",
				async: false,
				dataType: 'json',
				success: function(data) {
						ip_lat = data.geobyteslatitude;
						ip_long = data.geobyteslongitude;
						map.setView([ip_lat, ip_long], 7);
				}
		});


		// Initialise the FeatureGroup to store editable layers
		var editableLayers = new L.FeatureGroup();
		map.addLayer(editableLayers);

		var drawPluginOptions = {
			draw: {
				polygon: {
					allowIntersection: false, // Restricts shapes to simple polygons
					drawError: {
						color: '#e1e100', // Color the shape will turn when intersects
						message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
					},
					shapeOptions: {
						color: '#fd5a24',
						strokeWeight: 2,
						fillOpacity: 0
					}
				},

				// disable toolbar item by setting it to false
				polyline: false,
				circle: false, // Turns off this drawing tool
				circlemarker: false,
				rectangle: {
					shapeOptions: {
						color: '#fd5a24',
						strokeWeight: 2,
						fillOpacity: 0
					}
				},
				marker: false,
			},
			edit: {
				featureGroup: editableLayers, //REQUIRED!!
				edit: true
			}
		};

		// Initialise the draw control and pass it the FeatureGroup of editable layers
		var drawControl = new L.Control.Draw(drawPluginOptions);
		map.addControl(drawControl);

		map.on('draw:created', function(e) {
			editableLayers.clearLayers();
			var type = e.layerType,
			layer = e.layer;
			drawing_polygon = [];
			var userPolygon = layer.toGeoJSON();
			drawing_polygon.push('ee.Geometry.Polygon(['+ JSON.stringify(userPolygon.geometry.coordinates[0])+'])');
			updateFloodMapLayer();
			updatePermanentWater();
			editableLayers.addLayer(layer);
			$("#btn_download").prop("disabled",false);
			$("#btn_download").removeClass("btn_custom_disable");
		});
		map.on('draw:edited', function(e) {
			var editedlayers = e.layers;
			editedlayers.eachLayer(function(layer) {
				var userPolygon = layer.toGeoJSON();
				drawing_polygon = [];
				drawing_polygon.push('ee.Geometry.Polygon(['+ JSON.stringify(userPolygon.geometry.coordinates[0])+'])');
				updateFloodMapLayer();
				updatePermanentWater();

			});
		});
		map.on('draw:deleted', function(e) {
			var userPolygon = '';
			drawing_polygon = '';
			$("#btn_download").prop("disabled","disabled");
			$("#btn_download").addClass("btn_custom_disable");
		});


		var mmr_adm3_layer =L.geoJson(mmr_adm3, {
			style: function(feature) {
				return {
					color: "#686868",
					fill: false,
					opacity: 0,
					clickable: true,
					weight: 0.5,
				};
			},
			onEachFeature: function(feature, layer) {
				layer.bindPopup('<p>'+feature.properties.ST+'</p>' );
			}
		}).addTo(map);
 		//control.addOverlay(mmr_adm3_layer, 'Township');
		var mmr_adm2_layer =L.geoJson(mmr_adm2, {
		    style: function(feature) {
		        return {
		            color: "black",
		            fill: false,
		            opacity: 0,
		            clickable: true,
					weight: 1,
		        };
		    },
		    onEachFeature: function(feature, layer) {
		        layer.bindPopup('<p>'+feature.properties.ST+'</p>' );
		    }
		}).addTo(map);
		//control.addOverlay(mmr_adm2_layer, 'Province/State');

		var mmr_adm0_layer = L.geoJson(mmr_adm0, {
			style: function(feature) {
				return {
					color: "black",
					fill: false,
					opacity: 0,
					clickable: true,
					weight: 2,
				};
			},
			onEachFeature: function(feature, layer) {
				layer.bindPopup('<p>'+feature.properties.Name+'</p>' );
			}
		}).addTo(map);

		basemap_layer = L.tileLayer('http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
			attribution: '<a href="https://google.com/maps" target="_">Google Maps</a>;',
			subdomains:['mt0','mt1','mt2','mt3']
		}).addTo(map);


		selected_date = $('#date_selection').val();
		var viirs_product = "VIIRS_SNPP_CorrectedReflectance_BandsM11-I2-I1";
		browse_layer = addGibsLayer(browse_layer,viirs_product,selected_date);
		browse_layer.setOpacity(0);
		browseSlider.slider('disable');

		/**
		* Add file upload button on map
		*/

		var customControl = L.Control.extend({
			options: {
				position: 'topleft'
			},
			onAdd: function (map) {
				var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
				container.innerHTML = "<label for='input-file2' style='margin-left:7px;margin-top:5px;font-size:15px;cursor: pointer;' title='Load local file (Geojson, KML)'><span class='glyphicon glyphicon-folder-open' aria-hidden='true'></span><input type='file' class='hide' id='input-file2' accept='.kml,.kmz,.json,.geojson,application/json,application/vnd.google-earth.kml+xml,application/vnd.google-earth.kmz'></label>";
				container.style.backgroundColor = '#f4f4f4';
				container.style.width = '35px';
				container.style.height = '35px';
				container.style.backgroundSize = "30px 30px";
				return container;
			}
		});
		map.addControl(new customControl());

		/**
		* Alert
		*/
		$scope.closeAlert = function () {
			$('.custom-alert').addClass('display-none');
			$scope.alertContent = '';
		};

		var showErrorAlert = function (alertContent) {
			$scope.alertContent = alertContent;
			$('.custom-alert').removeClass('display-none').removeClass('alert-info').removeClass('alert-success').addClass('alert-danger');
		};

		var showSuccessAlert = function (alertContent) {
			$scope.alertContent = alertContent;
			$('.custom-alert').removeClass('display-none').removeClass('alert-info').removeClass('alert-danger').addClass('alert-success');
		};

		var showInfoAlert = function (alertContent) {
			$scope.alertContent = alertContent;
			$('.custom-alert').removeClass('display-none').removeClass('alert-success').removeClass('alert-danger').addClass('alert-info');
		};


		$(".draw-tab").click(function () {
				$(".draw-menu").removeClass('hide');
				$(".draw-menu").addClass('show');
				$(".uploadfile-menu").removeClass('show');
				$(".uploadfile-menu").addClass('hide');
				$(".draw-upload-tab").removeClass('selected');
				$(this).addClass('selected');
		});
		$(".draw-upload-tab").click(function () {
				$(".draw-menu").removeClass('show');
				$(".draw-menu").addClass('hide');
				$(".uploadfile-menu").removeClass('hide');
				$(".uploadfile-menu").addClass('show');
				$(".draw-tab").removeClass('selected');
				$(this).addClass('selected');
		});

		$(".sentinel").click(function () {
				$(".viirs").removeClass('selected');
				$(".atms").removeClass('selected');
				$(this).addClass('selected');
				$('#sensor_selection').val("sentinel1");
				$('#sensor_selection').trigger("change");

		});
		$(".viirs").click(function () {
				$(".sentinel").removeClass('selected');
				$(".atms").removeClass('selected');
				$(this).addClass('selected');
				$('#sensor_selection').val("viirs");
				$('#sensor_selection').trigger("change");
		});
		$(".atms").click(function () {
				$(".sentinel").removeClass('selected');
				$(".viirs").removeClass('selected');
				$(this).addClass('selected');
				$('#sensor_selection').val("atms");
				$('#sensor_selection').trigger("change");
		});

		$("#draw-tool").click(function() {
			$("#drawing-modal").removeClass('hide');
			$("#drawing-modal").addClass('show');
		});

		$("#draw-polygon").click(function() {
			$(".modal-background").click();
			new L.Draw.Polygon(map, drawControl.options.draw.polygon).enable();
		});
		$("#draw-rectangle").click(function() {
			$(".modal-background").click();
			new L.Draw.Rectangle(map, drawControl.options.draw.rectangle).enable();
		});
		$("#draw-clear").click(function() {
			$(".modal-background").click();
			editableLayers.clearLayers();
			$("#btn_download").prop("disabled",true);
			$("#btn_download").addClass("btn_custom_disable");

		});
		$(".draw-menu-input").click(function() {
			$("input[type='file']").click();
		});

		// Modal Close Function
		$(".modal-background").click(function() {
			$(".modal").removeClass('show');
			$(".modal").addClass('hide');
		});

		/**
		* Change permanent water color
		*/
		$('#color-picker-water').on('change', function() {
			$("#color-picker-wrapper-water").css("background-color", $(this).val());
			updatePermanentWater();
		});
		$("#color-picker-wrapper-water").css("background-color", $("#color-picker-water").val());

		/**
		* Change flood color
		*/
		$('#color-picker-flood').on('change', function() {
			$("#color-picker-wrapper-flood").css("background-color", $(this).val());
			updateFloodMapLayer();
		});
		$("#color-picker-wrapper-flood").css("background-color", $("#color-picker-flood").val());

		/**
		* Change basemap layer(satellite, terrain, street)
		*/
		$('input[type=radio][name=basemap_selection]').change(function(){
			var selected_basemap = $(this).val();
			if(selected_basemap === "street"){
				basemap_layer.setUrl('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}');
			}else if(selected_basemap === "satellite"){
				basemap_layer.setUrl('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}');
			}else if(selected_basemap === "terrain"){
				basemap_layer.setUrl('http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}');
			}
		});


    $(".datepicker .datepicker-dropdown .dropdown-menu .datepicker-orient-left .datepicker-orient-top").addClass("zIndex9999");


		/**
		* Toggle layer visualizing
		*/
		$('input[type=checkbox][name=country_toggle]').click(function(){
			if(this.checked) {
			    mmr_adm0_layer.setStyle({opacity: 1});
			} else {
			    mmr_adm0_layer.setStyle({opacity: 0});
			}
		});
		$('input[type=checkbox][name=province_toggle]').click(function(){
			if(this.checked) {
			    mmr_adm2_layer.setStyle({opacity: 1});
			} else {
			    mmr_adm2_layer.setStyle({opacity: 0});
			}
		});
		$('input[type=checkbox][name=township_toggle]').click(function(){
			if(this.checked) {
			    mmr_adm3_layer.setStyle({opacity: 1});
			} else {
			    mmr_adm3_layer.setStyle({opacity: 0});
			}
		});

		/**
		* legend controller
		*/
		$(".legend-info-button").click(function () {
			$(".legend-tabs").toggle();
			$("#legend-content").toggle();
			if ($("#legend-content").is(":visible") === true) {
				$("#legend-collapse").css("display","inline-block");
				$("#legend-expand").css("display","none");
			}
			else {
				$("#legend-collapse").css("display","none");
				$("#legend-expand").css("display","inline-block");
			}
		});
		// $("#tab-water").click(function () {
		// 	$("#legend-tab-water").css("display", "block");
		// 	$("#legend-tab-precip").css("display", "none");
		// 	$("#tab-water").addClass("active");
		// 	$("#tab-precip").removeClass("active");
		// });
		// $("#tab-precip").click(function () {
		// 	$("#legend-tab-water").css("display", "none");
		// 	$("#legend-tab-precip").css("display", "block");
		// 	$("#tab-precip").addClass("active");
		// 	$("#tab-water").removeClass("active");
		// });
		// $("#tab-water").click();

		$("#legend-tab-water").css("display", "block");

		/**
		* Update layers when date selection is changed
		*/
		$('#date_selection').change(function(){
			updateFloodMapLayer();
			//updatePrecipitationData();
			var prod = $('input[type=radio][name=browse_selection]:checked').val();
			var id = prod.split('|')[1];
			var selected_date = $(this).val();
			var template =
			'//gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/' +
			id + '/default/' + selected_date + '/{tileMatrixSet}/{z}/{y}/{x}.jpg';
			browse_layer.setUrl(template);
		});

		/**
		* Usecase messagebox toggle
		*/
		$(".event-info-button").click(function () {
			$("#event-content").toggle();
			if ($("#event-content").is(":visible") === true) {
				$("#event-collapse").css("display","inline-block");
				$("#event-expand").css("display","none");
			}
			else {
				$("#event-collapse").css("display","none");
				$("#event-expand").css("display","inline-block");
			}
		});

		/**
		* Layer opacity
		*/
		$('#precip-opacity').change(function(){
			var opac = parseFloat($('input[id="precip-opacity"]').slider('getValue'));
			precip_layer.setOpacity(opac);
		});

		$('#historical-opacity').change(function(){
			var opac = parseFloat($('input[id="historical-opacity"]').slider('getValue'));
			historical_layer.setOpacity(opac);
		});

		$('#flood1-opacity').change(function(){
			var opac = parseFloat($('input[id="flood1-opacity"]').slider('getValue'));
			flood_layer.setOpacity(opac);
		});

		/**
		* Browse Imagery toggle
		*/
		$("#browse-check").on("click",function(){
			if(this.checked){
				browseSlider.slider('enable');
				var opac = parseFloat($('input[id="browse-opacity"]').slider('getValue'));
				browse_layer.setOpacity(opac);
			}
			else{
				browseSlider.slider('disable');
				browse_layer.setOpacity(0);
			}
		});

		/**
		* Precipiatation Data toggle
		*/
		$("#precip-check").on("click",function(){
			if(this.checked){
				precipSlider.slider('enable');
				var opac = parseFloat($('input[id="precip-opacity"]').slider('getValue'));
				precip_layer.setOpacity(opac);
			}
			else{
				precipSlider.slider('disable');
				precip_layer.setOpacity(0);
			}
		});

		/**
		* Permanent water map toggle
		*/
		$("#historical-check").on("click",function(){
			if(this.checked){
				historicalSlider.slider('enable');
				var opac = parseFloat($('input[id="historical-opacity"]').slider('getValue'));
				historical_layer.setOpacity(opac);
			}
			else{
				historicalSlider.slider('disable');
				historical_layer.setOpacity(0);
			}
		});

		/**
		* Flood map toggle
		*/
		$("#flood-check").on("click",function(){
			if(this.checked){
				floodSlider1.slider('enable');
				var opac = parseFloat($('input[id="flood1-opacity"]').slider('getValue'));
				flood_layer.setOpacity(opac);
			}
			else{
				floodSlider1.slider('disable');
				flood_layer.setOpacity(0);
			}
		});

		/**
		* Permanent water map toggle in legend box
		*/
		$("#toggle_switch_historic").on("change",function(){
			if(this.checked){
				historicalSlider.slider('enable');
				var opac = parseFloat($('input[id="historical-opacity"]').slider('getValue'));
				historical_layer.setOpacity(opac);
				$("#historical-check").prop('checked',true);
			}
			else{
				historicalSlider.slider('disable');
				historical_layer.setOpacity(0);
				$("#historical-check").prop('checked',false);
			}
		});

		/**
		* Flood map toggle in legend box
		*/
		$("#toggle_switch_daily").on("change",function(){
			if(this.checked){
				floodSlider1.slider('enable');
				var opac = parseFloat($('input[id="flood1-opacity"]').slider('getValue'));
				flood_layer.setOpacity(opac);
				$("#flood-check").prop('checked',true);
			}
			else{
				floodSlider1.slider('disable');
				flood_layer.setOpacity(0);
				$("#flood-check").prop('checked',false);
			}
		});

		/**
		* Change Sensor to update enable date
		*/
		$('#sensor_selection').change(function(){
			$scope.getAvailabelDate();
		});


		/**
		* Change NRT Browse Imagery
		*/
		$('input[type=radio][name=browse_selection]').change(function(){
			var prod = $(this).val();
			var id = prod.split('|')[1];
			var selected_date = $("#date_selection").val();
			var template =
			'//gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/' +
			id + '/default/' + selected_date + '/{tileMatrixSet}/{z}/{y}/{x}.jpg';
			browse_layer.setUrl(template);
		});

		/**
		* Change NRT Browse Imagery opacity
		*/
		$('#browse-opacity').change(function(){
			var opac = parseFloat($('input[id="browse-opacity"]').slider('getValue'));
			browse_layer.setOpacity(opac);
		});

		/**
		* Update permanent water map
		*/
		$("#update-button").on("click",function(){
			updatePermanentWater();
		});


		  $("#btn_download").on("click",function(){
			if(drawing_polygon === undefined || drawing_polygon === ''){
			alert("Please draw a polygon");
			}else{
			   //var selected_date = $('#selected_date').val();
			   var sensor_val = $('#sensor_selection').val();
			   var selected_date = $('#date_selection').val();
			   var geom = JSON.stringify(drawing_polygon);
			   var parameters = {
				   date: selected_date,
				   sensor: sensor_val,
				   geom: geom
			   };
			   MapService.downloadFloodMap(parameters)
			   .then(function (data) {
				   $scope.showLoader = false;
				   if("success" in data) {
			          //alert('Download URL: \n'+ data.url)
			          window.open(data.url, '_blank');
			        }else{
			          alert('Opps, there was a problem processing the request. Please see the following error: '+data.error);
			        }

			   }, function (error) {
				   $scope.showLoader = false;
				   alert('Opps, there was a problem processing the request. Please see the following error: '+error.error);
			   });
			}
		});


		/**
		* Update precipitation map
		*/
		$('#cmap_selection').change(function(){
			updatePrecipitationData();
		});

		$('#product_selection').change(function(){
			updatePrecipitationData();
		});

		$("#legend-infobox").click(function () {
			$("#legend-info-box").addClass("infobox-shown");
		});

		$("#legend-infobox").focusout(function () {
			$("#legend-info-box").removeClass("infobox-shown");
		});

		$("#zoom-in").click(function() {
					map.zoomIn();
				});

		$("#zoom-out").click(function() {
			map.zoomOut();
		});

		$("#legend-toggle").click(function () {
			if($(".legend").css("display") === "none"){
				$(".legend").show();
			}else{
				$(".legend").hide();
			}

		});

		$("#full-screen").click(function() {
			if($(".container-wrapper").css("margin-top") ===  "115px" ){
				$("nav").hide();
				$(".container-wrapper").css("margin-top", "0");
				$(".c-map-menu .menu-tiles").css("top", "0");
				$(".c-menu-panel").css("top", "0");
				$(".map").css("height", "100vh");
			}else{
				$("nav").show();
				$(".container-wrapper").css("margin-top", "115px");
				$(".c-map-menu .menu-tiles").css("top", "113px");
				$(".c-menu-panel").css("top", "113px");
				$(".map").css("height", "calc(100vh - 115px)");
			}
		});

		$(".close-menu").click(function () {
			$('.c-menu-panel').css('transform', ' translateX(-60rem)');
			$('.c-menu-panel').css('opacity', 0);
			$("#flood-tab").removeClass("active");
			$("#basemap-tab").removeClass("active");
			$("#water-tab").removeClass("active");
			$("#layers-tab").removeClass("active");
			$("#usecase-tab").removeClass("active");
		});

		$("#flood-tab").click(function () {
			$(".close-menu").click();
			$("#water-tab").removeClass("active");
			$("#basemap-tab").removeClass("active");
			$("#usecase-tab").removeClass("active");
			$("#layers-tab").removeClass("active");
			$(this).addClass("active");
			$('.c-menu-panel').css('transform', ' translateX(-60rem)');
			$('#panel1').css('transform', ' translateX(6.75rem)');
			$('#panel1').css('opacity', 1);
		});
		$("#water-tab").click(function () {
			$(".close-menu").click();
			$("#flood-tab").removeClass("active");
			$("#basemap-tab").removeClass("active");
			$("#usecase-tab").removeClass("active");
			$("#layers-tab").removeClass("active");
			$(this).addClass("active");
			$('.c-menu-panel').css('transform', ' translateX(-60rem)');
			$('#panel2').css('transform', ' translateX(6.75rem)');
			$('#panel2').css('opacity', 1);
		});
		$("#basemap-tab").click(function () {
			$(".close-menu").click();
			$("#water-tab").removeClass("active");
			$("#flood-tab").removeClass("active");
			$("#usecase-tab").removeClass("active");
			$("#layers-tab").removeClass("active");
			$(this).addClass("active");
			$('.c-menu-panel').css('transform', ' translateX(-60rem)');
			$('#panel3').css('transform', ' translateX(6.75rem)');
			$('#panel3').css('opacity', 1);
		});
		$("#usecase-tab").click(function () {
			$(".close-menu").click();
			$("#water-tab").removeClass("active");
			$("#flood-tab").removeClass("active");
			$("#basemap-tab").removeClass("active");
			$("#layers-tab").removeClass("active");
			$(this).addClass("active");
			$('.c-menu-panel').css('transform', ' translateX(-60rem)');
			$('#panel-usecase').css('transform', ' translateX(6.75rem)');
			$('#panel-usecase').css('opacity', 1);
		});
		$("#layers-tab").click(function () {
			$(".close-menu").click();
			$("#water-tab").removeClass("active");
			$("#flood-tab").removeClass("active");
			$("#usecase-tab").removeClass("active");
			$("#basemap-tab").removeClass("active");
			$(this).addClass("active");
			$('.c-menu-panel').css('transform', ' translateX(-60rem)');
			$('#panel-layers').css('transform', ' translateX(6.75rem)');
			$('#panel-layers').css('opacity', 1);
		});


		$scope.getpermanentwater = function (startYear, endYear, startMonth, endMonth, method, wcolor) {
			$scope.showLoader = true;
			var parameters = {
				startYear: startYear,
				endYear: endYear,
				startMonth: startMonth,
				endMonth: endMonth,
				method: method,
				wcolor: wcolor
			};
			MapService.getPermanentWater(parameters)
			.then(function (data) {
				$scope.showLoader = false;
				historical_layer = addMapLayer(historical_layer, data, 'waterLayer');
			}, function (error) {
				$scope.showLoader = false;
				console.log(error);
			});
		};

		$scope.floodMapUsecase = function(usecase_date, sensor, desc){
			$scope.showLoader = true;
			var sensor_val = sensor;
			var flood_color = $('#color-picker-flood').val();
			console.log(flood_color);
			var selected_date = usecase_date;
			var geom = JSON.stringify(drawing_polygon);
			var parameters = {
				date: selected_date,
				fcolor: flood_color,
				sensor: sensor_val,
				geom: geom
			};
			MapService.getMap(parameters)
			.then(function (data) {
				$scope.showLoader = false;
				flood_layer.setUrl(data);
				$timeout(function () {
					showInfoAlert(desc);
				}, 1500);
				console.log(data);
			}, function (error) {
				$scope.showLoader = false;
				console.log(error);
				$timeout(function () {
					showErrorAlert(error);
				}, 1500);
			});

		};


		$scope.getPrecipMap = function () {
			var prod = $('#product_selection').val();
			var cmap = $('#cmap_selection').val();
			var accum = prod.split('|')[0];
			var selected_date = $('#date_selection').val();
			var parameters = {
				date: selected_date,
				cmap: cmap,
				accum: accum,
			};
			MapService.getPrecipitationData(parameters)
			.then(function (data) {
				precip_layer = addMapLayer(precip_layer, data);
				precip_layer.setOpacity(0);
				precipSlider.slider('disable');
			}, function (error) {
				console.log(error);
			});
		};

		$scope.getAvailabelDate = function () {
			$scope.showLoader = true;
			var prod = $('#sensor_selection').val();
			var parameters = {
				sensor: prod,
			};
			MapService.getDateList(parameters)
			.then(function (data) {
				var enableDates = data;
				var recent_date = enableDates[enableDates.length - 1];
				var enableDatesArray=[];
				$("#date_selection").datepicker("destroy");
			       for (var i = 0; i < enableDates.length; i++) {
			             var dt = enableDates[i];
			             var dd, mm, yyy;
			             if (parseInt(dt.split('-')[2]) <= 9 || parseInt(dt.split('-')[1]) <= 9) {
			                       dd = parseInt(dt.split('-')[2]);
			                      mm = parseInt(dt.split('-')[1]);
			                      yyy = dt.split('-')[0];
			                     enableDatesArray.push(yyy + '-' + mm + '-' + dd);
			                }
			                else {
			                 enableDatesArray.push(dt);
			           }
			 	}
				$('#date_selection').datepicker({
					beforeShow: function (input, inst) {
				        setTimeout(function () {
				            inst.dpDiv.css({
				                top: $(".datepicker").offset().top + 35,
				                left: $(".datepicker").offset().left
				            });
				        }, 0);
				    },
					beforeShowDay: function (date) {
				        var dt_ddmmyyyy = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() ;
				        if (enableDatesArray.indexOf(dt_ddmmyyyy) !== -1) {
				            return {
				                tooltip: 'There is data available',
				                classes: 'active'
				            };
				        } else {
				            return false;
				        }
				    }
				});
				var ddate, mmonth, yyear, setDate;
				if (parseInt(recent_date.split('-')[2]) <= 9 || parseInt(recent_date.split('-')[1]) <= 9) {
						 ddate = parseInt(recent_date.split('-')[2]);
						 mmonth = parseInt(recent_date.split('-')[1]);
						 yyear = recent_date.split('-')[0];
						 setDate = yyear + '-' + mmonth + '-' + ddate;
				   }
				 $("#date_selection").datepicker("setDate", setDate);
				 $("#date_selection").trigger("changed");
			}, function (error) {
				console.log(error);
			});
		};


		/**
		* Upload Area Button
		**/
		var readFile = function (e) {
			var files = e.target.files;
			if (files.length > 1) {
				console.log('upload one file at a time');
			} else {
				//MapService.removeGeoJson(map);

				var file = files[0];
				var reader = new FileReader();
				reader.readAsText(file);

				reader.onload = function (event) {

					var textResult = event.target.result;
					var addedGeoJson;
					var extension = file.name.split('.').pop().toLowerCase();
					if ((['kml', 'application/vnd.google-earth.kml+xml', 'application/vnd.google-earth.kmz'].indexOf(extension) > -1)) {
						var kmlDoc;

						if (window.DOMParser) {
							var parser = new DOMParser();
							kmlDoc = parser.parseFromString(textResult, 'text/xml');
						} else { // Internet Explorer
							kmlDoc = new ActiveXObject('Microsoft.XMLDOM');
							kmlDoc.async = false;
							kmlDoc.loadXML(textResult);
						}
						addedGeoJson = toGeoJSON.kml(kmlDoc);
					} else {
						try {
							addedGeoJson = JSON.parse(textResult);
						} catch (e) {
							alert('we only accept kml, kmz and geojson');
						}
					}

					if (((addedGeoJson.features) && (addedGeoJson.features.length === 1)) || (addedGeoJson.type === 'Feature')) {

						var geometry = addedGeoJson.features ? addedGeoJson.features[0].geometry : addedGeoJson.geometry;

						if (geometry.type === 'Polygon') {
							//MapService.addGeoJson(map, addedGeoJson);
							// Convert to Polygon
							var polygonArray = [];
							var shape = {};
							var _coord = geometry.coordinates[0];

							for (var i = 0; i < _coord.length; i++) {
								var coordinatePair = [(_coord[i][1]).toFixed(2), (_coord[i][0]).toFixed(2)];
								polygonArray.push(coordinatePair);
							}

							if (polygonArray.length > 500) {
								alert('Complex geometry will be simplified using the convex hull algorithm!');
							}

							polygonArray = polygonArray.map(function(elem) {
								return elem.map(function(elem2) {
									return parseFloat(elem2);
								});
							});
							editableLayers.clearLayers();
							var layer = L.polygon(polygonArray , {color: 'red'});
							drawing_polygon = [];
							var userPolygon = layer.toGeoJSON();
							drawing_polygon.push('ee.Geometry.Polygon(['+ JSON.stringify(userPolygon.geometry.coordinates[0])+'])');
							updateFloodMapLayer();
							updatePermanentWater();
							layer.addTo(map);
							map.fitBounds(layer.getBounds());
							editableLayers.addLayer(layer);
							//active download button
							$("#btn_download").prop("disabled",false);
							$("#btn_download").removeClass("btn_custom_disable");

						} else {
							alert('multigeometry and multipolygon not supported yet!');
						}
					} else {
						alert('multigeometry and multipolygon not supported yet!');
					}
				};
			}
		};

		$('#input-file2').change(function (event) {
			readFile(event);
		});

			// function to add and update tile layer to map
			function addMapLayer(layer,url, pane){
				layer = L.tileLayer(url,{
					attribution: '<a href="https://earthengine.google.com" target="_">' +
					'Google Earth Engine</a>;',
				 	pane: pane}).addTo(map);
					return layer;
			}

			function updatePermanentWater(){
				$scope.showLoader = true;
				var startYear = $('#start_year_selection_historical').val();
				var endYear = $('#end_year_selection_historical').val();
				var slider = $("#month_range").data("ionRangeSlider");

				// Get values
				var startMonth = slider.result.from + 1;
				var endMonth= slider.result.to + 1;
				var method = 'discrete';
				var wcolor = $('#color-picker-water').val();
				var geom = JSON.stringify(drawing_polygon);

				if (startMonth === endMonth) { endMonth += 1; }

				var parameters = {
					startYear: startYear,
					endYear: endYear,
					startMonth: startMonth,
					endMonth: endMonth,
					method: method,
					wcolor: wcolor,
					geom: geom
				};
				MapService.getPermanentWater(parameters)
				.then(function (data) {
					$scope.showLoader = false;
					if(map.hasLayer(historical_layer)){
						historical_layer.setUrl(data);
					}else{
						historical_layer = addMapLayer(historical_layer, data, 'waterLayer');
					}

				}, function (error) {
					$scope.showLoader = false;
					console.log(error);
				});

			}
			function updateFloodMapLayer(){
				$scope.showLoader = true;
				var sensor_val = $('#sensor_selection').val();
				var flood_color = $('#color-picker-flood').val();
				var selected_date = $('#date_selection').val();
				var geom = JSON.stringify(drawing_polygon);
				var parameters = {
					date: selected_date,
					fcolor: flood_color,
					sensor: sensor_val,
					geom: geom
				};

				if(map.hasLayer(flood_layer)){

					MapService.getFloods(parameters)
					.then(function (data) {
						$scope.showLoader = false;
						flood_layer.setUrl(data);
		    		$timeout(function () {
						showInfoAlert('The map data shows the data from ...');
					}, 1500);

					}, function (error) {
						$scope.showLoader = false;
						console.log(error);
					});

				}else{

					MapService.getFloods(parameters)
					.then(function (data) {
						$scope.showLoader = false;
						flood_layer = addMapLayer(flood_layer, data, 'floodsLayer');
						$timeout(function () {
							showInfoAlert('The map data shows the data on ...');
						}, 1500);
					}, function (error) {
						$scope.showLoader = false;
						console.log(error);
					});

				}

			}
			function updatePrecipitationData(){
				$scope.showLoader = true;
				var prod = $('#product_selection').val();
				var cmap = $('#cmap_selection').val();
				var accum = prod.split('|')[0];
				var selected_date = $('#date_selection').val();

				var parameters = {
					date: selected_date,
					cmap: cmap,
					accum: accum,
				};
				MapService.getPrecipitationData(parameters)
				.then(function (data) {
					$scope.showLoader = false;
					precip_layer.setUrl(data);
				}, function (error) {
					$scope.showLoader = false;
					console.log(error);
				});

			}


			function addGibsLayer(layer,product,date){
				var template =
				'//gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/' +
				'{layer}/default/{time}/{tileMatrixSet}/{z}/{y}/{x}.jpg';

				layer = L.tileLayer(template, {
					layer: product,
					tileMatrixSet: 'GoogleMapsCompatible_Level9',
					maxZoom: 9,
					time: date,
					tileSize: 256,
					subdomains: 'abc',
					noWrap: true,
					continuousWorld: true,
					// Prevent Leaflet from retrieving non-existent tiles on the
					// borders.
					bounds: [
						[-85.0511287776, -179.999999975],
						[85.0511287776, 179.999999975]
					],
					attribution:
					'<a href="https://wiki.earthdata.nasa.gov/display/GIBS" target="_">' +
					'NASA EOSDIS GIBS</a>;'
				});

				map.addLayer(layer);

				return layer;
			}
		});

	})();
