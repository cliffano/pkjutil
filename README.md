<img align="right" src="https://raw.github.com/cliffano/pkjutil/master/avatar.jpg" alt="Avatar"/>

[![Build Status](https://secure.travis-ci.org/cliffano/pkjutil.png?branch=master)](http://travis-ci.org/cliffano/pkjutil)
[![Dependencies Status](https://david-dm.org/cliffano/pkjutil.png)](http://david-dm.org/cliffano/pkjutil)
[![Published Version](https://badge.fury.io/js/pkjutil.png)](http://badge.fury.io/js/pkjutil)
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

List dependencies and dev dependencies:

    pkjutil list-alldependencies

Sort dependencies:

    pkjutil sort-dependencies

Sort dev dependencies:

    pkjutil sort-devdependencies

Sort dependencies and dev dependencies:

    pkjutil sort-alldependencies
