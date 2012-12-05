/*
 * Jade/Slim-style micro-templating in Javascript
 */
function parse(t) {
  var stack = [];
  return t.
    split(/(?!\\)\r*\n\r*/).
    map(function(v) {
      var match = /^(\s*)(!!!|\/\/|\||[a-zA-Z#.][a-zA-Z0-9_#.]*[a-zA-Z0-9_#])(?:\(((?:'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|[^)])*)\))?((?:!?[-.=:]| =)?)\s*(.*)/.exec(v);
      return match === null
	? match
	: { level: match[1].length,
	    command: match[2],
	    attrs: match[3],
	    operator: match[4],
	    rest: match[5]
	  };
    }).
    filter(function(v) {
      return !(v === null); // Drop unmatched/blank lines
    }).
    map(function(v) {
      var text = '';
      var level = v.level;
      var command = v.command;
      var attrs = v.attrs;
      var operator = v.operator;
      var rest = v.rest;
      var top = null;

      while ((top = stack[stack.length-1]) && top.level >= level) {
	var popped = stack.pop();
	text += popped.close;
      }
      // top is either undefined or contains the top item from the stack
      var context = (top && top.context) || 'normal';

      switch (context) {
      case 'normal':
	switch (true) {
	case '!!!' == command:
	  text += "<!DOCTYPE html>\n";
	  break;
	case ' =' == operator:
	  // REVISIT: Assignment ignored
	  break;
	case '|' == command:
	  if (rest == '')
	    stack.push({level: level, close:'', context: 'text'});
	  else
	    text += rest+"\n";
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
	  stack.push({level: level, close: "</"+tag+">\n"});
	  break;

	case '//' == command:
	  if (rest == '') {
	    text += "<!--\n";
	    stack.push({level: level, close: ' -->\n', context: 'comment'});
	  } else {
	    text += "<!-- "+rest+" -->\n";
	  }
	  break;

	default:
	  console.log('>>>>>>>' + command + '<<<<<<');
	  break; // throw "unrecognised";
	}
	break;

      case 'text':  /* context of a | */
	text += command + (attrs||'') + (operator||'') + ' ' + (rest||'') + '\n';
	break;

      case 'comment':  /* context of a // */
	text += command + (attrs||'') + (operator||'') + (rest||'') + '\n';
	break;

      default:
	throw "unknown context"
      }
      return text;
    }).join('') +
    stack.reverse().map(function(v){return v.close;}).join('');
}

var fs = require('fs');
process.argv.slice(2).forEach(function (val, index, array) {
  fs.readFile(val, function(err, contents) {
    if (err)
      throw err;
    console.log(parse(contents.toString()));
  });
});
