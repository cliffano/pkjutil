var request = require('request'),
  _url = require('url'),
  async = require('async');

/**
 * Sends a HTTP request to a specified URL with optional proxy, query strings, and handlers.
 * Convenient handling of request error and unexpected status code.
 * GET redirection is handled by default by request module.
 * Non-GET redirection is handled by params followAllRedirects: true.
 *
 * @param {String} method: http method
 * @param {String} url: URL without query string
 * @param {Object} opts: optional
 *   - proxy: proxy server URL with format http://user:pass@host:port
 *   - noProxyHosts: an array of host names which will ignore any proxy settings, defaults to: localhost, 127.0.0.1
 *   - queryStrings: object containing URL query strings with format { name: value }
 *   - handlers: response handlers with format { error: function(err, result, cb), statuscode: function(result, cb) }
 *   - headers: object containing http headers, exact map to mikeal/request headers opt
 *   - body, form, json, multipart, agentOptions: request payload, exact map to mikeal/request module body, form, json, multipart, agentOptions opts
 *   - retry: request retry configuration, false for disabled, true for sensible defaults, otherwise
 *            { errorCodes: ['ENOTFOUND'] || true/false, statusCodes: [ 503 ], scale: 0.5, delay: 1000, maxRetries: 10 }
 *   - timeout: request timeout in milliseconds, default to 30000 milliseconds
 *   - requestOpts: mikeal/request module opts, these opts will override any params set by http#req
 * @param {Function} cb: standard cb(err, result) callback
 */
function req(method, url, opts, cb) {
  opts.handlers = opts.handlers || {};
  opts.retry = opts.retry || false;

  const TIMEOUT = 30000;
  // init default settings with follow redirections on all methods, and 30 seconds timeout
  var params = {
      url: url,
      followAllRedirects: true,
      rejectUnauthorized: false,
      timeout: opts.timeout || TIMEOUT
    },
    envProxy = proxy(url);

  // set proxy setting based on environment variable
  if (!_proxyIgnored(url, opts)) {
    if (opts.proxy) {
      params.proxy = opts.proxy;
    } else if (envProxy) {
      params.proxy = envProxy;
    }
  }

  // just a more readable opt name for query strings
  if (opts.queryStrings) {
    params.qs = opts.queryStrings;
  }

  // headers and payload handling
  ['headers', 'body', 'form', 'json', 'multipart','agentOptions'].forEach(function (opt) {
    if (opts[opt]) {
      params[opt] = opts[opt];
    }
  });

  // override defaults with mikeal/request-specific opts
  if (opts.requestOpts) {
    Object.keys(opts.requestOpts).forEach(function (opt) {
      params[opt] = opts.requestOpts[opt];
    });
  }

  function _requestMethod(method) {
    var requestMethod = method.toLowerCase();
    if (requestMethod === 'delete') {
      requestMethod = 'del';
    }
    return requestMethod;
  }

  _execRequest(opts, _requestMethod(method), params, function (err, result) {
    if (err) {
      if (opts.handlers.error) {
        opts.handlers.error(err, result, cb);
      } else {
        cb(err);
      }
    } else {
      var wildcardMatch = _wildcardMatch(result.statusCode, Object.keys(opts.handlers));
      if (opts.handlers[result.statusCode]) {
        opts.handlers[result.statusCode](result, cb);
      } else if (wildcardMatch) {
        opts.handlers[wildcardMatch](result, cb);
      } else {
        cb(new Error('Unexpected status code: ' + result.statusCode + '\nResponse body:\n' + result.body));
      }
    }
  });
}

