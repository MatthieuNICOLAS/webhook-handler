var express = require('express');
var app = express();
var server;

var bodyParser = require('body-parser');
var crypto = require('crypto');

var sys = require('sys');
var spawn = require('child_process').spawn;
var child;

var WEBHOOK_PORT = process.env.WEBHOOK_PORT || 3000;
var WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'secret';
var RESTART_SCRIPT = process.env.RESTART_SCRIPT || 'ls -al';

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

function launchRestartScript() {
  child = spawn(RESTART_SCRIPT, [], {
    detached: true // We don't want to kill the webPLM when the NodeJS server stops
  });
  child.stdout.on('data', 
    function (data) {
        console.log('tail output: ' + data);
    }
  );
  child.stderr.on('data',
    function (data) {
        console.log('err data: ' + data);
    }
  );
  child.unref();
}

function validRequest(req) {
  var hmac;
  var calculatedSignature;
  var payload = req.body;

  hmac = crypto.createHmac('sha1', WEBHOOK_SECRET);
  hmac.update(JSON.stringify(payload));
  calculatedSignature = 'sha1=' + hmac.digest('hex');

  if (req.headers['x-hub-signature'] !== calculatedSignature) {
    return false;
  }
  console.log('All good!');
  return true;
}

app.post('/', function (req, res) {
  var params;
  var action;
  var ref;
  var repositoryName;

  console.log('req.body: ', req.body);

  if(!validRequest(req)) {
    res.sendStatus(403);
  }
  else {
    params = req.body;
    action = params.action;
    ref = params.ref;
    repositoryName = params.repository.full_name;

    if(action === 'push' &&
      ref === 'refs/heads/prod' &&
      repositoryName === 'MatthieuNICOLAS/webPLM') {
      launchRestartScript();
    }
    res.sendStatus(200);
  }
});

server = app.listen(WEBHOOK_PORT, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Webhook handler listening at http://%s:%s', host, port);
});