var app = require('koa')(),
    parser = require('koa-bodyparser'),
    router = require('koa-router')(),
    serve = require('koa-static'),
    session = require('koa-session'),
    mapping = require('./mapping'),
    mongo = require('mongodb').MongoClient,
    db, peripherals,
    find = (id) => {
        return peripherals.find({
            id: id
        }).limit(1).next();
    };

app.keys = ['secret'];

router.prefix('/api')
    .use(function*(next) {
        this.session.authenticated || this.request.path === '/api/authenticate' ? 
            yield next : this.status = 401;
    })

    .post('/authenticate', function*(next) {
        var body = this.request.body;
        if(body.username === 'admin' && body.password === 'admin') {
            this.status = 200;
            this.session.authenticated = true;
        } else {
            this.status = 401;
            this.message = 'Incorrect login or password';
        }
    })

    .post('/logout', function*(next) {
        this.session.authenticated = false;
        this.status = 200;
    })

    .get('/peripherals', function*(next) {
        var allPeripherals = yield peripherals.find().toArray();

        allPeripherals.forEach((dev) => {
            dev.discovered = mapping.discovered(dev.id)
            dev.discovered = mapping.connected(dev.id)
        });

        this.body = allPeripherals;
    })

    .post('/peripherals', function*(next) {
        var device = this.request.body,
            result = yield peripherals.insertOne(device);

        device._id = result.insertedId;

        this.body = device;
    })

    .get('/peripherals/:id/discover', function*(next) {
        var id = this.params.id,
            chars = yield mapping.discover(id),
            dev = yield find(id);

        Object.keys(chars).forEach((char) => dev.chars[char] = {
            uuid: char,
            name: chars[char].name,
            active: true
        });

        yield peripherals.updateOne({
            id: dev.id
        }, {
            $set: {
                chars: dev.chars
            }
        });

        this.body = dev.chars;
    })

    .put('/peripherals/:id/connected', function*(next) {
        var dev = yield find(this.params.id);

        mapping[+this.request.body.connected ? 'connect' : 'disconnect'](dev.id, dev.chars);

        this.status = 200
    })

    .put('/peripherals/:id/:char/active', function*(next) {
        var id = this.params.id,
            char = this.params.char,
            active = +this.request.body,
            dev = yield find(id);

        yield peripherals.updateOne({
            id: id
        }, {
            $set: {
                ['chars.' + char + '.active']: active
            }
        });

        mapping[active ? 'activate' : 'deactivate'](id, dev.chars[char]);
    })

    .get('/peripherals/scan', function*(next) {
        var devices = yield mapping.scan();

        this.body = devices.map((el) => {
            return {
                id: el.id,
                name: el.advertisement.localName,
                mac: el.address,
                rssi: el.rssi,
                protocol: 'CoAP',
                chars: {}
            };
        });
    });

app.use(parser());
app.use(session(app));
app.use(router.routes());
app.use(serve('public/'));

mongo.connect('mongodb://localhost:27017/router', (err, result) => {
    db = result;
    peripherals = db.collection('peripherals');

    mapping.start()
        .then(() => mapping.scan(), (err) => console.log(err))
        .then(() => peripherals.find().toArray())
        .then((devices) => devices.map((el) => mapping.connect(el.id, el.chars)))
        .then(() => app.listen(8080))
        .then(() => console.log('Server started'));
});