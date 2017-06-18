angular.module("MyApp")
  .controller("NavCtrl", function($scope, $rootScope, $location) {
      $scope.menu = [
        {label:'Linked Based List', route:'/linkedList'},
        {label:'Array Based List', route:'/'},
        {label:'Linked Based Stack', route:'/'},
        {label:'Array Based Stack', route:'/'},
        {label:'Linked Based Queue', route:'/'},
        {label:'Array Based Queue', route:'/'}
       ]

      $scope.currentPage = $scope.menu[0].label;
      $scope.menuActive = '/linkedList';

      $scope.updatePage = function(page) {
        $scope.currentPage = page;
      }
      $rootScope.$on('$routeChangeSuccess', function(e, curr, prev) {
       $scope.menuActive = $location.path();
    });
  });
