# prod

### Asynchronous node module dependency tree walking framework.

[![Build Status](https://travis-ci.org/timoxley/prod.png?branch=master)](https://travis-ci.org/timoxley/prod)

Easily perform a kitchen sink of asynchronous operations on each item in a module's dependency tree.

## Example

Put individual names and versions of all dependencies in some db by walking over the tree using an async `.map`:

```js
var prod = require('prod')
var moduleRoot = path.dirname(require.resolve('tape'))

prod(moduleRoot).map(function (dep, next) {
  db.put(dep.name + '@' + dep.version, next)
}, function(err, deps) {
  if (err) throw err
  console.log(deps)
  // => [
  // 'tape@2.0.0',
  // 'jsonify@0.0.0',
  // 'deep-equal@0.1.0',
  // 'defined@0.0.0',
  // 'through@2.3.4'
  // ]
  })
})

```

## API

```js

// pass any module's root directory to walk over it and it's dependencies
var tapeDependencies = prod(path.dirname(require.resolve('tape')))

var myDependencies = prod() // defaults to process.cwd()

Object.keys(myDependencies) // => // each, eachSeries, eachLimit, map, ...etc.
// See below.
```

`prod` uses [timoxley/async-mixin](https://github.com/timoxley/async-mixin), so you automatically have access to the following
methods from [caolin/async](https://github.com/caolan/async) while iterating over your dependency tree:

* each
* eachSeries
* eachLimit
* map
* mapSeries
* mapLimit
* filter
* filterSeries
* reject
* rejectSeries
* reduce
* reduceRight
* detect
* detectSeries
* sortBy
* some
* every
* concat
* concatSeries

If you don't want any of this async magic, you can simply initialize
prod with .load and use regular Array operations on its `.dependencies`

```js
var myDependencies = prod().load(function(err, dependencies) {
  if (err) throw err

  console.log(dependencies === myDependencies.dependencies) // => true

  // regular ES5 Array methods
  dependencies.map(function(dep) {
    return dep.name
  })
})

```

Alternatively, you could try using [read-installed](https://github.com/isaacs/read-installed)
with [traverse](https://github.com/substack/js-traverse)

## License

MIT
