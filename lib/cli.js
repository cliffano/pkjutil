"use strict";
import bag from "bagofcli";
import { program as commander } from "commander";
import p from "path";
import { fileURLToPath } from "url";
import PkjUtil from "./pkjutil.js";

const DIRNAME = p.dirname(fileURLToPath(import.meta.url));

function __list(type, file) {
  const pkjUtil = new PkjUtil(file);
  pkjUtil.listDependencies(
    type,
    bag.exitCb(null, function (result) {
      result.forEach(function (module) {
        console.log(module);
      });
    }),
  );
}

function _listDependencies() {
  __list("dependencies", commander.opts().file);
}

function _listDevDependencies() {
  __list("devDependencies", commander.opts().file);
}

function _listPeerDependencies() {
  __list("peerDependencies", commander.opts().file);
}

function _listOptDependencies() {
  __list("optDependencies", commander.opts().file);
}

function _listAllDependencies() {
  __list(null, commander.opts().file);
}

function _setNodeEngine(args) {
  const version = args.args[0];
  const pkjUtil = new PkjUtil();
  pkjUtil.setNodeEngine(version, bag.exit);
}

function __sort(type, file) {
  const pkjUtil = new PkjUtil(file);
  pkjUtil.sortDependencies(
    type,
    bag.exitCb(null, function () {
      console.log("Dependencies sorted");
    }),
  );
}

function _sortDependencies() {
  __sort("dependencies", commander.opts().file);
}

function _sortDevDependencies() {
  __sort("devDependencies", commander.opts().file);
}

function _sortPeerDependencies() {
  __sort("peerDependencies", commander.opts().file);
}

function _sortOptDependencies() {
  __sort("optDependencies", commander.opts().file);
}

function _sortAllDependencies() {
  __sort(null, commander.opts().file);
}

function _traverseDependencies() {
  const pkjUtil = new PkjUtil();
  pkjUtil.traverseDependencies(
    bag.exitCb(null, function (result) {
      Object.keys(result).forEach(function (name) {
        console.log("* %s", name);
        Object.keys(result[name]).forEach(function (type) {
          console.log("  - %s:", type);
          Object.keys(result[name][type]).forEach(function (dependency) {
            console.log(
              "    - %s: %s",
              dependency,
              result[name][type][dependency],
            );
          });
        });
      });
    }),
  );
}

function __upgradeVersion(type, file, parsable) {
  const pkjUtil = new PkjUtil(file);
  pkjUtil.upgradeVersion(
    type,
    bag.exitCb(null, function (pkg) {
      if (parsable) {
        console.log(pkg.version);
      } else {
        console.log("Upgraded version to %s", pkg.version);
      }
    }),
  );
}

function _upgradeVersionPatch(args) {
  __upgradeVersion("patch", commander.opts().file, args.parsable);
}

function _upgradeVersionMinor(args) {
  __upgradeVersion("minor", commander.opts().file, args.parsable);
}

function _upgradeVersionMajor(args) {
  __upgradeVersion("major", commander.opts().file, args.parsable);
}

function _upgradeDependencies(args) {
  const pkjUtil = new PkjUtil(commander.opts().file);
  pkjUtil.upgradeDependencies({ registry: args.registry }, bag.exit);
}

/**
 * Execute PkjUtil CLI.
 */
function exec() {
  const actions = {
    commands: {
      "list-dependencies": { action: _listDependencies },
      "list-devdependencies": { action: _listDevDependencies },
      "list-peerdependencies": { action: _listPeerDependencies },
      "list-optdependencies": { action: _listOptDependencies },
      "list-alldependencies": { action: _listAllDependencies },
      "set-node-engine": { action: _setNodeEngine },
      "sort-dependencies": { action: _sortDependencies },
      "sort-devdependencies": { action: _sortDevDependencies },
      "sort-peerdependencies": { action: _sortPeerDependencies },
      "sort-optdependencies": { action: _sortOptDependencies },
      "sort-alldependencies": { action: _sortAllDependencies },
      "traverse-dependencies": { action: _traverseDependencies },
      "upgrade-version-patch": { action: _upgradeVersionPatch },
      "upgrade-version-minor": { action: _upgradeVersionMinor },
      "upgrade-version-major": { action: _upgradeVersionMajor },
      "upgrade-version": { action: _upgradeVersionPatch },
      "upgrade-dependencies": { action: _upgradeDependencies },
    },
  };

  bag.command(DIRNAME, actions);
}

const exports = {
  exec: exec,
};

export { exports as default };
