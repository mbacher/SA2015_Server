var mysql = require('mysql');

//do not use localhost for 'host' as i will try to connect to unix socket
var connectionDetails = {
	host: '127.0.0.1',  
	port: 3306,
	//socketPath: '/run/mysqld/mysqld.sock',
	user: 'softarch_user',
	password: '12345',
	database: 'SA2015',
	multipleStatements: true
};
var connection;

var db = {
	connect: function() {
		connection = mysql.createConnection(connectionDetails);
		connection.connect(function(err) {
			if(err) {
				console.error('error connecting: ' + err.stack);
				return;
			}
			console.log('connected as id ' + connection.threadId);
		});
	},
	end: function() {
		connection.end();
	},
	filterStops: function(filter, onSuccess) {
		var statement = 'SELECT ID, Name, Longitude, Latitude, Wheelchair FROM Stop';
		
		var criterions = [];
		if(filter.id)
			criterions.push('ID = ' + filter.id);
		else {
			if(filter.name)
				criterions.push('Name LIKE "%' + filter.name + '%"');
			if(filter.longitude)
				criterions.push('Longitude ' + (filter.belowlongitude ? '<' : '>') + ' ' + filter.longitude);
			if(filter.latitude)
				criterions.push('Latitude ' + (filter.belowlatitude ? '<' : '>') + ' ' + filter.latitude);
		}
		if(criterions.length)
			statement += ' WHERE ' + criterions.join(' AND ');
		statement += ';';
		
		connection.query(statement, function(err, rows, fields) {
  		if(err)
				throw err;
			
			onSuccess(rows, fields);
		});


	},
	filterRoutes: function(filter, onSuccess) {
		var statement =
			'SELECT r.ID AS "RouteID", r.Name AS "RouteName", s.ID AS "StopID", s.Name AS "StopName", s.Longitude, s.Latitude, s.Wheelchair ' +
			'FROM Route AS r ' +
			'INNER JOIN RouteStop AS rs ON r.ID = rs.Route_ID ' +
			'INNER JOIN Stop AS s ON rs.Stop_ID = s.ID ';
		if(filter.id)
			statement += 'WHERE r.ID = ' + filter.id + ';';
		else
			statement +=
				'WHERE r.ID IN (' +
				'SELECT rs1.Route_ID ' +
				'FROM (' +
				'(SELECT Route_ID, OrderKey FROM RouteStop WHERE ' +
				(filter.fromID 
					? 'Stop_ID = ' + filter.fromID
					: 'Stop_ID IN (SELECT ID FROM Stop WHERE Name like "%' + filter.fromName + '%")') +
				') rs1 ' +
				'INNER JOIN ' +
				'(SELECT Route_ID, OrderKey FROM RouteStop WHERE ' +
				(filter.toID 
					? 'Stop_ID = ' + filter.toID
					: 'Stop_ID IN (SELECT ID FROM Stop WHERE Name like "%' + filter.toName + '%")') +
				') rs2 ' +
				'ON rs1.Route_ID = rs2.Route_ID)' +
				'WHERE rs1.OrderKey < rs2.OrderKey)' +
				'ORDER BY r.ID, rs.OrderKey';
				
		connection.query(statement, function(err, rows, fields) {
  		if(err)
				throw err;
			
			//restructure rows to objects
			var routes = []
			var route;
			rows.forEach(function(stop) {
				if(!route || route.ID != stop.RouteID) {
					route = { ID: stop.RouteID, Name: stop.RouteName, Stops: [] };
					routes.push(route);
				}
				route.Stops.push({ ID: stop.StopID, Name: stop.StopName, Longitude: stop.Longitude, Latitude: stop.Latitude, Wheelchair: stop.Wheelchair });
			}, this);
			
			onSuccess(routes, fields);
		});
	},
	insertRoute: function(route, onSuccess) {
		var statement = 
			'INSERT INTO Route (Name) VALUES ("' + route.name + '");' +
			'SET @Route_Last_ID = LAST_INSERT_ID();' +
			'INSERT INTO RouteStop (Route_ID, Stop_ID) VALUES ';
		route.stops.forEach(function(stop, index) {
			if(index > 0)
				statement += ', '
			statement += '(@Route_Last_ID, ' + stop + ')';
		}, this);
		statement += ';';
				
		connection.query(statement, function(err, result) {
  		if(err)
				throw err;
			
			onSuccess(result[0].insertId);
		});
	}
}

module.exports = db;
