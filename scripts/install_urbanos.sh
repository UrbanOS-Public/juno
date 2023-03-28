# this script will be replaced by helm terraform steps in main.ts, using it
# for now to accelerate helm iteration to get a working full install
set -e

echo "Is your kubeconfig up to date? ./scripts/copy_new_kube_config.sh"

helm repo add minio https://operator.min.io/

# install minio operator
helm upgrade minio-operator minio/operator --install --version "4.5.8" --namespace urbanos -f src/resource_additions/minio_operator_values.yaml
helm upgrade minio-tenant minio/tenant --install --version "4.5.8" --namespace urbanos -f src/resource_additions/minio_tenant_values.yaml

# install postgres
helm repo add bitnami https://charts.bitnami.com/bitnami
helm upgrade postgresql bitnami/postgresql --install --version "12.1.14" --namespace urbanos -f src/resource_additions/postgres_values.yaml

# install strimzi CRDs
kubectl apply -f "src/resource_additions/strimzi-crds-0.33.2.yaml" -n urbanos

# install auth0 secrets
kubectl apply -f "src/resource_additions/andi_secret.yaml" -n urbanos
kubectl apply -f "src/resource_additions/raptor_secret.yaml" -n urbanos

# install andi ingress
kubectl apply -f "src/resource_additions/andi_ingress.yaml" -n urbanos

# install redis
helm upgrade redis bitnami/redis --install --version "17.1.4" --namespace urbanos -f src/resource_additions/redis_values.yaml

# install disc-api
kubectl apply -f "src/resource_additions/discovery_api_ingress.yaml" -n urbanos

# install urbanos w tenant config

# note: installing urbanos has an api / elasticsearch race condition.
# might need to isolate the install of elasticsearch to happen first

# https://github.com/UrbanOS-Public/charts/releases/tag/urban-os-1.13.31
helm upgrade urbanos urbanos/urban-os --install --version "1.13.31" -i -f src/urbanos_demo_chart_values.yaml -n urbanos