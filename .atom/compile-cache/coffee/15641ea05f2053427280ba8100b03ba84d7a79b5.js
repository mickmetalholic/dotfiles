(function() {
  var RemoveListView, git, gitRemove, notifier, prettify;

  git = require('../git');

  notifier = require('../notifier');

  RemoveListView = require('../views/remove-list-view');

  gitRemove = function(repo, arg) {
    var currentFile, cwd, ref, showSelector;
    showSelector = (arg != null ? arg : {}).showSelector;
    cwd = repo.getWorkingDirectory();
    currentFile = repo.relativize((ref = atom.workspace.getActiveTextEditor()) != null ? ref.getPath() : void 0);
    if ((currentFile != null) && !showSelector) {
      if (repo.isPathModified(currentFile) === false || window.confirm('Are you sure?')) {
        atom.workspace.getActivePaneItem().destroy();
        return git.cmd(['rm', '-f', '--ignore-unmatch', currentFile], {
          cwd: cwd
        }).then(function(data) {
          return notifier.addSuccess("Removed " + (prettify(data)));
        });
      }
    } else {
      return git.cmd(['rm', '-r', '-n', '--ignore-unmatch', '-f', '*'], {
        cwd: cwd
      }).then(function(data) {
        return new RemoveListView(repo, prettify(data));
      });
    }
  };

  prettify = function(data) {
    var file, i, j, len, results;
    data = data.match(/rm ('.*')/g);
    if (data) {
      results = [];
      for (i = j = 0, len = data.length; j < len; i = ++j) {
        file = data[i];
        results.push(data[i] = file.match(/rm '(.*)'/)[1]);
      }
      return results;
    } else {
      return data;
    }
  };

  module.exports = gitRemove;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvZ2l0LXBsdXMvbGliL21vZGVscy9naXQtcmVtb3ZlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsR0FBQSxHQUFNLE9BQUEsQ0FBUSxRQUFSOztFQUNOLFFBQUEsR0FBVyxPQUFBLENBQVEsYUFBUjs7RUFDWCxjQUFBLEdBQWlCLE9BQUEsQ0FBUSwyQkFBUjs7RUFFakIsU0FBQSxHQUFZLFNBQUMsSUFBRCxFQUFPLEdBQVA7QUFDVixRQUFBO0lBRGtCLDhCQUFELE1BQWU7SUFDaEMsR0FBQSxHQUFNLElBQUksQ0FBQyxtQkFBTCxDQUFBO0lBQ04sV0FBQSxHQUFjLElBQUksQ0FBQyxVQUFMLDJEQUFvRCxDQUFFLE9BQXRDLENBQUEsVUFBaEI7SUFDZCxJQUFHLHFCQUFBLElBQWlCLENBQUksWUFBeEI7TUFDRSxJQUFHLElBQUksQ0FBQyxjQUFMLENBQW9CLFdBQXBCLENBQUEsS0FBb0MsS0FBcEMsSUFBNkMsTUFBTSxDQUFDLE9BQVAsQ0FBZSxlQUFmLENBQWhEO1FBQ0UsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBZixDQUFBLENBQWtDLENBQUMsT0FBbkMsQ0FBQTtlQUNBLEdBQUcsQ0FBQyxHQUFKLENBQVEsQ0FBQyxJQUFELEVBQU8sSUFBUCxFQUFhLGtCQUFiLEVBQWlDLFdBQWpDLENBQVIsRUFBdUQ7VUFBQyxLQUFBLEdBQUQ7U0FBdkQsQ0FDQSxDQUFDLElBREQsQ0FDTSxTQUFDLElBQUQ7aUJBQVUsUUFBUSxDQUFDLFVBQVQsQ0FBb0IsVUFBQSxHQUFVLENBQUMsUUFBQSxDQUFTLElBQVQsQ0FBRCxDQUE5QjtRQUFWLENBRE4sRUFGRjtPQURGO0tBQUEsTUFBQTthQU1FLEdBQUcsQ0FBQyxHQUFKLENBQVEsQ0FBQyxJQUFELEVBQU8sSUFBUCxFQUFhLElBQWIsRUFBbUIsa0JBQW5CLEVBQXVDLElBQXZDLEVBQTZDLEdBQTdDLENBQVIsRUFBMkQ7UUFBQyxLQUFBLEdBQUQ7T0FBM0QsQ0FDQSxDQUFDLElBREQsQ0FDTSxTQUFDLElBQUQ7ZUFBVSxJQUFJLGNBQUosQ0FBbUIsSUFBbkIsRUFBeUIsUUFBQSxDQUFTLElBQVQsQ0FBekI7TUFBVixDQUROLEVBTkY7O0VBSFU7O0VBWVosUUFBQSxHQUFXLFNBQUMsSUFBRDtBQUNULFFBQUE7SUFBQSxJQUFBLEdBQU8sSUFBSSxDQUFDLEtBQUwsQ0FBVyxZQUFYO0lBQ1AsSUFBRyxJQUFIO0FBQ0U7V0FBQSw4Q0FBQTs7cUJBQ0UsSUFBSyxDQUFBLENBQUEsQ0FBTCxHQUFVLElBQUksQ0FBQyxLQUFMLENBQVcsV0FBWCxDQUF3QixDQUFBLENBQUE7QUFEcEM7cUJBREY7S0FBQSxNQUFBO2FBSUUsS0FKRjs7RUFGUzs7RUFRWCxNQUFNLENBQUMsT0FBUCxHQUFpQjtBQXhCakIiLCJzb3VyY2VzQ29udGVudCI6WyJnaXQgPSByZXF1aXJlICcuLi9naXQnXG5ub3RpZmllciA9IHJlcXVpcmUgJy4uL25vdGlmaWVyJ1xuUmVtb3ZlTGlzdFZpZXcgPSByZXF1aXJlICcuLi92aWV3cy9yZW1vdmUtbGlzdC12aWV3J1xuXG5naXRSZW1vdmUgPSAocmVwbywge3Nob3dTZWxlY3Rvcn09e30pIC0+XG4gIGN3ZCA9IHJlcG8uZ2V0V29ya2luZ0RpcmVjdG9yeSgpXG4gIGN1cnJlbnRGaWxlID0gcmVwby5yZWxhdGl2aXplKGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKT8uZ2V0UGF0aCgpKVxuICBpZiBjdXJyZW50RmlsZT8gYW5kIG5vdCBzaG93U2VsZWN0b3JcbiAgICBpZiByZXBvLmlzUGF0aE1vZGlmaWVkKGN1cnJlbnRGaWxlKSBpcyBmYWxzZSBvciB3aW5kb3cuY29uZmlybSgnQXJlIHlvdSBzdXJlPycpXG4gICAgICBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lSXRlbSgpLmRlc3Ryb3koKVxuICAgICAgZ2l0LmNtZChbJ3JtJywgJy1mJywgJy0taWdub3JlLXVubWF0Y2gnLCBjdXJyZW50RmlsZV0sIHtjd2R9KVxuICAgICAgLnRoZW4gKGRhdGEpIC0+IG5vdGlmaWVyLmFkZFN1Y2Nlc3MoXCJSZW1vdmVkICN7cHJldHRpZnkgZGF0YX1cIilcbiAgZWxzZVxuICAgIGdpdC5jbWQoWydybScsICctcicsICctbicsICctLWlnbm9yZS11bm1hdGNoJywgJy1mJywgJyonXSwge2N3ZH0pXG4gICAgLnRoZW4gKGRhdGEpIC0+IG5ldyBSZW1vdmVMaXN0VmlldyhyZXBvLCBwcmV0dGlmeShkYXRhKSlcblxucHJldHRpZnkgPSAoZGF0YSkgLT5cbiAgZGF0YSA9IGRhdGEubWF0Y2goL3JtICgnLionKS9nKVxuICBpZiBkYXRhXG4gICAgZm9yIGZpbGUsIGkgaW4gZGF0YVxuICAgICAgZGF0YVtpXSA9IGZpbGUubWF0Y2goL3JtICcoLiopJy8pWzFdXG4gIGVsc2VcbiAgICBkYXRhXG5cbm1vZHVsZS5leHBvcnRzID0gZ2l0UmVtb3ZlXG4iXX0=
