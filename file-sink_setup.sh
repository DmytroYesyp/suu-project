cd file-sink
eval $(minikube docker-env)
docker build -t file-sink:latest .
docker tag file-sink:latest dev.local/file-sink:latest
# kubectl apply -f config/file-sink.yaml
kn service apply config/file-sink.yaml --image=dev.local/file-sink --pull-policy=Never

#test the service
kubectl run test --image=curlimages/curl -it --rm -- /bin/sh
curl -X POST http://file-sink.default.svc.cluster.local -H "Content-Type: application/json" -d '{"message": "duuuuupa"}'
kubectl exec -it <file-sink-pod-name> -- cat /data/events.log