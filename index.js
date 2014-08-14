var fs    = require('fs'),
    spawn = require('child_process').spawn;

module.exports = {
  disposables: [],

  configDefaults: {
    binary: "/usr/local/bin/perltidy",
    tidyOnSave: false,
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
            editor.getCursor().setScreenPosition(position);
          });
        });
      }

      else {
        editor.setText('No Perltidy found at "' + path + '".');
      }
    });

    var _this = this;
    var subscription = atom.workspace.observeTextEditors( function (editor) {
        _this.disposables.push(editor.onDidSave(onSave(editor)));
    });
    this.disposables.push(subscription);
  },

  deactivate: function () {
    for( var i=0; i<this.disposables.length; i++) {
      this.disposables[i].dispose();
    }
  },
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

function onSave(editor) {
  return function(event) {
    if (!atom.config.get('perltidy.tidyOnSave')) return;

    var grammar = editor.getGrammar();
    if (!grammar) return;
    if (grammar.scopeName != 'source.perl') return;

    var binary = atom.config.get('perltidy.binary');
    var file = event.path;
    var perltidy = spawn(binary, ['-b', '-bext=/', file]);
    stderr = ''
    perltidy.stderr.on('data', function (data) {
      stderr += data
    });
    perltidy.on('close', function (code) {
      if (code == 0) return;
      console.log('stderr: ' + stderr);
      console.log('child process exited with code ' + code);
    });
  }
}
