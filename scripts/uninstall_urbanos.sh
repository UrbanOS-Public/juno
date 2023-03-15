kubectl delete -f src/resource_additions/minio_user.yaml -n urbanos
kc delete pvc data0-urbanos-minio-pool-0-0 -n urbanos

helm uninstall urbanos -n urbanos
helm uninstall minio-operator -n urbanos
helm uninstall minio-tenant -n urbanos