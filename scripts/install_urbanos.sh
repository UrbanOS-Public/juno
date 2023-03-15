# this script will be replaced by helm terraform steps in main.ts, using it
# for now to accelerate helm iteration to get a working full install
set -e

echo "Is your kubeconfig up to date? ./scripts/copy_new_kube_config.sh"

helm repo add minio https://operator.min.io/

# install minio operator
# note: trying to see if it can be in the urbanos namespace
kubectl apply -f src/resource_additions/minio_user.yaml -n urbanos
helm upgrade minio-operator minio/operator --install --version "4.5.8" --namespace urbanos -f src/resource_additions/minio_operator_values.yaml
helm upgrade minio-tenant minio/tenant --install --version "4.5.8" --namespace urbanos -f src/resource_additions/minio_tenant_values.yaml

# install urbanos w tenant config
helm upgrade urbanos urbanos/urban-os --install --version "1.13.31" -i -f src/urbanos_demo_chart_values.yaml -n urbanos