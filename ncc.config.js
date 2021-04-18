const path = require('path');
const config = require(path.join(__dirname, './config.json'));

console.log(__dirname);

module.exports = {
  "entry": "./src/index.js",
  "-o": "dist",
  "-e": [
    ...config.registry.map(item => item.name),
    ...[]
  ],
  "--target": "es2020"
}
