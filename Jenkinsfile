pipeline {
    agent any

    environment {
        versionTag = "v${BUILD_NUMBER}"
        dockerHub = 'ccr.ccs.tencentyun.com'
        dockerName = 'small-pool-show'
        dockerSpaceName = 'gfcc-frontend'
    }

    stages {
        stage('Build') {
            steps {
                script {
                    withCredentials([
                        usernamePassword(
                            credentialsId: 'tencent-docker-hub',
                            usernameVariable: 'DOCKER_USER',
                            passwordVariable: 'DOCKER_PASS'
                        )
                    ]) {
                        try {
                            sh '''
                                echo "$DOCKER_PASS" | docker login "$dockerHub" --username "$DOCKER_USER" --password-stdin
                                docker build --pull . -t "$dockerName:$versionTag"
                            '''
                        } catch (hudson.AbortException e) {
                            echo "Build failed: ${e.message}"
                            sh 'docker rmi "$dockerName:$versionTag" || true'
                            error('Build failed')
                        }
                    }
                }
            }
        }

        stage('Push') {
            steps {
                script {
                    try {
                        sh '''
                            docker tag "$dockerName:$versionTag" "$dockerHub/$dockerSpaceName/$dockerName:$versionTag"
                            docker push "$dockerHub/$dockerSpaceName/$dockerName:$versionTag"
                        '''
                    } catch (hudson.AbortException e) {
                        echo "Push to hub failed: ${e.message}"
                        error('Push failed')
                    }
                }
            }
        }

        stage('Publish') {
            steps {
                script {
                    withCredentials([
                        sshUserPrivateKey(
                            credentialsId: 'tencent_cloud_credentials_id',
                            keyFileVariable: 'identity',
                            passphraseVariable: 'phrase',
                            usernameVariable: 'userName'
                        ),
                        usernamePassword(
                            credentialsId: 'tencent-docker-hub',
                            usernameVariable: 'DOCKER_USER',
                            passwordVariable: 'DOCKER_PASS'
                        )
                    ]) {
                        def remote = [:]
                        remote.name = 'Tencent'
                        remote.allowAnyHosts = true
                        remote.host = phrase
                        remote.user = userName
                        remote.identityFile = identity

                        sshCommand remote: remote, command: """
                            cd /home/ubuntu/compose/application/small_pool_show
                            echo '${DOCKER_PASS}' | docker login ${dockerHub} --username='${DOCKER_USER}' --password-stdin
                            export IMAGE_TAG=${versionTag}
                            docker compose pull
                            docker compose down
                            docker compose up -d --remove-orphans
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed! Please check the logs.'
        }
    }
}