function _execRequest(opts, method, params, cb) {
  const DEFAULTS = {
    errorCodes: [ 'ECONNABORTED', 'ECONNREFUSED', 'ECONNRESET', 'EHOSTUNREACH', 'EIO', 'ENETDOWN', 'ENETRESET', 'ENETUNREACH', 'ETIMEDOUT' ],
    statusCodes: [ 408, 502, 503, 504 ],
    scale: 0.5,
    delay: 500,
    maxRetries: 10
  };

  var tryCount = 0,
    currDelay, lastResult, retryable,
    retryOpts = (opts.retry === true) ?
      DEFAULTS :
      {
        errorCodes: opts.retry.errorCodes || DEFAULTS.errorCodes,
        statusCodes: opts.retry.statusCodes || DEFAULTS.statusCodes,
        scale: (opts.retry.scale !== undefined) ? opts.retry.scale : DEFAULTS.scale,
        delay: (opts.retry.delay !== undefined) ? opts.retry.delay : DEFAULTS.delay,
        maxRetries: (opts.retry.maxRetries !== undefined) ? opts.retry.maxRetries : DEFAULTS.maxRetries
      };

  currDelay = retryOpts.delay;

  function does(cb) {
    request[method](params, function (err, result) {

      var retryableError = err && (retryOpts.errorCodes === true || (Array.isArray(retryOpts.errorCodes) && retryOpts.errorCodes.indexOf(err.code) !== -1)),
        retryableResult = result && _wildcardMatch(result.statusCode, retryOpts.statusCodes) !== undefined;

      tryCount++;
      lastResult = result;

      retryable = opts.retry && tryCount <= retryOpts.maxRetries && (retryableError || retryableResult);

      if (retryable) {
        setTimeout(cb, currDelay); // retry after delay
        currDelay += currDelay * retryOpts.scale;
      } else {
        cb(err); // no retry needed, finish off
      }
    });
  }

  function check() {
    return retryable;
  }

  function done(err) {
    var result = lastResult || {};
    result._retry = {
      retryCount: tryCount - 1,
      retryLimitHit: (tryCount - 1 === retryOpts.maxRetries)
    };
    cb(err, result);
  }

  async.doWhilst(does, check, done);
}

// check for any wildcard match (e.g. 201 matches 2xx)
function _wildcardMatch(statusCode, wildcards) {
  var match;
  wildcards.forEach(function (wildcard) {
    var regex = new RegExp(wildcard.toString().replace(/x/g, '.'));
    if (!match && statusCode.toString().match(regex)) {
      match = wildcard;
    }
  });
  return match;
}

/**
 * Determines proxy value based on URL and process environment variable (http_proxy, https_proxy).
 * This allows library clients to control which proxy to use by setting environment variable.
 * - if url starts with http, use http_proxy when available
 * - if url starts with https, use https_proxy when available, otherwise fallback to http_proxy
 * - if url does not have protocol, assume http protocol
 * - if url is not specified, http_proxy takes precedence over https_proxy
 *
 * @param {String} url: URL used to determine which proxy environment variable to use
 * @param {Object} opts: optional
 *   - noProxyHosts: an array of host names which will ignore any proxy settings, defaults to: localhost, 127.0.0.1
 * @return proxy
 */
function proxy(url, opts) {
  opts = opts || {};

  var _proxy;

  if (!url) {
    _proxy = process.env.http_proxy || process.env.HTTP_PROXY || process.env.https_proxy || process.env.HTTPS_PROXY;
  } else if (!_proxyIgnored(url, opts)) {
    if (!url.match(/^https?:\/\//)) {
      url += 'http://' + url;
    }

    if (url.match(/^https:\/\//)) {
      _proxy = process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY;
    } else {
      _proxy = process.env.http_proxy || process.env.HTTP_PROXY;
    }
  }

  return _proxy;
}

function _proxyIgnored(url, opts) {
  const NO_PROXY_HOSTS = ['localhost', '127.0.0.1'];
  var noProxyHosts = [];
  if (process.env.no_proxy) {
    noProxyHosts = noProxyHosts.concat(process.env.no_proxy.split(','));
  }
  if (process.env.NO_PROXY) {
    noProxyHosts = noProxyHosts.concat(process.env.NO_PROXY.split(','));
  }
  noProxyHosts = noProxyHosts.concat(NO_PROXY_HOSTS);
  return (opts.noProxyHosts || noProxyHosts).indexOf(_url.parse(url).hostname) !== -1;
}

exports.request = req;
exports.proxy = proxy;
