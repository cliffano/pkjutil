import { Help } from "commander";
import type { Actions as ActionsType, CommandArg as CommandArgType, ExecAndCollectCallback, ExecCallback, ExitCallback, ExitError, ExitErrorCallback, ExitSuccessCallback, LookupConfigCallback, SpawnCallback } from "./types.js";
export type CommandArg = CommandArgType;
export type Actions = ActionsType;
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
declare function command(base: string, actions?: Actions, opts?: {
    commandFile?: string;
}): void;
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
declare function _addOption(program: Object, option: Object): void;
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
declare function _optionDescription(this: Help, option: Object): string;
/**
 * Pre-command tasks, to be run before commander parses the command line arguments.
 * Register a help handler that prints command examples after the default help output
 * when `--help` flag is specified.
 *
 * @param {Object} commands Command configuration map, keyed by command name.
 * @returns {void}
 * @private
 */
declare function _preCommand(commands: Object): void;
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
declare function _postCommand(commanderArg: Object, commandsConfig: Object, globalOptsConfig?: Array<Object>): void;
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
declare function exec(command: string, fallthrough: boolean, cb: ExecCallback): void;
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
declare function execAndCollect(command: string, fallthrough: boolean, cb: ExecAndCollectCallback): void;
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
declare function exit(err?: ExitError | null): void;
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
declare function exitCb<T>(errorCb?: ExitErrorCallback, successCb?: ExitSuccessCallback<T>): ExitCallback<T>;
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
declare function files(items: Array<string>, opts?: {
    match?: string;
}): Array<string>;
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
declare function lookupConfig(keys: Array<string> | string, opts: {
    file?: string;
    prompt?: boolean;
}, cb: LookupConfigCallback): void;
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
declare function lookupFile(file: string, opts?: {
    platform?: string;
}): Buffer;
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
declare function spawn(command: string, args: Array<string>, cb: SpawnCallback): void;
/**
 * Display log step heading message on the console.
 *
 * @alias module:bagofcli.logStepHeading
 * @param {string} message Heading message to be displayed.
 * @param {Object} [opts] Optional settings.
 * @param {Array<string>} [opts.labels] Labels to be displayed before the message.
 * @returns {void}
 */
declare function logStepHeading(message: string, opts?: {
    labels?: Array<string>;
}): void;
/**
 * Display log step item success message on the console.
 *
 * @alias module:bagofcli.logStepItemSuccess
 * @param {string} message Success message to be displayed.
 * @param {Object} [opts] Optional settings.
 * @param {Array<string>} [opts.labels] Labels to be displayed before the message.
 * @returns {void}
 */
declare function logStepItemSuccess(message: string, opts?: {
    labels?: Array<string>;
}): void;
/**
 * Display log step item warning message on the console.
 *
 * @alias module:bagofcli.logStepItemWarning
 * @param {string} message Warning message to be displayed.
 * @param {Object} [opts] Optional settings.
 * @param {Array<string>} [opts.labels] Labels to be displayed before the message.
 * @returns {void}
 */
declare function logStepItemWarning(message: string, opts?: {
    labels?: Array<string>;
}): void;
/**
 * Display log step item error message on the console error.
 *
 * @alias module:bagofcli.logStepItemError
 * @param {string} message Error message to be displayed.
 * @param {Object} [opts] Optional settings.
 * @param {Array<string>} [opts.labels] Labels to be displayed before the message.
 * @returns {void}
 */
declare function logStepItemError(message: string, opts?: {
    labels?: Array<string>;
}): void;
declare const exports: {
    command: typeof command;
    _addOption: typeof _addOption;
    _optionDescription: typeof _optionDescription;
    _preCommand: typeof _preCommand;
    _postCommand: typeof _postCommand;
    exec: typeof exec;
    execAndCollect: typeof execAndCollect;
    exit: typeof exit;
    exitCb: typeof exitCb;
    files: typeof files;
    lookupConfig: typeof lookupConfig;
    lookupFile: typeof lookupFile;
    spawn: typeof spawn;
    logStepHeading: typeof logStepHeading;
    logStepItemSuccess: typeof logStepItemSuccess;
    logStepItemWarning: typeof logStepItemWarning;
    logStepItemError: typeof logStepItemError;
};
export { exports as default };
