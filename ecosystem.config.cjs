module.exports = {
  apps: [
    {
      name: 'bloodnet',
      cwd: '/var/www/bloodnet',
      script: 'npm',
      args: 'run start',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '700M',
      kill_timeout: 10000,
      listen_timeout: 10000,
      min_uptime: '10s',
      restart_delay: 2000,
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      out_file: '/var/www/bloodnet/logs/out.log',
      error_file: '/var/www/bloodnet/logs/error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
