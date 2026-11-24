"use strict";
/**
 * Example usage of bagofcli.
 *
 * Commands, their positional arguments, and global/command options are all
 * declared in commands.json (sitting alongside this file) rather than in
 * code - this script just wires up the action handler for each command.
 *
 * Try it, e.g.:
 *
 *   node examples/bagofcli.js mycommand1 someval1 someval2
 *   node examples/bagofcli.js mycommand2 someval1 someval2 --myopt2
 *   node examples/bagofcli.js --help
 */
import bag from "bagofcli";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const actions = {
  commands: {
    mycommand1: {
      action: function (opts) {
        // opts.args holds the positional arguments (myarg1a, myarg1b as
        // configured in commands.json), in the order they were passed in.
        // opts.name() returns the command name that was invoked.
        console.log("Running %s with args: %s", opts.name(), opts.args.join(", "));
        // myopt1/myopt2 are global options (declared at the top level of
        // commands.json), they are available on opts alongside this command's
        // own options.
        console.log(
          "Global opts: myopt1=%s myopt2=%s",
          opts.myopt1,
          opts.myopt2,
        );
      },
    },
    mycommand2: {
      action: function (opts) {
        console.log("Running %s with args: %s", opts.name(), opts.args.join(", "));
        // mycmd2opt is a command option (declared under mycommand2 in
        // commands.json), it's available on opts just like global options.
        console.log("Command opt: mycmd2opt=%s", opts.mycmd2opt);
      },
    },
  },
};

// commands.json lives directly in this directory rather than under the
// default conf/commands.json location, so point commandFile at it explicitly.
bag.command(__dirname, actions, { commandFile: "commands.json" });
