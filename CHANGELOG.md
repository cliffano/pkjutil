# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 3.0.0 - 2026-11-27
### Changed
- Change module type to ESM
- Replace test framework from buster-node + proxyquire to Mocha + Sinon + @sinonjs/referee
- Replace lint type from jshint to eslint, add Prettier style checking
- Replace coverage from buster-istanbul to c8
- Replace doc type from dox-foundation to jsdoc
- Replace Travis CI with GH Actions (CI, CodeQL, publish, release-major/minor/patch, upgrade-deps)
- Add Suntory as build Makefile
- Add AGENTS.md with Node.js project conventions
- Upgrade bagofcli to 4.x, read global CLI options via commander's `program.opts()` and positional args via `args.args` instead of the old `args.parent`/variadic-arguments convention
- Set min node engine to >= 22.0.0
- Replace bagofrequest with Node.js built-in fetch in upgrade-dependencies, removing the deprecated request module and its vulnerable transitive dependencies (form-data, tough-cookie, qs, and others)
- Require `NODE_USE_ENV_PROXY=1` for upgrade-dependencies to use `http_proxy` / `https_proxy` environment variables
- Verify registry TLS certificates in upgrade-dependencies, use `NODE_EXTRA_CA_CERTS` for registries with self-signed certificates
- Replace prod with a built-in installed-package walker in traverse-dependencies, removing the deprecated read-installed module and its outdated transitive dependencies (async 2.x, glob 7, inflight, and others)
- Stop listing peerDependencies under dependencies in traverse-dependencies output, and show declared dependency values as written in package.json instead of normalised

### Fixed
- Fix set-node-engine ignoring the --file option
- Fix list-* commands crashing when the package.json file cannot be read
- Fix set-node-engine crashing when package.json has no engines field
- Fix commands crashing when the package.json file contains invalid JSON
- Fix rewritten package.json missing its trailing newline
- Fix incorrect help text for upgrade-version, upgrade-dependencies --registry, list-alldependencies, and sort-alldependencies

## 1.0.2 - 2025-08-09
### Changed
- Set min node engine to >= 20.0.0

## 1.0.1 - 2016-08-09
### Added
- Add set-node-engine command

## 1.0.0 - 2016-02-03
### Changed
- Major version upgrade only

## 0.1.3 - 2015-06-22
### Changed
- Modify traverseDependencies to check for the existence of package.json and node_modules

## 0.1.2 - 2014-11-12
### Added
- Add optDependencies to the list of dependency types to upgrade

## 0.1.1 - 2014-11-05
### Added
- Add list-peerdependencies, sort-peerdependencies, list-optdependencies, and sort-optdependencies commands
- Add traverse-dependencies command

### Changed
- Modify upgradeDependencies to also upgrade dependencies in devDependencies and peerDependencies properties

## 0.1.0 - 2014-09-11
### Changed
- Set min node engine to >= v0.10.0

## 0.0.6 - 2013-11-05
### Added
- Add --parsable flag to upgrade-version* commands

## 0.0.5 - 2013-10-27
### Fixed
- Fix error handling on sort-* and upgrade-* commands

## 0.0.4 - 2013-10-26
### Added
- Change test lib to buster-node + referee

### Changed
- Set min node engine to >= v0.8.0

### Fixed
- Fix file arg on list-*, sort-*, and upgrade-* commands

## 0.0.3 - 2013-08-25
### Added
- Add list-dependencies, list-devdependencies, list-alldependencies commands
- Add sort-dependencies, sort-devdependencies, sort-alldependencies commands

## 0.0.2 - 2013-08-20
### Added
- Add range version support to dependencies upgrade

## 0.0.1 - 2013-07-11
### Added
- Initial version
