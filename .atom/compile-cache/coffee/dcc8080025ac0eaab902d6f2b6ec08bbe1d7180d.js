(function() {
  var $, CompositeDisposable, InputView, OutputViewManager, TextEditorView, View, git, notifier, ref, runCommand,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  CompositeDisposable = require('atom').CompositeDisposable;

  ref = require('atom-space-pen-views'), $ = ref.$, TextEditorView = ref.TextEditorView, View = ref.View;

  git = require('../git');

  notifier = require('../notifier');

  OutputViewManager = require('../output-view-manager');

  runCommand = function(repo, args) {
    var promise, view;
    view = OutputViewManager.getView();
    promise = git.cmd(args, {
      cwd: repo.getWorkingDirectory()
    }, {
      color: true
    });
    promise.then(function(data) {
      var msg;
      msg = "git " + (args.join(' ')) + " was successful";
      notifier.addSuccess(msg);
      if ((data != null ? data.length : void 0) > 0) {
        view.showContent(data);
      } else {
        view.reset();
      }
      return git.refresh(repo);
    })["catch"]((function(_this) {
      return function(msg) {
        if ((msg != null ? msg.length : void 0) > 0) {
          view.showContent(msg);
        } else {
          view.reset();
        }
        return git.refresh(repo);
      };
    })(this));
    return promise;
  };

  InputView = (function(superClass) {
    extend(InputView, superClass);

    function InputView() {
      return InputView.__super__.constructor.apply(this, arguments);
    }

    InputView.content = function() {
      return this.div((function(_this) {
        return function() {
          return _this.subview('commandEditor', new TextEditorView({
            mini: true,
            placeholderText: 'Git command and arguments'
          }));
        };
      })(this));
    };

    InputView.prototype.initialize = function(repo1) {
      this.repo = repo1;
      this.disposables = new CompositeDisposable;
      this.currentPane = atom.workspace.getActivePane();
      if (this.panel == null) {
        this.panel = atom.workspace.addModalPanel({
          item: this
        });
      }
      this.panel.show();
      this.commandEditor.focus();
      this.disposables.add(atom.commands.add('atom-text-editor', {
        'core:cancel': (function(_this) {
          return function(e) {
            var ref1;
            if ((ref1 = _this.panel) != null) {
              ref1.destroy();
            }
            _this.currentPane.activate();
            return _this.disposables.dispose();
          };
        })(this)
      }));
      return this.disposables.add(atom.commands.add('atom-text-editor', 'core:confirm', (function(_this) {
        return function(e) {
          var ref1;
          _this.disposables.dispose();
          if ((ref1 = _this.panel) != null) {
            ref1.destroy();
          }
          return runCommand(_this.repo, _this.commandEditor.getText().split(' ')).then(function() {
            _this.currentPane.activate();
            return git.refresh(_this.repo);
          });
        };
      })(this)));
    };

    return InputView;

  })(View);

  module.exports = function(repo, args) {
    if (args == null) {
      args = [];
    }
    if (args.length > 0) {
      return runCommand(repo, args.split(' '));
    } else {
      return new InputView(repo);
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvZ2l0LXBsdXMvbGliL21vZGVscy9naXQtcnVuLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsMEdBQUE7SUFBQTs7O0VBQUMsc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUN4QixNQUE0QixPQUFBLENBQVEsc0JBQVIsQ0FBNUIsRUFBQyxTQUFELEVBQUksbUNBQUosRUFBb0I7O0VBRXBCLEdBQUEsR0FBTSxPQUFBLENBQVEsUUFBUjs7RUFDTixRQUFBLEdBQVcsT0FBQSxDQUFRLGFBQVI7O0VBQ1gsaUJBQUEsR0FBb0IsT0FBQSxDQUFRLHdCQUFSOztFQUVwQixVQUFBLEdBQWEsU0FBQyxJQUFELEVBQU8sSUFBUDtBQUNYLFFBQUE7SUFBQSxJQUFBLEdBQU8saUJBQWlCLENBQUMsT0FBbEIsQ0FBQTtJQUNQLE9BQUEsR0FBVSxHQUFHLENBQUMsR0FBSixDQUFRLElBQVIsRUFBYztNQUFBLEdBQUEsRUFBSyxJQUFJLENBQUMsbUJBQUwsQ0FBQSxDQUFMO0tBQWQsRUFBK0M7TUFBQyxLQUFBLEVBQU8sSUFBUjtLQUEvQztJQUNWLE9BQU8sQ0FBQyxJQUFSLENBQWEsU0FBQyxJQUFEO0FBQ1gsVUFBQTtNQUFBLEdBQUEsR0FBTSxNQUFBLEdBQU0sQ0FBQyxJQUFJLENBQUMsSUFBTCxDQUFVLEdBQVYsQ0FBRCxDQUFOLEdBQXNCO01BQzVCLFFBQVEsQ0FBQyxVQUFULENBQW9CLEdBQXBCO01BQ0Esb0JBQUcsSUFBSSxDQUFFLGdCQUFOLEdBQWUsQ0FBbEI7UUFDRSxJQUFJLENBQUMsV0FBTCxDQUFpQixJQUFqQixFQURGO09BQUEsTUFBQTtRQUdFLElBQUksQ0FBQyxLQUFMLENBQUEsRUFIRjs7YUFJQSxHQUFHLENBQUMsT0FBSixDQUFZLElBQVo7SUFQVyxDQUFiLENBUUEsRUFBQyxLQUFELEVBUkEsQ0FRTyxDQUFBLFNBQUEsS0FBQTthQUFBLFNBQUMsR0FBRDtRQUNMLG1CQUFHLEdBQUcsQ0FBRSxnQkFBTCxHQUFjLENBQWpCO1VBQ0UsSUFBSSxDQUFDLFdBQUwsQ0FBaUIsR0FBakIsRUFERjtTQUFBLE1BQUE7VUFHRSxJQUFJLENBQUMsS0FBTCxDQUFBLEVBSEY7O2VBSUEsR0FBRyxDQUFDLE9BQUosQ0FBWSxJQUFaO01BTEs7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBUlA7QUFjQSxXQUFPO0VBakJJOztFQW1CUDs7Ozs7OztJQUNKLFNBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQTthQUNSLElBQUMsQ0FBQSxHQUFELENBQUssQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUNILEtBQUMsQ0FBQSxPQUFELENBQVMsZUFBVCxFQUEwQixJQUFJLGNBQUosQ0FBbUI7WUFBQSxJQUFBLEVBQU0sSUFBTjtZQUFZLGVBQUEsRUFBaUIsMkJBQTdCO1dBQW5CLENBQTFCO1FBREc7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQUw7SUFEUTs7d0JBSVYsVUFBQSxHQUFZLFNBQUMsS0FBRDtNQUFDLElBQUMsQ0FBQSxPQUFEO01BQ1gsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFJO01BQ25CLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFmLENBQUE7O1FBQ2YsSUFBQyxDQUFBLFFBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFmLENBQTZCO1VBQUEsSUFBQSxFQUFNLElBQU47U0FBN0I7O01BQ1YsSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLENBQUE7TUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLEtBQWYsQ0FBQTtNQUVBLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0Isa0JBQWxCLEVBQXNDO1FBQUEsYUFBQSxFQUFlLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUMsQ0FBRDtBQUNwRSxnQkFBQTs7a0JBQU0sQ0FBRSxPQUFSLENBQUE7O1lBQ0EsS0FBQyxDQUFBLFdBQVcsQ0FBQyxRQUFiLENBQUE7bUJBQ0EsS0FBQyxDQUFBLFdBQVcsQ0FBQyxPQUFiLENBQUE7VUFIb0U7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWY7T0FBdEMsQ0FBakI7YUFLQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGtCQUFsQixFQUFzQyxjQUF0QyxFQUFzRCxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsQ0FBRDtBQUNyRSxjQUFBO1VBQUEsS0FBQyxDQUFBLFdBQVcsQ0FBQyxPQUFiLENBQUE7O2dCQUNNLENBQUUsT0FBUixDQUFBOztpQkFDQSxVQUFBLENBQVcsS0FBQyxDQUFBLElBQVosRUFBa0IsS0FBQyxDQUFBLGFBQWEsQ0FBQyxPQUFmLENBQUEsQ0FBd0IsQ0FBQyxLQUF6QixDQUErQixHQUEvQixDQUFsQixDQUFzRCxDQUFDLElBQXZELENBQTRELFNBQUE7WUFDMUQsS0FBQyxDQUFBLFdBQVcsQ0FBQyxRQUFiLENBQUE7bUJBQ0EsR0FBRyxDQUFDLE9BQUosQ0FBWSxLQUFDLENBQUEsSUFBYjtVQUYwRCxDQUE1RDtRQUhxRTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBdEQsQ0FBakI7SUFaVTs7OztLQUxVOztFQXdCeEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIsU0FBQyxJQUFELEVBQU8sSUFBUDs7TUFBTyxPQUFLOztJQUMzQixJQUFHLElBQUksQ0FBQyxNQUFMLEdBQWMsQ0FBakI7YUFDRSxVQUFBLENBQVcsSUFBWCxFQUFpQixJQUFJLENBQUMsS0FBTCxDQUFXLEdBQVgsQ0FBakIsRUFERjtLQUFBLE1BQUE7YUFHRSxJQUFJLFNBQUosQ0FBYyxJQUFkLEVBSEY7O0VBRGU7QUFsRGpCIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbnskLCBUZXh0RWRpdG9yVmlldywgVmlld30gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcblxuZ2l0ID0gcmVxdWlyZSAnLi4vZ2l0J1xubm90aWZpZXIgPSByZXF1aXJlICcuLi9ub3RpZmllcidcbk91dHB1dFZpZXdNYW5hZ2VyID0gcmVxdWlyZSAnLi4vb3V0cHV0LXZpZXctbWFuYWdlcidcblxucnVuQ29tbWFuZCA9IChyZXBvLCBhcmdzKSAtPlxuICB2aWV3ID0gT3V0cHV0Vmlld01hbmFnZXIuZ2V0VmlldygpXG4gIHByb21pc2UgPSBnaXQuY21kKGFyZ3MsIGN3ZDogcmVwby5nZXRXb3JraW5nRGlyZWN0b3J5KCksIHtjb2xvcjogdHJ1ZX0pXG4gIHByb21pc2UudGhlbiAoZGF0YSkgLT5cbiAgICBtc2cgPSBcImdpdCAje2FyZ3Muam9pbignICcpfSB3YXMgc3VjY2Vzc2Z1bFwiXG4gICAgbm90aWZpZXIuYWRkU3VjY2Vzcyhtc2cpXG4gICAgaWYgZGF0YT8ubGVuZ3RoID4gMFxuICAgICAgdmlldy5zaG93Q29udGVudCBkYXRhXG4gICAgZWxzZVxuICAgICAgdmlldy5yZXNldCgpXG4gICAgZ2l0LnJlZnJlc2ggcmVwb1xuICAuY2F0Y2ggKG1zZykgPT5cbiAgICBpZiBtc2c/Lmxlbmd0aCA+IDBcbiAgICAgIHZpZXcuc2hvd0NvbnRlbnQgbXNnXG4gICAgZWxzZVxuICAgICAgdmlldy5yZXNldCgpXG4gICAgZ2l0LnJlZnJlc2ggcmVwb1xuICByZXR1cm4gcHJvbWlzZVxuXG5jbGFzcyBJbnB1dFZpZXcgZXh0ZW5kcyBWaWV3XG4gIEBjb250ZW50OiAtPlxuICAgIEBkaXYgPT5cbiAgICAgIEBzdWJ2aWV3ICdjb21tYW5kRWRpdG9yJywgbmV3IFRleHRFZGl0b3JWaWV3KG1pbmk6IHRydWUsIHBsYWNlaG9sZGVyVGV4dDogJ0dpdCBjb21tYW5kIGFuZCBhcmd1bWVudHMnKVxuXG4gIGluaXRpYWxpemU6IChAcmVwbykgLT5cbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBjdXJyZW50UGFuZSA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKVxuICAgIEBwYW5lbCA/PSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsKGl0ZW06IHRoaXMpXG4gICAgQHBhbmVsLnNob3coKVxuICAgIEBjb21tYW5kRWRpdG9yLmZvY3VzKClcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20tdGV4dC1lZGl0b3InLCAnY29yZTpjYW5jZWwnOiAoZSkgPT5cbiAgICAgIEBwYW5lbD8uZGVzdHJveSgpXG4gICAgICBAY3VycmVudFBhbmUuYWN0aXZhdGUoKVxuICAgICAgQGRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS10ZXh0LWVkaXRvcicsICdjb3JlOmNvbmZpcm0nLCAoZSkgPT5cbiAgICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICAgIEBwYW5lbD8uZGVzdHJveSgpXG4gICAgICBydW5Db21tYW5kKEByZXBvLCBAY29tbWFuZEVkaXRvci5nZXRUZXh0KCkuc3BsaXQoJyAnKSkudGhlbiA9PlxuICAgICAgICBAY3VycmVudFBhbmUuYWN0aXZhdGUoKVxuICAgICAgICBnaXQucmVmcmVzaCBAcmVwb1xuXG5tb2R1bGUuZXhwb3J0cyA9IChyZXBvLCBhcmdzPVtdKSAtPlxuICBpZiBhcmdzLmxlbmd0aCA+IDBcbiAgICBydW5Db21tYW5kIHJlcG8sIGFyZ3Muc3BsaXQoJyAnKVxuICBlbHNlXG4gICAgbmV3IElucHV0VmlldyhyZXBvKVxuIl19
