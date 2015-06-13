"use strict";

require('es6-promise').polyfill();

var moment = require('moment');
var normalizeName = require('next-build-tools/lib/normalize-name');
var packageJson = require('../../package.json');

var fs = require('fs');
var denodeify = require('denodeify');
var deployStatic = require('next-build-tools').deployStatic;
var GitHubApi = require('github');
var github = new GitHubApi({ version: "3.0.0", debug: false });
var createComment = denodeify(github.issues.createComment);

var LOCAL_PREFIX = "tests/visual/screenshots/";
var AWS_DEST_PREFIX = "image_diffs/" + normalizeName(packageJson.name, { version: false }) + "/" + moment().format('YYYY-MM-DD') + "/" + moment().format('HH:mm') + "-" + process.env.TRAVIS_BUILD_NUMBER + "/";
var AWS_FAILS_INDEX = "https://s3-eu-west-1.amazonaws.com/ft-next-qa/" + AWS_DEST_PREFIX + "failures/index.html";

var results = { successes: [], failures: [] };
if (fs.existsSync(LOCAL_PREFIX + "successes")) {
	results.successes = fs.readdirSync(LOCAL_PREFIX + "successes");
	fs.writeFileSync(LOCAL_PREFIX + "successes/index.html", buildIndexPage(results.successes));
	results.successes = results.successes
		.concat(["index.html"])
		.map(function(screenshot) { return "successes/" + screenshot; });
} else {
	console.log("No screenshots here");
}

if (fs.existsSync(LOCAL_PREFIX + "failures")) {
	results.failures = fs.readdirSync(LOCAL_PREFIX + "failures");
	fs.writeFileSync(LOCAL_PREFIX + "failures/index.html", buildIndexPage(results.failures));
	results.failures = results.failures
		.concat(["index.html"])
		.map(function(failure) { return "failures/" + failure; });
} else {
	console.log("No failures found");
}

deployStatic({
	files: results.successes
		.concat(results.failures)
		.map(function(file) { return LOCAL_PREFIX + file; }),
	destination: AWS_DEST_PREFIX,
	region: 'eu-west-1',
	bucket: 'ft-next-qa',
	strip: 3
})

	// Make a comment if a changed has been detected and it's a PR build
	.then(function() {
		var pullRequest = process.env.TRAVIS_PULL_REQUEST;
		var repoSlug = process.env.TRAVIS_REPO_SLUG.split('/');

		if (pullRequest !== "false" && results.failures.length > 0) {
			github.authenticate({ type: "oauth", token: process.env.GITHUB_OAUTH });
			return createComment({
					user: repoSlug[0],
					repo: repoSlug[1],
					number: pullRequest,
					body: "[Image diffs found between branch and production](" + AWS_FAILS_INDEX + ")"
				});
		} else {
			console.log("No comments to make to Pull Request");
		}
	})
	.then(function() {
		console.log("finished visual regression tests");
		process.exit(0);
	})
	.catch(function(err) {
		console.log("there was an error");
		console.log(err.stack);
		process.exit(1);
	});

function buildIndexPage(screenshots) {
	var html = "<html><body>";
	for (var j = 0; j < screenshots.length; j++) {
		if (screenshots[j].indexOf("base.png") !== -1) {
			var matchingshot = screenshots[j].replace("base.png", "test.png");
			html += "<p>" + screenshots[j] + "</p>" +
			'<p><p></p></p><img src="' + screenshots[j] + '">' + "</p>";
			html += "<p>" + matchingshot + "</p>" +
			'<p><p></p><img src="' + matchingshot + '">' + "</p>";
		}
		if (screenshots[j].indexOf("fail.png") !== -1){
			html += "<p>" + screenshots[j] + "</p>" +
			'<p><p></p></p><img src="' + screenshots[j] + '">' + "</p>";
		}
	}
	html += "</body></html>";
	return html;
}
