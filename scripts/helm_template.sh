# exit when any command fails
set -e

if [ $# -eq 0 ]; then
    echo "Include environment name (i.e. dev1) as an arg"
    exit 1
fi

echo "
Convience script to remember the helm template command.

Will save the output of \"urbanos_chart_values.yaml\" combined with
the latest remote UrbanOS chart, to \"helm_template_output.yaml\".
"

printf >&2 '%s ' 'Enter to continue'
read ans

helm template urbanos urbanos/urban-os --version "1.13.31" -f envs/"$1"/urbanos_dev_chart_values.yaml > helm_urbanos_template_output.yaml
helm template urbanos urbanos/kafka --version "1.2.20" -f envs/"$1"/urbanos_kafka_values.yaml > helm_kafka_template_output.yaml

echo "Template saved to \"helm_urbanos_template_output.yaml\" and \"helm_kafka_template_output.yaml\""