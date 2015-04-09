var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var sys = require('sys')
var exec = require('child_process').exec;
var child;

var server;

var WEBHOOK_PORT = process.env.WEBHOOK_PORT || 3000;
var WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'secret';
var RESTART_SCRIPT = process.env.RESTART_SCRIPT || 'ls -al';

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.post('/', function (req, res) {
  console.log('req.body: ', req.body);
  var params = req.body;
  var action = params.action;
  var ref = params.ref;
  var repositoryName = 'oster/PLM';
  var secret = params.secret;
  //var repositoryName = params.repository.full_name;

  if(action === 'push' &&
  	ref === 'refs/heads/prod' &&
  	repositoryName === 'oster/PLM' && 
  	secret === WEBHOOK_SECRET) {
  	launchRestartScript();
  }

  res.send('OK');
});

server = app.listen(WEBHOOK_PORT, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

function launchRestartScript() {
	child = exec(RESTART_SCRIPT, function (error, stdout, stderr) {
		sys.print('stdout: ' + stdout);
		sys.print('stderr: ' + stderr);
		if (error !== null) {
			console.log('exec error: ' + error);
		}
	});
}