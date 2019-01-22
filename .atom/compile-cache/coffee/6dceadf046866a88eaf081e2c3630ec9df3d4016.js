(function() {
  var CompositeDisposable, Os, Path, RevisionView, disposables, fs, git, nothingToShow, notifier, prepFile, showFile, splitDiff;

  CompositeDisposable = require('atom').CompositeDisposable;

  Os = require('os');

  Path = require('path');

  fs = require('fs-plus');

  git = require('../git');

  notifier = require('../notifier');

  RevisionView = require('../views/git-revision-view');

  nothingToShow = 'Nothing to show.';

  disposables = new CompositeDisposable;

  showFile = function(filePath) {
    var splitDirection;
    if (atom.config.get('git-plus.general.openInPane')) {
      splitDirection = atom.config.get('git-plus.general.splitPane');
      atom.workspace.getCenter().getActivePane()["split" + splitDirection]();
    }
    return atom.workspace.open(filePath);
  };

  prepFile = function(text, filePath) {
    return new Promise(function(resolve, reject) {
      if ((text != null ? text.length : void 0) === 0) {
        return reject(nothingToShow);
      } else {
        return fs.writeFile(filePath, text, {
          flag: 'w+'
        }, function(err) {
          if (err) {
            return reject(err);
          } else {
            return resolve(true);
          }
        });
      }
    });
  };

  splitDiff = function(repo, pathToFile) {
    return atom.workspace.open(Path.join(repo.getWorkingDirectory(), pathToFile), {
      split: 'left',
      activatePane: false,
      activateItem: true,
      searchAllPanes: false
    }).then(function(editor) {
      return RevisionView.showRevision(repo, editor, repo.branch);
    });
  };

  module.exports = function(repo, arg) {
    var args, diffFilePath, diffStat, file, ref, ref1;
    ref = arg != null ? arg : {}, diffStat = ref.diffStat, file = ref.file;
    if (file == null) {
      file = repo.relativize((ref1 = atom.workspace.getActiveTextEditor()) != null ? ref1.getPath() : void 0);
    }
    if (file && file !== '.' && atom.config.get('git-plus.experimental.useSplitDiff')) {
      return splitDiff(repo, file);
    } else {
      diffFilePath = Path.join(repo.getPath(), "atom_git_plus.diff");
      if (!file) {
        return notifier.addError("No open file. Select 'Diff All'.");
      }
      args = ['diff', '--color=never'];
      if (atom.config.get('git-plus.diffs.includeStagedDiff')) {
        args.push('HEAD');
      }
      if (atom.config.get('git-plus.diffs.wordDiff')) {
        args.push('--word-diff');
      }
      if (!diffStat) {
        args.push(file);
      }
      return git.cmd(args, {
        cwd: repo.getWorkingDirectory()
      }).then(function(data) {
        return prepFile((diffStat != null ? diffStat : '') + data, diffFilePath);
      }).then(function() {
        return showFile(diffFilePath);
      }).then(function(textEditor) {
        return disposables.add(textEditor.onDidDestroy(function() {
          return fs.unlink(diffFilePath);
        }));
      })["catch"](function(err) {
        if (err === nothingToShow) {
          return notifier.addInfo(err);
        } else {
          return notifier.addError(err);
        }
      });
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvZ2l0LXBsdXMvbGliL21vZGVscy9naXQtZGlmZi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFDLHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFDeEIsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSOztFQUNMLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7O0VBRUwsR0FBQSxHQUFNLE9BQUEsQ0FBUSxRQUFSOztFQUNOLFFBQUEsR0FBVyxPQUFBLENBQVEsYUFBUjs7RUFDWCxZQUFBLEdBQWUsT0FBQSxDQUFRLDRCQUFSOztFQUVmLGFBQUEsR0FBZ0I7O0VBRWhCLFdBQUEsR0FBYyxJQUFJOztFQUVsQixRQUFBLEdBQVcsU0FBQyxRQUFEO0FBQ1QsUUFBQTtJQUFBLElBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLDZCQUFoQixDQUFIO01BQ0UsY0FBQSxHQUFpQixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsNEJBQWhCO01BQ2pCLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBZixDQUFBLENBQTBCLENBQUMsYUFBM0IsQ0FBQSxDQUEyQyxDQUFBLE9BQUEsR0FBUSxjQUFSLENBQTNDLENBQUEsRUFGRjs7V0FHQSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQWYsQ0FBb0IsUUFBcEI7RUFKUzs7RUFNWCxRQUFBLEdBQVcsU0FBQyxJQUFELEVBQU8sUUFBUDtXQUNULElBQUksT0FBSixDQUFZLFNBQUMsT0FBRCxFQUFVLE1BQVY7TUFDVixvQkFBRyxJQUFJLENBQUUsZ0JBQU4sS0FBZ0IsQ0FBbkI7ZUFDRSxNQUFBLENBQU8sYUFBUCxFQURGO09BQUEsTUFBQTtlQUdFLEVBQUUsQ0FBQyxTQUFILENBQWEsUUFBYixFQUF1QixJQUF2QixFQUE2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bk9zID0gcmVxdWlyZSAnb3MnXG5QYXRoID0gcmVxdWlyZSAncGF0aCdcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcblxuZ2l0ID0gcmVxdWlyZSAnLi4vZ2l0J1xubm90aWZpZXIgPSByZXF1aXJlICcuLi9ub3RpZmllcidcblJldmlzaW9uVmlldyA9IHJlcXVpcmUgJy4uL3ZpZXdzL2dpdC1yZXZpc2lvbi12aWV3J1xuXG5ub3RoaW5nVG9TaG93ID0gJ05vdGhpbmcgdG8gc2hvdy4nXG5cbmRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcblxuc2hvd0ZpbGUgPSAoZmlsZVBhdGgpIC0+XG4gIGlmIGF0b20uY29uZmlnLmdldCgnZ2l0LXBsdXMuZ2VuZXJhbC5vcGVuSW5QYW5lJylcbiAgICBzcGxpdERpcmVjdGlvbiA9IGF0b20uY29uZmlnLmdldCgnZ2l0LXBsdXMuZ2VuZXJhbC5zcGxpdFBhbmUnKVxuICAgIGF0b20ud29ya3NwYWNlLmdldENlbnRlcigpLmdldEFjdGl2ZVBhbmUoKVtcInNwbGl0I3tzcGxpdERpcmVjdGlvbn1cIl0oKVxuICBhdG9tLndvcmtzcGFjZS5vcGVuKGZpbGVQYXRoKVxuXG5wcmVwRmlsZSA9ICh0ZXh0LCBmaWxlUGF0aCkgLT5cbiAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICBpZiB0ZXh0Py5sZW5ndGggaXMgMFxuICAgICAgcmVqZWN0IG5vdGhpbmdUb1Nob3dcbiAgICBlbHNlXG4gICAgICBmcy53cml0ZUZpbGUgZmlsZVBhdGgsIHRleHQsIGZsYWc6ICd3KycsIChlcnIpIC0+XG4gICAgICAgIGlmIGVyciB0aGVuIHJlamVjdCBlcnIgZWxzZSByZXNvbHZlIHRydWVcblxuc3BsaXREaWZmID0gKHJlcG8sIHBhdGhUb0ZpbGUpIC0+XG4gIGF0b20ud29ya3NwYWNlLm9wZW4oUGF0aC5qb2luKHJlcG8uZ2V0V29ya2luZ0RpcmVjdG9yeSgpLHBhdGhUb0ZpbGUpLCB7XG4gICAgc3BsaXQ6ICdsZWZ0JyxcbiAgICBhY3RpdmF0ZVBhbmU6IGZhbHNlLFxuICAgIGFjdGl2YXRlSXRlbTogdHJ1ZSxcbiAgICBzZWFyY2hBbGxQYW5lczogZmFsc2VcbiAgfSkudGhlbiAoZWRpdG9yKSAtPiBSZXZpc2lvblZpZXcuc2hvd1JldmlzaW9uKHJlcG8sIGVkaXRvciwgcmVwby5icmFuY2gpXG5cbm1vZHVsZS5leHBvcnRzID0gKHJlcG8sIHtkaWZmU3RhdCwgZmlsZX09e30pIC0+XG4gIGZpbGUgPz0gcmVwby5yZWxhdGl2aXplKGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKT8uZ2V0UGF0aCgpKVxuICBpZiBmaWxlIGFuZCBmaWxlIGlzbnQgJy4nIGFuZCBhdG9tLmNvbmZpZy5nZXQoJ2dpdC1wbHVzLmV4cGVyaW1lbnRhbC51c2VTcGxpdERpZmYnKVxuICAgIHNwbGl0RGlmZihyZXBvLCBmaWxlKVxuICBlbHNlXG4gICAgZGlmZkZpbGVQYXRoID0gUGF0aC5qb2luKHJlcG8uZ2V0UGF0aCgpLCBcImF0b21fZ2l0X3BsdXMuZGlmZlwiKVxuICAgIGlmIG5vdCBmaWxlXG4gICAgICByZXR1cm4gbm90aWZpZXIuYWRkRXJyb3IgXCJObyBvcGVuIGZpbGUuIFNlbGVjdCAnRGlmZiBBbGwnLlwiXG4gICAgYXJncyA9IFsnZGlmZicsICctLWNvbG9yPW5ldmVyJ11cbiAgICBhcmdzLnB1c2ggJ0hFQUQnIGlmIGF0b20uY29uZmlnLmdldCAnZ2l0LXBsdXMuZGlmZnMuaW5jbHVkZVN0YWdlZERpZmYnXG4gICAgYXJncy5wdXNoICctLXdvcmQtZGlmZicgaWYgYXRvbS5jb25maWcuZ2V0ICdnaXQtcGx1cy5kaWZmcy53b3JkRGlmZidcbiAgICBhcmdzLnB1c2ggZmlsZSB1bmxlc3MgZGlmZlN0YXRcbiAgICBnaXQuY21kKGFyZ3MsIGN3ZDogcmVwby5nZXRXb3JraW5nRGlyZWN0b3J5KCkpXG4gICAgLnRoZW4gKGRhdGEpIC0+IHByZXBGaWxlKChkaWZmU3RhdCA/ICcnKSArIGRhdGEsIGRpZmZGaWxlUGF0aClcbiAgICAudGhlbiAtPiBzaG93RmlsZSBkaWZmRmlsZVBhdGhcbiAgICAudGhlbiAodGV4dEVkaXRvcikgLT5cbiAgICAgIGRpc3Bvc2FibGVzLmFkZCB0ZXh0RWRpdG9yLm9uRGlkRGVzdHJveSAtPiBmcy51bmxpbmsgZGlmZkZpbGVQYXRoXG4gICAgLmNhdGNoIChlcnIpIC0+XG4gICAgICBpZiBlcnIgaXMgbm90aGluZ1RvU2hvd1xuICAgICAgICBub3RpZmllci5hZGRJbmZvIGVyclxuICAgICAgZWxzZVxuICAgICAgICBub3RpZmllci5hZGRFcnJvciBlcnJcbiJdfQ==
