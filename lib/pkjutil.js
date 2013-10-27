var _ = require('lodash'),
  async = require('async'),
  colors = require('colors'),
  fs = require('fs'),
  req = require('bagofrequest'),
  semver = require('semver'),
  util = require('util');

/**
 * class PkjUtil
 *
 * @param {String} file: path to package.json file
 */
function PkjUtil(file) {
  this.file = file || 'package.json';
}

/**
 * List dependencies.
 *
 * @param {String} type: dependencies type (dependencies or devDependencies), all when type is not provided
 * @param {Function} cb: standard cb(err, result) callback
 */
PkjUtil.prototype.listDependencies = function (type, cb) {
  fs.readFile(this.file, function (err, data) {
    var pkg = JSON.parse(data),
      types = type ? [type] : ['dependencies', 'devDependencies'],
      modules = [];
    types.forEach(function (type) {
      modules = modules.concat(Object.keys(pkg[type]));
    });
    modules = _.uniq(modules);
    cb(err, modules);
  });
};

/**
 * Sort dependencies in alphabetical order.
 *
 * @param {String} type: dependencies type (dependencies or devDependencies), all when type is not provided
 * @param {Function} cb: standard cb(err, result) callback
 */
PkjUtil.prototype.sortDependencies = function (type, cb) {

  function process(pkg, cb) {
    var types = type ? [type] : ['dependencies', 'devDependencies'],
      modules = [];
    types.forEach(function (type) {
      var sorted = [];
      Object.keys(pkg[type]).sort().forEach(function (module) {
        sorted.push(util.format('"%s": "%s"', module, pkg[type][module]));
      });
      pkg[type] = JSON.parse(util.format('{%s}', sorted.join(',')));
    });
    cb(null, pkg);
  }

  this._updatePackage(process, cb);
};

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
    cb(null, pkg);
  }

  this._updatePackage(process, cb);
};

/**
 * Upgrade the version of each dependency to the latest published
 * in the registry.
 * Version range will be kept, e.g. ~0.0.1 is upgraded to ~0.0.18 .
 * If version does not contain numeric major.minor.patch, then
 * version is upgraded to latest, e.g. 0.0.x is upgraded to 0.0.18 . 
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
              currVersionMatch = pkg.dependencies[dependency].match(/[0-9]+\.[0-9]+\.[0-9]+/),
              currVersion = currVersionMatch ? currVersionMatch.toString() : null,
              range = currVersionMatch ? pkg.dependencies[dependency].replace(/[0-9]+\.[0-9]+\.[0-9]+.*$/, '') : null;
            
            if (currVersion != latestVersion) {
              pkg.dependencies[dependency] = (range || '') + latestVersion;
              console.log('%s - upgraded to %s', dependency.green, pkg.dependencies[dependency]);
            } else {
              console.log('%s - already latest %s', dependency.grey, pkg.dependencies[dependency]);
            }
            cb();
          }
        }
      };
      req.request('get', opts.registry + dependency + '/latest', requestOpts, cb);
    }

    async.eachLimit(Object.keys(pkg.dependencies), LIMIT, iterator, function (err) {
      cb(err, pkg);
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
      process(pkg, function (err, result) {
        if (err) {
          cb(err, result);
        } else {
          fs.writeFile(self.file, JSON.stringify(result, null, 2), function (err) {
            cb(err, result);
          });
        }
      });
    }
  });
};

module.exports = PkjUtil;