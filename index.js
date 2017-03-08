var fs    = require('fs'),
    path  = require('path'),
    spawn = require('child_process').spawn;

module.exports = {

  config: {
    binary: {
      type: "string",
      default: "/usr/local/bin/perltidy"
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

      var selection = editor.getSelectedText();
      var hasSelection = selection !== '';
      var editorText = hasSelection ? selection : editor.getText();

      if (fs.existsSync(binary)) {
        var position = editor.getCursorScreenPosition();
        perlTidy(binary, cwd, options, editorText, function (perl) {
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
        editor.setText('No Perltidy found at "' + binary + '".');
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
