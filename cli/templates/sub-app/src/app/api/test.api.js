const path = require('path');
const { conf: productConfig } = require('@node-mono/node-common-libs');

exports.testApi = {
  job1: {
    url: '/test/job1?&var={var}',
    port: productConfig.ports.rgw,
    method: 'get',
  },
  // api group
  group1: {
    job1: {
      url: '/test/group1/job1',
      method: 'post',
      port: productConfig.ports.object,
    },
  }
};