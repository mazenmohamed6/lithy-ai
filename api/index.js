let cachedApp;

async function loadApp() {
  const { bootstrap } = require('../backend/dist/main');
  const app = await bootstrap();
  return app;
}

module.exports = async function handler(req, res) {
  if (!cachedApp) {
    try {
      cachedApp = await loadApp();
    } catch (err) {
      console.error('BOOTSTRAP ERROR:', err);
      res.status(500).json({
        ok: false,
        error: 'Bootstrap failed',
        message: err.message,
        stack: err.stack?.split('\n').slice(0, 5).join('\n'),
      });
      return;
    }
  }
  cachedApp(req, res);
};
