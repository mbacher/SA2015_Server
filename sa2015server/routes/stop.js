var express = require('express');
var db = require('../db');

var router = express.Router();

/* 
GET stops for matching criterions

Query string:
{
	id: <numeric>
	
	//or
	
	name?: <string>,
	longitude?: <numeric>,
	latitude?: <numeric>,
	belowlongitude?: <boolean>,
	belowlatitude?: <boolean>
}

Response body:
[
	{ <stop> },
	...
]
*/
router.get('/:id?', function(req, res, next) {
	var filter;
	if(req.params.id)
		filter = { id: req.params.id };
	else {
		filter = req.query;
		if(filter.hasOwnProperty('belowlongitude'))
			filter.belowlongitude = filter.belowlongitude == 'true';
		if(filter.hasOwnProperty('belowlatitude'))
			filter.belowlatitude = filter.belowlatitude == 'true';
	}
  db.connect();
	db.filterStops(filter, function(rows, fields) {
		res.send(rows);
	});
	db.end();
});

module.exports = router;
