"use strict";
import _ from "lodash";
import async from "async";
import chalk from "chalk";
import child from "child_process";
import {
  program as commander,
  Help,
  InvalidArgumentError,
  Option,
} from "commander";
import fs from "fs";
import p from "path";
import inquirer from "inquirer";
import util from "util";
import v from "validator";
import yaml from "yaml-js";

/**
 * A bag of utility functions for building command-line tools:
 * command and option parsing backed by [commander](https://www.npmjs.com/package/commander),
 * child process execution, process exit handling, file and configuration lookup,
 * and coloured console logging.
 *
 * @module bagofcli
 * @example
 * import bag from "bagofcli";
 *
 * const actions = {
 *   commands: {
 *     hello: {
 *       action: function (command) {
 *         console.log("Hello %s", command.args[0]);
 *       },
 *     },
 *   },
 * };
 * bag.command(import.meta.dirname, actions);
 */

/**
 * @import {
 *   Actions as ActionsType,
 *   CommandArg as CommandArgType,
 *   ExecAndCollectCallback,
 *   ExecCallback,
 *   ExitCallback,
 *   ExitError,
 *   ExitErrorCallback,
 *   ExitSuccessCallback,
 *   LookupConfigCallback,
 *   SpawnCallback,
 * } from "./types.js"
 */

/**
 * Object passed to a command action handler, with these properties:
 * - `args` (`Array<string>`): positional arguments, in the order they were passed in
 * - `name` (`Function`): function that returns the name of the invoked command
 *
 * Besides those, every parsed option is available as a
 * direct property keyed by the option's long flag in camel case
 * (e.g. `--some-opt <value>` is available as `someOpt`).
 * This covers both the command's own options and the global options.
 * When a global option and a command option share the same name,
 * the global option value takes precedence.
 *
 * The TypeScript type is defined in types.d.ts.
 *
 * @typedef {CommandArgType} CommandArg
 */

/**
 * Action handlers for commands in the form
 * `{ commands: { <command>: { action: function (command) {} } } }`.
 * The command name is mapped to the command name specified in the command file.
 * Each action handler is called with a {@link module:bagofcli~CommandArg}.
 *
 * The TypeScript type is defined in types.d.ts.
 *
 * @typedef {ActionsType} Actions
 */

/**
 * Parse command line arguments and execute actions based on the specified commands.
 * Uses commander to provide `-V` / `--version` flags to display the version number,
 * and `-h` / `--help` flags to display the help info.
 *
 * Commands, their positional arguments, and the global and command options
 * are declared in the command file, while `actions` provides the action handler
 * of each command.
 *
 * A command without declared args accepts any positional arguments by default,
 * a command declared with `allowExcessArguments: false` rejects unexpected ones while parsing,
 * before the action handler is called, and the process exits with status code 1.
 *
 * An option declared with `choices` only accepts one of the listed values,
 * commander rejects any other value while parsing, before the action handler is called,
 * and the process exits with status code 1.
 * Likewise, an option declared with `min`, `max`, or `integer` only accepts a number
 * (or an integer when `integer` is true) within the inclusive range.
 *
 * Arguments and options are validated against the rules declared in the command file
 * before the action handler is called, the process exits with status code 1
 * without calling the action handler when any of them is invalid.
 *
 * @alias module:bagofcli.command
 * @param {string} base Base directory where the client module is located.
 * Used as the base directory to locate the command file and the package.json file,
 * which is expected to be at `../package.json` relative to `base`.
 * Ideally this is the directory of the client's module, e.g. `lib`.
 * @param {Actions} [actions] Action handlers for commands, see {@link module:bagofcli~Actions}.
 * @param {Object} [opts] Optional settings.
 * @param {string} [opts.commandFile='../conf/commands.json'] Relative path to the command file from `base`.
 * @returns {void}
 * @example
 * // conf/commands.json
 * // {
 * //   "options": [
 * //     { "arg": "-f, --file <file>", "desc": "A global option" }
 * //   ],
 * //   "commands": {
 * //     "greet": {
 * //       "desc": "Greet someone",
 * //       "args": [{ "name": "name", "rules": ["required"] }],
 * //       "options": [{ "arg": "-s, --shout", "desc": "A command option" }]
 * //     }
 * //   }
 * // }
 * bag.command(import.meta.dirname, {
 *   commands: {
 *     greet: {
 *       action: function (command) {
 *         // command.args[0] is the name positional argument
 *         // command.shout is the command option
 *         // command.file is the global option
 *       },
 *     },
 *   },
 * });
 */
