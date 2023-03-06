# exit when any command fails
set -e

echo "
Convience script to remember the helm template command.

Will save the output of \"urbanos_demo_chart_values.yaml\" combined with
the latest remote UrbanOS chart, to \"helm_template_output.yaml\".
"

printf >&2 '%s ' 'Enter to continue'
read ans

helm template urbanos urbanos/urban-os -f src/urbanos_demo_chart_values.yaml > helm_template_output.yaml

echo "Template saved to \"helm_template_output.yaml\""