module.exports = {
  framework: 'vite',
  buildCommand: 'npm run vercel-build',
  outputDirectory: 'dist',
  devCommand: 'npm run dev',
  env: {
    IS_VERCEL: 'true',
    DEPLOYMENT_TYPE: 'web'
  }
}; 