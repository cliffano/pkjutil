"use strict";
/**
 * Example usage of bagofcli.
 *
 * Commands, their positional arguments, and global/command options are all
 * declared in commands.json (sitting alongside this file) rather than in
 * code - this script just wires up the action handler for each command.
 *
 * Arguments and options are validated before the action handler is called,
 * so an action handler only runs when everything is valid:
 * - choices, min, max, and integer are checked by commander while parsing
 * - rules are checked by bagofcli right before the action handler is called
 *
 * Try it, e.g.:
 *
 *   node _bagofcli.js --help
 *   node _bagofcli.js serve --help
 *   node _bagofcli.js greet Ada --shout
 *   node _bagofcli.js serve --transport streamable-http --port 3000
 *   node _bagofcli.js deploy --env staging --replicas 3
 *
 * See bagofcli-lib.sh for the full list of scenarios, valid and invalid.
 */
import bag from "bagofcli";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Log the global options (declared at the top level of commands.json),
 * which are available on opts alongside the command's own options.
 *
 * @param {Object} opts Object passed to the action handler.
 */
function logGlobalOpts(opts) {
  console.log(
    "Global opts: quiet=%s logLevel=%s retries=%s",
    opts.quiet,
    opts.logLevel,
    opts.retries,
  );
}

const actions = {
  commands: {
    greet: {
      action: function (opts) {
        // opts.args holds the positional arguments in the order they were passed in.
        // opts.name() returns the command name that was invoked.
        console.log("Running %s with args: %s", opts.name(), opts.args.join(", "));
        // greeting falls back to its default value (the "action" field in
        // commands.json) when it isn't supplied.
        const message = `${opts.greeting}, ${opts.args[0]}!`;
        console.log(opts.shout ? message.toUpperCase() : message);
        logGlobalOpts(opts);
      },
    },
    echo: {
      action: function (opts) {
        // echo doesn't declare any args, so it accepts any positional arguments.
        console.log("Running %s with args: %s", opts.name(), opts.args.join(", "));
      },
    },
    notify: {
      action: function (opts) {
        console.log("Running %s with args: %s", opts.name(), opts.args.join(", "));
        console.log("Command opts: priority=%s", opts.priority);
        logGlobalOpts(opts);
      },
    },
    serve: {
      action: function (opts) {
        // Option values are passed as the original strings, including the
        // ones restricted to a numeric range, e.g. port is "8080", not 8080.
        console.log("Running %s with args: %s", opts.name(), opts.args.join(", "));
        console.log(
          "Command opts: transport=%s port=%s (%s) offset=%s",
          opts.transport,
          opts.port,
          typeof opts.port,
          opts.offset,
        );
        logGlobalOpts(opts);
      },
    },
    deploy: {
      action: function (opts) {
        console.log("Running %s", opts.name());
        console.log("Command opts: env=%s replicas=%s", opts.env, opts.replicas);
        logGlobalOpts(opts);
      },
    },
  },
};

// commands.json lives directly in this directory rather than under the
// default conf/commands.json location, so point commandFile at it explicitly.
bag.command(__dirname, actions, { commandFile: "commands.json" });