function command(base, actions, opts) {
  actions = actions || {};
  opts = opts || {};
  // commander keeps registered subcommands across invocations on program singleton,
  // so clear command list before registering command definitions for this invocation.
  commander.commands = [];

  const commands = JSON.parse(
      fs.readFileSync(
        p.join(base, opts.commandFile || "../conf/commands.json"),
      ),
    ),
    pkg = JSON.parse(fs.readFileSync(p.join(base, "../package.json")));

  if (actions.commands && commands.commands) {
    _.each(actions.commands, function (command, name) {
      if (commands.commands[name]) {
        commands.commands[name].action = command.action;
      }
    });
  }

  commander.version(pkg.version);
  // subcommands inherit the help configuration when they're created,
  // so this has to be configured before registering the commands
  commander.configureHelp({ optionDescription: _optionDescription });

  if (commands.options) {
    _.each(commands.options, function (option) {
      _addOption(commander, option);
    });
  }

  // whether _postCommand validation has already been run by an action handler
  let isValidated = false;

  _.each(commands.commands, function (command, name) {
    const allowExcessArguments = command.allowExcessArguments !== false,
      program = commander
        .command(name)
        .description(command.desc)
        .allowExcessArguments(allowExcessArguments);

    // commander counts excess arguments against its registered arguments,
    // so register the declared args, otherwise every positional argument would be excess.
    // They're registered as optional, so a missing mandatory argument
    // is still reported with the usage message by _postCommand.
    if (!allowExcessArguments) {
      _.each(command.args, function (arg) {
        program.argument(util.format("[%s]", arg.name));
      });
    }

    _.each(command.options, function (option) {
      _addOption(program, option);
    });

    if (command.action) {
      program.action(function (...args) {
        const commandArg = this;
        // Validate arguments and options before calling the action handler,
        // so that the action handler isn't called when any of them is invalid.
        // commander.args and the subcommand's .args are already populated by
        // the time commander calls the action.
        _postCommand(commander, commands.commands, commands.options);
        isValidated = true;
        // Pass a plain object with parsed options as direct properties (so flags
        // aren't silently ignored, see issue #20), while still carrying over
        // .args (positional arguments) and .name() from the Command instance,
        // since bagofcli commands don't register positional args with commander -
        // args and name() are otherwise only reachable there.
        // Global options are included alongside the command's own options, so
        // that action handlers don't have to reach for the commander program.
        command.action(
          Object.assign(commandArg.optsWithGlobals(), {
            args: commandArg.args,
            name: () => commandArg.name(),
          }),
        );
      });
    }
  });

  _preCommand(commands.commands);

  commander.parse(process.argv);

  // Validate when no action handler was called, e.g. no command was specified,
  // or the command doesn't have any action handler.
  // NOTE: commander.args is populated by commander#parse,
  // hence _postCommand relies on commander#parse finishing without exiting or throwing error,
  // otherwise _postCommand won't be executed
  if (!isValidated) {
    _postCommand(commander, commands.commands, commands.options);
  }
}

/**
 * Register an option, as configured in the command file, on a commander program.
 *
 * An option without `choices`, `min`, `max`, or `integer` is registered via commander's option(),
 * with `action` passed through as either the argument parser function or the default value.
 * Otherwise the option is registered via addOption() using commander's Option,
 * which rejects an invalid value while parsing (only when the option is supplied):
 * - `choices` rejects a value that isn't one of the choices, and lists the choices in the help output
 * - `min`, `max`, and `integer` reject a value that isn't a number (or an integer when `integer` is true),
 *   or is outside the inclusive range, the value is passed on unchanged as a string
 *
 * @param {Object} program Commander program or command to register the option on.
 * @param {Object} option Option configuration with `arg`, `desc`, and optional `action`,
 * `choices`, `min`, `max`, and `integer`.
 * @returns {void}
 * @private
 */
function _addOption(program, option) {
  const hasRange =
    option.min !== undefined ||
    option.max !== undefined ||
    option.integer === true;

  if (!option.choices && !hasRange) {
    program.option(option.arg, option.desc, option.action);
    return;
  }

  const commanderOption = new Option(option.arg, option.desc);
  if (option.choices) {
    commanderOption.choices(option.choices);
  }
  if (typeof option.action !== "function") {
    commanderOption.default(option.action);
  }

  if (hasRange) {
    commanderOption.rangeDescription = _rangeDescription(option);
  }

  if (hasRange || typeof option.action === "function") {
    // choices() sets its own argument parser to check the value,
    // so check the value against the choices before the range,
    // then pass the value to action
    const choicesParser = commanderOption.parseArg;
    const name = commanderOption.long || commanderOption.short;
    commanderOption.argParser(function (value, previous) {
      let result = choicesParser ? choicesParser(value, previous) : value;
      if (hasRange) {
        _checkRange(value, name, option);
      }
      if (typeof option.action === "function") {
        result = option.action(value, previous);
      }
      return result;
    });
  }
  program.addOption(commanderOption);
}

