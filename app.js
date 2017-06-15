var app = angular.module("MyApp", ['ngRoute']);
// var app = angular.module("MyApp", []);

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider
  .when('/', {
    templateUrl: 'views/linked-list.html',
    controller: 'LinkedListCtrl'
  });
}]);
