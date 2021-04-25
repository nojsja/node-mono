const path = require('path');
const { utils } = require('@node-mono/node-common-libs');

const TestModel = require(path.join(__dirname, '../model/test.model.js'));
const testModel = new TestModel();

module.exports = function (router) {

  router.post('/test/job1', function (req, res, next) {
    const { Interceptor } = utils;
    console.log(Interceptor);
    testModel.getTestInfo().then(rsp => {
      res.json(rsp);
    });
  });
}