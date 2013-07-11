var bag = require('bagofcli'),
  buster = require('buster'),
  cli = require('../lib/cli'),
  PkjUtil = new require('../lib/pkjutil');

buster.testCase('cli - exec', {
  'should contain commands with actions': function (done) {
    var mockCommand = function (base, actions) {
      assert.defined(base);
      assert.defined(actions.commands['upgrade-version-patch'].action);
      assert.defined(actions.commands['upgrade-version-minor'].action);
      assert.defined(actions.commands['upgrade-version-major'].action);
      assert.defined(actions.commands['upgrade-version'].action);
      assert.defined(actions.commands['upgrade-dependencies'].action);
      done();
    };
    this.stub(bag, 'command', mockCommand);
    cli.exec();
  }
});

buster.testCase('cli - upgrade-version-*', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.mockProcess = this.mock(process);
  },
  'upgraded-version-patch should pass correct type, log upgraded version, then exit': function () {
    this.stub(bag, 'command', function (base, actions) {
      actions.commands['upgrade-version-patch'].action({ file: 'somepackage.json' });
    });
    this.mockConsole.expects('log').once().withExactArgs('Upgraded version to %s', '0.0.1');
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(PkjUtil.prototype, 'upgradeVersion', function (type, cb) {
      assert.equals(type, 'patch');
      cb(null, { version: '0.0.1' });
    });
    cli.exec();
  },
  'upgraded-version-minor should pass correct type, log upgraded version, then exit': function () {
    this.stub(bag, 'command', function (base, actions) {
      actions.commands['upgrade-version-minor'].action({ file: 'somepackage.json' });
    });
    this.mockConsole.expects('log').once().withExactArgs('Upgraded version to %s', '0.1.0');
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(PkjUtil.prototype, 'upgradeVersion', function (type, cb) {
      assert.equals(type, 'minor');
      cb(null, { version: '0.1.0' });
    });
    cli.exec();
  },
  'upgraded-version-major should pass correct type, log upgraded version, then exit': function () {
    this.stub(bag, 'command', function (base, actions) {
      actions.commands['upgrade-version-major'].action({ file: 'somepackage.json' });
    });
    this.mockConsole.expects('log').once().withExactArgs('Upgraded version to %s', '1.0.0');
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(PkjUtil.prototype, 'upgradeVersion', function (type, cb) {
      assert.equals(type, 'major');
      cb(null, { version: '1.0.0' });
    });
    cli.exec();
  },
  'upgraded-version should pass correct type, log upgraded version, then exit': function () {
    this.stub(bag, 'command', function (base, actions) {
      actions.commands['upgrade-version'].action({ file: 'somepackage.json' });
    });
    this.mockConsole.expects('log').once().withExactArgs('Upgraded version to %s', '0.0.1');
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(PkjUtil.prototype, 'upgradeVersion', function (type, cb) {
      assert.equals(type, 'patch');
      cb(null, { version: '0.0.1' });
    });
    cli.exec();
  }
});

buster.testCase('cli - upgrade-dependencies', {
  setUp: function () {
    this.mockProcess = this.mock(process);
  },
  'upgraded-version should pass correct type, log upgraded version, then exit': function () {
    this.stub(bag, 'command', function (base, actions) {
      actions.commands['upgrade-dependencies'].action({ file: 'somepackage.json', registry: 'http://someregistry' });
    });
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(PkjUtil.prototype, 'upgradeDependencies', function (opts, cb) {
      cb(null);
    });
    cli.exec();
  }
});