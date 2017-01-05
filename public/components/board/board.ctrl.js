app.controller('boardController', function($state, $scope, $http) {
    var scanButtonMoving = false,
        cardInModal;

    (function() {
        $http.get('api/peripherals').then(function(res) {
            $scope.peripherals = res.data || [];
        });
    })();

    (function() {
        var scan = angular.element('.scan-button');

        angular.element(document).mouseup(function() {
            angular.element(document).off('mousemove');
        });

        scan
            .mousedown(function() {
                scanButtonMoving = false;

                angular.element(document).mousemove(function(e) {
                    e.preventDefault();
                    scanButtonMoving = true;

                    scan.css({
                        top: e.pageY - scan.height()/2,
                        left: e.pageX - scan.width()/2
                    });
                });
            })

            .mouseup(function() {
                angular.element(document).off('mousemove');
            })

            .click(function() {
                var modal = angular.element('.scan-modal'),
                    modalHeight = modal.height(),
                    modalWidth = modal.width(),
                    buttonY = scan.position().top,
                    buttonX = scan.position().left,
                    screenHeight = angular.element(window).height(),
                    screenWidth = angular.element(window).width();

                if(!scanButtonMoving) {
                    if(buttonX > modalWidth) {
                        if(buttonY > modalHeight) {
                            modal.css({
                                bottom: screenHeight - buttonY,
                                right: screenWidth - buttonX
                            });
                        } else {
                            modal.css({
                                top: buttonY + scan.height(),
                                right: screenWidth - buttonX
                            });
                        }
                    } else {
                        if(buttonY > modalHeight) {
                            modal.css({
                                bottom: screenHeight - buttonY,
                                left: buttonX + scan.width()
                            });
                        } else {
                            modal.css({
                                top: buttonY + scan.height(),
                                left: buttonX + scan.width()
                            });
                        }
                    }

                    $scope.scan();

                    modal.toggle('fast');
                }
            });

    })();

    $scope.discover = function(peripheral, event) {
        var button = angular.element(event.currentTarget);

        button.addClass('fa-spin');

        $http.get('api/peripherals/' + peripheral.id + '/discover').then(function(res) {
            button.removeClass('fa-spin');
            peripheral.chars = res;
        });
    }

    $scope.active = function(char, peripheral) {
        $http.put('api/peripherals/' + peripheral.id + '/' + char.uuid + '/active', +char.active);
    }

    $scope.connect = function(peripheral, event) {
        event.stopPropagation();

        peripheral.connected = !peripheral.connected;
        $http.put('api/peripherals/' + peripheral.id + '/connected', {connected: +peripheral.connected})
    }

    $scope.scan = function() {
        var refresh = angular.element('.scan-modal .header .fa-refresh');
        $scope.discovered = [];
        $scope.scanningStatus="Scanning...";
        
        refresh.addClass('fa-spin');

        $http.get('api/peripherals/scan').then(function(res) {
            refresh.removeClass('fa-spin');
            $scope.discovered = res.data;
            $scope.scanningStatus = 'Found devices';
        })
    }

    $scope.add = function(device) {
        $http.post('api/peripherals/', device).then(function(res) {
            $scope.peripherals.push(res.data);
        })
    }

    $scope.show = function(e) {
        var card = angular.element(e.currentTarget),
            modal = function() {
                card
                    .addClass('modal')
                    .addClass('lifted')
                    .find('.content-detail')
                    .show();

                card
                    .animate({
                        opacity: 1
                    }, 200)
                    .parent()
                    .click(function(event) {
                        if(cardInModal && event.target !== e.currentTarget) {
                            card
                                .animate({
                                    opacity: 0
                                }, 200, function() {
                                    card
                                        .removeClass('modal')
                                        .find('.content-detail')
                                        .hide();

                                    angular.element('.card').animate({
                                        opacity: 1
                                    }, 200, function() {
                                        cardInModal = null;

                                        card
                                            .removeClass('lifted')
                                            .parent()
                                            .off('click');
                                    });
                                })
                        }
                    })
            }

        e.stopPropagation();

        if(!cardInModal) {
            var allCards = angular.element('.card');

            angular.element('.card').animate({
                opacity: 0
            }, 200, modal)

            cardInModal = card;
        }
    }
})