/**
 * Describe an option's numeric range for the help output,
 * e.g. `integer, range: 0 to 65535`, `min: 0`, or `max: 10`.
 *
 * @param {Object} option Option configuration with optional `min`, `max`, and `integer`.
 * @returns {string} Range description.
 * @private
 */
function _rangeDescription(option) {
  const info = [];
  if (option.integer === true) {
    info.push("integer");
  }
  if (option.min !== undefined && option.max !== undefined) {
    info.push(util.format("range: %s to %s", option.min, option.max));
  } else if (option.min !== undefined) {
    info.push(util.format("min: %s", option.min));
  } else if (option.max !== undefined) {
    info.push(util.format("max: %s", option.max));
  }
  return info.join(", ");
}

/**
 * Help configuration override for commander's option description,
 * which adds the option's range description (if any) to commander's
 * extra info, e.g. `Port number (integer, range: 0 to 65535, default: "8080")`.
 *
 * @param {Object} option Commander Option.
 * @returns {string} Option description for the help output.
 * @this {Help}
 * @private
 */
function _optionDescription(option) {
  if (!option.rangeDescription) {
    return Help.prototype.optionDescription.call(this, option);
  }
  // describe the option without its description to get only commander's
  // extra info, e.g. `(choices: "1", "5", default: "1")`, or an empty string
  const extraDescription = Help.prototype.optionDescription.call(
      this,
      Object.assign(Object.create(option), { description: "" }),
    ),
    extraInfo = [option.rangeDescription];
  if (extraDescription) {
    extraInfo.push(extraDescription.slice(1, -1));
  }
  const rangeDescription = util.format("(%s)", extraInfo.join(", "));
  return option.description
    ? util.format("%s %s", option.description, rangeDescription)
    : rangeDescription;
}

/**
 * Check that an option value is a number (or an integer when `integer` is true)
 * within the inclusive range between `min` and `max`, either of which is optional.
 *
 * @param {string} value Option value to check.
 * @param {string} name Option flag, used in the error message.
 * @param {Object} option Option configuration with optional `min`, `max`, and `integer`.
 * @returns {void}
 * @throws {InvalidArgumentError} When the value is not a number, not an integer, or out of range.
 * @private
 */
function _checkRange(value, name, option) {
  const str = _toStr(value),
    isNumber = option.integer === true ? v.isInt(str) : v.isNumeric(str),
    number = Number(str);

  if (
    !isNumber ||
    (option.min !== undefined && number < option.min) ||
    (option.max !== undefined && number > option.max)
  ) {
    let expected = option.integer === true ? "an integer" : "a number";
    if (option.min !== undefined && option.max !== undefined) {
      expected += util.format(" between %s and %s", option.min, option.max);
    } else if (option.min !== undefined) {
      expected += util.format(" greater than or equal to %s", option.min);
    } else if (option.max !== undefined) {
      expected += util.format(" less than or equal to %s", option.max);
    }
    throw new InvalidArgumentError(
      util.format("%s must be %s.", name, expected),
    );
  }
}

/**
 * Pre-command tasks, to be run before commander parses the command line arguments.
 * Register a help handler that prints command examples after the default help output
 * when `--help` flag is specified.
 *
 * @param {Object} commands Command configuration map, keyed by command name.
 * @returns {void}
 * @private
 */
function _preCommand(commands) {
  commander.on("--help", function () {
    let hasExample = _.map(_.values(commands), "examples").filter((elem) => {
      return elem !== undefined;
    });
    if (hasExample.length > 0) {
      hasExample = hasExample.reduce((a, b) => {
        return a.concat(b);
      });
    }
    hasExample = hasExample.length > 0;

    if (hasExample) {
      console.log("  Examples:\n");

      Object.keys(commands).forEach((command) => {
        if (!_.isEmpty(commands[command].examples)) {
          console.log("    %s:", command);
          commands[command].examples.forEach((example) => {
            console.log("      %s", example);
          });
        }
      });
    }
  });
}

/**
 * Coerce a value to a string for validator (https://npmjs.com/package/validator),
 * which only operates on strings. Command line argument/option values are always
 * strings already, this just guards against undefined/null (e.g. a missing
 * optional argument).
 *
 * @param {*} value Value to coerce.
 * @returns {string} String form of value, or an empty string for undefined/null.
 * @private
 */
