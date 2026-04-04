module.exports = {
  apps: [
    {
      name: "funnellead",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      cwd: "/var/www/vhosts/YOUR_DOMAIN/funnellead",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
