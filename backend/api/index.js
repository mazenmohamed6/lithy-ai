const { bootstrap } = require('../dist/main');

let server;

module.exports = async function handler(req, res) {
  if (!server) {
    server = await createApp();
  }
  server(req, res);
};
