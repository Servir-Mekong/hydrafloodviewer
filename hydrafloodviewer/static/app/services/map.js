(function () {

	'use strict';

	angular.module('baseApp')
	.service('MapService', function ($http, $q) {
		var service = this;

		service.getMapType = function (mapId, mapToken, type) {
			var eeMapOptions = {
				getTileUrl: function (tile, zoom) {
					var url = 'https://earthengine.googleapis.com/map/';
					url += [mapId, zoom, tile.x, tile.y].join('/');
					url += '?token=' + mapToken;
					return url;
				},
				tileSize: new google.maps.Size(256, 256),
				opacity: 1.0,
				name: type
			};
			return new google.maps.ImageMapType(eeMapOptions);
		};

		service.getMap = function (options) {
			var config = {
				params: {
					action: 'get-map-id',
					date: options.date,
					fcolor: options.fcolor,
					sensor: options.sensor,
					geom: options.geom
				}
			};
			var promise = $http.get('/api/mapclient/', config)
			.then(function (response) {
				return response.data;
			});
			return promise;
		};

		service.getPermanentWater = function (options) {
			var config = {
				params: {
					action: 'get-permanent-water',
					startYear: options.startYear,
					endYear: options.endYear,
					startMonth: options.startMonth,
					endMonth: options.endMonth,
					method: options.method,
					wcolor: options.wcolor,
					geom: options.geom
				}
			};
			var promise = $http.get('/api/mapclient/', config)
			.then(function (response) {
				return response.data;
			});
			return promise;
		};
		service.getPrecipitationData = function (options) {
			var config = {
				params: {
					action: 'get-precipmap',
					precipdate: options.date,
					cmap: options.cmap,
					accum: options.accum
				}
			};
			var promise = $http.get('/api/mapclient/', config)
			.then(function (response) {
				return response.data;
			});
			return promise;
		};

		service.removeGeoJson = function (map) {
			map.data.forEach(function (feature) {
				map.data.remove(feature);
			});
		};

		service.clearLayer = function (map, name) {
			map.overlayMapTypes.forEach(function (layer, index) {
				if (layer && layer.name === name) {
					map.overlayMapTypes.removeAt(index);
				}
			});
		};

		// Remove the Drawing Manager Polygon
		service.clearDrawing = function (overlay) {
			if (overlay) {
				overlay.setMap(null);
			}
		};

		service.getPolygonBoundArray = function (array) {
			var geom = [];
			for (var i = 0; i < array.length; i++) {
				var coordinatePair = [array[i].lng().toFixed(2), array[i].lat().toFixed(2)];
				geom.push(coordinatePair);
			}
			return geom;
		};


		service.getDrawingManagerOptions = function(type) {
			if (!type) {
				return {};
			}
			var typeOptions;
			if (type === 'polyline') {
				typeOptions = 'polylineOptions';
			}
			var drawingManagerOptions = {
				'drawingControl': false
			};
			drawingManagerOptions.drawingMode = type;
			drawingManagerOptions[typeOptions] = {
				'strokeColor': '#ffff00',
				'strokeWeight': 4,
				'fillColor': 'yellow',
				'fillOpacity': 0,
				'editable': true
			};

			return drawingManagerOptions;
		};

	});

})();
