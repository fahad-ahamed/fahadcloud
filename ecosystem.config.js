module.exports = {
  apps: [{
    name: "fahadcloud",
    script: ".next/standalone/server.js",
    cwd: "/home/fahad/fahadcloud",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      HOSTNAME: "0.0.0.0",
      NODE_OPTIONS: "--max-old-space-size=768",
    },
    // Use fork mode instead of cluster mode for Next.js standalone
    // Next.js handles its own connection pooling and in-memory state
    // Cluster mode breaks in-memory state sharing (rate limits, sessions, etc.)
    instances: 1,
    exec_mode: "fork",
    autorestart: true,
    max_memory_restart: "1G",
    watch: false,
    min_uptime: "10s",
    max_restarts: 10,
    restart_delay: 5000,
    exp_backoff_restart_delay: 1000,
    kill_timeout: 5000,
    listen_timeout: 10000,
    // Production Node.js performance flags
    node_args: "--max-old-space-size=768 --optimize-for-size --gc-interval=100 --max-semi-space-size=16",
    // Cron-style restart for memory leak prevention — restart daily at 3:00 AM
    cron_restart: "0 3 * * *",
    // Logging
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    error_file: "./logs/error.log",
    out_file: "./logs/out.log",
    merge_logs: true,
    time: true,
    // Log rotation via PM2 (pm2-logrotate module recommended)
    // Install: pm2 install pm2-logrotate
    // After install, configure:
    //   pm2 set pm2-logrotate:max_size 50M
    //   pm2 set pm2-logrotate:retain 14
    //   pm2 set pm2-logrotate:compress true
    //   pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
    //   pm2 set pm2-logrotate:rotateModule true
    // Graceful shutdown
    shutdown_with_message: true,
  }]
};