function _toStr(value) {
  return value === undefined || value === null ? "" : String(value);
}

/**
 * Argument/option validators, keyed by the rule name as referenced in a
 * commands.json `rules` array. Backed by validator rather than iz, which is
 * unmaintained - rule names are unchanged, so existing commands.json files
 * keep working as-is.
 *
 * Only rules callable with just the value being validated are supported here,
 * since commands.json's `rules` array has never had a way to pass extra
 * parameters (e.g. a length or pattern) through to a rule.
 *
 * @constant
 * @type {Object<string, Function>}
 * @private
 */
const validators = {
  required: (value) => !v.isEmpty(_toStr(value)),
  empty: (value) => v.isEmpty(_toStr(value)),
  blank: (value) => typeof value === "string" && v.isEmpty(value),
  string: (value) => typeof value === "string",
  number: (value) => v.isNumeric(_toStr(value)),
  int: (value) => v.isInt(_toStr(value)),
  // Unlike validator's own isDecimal (which also accepts whole numbers),
  // iz's decimal rule specifically required a fractional part - preserve that.
  decimal: (value) => v.isDecimal(_toStr(value)) && !v.isInt(_toStr(value)),
  boolean: (value) => typeof value === "boolean" || v.isBoolean(_toStr(value)),
  email: (value) => v.isEmail(_toStr(value)),
  alphaNumeric: (value) => v.isAlphanumeric(_toStr(value)),
  anArray: (value) => Array.isArray(value),
  date: (value) => v.isDate(_toStr(value)),
  ip: (value) => v.isIP(_toStr(value)),
  cc: (value) => v.isCreditCard(_toStr(value)),
  phone: (value) => v.isMobilePhone(_toStr(value), "en-US"),
  postal: (value) => v.isPostalCode(_toStr(value), "US"),
  ssn: (value) => {
    const digits = _toStr(value).replace(/[^0-9]/g, "");
    return v.isInt(digits) && digits.length === 9;
  },
};

/**
 * Post-command tasks, to be run after commander parses the command line arguments,
 * either right before the command's action handler is called,
 * or after parsing when no action handler is called.
 * Validate command arguments and options:
 * - if there's no command, return without validating anything
 * - if command is unknown, log an error message then exit
 * - if the number of arguments doesn't match the mandatory arguments, log the usage then exit
 * - if any argument or option doesn't satisfy its rules, log an error message then exit
 *
 * @param {Object} commanderArg Top-level commander program after parsing.
 * @param {Object} commandsConfig Command configuration map, keyed by command name.
 * @param {Array<Object>} [globalOptsConfig] Global option configuration list.
 * @returns {void}
 * @private
 */
