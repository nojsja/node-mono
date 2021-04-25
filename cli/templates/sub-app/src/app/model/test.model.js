const path = require('path');
const { utils } = require('@node-mono/node-common-libs');
const { commonRequest } = utils['Request.js'];

const { testApi } = require(path.join(__dirname, '../api/test.api.js'));

class TestModel {
  constructor() {}

  /* -------------- get func -------------- */

  /* 获取桶生命周期 */
  getTestInfo(req){
    return commonRequest(req.body, testApi.job1, req.headers);
  }

}

module.exports = TestModel;