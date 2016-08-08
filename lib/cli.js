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

function _listPeerDependencies(args) {
  __list('peerDependencies', args.parent.file);
}

function _listOptDependencies(args) {
  __list('optDependencies', args.parent.file);
}

function _listAllDependencies(args) {
  __list(null, args.parent.file);
}

function _setNodeEngine(version) {
  pkjUtil = new PkjUtil();
  pkjUtil.setNodeEngine(version, cli.exit);
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

function _sortPeerDependencies(args) {
  __sort('peerDependencies', args.parent.file);
}

function _sortOptDependencies(args) {
  __sort('optDependencies', args.parent.file);
}

function _sortAllDependencies(args) {
  __sort(null, args.parent.file);
}

function _traverseDependencies(args) {
  var pkjUtil = new PkjUtil();
  pkjUtil.traverseDependencies(cli.exitCb(null, function (result) {
    Object.keys(result).forEach(function (name) {
      console.log('* %s', name);
      Object.keys(result[name]).forEach(function (type) {
        console.log('  - %s:', type);
        Object.keys(result[name][type]).forEach(function (dependency) {
          console.log('    - %s: %s', dependency, result[name][type][dependency]);
        });
      });
    });
  }));
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
      'list-peerdependencies': { action: _listPeerDependencies },
      'list-optdependencies': { action: _listOptDependencies },
      'list-alldependencies': { action: _listAllDependencies },
      'set-node-engine': { action: _setNodeEngine },
      'sort-dependencies': { action: _sortDependencies },
      'sort-devdependencies': { action: _sortDevDependencies },
      'sort-peerdependencies': { action: _sortPeerDependencies },
      'sort-optdependencies': { action: _sortOptDependencies },
      'sort-alldependencies': { action: _sortAllDependencies },
      'traverse-dependencies': { action: _traverseDependencies },
      'upgrade-version-patch': { action: _upgradeVersionPatch },
      'upgrade-version-minor': { action: _upgradeVersionMinor },
      'upgrade-version-major': { action: _upgradeVersionMajor },
      'upgrade-version': { action: _upgradeVersionPatch },
      'upgrade-dependencies': { action: _upgradeDependencies },
    }
  };

  cli.command(__dirname, actions);
}

exports.exec = exec;
