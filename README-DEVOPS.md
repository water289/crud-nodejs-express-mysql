# CRUD Node.js + Express + MySQL - DevOps Project

Complete CI/CD pipeline implementation for COMSATS CSC418 DevOps Lab Project.

## Features
- CRUD operations with Node.js, Express, MySQL
- Prometheus metrics at `/metrics` endpoint
- Docker containerization
- Kubernetes deployment (Deployment, Service, PVC)
- Monitoring with Prometheus and Grafana
- Jenkins CI/CD pipeline automation

## Tech Stack
- **Backend**: Node.js, Express, EJS
- **Database**: MySQL 8.0
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Monitoring**: Prometheus, Grafana
- **CI/CD**: Jenkins

## Jenkins Pipeline Stages
1. **Code Fetch**: Clone from GitHub
2. **Install & Test**: npm install and validation
3. **Docker Image Creation**: Build Docker image
4. **Docker Push**: Push to DockerHub (water289/crud-nodejs-mysql)
5. **Kubernetes Deployment**: Deploy app and MySQL to K8s
6. **Prometheus/Grafana Stage**: Deploy monitoring stack

## Local Development
```bash
npm install
npm start
# Visit http://localhost:5000
```

## Docker Build & Run
```bash
docker build -t water289/crud-nodejs-mysql:latest .
docker run -p 3000:3000 -e DB_HOST=host.docker.internal water289/crud-nodejs-mysql:latest
```

## Kubernetes Deployment
```bash
kubectl apply -f k8s/mysql.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/hpa.yaml
kubectl get pods,svc,hpa
```

## Horizontal Pod Autoscaling
Enable metrics-server (minikube):
```bash
minikube addons enable metrics-server
```

Test HPA with load:
```bash
# Terminal 1: Watch HPA
kubectl get hpa crud-app-hpa --watch

# Terminal 2: Generate load
kubectl run -i load-generator --rm --image=busybox --restart=Never -- /bin/sh -c "while true; do wget -O- http://crud-app:80/; done"
```

## Monitoring
```bash
# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Create monitoring namespace
kubectl create namespace monitoring

# Install Prometheus and Grafana
helm install prometheus kube-prometheus-stack \
  --repo https://prometheus-community.github.io/helm-charts \
  --namespace monitoring

# Port-forward Grafana (from EC2, allow external access)
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring --address=0.0.0.0

# Get Grafana password
kubectl get secret -n monitoring prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 --decode ; echo

# Access Grafana at http://<EC2_PUBLIC_IP>:3000
# Username: admin, Password: (from command above)

# Import Dashboard ID 17685 for deployment statistics
```

## Jenkins Setup on EC2
1. Install Docker, kubectl, Jenkins
2. Configure credentials:
   - `dockerhub-creds`: DockerHub username/password
   - `kubeconfig`: Kubernetes config file
3. Create Pipeline job pointing to GitHub repo
4. Configure GitHub webhook
5. Run pipeline

## Environment Variables
- `PORT`: Application port (default: 5000)
- `DB_HOST`: MySQL host
- `DB_USER`: MySQL username
- `DB_PASSWORD`: MySQL password
- `DB_NAME`: Database name

## Metrics Endpoint
- `/metrics` - Prometheus metrics (HTTP requests, duration, system metrics)

## Author
COMSATS University Islamabad - BCT VII - CSC418 DevOps Lab Project
