var fs    = require('fs'),
    spawn = require('child_process').spawn;

module.exports = {

  configDefaults: {
    binary: "/usr/local/bin/perltidy"
  },

  activate: function() {
    atom.workspaceView.command('perltidy:tidy', function() {

      var editor = atom.workspaceView.getActiveView().editor;
      var path   = atom.config.get('perltidy.binary');

      if (fs.existsSync(path)) {
        perlTidy(path, editor.getText(), function (perl) {
          editor.setText(perl);
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