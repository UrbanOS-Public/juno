kubectl delete -f src/resource_additions/andi_secret.yaml -n urbanos
kubectl delete -f src/resource_additions/raptor_secret.yaml -n urbanos

helm uninstall urbanos -n urbanos

helm uninstall redis -n urbanos
helm uninstall minio-tenant -n urbanos
helm uninstall minio-operator -n urbanos
helm uninstall postgresql -n urbanos

echo "removing minio pvc"
kubectl delete pvc data0-urbanos-minio-pool-0-0 -n urbanos

echo "removing postgres pvc"
kubectl delete pvc data-postgresql-0 -n urbanos

echo "removing redis pvc"
kubectl delete pvc redis-data-redis-master-0 -n urbanos

echo "removing kafka pvcs"
kubectl delete pvc data-pipeline-kafka-0 -n urbanos
kubectl delete pvc data-pipeline-zookeeper-0 -n urbanos

echo "removing elasticsearch pvcs"
kubectl delete pvc elasticsearch-master-elasticsearch-master-0 -n urbanos

kubectl delete -f "src/resource_additions/strimzi-crds-0.33.2.yaml" -n urbanos