function _postCommand(commanderArg, commandsConfig, globalOptsConfig) {
  const commanderArgs = commanderArg.args;

  /**
   * Create a function that validates a value against a rule,
   * which exits the process with an error when the value is invalid
   * or when the rule is not supported.
   *
   * @param {*} value Value to validate.
   * @param {string} name Argument name or option definition, used in the error message.
   * @param {string} desc Either `argument` or `option`, used in the error message.
   * @returns {Function} Function that validates the value against the specified rule name.
   * @private
   */
  function _validate(value, name, desc) {
    return function (rule) {
      if (Object.keys(validators).indexOf(rule) !== -1) {
        const isValid = validators[rule](value);
        if (isValid === null || isValid === false) {
          exit(
            new Error(
              util.format("Invalid %s: <%s> must be %s", desc, name, rule),
            ),
          );
        }
      } else {
        exit(new Error(util.format("Invalid %s rule: %s", desc, rule)));
      }
    };
  }

  /**
   * Resolve an option value from a commander command instance.
   *
   * The option value is looked up using the name of the value placeholder
   * in the option definition (e.g. `someOpt` in `-s, --some-opt <someOpt>`),
   * an option definition without any value placeholder resolves to undefined.
   *
   * Newer commander versions expose parsed values via opts(), while older behaviour
   * may expose values directly as command properties. This helper checks opts()
   * first, then falls back to direct property access for compatibility.
   *
   * @param {Object} commandArg Commander command instance.
   * @param {string} arg Option definition.
   * @returns {string|undefined} Parsed option value.
   * @private
   */
  function _getOptionValue(commandArg, arg) {
    const argMatch = arg.match(/<.*?>|\[.*?\]/);
    if (!argMatch) {
      return undefined;
    }
    const name = argMatch[0].replace(/[<>\[\]]/g, "");
    if (typeof commandArg.opts === "function") {
      const commandArgOpts = commandArg.opts();
      if (commandArgOpts && commandArgOpts[name] !== undefined) {
        return commandArgOpts[name];
      }
    }
    return commandArg[name];
  }

  if (!commanderArgs || commanderArgs.length === 0) {
    return;
  } else {
    const commandName = commanderArgs[0],
      // Prefer the actual invoked subcommand's own .args over slicing the
      // top-level commanderArgs: the top-level parse doesn't know about options
      // registered only on the subcommand, so unconsumed option tokens (and their
      // values) leak into commanderArgs and inflate the count, causing a false
      // "Usage: ..." error even though the subcommand parsed everything correctly.
      subCommand =
        Array.isArray(commanderArg.commands) &&
        commanderArg.commands.find(function (cmd) {
          const name = typeof cmd.name === "function" ? cmd.name() : cmd._name;
          return name === commandName;
        }),
      commandArgs = subCommand
        ? subCommand.args
        : commanderArgs.slice(1, commanderArgs.length),
      commandConfigArgs = commandsConfig[commandName]
        ? commandsConfig[commandName].args
        : undefined,
      commandConfigArgsMandatory = _.filter(commandConfigArgs, function (arg) {
        return !arg.optional;
      }),
      commandConfigOpts = commandsConfig[commandName]
        ? commandsConfig[commandName].options
        : undefined;

    // Unknown command error if the command name doesn't exist in the commands configuration
    if (Object.keys(commandsConfig).indexOf(commandName) === -1) {
      exit(
        new Error(
          util.format(
            "Unknown command: %s, use --help for more info",
            commandName,
          ),
        ),
      );
    } else if (commandConfigArgs && commandConfigArgs.length > 0) {
      const programName =
        typeof commanderArg.name === "function"
          ? commanderArg.name()
          : commanderArg._name;

      // display usage info when mandatory arguments don't exist
      // due to arguments being positional, then comparing the lengths is good enough
      if (commandConfigArgsMandatory.length !== commandArgs.length) {
        exit(
          new Error(
            util.format(
              "Usage: %s %s %s",
              programName,
              commandName,
              commandConfigArgs
                .map((arg) => {
                  return util.format(arg.optional ? "[%s]" : "<%s>", arg.name);
                })
                .join(" "),
            ),
          ),
        );
      } else {
        // validate arguments as configured in commands setup
        for (let i = 0, ln = commandConfigArgs.length; i < ln; i += 1) {
          if (!commandConfigArgs[i].optional) {
            commandConfigArgs[i].rules.forEach(
              _validate(commandArgs[i], commandConfigArgs[i].name, "argument"),
            );
          }
        }
      }
    }

    // validate command opts as configured in commands setup
    // command opts are parsed by the invoked subcommand, hence its values
    // have to be retrieved from the subcommand rather than the top-level commander
    if (commandConfigOpts) {
      commandConfigOpts.forEach((commandOpt) => {
        if (commandOpt.rules) {
          const name = commandOpt.arg,
            value = _getOptionValue(subCommand || commanderArg, name);
          commandOpt.rules.forEach(_validate(value, name, "option"));
        }
      });
    }

    // validate global opts as configured in commands setup
    // global opts are parsed by the top-level commander, which has no parent
    if (globalOptsConfig) {
      globalOptsConfig.forEach((globalOptConfig) => {
        if (globalOptConfig.rules) {
          const name = globalOptConfig.arg,
            value = _getOptionValue(commanderArg, name);
          globalOptConfig.rules.forEach(_validate(value, name, "option"));
        }
      });
    }
  }
}

/**
 * Execute a one-liner command.
 *
 * The output emitted on stderr and stdout of the child process will be written to process.stdout
 * and process.stderr of this process.
 *
 * Fallthrough is handy in situation where there are multiple execs running in sequence/parallel,
 * and they all have to be executed regardless of success/error on either one of them.
 *
 * @alias module:bagofcli.exec
 * @param {string} command Command to execute.
 * @param {boolean} fallthrough Allow error to be camouflaged as a non-error,
 * in which case the error is passed as the result.
 * @param {ExecCallback} cb Standard `cb(err, result)` callback.
 * @returns {void}
 */
function exec(command, fallthrough, cb) {
  execute(
    command,
    fallthrough,
    false,
    function (err, stdOutOuput, stdErrOuput, result) {
      // drop stdOutOuput and stdErrOuput parameters to keep exec backwards compatible.
      cb(err, result);
    },
  );
}

