
/**
 * Module dependencies.
 */

//require('newrelic');

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var fs = require('fs');
var mongo = require('mongodb');
var monk = require('monk');


var ba = require('beer-advocate-api');


var mongouri = 'localhost:27017/alko';

var db = monk(mongouri);
var moment = require('moment');

var cronjob = require('cron').CronJob;

var app = express();

// all environments
app.set('port', process.env.PORT || 2112);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/getBeers', routes.getBeers(db, ba));


var job = new cronjob({
	cronTime: '01 08 * * *',
	onTick: function() {
		console.log("running beerlist update cronjob");
		routes.downloadData(db, fs, http, moment, ba, true);
	},
	timeZone: "Europe/Helsinki"
});

job.start();


routes.downloadData(db, fs, http, moment, ba, false);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
