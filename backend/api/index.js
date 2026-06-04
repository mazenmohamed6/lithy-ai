const { createApp } = require('../dist/app-factory');

let server;

module.exports = async function handler(req, res) {
  if (!server) {
    server = await createApp();
  }
  server(req, res);
};
