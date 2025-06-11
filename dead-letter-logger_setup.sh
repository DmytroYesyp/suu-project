#!/bin/bash

cd dead-letter-logger
eval $(minikube docker-env)
docker build -t dead-letter-logger:latest .
docker tag dead-letter-logger:latest dev.local/dead-letter-logger:latest
kn service apply dead-letter-logger --image=dev.local/dead-letter-logger --pull-policy=Never
cd -

#test the service
# kubectl run test --image=curlimages/curl -it --rm -- /bin/sh
# curl -X POST http://dead-letter-logger.default.svc.cluster.local -H "Content-Type: application/json" -d '{"message": "duuuuupa"}'
# kubectl exec -it <dead-letter-logger-pod-name> -- cat /data/events.log
