# exit when any command fails
set -e

echo "
Convience script to visualize the result of terraform node dependencies.
(node as an a terraform resource, not javascript)
Useful to see order of deployment of what depends on what.

Requires 'brew install graphviz' to have access to the 'dot' command
"

printf >&2 '%s ' 'Enter to continue'
read ans

cdktf synth
cd "cdktf.out/stacks/juno"

terraform graph -type=plan -draw-cycles | dot -Tpng > ../../../graph.png

echo "Saved to \"graph.png\" at repo root."