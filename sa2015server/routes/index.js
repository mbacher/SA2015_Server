var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'SA 2015 Gruppe 21 Server' });
});

module.exports = router;
