
kubectl create configmap my-dashboard-config \
  --from-file=my-dashboard.json \
  -n monitoring

kubectl patch deployment grafana \
  -n monitoring \
  --type='json' \
  -p='[
    {
      "op": "add",
      "path": "/spec/template/spec/volumes/-",
      "value": {
        "name": "dashboard-volume",
        "configMap": {
          "name": "my-dashboard-config"
        }
      }
    },
    {
      "op": "add",
      "path": "/spec/template/spec/containers/0/volumeMounts/-",
      "value": {
        "name": "dashboard-volume",
        "mountPath": "/var/lib/grafana/dashboards/default"
      }
    }
  ]'

kubectl apply -f dashboard-provider.yaml

kubectl rollout restart deployment grafana -n monitoring
