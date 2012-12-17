/*
 * Jade/Slim-style micro-templating in Javascript
 * Copyright (c) Clifford Heath 2012. MIT License.
 */
//https://github.com/umdjs/umd/blob/master/returnExports.js#L40-L60
;(function (root, factory) {
    if (typeof exports === 'object') {
        // node.js / browserify
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else {
        // Browser globals (root is window)
        root.Semper = factory();
  }
}(this, function () {
  var parse =
    function (text) {
      var splitLinesRE = 
	  // Bah, negative look-behind doesn't work: Split up lines where they don't have a trailing backslash
	  // /(?!\\)\r*\n\r*/
	  /\r*\n\r*/,
	  /*
	   * Regular expression to split up each line.
	   *
	   * Here, I'll explain it for you:
	    ^			Start at the start of the line
	    (\s*)		Match all the leading white-space
	    (			Group everything else as match[1]
	      (			Group the first word (the 'cmd'), which is one of:
		\+		a plus sign,, for data drill-down
	      |	!!!		a triple-bang, for the <html> tag
	      |	\/\/		two slashes to introduce a comment
	      |	\|		a pipe symbol, for literal text with interpolations
	      | [#.a-zA-Z]	An alphanumeric tag, usually for an HTML element
		(?:		Tags may contain or start with # and . for id/class
		  [-#._a-zA-Z0-9]*  Continues with alphanumeric, or -.#_
		  [_a-zA-Z0-9]	Must end with alphanumeric or underscore
		)?
	      )?		the cmd is optional
	      (?:		Group an optional attribute list, but don't return it whole
		\(		an actual parenthesis
		(		return the contents in a match group 'attrs'
		  (?:		group alternates, but don't return them
		    '[^']*'	a single-quoted string
		  | "[^"]*"	a double-quoted string
		  | [^)]	Anything except a closing parenthesis
		  )*		The above group, repeated as many times as necessary
		)
		\)		The closing parenthesis
	      )?		The entire attribute list is optional
	      (			Group and return alternate forms of "operator"
		!?		an optional bang and
		[-.=:]		one of these characters
	      |  =		a literal space followed by an equals sign
	      )?		The whole operator is optional
	      )			
	      \s*		any amount of space
	      (.*)		The "rest"
	    )
	   */
	  re = /^(\s*)((\+|!!!|\/\/|\||[a-zA-Z#.](?:[-#._a-zA-Z0-9]*[_a-zA-Z0-9])?)?(?:\(((?:'[^']*'|"[^"]*"|[^)])*)\))?(!?[-.=:]| =)?\s*(.*))/,

	  // Simple string width calculator with tab expansion
	  textWidth = function(text) {
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
	  s = [], t,
	  pop = function(l) {
	    while ((t = s[s.length-1]) && t.level >= l)
	      s.pop().size = parsed.length-t.pos;// Subtree size includes the current instruction
	  },
	  push = function(o) {			// Push a compiled instruction, calculating subtree size
	    if (o.nw === '') return;		// Disregard blank lines
	    o.pos = parsed.length;		// Record the position of this instruction
	    pop(o.level);
	    parsed.push(o);
	    s.push(o);
	  },
	  parseLine = function(text, row, w) {	// Parse text and emit the output expressions
	    var m = re.exec(text);
	    if (m) {
	      var nested = m[5] == ':',
		  rest = nested ? '' : m[6];	// Indexes into 'm' depend on the regexp above
	      w = w || textWidth(m[1]);
	      push({
		level: w,			// The width of the leading white-space
		nw: m[2],			// all following the leading whitespace
		cmd: m[3],			// The leading word or token
		attrs: m[4]||'',		// The contents of a parenthesised attribute list
		op: m[5],			// A trailing op
		rest: rest,			// Rest of the line of text
		row: row			// Line number in the input
	      });
	      if (nested)			// A sub-statement seperated by a colon
		parseLine(m[6], row, w+2);	// Default to 2 additional indent levels
	    }
	    // Uncomment this for complaints about bad template lines:
	    else if (text.length > 0) console.log("Unmatched at "+(row+1)+": '"+text+"'");
	  };

      // Compile the template by splitting it into lines and parsing each line:
      text.split(splitLinesRE).forEach(function(line,row) { parseLine(line, row); });
      pop(0);
      return parsed;
    };

  var expand = 
    function(
	template,		// The template is an array of instructions
	subtree			// subtree is which subtree to process, or all
	// vars			// The last argument passed is a data context for expression evaluation
      ) {
      var args = Array.prototype.slice.call(arguments, 1),
	  lastarg = args[args.length-1],	// Get initial vars from the arguments
	  vars = lastarg,
	  current = vars,			// The data current we drilled-down to
          first = (subtree || 0),		// Default to processing the entire template
	  limit = subtree ? template[subtree].size : template.length,
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
	  evaluate = function(t, row) {	// Evaluate code in the context of current
	    with (current) {
	      try {
		return eval(t);
	      } catch (e) {
		console.log("At "+(row+1)+": Error evaluating '"+t+"': "+e.text+" in the context of ", current);
		return '';
	      }
	    }
	  },
	  substitute = function(t, row) {	// Perform expansion of #{...} inside text
	    return t.
	      // Split the text around #{...}, taking care with embedded JS string constants
	      // If you don't like #{...}, feel free to tweak this regexp.
	      // What? You want me to explain this one also?
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
	slice(first, first+limit).	// Process just the requested part
	map(function(i) {		// Walk through each instruction
	  with (i) {
	    var top = null,		// Reference to the top of the stack
		text = '';

	    if (nw === '')
	      return '';

	    // Pop back to the level of the current line, emitting closing tags
	    while ((top = stack[stack.length-1]) && top.level >= level) {
	      var popped = stack.pop();
	      current = popped.current || current;
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
		current[cmd] = evaluate(rest, row);
		break;

	      case '+' == cmd:
		stack.push({level: level, close:'', current: current});
		current = evaluate(rest, row);
		break;

	      case '|' == cmd:	// Literal text, single and multi-line
		if (rest === '')
		  stack.push({level: level, close:'', mode: 'text'});
		else
		  text +=
		    substitute(nw.substr(2), row) +
		    "\n";
		break;

	      // Iteration:
	      case cmd == 'each':
		current.forEach(function(v) {
		  text += expand(template, template[pos+1].pos, v);
		});
		top['mode'] = 'skip';
		break;

	      // Conditionals:
	      case cmd == 'empty' || cmd == 'present':
		if ((cmd == 'empty') == (!current || (typeof current === 'object' && current.length === 0)))
		  text += expand(template, template[pos+1].pos, current);
		stack.push({level: level, close:'', mode: 'skip'});
		break;

	      // Tags:
	      case cmd && (/^[a-zA-Z.#]/.test(cmd)):
		// Figure out the tag, id and classes
		var tag = 'div';
		var id = null;
		var classes = '';
		cmd.split(/(?=[#.])/).forEach(function(v) {
		  if (v == '.')
		    ; // Just a div, no class or id
		  else if (v[0] === '.')
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
		  top['mode'] = 'skip';
		  if (rest)
		    evaled = evaluate(rest, row);
		  if (op === '=')
		    evaled = escape(evaled);
		  if (op !== '-')
		    text += evaled;
		  top['mode'] = 'text';
		  break;
		case undefined:
		case '':
		  text += (rest === '' ? '\n' : substitute(rest, row));
		}
		break;

	      // Comment
	      case '//' == cmd:
		if (rest === '') {
		  stack.push(top = {level: level, close: '-->\n', mode: 'text'});
		  if (op === '-') {
		    top.mode = 'skip';
		    top.close = '';
		  } else
		    text += "<!--\n";
		} else if (op !== '-')
		  text += "<!-- "+rest+" -->\n";
		break;

	      default:
		throw "Unrecognised command at line "+(row+1)+': '+nw;
	      }
	      break;

	    case 'text':  // mode of a multi-line | or comment
	      if (!top.textDepth)
		top.textDepth = level;
	      text +=     // handle additional indentation
		new Array(level-top.textDepth).join(' ') + escape(substitute(nw, row)) + "\n";
	      break;

/* Unnecessary; any unknown mode means skip
	    case 'skip': // After //-
	      break;
 */
	    }
	    return text;
	  }
	}).
	join('') +
	stack.reverse().map(function(v){return v.close;}).join('');
    };

    return { parse: parse, expand: expand };
  }
));
