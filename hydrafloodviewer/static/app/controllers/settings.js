(function () {

	'use strict';
	angular.module('baseApp')
	.controller('settingsCtrl', function ($scope, appSettings, $translate, $rootScope) {

		$scope.menus = appSettings.menus;
		$scope.language = appSettings.Languages;
		$scope.applicationName = appSettings.applicationName;
		$scope.footerLinks = appSettings.footerLinks;
		$scope.partnersHeader = appSettings.partnersHeader;
		$scope.partnersFooter = appSettings.partnersFooter;

		$scope.toggleSidePanel = function () {
			console.log('click');
			if ($('#map').hasClass('pull-margin')) {
				$('#map').toggleClass('pull-margin');
				$('#map').css('width', '100%');
				$('#side-panel').css('width', '0');
				$('#side-panel').css('left', '-25%');
			} else {
				$('#map').toggleClass('pull-margin');
				$('#map').css('width', '75%');
				$('#side-panel').css('width', '25%');
				$('#side-panel').css('left', '0');
			}
		};
		$scope.changeLanguage = function (key) {
			$rootScope.lang = key;
			$translate.use(key);
		};
		$('.dropdown-toggle').dropdown();
	});

})();
