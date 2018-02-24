const restify = require('restify');
const restErrors = require('restify-errors');
const metaData = require('./metadata');

const server = restify.createServer({
  name: 'metadata-server',
  version: '1.0.0',
});

server.get('/metaData/:songId', (req, res, next) => {
  const { songId } = req.params;
  if (!songId) return next(new restErrors.BadRequestError('songId is mandatory'));
  const metaDataResult = metaData[songId];
  if (!metaDataResult) return next(new restErrors.NotFoundError(`songId: ${songId} not found`));
  res.send(metaDataResult);
  return next();
});

server.listen(5000, () => {
  console.log('%s listening at %s', server.name, server.url);
});
