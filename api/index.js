/**
 * api/index.js - Vercel Serverless Function Entrypoint
 * Bridges incoming HTTP serverless requests to the SG-DIVP requestHandler
 */

const { requestHandler } = require('../server');

module.exports = (req, res) => {
  return requestHandler(req, res);
};
