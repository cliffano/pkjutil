# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 4.0.0 - 2026-10-23
### Added
- Add choices field to global and command options for restricting option value to a fixed list
- Add min, max, and integer fields to global and command options for restricting option value to a numeric range, listed in the help output
- Add allowExcessArguments field to commands for rejecting unexpected positional arguments
- Add TypeScript declarations generated from JSDoc

### Changed
- Upgrade Suntory to 1.10.0
- Upgrade workflow runner to Ubuntu 26.04
- Validate arguments and options against their rules before calling the command action handler instead of after

## 3.2.0 - 2026-10-11
### Added
- Add global options to the object passed to command action handlers

### Changed
- Upgrade Suntory to 1.9.0
- Improve code comments for JSDoc documentation generation

### Fixed
- Fix global option and command option validation rules always failing
- Fix lookupConfig prompt masking non-password values while displaying password values

## 3.1.0 - 2026-08-22
### Added
- Add examples

### Changed
- Upgrade Suntory to 1.7.0
- Replace Copilot Instructions with AGENTS.md
- Replace unmaintained iz dependency with validator for argument/option validation
- Replace unmaintained wrench-sui dependency with native fs.readdirSync recursive option
- Remove colors dependency, consolidate on the already-used chalk for coloured output

### Fixed
- Fix flag being silently ignored [#20]
- Fix inability for command to combine positional args and its own options [#21]

## 3.0.0 - 2026-07-05
### Added
- Add Suntory as build Makefile
- Add integration tests

### Changed
- Major refactor for Commander v15 compatibility: allow excess positional arguments and pass Command instance to action handlers
- Set min node engine to >= 22.0.0

### Fixed
- Upgrade dependencies to latest

## 2.5.0 - 2025-11-17
### Changed
- Set min node engine to >= 20.0.0

## 2.4.1 - 2023-07-22
### Fixed
- Fix lack of spacing between log labels and message

## 2.4.0 - 2023-07-21
### Added
- Add labels option support for logStepHeading, logStepItem(Success|Warning|Error)

## 2.3.0 - 2022-06-04
### Added
- Add logStepHeading, logStepItem(Success|Warning|Error)

## 2.2.0 - 2022-01-29
### Added
- Add GH Actions release-* and publish-*

### Changed
- Set min node engine >= 16.0.0

## 2.1.0 - 2020-11-01
### Changed
- Replace buster-istanbul with c8 for test coverage
- Replace prompt with inquirer for input prompt

## 2.0.2 - 2020-06-07
### Fixed
- Fixed missing extension on package.json main property
- Fixed commander arguments handling in version 5.1.0

## 2.0.1 - 2020-05-22
### Fixed
- Fixed rules validation check

## 2.0.0 - 2020-05-13
### Changed
- Changed module to be ESM
- Replace Buster with Mocha for unit tests
- Replace Travis CI with GitHub Actions

### Removed
- Remove sub-dependency to Contextify (no more node-gyp errors)

## 1.1.0 - 2018-02-14
### Added
- Add execAndCollect function

## 1.0.0 - 2016-10-13
### Changed
- Upgrade deps to latest

## 0.2.5 - 2016-08-14
### Changed
- Use safe colors
- Set min node engine to v4.0.0

## 0.2.3 - 2015-07-12
### Added
- Add lookupConfig function

## 0.2.2 - 2015-06-21
### Added
- Add build reports to readme

## 0.2.1 - 2014-11-09
### Added
- Add command option validation
- Add global option validation

## 0.2.0 - 2014-09-08
### Changed
- Set min node engine to v0.10.0

## 0.1.0 - 2014-08-31
### Changed
- Replace validation package from validator to iz

## 0.0.10 - 2014-08-28
### Added
- Add invalid argument rule check

## 0.0.9 - 2014-06-27
### Changed
- Update documentation, upgrade dependencies
- Change test lib to buster-node + referee
- Set min node engine to v0.8.0

## 0.0.6 - 2013-10-13
### Added
- Add files function

## 0.0.5 - 2013-07-15
### Added
- Add optional arg support for usage display

## 0.0.4 - 2013-07-09

## 0.0.3 - 2013-07-08
### Added
- Add command arguments validation support
- Add help examples support

### Changed
- Change exec to display stdout and stderr in chunks
- Display help when command is unspecified
- Display error message when command is unknown

## 0.0.2 - 2013-06-20
### Changed
- Colourise success and error output

## 0.0.1 - 2013-06-01
### Added
- Initial version, extracted from cliffano/bagofholding
