(function() {
  var getCommands, git;

  git = require('./git');

  getCommands = function() {
    var GitCheckoutBranch, GitCheckoutNewBranch, GitCherryPick, GitCommit, GitCommitAmend, GitDeleteBranch, GitDiff, GitDiffAll, GitDiffBranchFiles, GitDiffBranches, GitDifftool, GitInit, GitLog, GitMerge, GitOpenChangedFiles, GitRebase, GitRemove, GitRun, GitShow, GitStageFiles, GitStageHunk, GitStashApply, GitStashDrop, GitStashPop, GitStashSave, GitStashSaveMessage, GitStatus, GitTags, ManageStashes, commands, gitAdd, gitAddModified, gitCheckoutFile, gitFetch, gitFetchInAllRepos, gitPull, gitPush, gitReset;
    gitAdd = require('./models/add')["default"];
    gitAddModified = require('./models/add-modified')["default"];
    GitCheckoutNewBranch = require('./models/git-checkout-new-branch');
    GitCheckoutBranch = require('./models/git-checkout-branch');
    GitDeleteBranch = require('./models/git-delete-branch');
    gitCheckoutFile = require('./models/checkout-file')["default"];
    GitCherryPick = require('./models/git-cherry-pick');
    GitCommit = require('./models/git-commit');
    GitCommitAmend = require('./models/git-commit-amend');
    GitDiff = require('./models/git-diff');
    GitDiffBranches = require('./models/git-diff-branches');
    GitDiffBranchFiles = require('./models/git-diff-branch-files');
    GitDifftool = require('./models/git-difftool');
    GitDiffAll = require('./models/git-diff-all');
    gitFetch = require('./models/fetch')["default"];
    gitFetchInAllRepos = require('./models/fetch-in-all-repos')["default"];
    GitInit = require('./models/git-init');
    GitLog = require('./models/git-log');
    gitPull = require('./models/pull')["default"];
    gitPush = require('./models/push')["default"];
    gitReset = require('./models/reset')["default"];
    GitRemove = require('./models/git-remove');
    GitShow = require('./models/git-show');
    GitStageFiles = require('./models/git-stage-files');
    GitStageHunk = require('./models/git-stage-hunk');
    ManageStashes = require('./models/manage-stashes');
    GitStashApply = require('./models/git-stash-apply');
    GitStashDrop = require('./models/git-stash-drop');
    GitStashPop = require('./models/git-stash-pop');
    GitStashSave = require('./models/git-stash-save');
    GitStashSaveMessage = require('./models/git-stash-save-message');
    GitStatus = require('./models/git-status');
    GitTags = require('./models/git-tags');
    GitRun = require('./models/git-run');
    GitMerge = require('./models/git-merge');
    GitRebase = require('./models/git-rebase');
    GitOpenChangedFiles = require('./models/git-open-changed-files');
    commands = [];
    return git.getRepo().then(function(repo) {
      var currentFile, ref;
      currentFile = repo.relativize((ref = atom.workspace.getActiveTextEditor()) != null ? ref.getPath() : void 0);
      git.refresh(repo);
      if (atom.config.get('git-plus.experimental.customCommands')) {
        commands = commands.concat(require('./service').getCustomCommands());
      }
      commands.push(['git-plus:add', 'Add', gitAdd]);
      commands.push(['git-plus:add-modified', 'Add Modified', gitAddModified]);
      commands.push([
        'git-plus:add-all', 'Add All', function() {
          return gitAdd(true);
        }
      ]);
      commands.push([
        'git-plus:log', 'Log', function() {
          return GitLog(repo);
        }
      ]);
      commands.push([
        'git-plus:log-current-file', 'Log Current File', function() {
          return GitLog(repo, {
            onlyCurrentFile: true
          });
        }
      ]);
      commands.push([
        'git-plus:remove-current-file', 'Remove Current File', function() {
          return GitRemove(repo);
        }
      ]);
      commands.push([
        'git-plus:checkout-all-files', 'Checkout All Files', function() {
          return gitCheckoutFile(true);
        }
      ]);
      commands.push([
        'git-plus:checkout-current-file', 'Checkout Current File', function() {
          return gitCheckoutFile();
        }
      ]);
      commands.push([
        'git-plus:commit', 'Commit', function() {
          return GitCommit(repo);
        }
      ]);
      commands.push([
        'git-plus:commit-all', 'Commit All', function() {
          return GitCommit(repo, {
            stageChanges: true
          });
        }
      ]);
      commands.push([
        'git-plus:commit-amend', 'Commit Amend', function() {
          return GitCommitAmend(repo);
        }
      ]);
      commands.push([
        'git-plus:add-and-commit', 'Add And Commit', function() {
          return git.add(repo, {
            file: currentFile
          }).then(function() {
            return GitCommit(repo);
          });
        }
      ]);
      commands.push([
        'git-plus:add-and-commit-and-push', 'Add And Commit And Push', function() {
          return git.add(repo, {
            file: currentFile
          }).then(function() {
            return GitCommit(repo, {
              andPush: true
            });
          });
        }
      ]);
      commands.push([
        'git-plus:add-all-and-commit', 'Add All And Commit', function() {
          return git.add(repo).then(function() {
            return GitCommit(repo);
          });
        }
      ]);
      commands.push([
        'git-plus:add-all-commit-and-push', 'Add All, Commit And Push', function() {
          return git.add(repo).then(function() {
            return GitCommit(repo, {
              andPush: true
            });
          });
        }
      ]);
      commands.push([
        'git-plus:commit-all-and-push', 'Commit All And Push', function() {
          return GitCommit(repo, {
            stageChanges: true,
            andPush: true
          });
        }
      ]);
      commands.push([
        'git-plus:checkout', 'Checkout', function() {
          return GitCheckoutBranch(repo);
        }
      ]);
      commands.push([
        'git-plus:checkout-remote', 'Checkout Remote', function() {
          return GitCheckoutBranch(repo, {
            remote: true
          });
        }
      ]);
      commands.push([
        'git-plus:new-branch', 'Checkout New Branch', function() {
          return GitCheckoutNewBranch(repo);
        }
      ]);
      commands.push([
        'git-plus:delete-local-branch', 'Delete Local Branch', function() {
          return GitDeleteBranch(repo);
        }
      ]);
      commands.push([
        'git-plus:delete-remote-branch', 'Delete Remote Branch', function() {
          return GitDeleteBranch(repo, {
            remote: true
          });
        }
      ]);
      commands.push([
        'git-plus:cherry-pick', 'Cherry-Pick', function() {
          return GitCherryPick(repo);
        }
      ]);
      commands.push([
        'git-plus:diff', 'Diff', function() {
          return GitDiff(repo, {
            file: currentFile
          });
        }
      ]);
      if (atom.config.get('git-plus.experimental.diffBranches')) {
        commands.push([
          'git-plus:diff-branches', 'Diff branches', function() {
            return GitDiffBranches(repo);
          }
        ]);
        commands.push([
          'git-plus:diff-branch-files', 'Diff branch files', function() {
            return GitDiffBranchFiles(repo);
          }
        ]);
      }
      commands.push([
        'git-plus:difftool', 'Difftool', function() {
          return GitDifftool(repo);
        }
      ]);
      commands.push([
        'git-plus:diff-all', 'Diff All', function() {
          return GitDiffAll(repo);
        }
      ]);
      commands.push(['git-plus:fetch', 'Fetch', gitFetch]);
      commands.push(['git-plus:fetch-all', 'Fetch All (Repos & Remotes)', gitFetchInAllRepos]);
      commands.push([
        'git-plus:fetch-prune', 'Fetch Prune', function() {
          return gitFetch({
            prune: true
          });
        }
      ]);
      commands.push(['git-plus:pull', 'Pull', gitPull]);
      commands.push(['git-plus:push', 'Push', gitPush]);
      commands.push([
        'git-plus:push-set-upstream', 'Push -u', function() {
          return gitPush(true);
        }
      ]);
      commands.push([
        'git-plus:remove', 'Remove', function() {
          return GitRemove(repo, {
            showSelector: true
          });
        }
      ]);
      commands.push(['git-plus:reset', 'Reset HEAD', gitReset]);
      commands.push([
        'git-plus:show', 'Show', function() {
          return GitShow(repo);
        }
      ]);
      commands.push([
        'git-plus:stage-files', 'Stage Files', function() {
          return GitStageFiles(repo);
        }
      ]);
      commands.push([
        'git-plus:stage-hunk', 'Stage Hunk', function() {
          return GitStageHunk(repo);
        }
      ]);
      commands.push(['git-plus:manage-stashes', 'Manage Stashes', ManageStashes["default"]]);
      commands.push([
        'git-plus:stash-save', 'Stash: Save Changes', function() {
          return GitStashSave(repo);
        }
      ]);
      commands.push([
        'git-plus:stash-save-message', 'Stash: Save Changes With Message', function() {
          return GitStashSaveMessage(repo);
        }
      ]);
      commands.push([
        'git-plus:stash-pop', 'Stash: Apply (Pop)', function() {
          return GitStashPop(repo);
        }
      ]);
      commands.push([
        'git-plus:stash-apply', 'Stash: Apply (Keep)', function() {
          return GitStashApply(repo);
        }
      ]);
      commands.push([
        'git-plus:stash-delete', 'Stash: Delete (Drop)', function() {
          return GitStashDrop(repo);
        }
      ]);
      commands.push([
        'git-plus:status', 'Status', function() {
          return GitStatus(repo);
        }
      ]);
      commands.push([
        'git-plus:tags', 'Tags', function() {
          return GitTags(repo);
        }
      ]);
      commands.push([
        'git-plus:run', 'Run', function() {
          return new GitRun(repo);
        }
      ]);
      commands.push([
        'git-plus:merge', 'Merge', function() {
          return GitMerge(repo);
        }
      ]);
      commands.push([
        'git-plus:merge-remote', 'Merge Remote', function() {
          return GitMerge(repo, {
            remote: true
          });
        }
      ]);
      commands.push([
        'git-plus:merge-no-fast-forward', 'Merge without fast-forward', function() {
          return GitMerge(repo, {
            noFastForward: true
          });
        }
      ]);
      commands.push([
        'git-plus:rebase', 'Rebase', function() {
          return GitRebase(repo);
        }
      ]);
      commands.push([
        'git-plus:git-open-changed-files', 'Open Changed Files', function() {
          return GitOpenChangedFiles(repo);
        }
      ]);
      return commands;
    });
  };

  module.exports = getCommands;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvZ2l0LXBsdXMvbGliL2dpdC1wbHVzLWNvbW1hbmRzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsR0FBQSxHQUFNLE9BQUEsQ0FBUSxPQUFSOztFQUVOLFdBQUEsR0FBYyxTQUFBO0FBQ1osUUFBQTtJQUFBLE1BQUEsR0FBd0IsT0FBQSxDQUFRLGNBQVIsQ0FBdUIsRUFBQyxPQUFEO0lBQy9DLGNBQUEsR0FBd0IsT0FBQSxDQUFRLHVCQUFSLENBQWdDLEVBQUMsT0FBRDtJQUN4RCxvQkFBQSxHQUF5QixPQUFBLENBQVEsa0NBQVI7SUFDekIsaUJBQUEsR0FBeUIsT0FBQSxDQUFRLDhCQUFSO0lBQ3pCLGVBQUEsR0FBeUIsT0FBQSxDQUFRLDRCQUFSO0lBQ3pCLGVBQUEsR0FBeUIsT0FBQSxDQUFRLHdCQUFSLENBQWlDLEVBQUMsT0FBRDtJQUMxRCxhQUFBLEdBQXlCLE9BQUEsQ0FBUSwwQkFBUjtJQUN6QixTQUFBLEdBQXlCLE9BQUEsQ0FBUSxxQkFBUjtJQUN6QixjQUFBLEdBQXlCLE9BQUEsQ0FBUSwyQkFBUjtJQUN6QixPQUFBLEdBQXlCLE9BQUEsQ0FBUSxtQkFBUjtJQUN6QixlQUFBLEdBQXlCLE9BQUEsQ0FBUSw0QkFBUjtJQUN6QixrQkFBQSxHQUF5QixPQUFBLENBQVEsZ0NBQVI7SUFDekIsV0FBQSxHQUF5QixPQUFBLENBQVEsdUJBQVI7SUFDekIsVUFBQSxHQUF5QixPQUFBLENBQVEsdUJBQVI7SUFDekIsUUFBQSxHQUF5QixPQUFBLENBQVEsZ0JBQVIsQ0FBeUIsRUFBQyxPQUFEO0lBQ2xELGtCQUFBLEdBQWdDLE9BQUEsQ0FBUSw2QkFBUixDQUFzQyxFQUFDLE9BQUQ7SUFDdEUsT0FBQSxHQUF5QixPQUFBLENBQVEsbUJBQVI7SUFDekIsTUFBQSxHQUF5QixPQUFBLENBQVEsa0JBQVI7SUFDekIsT0FBQSxHQUF5QixPQUFBLENBQVEsZUFBUixDQUF3QixFQUFDLE9BQUQ7SUFDakQsT0FBQSxHQUF5QixPQUFBLENBQVEsZUFBUixDQUF3QixFQUFDLE9BQUQ7SUFDakQsUUFBQSxHQUEwQixPQUFBLENBQVEsZ0JBQVIsQ0FBeUIsRUFBQyxPQUFEO0lBQ25ELFNBQUEsR0FBeUIsT0FBQSxDQUFRLHFCQUFSO0lBQ3pCLE9BQUEsR0FBeUIsT0FBQSxDQUFRLG1CQUFSO0lBQ3pCLGFBQUEsR0FBeUIsT0FBQSxDQUFRLDBCQUFSO0lBQ3pCLFlBQUEsR0FBeUIsT0FBQSxDQUFRLHlCQUFSO0lBQ3pCLGFBQUEsR0FBOEIsT0FBQSxDQUFRLHlCQUFSO0lBQzlCLGFBQUEsR0FBeUIsT0FBQSxDQUFRLDBCQUFSO0lBQ3pCLFlBQUEsR0FBeUIsT0FBQSxDQUFRLHlCQUFSO0lBQ3pCLFdBQUEsR0FBeUIsT0FBQSxDQUFRLHdCQUFSO0lBQ3pCLFlBQUEsR0FBeUIsT0FBQSxDQUFRLHlCQUFSO0lBQ3pCLG1CQUFBLEdBQXlCLE9BQUEsQ0FBUSxpQ0FBUjtJQUN6QixTQUFBLEdBQXlCLE9BQUEsQ0FBUSxxQkFBUjtJQUN6QixPQUFBLEdBQXlCLE9BQUEsQ0FBUSxtQkFBUjtJQUN6QixNQUFBLEdBQXlCLE9BQUEsQ0FBUSxrQkFBUjtJQUN6QixRQUFBLEdBQXlCLE9BQUEsQ0FBUSxvQkFBUjtJQUN6QixTQUFBLEdBQXlCLE9BQUEsQ0FBUSxxQkFBUjtJQUN6QixtQkFBQSxHQUF5QixPQUFBLENBQVEsaUNBQVI7SUFFekIsUUFBQSxHQUFXO1dBRVgsR0FBRyxDQUFDLE9BQUosQ0FBQSxDQUNFLENBQUMsSUFESCxDQUNRLFNBQUMsSUFBRDtBQUNKLFVBQUE7TUFBQSxXQUFBLEdBQWMsSUFBSSxDQUFDLFVBQUwsMkRBQW9ELENBQUUsT0FBdEMsQ0FBQSxVQUFoQjtNQUNkLEdBQUcsQ0FBQyxPQUFKLENBQVksSUFBWjtNQUNBLElBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHNDQUFoQixDQUFIO1FBQ0UsUUFBQSxHQUFXLFFBQVEsQ0FBQyxNQUFULENBQWdCLE9BQUEsQ0FBUSxXQUFSLENBQW9CLENBQUMsaUJBQXJCLENBQUEsQ0FBaEIsRUFEYjs7TUFFQSxRQUFRLENBQUMsSUFBVCxDQUFjLENBQUMsY0FBRCxFQUFpQixLQUFqQixFQUF3QixNQUF4QixDQUFkO01BQ0EsUUFBUSxDQUFDLElBQVQsQ0FBYyxDQUFDLHVCQUFELEVBQTBCLGNBQTFCLEVBQTBDLGNBQTFDLENBQWQ7TUFDQSxRQUFRLENBQUMsSUFBVCxDQUFjO1FBQUMsa0JBQUQsRUFBcUIsU0FBckIsRUFBZ0MsU0FBQTtpQkFBRyxNQUFBLENBQU8sSUFBUDtRQUFILENBQWhDO09BQWQ7TUFDQSxRQUFRLENBQUMsSUFBVCxDQUFjO1FBQUMsY0FBRCxFQUFpQixLQUFqQixFQUF3QixTQUFBO2lCQUFHLE1BQUEsQ0FBTyxJQUFQO1FBQUgsQ0FBeEI7T0FBZDtNQUNBLFFBQVEsQ0FBQyxJQUFULENBQWM7UUFBQywyQkFBRCxFQUE4QixrQkFBOUIsRUFBa0QsU0FBQTtpQkFBRyxNQUFBLENBQU8sSUFBUCxFQUFhO1lBQUEsZUFBQSxFQUFpQixJQUFqQjtXQUFiO1FBQUgsQ0FBbEQ7T0FBZDtNQUNBLFFBQVEsQ0FBQyxJQUFULENBQWM7UUFBQyw4QkFBRCxFQUFpQyxxQkFBakMsRUFBd0QsU0FBQTtpQkFBRyxTQUFBLENBQVUsSUFBVjtRQUFILENBQXhEO09BQWQ7TUFDQSxRQUFRLENBQUMsSUFBVCxDQUFjO1FBQUMsNkJBQUQsRUFBZ0Msb0JBQWhDLEVBQXNELFNBQUE7aUJBQUcsZUFBQSxDQUFnQixJQUFoQjtRQUFILENBQXREO09BQWQ7TUFDQSxRQUFRLENBQUMsSUFBVCxDQUFjO1FBQUMsZ0NBQUQsRUFBbUMsdUJBQW5DLEVBQTRELFNBQUE7aUJBQUcsZUFBQSxDQUFBO1FBQUgsQ0FBNUQ7T0FBZDtNQUNBLFFBQVEsQ0FBQyxJQUFULENBQWM7UUFBQyxpQkFBRCxFQUFvQixRQUFwQixFQUE4QixTQUFBO2lCQUFHLFNBQUEsQ0FBVSxJQUFWO1FBQUgsQ0FBOUI7T0FBZDtNQUNBLFFBQVEsQ0FBQyxJQUFULENBQWM7UUFBQyxxQkFBRCxFQUF3QixZQUF4QixFQUFzQyxTQUFBO2lCQUFHLFNBQUEsQ0FBVSxJQUFWLEVBQWdCO1lBQUEsWUFBQSxFQUFjLElBQWQ7V0FBaEI7UUFBSCxDQUF0QztPQUFkO01BQ0EsUUFBUSxDQUFDLElBQVQsQ0FBYztRQUFDLHVCQUFELEVBQTBCLGNBQTFCLEVBQTBDLFNBQUE7aUJBQUcsY0FBQSxDQUFlLElBQWY7UUFBSCxDQUExQztPQUFkO01BQ0EsUUFBUSxDQUFDLElBQVQsQ0FBYztRQUFDLHlCQUFELEVBQTRCLGdCQUE1QixFQUE4QyxTQUFBO2lCQUFHLEdBQUcsQ0FBQyxHQUFKLENBQVEsSUFBUixFQUFjO1lBQUEsSUFBQSxFQUFNLFdBQU47V0FBZCxDQUFnQyxDQUFDLElBQWpDLENBQXNDLFNBQUE7bUJBQUcsU0FBQSxDQUFVLElBQVY7VUFBSCxDQUF0QztRQUFILENBQTlDO09BQWQ7TUFDQSxRQUFRLENBQUMsSUFBVCxDQUFjO1FBQUMsa0NBQUQsRUFBcUMseUJBQXJDLEVBQWdFLFNBQUE7aUJBQUcsR0FBRyxDQUFDLEdBQUosQ0FBUSxJQUFSLEVBQWM7WUFBQSxJQUFBLEVBQU0sV0FBTjtXQUFkLENBQWdDLENBQUMsSUFBakMsQ0FBc0MsU0FBQTttQkFBRyxTQUFBLENBQVUsSUFBVixFQUFnQjtjQUFBLE9BQUEsRUFBUyxJQUFUO2FBQWhCO1VBQUgsQ0FBdEM7UUFBSCxDQUFoRTtPQUFkO01BQ0EsUUFBUSxDQUFDLElBQVQsQ0FBYztRQUFDLDZCQUFELEVBQWdDLG9CQUFoQyxFQUFzRCxTQUFBO2lCQUFHLEdBQUcsQ0FBQyxHQUFKLENBQVEsSUFBUixDQUFhLENBQUMsSUFBZCxDQUFtQixTQUFBO21CQUFHLFNBQUEsQ0FBVSxJQUFWO1VBQUgsQ0FBbkI7UUFBSCxDQUF0RDtPQUFkO01BQ0EsUUFBUSxDQUFDLElBQVQsQ0FBYztRQUFDLGtDQUFELEVBQXFDLDBCQUFyQyxFQUFpRSxTQUFBO2lCQUFHLEdBQUcsQ0FBQyxHQUFKLENBQVEsSUFBUixDQUFhLENBQUMsSUFBZCxDQUFtQixTQUFBO21CQUFHLFNBQUEsQ0FBVSxJQUFWLEVBQWdCO2NBQUEsT0FBQSxFQUFTLElBQVQ7YUFBaEI7VUFBSCxDQUFuQjtRQUFILENBQWpFO09BQWQ7TUFDQSxRQUFRLENBQUMsSUFBVCxDQUFjO1FBQUMsOEJBQUQsRUFBaUMscUJBQWpDLEVBQXdELFNBQUE7aUJBQUcsU0FBQSxDQUFVLElBQVYsRUFBZ0I7WUFBQSxZQUFBLEVBQWMsSUFBZDtZQUFvQixPQUFBLEVBQVMsSUFBN0I7V0FBaEI7UUFBSCxDQUF4RDtPQUFkO01BQ0EsUUFBUSxDQUFDLElBQVQsQ0FBYztRQUFDLG1CQUFELEVBQXNCLFVBQXRCLEVBQWtDLFNBQUE7aUJBQUcsaUJBQUEsQ0FBa0IsSUFBbEI7UUFBSCxDQUFsQztPQUFkO01BQ0EsUUFBUSxDQUFDLElBQVQsQ0FBYztRQUFDLDBCQUFELEVBQTZCLGlCQUE3QixFQUFnRCxTQUFBO2lCQUFHLGlCQUFBLENBQWtCLElBQWxCLEVBQXdCO1lBQUMsTUFBQSxFQUFRLElBQVQ7V0FBeEI7UUFBSCxDQUFoRDtPQUFkO01BQ0EsUUFBUSxDQUFDLElBQVQsQ0FBYztRQUFDLHFCQUFELEVBQXdCLHFCQUF4QixFQUErQyxTQUFBO2lCQUFHLG9CQUFBLENBQXFCLElBQXJCO1FBQUgsQ0FBL0M7T0FBZDtNQUNBLFFBQVEsQ0FBQyxJQUFULENBQWM7UUFBQyw4QkFBRCxFQUFpQyxxQkFBakMsRUFBd0QsU0FBQTtpQkFBRyxlQUFBLENBQWdCLElBQWhCO1FBQUgsQ0FBeEQ7T0FBZDtNQUNBLFFBQVEsQ0FBQyxJQUFULENBQWM7UUFBQywrQkFBRCxFQUFrQyxzQkFBbEMsRUFBMEQsU0FBQTtpQkFBRyxlQUFBLENBQWdCLElBQWhCLEVBQXNCO1lBQUMsTUFBQSxFQUFRLElBQVQ7V0FBdEI7UUFBSCxDQUExRDtPQUFkO01BQ0EsUUFBUSxDQUFDLElBQVQsQ0FBYztRQUFDLHNCQUFELEVBQXlCLGFBQXpCLEVBQXdDLFNBQUE7aUJBQUcsYUFBQSxDQUFjLElBQWQ7UUFBSCxDQUF4QztPQUFkO01BQ0EsUUFBUSxDQUFDLElBQVQsQ0FBYztRQUFDLGVBQUQsRUFBa0IsTUFBbEIsRUFBMEIsU0FBQTtpQkFBRyxPQUFBLENBQVEsSUFBUixFQUFjO1lBQUEsSUFBQSxFQUFNLFdBQU47V0FBZDtRQUFILENBQTFCO09BQWQ7TUFDQSxJQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixvQ0FBaEIsQ0FBSDtRQUNFLFFBQVEsQ0FBQyxJQUFULENBQWM7VUFBQyx3QkFBRCxFQUEyQixlQUEzQixFQUE0QyxTQUFBO21CQUFHLGVBQUEsQ0FBZ0IsSUFBaEI7VUFBSCxDQUE1QztTQUFkO1FBQ0EsUUFBUSxDQUFDLElBQVQsQ0FBYztVQUFDLDRCQUFELEVBQStCLG1CQUEvQixFQUFvRCxTQUFBO21CQUFHLGtCQUFBLENBQW1CLElBQW5CO1VBQUgsQ0FBcEQ7U0FBZCxFQUZGOztNQUdBLFFBQVEsQ0FBQyxJQUFULENBQWM7UUFBQyxtQkFBRCxFQUFzQixVQUF0QixFQUFrQyxTQUFBO2lCQUFHLFdBQUEsQ0FBWSxJQUFaO1FBQUgsQ0FBbEM7T0FBZDtNQUNBLFFBQVEsQ0FBQyxJQUFULENBQWM7UUFBQyxtQkFBRCxFQUFzQixVQUF0QixFQUFrQyxTQUFBO2lCQUFHLFVBQUEsQ0FBVyxJQUFYO1FBQUgsQ0FBbEM7T0FBZDtNQUNBLFFBQVEsQ0FBQyxJQUFULENBQWMsQ0FBQyxnQkFBRCxFQUFtQixPQUFuQixFQUE0QixRQUE1QixDQUFkO01BQ0EsUUFBUSxDQUFDLElBQVQsQ0FBYyxDQUFDLG9CQUFELEVBQXVCLDZCQUF2QixFQUFzRCxrQkFBdEQsQ0FBZDtNQUNBLFFBQVEsQ0FBQyxJQUFULENBQWM7UUFBQyxzQkFBRCxFQUF5QixhQUF6QixFQUF3QyxTQUFBO2lCQUFHLFFBQUEsQ0FBUztZQUFDLEtBQUEsRUFBTyxJQUFSO1dBQVQ7UUFBSCxDQUF4QztPQUFkO01BQ0EsUUFBUSxDQUFDLElBQVQsQ0FBYyxDQUFDLGVBQUQsRUFBa0IsTUFBbEIsRUFBMEIsT0FBMUIsQ0FBZDtNQUNBLFFBQVEsQ0FBQyxJQUFULENBQWMsQ0FBQyxlQUFELEVBQWtCLE1BQWxCLEVBQTBCLE9BQTFCLENBQWQ7TUFDQSxRQUFRLENBQUMsSUFBVCxDQUFjO1FBQUMsNEJBQUQsRUFBK0IsU0FBL0IsRUFBMEMsU0FBQTtpQkFBRyxPQUFBLENBQVEsSUFBUjtRQUFILENBQTFDO09BQWQ7TUFDQSxRQUFRLENBQUMsSUFBVCxDQUFjO1FBQUMsaUJBQUQsRUFBb0IsUUFBcEIsRUFBOEIsU0FBQTtpQkFBRyxTQUFBLENBQVUsSUFBVixFQUFnQjtZQUFBLFlBQUEsRUFBYyxJQUFkO1dBQWhCO1FBQUgsQ0FBOUI7T0FBZDtNQUNBLFFBQVEsQ0FBQyxJQUFULENBQWMsQ0FBQyxnQkFBRCxFQUFtQixZQUFuQixFQUFpQyxRQUFqQyxDQUFkO01BQ0EsUUFBUSxDQUFDLElBQVQsQ0FBYztRQUFDLGVBQUQsRUFBa0IsTUFBbEIsRUFBMEIsU0FBQTtpQkFBRyxPQUFBLENBQVEsSUFBUjtRQUFILENBQTFCO09BQWQ7TUFDQSxRQUFRLENBQUMsSUFBVCxDQUFjO1FBQUMsc0JBQUQsRUFBeUIsYUFBekIsRUFBd0MsU0FBQTtpQkFBRyxhQUFBLENBQWMsSUFBZDtRQUFILENBQXhDO09BQWQ7TUFDQSxRQUFRLENBQUMsSUFBVCxDQUFjO1FBQUMscUJBQUQsRUFBd0IsWUFBeEIsRUFBc0MsU0FBQTtpQkFBRyxZQUFBLENBQWEsSUFBYjtRQUFILENBQXRDO09BQWQ7TUFDQSxRQUFRLENBQUMsSUFBVCxDQUFjLENBQUMseUJBQUQsRUFBNEIsZ0JBQTVCLEVBQThDLGFBQWEsRUFBQyxPQUFELEVBQTNELENBQWQ7TUFDQSxRQUFRLENBQUMsSUFBVCxDQUFjO1FBQUMscUJBQUQsRUFBd0IscUJBQXhCLEVBQStDLFNBQUE7aUJBQUcsWUFBQSxDQUFhLElBQWI7UUFBSCxDQUEvQztPQUFkO01BQ0EsUUFBUSxDQUFDLElBQVQsQ0FBYztRQUFDLDZCQUFELEVBQWdDLGtDQUFoQyxFQUFvRSxTQUFBO2lCQUFHLG1CQUFBLENBQW9CLElBQXBCO1FBQUgsQ0FBcEU7T0FBZDtNQUNBLFFBQVEsQ0FBQyxJQUFULENBQWM7UUFBQyxvQkFBRCxFQUF1QixvQkFBdkIsRUFBNkMsU0FBQTtpQkFBRyxXQUFBLENBQVksSUFBWjtRQUFILENBQTdDO09BQWQ7TUFDQSxRQUFRLENBQUMsSUFBVCxDQUFjO1FBQUMsc0JBQUQsRUFBeUIscUJBQXpCLEVBQWdELFNBQUE7aUJBQUcsYUFBQSxDQUFjLElBQWQ7UUFBSCxDQUFoRDtPQUFkO01BQ0EsUUFBUSxDQUFDLElBQVQsQ0FBYztRQUFDLHVCQUFELEVBQTBCLHNCQUExQixFQUFrRCxTQUFBO2lCQUFHLFlBQUEsQ0FBYSxJQUFiO1FBQUgsQ0FBbEQ7T0FBZDtNQUNBLFFBQVEsQ0FBQyxJQUFULENBQWM7UUFBQyxpQkFBRCxFQUFvQixRQUFwQixFQUE4QixTQUFBO2lCQUFHLFNBQUEsQ0FBVSxJQUFWO1FBQUgsQ0FBOUI7T0FBZDtNQUNBLFFBQVEsQ0FBQyxJQUFULENBQWM7UUFBQyxlQUFELEVBQWtCLE1BQWxCLEVBQTBCLFNBQUE7aUJBQUcsT0FBQSxDQUFRLElBQVI7UUFBSCxDQUExQjtPQUFkO01BQ0EsUUFBUSxDQUFDLElBQVQsQ0FBYztRQUFDLGNBQUQsRUFBaUIsS0FBakIsRUFBd0IsU0FBQTtpQkFBRyxJQUFJLE1BQUosQ0FBVyxJQUFYO1FBQUgsQ0FBeEI7T0FBZDtNQUNBLFFBQVEsQ0FBQyxJQUFULENBQWM7UUFBQyxnQkFBRCxFQUFtQixPQUFuQixFQUE0QixTQUFBO2lCQUFHLFFBQUEsQ0FBUyxJQUFUO1FBQUgsQ0FBNUI7T0FBZDtNQUNBLFFBQVEsQ0FBQyxJQUFULENBQWM7UUFBQyx1QkFBRCxFQUEwQixjQUExQixFQUEwQyxTQUFBO2lCQUFHLFFBQUEsQ0FBUyxJQUFULEVBQWU7WUFBQSxNQUFBLEVBQVEsSUFBUjtXQUFmO1FBQUgsQ0FBMUM7T0FBZDtNQUNBLFFBQVEsQ0FBQyxJQUFULENBQWM7UUFBQyxnQ0FBRCxFQUFtQyw0QkFBbkMsRUFBaUUsU0FBQTtpQkFBRyxRQUFBLENBQVMsSUFBVCxFQUFlO1lBQUEsYUFBQSxFQUFlLElBQWY7V0FBZjtRQUFILENBQWpFO09BQWQ7TUFDQSxRQUFRLENBQUMsSUFBVCxDQUFjO1FBQUMsaUJBQUQsRUFBb0IsUUFBcEIsRUFBOEIsU0FBQTtpQkFBRyxTQUFBLENBQVUsSUFBVjtRQUFILENBQTlCO09BQWQ7TUFDQSxRQUFRLENBQUMsSUFBVCxDQUFjO1FBQUMsaUNBQUQsRUFBb0Msb0JBQXBDLEVBQTBELFNBQUE7aUJBQUcsbUJBQUEsQ0FBb0IsSUFBcEI7UUFBSCxDQUExRDtPQUFkO0FBRUEsYUFBTztJQTNESCxDQURSO0VBekNZOztFQXVHZCxNQUFNLENBQUMsT0FBUCxHQUFpQjtBQXpHakIiLCJzb3VyY2VzQ29udGVudCI6WyJnaXQgPSByZXF1aXJlICcuL2dpdCdcblxuZ2V0Q29tbWFuZHMgPSAtPlxuICBnaXRBZGQgICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL21vZGVscy9hZGQnKS5kZWZhdWx0XG4gIGdpdEFkZE1vZGlmaWVkICAgICAgICA9IHJlcXVpcmUoJy4vbW9kZWxzL2FkZC1tb2RpZmllZCcpLmRlZmF1bHRcbiAgR2l0Q2hlY2tvdXROZXdCcmFuY2ggICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1jaGVja291dC1uZXctYnJhbmNoJ1xuICBHaXRDaGVja291dEJyYW5jaCAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvZ2l0LWNoZWNrb3V0LWJyYW5jaCdcbiAgR2l0RGVsZXRlQnJhbmNoICAgICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1kZWxldGUtYnJhbmNoJ1xuICBnaXRDaGVja291dEZpbGUgICAgICAgID0gcmVxdWlyZSgnLi9tb2RlbHMvY2hlY2tvdXQtZmlsZScpLmRlZmF1bHRcbiAgR2l0Q2hlcnJ5UGljayAgICAgICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1jaGVycnktcGljaydcbiAgR2l0Q29tbWl0ICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1jb21taXQnXG4gIEdpdENvbW1pdEFtZW5kICAgICAgICAgPSByZXF1aXJlICcuL21vZGVscy9naXQtY29tbWl0LWFtZW5kJ1xuICBHaXREaWZmICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvZ2l0LWRpZmYnXG4gIEdpdERpZmZCcmFuY2hlcyAgICAgICAgPSByZXF1aXJlICcuL21vZGVscy9naXQtZGlmZi1icmFuY2hlcydcbiAgR2l0RGlmZkJyYW5jaEZpbGVzICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1kaWZmLWJyYW5jaC1maWxlcydcbiAgR2l0RGlmZnRvb2wgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1kaWZmdG9vbCdcbiAgR2l0RGlmZkFsbCAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1kaWZmLWFsbCdcbiAgZ2l0RmV0Y2ggICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vbW9kZWxzL2ZldGNoJykuZGVmYXVsdFxuICBnaXRGZXRjaEluQWxsUmVwb3MgICAgICAgICAgICA9IHJlcXVpcmUoJy4vbW9kZWxzL2ZldGNoLWluLWFsbC1yZXBvcycpLmRlZmF1bHRcbiAgR2l0SW5pdCAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1pbml0J1xuICBHaXRMb2cgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvZ2l0LWxvZydcbiAgZ2l0UHVsbCAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vbW9kZWxzL3B1bGwnKS5kZWZhdWx0XG4gIGdpdFB1c2ggICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL21vZGVscy9wdXNoJykuZGVmYXVsdFxuICBnaXRSZXNldCAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vbW9kZWxzL3Jlc2V0JykuZGVmYXVsdFxuICBHaXRSZW1vdmUgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvZ2l0LXJlbW92ZSdcbiAgR2l0U2hvdyAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1zaG93J1xuICBHaXRTdGFnZUZpbGVzICAgICAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvZ2l0LXN0YWdlLWZpbGVzJ1xuICBHaXRTdGFnZUh1bmsgICAgICAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvZ2l0LXN0YWdlLWh1bmsnXG4gIE1hbmFnZVN0YXNoZXMgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL21hbmFnZS1zdGFzaGVzJ1xuICBHaXRTdGFzaEFwcGx5ICAgICAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvZ2l0LXN0YXNoLWFwcGx5J1xuICBHaXRTdGFzaERyb3AgICAgICAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvZ2l0LXN0YXNoLWRyb3AnXG4gIEdpdFN0YXNoUG9wICAgICAgICAgICAgPSByZXF1aXJlICcuL21vZGVscy9naXQtc3Rhc2gtcG9wJ1xuICBHaXRTdGFzaFNhdmUgICAgICAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvZ2l0LXN0YXNoLXNhdmUnXG4gIEdpdFN0YXNoU2F2ZU1lc3NhZ2UgICAgPSByZXF1aXJlICcuL21vZGVscy9naXQtc3Rhc2gtc2F2ZS1tZXNzYWdlJ1xuICBHaXRTdGF0dXMgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvZ2l0LXN0YXR1cydcbiAgR2l0VGFncyAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC10YWdzJ1xuICBHaXRSdW4gICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvZ2l0LXJ1bidcbiAgR2l0TWVyZ2UgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1tZXJnZSdcbiAgR2l0UmViYXNlICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1yZWJhc2UnXG4gIEdpdE9wZW5DaGFuZ2VkRmlsZXMgICAgPSByZXF1aXJlICcuL21vZGVscy9naXQtb3Blbi1jaGFuZ2VkLWZpbGVzJ1xuXG4gIGNvbW1hbmRzID0gW11cblxuICBnaXQuZ2V0UmVwbygpXG4gICAgLnRoZW4gKHJlcG8pIC0+XG4gICAgICBjdXJyZW50RmlsZSA9IHJlcG8ucmVsYXRpdml6ZShhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk/LmdldFBhdGgoKSlcbiAgICAgIGdpdC5yZWZyZXNoIHJlcG9cbiAgICAgIGlmIGF0b20uY29uZmlnLmdldCgnZ2l0LXBsdXMuZXhwZXJpbWVudGFsLmN1c3RvbUNvbW1hbmRzJylcbiAgICAgICAgY29tbWFuZHMgPSBjb21tYW5kcy5jb25jYXQocmVxdWlyZSgnLi9zZXJ2aWNlJykuZ2V0Q3VzdG9tQ29tbWFuZHMoKSlcbiAgICAgIGNvbW1hbmRzLnB1c2ggWydnaXQtcGx1czphZGQnLCAnQWRkJywgZ2l0QWRkXVxuICAgICAgY29tbWFuZHMucHVzaCBbJ2dpdC1wbHVzOmFkZC1tb2RpZmllZCcsICdBZGQgTW9kaWZpZWQnLCBnaXRBZGRNb2RpZmllZF1cbiAgICAgIGNvbW1hbmRzLnB1c2ggWydnaXQtcGx1czphZGQtYWxsJywgJ0FkZCBBbGwnLCAtPiBnaXRBZGQodHJ1ZSldXG4gICAgICBjb21tYW5kcy5wdXNoIFsnZ2l0LXBsdXM6bG9nJywgJ0xvZycsIC0+IEdpdExvZyhyZXBvKV1cbiAgICAgIGNvbW1hbmRzLnB1c2ggWydnaXQtcGx1czpsb2ctY3VycmVudC1maWxlJywgJ0xvZyBDdXJyZW50IEZpbGUnLCAtPiBHaXRMb2cocmVwbywgb25seUN1cnJlbnRGaWxlOiB0cnVlKV1cbiAgICAgIGNvbW1hbmRzLnB1c2ggWydnaXQtcGx1czpyZW1vdmUtY3VycmVudC1maWxlJywgJ1JlbW92ZSBDdXJyZW50IEZpbGUnLCAtPiBHaXRSZW1vdmUocmVwbyldXG4gICAgICBjb21tYW5kcy5wdXNoIFsnZ2l0LXBsdXM6Y2hlY2tvdXQtYWxsLWZpbGVzJywgJ0NoZWNrb3V0IEFsbCBGaWxlcycsIC0+IGdpdENoZWNrb3V0RmlsZSh0cnVlKV1cbiAgICAgIGNvbW1hbmRzLnB1c2ggWydnaXQtcGx1czpjaGVja291dC1jdXJyZW50LWZpbGUnLCAnQ2hlY2tvdXQgQ3VycmVudCBGaWxlJywgLT4gZ2l0Q2hlY2tvdXRGaWxlKCldXG4gICAgICBjb21tYW5kcy5wdXNoIFsnZ2l0LXBsdXM6Y29tbWl0JywgJ0NvbW1pdCcsIC0+IEdpdENvbW1pdChyZXBvKV1cbiAgICAgIGNvbW1hbmRzLnB1c2ggWydnaXQtcGx1czpjb21taXQtYWxsJywgJ0NvbW1pdCBBbGwnLCAtPiBHaXRDb21taXQocmVwbywgc3RhZ2VDaGFuZ2VzOiB0cnVlKV1cbiAgICAgIGNvbW1hbmRzLnB1c2ggWydnaXQtcGx1czpjb21taXQtYW1lbmQnLCAnQ29tbWl0IEFtZW5kJywgLT4gR2l0Q29tbWl0QW1lbmQocmVwbyldXG4gICAgICBjb21tYW5kcy5wdXNoIFsnZ2l0LXBsdXM6YWRkLWFuZC1jb21taXQnLCAnQWRkIEFuZCBDb21taXQnLCAtPiBnaXQuYWRkKHJlcG8sIGZpbGU6IGN1cnJlbnRGaWxlKS50aGVuIC0+IEdpdENvbW1pdChyZXBvKV1cbiAgICAgIGNvbW1hbmRzLnB1c2ggWydnaXQtcGx1czphZGQtYW5kLWNvbW1pdC1hbmQtcHVzaCcsICdBZGQgQW5kIENvbW1pdCBBbmQgUHVzaCcsIC0+IGdpdC5hZGQocmVwbywgZmlsZTogY3VycmVudEZpbGUpLnRoZW4gLT4gR2l0Q29tbWl0KHJlcG8sIGFuZFB1c2g6IHRydWUpXVxuICAgICAgY29tbWFuZHMucHVzaCBbJ2dpdC1wbHVzOmFkZC1hbGwtYW5kLWNvbW1pdCcsICdBZGQgQWxsIEFuZCBDb21taXQnLCAtPiBnaXQuYWRkKHJlcG8pLnRoZW4gLT4gR2l0Q29tbWl0KHJlcG8pXVxuICAgICAgY29tbWFuZHMucHVzaCBbJ2dpdC1wbHVzOmFkZC1hbGwtY29tbWl0LWFuZC1wdXNoJywgJ0FkZCBBbGwsIENvbW1pdCBBbmQgUHVzaCcsIC0+IGdpdC5hZGQocmVwbykudGhlbiAtPiBHaXRDb21taXQocmVwbywgYW5kUHVzaDogdHJ1ZSldXG4gICAgICBjb21tYW5kcy5wdXNoIFsnZ2l0LXBsdXM6Y29tbWl0LWFsbC1hbmQtcHVzaCcsICdDb21taXQgQWxsIEFuZCBQdXNoJywgLT4gR2l0Q29tbWl0KHJlcG8sIHN0YWdlQ2hhbmdlczogdHJ1ZSwgYW5kUHVzaDogdHJ1ZSldXG4gICAgICBjb21tYW5kcy5wdXNoIFsnZ2l0LXBsdXM6Y2hlY2tvdXQnLCAnQ2hlY2tvdXQnLCAtPiBHaXRDaGVja291dEJyYW5jaChyZXBvKV1cbiAgICAgIGNvbW1hbmRzLnB1c2ggWydnaXQtcGx1czpjaGVja291dC1yZW1vdGUnLCAnQ2hlY2tvdXQgUmVtb3RlJywgLT4gR2l0Q2hlY2tvdXRCcmFuY2gocmVwbywge3JlbW90ZTogdHJ1ZX0pXVxuICAgICAgY29tbWFuZHMucHVzaCBbJ2dpdC1wbHVzOm5ldy1icmFuY2gnLCAnQ2hlY2tvdXQgTmV3IEJyYW5jaCcsIC0+IEdpdENoZWNrb3V0TmV3QnJhbmNoKHJlcG8pXVxuICAgICAgY29tbWFuZHMucHVzaCBbJ2dpdC1wbHVzOmRlbGV0ZS1sb2NhbC1icmFuY2gnLCAnRGVsZXRlIExvY2FsIEJyYW5jaCcsIC0+IEdpdERlbGV0ZUJyYW5jaChyZXBvKV1cbiAgICAgIGNvbW1hbmRzLnB1c2ggWydnaXQtcGx1czpkZWxldGUtcmVtb3RlLWJyYW5jaCcsICdEZWxldGUgUmVtb3RlIEJyYW5jaCcsIC0+IEdpdERlbGV0ZUJyYW5jaChyZXBvLCB7cmVtb3RlOiB0cnVlfSldXG4gICAgICBjb21tYW5kcy5wdXNoIFsnZ2l0LXBsdXM6Y2hlcnJ5LXBpY2snLCAnQ2hlcnJ5LVBpY2snLCAtPiBHaXRDaGVycnlQaWNrKHJlcG8pXVxuICAgICAgY29tbWFuZHMucHVzaCBbJ2dpdC1wbHVzOmRpZmYnLCAnRGlmZicsIC0+IEdpdERpZmYocmVwbywgZmlsZTogY3VycmVudEZpbGUpXVxuICAgICAgaWYgYXRvbS5jb25maWcuZ2V0KCdnaXQtcGx1cy5leHBlcmltZW50YWwuZGlmZkJyYW5jaGVzJylcbiAgICAgICAgY29tbWFuZHMucHVzaCBbJ2dpdC1wbHVzOmRpZmYtYnJhbmNoZXMnLCAnRGlmZiBicmFuY2hlcycsIC0+IEdpdERpZmZCcmFuY2hlcyhyZXBvKV1cbiAgICAgICAgY29tbWFuZHMucHVzaCBbJ2dpdC1wbHVzOmRpZmYtYnJhbmNoLWZpbGVzJywgJ0RpZmYgYnJhbmNoIGZpbGVzJywgLT4gR2l0RGlmZkJyYW5jaEZpbGVzKHJlcG8pXVxuICAgICAgY29tbWFuZHMucHVzaCBbJ2dpdC1wbHVzOmRpZmZ0b29sJywgJ0RpZmZ0b29sJywgLT4gR2l0RGlmZnRvb2wocmVwbyldXG4gICAgICBjb21tYW5kcy5wdXNoIFsnZ2l0LXBsdXM6ZGlmZi1hbGwnLCAnRGlmZiBBbGwnLCAtPiBHaXREaWZmQWxsKHJlcG8pXVxuICAgICAgY29tbWFuZHMucHVzaCBbJ2dpdC1wbHVzOmZldGNoJywgJ0ZldGNoJywgZ2l0RmV0Y2hdXG4gICAgICBjb21tYW5kcy5wdXNoIFsnZ2l0LXBsdXM6ZmV0Y2gtYWxsJywgJ0ZldGNoIEFsbCAoUmVwb3MgJiBSZW1vdGVzKScsIGdpdEZldGNoSW5BbGxSZXBvc11cbiAgICAgIGNvbW1hbmRzLnB1c2ggWydnaXQtcGx1czpmZXRjaC1wcnVuZScsICdGZXRjaCBQcnVuZScsIC0+IGdpdEZldGNoKHtwcnVuZTogdHJ1ZX0pXVxuICAgICAgY29tbWFuZHMucHVzaCBbJ2dpdC1wbHVzOnB1bGwnLCAnUHVsbCcsIGdpdFB1bGxdXG4gICAgICBjb21tYW5kcy5wdXNoIFsnZ2l0LXBsdXM6cHVzaCcsICdQdXNoJywgZ2l0UHVzaF1cbiAgICAgIGNvbW1hbmRzLnB1c2ggWydnaXQtcGx1czpwdXNoLXNldC11cHN0cmVhbScsICdQdXNoIC11JywgLT4gZ2l0UHVzaCh0cnVlKV1cbiAgICAgIGNvbW1hbmRzLnB1c2ggWydnaXQtcGx1czpyZW1vdmUnLCAnUmVtb3ZlJywgLT4gR2l0UmVtb3ZlKHJlcG8sIHNob3dTZWxlY3RvcjogdHJ1ZSldXG4gICAgICBjb21tYW5kcy5wdXNoIFsnZ2l0LXBsdXM6cmVzZXQnLCAnUmVzZXQgSEVBRCcsIGdpdFJlc2V0XVxuICAgICAgY29tbWFuZHMucHVzaCBbJ2dpdC1wbHVzOnNob3cnLCAnU2hvdycsIC0+IEdpdFNob3cocmVwbyldXG4gICAgICBjb21tYW5kcy5wdXNoIFsnZ2l0LXBsdXM6c3RhZ2UtZmlsZXMnLCAnU3RhZ2UgRmlsZXMnLCAtPiBHaXRTdGFnZUZpbGVzKHJlcG8pXVxuICAgICAgY29tbWFuZHMucHVzaCBbJ2dpdC1wbHVzOnN0YWdlLWh1bmsnLCAnU3RhZ2UgSHVuaycsIC0+IEdpdFN0YWdlSHVuayhyZXBvKV1cbiAgICAgIGNvbW1hbmRzLnB1c2ggWydnaXQtcGx1czptYW5hZ2Utc3Rhc2hlcycsICdNYW5hZ2UgU3Rhc2hlcycsIE1hbmFnZVN0YXNoZXMuZGVmYXVsdF1cbiAgICAgIGNvbW1hbmRzLnB1c2ggWydnaXQtcGx1czpzdGFzaC1zYXZlJywgJ1N0YXNoOiBTYXZlIENoYW5nZXMnLCAtPiBHaXRTdGFzaFNhdmUocmVwbyldXG4gICAgICBjb21tYW5kcy5wdXNoIFsnZ2l0LXBsdXM6c3Rhc2gtc2F2ZS1tZXNzYWdlJywgJ1N0YXNoOiBTYXZlIENoYW5nZXMgV2l0aCBNZXNzYWdlJywgLT4gR2l0U3Rhc2hTYXZlTWVzc2FnZShyZXBvKV1cbiAgICAgIGNvbW1hbmRzLnB1c2ggWydnaXQtcGx1czpzdGFzaC1wb3AnLCAnU3Rhc2g6IEFwcGx5IChQb3ApJywgLT4gR2l0U3Rhc2hQb3AocmVwbyldXG4gICAgICBjb21tYW5kcy5wdXNoIFsnZ2l0LXBsdXM6c3Rhc2gtYXBwbHknLCAnU3Rhc2g6IEFwcGx5IChLZWVwKScsIC0+IEdpdFN0YXNoQXBwbHkocmVwbyldXG4gICAgICBjb21tYW5kcy5wdXNoIFsnZ2l0LXBsdXM6c3Rhc2gtZGVsZXRlJywgJ1N0YXNoOiBEZWxldGUgKERyb3ApJywgLT4gR2l0U3Rhc2hEcm9wKHJlcG8pXVxuICAgICAgY29tbWFuZHMucHVzaCBbJ2dpdC1wbHVzOnN0YXR1cycsICdTdGF0dXMnLCAtPiBHaXRTdGF0dXMocmVwbyldXG4gICAgICBjb21tYW5kcy5wdXNoIFsnZ2l0LXBsdXM6dGFncycsICdUYWdzJywgLT4gR2l0VGFncyhyZXBvKV1cbiAgICAgIGNvbW1hbmRzLnB1c2ggWydnaXQtcGx1czpydW4nLCAnUnVuJywgLT4gbmV3IEdpdFJ1bihyZXBvKV1cbiAgICAgIGNvbW1hbmRzLnB1c2ggWydnaXQtcGx1czptZXJnZScsICdNZXJnZScsIC0+IEdpdE1lcmdlKHJlcG8pXVxuICAgICAgY29tbWFuZHMucHVzaCBbJ2dpdC1wbHVzOm1lcmdlLXJlbW90ZScsICdNZXJnZSBSZW1vdGUnLCAtPiBHaXRNZXJnZShyZXBvLCByZW1vdGU6IHRydWUpXVxuICAgICAgY29tbWFuZHMucHVzaCBbJ2dpdC1wbHVzOm1lcmdlLW5vLWZhc3QtZm9yd2FyZCcsICdNZXJnZSB3aXRob3V0IGZhc3QtZm9yd2FyZCcsIC0+IEdpdE1lcmdlKHJlcG8sIG5vRmFzdEZvcndhcmQ6IHRydWUpXVxuICAgICAgY29tbWFuZHMucHVzaCBbJ2dpdC1wbHVzOnJlYmFzZScsICdSZWJhc2UnLCAtPiBHaXRSZWJhc2UocmVwbyldXG4gICAgICBjb21tYW5kcy5wdXNoIFsnZ2l0LXBsdXM6Z2l0LW9wZW4tY2hhbmdlZC1maWxlcycsICdPcGVuIENoYW5nZWQgRmlsZXMnLCAtPiBHaXRPcGVuQ2hhbmdlZEZpbGVzKHJlcG8pXVxuXG4gICAgICByZXR1cm4gY29tbWFuZHNcblxubW9kdWxlLmV4cG9ydHMgPSBnZXRDb21tYW5kc1xuIl19
