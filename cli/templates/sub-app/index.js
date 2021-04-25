const NODE_ENV = process.env.NODE_ENV;

const isEnvDev = (
  NODE_ENV === 'development' ||
  NODE_ENV === 'dev'
);  // NODE_ENV -- development

if (isEnvDev) {
  module.exports = require('./src/index.js');
} else {
  module.exports = require('./dist/index.js');
}