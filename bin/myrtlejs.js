#!/usr/bin/env node
'use strict';

var spawn = require('child_process').spawn;

function toStdOut(data) {
	process.stdout.write(data.toString());
}

function toStdErr(data) {
	process.stderr.write(data.toString());
}

var env = Object.create(process.env);
env.NODE_PATH = __dirname + '/../node_modules/.bin:' + env.NODE_PATH;
var casper = spawn(__dirname + '/../node_modules/.bin/casperjs', ["test", "test/visual/test.js"], { cwd: process.cwd(), env: env });

casper.stdout.on('data', toStdOut);
casper.stderr.on('data', toStdErr);
casper.on('error', function(err) {
	console.log("An error occurred", err);
	process.exit(1);
});
casper.on('close', function(code, signal) {
	if (code === 0) {
		process.exit(0);
	} else {
		console.log("Myrtlejs exited with " + code + ', signal ' + signal);
		process.exit(1);
	}
});