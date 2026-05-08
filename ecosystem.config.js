module.exports = {
  apps: [{
    name: 'fahadcloud',
    script: '.next/standalone/server.js',
    cwd: '/home/fahad/fahadcloud',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0',
    },
    instances: 1,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    watch: false,
    max_memory_restart: '500M',
  }]
};
