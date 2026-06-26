pipeline {
    agent any

    environment {
        AWS_REGION         = 'ap-south-1'
        AWS_ACCOUNT_ID     = credentials('aws-account-id')
        ECR_BACKEND_REPO   = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/ipfcms-backend"
        ECR_FRONTEND_REPO  = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/ipfcms-frontend"
        EKS_CLUSTER_NAME   = 'ipfcms-cluster'
        K8S_NAMESPACE      = 'ipfcms'
        IMAGE_TAG          = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'latest'}"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        // ──────────────────────────────────────────────
        // Stage 1: Checkout Source Code
        // ──────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                echo "Building commit: ${env.GIT_COMMIT}"
                echo "Image tag: ${IMAGE_TAG}"
            }
        }

        // ──────────────────────────────────────────────
        // Stage 2: Run Tests
        // ──────────────────────────────────────────────
        stage('Tests') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            sh '''
                                docker build --target vendor -t ipfcms-backend-test .
                                docker run --rm ipfcms-backend-test php artisan test --parallel
                            '''
                        }
                    }
                }
                stage('Frontend Lint') {
                    steps {
                        dir('frontend') {
                            sh '''
                                docker run --rm -v $(pwd):/app -w /app node:22-alpine sh -c "npm ci && npm run lint"
                            '''
                        }
                    }
                }
            }
        }

        // ──────────────────────────────────────────────
        // Stage 3: Build Docker Images
        // ──────────────────────────────────────────────
        stage('Build Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir('backend') {
                            sh "docker build -t ${ECR_BACKEND_REPO}:${IMAGE_TAG} -t ${ECR_BACKEND_REPO}:latest ."
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        dir('frontend') {
                            sh """
                                docker build \
                                    --build-arg VITE_API_URL=https://ipfcms.example.com/api \
                                    -t ${ECR_FRONTEND_REPO}:${IMAGE_TAG} \
                                    -t ${ECR_FRONTEND_REPO}:latest .
                            """
                        }
                    }
                }
            }
        }

        // ──────────────────────────────────────────────
        // Stage 4: Push to AWS ECR
        // ──────────────────────────────────────────────
        stage('Push to ECR') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                    sh """
                        aws ecr get-login-password --region ${AWS_REGION} | \
                            docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

                        docker push ${ECR_BACKEND_REPO}:${IMAGE_TAG}
                        docker push ${ECR_BACKEND_REPO}:latest

                        docker push ${ECR_FRONTEND_REPO}:${IMAGE_TAG}
                        docker push ${ECR_FRONTEND_REPO}:latest
                    """
                }
            }
        }

        // ──────────────────────────────────────────────
        // Stage 5: Deploy to EKS
        // ──────────────────────────────────────────────
        stage('Deploy to EKS') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                    sh """
                        # Configure kubectl for EKS
                        aws eks update-kubeconfig --region ${AWS_REGION} --name ${EKS_CLUSTER_NAME}

                        # Apply K8s manifests (idempotent)
                        kubectl apply -f k8s/namespace.yaml
                        kubectl apply -f k8s/configmap.yaml
                        kubectl apply -f k8s/secrets.yaml
                        kubectl apply -f k8s/backend-deployment.yaml
                        kubectl apply -f k8s/backend-service.yaml
                        kubectl apply -f k8s/frontend-deployment.yaml
                        kubectl apply -f k8s/frontend-service.yaml
                        kubectl apply -f k8s/ingress.yaml
                        kubectl apply -f k8s/backend-hpa.yaml

                        # Update deployment images to the new tag
                        kubectl set image deployment/backend \
                            backend=${ECR_BACKEND_REPO}:${IMAGE_TAG} \
                            -n ${K8S_NAMESPACE}

                        kubectl set image deployment/frontend \
                            frontend=${ECR_FRONTEND_REPO}:${IMAGE_TAG} \
                            -n ${K8S_NAMESPACE}
                    """
                }
            }
        }

        // ──────────────────────────────────────────────
        // Stage 6: Verify Deployment
        // ──────────────────────────────────────────────
        stage('Verify') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                    sh """
                        echo "Waiting for backend rollout..."
                        kubectl rollout status deployment/backend -n ${K8S_NAMESPACE} --timeout=300s

                        echo "Waiting for frontend rollout..."
                        kubectl rollout status deployment/frontend -n ${K8S_NAMESPACE} --timeout=300s

                        echo ""
                        echo "=== Pod Status ==="
                        kubectl get pods -n ${K8S_NAMESPACE}

                        echo ""
                        echo "=== Services ==="
                        kubectl get svc -n ${K8S_NAMESPACE}

                        echo ""
                        echo "=== Ingress ==="
                        kubectl get ingress -n ${K8S_NAMESPACE}
                    """
                }
            }
        }

        // ──────────────────────────────────────────────
        // Stage 7: Run Database Migrations
        // ──────────────────────────────────────────────
        stage('Migrate Database') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                    sh """
                        # Run migrations on one backend pod
                        BACKEND_POD=\$(kubectl get pods -n ${K8S_NAMESPACE} -l app.kubernetes.io/name=backend -o jsonpath='{.items[0].metadata.name}')
                        kubectl exec \$BACKEND_POD -n ${K8S_NAMESPACE} -- php artisan migrate --force
                    """
                }
            }
        }
    }

    post {
        success {
            echo '✅ Deployment successful!'
            echo "Backend image: ${ECR_BACKEND_REPO}:${IMAGE_TAG}"
            echo "Frontend image: ${ECR_FRONTEND_REPO}:${IMAGE_TAG}"
        }
        failure {
            echo '❌ Deployment failed!'
            // Optionally rollback on failure:
            // sh "kubectl rollout undo deployment/backend -n ${K8S_NAMESPACE}"
            // sh "kubectl rollout undo deployment/frontend -n ${K8S_NAMESPACE}"
        }
        always {
            // Clean up Docker images to save disk space
            sh "docker image prune -f || true"
        }
    }
}
