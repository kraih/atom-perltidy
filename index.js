var fs    = require('fs'),
    spawn = require('child_process').spawn;

module.exports = {

  config: {
    binary: {
      type: "string",
      default: "/usr/local/bin/perltidy"
    }
  },

  activate: function() {
    atom.commands.add('atom-workspace', 'perltidy:tidy', function() {

      var editor = atom.workspace.getActiveTextEditor();
      var path   = atom.config.get('perltidy.binary');

      if (fs.existsSync(path)) {
        var position = editor.getCursorScreenPosition();
        perlTidy(path, editor.getText(), function (perl) {
          editor.transact(function() {
            editor.setText(perl);
            editor.getLastCursor().setScreenPosition(position);
          });
        });
      }

      else {
        editor.setText('No Perltidy found at "' + path + '".');
      }
    });
  }
};

function perlTidy(path, before, cb) {

  var after = '';
  var perltidy = spawn(path);
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
