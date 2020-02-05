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
      };

    });

var slideIndex = 0;
showSlides();

function showSlides() {
  var i;
  var slides = document.getElementsByClassName("mySlides");
  var dots = document.getElementsByClassName("dot");
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  slideIndex++;
  if (slideIndex > slides.length) {
    slideIndex = 1;
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "block";
  dots[slideIndex-1].className += " active";
  setTimeout(showSlides, 2000); // Change image every 2 seconds
}

})();
