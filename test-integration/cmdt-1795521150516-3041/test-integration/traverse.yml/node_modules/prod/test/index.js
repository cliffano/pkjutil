var test = require('tape')
var path = require('path')

var prod = require('../')

var FIXTURE_DIR = path.join(__dirname, 'fixture')

test('collects results with .map', function (t) {
  t.plan(2)
  prod(FIXTURE_DIR).map(function (dep, next) {
    next(null, dep.name) // assume the rest of the data is there I guess
  }, function (err, deps) {
    t.ifError(err)
    t.deepEqual([
      'test-fixture',
      'tape',
      'jsonify',
      'deep-equal',
      'defined',
      'through' ], deps)
  })
})

test('defaults to process.cwd()', function (t) {
  t.plan(2)
  prod().map(function (dep, next) {
    next(null, dep.name)
  }, function (err, deps) {
    t.ifError(err)
    t.strictEqual(deps[0], 'prod')
  })
})

test('can load deps', function (t) {
  t.plan(2)
  prod(FIXTURE_DIR).load(function (err, deps) {
    t.ifError(err)
    t.strictEqual(deps[0].name, 'test-fixture')
  })
})
