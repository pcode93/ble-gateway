var url = require('url'),
    coap = require('coap'),
    server = coap.createServer(),
    paths = new Map(),
    ble = require('noble'),
    connected = [],
    discovered = [],
    findByIdCallback = (id) => (el) => el.id === id;
    coapError = (res, code) => {
        res.code = code;
        res.end();
    },
    unsubscribe = (char, res) => {
        char.$subscribed.splice(char.$subscribed.indexOf(res), 1);

        if(char.$subscribed.length === 0) {
            char.unsubscribe();
        }
    },
    append = (char, dev) => {
        char.properties.forEach((prop) => {
            char['$' + prop] = true;
            char.$subscribed = [];

            char.on('data', (val, notify) => {
                if(notify) {
                    char.$notifyVal = val;

                    for(var sub of char.$subscribed) {
                        sub.write(val);
                    }
                }
            });
        });

        paths.set('/' + dev.id + '/' + char.name, char);
    },
    appendAll = (chars, dev) => {
        for(var char of chars) {
            append(char, dev);
        }
    };

server.on('request', (req, res) => {
    var char = paths.get(url.parse(req.url).pathname);

    if(char) {
        if((req.method === 'POST' || req.method === 'PUT') && char.$write) {
            char.write(req.payload.toString(), true, (err) => {
                err ? coapError(res, 500) : res.end();
            });
        } else if(req.method === 'GET') {
            if('Observe' in req.options && char.$notify) {
                res.on('finish', () => {
                    unsubscribe(char, res);
                });

                if(req.options.Observe) {
                    unsubscribe(char, res);
                    res.end(char.$notifyVal);
                } else {
                    char.$subscribed.push(res);

                    if(char.$subscribed.length === 1) {
                        char.subscribe();
                    }
                }
            } else if(char.$read) {
                char.read((err, val) => {
                    err ? coapError(res, 500) : res.end(val);
                });
            } else {
                coapError(res, 405);
            }
        } else {
            coapError(res, 405);
        }
    } else {
        coapError(res, 404);
    }
});

ble.on('discover', (peripheral) => {
    discovered.push(peripheral);
});

module.exports = {
    connect: (id, chars) => {
        var dev = discovered.find(findByIdCallback(id));

        if(dev && connected.indexOf(dev) === -1) {
            dev.connect((err) => {
                connected.push(dev);

                dev.discoverSomeServicesAndCharacteristics(
                    [],
                    Object.keys(chars),
                    (err, servs, chars) => {
                        appendAll(chars, dev);
                    }
                );
            });
        }
    },

    disconnect: (id) => {
        var dev = connected.find(findByIdCallback(id));
        
        if(dev) {
            dev.disconnect((err) => {
                for(var path of paths.keys().filter((el) => el.startsWith('/' + dev.id))) {
                    paths.delete(path);
                }

                connected.splice(connected.indexOf(dev), 1);
            });
        }
    },

    activate: (peripheralId, char) => {
        var dev = connected.find(findByIdCallback(peripheralId));

        if(dev && !paths.has('/' + dev.id + '/' + char.name)) {
            dev.discoverSomeServicesAndCharacteristics([], char.uuid, (err, servs, chars) => appendAll(chars, dev));
        }
    },

    deactivate: (peripheralId, char) => {
        var dev = connected.find(findByIdCallback(peripheralId));

        if(dev) {
            paths.delete('/' + dev.id + '/' + char.name);
        }
    },

    discover: (id) => new Promise((resolve, reject) => {
        connected.find(findByIdCallback(id)).discoverAllServicesAndCharacteristics((err, servs, chars) => {
            err ? reject(err) : resolve(chars);
        });
    }),

    scan: () => new Promise((resolve, reject) => {
        ble.startScanning();

        setTimeout(() => {
            ble.stopScanning();
            resolve(discovered);
        }, 3000);
    }),

    start: () => new Promise((resolve, reject) => {
        ble.on('stateChange', function cb(state) {
            if(state === 'poweredOn') {
                ble.removeListener('stateChange', cb);
                resolve();
            }
        });
    })
    
};

