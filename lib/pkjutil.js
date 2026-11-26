/**
 * @module pkjutil
 */
"use strict";
import _ from "lodash";
import async from "async";
import "colors";
import fs from "fs";
import prod from "prod";
import req from "bagofrequest";
import semver from "semver";
import util from "util";

const DEPENDENCY_TYPES = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optDependencies",
];

/**
 * Utility for reading and modifying a package.json file.
 */
class PkjUtil {
  /**
   * Constructor for initialising PkjUtil.
   *
   * @param {String} [file=package.json] - path to package.json file
   */
  constructor(file) {
    this.file = file || "package.json";
  }

  /**
   * List dependencies.
   *
   * @param {String} [type] - dependencies type (dependencies,
   *   devDependencies, peerDependencies, optDependencies), all types when
   *   not provided
   * @param {Function} cb - standard cb(err, result) callback
   */
  listDependencies(type, cb) {
    this._readPackage(function (err, pkg) {
      if (err) {
        cb(err);
      } else {
        const types = type ? [type] : DEPENDENCY_TYPES;
        let modules = [];
        _.filter(types, function (type) {
          return pkg[type];
        }).forEach(function (type) {
          modules = modules.concat(_.keys(pkg[type]));
        });
        modules = _.uniq(modules);
        cb(null, modules);
      }
    });
  }

  /**
   * Sort dependencies in alphabetical order.
   *
   * @param {String} [type] - dependencies type (dependencies,
   *   devDependencies, peerDependencies, optDependencies), all types when
   *   not provided
   * @param {Function} cb - standard cb(err, result) callback
   */
  sortDependencies(type, cb) {
    function process(pkg, cb) {
      const types = type ? [type] : DEPENDENCY_TYPES;
      _.filter(types, function (type) {
        return pkg[type];
      }).forEach(function (type) {
        const sorted = [];
        _.keys(pkg[type])
          .sort()
          .forEach(function (module) {
            sorted.push(util.format('"%s": "%s"', module, pkg[type][module]));
          });
        pkg[type] = JSON.parse(util.format("{%s}", sorted.join(",")));
      });
      cb(null, pkg);
    }

    this._updatePackage(process, cb);
  }

  /**
   * Traverse dependencies and group each package with its dependencies
   * reference.
   *
   * @param {Function} cb - standard cb(err, result) callback
   */
  traverseDependencies(cb) {
    if (fs.existsSync("package.json") || fs.existsSync("node_modules")) {
      prod().load(function (err, dependencies) {
        let result;
        if (!err) {
          result = {};
          dependencies.map(function (pkg) {
            function filter(type) {
              const checkType =
                type === "dependencies" ? "_dependencies" : type;
              return pkg[checkType] && !_.isEmpty(pkg[checkType]);
            }
            const name = util.format("%s@%s", pkg.name, pkg.version);
            result[name] = {};
            _.filter(DEPENDENCY_TYPES, filter).forEach(function (type) {
              const checkType =
                type === "dependencies" ? "_dependencies" : type;
              result[name][type] = pkg[checkType];
            });
          });
        }
        cb(err, result);
      });
    } else {
      cb(
        new Error(
          "Either package.json file or node_modules directory must exist",
        ),
      );
    }
  }

  /**
   * Upgrade version based on type.
   *
   * @param {String} [type=patch] - version type (major, minor, patch)
   * @param {Function} cb - standard cb(err, result) callback
   */
  upgradeVersion(type, cb) {
    function process(pkg, cb) {
      const version = semver.parse(pkg.version);
      if (type === "major") {
        version.major += 1;
        version.minor = 0;
        version.patch = 0;
      } else if (type === "minor") {
        version.minor += 1;
        version.patch = 0;
      } else {
        version.patch += 1;
      }
      pkg.version = version.format();
      cb(null, pkg);
    }

    this._updatePackage(process, cb);
  }

