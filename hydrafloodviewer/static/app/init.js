(function () {
	'use strict';

	// Bootstrap the app once
	angular.element(document).ready(function () {
		angular.bootstrap(document.body, ['baseApp']);
	});

	// All the dependencies come here
	var app = angular.module('baseApp', ['rzModule','mgcrea.ngStrap', 'ngDialog','ngFileSaver', 'angularSpinner', 'pascalprecht.translate'], function ($interpolateProvider) {

		$interpolateProvider.startSymbol('[[');
		$interpolateProvider.endSymbol(']]');
	});
	app.config(function ($httpProvider) {

		$httpProvider.defaults.headers.common = {};
		$httpProvider.defaults.headers.post = {};
		$httpProvider.defaults.headers.put = {};
		$httpProvider.defaults.headers.patch = {};
		$httpProvider.defaults.useXDomain = true;
		delete $httpProvider.defaults.headers.common['X-Requested-With'];


	});

	app.config(['$translateProvider', function($translateProvider) {
		$translateProvider
		.useStaticFilesLoader({
			prefix: '/static/locales/local-',
			suffix: '.json'
		})
		// remove the warning from console log by putting the sanitize strategy
		.useSanitizeValueStrategy('sanitizeParameters')
		.preferredLanguage('en');

	}]);
	app.run(['$rootScope', function($rootScope) {
		$rootScope.lang = 'en';
	}]);

})();
