const restErrors = require('restify-errors');
const s3Utils = require('./s3-utils');

module.exports = server => {
  server.get('/echo/:name', (req, res, next) => {
    res.send(req.params);
    return next();
  });

  server.get('/song/:id', async (req, res, next) => {
    const { id: songId } = req.params;
    const songStream = await s3Utils.getSongStream(songId);
    if (songStream) {
      songStream.pipe(res);
    } else {
      next(new restErrors.NotFoundError('stream not found'));
    }
  });

  server.get('/songs-list', async (req, res, next) => {
    const songsList = await s3Utils.getSongList();
    res.send(songsList);
    next();
  });
};
