var buster = require('buster-node'),
  fs = require('fs'),
  PkjUtil = require('../lib/pkjutil'),
  referee = require('referee'),
  req = require('bagofrequest'),
  assert = referee.assert;

buster.testCase('pkjutil - listDependencies', {
  setUp: function () {
    this.mockFs = this.mock(fs);
    this.pkjUtil = new PkjUtil();
    this.mockFs.expects('readFile').once().withArgs('package.json').callsArgWith(1, null, '{"dependencies": { "dep1": "0.0.1", "dep2": "0.0.2", "shareddep": "0.0.1" }, "devDependencies": { "devdep1": "0.0.1", "shareddep": "0.0.1" }}');
  },
  'should pass dependency module names when type is dependencies': function (done) {
    this.pkjUtil.listDependencies('dependencies', function (err, deps) {
      assert.isNull(err);
      assert.equals(deps, ['dep1', 'dep2', 'shareddep']);
      done();
    });
  },
  'should pass dev dependency module names when type is devDependencies': function (done) {
    this.pkjUtil.listDependencies('devDependencies', function (err, deps) {
      assert.isNull(err);
      assert.equals(deps, ['devdep1', 'shareddep']);
      done();
    });
  },
  'should pass both dependency and dev dependency module names when type is null': function (done) {
    this.pkjUtil.listDependencies(null, function (err, deps) {
      assert.isNull(err);
      assert.equals(deps, ['dep1', 'dep2', 'shareddep', 'devdep1']);
      done();
    });
  }
});

buster.testCase('pkjutil - sortDependencies', {
  setUp: function () {
    this.mockFs = this.mock(fs);
    this.pkjUtil = new PkjUtil();
    this.mockFs.expects('readFile').once().withArgs('package.json').callsArgWith(1, null, '{"dependencies": { "bdep1": "0.0.1", "adep2": "0.0.2", "cdep": "0.0.1" }, "devDependencies": { "zdep1": "0.0.1", "cdep": "0.0.1" }}');
    this.mockFs.expects('writeFile').once().callsArgWith(2, null);
  },
  'should sort dependency module names when type is dependencies': function (done) {
    this.pkjUtil.sortDependencies('dependencies', function (err, pkg) {
      assert.isNull(err);
      assert.equals(JSON.stringify(pkg.dependencies), '{"adep2":"0.0.2","bdep1":"0.0.1","cdep":"0.0.1"}');
      done();
    });
  },
  'should pass dev dependency module names when type is devDependencies': function (done) {
    this.pkjUtil.sortDependencies('devDependencies', function (err, pkg) {
      assert.isNull(err);
      assert.equals(JSON.stringify(pkg.devDependencies), '{"cdep":"0.0.1","zdep1":"0.0.1"}');
      done();
    });
  },
  'should sort both dependency and dev dependency module names when type is null': function (done) {
    this.pkjUtil.sortDependencies(null, function (err, pkg) {
      assert.isNull(err);
      assert.equals(JSON.stringify(pkg.dependencies), '{"adep2":"0.0.2","bdep1":"0.0.1","cdep":"0.0.1"}');
      assert.equals(JSON.stringify(pkg.devDependencies), '{"cdep":"0.0.1","zdep1":"0.0.1"}');
      done();
    });
  }
});