/**
 * Execute a one-liner command and collect the output.
 *
 * The output emitted on stderr and stdout of the child process will be
 * collected and passed on to the given callback.
 *
 * Fallthrough is handy in situation where there are multiple execs running in sequence/parallel,
 * and they all have to be executed regardless of success/error on either one of them.
 *
 * @alias module:bagofcli.execAndCollect
 * @param {string} command Command to execute.
 * @param {boolean} fallthrough Allow error to be camouflaged as a non-error,
 * in which case the error is passed as the result.
 * @param {ExecAndCollectCallback} cb `cb(err, stdOutOutput, stdErrOutput, result)` callback.
 * @returns {void}
 */
function execAndCollect(command, fallthrough, cb) {
  execute(command, fallthrough, true, cb);
}

/**
 * Execute a one-liner command.
 * This function is not exported, it backs {@link module:bagofcli.exec}
 * and {@link module:bagofcli.execAndCollect}.
 *
 * The output emitted on stderr and stdout of the child process will either be written to
 * process.stdout and process.stderr of this process or collected and passed on to the
 * given callback, depending on collectOutput.
 *
 * Fallthrough is handy in situation where there are multiple execs running in sequence/parallel,
 * and they all have to be executed regardless of success/error on either one of them.
 *
 * @param {string} command Command to execute.
 * @param {boolean} fallthrough Allow error to be camouflaged as a non-error.
 * @param {boolean} collectOutput Pass child output to the callback instead of writing it.
 * @param {ExecAndCollectCallback} cb `cb(err, stdOutOutput, stdErrOutput, result)` callback.
 * @returns {void}
 * @private
 */
function execute(command, fallthrough, collectOutput, cb) {
  let collectedStdOut = "";
  let collectedStdErr = "";

  const _exec = child.exec(command, function (err) {
    let result;
    if (err && fallthrough) {
      // camouflage error to allow other execs to keep running
      result = err;
      err = null;
    }
    cb(err, collectedStdOut, collectedStdErr, result);
  });

  _exec.stdout.on("data", function (data) {
    if (collectOutput) {
      collectedStdOut += data.toString().trim();
    } else {
      process.stdout.write(chalk.green(data.toString()));
    }
  });

  _exec.stderr.on("data", function (data) {
    if (collectOutput) {
      collectedStdErr += data.toString().trim();
    } else {
      process.stderr.write(chalk.red(data.toString()));
    }
  });
}

/**
 * Handle process exit based on the existence of error.
 * This is handy for command-line tools to use as the final callback.
 * Exit status code 1 indicates an error, exit status code 0 indicates a success.
 * Error message will be logged to the console.
 *
 * This function can be used as a standard `cb(err, result)` callback,
 * the result is not declared in the signature because it is not used,
 * the process simply exits with status code 0 when there is no error.
 *
 * @alias module:bagofcli.exit
 * @param {?ExitError} [err] Error object, its existence indicates the occurrence of an error,
 * a non-Error object is logged as JSON.
 * @returns {void}
 */
function exit(err) {
  if (err) {
    console.error(chalk.red(err.message || JSON.stringify(err)));
    process.exit(1);
  } else {
    process.exit(0);
  }
}

/**
 * A higher order function that returns a process exit callback,
 * with error and success callbacks to handle error and result accordingly.
 * Exit status code 1 indicates an error, exit status code 0 indicates a success.
 *
 * @alias module:bagofcli.exitCb
 * @template T
 * @param {ExitErrorCallback} [errorCb] Error callback in the form `errorCb(err)`,
 * defaults to logging the error message to console error.
 * @param {ExitSuccessCallback<T>} [successCb] Success callback in the form `successCb(result)`,
 * defaults to logging the result to console log.
 * @returns {ExitCallback<T>} Standard `cb(err, result)` exit callback.
 */
function exitCb(errorCb, successCb) {
  if (!errorCb) {
    errorCb = function (err) {
      console.error(chalk.red(err.message || JSON.stringify(err)));
    };
  }

  if (!successCb) {
    successCb = function (result) {
      console.log(chalk.green(result.toString()));
    };
  }

  return function (err, result) {
    if (err) {
      errorCb(err);
      process.exit(1);
    } else {
      successCb(result);
      process.exit(0);
    }
  };
}

/**
 * Get an array of files contained in specified items.
 * When a directory is specified, all files contained within that directory and its sub-directories will be included.
 *
 * @alias module:bagofcli.files
 * @param {Array<string>} items Array of files and/or directories.
 * @param {Object} [opts] Optional settings.
 * @param {string} [opts.match] Regular expression to match against the file path,
 * only the matching files will be included.
 * @returns {Array<string>} All files.
 */
