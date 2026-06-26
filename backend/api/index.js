let app;

module.exports = async (req, res) => {
  if (!app) {
    const { bootstrap } = require('../dist/main');
    app = await bootstrap();
  }
  app(req, res);
};
