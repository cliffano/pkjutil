<!-- BEGIN:AVATAR -->
![Avatar](avatar.jpg)
<!-- END:AVATAR -->

<!-- BEGIN:BADGES -->
[![Build Status](https://github.com/cliffano/bagofcli/workflows/CI/badge.svg)](https://github.com/cliffano/bagofcli/actions?query=workflow%3ACI)
[![Dependencies Status](https://img.shields.io/librariesio/release/npm/bagofcli)](https://libraries.io/npm/bagofcli)
[![Code Scanning Status](https://github.com/cliffano/bagofcli/workflows/CodeQL/badge.svg)](https://github.com/cliffano/bagofcli/actions?query=workflow%3ACodeQL)
[![Coverage Status](https://coveralls.io/repos/github/cliffano/bagofcli/badge.svg?branch=main)](https://coveralls.io/r/cliffano/bagofcli?branch=main)
[![Security Status](https://snyk.io/test/github/cliffano/bagofcli/badge.svg)](https://snyk.io/test/github/cliffano/bagofcli)
[![Published Version](https://img.shields.io/npm/v/bagofcli.svg)](https://www.npmjs.com/package/bagofcli)
<!-- END:BADGES -->

# Bag Of CLI

Bag Of CLI contains utility CLI functions.

Define a commands JSON file containing CLI commands with descriptions, arguments, options, example usages. Bag of CLI essentially hooks up each command to a function, and passing the options and arguments to the function.

By default, the command also gets `--help` and `--version` flags.

## Installation

```shell
npm install bagofcli
```

or as a dependency in package.json file:

```json
"dependencies": {
  "bagofcli": "x.y.z"
}
```

## Usage

Commands:

```javascript
// create conf/commands.json file containing commands configuration

{
  "options": [
    { "arg": "-f, --file <file>", "desc": "This is a global option, applicable to all commands." }
  ],
  "commands": {
    "command1": {
      "desc": "This is the first command",
      "options": [
        { "arg": "-r, --registry <registry>", "desc": "This is a command option, applicable only to command1"}
      ],
      "examples": [
        "<bin> command1 --registry someregistry"
      ]
    },
    "command2": {
      "desc": "This is the second command",
      "options": [
        { "arg": "-d, --debug", "desc": "This is a command option, applicable only to command2"}
      ],
      "examples": [
        "<bin> command2 --debug"
      ]
    }
  }
}

// setup command handlers

var bag = require('bagofcli');

var actions = {
  commands: {
    command1: {
      action: function (args) {
        // command option
        console.log(args.registry);
        // global option
        console.log(args.file);
      }
    },
    command2: {
      action: function (args) {
        console.log(args.debug);
      }
    }
  }
};

bag.command(__dirname, actions);
```

Check out [lib/bagofcli.js](https://github.com/cliffano/bagofcli/blob/master/lib/bagofcli.js) for more utility functions.

## Upgrade

### From 0.0.x to 0.1.x

Update commands.json argument validation rules:

* `notEmpty` to `required`
* `isNumeric` to `number`
* `isEmail` to `email`

Argument/option validation rules are backed by [validator](https://www.npmjs.com/package/validator). Available rule names:
`required`, `empty`, `blank`, `string`, `number`, `int`, `decimal`, `boolean`, `email`, `alphaNumeric`, `anArray`, `date`, `ip`, `cc`, `phone`, `postal`, `ssn`.

### From 0.0.x to 3.1.0+

Raw Commander Command object with a .parent property has been replaced by a plain object with .args directly.

This means the old convention like `command.parent.args[1]` is now undefined.

Argument retrieval should be updated:

* `command.parent.args[1]` to `command.args[0]`
* `command.parent.args[2]` to `command.args[1]`

Mock command for testing should also be updated:

From:

```javascript
const command = {
  parent: {
    args: ["mycommand", "arg1", "arg2"]
  }
}
actions.commands.mycommand.action(command);
```

To:

```javascript
const command = {
  args: ["arg1", "arg2"]
}
actions.commands.mycommand.action(command);
```

### From 0.0.x to 3.2.0+

Global options (the ones declared at the top level of commands.json) are now passed to the action handler as direct properties, alongside the command's own options.

This means the old convention like `command.parent.myopt`, and the 3.1.x convention of importing Commander to call `program.opts().myopt`, are no longer needed.

Global option retrieval should be updated:

* `command.parent.myopt` to `command.myopt`
* `program.opts().myopt` to `command.myopt`

From (before 3.1.0):

```javascript
const actions = {
  commands: {
    mycommand: {
      action: function (command) {
        console.log(command.parent.myopt);
      }
    }
  }
};
```

From (3.1.x):

```javascript
import { program } from "commander";

const actions = {
  commands: {
    mycommand: {
      action: function (command) {
        console.log(program.opts().myopt);
      }
    }
  }
};
```

To:

```javascript
const actions = {
  commands: {
    mycommand: {
      action: function (command) {
        console.log(command.myopt);
      }
    }
  }
};
```

When a global option and a command option share the same name, the global option value takes precedence.

Mock command for testing should also be updated:

From:

```javascript
const command = {
  parent: {
    myopt: "somevalue"
  }
}
actions.commands.mycommand.action(command);
```

To:

```javascript
const command = {
  myopt: "somevalue"
}
actions.commands.mycommand.action(command);
```

## Colophon

<!-- BEGIN:DEVELOPERS_GUIDE -->
[Developer's Guide](https:/cliffano.github.io/developers-guide-nodejs.html)
<!-- END:DEVELOPERS_GUIDE -->

<!-- BEGIN:BUILD_REPORTS -->
Build reports:

* [Code complexity report](https://cliffano.github.io/bagofcli/complexity/plato/index.html)
* [Unit tests report](https://cliffano.github.io/bagofcli/test/mocha.txt)
* [Test coverage report](https://cliffano.github.io/bagofcli/coverage/c8/index.html)
* [Integration tests report](https://cliffano.github.io/bagofcli/test-integration/mocha.txt)
* [API Documentation](https://cliffano.github.io/bagofcli/doc/jsdoc/index.html)

<!-- END:BUILD_REPORTS -->
