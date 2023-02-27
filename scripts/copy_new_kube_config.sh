# exit when any command fails
set -e

echo "
*** kubecm is required to programatically manage kube configs ***
brew install kubecm

This will pull the kube_config from the most recent 
terraform output, and merge it with your current kube_config. 

There's currently no tool to remove past config additions, so the listed
contexts in your kubeconfig will likely swell over time. kubecm can be
used to delete old contexts.
"

printf >&2 '%s ' 'Enter to continue'
read ans

echo "Extracting juno_kube_config from terraform ..."

# todo: handle remote (demo case) or local state (dev case)
# terraform output -state=terraform.juno.tfstate -raw juno_kube_config > juno_kube_config
cd cdktf.out/stacks/juno
terraform output -raw juno_kube_config > juno_kube_config

echo "Done"

echo "Adding to config ..."

set +e
kubecm delete juno_kube_config &> /dev/null 
set -e

kubecm add -f "juno_kube_config"

echo "Done"

echo "Cleaning up"

rm juno_kube_config

echo "Script Complete!"