function files(items, opts) {
  opts = opts || {};
  const data = [];

  function addMatch(item) {
    if (
      opts.match === undefined ||
      (opts.match && item.match(new RegExp(opts.match)))
    ) {
      data.push(item);
    }
  }

  items.forEach((item) => {
    const stat = fs.statSync(item);

    if (stat.isFile()) {
      addMatch(item);
    } else if (stat.isDirectory()) {
      const _items = fs.readdirSync(item, { recursive: true });
      _items.forEach((_item) => {
        _item = p.join(item, _item);
        if (fs.statSync(_item).isFile()) {
          addMatch(_item);
        }
      });
    }
  });
  return data;
}

/**
 * Lookup config values for the specified keys in the following order:
 * - environment variable
 * - if optional file is specified, then check for the value inside the file,
 *   the file type is determined by the file extension (.json, .yaml, or .yml)
 * - if optional prompt is set to true, then prompt the user for the config values
 *   that are not found in the environment variable and the file
 *   the value typed in by the user is masked when the key contains the word password
 *   (case insensitive)
 *
 * The file is located using {@link module:bagofcli.lookupFile}.
 *
 * @alias module:bagofcli.lookupConfig
 * @param {Array<string>|string} keys Configuration keys to look up.
 * @param {Object} opts Settings.
 * @param {string} [opts.file] File name to look up configuration values from.
 * @param {boolean} [opts.prompt=false] Prompt the user for missing configuration values.
 * @param {LookupConfigCallback} cb Standard `cb(err, result)` callback,
 * the result is an object of configuration values keyed by configuration key.
 * @returns {void}
 * @throws {Error} When the configuration file extension is not supported.
 */
function lookupConfig(keys, opts, cb) {
  if (!Array.isArray(keys)) {
    keys = [keys];
  }
  opts.prompt = opts.prompt || false;

  // parse values from configuration file if supplied
  const file = {};
  if (opts.file) {
    const content = this.lookupFile(opts.file);
    if (opts.file.match(/\.json$/)) {
      file.json = JSON.parse(content);
    } else if (opts.file.match(/\.ya?ml$/)) {
      file.yaml = yaml.load(content);
    } else {
      throw new Error("Configuration file extension is not supported");
    }
  }

  function lookup(key, cb) {
    if (process.env[key]) {
      cb(process.env[key]);
    } else if (file.json) {
      cb(file.json[key]);
    } else if (file.yaml) {
      cb(file.yaml[key]);
    } else {
      cb(undefined);
    }
  }

  // lookup for values in environment variables and configuration file
  const tasks = {};
  keys.forEach((key) => {
    tasks[key] = function (cb) {
      lookup(key, function (result) {
        cb(null, result);
      });
    };
  });

  async.parallel(tasks, function (err, results) {
    if (opts.prompt) {
      // prompt users for any keys that don't yet have any value from
      // environment variables and configuration file
      const promptQuestions = [];
      keys.forEach((key) => {
        if (results[key] === undefined) {
          const promptQuestion = {
            name: key,
            message: key,
            default: false,
          };
          // mask the value typed in by the user when the key is a password
          if (key.toLowerCase().indexOf("password") >= 0) {
            promptQuestion.type = "password";
          } else {
            promptQuestion.type = "input";
          }
          promptQuestions.push(promptQuestion);
        }
      });
      if (promptQuestions.length > 0) {
        inquirer.prompt(promptQuestions).then((promptAnswers) => {
          results = _.extend(results, promptAnswers);
          cb(err, results);
        });
      } else {
        cb(err, results);
      }
    } else {
      cb(err, results);
    }
  });
}

/**
 * Synchronously read file based on these rules:
 * - if path is absolute, then check file at absolute path first
 * - if path is relative, then check file at current working directory
 * - if none of the above exists, check file at user home directory
 * - if none exists, throw an error
 *
 * This allows simple file lookup which allows various locations.
 *
 * @alias module:bagofcli.lookupFile
 * @param {string} file File name to read.
 * @param {Object} [opts] Optional settings.
 * @param {string} [opts.platform] Platform override, defaults to the current process platform.
 * @returns {Buffer} File content.
 * @throws {Error} When the file can not be read from any of the locations.
 */
