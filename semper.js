/*
 * Jade/Slim-style micro-templating in Javascript
 */
Semper = {
  // Simple string width calculator with tab expansion
  text_width: function(text) {
    var i, c = 0;
    for (i = 0; i < text.length; i++) {
      if (text.charAt(i) === '\t')
	c = (c+8)&~0x7;
      else
	c++;
    }
    return c;
  },

  parse: function (text) {
    var re = /^(\s*)((!!!|\/\/|\||[a-zA-Z#.][a-zA-Z0-9_#.]*[a-zA-Z0-9_#])(?:\(((?:'[^']*'|"[^"]*"|[^)])*)\))?((?:!?[-.=:]| =)?)\s*(.*))/;
    return text.
      // split(/(?!\\)\r*\n\r*/).	// Bah, negative look-behind doesn't work: Split up lines where they don't have a trailing backslash
      split(/\r*\n\r*/).		// Split up lines
      map(function(v) {			// Break each line into a hash (or null)
	var match = re.exec(v);
	return match === null
	  ? null
	  : { level: Semper.text_width(match[1]),	// The width of the leading white-space
	      nw: match[2],				// all following the leading whitespace
	      cmd: match[3],				// The leading word or token
	      attrs: match[4],				// The contents of a parenthesised attribute list
	      op: match[5],				// A trailing op
	      rest: match[6]				// Rest of the line of text
	    };
      });
    },

  // compile: function(parsed) { ... return the template compiled to a function object */ }

  expand: function(template) {
    var args = Array.prototype.slice.call(arguments, 1);
        lastarg = args[args.length-1];
        vars = (typeof lastarg === 'object') ? args.pop() : {};
        substitute = function(t) {
	  return t.
	    // Split the text around #{...}, taking care with embedded JS string constants
	    // If you don't like #{...}, feel free to tweak this regexp.
	    split(/(#\{(?:'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|.)*)\}/).
	    map(function(f) {
	      if (f.substr(0,2) != '#{')
		return f;
	      with (vars) {
		return eval(f.substr(2));
	      }
	    }).
	    join('');
	  },
        stack = [];

    return template.
      map(function(v) {
	if (v === null) return '';  // Ignore unmatched lines
	with (v) {
	  var top = null,
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
	    case '!!!' == cmd:    // REVISIT: attrs, op, rest all ignored
	      text += "<!DOCTYPE html>\n";
	      break;

	    case ' =' == op:    // Assign a variable
	      with (vars) {
		vars[cmd] = eval(rest);
	      }
	      break;

	    case '|' == cmd:	// Literal text, single and multi-line
	      if (rest === '')
		stack.push({level: level, close:'', mode: 'text'});
	      else
		text +=
		  substitute(nw.substr(2)) +
		  "\n";
	      break;

/*
	    case (/if|else|until|while|unless|each/.test(cmd)):
	      // REVISIT: No conditionals yet
	      break;
*/

	    case (/^[a-zA-Z.#]/.test(cmd)):
	      var tag = 'div';
	      var id = null;
	      var classes = '';
	      cmd.split(/(?=[#.])/).forEach(function(v) {
		if (v[0] === '.')
		  classes += " "+v.substr(1);
		else if (v[0] === '#')
		  id = v.substr(1);   // Blow away a previous ID if they used two
		else
		  tag = v;
	      });
	      text +=
		"<"+
		tag+
		(id === null ? '' : ' id="'+id+'"') +
		(classes === '' ? '' : ' class="'+classes.trim()+'"') +
		(attrs ? ' '+substitute(attrs) : '') +
		">" +
		(rest === '' ? "\n" : substitute(rest));
	      // REVISIT: op is ignored
	      stack.push({level: level, close: "</"+tag+">\n"});
	      break;

	    case '//' == cmd:
	      if (rest === '') {
		text += "<!--\n";
		stack.push({level: level, close: '-->\n', mode: 'text'});
	      } else
		text += "<!-- "+rest+" -->\n";
	      break;

	    default:
	      throw "unrecognised '"+cmd+"'";
	    }
	    break;

	  case 'text':  // mode of a multi-line | or comment
	    if (!top.text_depth)
	      top.text_depth = level;
	    text +=     // handle additional indentation
	      new Array(level-top.text_depth).join(' ') + nw + "\n";
	    break;
	  }
	  return text;
	}
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
    var parsed = Semper.parse(contents.toString());
    var expanded = Semper.expand(parsed, 'option1', {laugh: 'haha'});
    console.log(expanded);
  });
});
