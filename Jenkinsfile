pipeline {
  agent any
  
  environment {
    DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
    DOCKER_IMAGE = "water289/crud-nodejs-mysql"
  }
  
  stages {
    stage('Code Fetch') {
      steps {
        echo 'Fetching code from GitHub'
        checkout scm
      }
    }
    
    stage('Docker Image Creation') {
      steps {
        echo 'Building Docker Image'
        sh 'docker build -t ${DOCKER_IMAGE}:latest .'
        sh 'docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} .'
      }
    }
    
    stage('Docker Push to DockerHub') {
      steps {
        echo 'Pushing Docker Image to DockerHub'
        sh 'echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin'
        sh 'docker push ${DOCKER_IMAGE}:latest'
        sh 'docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}'
      }
    }
    
    stage('Kubernetes Deployment') {
      steps {
        echo 'Deploying to Kubernetes'
        sh 'kubectl apply -f k8s/mysql.yaml'
        sh 'kubectl apply -f k8s/deployment.yaml'
        sh 'kubectl apply -f k8s/hpa.yaml'
        sh 'kubectl get pods'
        sh 'kubectl get svc'
        sh 'kubectl get hpa'
      }
    }
    
    stage('Prometheus/Grafana Deployment') {
      steps {
        echo 'Deploying Prometheus and Grafana using Helm'
        sh '''
          # Install Helm if not installed
          if ! command -v helm &> /dev/null; then
            curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
          fi
          
          # Create monitoring namespace
          kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
          
          # Install kube-prometheus-stack
          helm install prometheus kube-prometheus-stack \
            --repo https://prometheus-community.github.io/helm-charts \
            --namespace monitoring
          
          kubectl get deployments -n monitoring
          kubectl get svc -n monitoring
        '''
      }
    }
  }
  
  post {
    always {
      sh 'docker logout || true'
    }
  }
}
