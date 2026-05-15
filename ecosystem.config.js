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
    // Use fork mode instead of cluster mode for Next.js standalone
    // Next.js handles its own connection pooling and in-memory state
    // Cluster mode breaks in-memory state sharing (rate limits, sessions, etc.)
    instances: 1,
    exec_mode: "fork",
    autorestart: true,
    max_memory_restart: "768M",
    watch: false,
    min_uptime: "10s",
    max_restarts: 10,
    restart_delay: 5000,
    exp_backoff_restart_delay: 1000,
    kill_timeout: 5000,
    listen_timeout: 10000,
    // Memory optimization
    node_args: "--max-old-space-size=640 --optimize-for-size --gc-interval=100",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    error_file: "./logs/error.log",
    out_file: "./logs/out.log",
    merge_logs: true,
    time: true,
  }]
};
