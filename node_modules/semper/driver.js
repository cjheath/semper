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
    birth_date: null,
    all_unit: [
      "Algorithms",
      "Data Processing"
    ]
  }
};

var verbose = false;
process.argv.slice(2).forEach(function (val, index, array) {
  switch (val) {
  case '-v':  verbose = true; break;
  default:
    fs.readFile(val, function(err, contents) {
      if (err)
	throw err;
      var parsed = semper.parse(contents.toString());
      if (verbose) console.log(parsed);
      var expanded = semper.expand(parsed, null, 'option1', sample_data);
      console.log(expanded);
    });
  }
});

