/*
 * Jade/Slim-style micro-templating in Javascript
 */
Semper = {
  // Simple string width calculator with tab expansion
  text_width: function(text) {
    var i, c = 0;
    for (i = 0; i < text.length; i++) {
      if (text.charAt(i) == '\t')
	c = (c+8)&~0x7;
      else
	c++;
    }
    return c;
  },

  compile: function (text) {
    var re = /^(\s*)((!!!|\/\/|\||[a-zA-Z#.][a-zA-Z0-9_#.]*[a-zA-Z0-9_#])(?:\(((?:'[^']*'|"[^"]*"|[^)])*)\))?((?:!?[-.=:]| =)?)\s*(.*))/;
    return text.
      // split(/(?!\\)\r*\n\r*/).	// DOESN'T WORK: Split up lines where they don't have a trailing backslash
      split(/\r*\n\r*/).		// Split up lines
      map(function(v) {			// Break each line into a hash (or null)
	var match = re.exec(v);
	return match === null
	  ? null
	  : { level: Semper.text_width(match[1]),	// The width of the leading white-space
	      nonwhite: match[2],			// all following the leading whitespace
	      command: match[3],			// The leading word or token
	      attrs: match[4],				// The contents of a parenthesised attribute list
	      operator: match[5],			// A trailing operator
	      rest: match[6]				// Rest of the line of text
	    };
      });
    },

  expand: function(template) {
    var stack = [];
    return template.
      map(function(v) {
	if (v === null) return '';  // Ignore unmatched lines
	var level = v.level,
	    command = v.command,
	    attrs = v.attrs,
	    operator = v.operator,
	    rest = v.rest,
	    top = null,
	    text = '';

	// Pop back to the level of the current line, emitting closing tags
	while ((top = stack[stack.length-1]) && top.level >= level) {
	  var popped = stack.pop();
	  text += popped.close;
	}

	// top is either now undefined or contains the top item from the stack
	var mode = (top && top.mode) || 'normal';
	switch (mode) {
	case 'normal':
	  switch (true) {
	  case '!!!' == command:    // REVISIT: attrs, operator, rest all ignored
	    text += "<!DOCTYPE html>\n";
	    break;

	  case ' =' == operator:    // REVISIT: Assignment ignored
	    break;

	  case '|' == command:
	    if (rest == '')
	      stack.push({level: level, close:'', mode: 'text'});
	    else
	      text += v.nonwhite.substr(2)+"\n";
	    break;

	  case /if|else|until|while|unless|each/.test(command):
	    // REVISIT: No conditionals yet
	    break;

	  case /^[a-zA-Z.#]/.test(command):
	    var tag = 'div';
	    var id = null;
	    var classes = '';
	    command.split(/(?=[#.])/).forEach(function(v) {
	      if (v[0] == '.')
		classes += " "+v.substr(1);
	      else if (v[0] == '#')
		id = v.substr(1);
	      else
		tag = v;
	    });
	    text +=
	      "<"+
	      tag+
	      (id == null ? '' : ' id="'+id+'"') +
	      (classes == '' ? '' : ' class="'+classes.trim()+'"') +
	      (attrs ? ' '+attrs : '') +
	      ">" +
	      (rest == '' ? "\n" : rest);
	    // REVISIT: operator is ignored
	    stack.push({level: level, close: "</"+tag+">\n"});
	    break;

	  case '//' == command:
	    if (rest == '') {
	      text += "<!--\n";
	      stack.push({level: level, close: '-->\n', mode: 'text'});
	    } else {
	      text += "<!-- "+rest+" -->\n";
	    }
	    break;

	  default:
	    throw "unrecognised command '"+command+"'";
	  }
	  break;

	case 'text':  // mode of a multi-line | or comment
	  if (!top.text_depth)
	    top.text_depth = level;
	  text +=     // handle additional indentation
	    new Array(level-top.text_depth).join(' ') + v.nonwhite + "\n";
	  break;
	}
	return text;
      }).
      join('') +
      stack.reverse().map(function(v){return v.close;}).join('');
  }
};

var fs = require('fs');
process.argv.slice(2).forEach(function (val, index, array) {
  fs.readFile(val, function(err, contents) {
    if (err)
      throw err;
    var compiled = Semper.compile(contents.toString());
    var expanded = Semper.expand(compiled);
    console.log(expanded);
  });
});
