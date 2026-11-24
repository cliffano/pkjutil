# async-mixin

### [caolin/async](https://github.com/caolan/async) collection methods as a mixin.

[![Build Status](https://travis-ci.org/timoxley/async-mixin.png?branch=master)](https://travis-ci.org/timoxley/async-mixin)

## Installation

```
npm install async-mixin
```

## Usage

### Wrap a collection within an object

```js
var asyncMixin = require('async-mixin')

var admins = {
  userIds: [1,2,3,4,5]
}

// pass target object + path to the array you want to
// enumerate over asynchronously
var adminApi = asyncMixin(admins, 'userIds')

// adminApi has all of the async collection methods:
Object.keys(adminApi) // each, eachSeries, eachLimit, map, ...etc

// async methods work just like caolin/async's methods,
// except they're automatically bound to admins' 'userIds' property
adminApi.map(function(userId, next) {
  // pretend this is how we load a user
  db.load(userId, next)
}, function(err, users) {
  // users is an array of results from our async operation db.load!
})

```

### Optionally only include particular async methods

```js
var admins = {
  userIds: [1,2,3,4,5]
}

var adminApi = asyncMixin(admins, 'userIds', ['map', 'filter'])

Object.keys(adminApi) // ['map', 'filter']

adminApi.map // => [Function]
adminApi.filter // => [Function]
adminApi.reduce // => undefined

```

### Wrap Arrays directly

```js
var items = [1,2,3,4,5]

var container = asyncMixin(items)

// container now has all of async's methods
// bound automatically to the passed-in items:
container.map(function(item, next) {
  return next(null, item * 2)
}, function(err, result) {
  console.log(result) // => [2, 4, 6, 8, 10]
})
```

### Create handy prototype objects

```js
function UserCollection(users) {
  this.users = users
}

UserCollection.prototype = asyncMixin('users')

UserCollection.prototype.save = function save(done) {
  // pretend db.save is some async operation that saves users
  this.forEach(db.save, done)
}

UserCollection.prototype.loadProfiles = function loadProfiles(done) {
  // pretend db.loadProfile is some async operation that loads user profiles
  this.map(db.loadProfile, done)
}

var users = new UserCollection([{name: 'Bill'}, {name: 'Bob'}])

users.loadProfiles(function(err, profiles) {
  // profies will be an array of results from db.loadProfile
})

users.save(function(err) {
  // if there was an error saving any user,
  // err will contain that error
})

```


### Mixin Methods

* concat
* concatSeries
* detect
* detectLimit
* detectSeries
* each
* eachLimit
* eachOf
* eachOfLimit
* eachOfSeries
* eachSeries
* every
* everyLimit
* everySeries
* filter
* filterLimit
* filterSeries
* map
* mapLimit
* mapSeries
* mapValues
* mapValuesLimit
* mapValuesSeries
* reduce
* reduceRight
* reject
* rejectLimit
* rejectSeries
* some
* someLimit
* someSeries
* sortBy
* transform

### Safety

`async-mixin` does not modify your original object, it simply returns a new
object that inherits from your original object, while adding async methods:

```js
var admins = {
  userIds: [1,2,3,4,5]
}

var adminApi = asyncMixin(admins, 'userIds')

adminApi.map // => [Function]
admins.map //  => undefined

```

## Inspiration

Similar idea to [component/enumerable](https://github.com/component/enumerable), but our enumeration methods are asynchronous.

## Licence

MIT
