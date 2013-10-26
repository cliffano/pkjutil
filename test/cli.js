var buster = require('buster-node'),
  _cli = require('bagofcli'),
  cli = require('../lib/cli'),
  PkjUtil = new require('../lib/pkjutil'),
  referee = require('referee'),
  assert = referee.assert;

buster.testCase('cli - exec', {
  'should contain commands with actions': function (done) {
    var mockCommand = function (base, actions) {
      assert.defined(base);
      assert.defined(actions.commands['list-dependencies'].action);
      assert.defined(actions.commands['list-devdependencies'].action);
      assert.defined(actions.commands['list-alldependencies'].action);
      assert.defined(actions.commands['sort-dependencies'].action);
      assert.defined(actions.commands['sort-devdependencies'].action);
      assert.defined(actions.commands['sort-alldependencies'].action);
      assert.defined(actions.commands['upgrade-version-patch'].action);
      assert.defined(actions.commands['upgrade-version-minor'].action);
      assert.defined(actions.commands['upgrade-version-major'].action);
      assert.defined(actions.commands['upgrade-version'].action);
      assert.defined(actions.commands['upgrade-dependencies'].action);
      done();
    };
    this.stub(_cli, 'command', mockCommand);
    cli.exec();
  }
});

buster.testCase('cli - list-*', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.mockProcess = this.mock(process);
  },
  'should list dependencies': function () {
    this.mockConsole.expects('log').once().withExactArgs('dep1');
    this.mockConsole.expects('log').once().withExactArgs('dep2');
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands['list-dependencies'].action({ parent: { file: 'somepackage.json' }});
    });
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(PkjUtil.prototype, 'listDependencies', function (opts, cb) {
      cb(null, ['dep1', 'dep2']);
    });
    cli.exec();
  },
  'should list dev dependencies': function () {
    this.mockConsole.expects('log').once().withExactArgs('dep1');
    this.mockConsole.expects('log').once().withExactArgs('dep2');
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands['list-devdependencies'].action({ parent: { file: 'somepackage.json' }});
    });
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(PkjUtil.prototype, 'listDependencies', function (opts, cb) {
      cb(null, ['dep1', 'dep2']);
    });
    cli.exec();
  },
  'should list all dependencies': function () {
    this.mockConsole.expects('log').once().withExactArgs('dep1');
    this.mockConsole.expects('log').once().withExactArgs('dep2');
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands['list-alldependencies'].action({ parent: { file: 'somepackage.json' }});
    });
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(PkjUtil.prototype, 'listDependencies', function (opts, cb) {
      cb(null, ['dep1', 'dep2']);
    });
    cli.exec();
  }
});

buster.testCase('cli - sort-*', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.mockProcess = this.mock(process);

    this.mockConsole.expects('log').once().withExactArgs('Dependencies sorted');
  },
  'should sort dependencies': function () {
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands['sort-dependencies'].action({ parent: { file: 'somepackage.json' }});
    });
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(PkjUtil.prototype, 'sortDependencies', function (opts, cb) {
      cb(null, {});
    });
    cli.exec();
  },
  'should sort dev dependencies': function () {
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands['sort-devdependencies'].action({ parent: { file: 'somepackage.json' }});
    });
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(PkjUtil.prototype, 'sortDependencies', function (opts, cb) {
      cb(null, {});
    });
    cli.exec();
  },
  'should sort all dependencies': function () {
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands['sort-alldependencies'].action({ parent: { file: 'somepackage.json' }});
    });
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(PkjUtil.prototype, 'sortDependencies', function (opts, cb) {
      cb(null, {});
    });
    cli.exec();
  }
});

buster.testCase('cli - upgrade-version-*', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.mockProcess = this.mock(process);
  },
  'upgraded-version-patch should pass correct type, log upgraded version, then exit': function () {
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands['upgrade-version-patch'].action({ parent: { file: 'somepackage.json' }});
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
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands['upgrade-version-minor'].action({ parent: { file: 'somepackage.json' }});
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
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands['upgrade-version-major'].action({ parent: { file: 'somepackage.json' }});
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
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands['upgrade-version'].action({ parent: { file: 'somepackage.json' }});
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
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands['upgrade-dependencies'].action({ parent: { file: 'somepackage.json' }, registry: 'http://someregistry' });
    });
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(PkjUtil.prototype, 'upgradeDependencies', function (opts, cb) {
      cb(null);
    });
    cli.exec();
  }
});
