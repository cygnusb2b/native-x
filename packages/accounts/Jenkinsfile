node {
  try {
    stage('Checkout') {
      checkout scm
    }

    stage('Test') {
      sh 'yarn ci'
    }

  } catch (e) {
    slackSend color: 'bad', message: "Failed testing ${env.JOB_NAME} #${env.BUILD_NUMBER} (<${env.BUILD_URL}|View>)"
    throw e
  }
}