buster.testCase('pkjutil - upgradeVersion', {
  setUp: function () {
    this.mockFs = this.mock(fs);
    this.pkjUtil = new PkjUtil();
  },
  'should pass error to callback when an error occurs while reading package file': function (done) {
    this.mockFs.expects('readFile').once().withArgs('package.json').callsArgWith(1, new Error('some error'));
    this.pkjUtil.upgradeVersion(null, function (err, pkg) {
      assert.equals(err.message, 'some error');
      assert.equals(pkg, undefined);
      done();
    });
  },
  'should pass error to callback when an error occurs while writing package file': function (done) {
    this.mockFs.expects('readFile').once().withArgs('package.json').callsArgWith(1, null, '{"version":"9.8.1"}');
    this.mockFs.expects('writeFile').once().withArgs('package.json', '{\n  "version": "9.8.2"\n}').callsArgWith(2, new Error('some error'));
    this.pkjUtil.upgradeVersion(null, function (err, pkg) {
      assert.equals(err.message, 'some error');
      assert.equals(pkg.version, '9.8.2');
      done();
    });
  },
  'should upgrade patch number when type is not specified': function (done) {
    this.mockFs.expects('readFile').once().withArgs('package.json').callsArgWith(1, null, '{"version":"9.8.1"}');
    this.mockFs.expects('writeFile').once().withArgs('package.json', '{\n  "version": "9.8.2"\n}').callsArgWith(2, null);
    this.pkjUtil.upgradeVersion(null, function (err, pkg) {
      assert.isNull(err);
      assert.equals(pkg.version, '9.8.2');
      done();
    });
  },
  'should upgrade patch number when type is patch': function (done) {
    this.mockFs.expects('readFile').once().withArgs('package.json').callsArgWith(1, null, '{"version":"9.8.1"}');
    this.mockFs.expects('writeFile').once().withArgs('package.json', '{\n  "version": "9.8.2"\n}').callsArgWith(2, null);
    this.pkjUtil.upgradeVersion('patch', function (err, pkg) {
      assert.isNull(err);
      assert.equals(pkg.version, '9.8.2');
      done();
    });
  },
  'should upgrade minor number and reset patch to 0 when type is minor': function (done) {
    this.mockFs.expects('readFile').once().withArgs('package.json').callsArgWith(1, null, '{"version":"9.8.1"}');
    this.mockFs.expects('writeFile').once().withArgs('package.json', '{\n  "version": "9.9.0"\n}').callsArgWith(2, null);
    this.pkjUtil.upgradeVersion('minor', function (err, pkg) {
      assert.isNull(err);
      assert.equals(pkg.version, '9.9.0');
      done();
    });
  },
  'should upgrade major number and reset minor and patch to 0 when type is major': function (done) {
    this.mockFs.expects('readFile').once().withArgs('package.json').callsArgWith(1, null, '{"version":"9.8.1"}');
    this.mockFs.expects('writeFile').once().withArgs('package.json', '{\n  "version": "10.0.0"\n}').callsArgWith(2, null);
    this.pkjUtil.upgradeVersion('major', function (err, pkg) {
      assert.isNull(err);
      assert.equals(pkg.version, '10.0.0');
      done();
    });
  },
  'should keep prerelease detail when upgrading a version': function (done) {
    this.mockFs.expects('readFile').once().withArgs('package.json').callsArgWith(1, null, '{"version":"9.8.1-pre"}');
    this.mockFs.expects('writeFile').once().withArgs('package.json', '{\n  "version": "9.8.2-pre"\n}').callsArgWith(2, null);
    this.pkjUtil.upgradeVersion(null, function (err, pkg) {
      assert.isNull(err);
      assert.equals(pkg.version, '9.8.2-pre');
      done();
    });
  }
});

