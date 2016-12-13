app.controller('loginController', function($scope, $http, $state) {
    $scope.login = function() {
        $http.post('api/authenticate', {
            username: $scope.username,
            password: $scope.password
        }).then(function(res) {
            $state.go('app.board');
        }, function(err) {
            console.log(err);
        });
    }

    angular.element(function() {
        angular.element('.form-login').slideDown();
    })
})