let cachedApp;
let cachedListener;

async function loadApp() {
  const { bootstrap } = require('../dist/main');
  const app = await bootstrap();
  return app;
}

module.exports = async function handler(req, res) {
  if (!cachedApp) {
    cachedApp = await loadApp();
  }
  cachedApp(req, res);
};
