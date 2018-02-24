const path = require('path');

/**
 * Given a file name like XX-BB-CC-RT.mp3
 * it returns XX-BB-CC-RT
 * @param {string} fileName - Any file name
 * @returns {string}
 */
function getIdFromFileName(fileName) {
  return path.parse(fileName).name;
}

module.exports = { getIdFromFileName };
