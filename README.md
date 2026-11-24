<!-- BEGIN:AVATAR -->
![Avatar](avatar.jpg)
<!-- END:AVATAR -->

<!-- BEGIN:BADGES -->
[![Build Status](https://github.com/cliffano/pkjutil/workflows/CI/badge.svg)](https://github.com/cliffano/pkjutil/actions?query=workflow%3ACI)
[![Dependencies Status](https://img.shields.io/librariesio/release/npm/pkjutil)](https://libraries.io/npm/pkjutil)
[![Code Scanning Status](https://github.com/cliffano/pkjutil/workflows/CodeQL/badge.svg)](https://github.com/cliffano/pkjutil/actions?query=workflow%3ACodeQL)
[![Coverage Status](https://coveralls.io/repos/github/cliffano/pkjutil/badge.svg?branch=main)](https://coveralls.io/r/cliffano/pkjutil?branch=main)
[![Security Status](https://snyk.io/test/github/cliffano/pkjutil/badge.svg)](https://snyk.io/test/github/cliffano/pkjutil)
[![Published Version](https://img.shields.io/npm/v/pkjutil.svg)](https://www.npmjs.com/package/pkjutil)
<!-- END:BADGES -->

# PkjUtil

PkjUtil is a package.json utility tool.

This is handy for upgrading major/minor/patch version in package.json file, and also to upgrade all dependencies to latest version.

## Installation

```bash
npm install -g pkjutil
```

## Usage

Upgrade patch version number:

```bash
pkjutil upgrade-version
```

Upgrade minor version number with custom package.json file path:

```bash
pkjutil upgrade-version-minor --file /tmp/package.json
```

Upgrade major version number:

```bash
pkjutil upgrade-version-major
```

Upgrade dependencies:

```bash
pkjutil upgrade-dependencies
```

Upgrade dependencies using custom registry:

```bash
pkjutil upgrade-dependencies --registry http://someregistry
```

List dependencies:

```bash
pkjutil list-dependencies
```

List dev dependencies:

```bash
pkjutil list-devdependencies
```

List peer dependencies:

```bash
pkjutil list-peerdependencies
```

List optional dependencies (non-standard property in package.json):

```bash
pkjutil list-optdependencies
```

List dependencies and dev dependencies:

```bash
pkjutil list-alldependencies
```

Sort dependencies:

```bash
pkjutil sort-dependencies
```

Sort dev dependencies:

```bash
pkjutil sort-devdependencies
```

Sort peer dependencies:

```bash
pkjutil sort-peerdependencies
```

Sort optional dependencies (non-standard property in package.json):

```bash
pkjutil sort-optdependencies
```

Sort dependencies and dev dependencies:

```bash
pkjutil sort-alldependencies
```

Traverse dependencies, similar to 'npm ls' but listing dependency references instead of versions:

```bash
pkjutil traverse-dependencies
```

Show help guide:

```bash
pkjutil --help
```

## Colophon

<!-- BEGIN:DEVELOPERS_GUIDE -->
[Developer's Guide](https://cliffano.github.io/developers-guide-nodejs.html)
<!-- END:DEVELOPERS_GUIDE -->

<!-- BEGIN:BUILD_REPORTS -->
Build reports:

* [Code complexity report](https://cliffano.github.io/pkjutil/complexity/plato/index.html)
* [Unit tests report](https://cliffano.github.io/pkjutil/test/mocha.txt)
* [Test coverage report](https://cliffano.github.io/pkjutil/coverage/c8/index.html)
* [Integration tests report](https://cliffano.github.io/pkjutil/test-integration/cmdt.txt)
* [API Documentation](https://cliffano.github.io/pkjutil/doc/jsdoc/index.html)

<!-- END:BUILD_REPORTS -->
