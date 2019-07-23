var fs    = require('fs'),
    path  = require('path'),
    spawn = require('child_process').spawn,
    env   = require('process').env;

module.exports = {

  config: {
    binary: {
      type: "string",
      default: "perltidy"
    },
    directories: {
        type: "array",
        default: env['PATH'].split(':')
                            .filter( dir => { return dir.match(/perl5/) } )
                            .concat([ '/usr/local/bin' ])
                            .sort()
                            .filter( function(el,i,a) { return i === a.indexOf(el) } ), // remove duplicates
        items: {
            type: "string"
        }
    },
    options: {
      type: "array",
      default: ["--pro=.../.perltidyrc"],
      items: {
        type: "string"
      }
    }
  },

  activate: function() {
    atom.commands.add('atom-workspace', 'perltidy:tidy', function() {

      var editor  = atom.workspace.getActiveTextEditor();
      var cwd     = path.dirname(editor.getPath());
      var binary  = atom.config.get('perltidy.binary');
      var options = atom.config.get('perltidy.options');

      var directories = atom.config.get('perltidy.directories');
      var actualBinary = directories
            .map( dir => { return `${dir}/${binary}` } )
            .find( bin => { return fs.existsSync(bin) } );

      var selection = editor.getSelectedText();
      var hasSelection = selection !== '';
      var editorText = hasSelection ? selection : editor.getText();

      if (actualBinary) {
        var position = editor.getCursorScreenPosition();
        perlTidy(actualBinary, cwd, options, editorText, function (perl) {
          editor.transact(function() {
            if (hasSelection) {
              editor.insertText(perl);
            }
            else {
              editor.setText(perl);
            }
            editor.getLastCursor().setScreenPosition(position);
          });
        });
      }

      else {
        editor.setText(`No "${binary}" found in PATH (${ directories.join(' ') }).`);
      }
    });
  }
};

function perlTidy(binary, cwd, options, before, cb) {

  var after = '';
  var perltidy = spawn(binary, options, {cwd: cwd, stdio: 'pipe'});
  perltidy.stdin.setEncoding  = 'utf-8';
  perltidy.stdout.setEncoding = 'utf-8';
  perltidy.stdin.end(before);
  perltidy.on('exit', function() {
    cb(after);
  });
  perltidy.stdout.on('data', function(chunk) {
    after += chunk;
  });
}
