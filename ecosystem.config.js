module.exports = {
  apps: [{
    name: 'fahadcloud',
    script: 'npm',
    args: 'start',
    cwd: '/home/fahad/fahadcloud',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    max_memory_restart: '500M',
    instances: 1,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    watch: false,
  }]
};
