const config = require('./config.json');

module.exports = {
  "entry": "./index.js",
  "-o": "dist",
  "-e": [
    ...config.registry.map(item => item.name),
    ...[]
  ],
  "--target": "es2020"
}