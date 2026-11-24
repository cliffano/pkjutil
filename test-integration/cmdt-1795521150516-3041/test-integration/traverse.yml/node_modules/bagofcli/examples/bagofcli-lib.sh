#!/usr/bin/env bash
set -o errexit
set -o nounset

cd ../
npm link .
cd examples/

npm link bagofcli

printf "\n\n========================================\n"
printf "Show help:\n"
node _bagofcli.js --help

printf "\n\n========================================\n"
printf "Show version:\n"
node _bagofcli.js --version

printf "\n\n========================================\n"
printf "Run first command with positional args without optional args:\n"
node _bagofcli.js mycommand1 someval1 someval2

printf "\n\n========================================\n"
printf "Run second command with positional args without optional args:\n"
node _bagofcli.js mycommand2 someval1 someval2

printf "\n\n========================================\n"
printf "Run first command with positional args and optional args:\n"
node _bagofcli.js mycommand1 someval1 someval2 --myopt1 myoptval1 --myopt2 myoptval2

printf "\n\n========================================\n"
printf "Run second command with positional args and optional args:\n"
node _bagofcli.js mycommand2 someval1 someval2 --myopt1 myoptval1 --myopt2 myoptval2

printf "\n\n========================================\n"
printf "Run first command with positional args, global options, and its own command-scoped option:\n"
node _bagofcli.js mycommand1 someval1 someval2 --myopt1 myoptval1 --myopt2 myoptval2 --mycmd1opt mycmd1optval

printf "\n\n========================================\n"
printf "Run second command with positional args, global options, and its own command-scoped option:\n"
node _bagofcli.js mycommand2 someval1 someval2 --myopt1 myoptval1 --myopt2 myoptval2 --mycmd2opt mycmd2optval