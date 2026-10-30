def run(String command) {
   if (isUnix()) {
      sh command
   } else {
      bat command
   }
}

pipeline {
   agent any
   tools { nodejs 'node20' }
   stages {
      stage('Checkout') {
         steps { checkout scm }
      }
      stage('Install') {
         steps { script { run('node -v && npm ci') } }
      }
      stage('Lint') {
         steps { script { run('npm run lint') } }
      }
      stage('Build') {
         steps { script { run('npm run build') } }
      }
      stage('Testing') {
         steps { script { run('npm run test:coverage') } }
      }
      stage('Static Analysis') {
         steps {
            script {
               def scannerHome = tool 'sonar-scanner'
               withSonarQubeEnv('sonarqube') {
                  run(isUnix() ? "${scannerHome}/bin/sonar-scanner" : "\"${scannerHome}\\bin\\sonar-scanner.bat\"")
               }
            }
         }
      }
   }
   post {
      always { deleteDir() }
   }
}