app.controller('boardController', function($state, $scope, $http) {
    var scanButtonMoving = false,
        cardInModal;

    (function() {
        $http.get('api/peripherals').then(function(res) {
            $scope.peripherals = res.data || [];
            $scope.peripherals.forEach(function(peripheral) {
                peripheral.connected = true;
            });
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

    $scope.connect = function(peripheral) {
        peripheral.connected = !peripheral.connected;
        $http.put('api/peripherals/' + peripheral.id + '/connected', +peripheral.connected)
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
            height = card.height() * 2.5,
            width = card.width() * 2.5,
            modal = function() {
                card
                    .css({
                        'box-shadow': '0 2px 24px rgba(0,0,0,0.3)',
                        position: 'absolute',
                    })
                    .addClass('lifted')
                    .animate({
                        top: card.parent().height()/2 - height/2,
                        left: card.parent().width()/2 - width/2,
                        height: height,
                        width: width
                    }, 150, function() {
                        card.find('.content-detail').show();
                    })
                    .parent().click(function(event) {
                        if(cardInModal && event.target !== e.currentTarget) {
                            card.animate({
                                top: 0,
                                left: 0,
                                width: width/2.5,
                                height: height/2.5
                            }, 150, function() {
                                card
                                    .css({
                                        'box-shadow': '',
                                        position: ''
                                    })
                                    .find('.content-detail')
                                    .hide();

                                angular.element('.card').animate({
                                    opacity: 1
                                }, 200);

                                cardInModal = null;
                                card.parent().off('click');
                                card.removeClass('lifted');
                            })
                        }
                    })
            }

        e.stopPropagation();

        if(!cardInModal) {
            var allCards = angular.element('.card');

            if(allCards.length > 1) { 
                allCards.not(card[0]).animate({
                    opacity: 0
                }, 200, modal)
            } else {
                modal();
            }

            cardInModal = card;
        }
    }
})