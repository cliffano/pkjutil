var async = require('async'),
  bag = require('bagofrequest'),
  colors = require('colors'),
  fs = require('fs'),
  semver = require('semver');

/**
 * class PkjUtil
 *
 * @param {String} file: path to package.json file
 */
function PkjUtil(file) {
  this.file = file || 'package.json';
}

/**
 * Upgrade version based on type.
 *
 * @param {String} type: version type (major, minor, patch), default to patch
 * @param {Function} cb: standard cb(err, result) callback
 */
PkjUtil.prototype.upgradeVersion = function (type, cb) {

  function process(pkg, cb) {
    var version = semver.parse(pkg.version);
    if (type === 'major') {
      version.major += 1;
      version.minor = 0;
      version.patch = 0;
    } else if (type === 'minor') {
      version.minor += 1;
      version.patch = 0;
    } else {
      version.patch += 1;
    }
    pkg.version = version.format();
    cb(pkg);
  }

  this._updatePackage(process, cb);
};

/**
 * Upgrade the version of each dependency to the latest published
 * in the registry.
 *
 * @param {Object} opts: optional
 *   - registry: npm registry, default to public npm registry
 * @param {Function} cb: standard cb(err, result) callback
 */
PkjUtil.prototype.upgradeDependencies = function (opts, cb) {
  const LIMIT = 5;

  opts = opts || {};
  opts.registry = opts.registry || 'https://registry.npmjs.org/';
  if (!opts.registry.match(/\/$/)) {
    opts.registry += '/';
  }

  function process(pkg, cb) {
    function iterator(dependency, cb) {
      var requestOpts = {
        handlers: {
          200: function (result, cb) {
            var latestVersion = JSON.parse(result.body).version,
              currVersion = pkg.dependencies[dependency];
            if (currVersion != latestVersion) {
              pkg.dependencies[dependency] = latestVersion;
              console.log('%s - upgraded to v%s', dependency.green, latestVersion);
            } else {
              console.log('%s - already latest v%s', dependency.grey, latestVersion);
            }
            cb();
          }
        }
      };
      bag.request('get', opts.registry + dependency + '/latest', requestOpts, cb);
    }

    async.eachLimit(Object.keys(pkg.dependencies), LIMIT, iterator, function (err) {
      cb(pkg);
    });
  }

  this._updatePackage(process, cb);
};

/**
 * Read package.json file, apply process function, then overwrite the file.
 *
 * @param {Function} process: process function to be applied to parsed package.json
 * @param {Function} cb: standard cb(err, result) callback
 */
PkjUtil.prototype._updatePackage = function (process, cb) {
  var self = this;
  fs.readFile(this.file, function (err, data) {
    if (err) {
      cb(err);
    } else {
      var pkg = JSON.parse(data);
      process(pkg, function (result) {
        fs.writeFile(self.file, JSON.stringify(result, null, 2), function (err) {
          cb(err, result);
        });
      });
    }
  });
};

module.exports = PkjUtil;