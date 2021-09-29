(function () {
	'use strict';
	angular.module('baseApp')
	.controller('usecaseviewer' ,function ($scope, $timeout, MapService, appSettings, $tooltip, $modal, $alert, ngDialog,FileSaver, Blob, usSpinnerService) {

		/* global variables to be tossed around like hot potatoes */
		$scope.initdate = '';

		var map,
		basemap_layer,
		$layers_element;
		//sentinel1_layer = addMapLayer(sentinel1_layer,$layers_element.attr('data-sentinel1-url'))

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

		// init map
		map = L.map('map',{
			center: [16.8,95.7],
			zoom: 4,
			minZoom:2,
			maxZoom: 16,
			maxBounds: [
				[-120, -220],
				[120, 220]
			],
		});

		L.Control.Custom = L.Control.Layers.extend({
			onAdd: function () {
				this._initLayout();
				this._addElement();
				this._update();
				return this._container;
			},
			_addElement: function () {
				var elements = this._container.getElementsByClassName('leaflet-control-layers-list');
				var div = L.DomUtil.create('div', 'leaflet-control-layers-overlays', elements[0]);
				div.innerHTML = '<label><b>Basemap</b></label>'+
				'<label class="container_radio">Open Street Map<input name="basemap_selection" id="osm" checked="checked" value="osm" type="radio"></input><span class="checkmark_radio"></span></label>'+
				'<label class="container_radio">Streets<input name="basemap_selection" id="street" value="street" type="radio"></input><span class="checkmark_radio"></span></label>'+
				'<label class="container_radio">Satellite<input name="basemap_selection" id="satellite" value="satellite" type="radio"></input><span class="checkmark_radio"></span></label>'+
				'<label class="container_radio">Terrain<input name="basemap_selection" id="terrain" value="terrain" type="radio"></input><span class="checkmark_radio"></span></label>'+
				'<hr>'+
				'<label><b>Administrative Boundaries</b></label>'+
				'<ul class="toggles-list">'+
					'<li class="toggle"><label class="switch_layer"><input  name="mekong_toggle" id="mekong_toggle"  type="checkbox"><span class="slider_toggle round"></span></label><label>Mekong Region</label></li>'+
				    '<li class="toggle"><label class="switch_layer"><input name="adm0_toggle" id="adm0_toggle" type="checkbox"><span class="slider_toggle round"></span></label><label>Country</label></li>'+
					'<li class="toggle"><label class="switch_layer"><input name="adm1_toggle" id="adm1_toggle" type="checkbox"><span class="slider_toggle round"></span></label><label>Province</label></li>'+
					'<li class="toggle"><label class="switch_layer"><input name="adm2_toggle" id="adm2_toggle" type="checkbox"><span class="slider_toggle round"></span></label><label>District</label></li>'+
					'<li class="toggle"><label class="switch_layer"><input name="usecase_toggle" id="usecase_toggle" type="checkbox" checked><span class="slider_toggle round"></span></label><label>Usecase</label></li>'+
				'</ul>';
			}
		});

		var control = new L.Control.Custom().addTo(map);

		//Default basemap
		basemap_layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);  

		/**
		* Change basemap layer(satellite, terrain, street)
		*/
		
		$('input[type=radio][name=basemap_selection]').change(function(){
			var selected_basemap = $(this).val();
			if(selected_basemap === "osm"){
				basemap_layer.setUrl('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
			}else if((selected_basemap === "street")){
				basemap_layer.setUrl('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}');
			}else if(selected_basemap === "satellite"){
				basemap_layer.setUrl('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}');
			}else if(selected_basemap === "terrain"){
				basemap_layer.setUrl('https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}');
			}
		});
		
		var usecase_layer = L.geoJson(usecases, {
			onEachFeature: function(feature, layer) {
				layer.bindPopup( 
					'<div class="panel panel-custom">' +
						'<h2 class="panel-title">'+feature.properties.Location+'</h2>'+
						'<small style="font-size: 12px;">' + feature.properties.Date + '</small>'+'<br>'+
						'<div class="panel-popup"  id="panel-popup">'+
							'<img class="panel-image img-responsive" src="'+ feature.properties.Image +'" alt="">'+ 
							'<p class="panel-desc">'+feature.properties.Description+'</p>'+
							'<p class="panel-desc">'+'<a href="'+feature.properties.Website+'" target="_blank">View Sources</a>'+'</p>'+
						'</div>'+
					'</div>'        
				);
				layer.bindTooltip(feature.properties.Location);
			}
		}).addTo(map); 

		//fly map to usecase location
		var uc1 = document.querySelector('#usecase1');
		var uc2 = document.querySelector('#usecase2');
		var uc3 = document.querySelector('#usecase3');
		var uc4 = document.querySelector('#usecase4');
		var uc5 = document.querySelector('#usecase5');
		var uc6 = document.querySelector('#usecase6');

		var coord1 = usecases.features[0].geometry.coordinates;
		var usecase1 = L.GeoJSON.coordsToLatLng(coord1);
		uc1.addEventListener("click", function()  {
			map.flyTo(usecase1, 10);
		}); 
		var coord2 = usecases.features[1].geometry.coordinates;
		var usecase2 = L.GeoJSON.coordsToLatLng(coord2);
		uc2.addEventListener("click", function()  {
			map.flyTo(usecase2, 10);
		}); 
		var coord3 = usecases.features[2].geometry.coordinates;
		var usecase3 = L.GeoJSON.coordsToLatLng(coord3);
		uc3.addEventListener("click", function()  {
			map.flyTo(usecase3, 10);
		}); 
		var coord4 = usecases.features[3].geometry.coordinates;
		var usecase4 = L.GeoJSON.coordsToLatLng(coord4);
		uc4.addEventListener("click", function()  {
			map.flyTo(usecase4, 10);
		}); 
		var coord5 = usecases.features[4].geometry.coordinates;
		var usecase5 = L.GeoJSON.coordsToLatLng(coord5);
		uc5.addEventListener("click", function()  {
			map.flyTo(usecase5, 10);
		}); 
		var coord6 = usecases.features[5].geometry.coordinates;
		var usecase6 = L.GeoJSON.coordsToLatLng(coord6);
		uc6.addEventListener("click", function()  {
			map.flyTo(usecase6, 10);
		}); 

		//define admin boundary style
		var mekongBoundaryStyle = {
			color: "#3182bd",
			weight: 0.75,
			opacity: 0.6,
			fillOpacity: 0.3,
			fillColor: "#3182bd",
		};
	
		var adm0Style = {
			color: "#756bb1",
			weight: 0.75,
			opacity: 0.6,
			fillOpacity: 0.3,
			fillColor: "#756bb1",
		};
	
		var adm1Style = {
			color: "#de2d26",
			weight: 0.75,
			opacity: 0.6,
			fillOpacity: 0.3,
			fillColor: "#de2d26",
		};
	
		var adm2Style = {
			color: "#2ca25f",
			weight: 0.75,
			opacity: 0.6,
			fillOpacity: 0.3,
			fillColor: "#2ca25f",
		};
		
		// highlight admin feature style
		var highlightStyle = {
			color: '#fff', 
			weight: 1,
			opacity: 0.6,
			fillOpacity: 0.65,
			fillColor: '#2262CC'
		};

		//create admin geojson layer
		var mekong_layer = L.geoJson(mekongBoundary, {
			style: mekongBoundaryStyle,
			onEachFeature: function(feature, mekongLayer) {
				mekongLayer.on('mouseover', function (e) {
					this.setStyle(highlightStyle);
					this.bindPopup('<p style="padding-top: 5px;">'+ 'Mekong Region' +'</p>');
				}); 
				mekongLayer.on('mouseout', function (e) {
					this.setStyle(mekongBoundaryStyle);
				});                       
			} 
		}); 

		var adm0_layer = L.geoJson(adm0, {
			style: adm0Style,
			onEachFeature: function(feature, admin0Layer) {
				admin0Layer.on('mouseover', function (e) {
					this.setStyle(highlightStyle);
					this.bindPopup('<p style="padding-top: 5px;">'+ feature.properties.NAME_0+'</p>');
				}); 
				admin0Layer.on('mouseout', function (e) {
					this.setStyle(adm0Style);
				});   
						
			} 
		});

		var adm1_layer = L.geoJson(adm1, {
			style: adm1Style,
			onEachFeature: function(feature, admin1Layer) {
				admin1Layer.on('mouseover', function (e) {
					this.setStyle(highlightStyle);
					this.bindTooltip(feature.properties.NAME_1);
					this.bindPopup(
						'<div class="table-responsive">'+
							'<table class="table">'+
								'<thead>' +
									'<tr>'+
										'<th>'+ "Country" +'</th>'+
										'<th>'+ "Province" +'</th>'+
									'</tr>'+
								'</thead>'+
								'<tbody>' +
									'<tr>'+
										'<td>'+ feature.properties.NAME_0 +'</td>'+
										'<td>'+ feature.properties.NAME_1 +'</td>'+
									'</tr>'+
								'</tbody>'+
							'</table>'+
						'</div>'
					);
				}); 
				admin1Layer.on('mouseout', function (e) {
					this.setStyle(adm1Style);
				});          
			} 
		});  

		var adm2_layer = L.geoJson(adm2, {
			style: adm2Style,
			onEachFeature: function(feature, admin2Layer) {
				admin2Layer.on('mouseover', function (e) {
					this.setStyle(highlightStyle);
					this.bindPopup( 
						'<h6 style="margin-top: 20px; font-weight: bold;">Feature Details</h6>'+
						'<div class="table-responsive adm2-popup">'+
							'<table class="table">'+
								'<tbody>' +
									'<tr>'+
										'<td>'+ "ISO Code" +'</td>'+
										'<td>'+ feature.properties.ISO +'</td>'+
									'</tr>'+
									'<tr>'+
										'<td>'+ "Country" +'</td>'+
										'<td>'+ feature.properties.NAME_0 +'</td>'+
									'</tr>'+
									'<tr>'+
										'<td>'+ "Province" +'</td>'+
										'<td>'+ feature.properties.NAME_1 +'</td>'+
									'</tr>'+
									'<tr>'+
										'<td>'+ "District" +'</td>'+
										'<td>'+ feature.properties.NAME_2 +'</td>'+
									'</tr>'+
									'<tr>'+
										'<td>'+ "Total Population" +'</td>'+
										'<td>'+ feature.properties.total_pop +'</td>'+
									'</tr>'+
									'<tr>'+
										'<td>'+ "Total Female Population" +'</td>'+
										'<td>'+ feature.properties.Female +'</td>'+
									'</tr>'+
									'<tr>'+
										'<td>'+ "Total Male Population" +'</td>'+
										'<td>'+ feature.properties.Male +'</td>'+
									'</tr>'+
									'<tr>'+
										'<td>'+ "No. of Female Population less than 15 Age" +'</td>'+
										'<td>'+ feature.properties.F_0_15 +'</td>'+
									'</tr>'+
									'<tr>'+
										'<td>'+ "No. of Female Population between 15-65 Age" +'</td>'+
										'<td>'+ feature.properties.F_15_65 +'</td>'+
									'</tr>'+
									'<tr>'+
										'<td>'+ "No. of Female Population above 65 Age" +'</td>'+
										'<td>'+ feature.properties.F__65 +'</td>'+
									'</tr>'+
									'<tr>'+
										'<td>'+ "No. of Male Population less than 15 Age" +'</td>'+
										'<td>'+ feature.properties.M_0_15 +'</td>'+
									'</tr>'+
									'<tr>'+
										'<td>'+ "No. of Male Population between 15-65 Age" +'</td>'+
										'<td>'+ feature.properties.M_15_65 +'</td>'+
									'</tr>'+
									'<tr>'+
										'<td>'+ "No. of Male Population above 65 Age" +'</td>'+
										'<td>'+ feature.properties.M__65 +'</td>'+
									'</tr>'+
									'<tr>'+
										'<td>'+ "No. of Hospitals" +'</td>'+
										'<td>'+ feature.properties.Hospitals +'</td>'+
									'</tr>'+
									'<tr>'+
										'<td>'+ "No. of Primary Roads" +'</td>'+
										'<td>'+ feature.properties.Primary +'</td>'+
									'</tr>'+
									'<tr>'+
										'<td>'+ "No. of Secondary Roads" +'</td>'+
										'<td>'+ feature.properties.Secondary +'</td>'+
									'</tr>'+
									'<tr>'+
										'<td>'+ "No. of Trunks Roads" +'</td>'+
										'<td>'+ feature.properties.Trunks +'</td>'+
									'</tr>'+
								'</tbody>'+
							'</table>'+
						'</div>'       
					);
					this.bindTooltip(feature.properties.NAME_2);
				}); 
				admin2Layer.on('mouseout', function (e) {
					this.setStyle(adm2Style);
				});         
			}
		});  

		/**
		* Toggle layer visualizing
		*/

		$('input[type=checkbox][name=mekong_toggle]').click(function(){
			if(this.checked) {
				map.addLayer(mekong_layer);
			} else {
				map.removeLayer(mekong_layer);
			}
		});
		$('input[type=checkbox][name=adm0_toggle]').click(function(){
			if(this.checked) {
				map.addLayer(adm0_layer);
			} else {
				map.removeLayer(adm0_layer);
			}
		});
		$('input[type=checkbox][name=adm1_toggle]').click(function(){
			if(this.checked) {
				map.addLayer(adm1_layer);
			} else {
				map.removeLayer(adm1_layer);
			}
		});
		$('input[type=checkbox][name=adm2_toggle]').click(function(){
			if(this.checked) {
				map.addLayer(adm2_layer);
			} else {
				map.removeLayer(adm2_layer);
			}
		});
		$('input[type=checkbox][name=usecase_toggle]').click(function(){
			if(this.checked) {
				map.addLayer(usecase_layer);
			} else {
				map.removeLayer(usecase_layer);
			}
		});
		/* $scope.initMap = function (usecase_layer, adm1_layer, adm2_layer ) {		
			var parameters = {
				usecase_layer: usecase_layer,
				adm1_layer: adm1_layer,
				adm2_layer: adm2_layer,
			};
			MapService.getMap(parameters)
			.then(function (data) {
				$scope.showLoader = false;
				usecase_layer = addMapLayer(usecase_layer);
				adm1_layer = addMapLayer(adm1_layer);
				adm2_layer = addMapLayer(adm2_layer); 

			}, function (error) {
				$scope.showLoader = false;
				console.log(error);
			});
		};  */
	});
})();
