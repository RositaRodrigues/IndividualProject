var app = angular.module("MyApp", ['ngRoute']);

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider
  .when('/linkedList', {
    templateUrl: 'views/linked-list.html',
    controller: 'LinkedListCtrl'
  })

  .otherwise({
    redirectTo: '/'
  });
}]);
