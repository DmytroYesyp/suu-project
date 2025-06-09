#!/bin/bash

cd file-sink
eval $(minikube docker-env)
docker build -t file-sink:latest .
docker tag file-sink:latest dev.local/file-sink:latest
kn service apply file-sink --image=dev.local/file-sink --pull-policy=Never
cd -

#test the service
# kubectl run test --image=curlimages/curl -it --rm -- /bin/sh
# curl -X POST http://file-sink.default.svc.cluster.local -H "Content-Type: application/json" -d '{"message": "duuuuupa"}'
# kubectl exec -it <file-sink-pod-name> -- cat /data/events.log
