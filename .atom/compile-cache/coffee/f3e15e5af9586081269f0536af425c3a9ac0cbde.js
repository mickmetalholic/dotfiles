(function() {
  var CompositeDisposable, Housekeeping, Mixin, fs, path,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  CompositeDisposable = require('atom').CompositeDisposable;

  fs = require("fs-plus");

  path = require("path");

  Mixin = require('mixto');

  module.exports = Housekeeping = (function(superClass) {
    extend(Housekeeping, superClass);

    function Housekeeping() {
      return Housekeeping.__super__.constructor.apply(this, arguments);
    }

    Housekeeping.prototype.initializeHousekeeping = function() {
      this.subscriptions = new CompositeDisposable();
      this.subscriptions.add(this.editor.onDidDestroy((function(_this) {
        return function() {
          _this.cancelUpdate();
          _this.destroyDecoration();
          return _this.subscriptions.dispose();
        };
      })(this)));
      if (this.repositoryForPath(this.editor.getPath())) {
        this.subscribeToRepository();
        this.subscriptions.add(this.editor.onDidStopChanging(this.notifyContentsModified));
        this.subscriptions.add(this.editor.onDidChangePath(this.notifyContentsModified));
        this.subscriptions.add(this.editor.onDidChangeCursorPosition((function(_this) {
          return function() {
            return _this.notifyChangeCursorPosition();
          };
        })(this)));
        this.subscriptions.add(atom.project.onDidChangePaths((function(_this) {
          return function() {
            return _this.subscribeToRepository();
          };
        })(this)));
        this.subscriptions.add(atom.commands.add(this.editorView, 'git-diff-details:toggle-git-diff-details', (function(_this) {
          return function() {
            return _this.toggleShowDiffDetails();
          };
        })(this)));
        this.subscriptions.add(atom.commands.add(this.editorView, {
          'core:close': (function(_this) {
            return function(e) {
              return _this.closeDiffDetails();
            };
          })(this),
          'core:cancel': (function(_this) {
            return function(e) {
              return _this.closeDiffDetails();
            };
          })(this)
        }));
        this.subscriptions.add(atom.commands.add(this.editorView, 'git-diff-details:undo', (function(_this) {
          return function(e) {
            if (_this.showDiffDetails) {
              return _this.undo();
            } else {
              return e.abortKeyBinding();
            }
          };
        })(this)));
        this.subscriptions.add(atom.commands.add(this.editorView, 'git-diff-details:copy', (function(_this) {
          return function(e) {
            if (_this.showDiffDetails) {
              return _this.copy();
            } else {
              return e.abortKeyBinding();
            }
          };
        })(this)));
        return this.scheduleUpdate();
      } else {
        this.subscriptions.add(atom.commands.add(this.editorView, 'git-diff-details:toggle-git-diff-details', function(e) {
          return e.abortKeyBinding();
        }));
        this.subscriptions.add(atom.commands.add(this.editorView, 'git-diff-details:undo', function(e) {
          return e.abortKeyBinding();
        }));
        return this.subscriptions.add(atom.commands.add(this.editorView, 'git-diff-details:copy', function(e) {
          return e.abortKeyBinding();
        }));
      }
    };

    Housekeeping.prototype.repositoryForPath = function(goalPath) {
      var directory, i, j, len, ref;
      ref = atom.project.getDirectories();
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        directory = ref[i];
        if (goalPath === directory.getPath() || directory.contains(goalPath)) {
          return atom.project.getRepositories()[i];
        }
      }
      return null;
    };

    Housekeeping.prototype.subscribeToRepository = function() {
      var repository;
      if (repository = this.repositoryForPath(this.editor.getPath())) {
        this.subscriptions.add(repository.onDidChangeStatuses((function(_this) {
          return function() {
            return _this.scheduleUpdate();
          };
        })(this)));
        return this.subscriptions.add(repository.onDidChangeStatus((function(_this) {
          return function(changedPath) {
            if (changedPath === _this.editor.getPath()) {
              return _this.scheduleUpdate();
            }
          };
        })(this)));
      }
    };

    Housekeeping.prototype.unsubscribeFromCursor = function() {
      var ref;
      if ((ref = this.cursorSubscription) != null) {
        ref.dispose();
      }
      return this.cursorSubscription = null;
    };

    Housekeeping.prototype.cancelUpdate = function() {
      return clearImmediate(this.immediateId);
    };

    Housekeeping.prototype.scheduleUpdate = function() {
      this.cancelUpdate();
      return this.immediateId = setImmediate(this.notifyContentsModified);
    };

    return Housekeeping;

  })(Mixin);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvZ2l0LWRpZmYtZGV0YWlscy9saWIvaG91c2VrZWVwaW5nLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsa0RBQUE7SUFBQTs7O0VBQUMsc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUN4QixFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7O0VBQ0wsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUVQLEtBQUEsR0FBUSxPQUFBLENBQVEsT0FBUjs7RUFFUixNQUFNLENBQUMsT0FBUCxHQUF1Qjs7Ozs7OzsyQkFDckIsc0JBQUEsR0FBd0IsU0FBQTtNQUN0QixJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJLG1CQUFKLENBQUE7TUFDakIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUMsQ0FBQSxNQUFNLENBQUMsWUFBUixDQUFxQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7VUFDdEMsS0FBQyxDQUFBLFlBQUQsQ0FBQTtVQUNBLEtBQUMsQ0FBQSxpQkFBRCxDQUFBO2lCQUNBLEtBQUMsQ0FBQSxhQUFhLENBQUMsT0FBZixDQUFBO1FBSHNDO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFyQixDQUFuQjtNQUtBLElBQUcsSUFBQyxDQUFBLGlCQUFELENBQW1CLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FBUixDQUFBLENBQW5CLENBQUg7UUFDRSxJQUFDLENBQUEscUJBQUQsQ0FBQTtRQUVBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFDLENBQUEsTUFBTSxDQUFDLGlCQUFSLENBQTBCLElBQUMsQ0FBQSxzQkFBM0IsQ0FBbkI7UUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxlQUFSLENBQXdCLElBQUMsQ0FBQSxzQkFBekIsQ0FBbkI7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QUFtQixDQUFFLE9BQXJCLENBQUE7O2FBQ0EsSUFBQyxDQUFBLGtCQUFELEdBQXNCO0lBRkQ7OzJCQUl2QixZQUFBLEdBQWMsU0FBQTthQUNaLGNBQUEsQ0FBZSxJQUFDLENBQUEsV0FBaEI7SUFEWTs7MkJBR2QsY0FBQSxHQUFnQixTQUFBO01BQ2QsSUFBQyxDQUFBLFlBQUQsQ0FBQTthQUNBLElBQUMsQ0FBQSxXQUFELEdBQWUsWUFBQSxDQUFhLElBQUMsQ0FBQSxzQkFBZDtJQUZEOzs7O0tBOUQwQjtBQU41QyIsInNvdXJjZXNDb250ZW50IjpbIntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5mcyA9IHJlcXVpcmUgXCJmcy1wbHVzXCJcbnBhdGggPSByZXF1aXJlIFwicGF0aFwiXG5cbk1peGluID0gcmVxdWlyZSAnbWl4dG8nXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSG91c2VrZWVwaW5nIGV4dGVuZHMgTWl4aW5cbiAgaW5pdGlhbGl6ZUhvdXNla2VlcGluZzogLT5cbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQGVkaXRvci5vbkRpZERlc3Ryb3kgPT5cbiAgICAgIEBjYW5jZWxVcGRhdGUoKVxuICAgICAgQGRlc3Ryb3lEZWNvcmF0aW9uKClcbiAgICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuXG4gICAgaWYgQHJlcG9zaXRvcnlGb3JQYXRoKEBlZGl0b3IuZ2V0UGF0aCgpKVxuICAgICAgQHN1YnNjcmliZVRvUmVwb3NpdG9yeSgpXG5cbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZChAZWRpdG9yLm9uRGlkU3RvcENoYW5naW5nKEBub3RpZnlDb250ZW50c01vZGlmaWVkKSlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZChAZWRpdG9yLm9uRGlkQ2hhbmdlUGF0aChAbm90aWZ5Q29udGVudHNNb2RpZmllZCkpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQoQGVkaXRvci5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKD0+IEBub3RpZnlDaGFuZ2VDdXJzb3JQb3NpdGlvbigpKSlcblxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20ucHJvamVjdC5vbkRpZENoYW5nZVBhdGhzID0+IEBzdWJzY3JpYmVUb1JlcG9zaXRvcnkoKVxuXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgQGVkaXRvclZpZXcsICdnaXQtZGlmZi1kZXRhaWxzOnRvZ2dsZS1naXQtZGlmZi1kZXRhaWxzJywgPT5cbiAgICAgICAgQHRvZ2dsZVNob3dEaWZmRGV0YWlscygpXG5cbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCBAZWRpdG9yVmlldyxcbiAgICAgICAgJ2NvcmU6Y2xvc2UnOiAoZSkgPT4gQGNsb3NlRGlmZkRldGFpbHMoKVxuICAgICAgICAnY29yZTpjYW5jZWwnOiAoZSkgPT4gQGNsb3NlRGlmZkRldGFpbHMoKVxuXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgQGVkaXRvclZpZXcsICdnaXQtZGlmZi1kZXRhaWxzOnVuZG8nLCAoZSkgPT5cbiAgICAgICAgaWYgQHNob3dEaWZmRGV0YWlscyB0aGVuIEB1bmRvKCkgZWxzZSBlLmFib3J0S2V5QmluZGluZygpXG5cbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCBAZWRpdG9yVmlldywgJ2dpdC1kaWZmLWRldGFpbHM6Y29weScsIChlKSA9PlxuICAgICAgICBpZiBAc2hvd0RpZmZEZXRhaWxzIHRoZW4gQGNvcHkoKSBlbHNlIGUuYWJvcnRLZXlCaW5kaW5nKClcblxuICAgICAgQHNjaGVkdWxlVXBkYXRlKClcbiAgICBlbHNlXG4gICAgICAjIGJ5cGFzcyBhbGwga2V5YmluZGluZ3NcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCBAZWRpdG9yVmlldywgJ2dpdC1kaWZmLWRldGFpbHM6dG9nZ2xlLWdpdC1kaWZmLWRldGFpbHMnLCAoZSkgLT5cbiAgICAgICAgZS5hYm9ydEtleUJpbmRpbmcoKVxuXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgQGVkaXRvclZpZXcsICdnaXQtZGlmZi1kZXRhaWxzOnVuZG8nLCAoZSkgLT5cbiAgICAgICAgZS5hYm9ydEtleUJpbmRpbmcoKVxuXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgQGVkaXRvclZpZXcsICdnaXQtZGlmZi1kZXRhaWxzOmNvcHknLCAoZSkgLT5cbiAgICAgICAgZS5hYm9ydEtleUJpbmRpbmcoKVxuXG4gIHJlcG9zaXRvcnlGb3JQYXRoOiAoZ29hbFBhdGgpIC0+XG4gICAgZm9yIGRpcmVjdG9yeSwgaSBpbiBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKVxuICAgICAgaWYgZ29hbFBhdGggaXMgZGlyZWN0b3J5LmdldFBhdGgoKSBvciBkaXJlY3RvcnkuY29udGFpbnMoZ29hbFBhdGgpXG4gICAgICAgIHJldHVybiBhdG9tLnByb2plY3QuZ2V0UmVwb3NpdG9yaWVzKClbaV1cbiAgICBudWxsXG5cbiAgc3Vic2NyaWJlVG9SZXBvc2l0b3J5OiAtPlxuICAgIGlmIHJlcG9zaXRvcnkgPSBAcmVwb3NpdG9yeUZvclBhdGgoQGVkaXRvci5nZXRQYXRoKCkpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgcmVwb3NpdG9yeS5vbkRpZENoYW5nZVN0YXR1c2VzID0+XG4gICAgICAgIEBzY2hlZHVsZVVwZGF0ZSgpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgcmVwb3NpdG9yeS5vbkRpZENoYW5nZVN0YXR1cyAoY2hhbmdlZFBhdGgpID0+XG4gICAgICAgIEBzY2hlZHVsZVVwZGF0ZSgpIGlmIGNoYW5nZWRQYXRoIGlzIEBlZGl0b3IuZ2V0UGF0aCgpXG5cbiAgdW5zdWJzY3JpYmVGcm9tQ3Vyc29yOiAtPlxuICAgIEBjdXJzb3JTdWJzY3JpcHRpb24/LmRpc3Bvc2UoKVxuICAgIEBjdXJzb3JTdWJzY3JpcHRpb24gPSBudWxsXG5cbiAgY2FuY2VsVXBkYXRlOiAtPlxuICAgIGNsZWFySW1tZWRpYXRlKEBpbW1lZGlhdGVJZClcblxuICBzY2hlZHVsZVVwZGF0ZTogLT5cbiAgICBAY2FuY2VsVXBkYXRlKClcbiAgICBAaW1tZWRpYXRlSWQgPSBzZXRJbW1lZGlhdGUoQG5vdGlmeUNvbnRlbnRzTW9kaWZpZWQpXG4iXX0=
