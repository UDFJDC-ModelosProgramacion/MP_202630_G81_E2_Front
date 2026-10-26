pipeline {
   agent any
   tools { nodejs 'node20' }
   stages {
      stage('Checkout') {
         steps { checkout scm }
      }
      stage('Install') {
         steps { sh 'node -v && npm ci' }
      }
      stage('Lint') {
         steps { sh 'npm run lint' }
      }
      stage('Build') {
         steps { sh 'npm run build' }
      }
      stage('Testing') {
         steps { sh 'npm run test:coverage' }
      }
      stage('Static Analysis') {
         steps {
            script { scannerHome = tool 'sonar-scanner' }
            withSonarQubeEnv('sonarqube') {
               sh "${scannerHome}/bin/sonar-scanner"
            }
         }
      }
   }
   post {
      always { deleteDir() }
   }
}