  /**
   * Upgrade the version of each dependency to the latest published
   * in the registry.
   * Version range will be kept, e.g. ~0.0.1 is upgraded to ~0.0.18 .
   * If version does not contain numeric major.minor.patch, then
   * version is upgraded to latest, e.g. 0.0.x is upgraded to 0.0.18 .
   *
   * @param {Object} [opts] - optional settings
   * @param {String} [opts.registry=https://registry.npmjs.org/] - npm
   *   registry URL
   * @param {Function} cb - standard cb(err, result) callback
   */
  upgradeDependencies(opts, cb) {
    const LIMIT = 5;

    opts = opts || {};
    opts.registry = opts.registry || "https://registry.npmjs.org/";
    if (!opts.registry.match(/\/$/)) {
      opts.registry += "/";
    }

    function process(pkg, cb) {
      function iterator(dependency, cb) {
        const requestOpts = {
          handlers: {
            200: function (result, cb) {
              const latestVersion = JSON.parse(result.body).version;

              function update(type) {
                const dependencies = pkg[type];
                const currVersionMatch = dependencies[dependency].match(
                  /[0-9]+\.[0-9]+\.[0-9]+/,
                );
                const currVersion = currVersionMatch
                  ? currVersionMatch.toString()
                  : null;
                const range = currVersionMatch
                  ? dependencies[dependency].replace(
                      /[0-9]+\.[0-9]+\.[0-9]+.*$/,
                      "",
                    )
                  : null;

                if (currVersion != latestVersion) {
                  dependencies[dependency] = (range || "") + latestVersion;
                  console.log(
                    "%s - %s - upgraded to %s",
                    dependency.green,
                    type,
                    dependencies[dependency],
                  );
                } else {
                  console.log(
                    "%s - %s - already latest %s",
                    dependency.grey,
                    type,
                    dependencies[dependency],
                  );
                }
              }

              _.filter(DEPENDENCY_TYPES, function (type) {
                return pkg[type] && pkg[type][dependency];
              }).forEach(function (type) {
                update(type);
              });
              cb();
            },
          },
        };
        req.request(
          "get",
          opts.registry + dependency + "/latest",
          requestOpts,
          cb,
        );
      }

      let dependencies = [];
      DEPENDENCY_TYPES.forEach(function (type) {
        dependencies = _.union(dependencies, _.keys(pkg[type]));
      });

      async.eachLimit(dependencies, LIMIT, iterator, function (err) {
        cb(err, pkg);
      });
    }

    this._updatePackage(process, cb);
  }

  /**
   * Set the node engine version.
   *
   * @param {String} version - node engine version, e.g. >= 4.0
   * @param {Function} cb - standard cb(err, result) callback
   */
  setNodeEngine(version, cb) {
    function process(pkg, cb) {
      pkg.engines = pkg.engines || {};
      pkg.engines.node = version;
      cb(null, pkg);
    }

    this._updatePackage(process, cb);
  }

  /**
   * Read and parse package.json file.
   *
   * @private
   * @param {Function} cb - standard cb(err, result) callback, result is the
   *   parsed package.json object
   */
  _readPackage(cb) {
    const self = this;
    fs.readFile(this.file, function (err, data) {
      if (err) {
        cb(err);
      } else {
        let pkg;
        try {
          pkg = JSON.parse(data);
        } catch (parseErr) {
          cb(
            new Error(
              util.format(
                "Unable to parse %s: %s",
                self.file,
                parseErr.message,
              ),
            ),
          );
          return;
        }
        cb(null, pkg);
      }
    });
  }

  /**
   * Read package.json file, apply process function, then overwrite the file.
   *
   * @private
   * @param {Function} process - process function to be applied to parsed
   *   package.json
   * @param {Function} cb - standard cb(err, result) callback
   */
  _updatePackage(process, cb) {
    const self = this;
    this._readPackage(function (err, pkg) {
      if (err) {
        cb(err);
      } else {
        process(pkg, function (err, result) {
          if (err) {
            cb(err, result);
          } else {
            fs.writeFile(
              self.file,
              JSON.stringify(result, null, 2),
              function (err) {
                cb(err, result);
              },
            );
          }
        });
      }
    });
  }
}

export { PkjUtil as default };
