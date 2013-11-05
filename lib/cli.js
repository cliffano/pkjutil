var cli = require('bagofcli'),
  PkjUtil = require('./pkjutil');

function __list(type, file) {
  pkjUtil = new PkjUtil(file);
  pkjUtil.listDependencies(type, cli.exitCb(null, function (result) {
    result.forEach(function (module) {
      console.log(module);
    });
  }));
}

function _listDependencies(args) {
  __list('dependencies', args.parent.file);
}

function _listDevDependencies(args) {
  __list('devDependencies', args.parent.file);
}

function _listAllDependencies(args) {
  __list(null, args.parent.file);
}

function __sort(type, file) {
  pkjUtil = new PkjUtil(file);
  pkjUtil.sortDependencies(type, cli.exitCb(null, function (pkg) {
    console.log('Dependencies sorted');
  }));
}

function _sortDependencies(args) {
  __sort('dependencies', args.parent.file);
}

function _sortDevDependencies(args) {
  __sort('devDependencies', args.parent.file);
}

function _sortAllDependencies(args) {
  __sort(null, args.parent.file);
}

function __upgradeVersion(type, file, parsable) {
  pkjUtil = new PkjUtil(file);
  pkjUtil.upgradeVersion(type, cli.exitCb(null, function (pkg) {
    if (parsable) {
      console.log(pkg.version);
    } else {
      console.log('Upgraded version to %s', pkg.version);
    }
  }));
}

function _upgradeVersionPatch(args) {
  __upgradeVersion('patch', args.parent.file, args.parsable);
}

function _upgradeVersionMinor(args) {
  __upgradeVersion('minor', args.parent.file, args.parsable);
}

function _upgradeVersionMajor(args) {
  __upgradeVersion('major', args.parent.file, args.parsable);
}

function _upgradeDependencies(args) {
  pkjUtil = new PkjUtil(args.parent.file);
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
      'sort-dependencies': { action: _sortDependencies },
      'sort-devdependencies': { action: _sortDevDependencies },
      'sort-alldependencies': { action: _sortAllDependencies },
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
