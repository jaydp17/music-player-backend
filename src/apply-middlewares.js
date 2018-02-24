const restify = require('restify');
const corsMiddleware = require('restify-cors-middleware');

const isProd = process.env.NODE_ENV === 'production';
const origins = ['https://music-player.jaydp.com'];

module.exports = server => {
  if (!isProd) {
    origins.push('http://localhost:3000');
  }
  const cors = corsMiddleware({ origins });

  server.pre(cors.preflight);
  server.use(cors.actual);
  server.use(restify.plugins.acceptParser(server.acceptable));
  server.use(restify.plugins.queryParser());
  server.use(restify.plugins.bodyParser());
};
