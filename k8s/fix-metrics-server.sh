#!/bin/bash

echo "========================================  "
echo "  Fixing Metrics Server for HPA"
echo "========================================"

echo -e "\n[1] Patching metrics-server with required arguments..."

# Patch metrics-server with required arguments
kubectl patch deployment metrics-server -n kube-system --type='json' -p='[
  {
    "op": "add",
    "path": "/spec/template/spec/containers/0/args/-",
    "value": "--kubelet-insecure-tls"
  },
  {
    "op": "add",
    "path": "/spec/template/spec/containers/0/args/-",
    "value": "--kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname"
  }
]'

echo -e "\n[2] Waiting for rollout to complete..."
kubectl rollout status deployment metrics-server -n kube-system

echo -e "\n[3] Waiting 60 seconds for metrics collection..."
sleep 60

echo -e "\n[4] Testing node metrics..."
kubectl top nodes

echo -e "\n[5] Testing pod metrics..."
kubectl top pods -l app=crud-app

echo -e "\n[6] Checking HPA status..."
kubectl get hpa crud-app-hpa

echo -e "\n========================================  "
echo "  Metrics Server Fix Complete!"
echo "========================================"
echo ""
echo "If you see CPU/Memory metrics above, it's working!"
echo "If you still see errors, run: kubectl describe hpa crud-app-hpa"
