(function() {
  var CompositeDisposable, LineNumberView;

  LineNumberView = require('./line-number-view');

  CompositeDisposable = require('atom').CompositeDisposable;

  module.exports = {
    config: {
      debounceMotion: {
        type: 'integer',
        "default": 0,
        description: 'Debounce line number updates to reduce the CPU load (in milliseconds; 0 to update instantly)'
      },
      trueNumberCurrentLine: {
        type: 'boolean',
        "default": true,
        description: 'Show the absolute line number on the current line'
      },
      showAbsoluteNumbers: {
        type: 'boolean',
        "default": false,
        description: 'Show both absolute and relative line numbers at all times'
      },
      startAtOne: {
        type: 'boolean',
        "default": false,
        description: 'Start relative line numbering at one instead of zero for the current line'
      },
      softWrapsCount: {
        type: 'boolean',
        "default": true,
        description: 'Do soft-wrapped lines count? (No in vim-mode-plus, yes in vim-mode)'
      },
      showAbsoluteNumbersInInsertMode: {
        type: 'boolean',
        "default": true,
        description: 'Revert back to absolute numbers while in insert mode (vim-mode/vim-mode-plus)'
      }
    },
    subscriptions: null,
    activate: function(state) {
      this.subscriptions = new CompositeDisposable;
      return this.subscriptions.add(atom.workspace.observeTextEditors(function(editor) {
        if (!editor.gutterWithName('relative-numbers')) {
          return new LineNumberView(editor);
        }
      }));
    },
    deactivate: function() {
      var editor, i, len, ref, ref1, results;
      this.subscriptions.dispose();
      ref = atom.workspace.getTextEditors();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        editor = ref[i];
        results.push((ref1 = editor.gutterWithName('relative-numbers').view) != null ? ref1.destroy() : void 0);
      }
      return results;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvcmVsYXRpdmUtbnVtYmVycy9saWIvcmVsYXRpdmUtbnVtYmVycy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLGNBQUEsR0FBaUIsT0FBQSxDQUFRLG9CQUFSOztFQUNoQixzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBRXhCLE1BQU0sQ0FBQyxPQUFQLEdBRUU7SUFBQSxNQUFBLEVBQ0U7TUFBQSxjQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsQ0FEVDtRQUVBLFdBQUEsRUFBYSw4RkFGYjtPQURGO01BSUEscUJBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxTQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxJQURUO1FBRUEsV0FBQSxFQUFhLG1EQUZiO09BTEY7TUFRQSxtQkFBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFNBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEtBRFQ7UUFFQSxXQUFBLEVBQWEsMkRBRmI7T0FURjtNQVlBLFVBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxTQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQURUO1FBRUEsV0FBQSxFQUFhLDJFQUZiO09BYkY7TUFnQkEsY0FBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFNBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLElBRFQ7UUFFQSxXQUFBLEVBQWEscUVBRmI7T0FqQkY7TUFvQkEsK0JBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxTQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxJQURUO1FBRUEsV0FBQSxFQUFhLCtFQUZiO09BckJGO0tBREY7SUEwQkEsYUFBQSxFQUFlLElBMUJmO0lBNEJBLFFBQUEsRUFBVSxTQUFDLEtBQUQ7TUFDUixJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO2FBQ3JCLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFmLENBQWtDLFNBQUMsTUFBRDtRQUNuRCxJQUFHLENBQUksTUFBTSxDQUFDLGNBQVAsQ0FBc0Isa0JBQXRCLENBQVA7aUJBQ0UsSUFBSSxjQUFKLENBQW1CLE1BQW5CLEVBREY7O01BRG1ELENBQWxDLENBQW5CO0lBRlEsQ0E1QlY7SUFrQ0EsVUFBQSxFQUFZLFNBQUE7QUFDVixVQUFBO01BQUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxPQUFmLENBQUE7QUFDQTtBQUFBO1dBQUEscUNBQUE7OzJGQUNnRCxDQUFFLE9BQWhELENBQUE7QUFERjs7SUFGVSxDQWxDWjs7QUFMRiIsInNvdXJjZXNDb250ZW50IjpbIkxpbmVOdW1iZXJWaWV3ID0gcmVxdWlyZSAnLi9saW5lLW51bWJlci12aWV3J1xue0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcblxubW9kdWxlLmV4cG9ydHMgPVxuICAjIENvbmZpZyBzY2hlbWFcbiAgY29uZmlnOlxuICAgIGRlYm91bmNlTW90aW9uOlxuICAgICAgdHlwZTogJ2ludGVnZXInXG4gICAgICBkZWZhdWx0OiAwXG4gICAgICBkZXNjcmlwdGlvbjogJ0RlYm91bmNlIGxpbmUgbnVtYmVyIHVwZGF0ZXMgdG8gcmVkdWNlIHRoZSBDUFUgbG9hZCAoaW4gbWlsbGlzZWNvbmRzOyAwIHRvIHVwZGF0ZSBpbnN0YW50bHkpJ1xuICAgIHRydWVOdW1iZXJDdXJyZW50TGluZTpcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgZGVzY3JpcHRpb246ICdTaG93IHRoZSBhYnNvbHV0ZSBsaW5lIG51bWJlciBvbiB0aGUgY3VycmVudCBsaW5lJ1xuICAgIHNob3dBYnNvbHV0ZU51bWJlcnM6XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICBkZXNjcmlwdGlvbjogJ1Nob3cgYm90aCBhYnNvbHV0ZSBhbmQgcmVsYXRpdmUgbGluZSBudW1iZXJzIGF0IGFsbCB0aW1lcydcbiAgICBzdGFydEF0T25lOlxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgZGVzY3JpcHRpb246ICdTdGFydCByZWxhdGl2ZSBsaW5lIG51bWJlcmluZyBhdCBvbmUgaW5zdGVhZCBvZiB6ZXJvIGZvciB0aGUgY3VycmVudCBsaW5lJ1xuICAgIHNvZnRXcmFwc0NvdW50OlxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICBkZXNjcmlwdGlvbjogJ0RvIHNvZnQtd3JhcHBlZCBsaW5lcyBjb3VudD8gKE5vIGluIHZpbS1tb2RlLXBsdXMsIHllcyBpbiB2aW0tbW9kZSknXG4gICAgc2hvd0Fic29sdXRlTnVtYmVyc0luSW5zZXJ0TW9kZTpcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgZGVzY3JpcHRpb246ICdSZXZlcnQgYmFjayB0byBhYnNvbHV0ZSBudW1iZXJzIHdoaWxlIGluIGluc2VydCBtb2RlICh2aW0tbW9kZS92aW0tbW9kZS1wbHVzKSdcblxuICBzdWJzY3JpcHRpb25zOiBudWxsXG5cbiAgYWN0aXZhdGU6IChzdGF0ZSkgLT5cbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycyAoZWRpdG9yKSAtPlxuICAgICAgaWYgbm90IGVkaXRvci5ndXR0ZXJXaXRoTmFtZSgncmVsYXRpdmUtbnVtYmVycycpXG4gICAgICAgIG5ldyBMaW5lTnVtYmVyVmlldyhlZGl0b3IpXG5cbiAgZGVhY3RpdmF0ZTogKCkgLT5cbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICBmb3IgZWRpdG9yIGluIGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKClcbiAgICAgIGVkaXRvci5ndXR0ZXJXaXRoTmFtZSgncmVsYXRpdmUtbnVtYmVycycpLnZpZXc/LmRlc3Ryb3koKVxuIl19
