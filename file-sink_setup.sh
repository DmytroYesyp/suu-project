cd file-sink
docker build -t file-sink:latest .
kubectl apply -f config/file-sink.yaml