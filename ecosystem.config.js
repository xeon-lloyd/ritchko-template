module.exports = {
  apps : [{
    name: 'service',
    script: 'server.js',
    instances: 2,
    exec_mode  : "cluster",
    watch: false,
    time: true,
  }],
};