function lookupFile(file, opts) {
  opts = opts || {};
  let data;
  const platform = opts.platform || process.platform,
    baseDir = file.match(/^\//) ? p.dirname(file) : process.cwd(),
    homeDir = process.env[platform === "win32" ? "USERPROFILE" : "HOME"],
    files = _.map([baseDir, homeDir], function (dir) {
      return p.join(dir, file.match(/^\//) ? p.basename(file) : file);
    });

  for (let i = 0, ln = files.length; i < ln; i += 1) {
    try {
      data = fs.readFileSync(files[i]);
      break;
    } catch (err) {
      // do nothing when unable to read file
    }
  }

  if (data) {
    return data;
  } else {
    throw new Error("Unable to lookup file in " + files.join(", "));
  }
}

/**
 * Execute a command with an array of arguments.
 *
 * The output emitted on stdout and stderr of the child process will be written to
 * process.stdout and process.stderr of this process, without any additional newline.
 *
 * @alias module:bagofcli.spawn
 * @param {string} command Command to execute.
 * @param {Array<string>} args Command arguments.
 * @param {SpawnCallback} cb Standard `cb(err, result)` callback,
 * the result is the exit code, and the error exists when the exit code is not 0.
 * @returns {void}
 * @example
 * // will be executed as: make -f somemakefile target1 target2 target3
 * bag.spawn("make", ["-f", "somemakefile", "target1", "target2", "target3"], cb);
 */
function spawn(command, args, cb) {
  const _spawn = child.spawn(command, args);

  // process.stdout.write and process.stderr.write are used because console.log adds a newline

  _spawn.stdout.on("data", function (data) {
    process.stdout.write(chalk.green(data.toString()));
  });

  _spawn.stderr.on("data", function (data) {
    process.stderr.write(chalk.red(data.toString()));
  });

  _spawn.on("exit", function (code) {
    cb(code !== 0 ? new Error(code) : undefined, code);
  });
}

/**
 * Display log step heading message on the console.
 *
 * @alias module:bagofcli.logStepHeading
 * @param {string} message Heading message to be displayed.
 * @param {Object} [opts] Optional settings.
 * @param {Array<string>} [opts.labels] Labels to be displayed before the message.
 * @returns {void}
 */
function logStepHeading(message, opts) {
  opts = opts || {};
  const messageText = chalk.bold.cyan(message);
  if (opts.labels && Array.isArray(opts.labels)) {
    const labelsText = chalk.bgMagenta(opts.labels.join(" | "));
    console.log("%s %s", labelsText, messageText);
  } else {
    console.log("%s", messageText);
  }
}

/**
 * Display log step item success message on the console.
 *
 * @alias module:bagofcli.logStepItemSuccess
 * @param {string} message Success message to be displayed.
 * @param {Object} [opts] Optional settings.
 * @param {Array<string>} [opts.labels] Labels to be displayed before the message.
 * @returns {void}
 */
function logStepItemSuccess(message, opts) {
  opts = opts || {};
  const messageText = chalk.green(message);
  if (opts.labels && Array.isArray(opts.labels)) {
    const labelsText = chalk.bgMagenta(opts.labels.join(" | "));
    console.log("  * %s %s", labelsText, messageText);
  } else {
    console.log("  * %s", messageText);
  }
}

/**
 * Display log step item warning message on the console.
 *
 * @alias module:bagofcli.logStepItemWarning
 * @param {string} message Warning message to be displayed.
 * @param {Object} [opts] Optional settings.
 * @param {Array<string>} [opts.labels] Labels to be displayed before the message.
 * @returns {void}
 */
function logStepItemWarning(message, opts) {
  opts = opts || {};
  const messageText = chalk.yellow(message);
  if (opts.labels && Array.isArray(opts.labels)) {
    const labelsText = chalk.bgMagenta(opts.labels.join(" | "));
    console.log("  * %s %s", labelsText, messageText);
  } else {
    console.log("  * %s", messageText);
  }
}

/**
 * Display log step item error message on the console error.
 *
 * @alias module:bagofcli.logStepItemError
 * @param {string} message Error message to be displayed.
 * @param {Object} [opts] Optional settings.
 * @param {Array<string>} [opts.labels] Labels to be displayed before the message.
 * @returns {void}
 */
function logStepItemError(message, opts) {
  opts = opts || {};
  const messageText = chalk.red(message);
  if (opts.labels && Array.isArray(opts.labels)) {
    const labelsText = chalk.bgMagenta(opts.labels.join(" | "));
    console.error("  * %s %s", labelsText, messageText);
  } else {
    console.error("  * %s", messageText);
  }
}

const exports = {
  command: command,
  _addOption: _addOption,
  _optionDescription: _optionDescription,
  _preCommand: _preCommand,
  _postCommand: _postCommand,
  exec: exec,
  execAndCollect: execAndCollect,
  exit: exit,
  exitCb: exitCb,
  files: files,
  lookupConfig: lookupConfig,
  lookupFile: lookupFile,
  spawn: spawn,
  logStepHeading: logStepHeading,
  logStepItemSuccess: logStepItemSuccess,
  logStepItemWarning: logStepItemWarning,
  logStepItemError: logStepItemError,
};

export { exports as default };
