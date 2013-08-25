var cli = require('bagofcli'),
  PkjUtil = require('./pkjutil');

function __list(type) {
  pkjUtil = new PkjUtil();
  pkjUtil.listDependencies(type, cli.exitCb(null, function (result) {
    result.forEach(function (module) {
      console.log(module);
    });
  }));
}

function _listDependencies(args) {
  __list('dependencies');
}

function _listDevDependencies(args) {
  __list('devDependencies');
}

function _listAllDependencies(args) {
  __list();
}

function __upgradeVersion(type, file) {
  pkjUtil = new PkjUtil(file);
  pkjUtil.upgradeVersion(type, cli.exitCb(null, function (pkg) {
    console.log('Upgraded version to %s', pkg.version);
  }));
}

function _upgradeVersionPatch(args) {
  __upgradeVersion('patch', args.file);
}

function _upgradeVersionMinor(args) {
  __upgradeVersion('minor', args.file);
}

function _upgradeVersionMajor(args) {
  __upgradeVersion('major', args.file);
}

function _upgradeDependencies(args) {
  pkjUtil = new PkjUtil(args.file);
  pkjUtil.upgradeDependencies({ registry: args.registry }, cli.exit);
}

/**
 * Execute PkjUtil CLI.
 */
function exec() {

  var actions = {
    commands: {
      'list-dependencies': { action: _listDependencies },
      'list-devdependencies': { action: _listDevDependencies },
      'list-alldependencies': { action: _listAllDependencies },
      'upgrade-version-patch': { action: _upgradeVersionPatch },
      'upgrade-version-minor': { action: _upgradeVersionMinor },
      'upgrade-version-major': { action: _upgradeVersionMajor },
      'upgrade-version': { action: _upgradeVersionPatch },
      'upgrade-dependencies': { action: _upgradeDependencies }
    }
  };

  cli.command(__dirname, actions);
}

exports.exec = exec;
