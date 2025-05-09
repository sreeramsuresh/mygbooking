module.exports = {
  apps: [
    {
      name: "Gbooking",
      script: "server.js", // or index.js, or whatever your entry point is
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
