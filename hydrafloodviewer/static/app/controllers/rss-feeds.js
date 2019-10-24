(function () {
    'use strict';
    angular.module('baseApp')
    .controller('rss' ,function ($scope, $http, $sce) {

        var getFeeds= function () {
			var config = {
				params: {
					action: 'get-feeds-data',
				}
			};
			var promise = $http.get('/api/mapclient/', config)
			.then(function (response) {
				return response.data;
			});
			return promise;
		};

        $scope.getFeeds = function () {
			getFeeds().then(function (data) {
				$scope.res_feeds = data;
			}, function (error) {
			});
		};

        $scope.trustAsHtml = function(html) {
          return $sce.trustAsHtml(html);
        }

    });

})();
