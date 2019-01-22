(function() {
  var CompositeDisposable, Path, cleanup, cleanupUnstagedText, commit, destroyCommitEditor, diffFiles, disposables, fs, getGitStatus, getStagedFiles, git, notifier, parse, prepFile, prettifyFileStatuses, prettifyStagedFiles, prettyifyPreviousFile, showFile,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Path = require('path');

  CompositeDisposable = require('atom').CompositeDisposable;

  fs = require('fs-plus');

  git = require('../git');

  notifier = require('../notifier');

  disposables = new CompositeDisposable;

  prettifyStagedFiles = function(data) {
    var i, mode;
    if (data === '') {
      return [];
    }
    data = data.split(/\0/).slice(0, -1);
    return (function() {
      var j, len, results;
      results = [];
      for (i = j = 0, len = data.length; j < len; i = j += 2) {
        mode = data[i];
        results.push({
          mode: mode,
          path: data[i + 1]
        });
      }
      return results;
    })();
  };

  prettyifyPreviousFile = function(data) {
    return {
      mode: data[0],
      path: data.substring(1).trim()
    };
  };

  prettifyFileStatuses = function(files) {
    return files.map(function(arg) {
      var mode, path;
      mode = arg.mode, path = arg.path;
      switch (mode) {
        case 'M':
          return "modified:   " + path;
        case 'A':
          return "new file:   " + path;
        case 'D':
          return "deleted:   " + path;
        case 'R':
          return "renamed:   " + path;
      }
    });
  };

  getStagedFiles = function(repo) {
    return git.stagedFiles(repo).then(function(files) {
      var args;
      if (files.length >= 1) {
        args = ['diff-index', '--no-color', '--cached', 'HEAD', '--name-status', '-z'];
        return git.cmd(args, {
          cwd: repo.getWorkingDirectory()
        }).then(function(data) {
          return prettifyStagedFiles(data);
        });
      } else {
        return Promise.resolve([]);
      }
    });
  };

  getGitStatus = function(repo) {
    return git.cmd(['-c', 'color.ui=false', 'status'], {
      cwd: repo.getWorkingDirectory()
    });
  };

  diffFiles = function(previousFiles, currentFiles) {
    var currentPaths;
    previousFiles = previousFiles.map(function(p) {
      return prettyifyPreviousFile(p);
    });
    currentPaths = currentFiles.map(function(arg) {
      var path;
      path = arg.path;
      return path;
    });
    return previousFiles.filter(function(p) {
      var ref;
      return (ref = p.path, indexOf.call(currentPaths, ref) >= 0) === false;
    });
  };

  parse = function(prevCommit) {
    var firstSpliting, message, prevChangedFiles, replacerRegex, statusRegex;
    statusRegex = /\n{2,}((?:(?::\w{6} \w{6}(?: \w{7}\.{3}){2} [ MADRCU?!]\s+.+?\n?))*)$/;
    firstSpliting = statusRegex.exec(prevCommit);
    if (firstSpliting != null) {
      message = prevCommit.substring(0, firstSpliting.index);
      replacerRegex = /^:\w{6} \w{6}(?: \w{7}\.{3}){2} ([ MADRCU?!].+)$/gm;
      prevChangedFiles = (firstSpliting[1].trim().replace(replacerRegex, "$1")).split('\n');
    } else {
      message = prevCommit.trim();
      prevChangedFiles = [];
    }
    return {
      message: message,
      prevChangedFiles: prevChangedFiles
    };
  };

  cleanupUnstagedText = function(status) {
    var text, unstagedFiles;
    unstagedFiles = status.indexOf("Changes not staged for commit:");
    if (unstagedFiles >= 0) {
      text = status.substring(unstagedFiles);
      return status = (status.substring(0, unstagedFiles - 1)) + "\n" + (text.replace(/\s*\(.*\)\n/g, ""));
    } else {
      return status;
    }
  };

  prepFile = function(arg) {
    var commentChar, currentChanges, filePath, message, nothingToCommit, prevChangedFiles, replacementText, status, textToReplace;
    commentChar = arg.commentChar, message = arg.message, prevChangedFiles = arg.prevChangedFiles, status = arg.status, filePath = arg.filePath;
    status = cleanupUnstagedText(status);
    status = status.replace(/\s*\(.*\)\n/g, "\n").replace(/\n/g, "\n" + commentChar + " ");
    if (prevChangedFiles.length > 0) {
      nothingToCommit = "nothing to commit, working directory clean";
      currentChanges = "committed:\n" + commentChar;
      textToReplace = null;
      if (status.indexOf(nothingToCommit) > -1) {
        textToReplace = nothingToCommit;
      } else if (status.indexOf(currentChanges) > -1) {
        textToReplace = currentChanges;
      }
      replacementText = "committed:\n" + (prevChangedFiles.map(function(f) {
        return commentChar + "   " + f;
      }).join("\n"));
      status = status.replace(textToReplace, replacementText);
    }
    return fs.writeFileSync(filePath, message + "\n" + commentChar + " Please enter the commit message for your changes. Lines starting\n" + commentChar + " with '" + commentChar + "' will be ignored, and an empty message aborts the commit.\n" + commentChar + "\n" + commentChar + " " + status);
  };

  showFile = function(filePath) {
    var commitEditor, ref, splitDirection;
    commitEditor = (ref = atom.workspace.paneForURI(filePath)) != null ? ref.itemForURI(filePath) : void 0;
    if (!commitEditor) {
      if (atom.config.get('git-plus.general.openInPane')) {
        splitDirection = atom.config.get('git-plus.general.splitPane');
        atom.workspace.getCenter().getActivePane()["split" + splitDirection]();
      }
      return atom.workspace.open(filePath);
    } else {
      if (atom.config.get('git-plus.general.openInPane')) {
        atom.workspace.paneForURI(filePath).activate();
      } else {
        atom.workspace.paneForURI(filePath).activateItemForURI(filePath);
      }
      return Promise.resolve(commitEditor);
    }
  };

  destroyCommitEditor = function(filePath) {
    var ref, ref1;
    if (atom.config.get('git-plus.general.openInPane')) {
      return (ref = atom.workspace.paneForURI(filePath)) != null ? ref.destroy() : void 0;
    } else {
      return (ref1 = atom.workspace.paneForURI(filePath).itemForURI(filePath)) != null ? ref1.destroy() : void 0;
    }
  };

  commit = function(directory, filePath) {
    var args;
    args = ['commit', '--amend', '--cleanup=strip', "--file=" + filePath];
    return git.cmd(args, {
      cwd: directory
    }).then(function(data) {
      notifier.addSuccess(data);
      destroyCommitEditor(filePath);
      return git.refresh();
    })["catch"](function(data) {
      notifier.addError(data);
      return destroyCommitEditor(filePath);
    });
  };

  cleanup = function(currentPane, filePath) {
    if (currentPane.isAlive()) {
      currentPane.activate();
    }
    return disposables.dispose();
  };

  module.exports = function(repo) {
    var commentChar, currentPane, cwd, filePath, ref;
    currentPane = atom.workspace.getActivePane();
    filePath = Path.join(repo.getPath(), 'COMMIT_EDITMSG');
    cwd = repo.getWorkingDirectory();
    commentChar = (ref = git.getConfig(repo, 'core.commentchar')) != null ? ref : '#';
    return git.cmd(['whatchanged', '-1', '--format=%B'], {
      cwd: cwd
    }).then(function(amend) {
      return parse(amend);
    }).then(function(arg) {
      var message, prevChangedFiles;
      message = arg.message, prevChangedFiles = arg.prevChangedFiles;
      return getStagedFiles(repo).then(function(files) {
        prevChangedFiles = prettifyFileStatuses(diffFiles(prevChangedFiles, files));
        return {
          message: message,
          prevChangedFiles: prevChangedFiles
        };
      });
    }).then(function(arg) {
      var message, prevChangedFiles;
      message = arg.message, prevChangedFiles = arg.prevChangedFiles;
      return getGitStatus(repo).then(function(status) {
        return prepFile({
          commentChar: commentChar,
          message: message,
          prevChangedFiles: prevChangedFiles,
          status: status,
          filePath: filePath
        });
      }).then(function() {
        return showFile(filePath);
      });
    }).then(function(textEditor) {
      disposables.add(textEditor.onDidSave(function() {
        return commit(repo.getWorkingDirectory(), filePath);
      }));
      return disposables.add(textEditor.onDidDestroy(function() {
        return cleanup(currentPane, filePath);
      }));
    })["catch"](function(msg) {
      return notifier.addInfo(msg);
    });
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvZ2l0LXBsdXMvbGliL21vZGVscy9naXQtY29tbWl0LWFtZW5kLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsMFBBQUE7SUFBQTs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ04sc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUN4QixFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7O0VBQ0wsR0FBQSxHQUFNLE9BQUEsQ0FBUSxRQUFSOztFQUNOLFFBQUEsR0FBVyxPQUFBLENBQVEsYUFBUjs7RUFFWCxXQUFBLEdBQWMsSUFBSTs7RUFFbEIsbUJBQUEsR0FBc0IsU0FBQyxJQUFEO0FBQ3BCLFFBQUE7SUFBQSxJQUFhLElBQUEsS0FBUSxFQUFyQjtBQUFBLGFBQU8sR0FBUDs7SUFDQSxJQUFBLEdBQU8sSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFYLENBQWlCOzs7QUFDbkI7V0FBQSxpREFBQTs7cUJBQ0g7VUFBQyxNQUFBLElBQUQ7VUFBTyxJQUFBLEVBQU0sSUFBSyxDQUFBLENBQUEsR0FBRSxDQUFGLENBQWxCOztBQURHOzs7RUFIZTs7RUFNdEIscUJBQUEsR0FBd0IsU0FBQyxJQUFEO1dBQ3RCO01BQUEsSUFBQSxFQUFNLElBQUssQ0FBQSxDQUFBLENBQVg7TUFDQSxJQUFBLEVBQU0sSUFBSSxDQUFDLFNBQUwsQ0FBZSxDQUFmLENBQWlCLENBQUMsSUFBbEIsQ0FBQSxDQUROOztFQURzQjs7RUFJeEIsb0JBQUEsR0FBdUIsU0FBQyxLQUFEO1dBQ3JCLEtBQUssQ0FBQyxHQUFOLENBQVUsU0FBQyxHQUFEO0FBQ1IsVUFBQTtNQURVLGlCQUFNO0FBQ2hCLGNBQU8sSUFBUDtBQUFBLGFBQ08sR0FEUDtpQkFFSSxjQUFBLEdBQWU7QUFGbkIsYUFHTyxHQUhQO2lCQUlJLGNBQUEsR0FBZTtBQUpuQixhQUtPLEdB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QUFBLGdCQUFWOztNQUZJLENBRE47SUFESSxDQUZOLENBT0EsQ0FBQyxJQVBELENBT00sU0FBQyxHQUFEO0FBQ0osVUFBQTtNQURNLHVCQUFTO2FBQ2YsWUFBQSxDQUFhLElBQWIsQ0FDQSxDQUFDLElBREQsQ0FDTSxTQUFDLE1BQUQ7ZUFBWSxRQUFBLENBQVM7VUFBQyxhQUFBLFdBQUQ7VUFBYyxTQUFBLE9BQWQ7VUFBdUIsa0JBQUEsZ0JBQXZCO1VBQXlDLFFBQUEsTUFBekM7VUFBaUQsVUFBQSxRQUFqRDtTQUFUO01BQVosQ0FETixDQUVBLENBQUMsSUFGRCxDQUVNLFNBQUE7ZUFBRyxRQUFBLENBQVMsUUFBVDtNQUFILENBRk47SUFESSxDQVBOLENBV0EsQ0FBQyxJQVhELENBV00sU0FBQyxVQUFEO01BQ0osV0FBVyxDQUFDLEdBQVosQ0FBZ0IsVUFBVSxDQUFDLFNBQVgsQ0FBcUIsU0FBQTtlQUFHLE1BQUEsQ0FBTyxJQUFJLENBQUMsbUJBQUwsQ0FBQSxDQUFQLEVBQW1DLFFBQW5DO01BQUgsQ0FBckIsQ0FBaEI7YUFDQSxXQUFXLENBQUMsR0FBWixDQUFnQixVQUFVLENBQUMsWUFBWCxDQUF3QixTQUFBO2VBQUcsT0FBQSxDQUFRLFdBQVIsRUFBcUIsUUFBckI7TUFBSCxDQUF4QixDQUFoQjtJQUZJLENBWE4sQ0FjQSxFQUFDLEtBQUQsRUFkQSxDQWNPLFNBQUMsR0FBRDthQUFTLFFBQVEsQ0FBQyxPQUFULENBQWlCLEdBQWpCO0lBQVQsQ0FkUDtFQUxlO0FBaElqQiIsInNvdXJjZXNDb250ZW50IjpbIlBhdGggPSByZXF1aXJlICdwYXRoJ1xue0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbmdpdCA9IHJlcXVpcmUgJy4uL2dpdCdcbm5vdGlmaWVyID0gcmVxdWlyZSAnLi4vbm90aWZpZXInXG5cbmRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcblxucHJldHRpZnlTdGFnZWRGaWxlcyA9IChkYXRhKSAtPlxuICByZXR1cm4gW10gaWYgZGF0YSBpcyAnJ1xuICBkYXRhID0gZGF0YS5zcGxpdCgvXFwwLylbLi4uLTFdXG4gIFtdID0gZm9yIG1vZGUsIGkgaW4gZGF0YSBieSAyXG4gICAge21vZGUsIHBhdGg6IGRhdGFbaSsxXSB9XG5cbnByZXR0eWlmeVByZXZpb3VzRmlsZSA9IChkYXRhKSAtPlxuICBtb2RlOiBkYXRhWzBdXG4gIHBhdGg6IGRhdGEuc3Vic3RyaW5nKDEpLnRyaW0oKVxuXG5wcmV0dGlmeUZpbGVTdGF0dXNlcyA9IChmaWxlcykgLT5cbiAgZmlsZXMubWFwICh7bW9kZSwgcGF0aH0pIC0+XG4gICAgc3dpdGNoIG1vZGVcbiAgICAgIHdoZW4gJ00nXG4gICAgICAgIFwibW9kaWZpZWQ6ICAgI3twYXRofVwiXG4gICAgICB3aGVuICdBJ1xuICAgICAgICBcIm5ldyBmaWxlOiAgICN7cGF0aH1cIlxuICAgICAgd2hlbiAnRCdcbiAgICAgICAgXCJkZWxldGVkOiAgICN7cGF0aH1cIlxuICAgICAgd2hlbiAnUidcbiAgICAgICAgXCJyZW5hbWVkOiAgICN7cGF0aH1cIlxuXG5nZXRTdGFnZWRGaWxlcyA9IChyZXBvKSAtPlxuICBnaXQuc3RhZ2VkRmlsZXMocmVwbykudGhlbiAoZmlsZXMpIC0+XG4gICAgaWYgZmlsZXMubGVuZ3RoID49IDFcbiAgICAgIGFyZ3MgPSBbJ2RpZmYtaW5kZXgnLCAnLS1uby1jb2xvcicsICctLWNhY2hlZCcsICdIRUFEJywgJy0tbmFtZS1zdGF0dXMnLCAnLXonXVxuICAgICAgZ2l0LmNtZChhcmdzLCBjd2Q6IHJlcG8uZ2V0V29ya2luZ0RpcmVjdG9yeSgpKVxuICAgICAgLnRoZW4gKGRhdGEpIC0+IHByZXR0aWZ5U3RhZ2VkRmlsZXMgZGF0YVxuICAgIGVsc2VcbiAgICAgIFByb21pc2UucmVzb2x2ZSBbXVxuXG5nZXRHaXRTdGF0dXMgPSAocmVwbykgLT5cbiAgZ2l0LmNtZCBbJy1jJywgJ2NvbG9yLnVpPWZhbHNlJywgJ3N0YXR1cyddLCBjd2Q6IHJlcG8uZ2V0V29ya2luZ0RpcmVjdG9yeSgpXG5cbmRpZmZGaWxlcyA9IChwcmV2aW91c0ZpbGVzLCBjdXJyZW50RmlsZXMpIC0+XG4gIHByZXZpb3VzRmlsZXMgPSBwcmV2aW91c0ZpbGVzLm1hcCAocCkgLT4gcHJldHR5aWZ5UHJldmlvdXNGaWxlIHBcbiAgY3VycmVudFBhdGhzID0gY3VycmVudEZpbGVzLm1hcCAoe3BhdGh9KSAtPiBwYXRoXG4gIHByZXZpb3VzRmlsZXMuZmlsdGVyIChwKSAtPiBwLnBhdGggaW4gY3VycmVudFBhdGhzIGlzIGZhbHNlXG5cbnBhcnNlID0gKHByZXZDb21taXQpIC0+XG4gIHN0YXR1c1JlZ2V4ID0gL1xcbnsyLH0oKD86KD86Olxcd3s2fSBcXHd7Nn0oPzogXFx3ezd9XFwuezN9KXsyfSBbIE1BRFJDVT8hXVxccysuKz9cXG4/KSkqKSQvXG4gIGZpcnN0U3BsaXRpbmcgPSBzdGF0dXNSZWdleC5leGVjIHByZXZDb21taXRcblxuICBpZiBmaXJzdFNwbGl0aW5nP1xuICAgIG1lc3NhZ2UgPSBwcmV2Q29tbWl0LnN1YnN0cmluZyAwLCBmaXJzdFNwbGl0aW5nLmluZGV4XG5cbiAgICByZXBsYWNlclJlZ2V4ID0gL146XFx3ezZ9IFxcd3s2fSg/OiBcXHd7N31cXC57M30pezJ9IChbIE1BRFJDVT8hXS4rKSQvZ21cbiAgICBwcmV2Q2hhbmdlZEZpbGVzID0gKGZpcnN0U3BsaXRpbmdbMV0udHJpbSgpLnJlcGxhY2UgcmVwbGFjZXJSZWdleCwgXCIkMVwiKS5zcGxpdCAnXFxuJ1xuICBlbHNlXG4gICAgbWVzc2FnZSA9IHByZXZDb21taXQudHJpbSgpXG4gICAgcHJldkNoYW5nZWRGaWxlcyA9IFtdXG4gIHttZXNzYWdlLCBwcmV2Q2hhbmdlZEZpbGVzfVxuXG5jbGVhbnVwVW5zdGFnZWRUZXh0ID0gKHN0YXR1cykgLT5cbiAgdW5zdGFnZWRGaWxlcyA9IHN0YXR1cy5pbmRleE9mIFwiQ2hhbmdlcyBub3Qgc3RhZ2VkIGZvciBjb21taXQ6XCJcbiAgaWYgdW5zdGFnZWRGaWxlcyA+PSAwXG4gICAgdGV4dCA9IHN0YXR1cy5zdWJzdHJpbmcgdW5zdGFnZWRGaWxlc1xuICAgIHN0YXR1cyA9IFwiI3tzdGF0dXMuc3Vic3RyaW5nKDAsIHVuc3RhZ2VkRmlsZXMgLSAxKX1cXG4je3RleHQucmVwbGFjZSAvXFxzKlxcKC4qXFwpXFxuL2csIFwiXCJ9XCJcbiAgZWxzZVxuICAgIHN0YXR1c1xuXG5wcmVwRmlsZSA9ICh7Y29tbWVudENoYXIsIG1lc3NhZ2UsIHByZXZDaGFuZ2VkRmlsZXMsIHN0YXR1cywgZmlsZVBhdGh9KSAtPlxuICAgIHN0YXR1cyA9IGNsZWFudXBVbnN0YWdlZFRleHQgc3RhdHVzXG4gICAgc3RhdHVzID0gc3RhdHVzLnJlcGxhY2UoL1xccypcXCguKlxcKVxcbi9nLCBcIlxcblwiKS5yZXBsYWNlKC9cXG4vZywgXCJcXG4je2NvbW1lbnRDaGFyfSBcIilcbiAgICBpZiBwcmV2Q2hhbmdlZEZpbGVzLmxlbmd0aCA+IDBcbiAgICAgIG5vdGhpbmdUb0NvbW1pdCA9IFwibm90aGluZyB0byBjb21taXQsIHdvcmtpbmcgZGlyZWN0b3J5IGNsZWFuXCJcbiAgICAgIGN1cnJlbnRDaGFuZ2VzID0gXCJjb21taXR0ZWQ6XFxuI3tjb21tZW50Q2hhcn1cIlxuICAgICAgdGV4dFRvUmVwbGFjZSA9IG51bGxcbiAgICAgIGlmIHN0YXR1cy5pbmRleE9mKG5vdGhpbmdUb0NvbW1pdCkgPiAtMVxuICAgICAgICB0ZXh0VG9SZXBsYWNlID0gbm90aGluZ1RvQ29tbWl0XG4gICAgICBlbHNlIGlmIHN0YXR1cy5pbmRleE9mKGN1cnJlbnRDaGFuZ2VzKSA+IC0xXG4gICAgICAgIHRleHRUb1JlcGxhY2UgPSBjdXJyZW50Q2hhbmdlc1xuICAgICAgcmVwbGFjZW1lbnRUZXh0ID1cbiAgICAgICAgXCJcIlwiY29tbWl0dGVkOlxuICAgICAgICAje1xuICAgICAgICAgIHByZXZDaGFuZ2VkRmlsZXMubWFwKChmKSAtPiBcIiN7Y29tbWVudENoYXJ9ICAgI3tmfVwiKS5qb2luKFwiXFxuXCIpXG4gICAgICAgIH1cIlwiXCJcbiAgICAgIHN0YXR1cyA9IHN0YXR1cy5yZXBsYWNlIHRleHRUb1JlcGxhY2UsIHJlcGxhY2VtZW50VGV4dFxuICAgIGZzLndyaXRlRmlsZVN5bmMgZmlsZVBhdGgsXG4gICAgICBcIlwiXCIje21lc3NhZ2V9XG4gICAgICAje2NvbW1lbnRDaGFyfSBQbGVhc2UgZW50ZXIgdGhlIGNvbW1pdCBtZXNzYWdlIGZvciB5b3VyIGNoYW5nZXMuIExpbmVzIHN0YXJ0aW5nXG4gICAgICAje2NvbW1lbnRDaGFyfSB3aXRoICcje2NvbW1lbnRDaGFyfScgd2lsbCBiZSBpZ25vcmVkLCBhbmQgYW4gZW1wdHkgbWVzc2FnZSBhYm9ydHMgdGhlIGNvbW1pdC5cbiAgICAgICN7Y29tbWVudENoYXJ9XG4gICAgICAje2NvbW1lbnRDaGFyfSAje3N0YXR1c31cIlwiXCJcblxuc2hvd0ZpbGUgPSAoZmlsZVBhdGgpIC0+XG4gIGNvbW1pdEVkaXRvciA9IGF0b20ud29ya3NwYWNlLnBhbmVGb3JVUkkoZmlsZVBhdGgpPy5pdGVtRm9yVVJJKGZpbGVQYXRoKVxuICBpZiBub3QgY29tbWl0RWRpdG9yXG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCdnaXQtcGx1cy5nZW5lcmFsLm9wZW5JblBhbmUnKVxuICAgICAgc3BsaXREaXJlY3Rpb24gPSBhdG9tLmNvbmZpZy5nZXQoJ2dpdC1wbHVzLmdlbmVyYWwuc3BsaXRQYW5lJylcbiAgICAgIGF0b20ud29ya3NwYWNlLmdldENlbnRlcigpLmdldEFjdGl2ZVBhbmUoKVtcInNwbGl0I3tzcGxpdERpcmVjdGlvbn1cIl0oKVxuICAgIGF0b20ud29ya3NwYWNlLm9wZW4gZmlsZVBhdGhcbiAgZWxzZVxuICAgIGlmIGF0b20uY29uZmlnLmdldCgnZ2l0LXBsdXMuZ2VuZXJhbC5vcGVuSW5QYW5lJylcbiAgICAgIGF0b20ud29ya3NwYWNlLnBhbmVGb3JVUkkoZmlsZVBhdGgpLmFjdGl2YXRlKClcbiAgICBlbHNlXG4gICAgICBhdG9tLndvcmtzcGFjZS5wYW5lRm9yVVJJKGZpbGVQYXRoKS5hY3RpdmF0ZUl0ZW1Gb3JVUkkoZmlsZVBhdGgpXG4gICAgUHJvbWlzZS5yZXNvbHZlKGNvbW1pdEVkaXRvcilcblxuZGVzdHJveUNvbW1pdEVkaXRvciA9IChmaWxlUGF0aCkgLT5cbiAgaWYgYXRvbS5jb25maWcuZ2V0KCdnaXQtcGx1cy5nZW5lcmFsLm9wZW5JblBhbmUnKVxuICAgIGF0b20ud29ya3NwYWNlLnBhbmVGb3JVUkkoZmlsZVBhdGgpPy5kZXN0cm95KClcbiAgZWxzZVxuICAgIGF0b20ud29ya3NwYWNlLnBhbmVGb3JVUkkoZmlsZVBhdGgpLml0ZW1Gb3JVUkkoZmlsZVBhdGgpPy5kZXN0cm95KClcblxuY29tbWl0ID0gKGRpcmVjdG9yeSwgZmlsZVBhdGgpIC0+XG4gIGFyZ3MgPSBbJ2NvbW1pdCcsICctLWFtZW5kJywgJy0tY2xlYW51cD1zdHJpcCcsIFwiLS1maWxlPSN7ZmlsZVBhdGh9XCJdXG4gIGdpdC5jbWQoYXJncywgY3dkOiBkaXJlY3RvcnkpXG4gIC50aGVuIChkYXRhKSAtPlxuICAgIG5vdGlmaWVyLmFkZFN1Y2Nlc3MgZGF0YVxuICAgIGRlc3Ryb3lDb21taXRFZGl0b3IoZmlsZVBhdGgpXG4gICAgZ2l0LnJlZnJlc2goKVxuICAuY2F0Y2ggKGRhdGEpIC0+XG4gICAgbm90aWZpZXIuYWRkRXJyb3IgZGF0YVxuICAgIGRlc3Ryb3lDb21taXRFZGl0b3IoZmlsZVBhdGgpXG5cbmNsZWFudXAgPSAoY3VycmVudFBhbmUsIGZpbGVQYXRoKSAtPlxuICBjdXJyZW50UGFuZS5hY3RpdmF0ZSgpIGlmIGN1cnJlbnRQYW5lLmlzQWxpdmUoKVxuICBkaXNwb3NhYmxlcy5kaXNwb3NlKClcblxubW9kdWxlLmV4cG9ydHMgPSAocmVwbykgLT5cbiAgY3VycmVudFBhbmUgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKClcbiAgZmlsZVBhdGggPSBQYXRoLmpvaW4ocmVwby5nZXRQYXRoKCksICdDT01NSVRfRURJVE1TRycpXG4gIGN3ZCA9IHJlcG8uZ2V0V29ya2luZ0RpcmVjdG9yeSgpXG4gIGNvbW1lbnRDaGFyID0gZ2l0LmdldENvbmZpZyhyZXBvLCAnY29yZS5jb21tZW50Y2hhcicpID8gJyMnXG4gIGdpdC5jbWQoWyd3aGF0Y2hhbmdlZCcsICctMScsICctLWZvcm1hdD0lQiddLCB7Y3dkfSlcbiAgLnRoZW4gKGFtZW5kKSAtPiBwYXJzZSBhbWVuZFxuICAudGhlbiAoe21lc3NhZ2UsIHByZXZDaGFuZ2VkRmlsZXN9KSAtPlxuICAgIGdldFN0YWdlZEZpbGVzKHJlcG8pXG4gICAgLnRoZW4gKGZpbGVzKSAtPlxuICAgICAgcHJldkNoYW5nZWRGaWxlcyA9IHByZXR0aWZ5RmlsZVN0YXR1c2VzKGRpZmZGaWxlcyBwcmV2Q2hhbmdlZEZpbGVzLCBmaWxlcylcbiAgICAgIHttZXNzYWdlLCBwcmV2Q2hhbmdlZEZpbGVzfVxuICAudGhlbiAoe21lc3NhZ2UsIHByZXZDaGFuZ2VkRmlsZXN9KSAtPlxuICAgIGdldEdpdFN0YXR1cyhyZXBvKVxuICAgIC50aGVuIChzdGF0dXMpIC0+IHByZXBGaWxlIHtjb21tZW50Q2hhciwgbWVzc2FnZSwgcHJldkNoYW5nZWRGaWxlcywgc3RhdHVzLCBmaWxlUGF0aH1cbiAgICAudGhlbiAtPiBzaG93RmlsZSBmaWxlUGF0aFxuICAudGhlbiAodGV4dEVkaXRvcikgLT5cbiAgICBkaXNwb3NhYmxlcy5hZGQgdGV4dEVkaXRvci5vbkRpZFNhdmUgLT4gY29tbWl0KHJlcG8uZ2V0V29ya2luZ0RpcmVjdG9yeSgpLCBmaWxlUGF0aClcbiAgICBkaXNwb3NhYmxlcy5hZGQgdGV4dEVkaXRvci5vbkRpZERlc3Ryb3kgLT4gY2xlYW51cCBjdXJyZW50UGFuZSwgZmlsZVBhdGhcbiAgLmNhdGNoIChtc2cpIC0+IG5vdGlmaWVyLmFkZEluZm8gbXNnXG4iXX0=
