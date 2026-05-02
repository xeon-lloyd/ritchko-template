const setting = require('./backend/core/setting.js')

module.exports = {
  apps : [{
    name: setting.AppName,
    script: 'server.js',
    
    instances: setting.pm2InstanceCount,
    exec_mode: setting.pm2InstanceCount==1 ? "fork" : "cluster",
    watch: false,
    autorestart: true,
    
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    wait_ready: true,
    listen_timeout: 30000,
  }],
};
