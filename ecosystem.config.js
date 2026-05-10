module.exports = {
  apps: [{
    name: "fahadcloud",
    script: ".next/standalone/server.js",
    cwd: "/home/fahad/fahadcloud",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      HOSTNAME: "0.0.0.0"
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: "768M",
    watch: false,
    max_restarts: 10,
    restart_delay: 5000,
    exp_backoff_restart_delay: 1000,
    kill_timeout: 5000,
    listen_timeout: 10000,
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    error_file: "/home/fahad/fahadcloud/logs/error.log",
    out_file: "/home/fahad/fahadcloud/logs/out.log",
    merge_logs: true,
    time: true,
  }]
};

