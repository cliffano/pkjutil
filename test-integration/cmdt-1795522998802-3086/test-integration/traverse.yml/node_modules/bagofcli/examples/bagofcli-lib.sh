#!/usr/bin/env bash
set -o errexit
set -o nounset

cd ../
npm link .
cd examples/

npm link bagofcli

# Print a scenario heading.
scenario() {
  printf "\n\n========================================\n"
  printf "%s:\n" "$1"
}

# Run a command, the script exits when it doesn't succeed.
expect_success() {
  printf "$ %s\n" "$*"
  "$@"
}

# Run a command, the script exits when it doesn't fail with status code 1.
expect_failure() {
  local status=0
  printf "$ %s\n" "$*"
  "$@" || status=$?
  if [ "${status}" -ne 1 ]; then
    printf "Expected exit status 1 but got %s\n" "${status}"
    exit 1
  fi
  printf "(exited with status 1, as expected)\n"
}

#----------------------------------------
# Help and version

scenario "Show help, listing global options with their choices and range, and command examples"
expect_success node _bagofcli.js --help

scenario "Show serve command help, listing command options with their choices, range, and default value"
expect_success node _bagofcli.js serve --help

scenario "Show deploy command help"
expect_success node _bagofcli.js deploy --help

scenario "Show version"
expect_success node _bagofcli.js --version

#----------------------------------------
# greet: positional arg, flags, default value, extra args

scenario "Run greet with a positional arg, greeting falls back to its default value"
expect_success node _bagofcli.js greet Ada

scenario "Run greet with a flag and an option"
expect_success node _bagofcli.js greet Ada --shout --greeting Hi

scenario "Run greet with global options before the command, and a command option after the positional arg"
expect_success node _bagofcli.js --quiet --log-level debug --retries 3 greet Ada --greeting Hi

scenario "Fail greet when the mandatory positional arg is missing, showing the usage"
expect_failure node _bagofcli.js greet

scenario "Fail greet when there are more positional args than declared, showing the usage"
expect_failure node _bagofcli.js greet Ada Lovelace

#----------------------------------------
# echo: no declared args

scenario "Run echo with any positional args, accepted since echo doesn't declare any args"
expect_success node _bagofcli.js echo hello world

#----------------------------------------
# notify: rules on positional arg and option

scenario "Run notify with a positional arg and an option that satisfy their rules"
expect_success node _bagofcli.js notify ada@example.com --priority 1

scenario "Fail notify when the positional arg doesn't satisfy the email rule"
expect_failure node _bagofcli.js notify ada --priority 1

scenario "Fail notify when the option doesn't satisfy the int rule"
expect_failure node _bagofcli.js notify ada@example.com --priority high

scenario "Fail notify when the option is omitted, since rules are checked even when the option is omitted"
expect_failure node _bagofcli.js notify ada@example.com

#----------------------------------------
# serve: choices, range, allowExcessArguments false

scenario "Run serve without options, port falls back to its default value, other options are not checked when omitted"
expect_success node _bagofcli.js serve

scenario "Run serve with options within their choices and range, a negative value can be separated by a space"
expect_success node _bagofcli.js serve --transport streamable-http --port 3000 --offset -5

scenario "Run serve with port at its max bound"
expect_success node _bagofcli.js serve --port 65535

scenario "Run serve with global options within their choices and range"
expect_success node _bagofcli.js --log-level info --retries 0 serve --transport stdio

scenario "Fail serve when transport is not one of the choices"
expect_failure node _bagofcli.js serve --transport sse

scenario "Fail serve when port is above its max bound"
expect_failure node _bagofcli.js serve --port 70000

scenario "Fail serve when port is a decimal, since port only accepts integers"
expect_failure node _bagofcli.js serve --port 80.5

scenario "Fail serve when port is not a number"
expect_failure node _bagofcli.js serve --port http

scenario "Fail serve when offset is above its max bound, offset only has a max bound"
expect_failure node _bagofcli.js serve --offset 1

scenario "Fail serve when the global log level is not one of the choices"
expect_failure node _bagofcli.js --log-level trace serve

scenario "Fail serve when the global retries is above its max bound"
expect_failure node _bagofcli.js --retries 6 serve

scenario "Fail serve when there is an unexpected positional arg, since serve doesn't allow excess arguments"
expect_failure node _bagofcli.js serve stray

scenario "Fail serve when an unexpected positional arg is mixed with options"
expect_failure node _bagofcli.js serve --port 3000 stray --transport stdio

#----------------------------------------
# deploy: choices and range combined with the required rule

scenario "Run deploy with mandatory options within their choices and range"
expect_success node _bagofcli.js deploy --env production --replicas 10

scenario "Fail deploy when env is not one of the choices"
expect_failure node _bagofcli.js deploy --env dev --replicas 3

scenario "Fail deploy when replicas is below its min bound"
expect_failure node _bagofcli.js deploy --env staging --replicas 0

scenario "Fail deploy when env is omitted, since env is required"
expect_failure node _bagofcli.js deploy --replicas 3

scenario "Fail deploy when replicas is omitted, since replicas is required"
expect_failure node _bagofcli.js deploy --env staging

#----------------------------------------
# unknown command

scenario "Fail when the command is unknown"
expect_failure node _bagofcli.js unknown
