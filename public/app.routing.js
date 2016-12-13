app.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/login');

    $stateProvider
        .state('login', {
            url: '/login',
            templateUrl: 'components/login/login.html',
            controller: 'loginController'
        })
        .state('app', {
            url: '/app',
            abstract: true,
            templateUrl: 'components/menu/menu.html',
            controller: 'menuController'
        })
        .state('app.board', {
            url: '/board',
            templateUrl: 'components/board/board.html',
            controller: 'boardController'
        });

});