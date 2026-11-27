<img align="right" src="https://raw.github.com/cliffano/bagofrequest/master/avatar.jpg" alt="Avatar"/>

[![Build Status](https://img.shields.io/travis/cliffano/bagofrequest.svg)](http://travis-ci.org/cliffano/bagofrequest)
[![Dependencies Status](https://img.shields.io/david/cliffano/bagofrequest.svg)](http://david-dm.org/cliffano/bagofrequest)
[![Coverage Status](https://img.shields.io/coveralls/cliffano/bagofrequest.svg)](https://coveralls.io/r/cliffano/bagofrequest?branch=master)
[![Published Version](https://img.shields.io/npm/v/bagofrequest.svg)](http://www.npmjs.com/package/bagofrequest)
<br/>
[![npm Badge](https://nodei.co/npm/bagofrequest.png)](http://npmjs.org/package/bagofrequest)

Bag Of Request
--------------
Bag Of Request contains request utility functions.

bagofrequest#request

Send http request using [mikeal/request](http://github.com/mikeal/request), with the following additional features:

* status code-based response handlers registration
* wildcard status code support (e.g. 2xx, 50x)
* unexpected status code error handling with request body included in message
* request retry with increasing delay and maximum retries
* proxy setting based on env vars http_proxy, HTTP_PROXY, https_proxy, HTTPS_PROXY
* proxy exclusion for localhost and 127.0.0.1
* request timeout of 30 seconds
* follow redirects
* accepts self-signed SSL certificates
* all of the above defaults can be overridden

bagofrequest#proxy

Proxy retrieval based on URL and environment variables:

* if URL uses http, then sets proxy to http_proxy or HTTP_PROXY
* if URL uses https, then sets proxy to htps_proxy or HTTPS_PROXY, otherwise fallback to http_proxy or HTTP_PROXY
* if URL does not have a protocol, assume http protocol
* if URL is not provided, then set proxy to http_proxy or HTTP_PROXY, otherwise fallback to https_proxy or HTTPS_PROXY
* proxy will be ignored if host is on no_proxy or NO_PROXY when provided, otherwise ignore 127.0.0.1 and localhost

Installation
------------

    npm install bagofrequest

or as a dependency in package.json file:

    "dependencies": {
      "bagofrequest": "x.y.z"
    }

Usage
-----

    var bag = require('bagofrequest');

Request:

    // send http get request with query strings, timeout, and specified status code-based handlers
    bag.request('get', 'http://somehost', {
        queryStrings: {
          param1: 'value1',
          param2: 'value2'
        },
        timeout: 30000,
        handlers: {
          '2xx': function (result, cb) {
            cb(null, result.somedata);
          },
          404: function (result, cb) {
            cb(new Error('Item ' + result.itemId + ' cannot be found'));
          }
        }
      },
      function (err, result) {
        // response with unexpected status code (no registered handler) will be passed as error
      });

    // send http post request
    bag.request('post', 'http://somehost', {
        headers: {
          'content-type': 'application/json'
        },
        json: {
          prop1: 'value1',
          prop2: 'value2'
        }
      },
      function (err, result) {
      });

    // send request with options to override any bagofrequest defaults (will be passed to mikeal/request)
    bag.request('get', 'http://somehost', {
        requestOpts: {
          foo: 'bar'
        }
      },
      function (err, result) {
      });

    // send request with retry settings
    bag.request('get', 'http://somehost', {
        retry: {
          errorCodes: true, // retry on any error
          statusCodes: [404, 503], // retry when response status code is 404 or 503
          scale: 0.5, // increase delay by half on each retry
          delay: 1000, // wait 1 second before retrying
          maxRetries: 10 // only retry 10 times at most
        }
      },
      function (err, result) {
      });

    // send request with custom proxy
    bag.request('get', 'http://somehost', {
        proxy: 'http://user:pass@someproxy:1234'
      },
      function (err, result) {
      });

Proxy:

    // get proxy based on URL protocol
    // will return undefined when host is localhost or 127.0.0.1
    var proxy = bag.proxy('https://somehost');

    // get proxy with custom proxy exclusion
    var proxy = bag.proxy('http://somelocalhost', {
      noProxyHosts: ['somelocalhost']
    });

Colophon
--------

[Developer's Guide](http://cliffano.github.io/developers_guide.html#nodejs)

Build reports:

* [Code complexity report](http://cliffano.github.io/bagofrequest/complexity/plato/index.html)
* [Unit tests report](http://cliffano.github.io/bagofrequest/test/buster.out)
* [Test coverage report](http://cliffano.github.io/bagofrequest/coverage/buster-istanbul/lcov-report/lib/index.html)
* [Integration tests report](http://cliffano.github.io/bagofrequest/test-integration/buster.out)
* [API Documentation](http://cliffano.github.io/bagofrequest/doc/dox-foundation/index.html)
