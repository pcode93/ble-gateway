app.controller('menuController', function($scope, $state, $http) {
    $scope.logout = function() {
        $http.post('api/logout').then(function(res) {
            $state.go('login');
        });
    }
})