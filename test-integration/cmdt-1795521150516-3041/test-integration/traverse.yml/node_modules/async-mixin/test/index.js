var test = require('tape')
var asyncMixin = require('../')

test('adds async methods', function (t) {
  t.plan(3)
  var result = asyncMixin({items: []}, 'items')
  t.ok(result.map)
  t.ok(result.reduce)
  t.ok(result.mapSeries)
})

test('adds only certain methods', function (t) {
  t.plan(3)
  var result = asyncMixin({items: []}, 'items', ['map'])
  t.ok(result.map)
  t.ok(!result.reduce)
  t.ok(!result.mapSeries)
})

test('allows existing properties through', function (t) {
  t.plan(1)
  var target = {items: []}
  t.strictEqual(target.items, asyncMixin(target, 'items').items)
})

test('does not modify original object', function (t) {
  t.plan(1)
  var target = {items: []}
  asyncMixin(target, 'items')
  t.strictEqual(target.map, undefined)
})

test('async methods work', function (t) {
  t.plan(2)
  var target = {
    items: [1, 2, 3, 4, 5]
  }
  asyncMixin(target, 'items').map(function (item, next) {
    next(null, item)
  }, function (err, items) {
    t.ifError(err)
    t.deepEqual(items, target.items)
  })
})

test('can create useful prototype objects', function (t) {
  t.plan(2)
  var Container = function () {
    this.items = [1, 2, 3, 4, 5]
  }
  Container.prototype = asyncMixin('items')
  var container = new Container()
  container.map(function (item, next) {
    next(null, item)
  }, function (err, items) {
    t.ifError(err)
    t.deepEqual(items, container.items)
  })
})

test('can create useful prototype objects with only certain methods', function (t) {
  t.plan(3)
  var Container = function () {
    this.items = [1, 2, 3, 4, 5]
  }
  Container.prototype = asyncMixin('items', ['map'])
  var container = new Container()
  t.ok(container.map)
  t.ok(!container.reduce)
  t.ok(!container.mapSeries)
})

test('can create useful objects from arrays directly', function (t) {
  t.plan(2)
  var targetItems = [1, 2, 3, 4, 5]
  var wrapper = asyncMixin(targetItems)
  wrapper.map(function (item, next) {
    next(null, item)
  }, function (err, items) {
    t.ifError(err)
    t.deepEqual(items, targetItems)
  })
})

test('can create useful objects from arrays directly with only certain methods', function (t) {
  t.plan(3)
  var targetItems = [1, 2, 3, 4, 5]
  var wrapper = asyncMixin(targetItems, ['map'])
  t.ok(wrapper.map)
  t.ok(!wrapper.reduce)
  t.ok(!wrapper.mapSeries)
})
