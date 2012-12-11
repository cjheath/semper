require('./semper');
var fs = require('fs');
process.argv.slice(2).forEach(function (val, index, array) {
  fs.readFile(val, function(err, contents) {
    if (err)
      throw err;
    var parsed = Semper.parse(contents.toString());
    var expanded = Semper.expand(parsed, 'option1', {laugh: 'haha'});
    console.log(expanded);
  });
});

