/**
 * Type definitions referenced from the JSDoc in bagofcli.js via `@import`.
 *
 * These are written in TypeScript syntax because jsdoc (used for the API
 * documentation) can't parse TypeScript type expressions such as function
 * types and index signatures, while TypeScript 7 no longer supports the
 * Closure-style equivalents that jsdoc can parse.
 */

/**
 * Object passed to a command action handler.
 *
 * Besides `args` and `name`, every parsed option is available as a
 * direct property keyed by the option's long flag in camel case
 * (e.g. `--some-opt <value>` is available as `someOpt`).
 * This covers both the command's own options and the global options.
 * When a global option and a command option share the same name,
 * the global option value takes precedence.
 *
 * Option values are typed as `unknown` because their types depend on the
 * command file: a flag is a boolean, an option with a value is a string,
 * and an option that isn't supplied is undefined unless it has a default value.
 */
export type CommandArg = {
  /** Positional arguments, in the order they were passed in. */
  args: string[];
  /** Return the name of the invoked command. */
  name: () => string;
  /** Parsed option values, keyed by the option's long flag in camel case. */
  [option: string]: unknown;
};

/**
 * Action handler of a command, called with the parsed arguments and options.
 * bagofcli doesn't wait for a returned promise.
 */
export type CommandAction = (command: CommandArg) => void | Promise<void>;

/**
 * Action handlers for commands, keyed by the command name
 * as specified in the command file.
 */
export type Actions = {
  commands?: Record<string, { action: CommandAction }>;
};

/**
 * Error passed to the exit functions, usually an Error,
 * or any other object which gets logged as JSON.
 */
export type ExitError = Error | object;

/**
 * Callback that handles the error passed to an exit callback.
 */
export type ExitErrorCallback = (err: ExitError) => void;

/**
 * Callback that handles the result passed to an exit callback.
 */
export type ExitSuccessCallback<T> = (result: T) => void;

/**
 * Standard `cb(err, result)` callback which exits the process.
 */
export type ExitCallback<T> = (err?: ExitError | null, result?: T) => void;

/**
 * Callback of exec, the result is the camouflaged error when fallthrough is allowed.
 */
export type ExecCallback = (err: Error | null, result?: Error) => void;

/**
 * Callback of execAndCollect, with the collected stdout and stderr output,
 * the result is the camouflaged error when fallthrough is allowed.
 */
export type ExecAndCollectCallback = (
  err: Error | null,
  stdOutOutput: string,
  stdErrOutput: string,
  result?: Error,
) => void;

/**
 * Callback of spawn, the result is the exit code,
 * and the error exists when the exit code is not 0.
 */
export type SpawnCallback = (
  err: Error | undefined,
  result: number | null,
) => void;

/**
 * Callback of lookupConfig, the result is an object of configuration values
 * keyed by configuration key.
 */
export type LookupConfigCallback = (
  err: Error | null | undefined,
  result: Record<string, unknown>,
) => void;
