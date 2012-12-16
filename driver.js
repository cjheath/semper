var semper = require('./semper');
var fs = require('fs');

var sample_data = {
  laugh: 'haha',
  person: {
    home_address: {
      street: "Hill St",
      suburb: "Roseville",
    },
    given_name: "Joe",
    family_name: "Smith",
  }
};

process.argv.slice(2).forEach(function (val, index, array) {
  fs.readFile(val, function(err, contents) {
    if (err)
      throw err;
    var parsed = semper.parse(contents.toString());
    var expanded = semper.expand(parsed, 'option1', sample_data);
    console.log(expanded);
  });
});