buster.testCase('pkjutil - upgradeDependencies', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.mockFs = this.mock(fs);
    this.pkjUtil = new PkjUtil();
  },
  'should set all deps to latest version and log messages': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('%s - upgraded to %s', 'dep1'.green, '0.0.2');
    this.mockConsole.expects('log').once().withExactArgs('%s - already latest %s', 'dep2'.grey, '0.0.2');

    this.mockFs.expects('readFile').once().withArgs('package.json').callsArgWith(1, null, '{"dependencies":{"dep1":"0.0.1","dep2":"0.0.2"}}');
    this.mockFs.expects('writeFile').once().withArgs('package.json', '{\n  "dependencies": {\n    "dep1": "0.0.2",\n    "dep2": "0.0.2"\n  }\n}').callsArgWith(2, null);

    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      var body;
      if (url === 'https://registry.npmjs.org/dep1/latest') {
        body = '{"version":"0.0.2"}';
      } else if (url === 'https://registry.npmjs.org/dep2/latest') {
        body = '{"version":"0.0.2"}';
      }
      opts.handlers[200]({ statusCode: 200, body: body }, cb);
    };
    this.stub(req, 'request', mockRequest);

    this.pkjUtil.upgradeDependencies(null, function (err, pkg) {
      assert.isNull(err);
      assert.equals(pkg.dependencies.dep1, '0.0.2');
      assert.equals(pkg.dependencies.dep2, '0.0.2');
      done();
    });
  },
  'should pass error to callback when upgrade dependencies fail': function (done) {
    this.mockFs.expects('readFile').once().withArgs('package.json').callsArgWith(1, null, '{"dependencies":{"dep1":"0.0.1","dep2":"0.0.2"}}');
    
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      cb(new Error('some error'));
    };
    this.stub(req, 'request', mockRequest);

    this.pkjUtil.upgradeDependencies(null, function (err, pkg) {
      assert.equals(err.message, 'some error');
      done();
    });
  },
  'should add trailing slash when custom registry does not have trailing slash': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('%s - upgraded to %s', 'dep1'.green, '0.0.2');
    this.mockConsole.expects('log').once().withExactArgs('%s - already latest %s', 'dep2'.grey, '0.0.2');

    this.mockFs.expects('readFile').once().withArgs('package.json').callsArgWith(1, null, '{"dependencies":{"dep1":"0.0.1","dep2":"0.0.2"}}');
    this.mockFs.expects('writeFile').once().withArgs('package.json', '{\n  "dependencies": {\n    "dep1": "0.0.2",\n    "dep2": "0.0.2"\n  }\n}').callsArgWith(2, null);

    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      var body;
      if (url === 'http://someregistry/dep1/latest') {
        body = '{"version":"0.0.2"}';
      } else if (url === 'http://someregistry/dep2/latest') {
        body = '{"version":"0.0.2"}';
      }
      opts.handlers[200]({ statusCode: 200, body: body }, cb);
    };
    this.stub(req, 'request', mockRequest);

    this.pkjUtil.upgradeDependencies({ registry: 'http://someregistry' }, function (err, pkg) {
      assert.isNull(err);
      assert.equals(pkg.dependencies.dep1, '0.0.2');
      assert.equals(pkg.dependencies.dep2, '0.0.2');
      done();
    });
  },
  'should keep version range': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('%s - upgraded to %s', 'dep1'.green, '>=0.0.2');
    this.mockConsole.expects('log').once().withExactArgs('%s - already latest %s', 'dep2'.grey, '~0.0.2');

    this.mockFs.expects('readFile').once().withArgs('package.json').callsArgWith(1, null, '{"dependencies":{"dep1":">=0.0.1","dep2":"~0.0.2"}}');
    this.mockFs.expects('writeFile').once().withArgs('package.json', '{\n  "dependencies": {\n    "dep1": ">=0.0.2",\n    "dep2": "~0.0.2"\n  }\n}').callsArgWith(2, null);

    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      var body;
      if (url === 'https://registry.npmjs.org/dep1/latest') {
        body = '{"version":"0.0.2"}';
      } else if (url === 'https://registry.npmjs.org/dep2/latest') {
        body = '{"version":"0.0.2"}';
      }
      opts.handlers[200]({ statusCode: 200, body: body }, cb);
    };
    this.stub(req, 'request', mockRequest);

    this.pkjUtil.upgradeDependencies(null, function (err, pkg) {
      assert.isNull(err);
      assert.equals(pkg.dependencies.dep1, '>=0.0.2');
      assert.equals(pkg.dependencies.dep2, '~0.0.2');
      done();
    });
  },
  'should upgrade wildcards to latest version': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('%s - upgraded to %s', 'dep1'.green, '0.0.2');
    this.mockConsole.expects('log').once().withExactArgs('%s - upgraded to %s', 'dep2'.green, '0.0.2');

    this.mockFs.expects('readFile').once().withArgs('package.json').callsArgWith(1, null, '{"dependencies":{"dep1":"1.x.x","dep2":"*"}}');
    this.mockFs.expects('writeFile').once().withArgs('package.json', '{\n  "dependencies": {\n    "dep1": "0.0.2",\n    "dep2": "0.0.2"\n  }\n}').callsArgWith(2, null);

    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      var body;
      if (url === 'https://registry.npmjs.org/dep1/latest') {
        body = '{"version":"0.0.2"}';
      } else if (url === 'https://registry.npmjs.org/dep2/latest') {
        body = '{"version":"0.0.2"}';
      }
      opts.handlers[200]({ statusCode: 200, body: body }, cb);
    };
    this.stub(req, 'request', mockRequest);

    this.pkjUtil.upgradeDependencies(null, function (err, pkg) {
      assert.isNull(err);
      assert.equals(pkg.dependencies.dep1, '0.0.2');
      assert.equals(pkg.dependencies.dep2, '0.0.2');
      done();
    });
  }
});
