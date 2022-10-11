<img align="right" src="https://raw.github.com/cliffano/pkjutil/master/avatar.jpg" alt="Avatar"/>

[![Build Status](https://img.shields.io/travis/cliffano/pkjutil.svg)](http://travis-ci.org/cliffano/pkjutil)
[![Dependencies Status](https://img.shields.io/david/cliffano/pkjutil.svg)](http://david-dm.org/cliffano/pkjutil)
[![Coverage Status](https://img.shields.io/coveralls/cliffano/pkjutil.svg)](https://coveralls.io/r/cliffano/pkjutil?branch=master)
[![Published Version](https://img.shields.io/npm/v/pkjutil.svg)](http://www.npmjs.com/package/pkjutil)
<br/>
[![npm Badge](https://nodei.co/npm/pkjutil.png)](http://npmjs.org/package/pkjutil)

PkjUtil 
------

PkjUtil is a package.json utility tool.

This is handy for upgrading major/minor/patch version in package.json file, and also to upgrade all dependencies to latest version.

Installation
------------

    npm install -g pkjutil

Usage
-----

Upgrade patch version number:

    pkjutil upgrade-version

Upgrade minor version number with custom package.json file path:

    pkjutil upgrade-version-minor --file /tmp/package.json

Upgrade major version number:

    pkjutil upgrade-version-major

Upgrade dependencies:

    pkjutil upgrade-dependencies

Upgrade dependencies using custom registry:

    pkjutil upgrade-dependencies --registry http://someregistry

List dependencies:

    pkjutil list-dependencies

List dev dependencies:

    pkjutil list-devdependencies

List peer dependencies:

    pkjutil list-peerdependencies

List optional dependencies (non-standard property in package.json):

    pkjutil list-optdependencies

List dependencies and dev dependencies:

    pkjutil list-alldependencies

Sort dependencies:

    pkjutil sort-dependencies

Sort dev dependencies:

    pkjutil sort-devdependencies

Sort peer dependencies:

    pkjutil sort-peerdependencies

Sort optional dependencies (non-standard property in package.json):

    pkjutil sort-optdependencies

Sort dependencies and dev dependencies:

    pkjutil sort-alldependencies

Traverse dependencies, similar to 'npm ls' but listing dependency references instead of versions:

    pkjutil traverse-dependencies

Colophon
--------

[Developer's Guide](https://cliffano.github.io/developers_guide.html#nodejs)

Build reports:

* [Code complexity report](https://cliffano.github.io/pkjutil/complexity/plato/index.html)
* [Unit tests report](https://cliffano.github.io/pkjutil/test/buster.out)
* [Test coverage report](https://cliffano.github.io/pkjutil/coverage/buster-istanbul/lcov-report/lib/index.html)
* [Integration tests report](https://cliffano.github.io/pkjutil/test-integration/cmdt.out)
* [API Documentation](https://cliffano.github.io/pkjutil/doc/dox-foundation/index.html)
