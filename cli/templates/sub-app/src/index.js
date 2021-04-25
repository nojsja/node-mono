const express = require('express');
const router = express.Router();
const job1Ctr = require('./app/controller/job1');

/* router - job1 */
job1Ctr(router);

module.exports = router;