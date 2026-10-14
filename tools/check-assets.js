/* Cache-busting tags must match across index.html and js/app.js. Fix with: sh tools/bump-version.sh */(function () {
  var fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
  var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8'), app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
  var tags = (html.match(/(?:styles\.css|data\.js|art\.js|app\.js)\?v=([0-9A-Za-z]+)/g) || []).map(function (x) { return x.split('=')[1]; });
  var m = app.match(/var ASSET_V = '([0-9A-Za-z]+)'/);
  var ok = tags.length === 4 && m && tags.every(function (t) { return t === m[1]; });
  console.log(ok ? 'Asset version tags consistent (' + m[1] + ')' : 'ERROR asset version tags missing or inconsistent: run sh tools/bump-version.sh');
  if (!ok) process.exitCode = 1;
})();
