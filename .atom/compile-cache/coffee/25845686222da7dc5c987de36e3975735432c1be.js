(function() {
  var AtomGitDiffDetailsView, DiffDetailsDataManager, Housekeeping, Point, Range, View, _, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  View = require('atom-space-pen-views').View;

  ref = require('atom'), Range = ref.Range, Point = ref.Point;

  _ = require('underscore-plus');

  DiffDetailsDataManager = require('./data-manager');

  Housekeeping = require('./housekeeping');

  module.exports = AtomGitDiffDetailsView = (function(superClass) {
    extend(AtomGitDiffDetailsView, superClass);

    function AtomGitDiffDetailsView() {
      this.notifyContentsModified = bind(this.notifyContentsModified, this);
      return AtomGitDiffDetailsView.__super__.constructor.apply(this, arguments);
    }

    Housekeeping.includeInto(AtomGitDiffDetailsView);

    AtomGitDiffDetailsView.content = function() {
      return this.div({
        "class": "git-diff-details-outer"
      }, (function(_this) {
        return function() {
          return _this.div({
            "class": "git-diff-details-main-panel",
            outlet: "mainPanel"
          }, function() {
            return _this.div({
              "class": "editor git-diff-editor",
              outlet: "contents"
            });
          });
        };
      })(this));
    };

    AtomGitDiffDetailsView.prototype.initialize = function(editor1) {
      this.editor = editor1;
      this.editorView = atom.views.getView(this.editor);
      this.diffDetailsDataManager = new DiffDetailsDataManager();
      this.initializeHousekeeping();
      this.preventFocusOut();
      this.diffEditor = atom.workspace.buildTextEditor({
        lineNumberGutterVisible: false,
        scrollPastEnd: false
      });
      this.contents.html(atom.views.getView(this.diffEditor));
      this.markers = [];
      this.showDiffDetails = false;
      this.lineDiffDetails = null;
      return this.updateCurrentRow();
    };

    AtomGitDiffDetailsView.prototype.preventFocusOut = function() {
      return this.mainPanel.on('mousedown', function() {
        return false;
      });
    };

    AtomGitDiffDetailsView.prototype.getActiveTextEditor = function() {
      return atom.workspace.getActiveTextEditor();
    };

    AtomGitDiffDetailsView.prototype.updateCurrentRow = function() {
      var newCurrentRow, ref1, ref2;
      newCurrentRow = ((ref1 = this.getActiveTextEditor()) != null ? (ref2 = ref1.getCursorBufferPosition()) != null ? ref2.row : void 0 : void 0) + 1;
      if (newCurrentRow !== this.currentRow) {
        this.currentRow = newCurrentRow;
        return true;
      }
      return false;
    };

    AtomGitDiffDetailsView.prototype.notifyContentsModified = function() {
      if (this.editor.isDestroyed()) {
        return;
      }
      this.diffDetailsDataManager.invalidate(this.repositoryForPath(this.editor.getPath()), this.editor.getPath(), this.editor.getText());
      if (this.showDiffDetails) {
        return this.updateDiffDetailsDisplay();
      }
    };

    AtomGitDiffDetailsView.prototype.updateDiffDetails = function() {
      this.diffDetailsDataManager.invalidatePreviousSelectedHunk();
      this.updateCurrentRow();
      return this.updateDiffDetailsDisplay();
    };

    AtomGitDiffDetailsView.prototype.toggleShowDiffDetails = function() {
      this.showDiffDetails = !this.showDiffDetails;
      return this.updateDiffDetails();
    };

    AtomGitDiffDetailsView.prototype.closeDiffDetails = function() {
      this.showDiffDetails = false;
      return this.updateDiffDetails();
    };

    AtomGitDiffDetailsView.prototype.notifyChangeCursorPosition = function() {
      var currentRowChanged;
      if (this.showDiffDetails) {
        currentRowChanged = this.updateCurrentRow();
        if (currentRowChanged) {
          return this.updateDiffDetailsDisplay();
        }
      }
    };

    AtomGitDiffDetailsView.prototype.copy = function() {
      var selectedHunk;
      selectedHunk = this.diffDetailsDataManager.getSelectedHunk(this.currentRow).selectedHunk;
      if (selectedHunk != null) {
        atom.clipboard.write(selectedHunk.oldString);
        if (atom.config.get('git-diff-details.closeAfterCopy')) {
          return this.closeDiffDetails();
        }
      }
    };

    AtomGitDiffDetailsView.prototype.undo = function() {
      var buffer, selectedHunk;
      selectedHunk = this.diffDetailsDataManager.getSelectedHunk(this.currentRow).selectedHunk;
      if ((selectedHunk != null) && (buffer = this.editor.getBuffer())) {
        if (selectedHunk.kind === "m") {
          buffer.setTextInRange([[selectedHunk.start - 1, 0], [selectedHunk.end, 0]], selectedHunk.oldString);
        } else {
          buffer.insert([selectedHunk.start, 0], selectedHunk.oldString);
        }
        if (!atom.config.get('git-diff-details.keepViewToggled')) {
          return this.closeDiffDetails();
        }
      }
    };

    AtomGitDiffDetailsView.prototype.destroyDecoration = function() {
      var i, len, marker, ref1;
      ref1 = this.markers;
      for (i = 0, len = ref1.length; i < len; i++) {
        marker = ref1[i];
        marker.destroy();
      }
      return this.markers = [];
    };

    AtomGitDiffDetailsView.prototype.decorateLines = function(editor, start, end, type) {
      var marker, range;
      range = new Range(new Point(start, 0), new Point(end, 0));
      marker = editor.markBufferRange(range);
      editor.decorateMarker(marker, {
        type: 'line',
        "class": "git-diff-details-" + type
      });
      return this.markers.push(marker);
    };

    AtomGitDiffDetailsView.prototype.decorateWords = function(editor, start, words, type) {
      var i, len, marker, range, results, row, word;
      if (!words) {
        return;
      }
      results = [];
      for (i = 0, len = words.length; i < len; i++) {
        word = words[i];
        if (!word.changed) {
          continue;
        }
        row = start + word.offsetRow;
        range = new Range(new Point(row, word.startCol), new Point(row, word.endCol));
        marker = editor.markBufferRange(range);
        editor.decorateMarker(marker, {
          type: 'highlight',
          "class": "git-diff-details-" + type
        });
        results.push(this.markers.push(marker));
      }
      return results;
    };

    AtomGitDiffDetailsView.prototype.display = function(selectedHunk) {
      var classPostfix, marker, range, ref1;
      this.destroyDecoration();
      classPostfix = atom.config.get('git-diff-details.enableSyntaxHighlighting') ? "highlighted" : "flat";
      if (selectedHunk.kind === "m") {
        this.decorateLines(this.editor, selectedHunk.start - 1, selectedHunk.end, "new-" + classPostfix);
        if (atom.config.get('git-diff-details.showWordDiffs')) {
          this.decorateWords(this.editor, selectedHunk.start - 1, selectedHunk.newWords, "new-" + classPostfix);
        }
      }
      range = new Range(new Point(selectedHunk.end - 1, 0), new Point(selectedHunk.end - 1, 0));
      marker = this.editor.markBufferRange(range);
      this.editor.decorateMarker(marker, {
        type: 'block',
        position: 'after',
        item: this
      });
      this.markers.push(marker);
      this.diffEditor.setGrammar((ref1 = this.getActiveTextEditor()) != null ? ref1.getGrammar() : void 0);
      this.diffEditor.setText(selectedHunk.oldString.replace(/[\r\n]+$/g, ""));
      this.decorateLines(this.diffEditor, 0, selectedHunk.oldLines.length, "old-" + classPostfix);
      if (atom.config.get('git-diff-details.showWordDiffs')) {
        return this.decorateWords(this.diffEditor, 0, selectedHunk.oldWords, "old-" + classPostfix);
      }
    };

    AtomGitDiffDetailsView.prototype.updateDiffDetailsDisplay = function() {
      var isDifferent, ref1, selectedHunk;
      if (this.showDiffDetails) {
        ref1 = this.diffDetailsDataManager.getSelectedHunk(this.currentRow), selectedHunk = ref1.selectedHunk, isDifferent = ref1.isDifferent;
        if (selectedHunk != null) {
          if (!isDifferent) {
            return;
          }
          this.display(selectedHunk);
          return;
        } else {
          if (!atom.config.get('git-diff-details.keepViewToggled')) {
            this.closeDiffDetails();
          }
        }
        this.previousSelectedHunk = selectedHunk;
      }
      this.destroyDecoration();
    };

    return AtomGitDiffDetailsView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvZ2l0LWRpZmYtZGV0YWlscy9saWIvZ2l0LWRpZmYtZGV0YWlscy12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsd0ZBQUE7SUFBQTs7OztFQUFDLE9BQVEsT0FBQSxDQUFRLHNCQUFSOztFQUNULE1BQWlCLE9BQUEsQ0FBUSxNQUFSLENBQWpCLEVBQUMsaUJBQUQsRUFBUTs7RUFDUixDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLHNCQUFBLEdBQXlCLE9BQUEsQ0FBUSxnQkFBUjs7RUFDekIsWUFBQSxHQUFlLE9BQUEsQ0FBUSxnQkFBUjs7RUFFZixNQUFNLENBQUMsT0FBUCxHQUF1Qjs7Ozs7Ozs7SUFDckIsWUFBWSxDQUFDLFdBQWIsQ0FBeUIsc0JBQXpCOztJQUVBLHNCQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7YUFDUixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyx3QkFBUDtPQUFMLEVBQXNDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDcEMsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sNkJBQVA7WUFBc0MsTUFBQSxFQUFRLFdBQTlDO1dBQUwsRUFBZ0UsU0FBQTttQkFDOUQsS0FBQyxDQUFBLEdBQUQsQ0FBSztjQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sd0JBQVA7Y0FBaUMsTUFBQSxFQUFRLFVBQXpDO2FBQUw7VUFEOEQsQ0FBaEU7UUFEb0M7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXRDO0lBRFE7O3FDQUtWLFVBQUEsR0FBWSxTQUFDLE9BQUQ7TUFBQyxJQUFDLENBQUEsU0FBRDtNQUNYLElBQUMsQ0FBQSxVQUFELEdBQWMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFYLENBQW1CLElBQUMsQ0FBQSxN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LGdDQUFoQixDQUFIO2VBQ0UsSUFBQyxDQUFBLGFBQUQsQ0FBZSxJQUFDLENBQUEsVUFBaEIsRUFBNEIsQ0FBNUIsRUFBK0IsWUFBWSxDQUFDLFFBQTVDLEVBQXNELE1BQUEsR0FBTyxZQUE3RCxFQURGOztJQXJCTzs7cUNBd0JULHdCQUFBLEdBQTBCLFNBQUE7QUFDeEIsVUFBQTtNQUFBLElBQUcsSUFBQyxDQUFBLGVBQUo7UUFDRSxPQUE4QixJQUFDLENBQUEsc0JBQXNCLENBQUMsZUFBeEIsQ0FBd0MsSUFBQyxDQUFBLFVBQXpDLENBQTlCLEVBQUMsZ0NBQUQsRUFBZTtRQUVmLElBQUcsb0JBQUg7VUFDRSxJQUFBLENBQWMsV0FBZDtBQUFBLG1CQUFBOztVQUNBLElBQUMsQ0FBQSxPQUFELENBQVMsWUFBVDtBQUNBLGlCQUhGO1NBQUEsTUFBQTtVQUtFLElBQUEsQ0FBMkIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLGtDQUFoQixDQUEzQjtZQUFBLElBQUMsQ0FBQSxnQkFBRCxDQUFBLEVBQUE7V0FMRjs7UUFPQSxJQUFDLENBQUEsb0JBQUQsR0FBd0IsYUFWMUI7O01BWUEsSUFBQyxDQUFBLGlCQUFELENBQUE7SUFid0I7Ozs7S0E5SDBCO0FBTnREIiwic291cmNlc0NvbnRlbnQiOlsie1ZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG57UmFuZ2UsIFBvaW50fSA9IHJlcXVpcmUgJ2F0b20nXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuRGlmZkRldGFpbHNEYXRhTWFuYWdlciA9IHJlcXVpcmUgJy4vZGF0YS1tYW5hZ2VyJ1xuSG91c2VrZWVwaW5nID0gcmVxdWlyZSAnLi9ob3VzZWtlZXBpbmcnXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQXRvbUdpdERpZmZEZXRhaWxzVmlldyBleHRlbmRzIFZpZXdcbiAgSG91c2VrZWVwaW5nLmluY2x1ZGVJbnRvKHRoaXMpXG5cbiAgQGNvbnRlbnQ6IC0+XG4gICAgQGRpdiBjbGFzczogXCJnaXQtZGlmZi1kZXRhaWxzLW91dGVyXCIsID0+XG4gICAgICBAZGl2IGNsYXNzOiBcImdpdC1kaWZmLWRldGFpbHMtbWFpbi1wYW5lbFwiLCBvdXRsZXQ6IFwibWFpblBhbmVsXCIsID0+XG4gICAgICAgIEBkaXYgY2xhc3M6IFwiZWRpdG9yIGdpdC1kaWZmLWVkaXRvclwiLCBvdXRsZXQ6IFwiY29udGVudHNcIlxuXG4gIGluaXRpYWxpemU6IChAZWRpdG9yKSAtPlxuICAgIEBlZGl0b3JWaWV3ID0gYXRvbS52aWV3cy5nZXRWaWV3KEBlZGl0b3IpXG5cbiAgICBAZGlmZkRldGFpbHNEYXRhTWFuYWdlciA9IG5ldyBEaWZmRGV0YWlsc0RhdGFNYW5hZ2VyKClcblxuICAgIEBpbml0aWFsaXplSG91c2VrZWVwaW5nKClcbiAgICBAcHJldmVudEZvY3VzT3V0KClcblxuICAgIEBkaWZmRWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuYnVpbGRUZXh0RWRpdG9yKGxpbmVOdW1iZXJHdXR0ZXJWaXNpYmxlOiBmYWxzZSwgc2Nyb2xsUGFzdEVuZDogZmFsc2UpXG4gICAgQGNvbnRlbnRzLmh0bWwoYXRvbS52aWV3cy5nZXRWaWV3KEBkaWZmRWRpdG9yKSlcblxuICAgIEBtYXJrZXJzID0gW11cblxuICAgIEBzaG93RGlmZkRldGFpbHMgPSBmYWxzZVxuICAgIEBsaW5lRGlmZkRldGFpbHMgPSBudWxsXG5cbiAgICBAdXBkYXRlQ3VycmVudFJvdygpXG5cbiAgcHJldmVudEZvY3VzT3V0OiAtPlxuICAgIEBtYWluUGFuZWwub24gJ21vdXNlZG93bicsICgpIC0+XG4gICAgICBmYWxzZVxuXG4gIGdldEFjdGl2ZVRleHRFZGl0b3I6IC0+XG4gICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG5cbiAgdXBkYXRlQ3VycmVudFJvdzogLT5cbiAgICBuZXdDdXJyZW50Um93ID0gQGdldEFjdGl2ZVRleHRFZGl0b3IoKT8uZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKT8ucm93ICsgMVxuICAgIGlmIG5ld0N1cnJlbnRSb3cgIT0gQGN1cnJlbnRSb3dcbiAgICAgIEBjdXJyZW50Um93ID0gbmV3Q3VycmVudFJvd1xuICAgICAgcmV0dXJuIHRydWVcbiAgICByZXR1cm4gZmFsc2VcblxuICBub3RpZnlDb250ZW50c01vZGlmaWVkOiA9PlxuICAgIHJldHVybiBpZiBAZWRpdG9yLmlzRGVzdHJveWVkKClcbiAgICBAZGlmZkRldGFpbHNEYXRhTWFuYWdlci5pbnZhbGlkYXRlKEByZXBvc2l0b3J5Rm9yUGF0aChAZWRpdG9yLmdldFBhdGgoKSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZWRpdG9yLmdldFBhdGgoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBlZGl0b3IuZ2V0VGV4dCgpKVxuICAgIGlmIEBzaG93RGlmZkRldGFpbHNcbiAgICAgIEB1cGRhdGVEaWZmRGV0YWlsc0Rpc3BsYXkoKVxuXG4gIHVwZGF0ZURpZmZEZXRhaWxzOiAtPlxuICAgIEBkaWZmRGV0YWlsc0RhdGFNYW5hZ2VyLmludmFsaWRhdGVQcmV2aW91c1NlbGVjdGVkSHVuaygpXG4gICAgQHVwZGF0ZUN1cnJlbnRSb3coKVxuICAgIEB1cGRhdGVEaWZmRGV0YWlsc0Rpc3BsYXkoKVxuXG4gIHRvZ2dsZVNob3dEaWZmRGV0YWlsczogLT5cbiAgICBAc2hvd0RpZmZEZXRhaWxzID0gIUBzaG93RGlmZkRldGFpbHNcbiAgICBAdXBkYXRlRGlmZkRldGFpbHMoKVxuXG4gIGNsb3NlRGlmZkRldGFpbHM6IC0+XG4gICAgQHNob3dEaWZmRGV0YWlscyA9IGZhbHNlXG4gICAgQHVwZGF0ZURpZmZEZXRhaWxzKClcblxuICBub3RpZnlDaGFuZ2VDdXJzb3JQb3NpdGlvbjogLT5cbiAgICBpZiBAc2hvd0RpZmZEZXRhaWxzXG4gICAgICBjdXJyZW50Um93Q2hhbmdlZCA9IEB1cGRhdGVDdXJyZW50Um93KClcbiAgICAgIEB1cGRhdGVEaWZmRGV0YWlsc0Rpc3BsYXkoKSBpZiBjdXJyZW50Um93Q2hhbmdlZFxuXG4gIGNvcHk6IC0+XG4gICAge3NlbGVjdGVkSHVua30gPSBAZGlmZkRldGFpbHNEYXRhTWFuYWdlci5nZXRTZWxlY3RlZEh1bmsoQGN1cnJlbnRSb3cpXG4gICAgaWYgc2VsZWN0ZWRIdW5rP1xuICAgICAgYXRvbS5jbGlwYm9hcmQud3JpdGUoc2VsZWN0ZWRIdW5rLm9sZFN0cmluZylcbiAgICAgIEBjbG9zZURpZmZEZXRhaWxzKCkgaWYgYXRvbS5jb25maWcuZ2V0KCdnaXQtZGlmZi1kZXRhaWxzLmNsb3NlQWZ0ZXJDb3B5JylcblxuICB1bmRvOiAtPlxuICAgIHtzZWxlY3RlZEh1bmt9ID0gQGRpZmZEZXRhaWxzRGF0YU1hbmFnZXIuZ2V0U2VsZWN0ZWRIdW5rKEBjdXJyZW50Um93KVxuXG4gICAgaWYgc2VsZWN0ZWRIdW5rPyBhbmQgYnVmZmVyID0gQGVkaXRvci5nZXRCdWZmZXIoKVxuICAgICAgaWYgc2VsZWN0ZWRIdW5rLmtpbmQgaXMgXCJtXCJcbiAgICAgICAgYnVmZmVyLnNldFRleHRJblJhbmdlKFtbc2VsZWN0ZWRIdW5rLnN0YXJ0IC0gMSwgMF0sIFtzZWxlY3RlZEh1bmsuZW5kLCAwXV0sIHNlbGVjdGVkSHVuay5vbGRTdHJpbmcpXG4gICAgICBlbHNlXG4gICAgICAgIGJ1ZmZlci5pbnNlcnQoW3NlbGVjdGVkSHVuay5zdGFydCwgMF0sIHNlbGVjdGVkSHVuay5vbGRTdHJpbmcpXG4gICAgICBAY2xvc2VEaWZmRGV0YWlscygpIHVubGVzcyBhdG9tLmNvbmZpZy5nZXQoJ2dpdC1kaWZmLWRldGFpbHMua2VlcFZpZXdUb2dnbGVkJylcblxuICBkZXN0cm95RGVjb3JhdGlvbjogLT5cbiAgICBmb3IgbWFya2VyIGluIEBtYXJrZXJzXG4gICAgICBtYXJrZXIuZGVzdHJveSgpXG4gICAgQG1hcmtlcnMgPSBbXVxuXG4gIGRlY29yYXRlTGluZXM6IChlZGl0b3IsIHN0YXJ0LCBlbmQsIHR5cGUpIC0+XG4gICAgcmFuZ2UgPSBuZXcgUmFuZ2UobmV3IFBvaW50KHN0YXJ0LCAwKSwgbmV3IFBvaW50KGVuZCwgMCkpXG4gICAgbWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShyYW5nZSlcbiAgICBlZGl0b3IuZGVjb3JhdGVNYXJrZXIobWFya2VyLCB0eXBlOiAnbGluZScsIGNsYXNzOiBcImdpdC1kaWZmLWRldGFpbHMtI3t0eXBlfVwiKVxuICAgIEBtYXJrZXJzLnB1c2gobWFya2VyKVxuXG4gIGRlY29yYXRlV29yZHM6IChlZGl0b3IsIHN0YXJ0LCB3b3JkcywgdHlwZSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIHdvcmRzXG4gICAgZm9yIHdvcmQgaW4gd29yZHMgd2hlbiB3b3JkLmNoYW5nZWRcbiAgICAgIHJvdyA9IHN0YXJ0ICsgd29yZC5vZmZzZXRSb3dcbiAgICAgIHJhbmdlID0gbmV3IFJhbmdlKG5ldyBQb2ludChyb3csIHdvcmQuc3RhcnRDb2wpLCBuZXcgUG9pbnQocm93LCB3b3JkLmVuZENvbCkpXG4gICAgICBtYXJrZXIgPSBlZGl0b3IubWFya0J1ZmZlclJhbmdlKHJhbmdlKVxuICAgICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwgdHlwZTogJ2hpZ2hsaWdodCcsIGNsYXNzOiBcImdpdC1kaWZmLWRldGFpbHMtI3t0eXBlfVwiKVxuICAgICAgQG1hcmtlcnMucHVzaChtYXJrZXIpXG5cbiAgZGlzcGxheTogKHNlbGVjdGVkSHVuaykgLT5cbiAgICBAZGVzdHJveURlY29yYXRpb24oKVxuXG4gICAgY2xhc3NQb3N0Zml4ID1cbiAgICAgIGlmIGF0b20uY29uZmlnLmdldCgnZ2l0LWRpZmYtZGV0YWlscy5lbmFibGVTeW50YXhIaWdobGlnaHRpbmcnKVxuICAgICAgICBcImhpZ2hsaWdodGVkXCJcbiAgICAgIGVsc2UgXCJmbGF0XCJcblxuICAgIGlmIHNlbGVjdGVkSHVuay5raW5kIGlzIFwibVwiXG4gICAgICBAZGVjb3JhdGVMaW5lcyhAZWRpdG9yLCBzZWxlY3RlZEh1bmsuc3RhcnQgLSAxLCBzZWxlY3RlZEh1bmsuZW5kLCBcIm5ldy0je2NsYXNzUG9zdGZpeH1cIilcbiAgICAgIGlmIGF0b20uY29uZmlnLmdldCgnZ2l0LWRpZmYtZGV0YWlscy5zaG93V29yZERpZmZzJylcbiAgICAgICAgQGRlY29yYXRlV29yZHMoQGVkaXRvciwgc2VsZWN0ZWRIdW5rLnN0YXJ0IC0gMSwgc2VsZWN0ZWRIdW5rLm5ld1dvcmRzLCBcIm5ldy0je2NsYXNzUG9zdGZpeH1cIilcblxuICAgIHJhbmdlID0gbmV3IFJhbmdlKG5ldyBQb2ludChzZWxlY3RlZEh1bmsuZW5kIC0gMSwgMCksIG5ldyBQb2ludChzZWxlY3RlZEh1bmsuZW5kIC0gMSwgMCkpXG4gICAgbWFya2VyID0gQGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UocmFuZ2UpXG4gICAgQGVkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHR5cGU6ICdibG9jaycsIHBvc2l0aW9uOiAnYWZ0ZXInLCBpdGVtOiB0aGlzKVxuICAgIEBtYXJrZXJzLnB1c2gobWFya2VyKVxuXG4gICAgQGRpZmZFZGl0b3Iuc2V0R3JhbW1hcihAZ2V0QWN0aXZlVGV4dEVkaXRvcigpPy5nZXRHcmFtbWFyKCkpXG4gICAgQGRpZmZFZGl0b3Iuc2V0VGV4dChzZWxlY3RlZEh1bmsub2xkU3RyaW5nLnJlcGxhY2UoL1tcXHJcXG5dKyQvZywgXCJcIikpXG4gICAgQGRlY29yYXRlTGluZXMoQGRpZmZFZGl0b3IsIDAsIHNlbGVjdGVkSHVuay5vbGRMaW5lcy5sZW5ndGgsIFwib2xkLSN7Y2xhc3NQb3N0Zml4fVwiKVxuICAgIGlmIGF0b20uY29uZmlnLmdldCgnZ2l0LWRpZmYtZGV0YWlscy5zaG93V29yZERpZmZzJylcbiAgICAgIEBkZWNvcmF0ZVdvcmRzKEBkaWZmRWRpdG9yLCAwLCBzZWxlY3RlZEh1bmsub2xkV29yZHMsIFwib2xkLSN7Y2xhc3NQb3N0Zml4fVwiKVxuXG4gIHVwZGF0ZURpZmZEZXRhaWxzRGlzcGxheTogLT5cbiAgICBpZiBAc2hvd0RpZmZEZXRhaWxzXG4gICAgICB7c2VsZWN0ZWRIdW5rLCBpc0RpZmZlcmVudH0gPSBAZGlmZkRldGFpbHNEYXRhTWFuYWdlci5nZXRTZWxlY3RlZEh1bmsoQGN1cnJlbnRSb3cpXG5cbiAgICAgIGlmIHNlbGVjdGVkSHVuaz9cbiAgICAgICAgcmV0dXJuIHVubGVzcyBpc0RpZmZlcmVudFxuICAgICAgICBAZGlzcGxheShzZWxlY3RlZEh1bmspXG4gICAgICAgIHJldHVyblxuICAgICAgZWxzZVxuICAgICAgICBAY2xvc2VEaWZmRGV0YWlscygpIHVubGVzcyBhdG9tLmNvbmZpZy5nZXQoJ2dpdC1kaWZmLWRldGFpbHMua2VlcFZpZXdUb2dnbGVkJylcblxuICAgICAgQHByZXZpb3VzU2VsZWN0ZWRIdW5rID0gc2VsZWN0ZWRIdW5rXG5cbiAgICBAZGVzdHJveURlY29yYXRpb24oKVxuICAgIHJldHVyblxuIl19
