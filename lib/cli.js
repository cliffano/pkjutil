var bag = require('bagofcli'),
  PkjUtil = require('./pkjutil');

function __upgradeVersion(type, file) {
  pkjUtil = new PkjUtil(file);
  pkjUtil.upgradeVersion(type, bag.exitCb(null, function (pkg) {
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
  pkjUtil.upgradeDependencies({ registry: args.registry }, bag.exit);
}

/**
 * Execute PkjUtil CLI.
 */
function exec() {

  var actions = {
    commands: {
      'upgrade-version-patch': { action: _upgradeVersionPatch },
      'upgrade-version-minor': { action: _upgradeVersionMinor },
      'upgrade-version-major': { action: _upgradeVersionMajor },
      'upgrade-version': { action: _upgradeVersionPatch },
      'upgrade-dependencies': { action: _upgradeDependencies }
    }
  };

  bag.command(__dirname, actions);
}

exports.exec = exec;
