/*
 * Jade/Slim-style micro-templating in Javascript
 * Copyright (c) Clifford Heath 2012. MIT License.
 */
//https://github.com/umdjs/umd/blob/master/returnExports.js#L40-L60
;(function (root, factory) {
    if (typeof exports === 'object') {
        //node.js / browserify
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else {
        // Browser globals (root is window)
        root.Semper = factory();
  }
}(this, function () {
  return {
    parse: function (text) {
      var split_lines_re = 
	  // Bah, negative look-behind doesn't work: Split up lines where they don't have a trailing backslash
	  // /(?!\\)\r*\n\r*/
	  /\r*\n\r*/,
	  // Regular expression to split up each line
	  re = /^(\s*)((\+|!!!|\/\/|\||[a-zA-Z#.][a-zA-Z0-9_#.]*[a-zA-Z0-9_#])(?:\(((?:'[^']*'|"[^"]*"|[^)])*)\))?((?:!?[-.=:]| =)?)\s*(.*))/,
	  /*   This breaks evaluate. I need to revisit it and see what I was trying to do here:
	  re = /^(\s*)((?:(\+|!!!|\/\/|\||[a-zA-Z#.](?:[-a-zA-Z0-9_#.]*[a-zA-Z0-9_#])?)(?:\(((?:'[^']*'|"[^"]*"|[^)])*)\))?((?:!?[-.=:]| =)\s?)?)*(.*))/,
	  */
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
	  parsed = [],				// Array of parsed output expressions
	  parse_line = function(text, row, w) {	// Parse text and emit the output expressions
	    var m = re.exec(text);
	    if (m) {
	      var nested = m[5] == ':',
		  rest = nested ? '' : m[6];	// Indexes into 'm' depend on the regexp above
	      w = w || text_width(m[1]);
	      parsed.push({
		level: w,			// The width of the leading white-space
		nw: m[2],			// all following the leading whitespace
		cmd: m[3],			// The leading word or token
		attrs: m[4]||'',		// The contents of a parenthesised attribute list
		op: m[5],			// A trailing op
		rest: rest,			// Rest of the line of text
		row: row			// Line number in the input
	      });
	      if (nested)			// A sub-statement seperated by a colon
		parse_line(m[6], row, w+2);	// Default to 2 additional indent levels
	    }
	    // Uncomment this for complaints about bad template lines:
	    else if (text.length > 0) console.log("Unmatched at "+(row+1)+": '"+text+"'");
	  };

      // Compile the template by splitting it into lines and parsing each line:
      text.split(split_lines_re).forEach(function(line,row) { parse_line(line, row); });
      return parsed;
    },

    // compile: function(parsed) { ... return the template compiled to a function object */ }

    expand: function(template) {
      var args = Array.prototype.slice.call(arguments, 1);
	  lastarg = args[args.length-1];	// Get initial vars from the arguments
	  vars = (typeof lastarg === 'object') ? args.pop() : {},
	  context = vars;
	  escape = function(t) {		// Minimal HTML escaping function. If you care, extend it.
	    return t.split(/(['"&<>])/).
	      map(function(f) {
		return {
		  '"': "&quot;",
		  '<': "&lt;",
		  '>': "&gt;",
		  '&': "&amp;"
		}[f] || f;
	      }).join('');
	  },
	  evaluate = function(t, row) {	// Evaluate code in the current data context
	    with (context) {
	      try {
		return eval(t);
	      } catch (e) {
		console.log("At "+(row+1)+": Error evaluating '"+t+"': "+e.text+" in the context of ", context);
		return '';
	      }
	    }
	  },
	  substitute = function(t, row) {	// Perform expansion of #{...} inside text
	    return t.
	      // Split the text around #{...}, taking care with embedded JS string constants
	      // If you don't like #{...}, feel free to tweak this regexp.
	      split(/(#\{(?:'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|\{[^}]*}|[^}])*)\}/).
	      map(function(f) {
		if (f.substr(0,2) != '#{')  // } to match the open one
		  return f;
		return escape(evaluate(f.substr(2), row));
	      }).
	      join('');
	  },
	  stack = [];			// The stack; contains closing tags and parsing mode

      return template.			// Map each line of the template into output
	map(function(node) {
	  with (node) {
	    var top = null,		// Reference to the top of the stack
		text = '';

	    if (nw == '')
	      return '';

	    // Pop back to the level of the current line, emitting closing tags
	    while ((top = stack[stack.length-1]) && top.level >= level) {
	      var popped = stack.pop();
	      context = popped.context || context;
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
		context[cmd] = evaluate(rest, row);
		break;

	      case '+' == cmd:
		stack.push({level: level, close:'', context: context});
		context = evaluate(rest, row) || context;
		break;

	      case '|' == cmd:	// Literal text, single and multi-line
		if (rest === '')
		  stack.push({level: level, close:'', mode: 'text'});
		else
		  text +=
		    substitute(nw.substr(2), row) +
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
		  (attrs ? ' '+substitute(attrs, row) : '') +
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
		    evaled = evaluate(rest, row);
		  if (op === '=')
		    evaled = escape(evaled);
		  if (op !== '-')
		    text += evaled;
		  top['mode'] = 'text';
		  break;
		case '':
		  text += (rest === '' ? '\n' : substitute(rest, row));
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
		throw "unrecognised command at "+(row+1);
	      }
	      break;

	    case 'text':  // mode of a multi-line | or comment
	      if (!top.text_depth)
		top.text_depth = level;
	      text +=     // handle additional indentation
		new Array(level-top.text_depth).join(' ') + escape(substitute(nw, row)) + "\n";
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
  }
}));
