﻿var reporter = require('nodeunit').reporters.default;

process.chdir(__dirname);
reporter.run([
  'test-game.js'
]);