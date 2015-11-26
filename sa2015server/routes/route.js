var express = require('express');
var db = require('../db');

var router = express.Router();

/* 
GET routes for matching criterions

Query string:
{
	id: <numeric>,
	
	//or
	
	fromID: <numeric>,
	toID: <numeric>
	
	//or
	
	fromName: <string>,
	toName: <string>
}

Response body:
[
	{ 
		ID: <numeric>,
		Name: <string>,
		Stops: [
			{ <Stop> },
			...
		]
	},
	...
]
*/
router.get('/:id?', function(req, res, next) {
	var filter;
	if(req.params.id)
		filter = { id: req.params.id };
	else
		filter = req.query;
  db.connect();
	db.filterRoutes(filter, function(rows, fields) {
		res.send(rows);
	});
	db.end();
});

/* 
PUT new route

Request body:
{
	name: <string>,
	stops: <array of numerics>
}

Response body:
{
	id: <numeric> //id of newly added route
}
*/
router.post('/', function(req, res, next) {
	var route = req.body;
  db.connect();
	db.insertRoute(route, function(insertID) {
		res.send({ id: insertID });
	});
	db.end();
});

module.exports = router;
