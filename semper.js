/*
 * Jade/Slim-style micro-templating in Javascript
 * Copyright (c) Clifford Heath 2012. MIT License.
 */
Semper = {
  parse: function (text) {
    var split_lines_re = 
	// Bah, negative look-behind doesn't work: Split up lines where they don't have a trailing backslash
	// /(?!\\)\r*\n\r*/
	/\r*\n\r*/,			// Split up lines
	re = /^(\s*)((!!!|\/\/|\||[a-zA-Z#.][a-zA-Z0-9_#.]*[a-zA-Z0-9_#])(?:\(((?:'[^']*'|"[^"]*"|[^)])*)\))?((?:!?[-.=:]| =)?)\s*(.*))/,
	// Simple string width calculator with tab expansion
	text_width = function(text) {
	  var i, c = 0;
	  for (i = 0; i < text.length; i++) {
	    if (text.charAt(i) === '\t')
	      c = (c+8)&~0x7;
	    else
	      c++;
	  }
	  return c;
	},
	parsed = [],
	emit = function(m, w) {
	  if (m) {
	    var rest = m[5] != ':' ? m[6] : '';
	    w = w || text_width(m[1]);
	    parsed.push({
	      level: w,				// The width of the leading white-space
	      nw: m[2],				// all following the leading whitespace
	      cmd: m[3],			// The leading word or token
	      attrs: m[4]||'',			// The contents of a parenthesised attribute list
	      op: m[5],				// A trailing op
	      rest: rest			// Rest of the line of text
	    });
	    if (m[5] == ':')			// A sub-statement seperated by a colon
	      emit(re.exec(m[6]), w+2);		// Default to 2 additional indent levels
	  }
	};

    text.
      split(split_lines_re).
      forEach(function(v) {
	var match = re.exec(v);
	emit(match);
      });
    return parsed;
  },

  // compile: function(parsed) { ... return the template compiled to a function object */ }

  expand: function(template) {
    var args = Array.prototype.slice.call(arguments, 1);
        lastarg = args[args.length-1];
        vars = (typeof lastarg === 'object') ? args.pop() : {};
	escape = function(t) {
	  return t.split(/(['"&<>])/).
	    map(function(f) {
	      return {
		'"': "&quot;",
		'<': "&lt;",
		'>': "&gt;",
		'&': "&amp;",
	      }[f] || f;
	    }).join('');
	},
	evaluate = function(t) {
	  with (vars) {
	    try {
	      return eval(t);
	    } catch (e) {
	      console.log("Error evaluating '"+t+"': "+e.text);
	      return '';
	    }
	  }
	},
        substitute = function(t) {
	  return t.
	    // Split the text around #{...}, taking care with embedded JS string constants
	    // If you don't like #{...}, feel free to tweak this regexp.
	    split(/(#\{(?:'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|.)*)\}/).
	    map(function(f) {
	      if (f.substr(0,2) != '#{')
		return f;
	      return escape(evaluate(f.substr(2)));
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
		vars[cmd] = evaluate(rest);
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
	      // Figure out the tag, id and classes
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
		">";

	      // Deal with the tag content:
	      stack.push(top = {level: level, close: "</"+tag+">\n"});
	      var evaled = '';
	      switch (op) {
	      case '.':	  // Text block follows
		top['mode'] = 'text';
		break;
	      case '!=':  // code yielding unescaped output
	      case '=':	  // code yielding escaped output
	      case '-':	  // code whose output is ignored
		top['mode'] = 'discard';
		if (rest)
		  evaled = evaluate(rest);
		if (op === '=')
		  evaled = escape(evaled);
		if (op !== '-')
		  text += evaled;
		top['mode'] = 'text';
		break;
	      case '':
		text += (rest === '' ? '\n' : substitute(rest));
	      }
	      break;

	    case '//' == cmd:
	      if (rest === '') {
		stack.push(top = {level: level, close: '-->\n', mode: 'text'});
		if (op === '-') {
		  top.mode = 'discard';
		  top.close = '';
		} else
		  text += "<!--\n";
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
	      new Array(level-top.text_depth).join(' ') + escape(nw) + "\n";
	    break;

/* Unnecessary; any unknown mode means discard
	  case 'discard': // After //-
	    break;
 */
	  }
	  return text;
	}
      }).
      join('') +
      stack.reverse().map(function(v){return v.close;}).join('');
  }
};
