(function() {
  var DiffDetailsDataManager, JsDiff;

  JsDiff = require('diff');

  module.exports = DiffDetailsDataManager = (function() {
    function DiffDetailsDataManager() {
      this.invalidate();
    }

    DiffDetailsDataManager.prototype.liesBetween = function(hunk, row) {
      return (hunk.start <= row && row <= hunk.end);
    };

    DiffDetailsDataManager.prototype.isDifferentHunk = function() {
      if ((this.previousSelectedHunk != null) && (this.previousSelectedHunk.start != null) && (this.selectedHunk != null) && (this.selectedHunk.start != null)) {
        return this.selectedHunk.start !== this.previousSelectedHunk.start;
      }
      return true;
    };

    DiffDetailsDataManager.prototype.getSelectedHunk = function(currentRow) {
      var isDifferent;
      if ((this.selectedHunk == null) || this.selectedHunkInvalidated || !this.liesBetween(this.selectedHunk, currentRow)) {
        this.updateLineDiffDetails();
        this.updateSelectedHunk(currentRow);
      }
      this.selectedHunkInvalidated = false;
      isDifferent = this.isDifferentHunk();
      this.previousSelectedHunk = this.selectedHunk;
      return {
        selectedHunk: this.selectedHunk,
        isDifferent: isDifferent
      };
    };

    DiffDetailsDataManager.prototype.updateSelectedHunk = function(currentRow) {
      var hunk, j, len, ref, results;
      this.selectedHunk = null;
      if (this.lineDiffDetails != null) {
        ref = this.lineDiffDetails;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          hunk = ref[j];
          if (this.liesBetween(hunk, currentRow)) {
            this.selectedHunk = hunk;
            break;
          } else {
            results.push(void 0);
          }
        }
        return results;
      }
    };

    DiffDetailsDataManager.prototype.updateLineDiffDetails = function() {
      if ((this.lineDiffDetails == null) || this.lineDiffDetailsInvalidated) {
        this.prepareLineDiffDetails(this.repo, this.path, this.text);
        if (this.lineDiffDetails) {
          this.prepareWordDiffs(this.lineDiffDetails);
        }
      }
      this.lineDiffDetailsInvalidated = false;
      return this.lineDiffDetails;
    };

    DiffDetailsDataManager.prototype.prepareLineDiffDetails = function(repo, path, text) {
      var hunk, j, kind, len, line, newEnd, newLineNumber, newLines, newStart, oldLineNumber, oldLines, oldStart, options, rawLineDiffDetails, ref, results;
      this.lineDiffDetails = null;
      repo = repo.getRepo(path);
      options = {
        ignoreEolWhitespace: process.platform === 'win32'
      };
      rawLineDiffDetails = repo.getLineDiffDetails(repo.relativize(path), text, options);
      if (rawLineDiffDetails == null) {
        return;
      }
      this.lineDiffDetails = [];
      hunk = null;
      results = [];
      for (j = 0, len = rawLineDiffDetails.length; j < len; j++) {
        ref = rawLineDiffDetails[j], oldStart = ref.oldStart, newStart = ref.newStart, oldLines = ref.oldLines, newLines = ref.newLines, oldLineNumber = ref.oldLineNumber, newLineNumber = ref.newLineNumber, line = ref.line;
        if (!(oldLines === 0 && newLines > 0)) {
          if ((hunk == null) || (newStart !== hunk.start)) {
            newEnd = null;
            kind = null;
            if (newLines === 0 && oldLines > 0) {
              newEnd = newStart;
              kind = "d";
            } else {
              newEnd = newStart + newLines - 1;
              kind = "m";
            }
            hunk = {
              start: newStart,
              end: newEnd,
              oldLines: [],
              newLines: [],
              newString: "",
              oldString: "",
              kind: kind
            };
            this.lineDiffDetails.push(hunk);
          }
          if (newLineNumber >= 0) {
            hunk.newLines.push(line);
            results.push(hunk.newString += line);
          } else {
            hunk.oldLines.push(line);
            results.push(hunk.oldString += line);
          }
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    DiffDetailsDataManager.prototype.prepareWordDiffs = function(lineDiffDetails) {
      var diff, hunk, i, j, len, newCol, oldCol, results, word;
      results = [];
      for (j = 0, len = lineDiffDetails.length; j < len; j++) {
        hunk = lineDiffDetails[j];
        if (hunk.kind !== "m" || hunk.newLines.length !== hunk.oldLines.length) {
          continue;
        }
        hunk.newWords = [];
        hunk.oldWords = [];
        results.push((function() {
          var k, ref, results1;
          results1 = [];
          for (i = k = 0, ref = hunk.newLines.length; k < ref; i = k += 1) {
            newCol = oldCol = 0;
            diff = JsDiff.diffWordsWithSpace(hunk.oldLines[i], hunk.newLines[i]);
            results1.push((function() {
              var l, len1, results2;
              results2 = [];
              for (l = 0, len1 = diff.length; l < len1; l++) {
                word = diff[l];
                word.offsetRow = i;
                if (word.added) {
                  word.changed = true;
                  word.startCol = newCol;
                  newCol += word.value.length;
                  word.endCol = newCol;
                  results2.push(hunk.newWords.push(word));
                } else if (word.removed) {
                  word.changed = true;
                  word.startCol = oldCol;
                  oldCol += word.value.length;
                  word.endCol = oldCol;
                  results2.push(hunk.oldWords.push(word));
                } else {
                  newCol += word.value.length;
                  oldCol += word.value.length;
                  hunk.newWords.push(word);
                  results2.push(hunk.oldWords.push(word));
                }
              }
              return results2;
            })());
          }
          return results1;
        })());
      }
      return results;
    };

    DiffDetailsDataManager.prototype.invalidate = function(repo1, path1, text1) {
      this.repo = repo1;
      this.path = path1;
      this.text = text1;
      this.selectedHunkInvalidated = true;
      this.lineDiffDetailsInvalidated = true;
      return this.invalidatePreviousSelectedHunk();
    };

    DiffDetailsDataManager.prototype.invalidatePreviousSelectedHunk = function() {
      return this.previousSelectedHunk = null;
    };

    return DiffDetailsDataManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvZ2l0LWRpZmYtZGV0YWlscy9saWIvZGF0YS1tYW5hZ2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSxNQUFSOztFQUVULE1BQU0sQ0FBQyxPQUFQLEdBQXVCO0lBQ1IsZ0NBQUE7TUFDWCxJQUFDLENBQUEsVUFBRCxDQUFBO0lBRFc7O3FDQUdiLFdBQUEsR0FBYSxTQUFDLElBQUQsRUFBTyxHQUFQO2FBQ1gsQ0FBQSxJQUFJLENBQUMsS0FBTCxJQUFjLEdBQWQsSUFBYyxHQUFkLElBQXFCLElBQUksQ0FBQyxHQUExQjtJQURXOztxQ0FHYixlQUFBLEdBQWlCLFNBQUE7TUFDZixJQUFHLG1DQUFBLElBQTJCLHlDQUEzQixJQUE0RCwyQkFBNUQsSUFBK0UsaUNBQWxGO0FBQ0UsZUFBTyxJQUFDLENBQUEsWUFBWSxDQUFDLEtBQWQsS0FBdUIsSUFBQyxDQUFBLG9CQUFvQixDQUFDLE1BRHREOztBQUVBLGFBQU87SUFIUTs7cUNBS2pCLGVBQUEsR0FBaUIsU0FBQyxVQUFEO0FBQ2YsVUFBQTtNQUFBLElBQUksMkJBQUQsSUFBbUIsSUFBQyxDQUFBLHVCQUFwQixJQUErQyxDQUFDLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBQyxDQUFBLFlBQWQsRUFBNEIsVUFBNUIsQ0FBbkQ7UUFDRSxJQUFDLENBQUEscUJBQUQsQ0FBQTtRQUNBLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixVQUFwQixFQUZGOztNQUlBLElBQUMsQ0FBQSx1QkFBRCxHQUEyQjtNQUUzQixXQUFBLEdBQWMsSUFBQyxDQUFBLGVBQUQsQ0FBQTtNQUVkLElBQUMsQ0FBQSxvQkFBRCxHQUF3QixJQUFDLENBQUE7YUFFekI7UUFBQyxZQUFBLEVBQWMsSUFBQyxDQUFBLFlBQWhCO1FBQThCLGFBQUEsV0FBOUI7O0lBWGU7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LEVBQWUsS0FBZjtNQUFDLElBQUMsQ0FBQSxPQUFEO01BQU8sSUFBQyxDQUFBLE9BQUQ7TUFBTyxJQUFDLENBQUEsT0FBRDtNQUN6QixJQUFDLENBQUEsdUJBQUQsR0FBMkI7TUFDM0IsSUFBQyxDQUFBLDBCQUFELEdBQThCO2FBQzlCLElBQUMsQ0FBQSw4QkFBRCxDQUFBO0lBSFU7O3FDQUtaLDhCQUFBLEdBQWdDLFNBQUE7YUFDOUIsSUFBQyxDQUFBLG9CQUFELEdBQXdCO0lBRE07Ozs7O0FBekhsQyIsInNvdXJjZXNDb250ZW50IjpbIkpzRGlmZiA9IHJlcXVpcmUoJ2RpZmYnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERpZmZEZXRhaWxzRGF0YU1hbmFnZXJcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGludmFsaWRhdGUoKVxuXG4gIGxpZXNCZXR3ZWVuOiAoaHVuaywgcm93KSAtPlxuICAgIGh1bmsuc3RhcnQgPD0gcm93IDw9IGh1bmsuZW5kXG5cbiAgaXNEaWZmZXJlbnRIdW5rOiAtPlxuICAgIGlmIEBwcmV2aW91c1NlbGVjdGVkSHVuaz8gYW5kIEBwcmV2aW91c1NlbGVjdGVkSHVuay5zdGFydD8gYW5kIEBzZWxlY3RlZEh1bms/IGFuZCBAc2VsZWN0ZWRIdW5rLnN0YXJ0P1xuICAgICAgcmV0dXJuIEBzZWxlY3RlZEh1bmsuc3RhcnQgIT0gQHByZXZpb3VzU2VsZWN0ZWRIdW5rLnN0YXJ0XG4gICAgcmV0dXJuIHRydWVcblxuICBnZXRTZWxlY3RlZEh1bms6IChjdXJyZW50Um93KSAtPlxuICAgIGlmICFAc2VsZWN0ZWRIdW5rPyBvciBAc2VsZWN0ZWRIdW5rSW52YWxpZGF0ZWQgb3IgIUBsaWVzQmV0d2VlbihAc2VsZWN0ZWRIdW5rLCBjdXJyZW50Um93KVxuICAgICAgQHVwZGF0ZUxpbmVEaWZmRGV0YWlscygpXG4gICAgICBAdXBkYXRlU2VsZWN0ZWRIdW5rKGN1cnJlbnRSb3cpXG5cbiAgICBAc2VsZWN0ZWRIdW5rSW52YWxpZGF0ZWQgPSBmYWxzZVxuXG4gICAgaXNEaWZmZXJlbnQgPSBAaXNEaWZmZXJlbnRIdW5rKClcblxuICAgIEBwcmV2aW91c1NlbGVjdGVkSHVuayA9IEBzZWxlY3RlZEh1bmtcblxuICAgIHtzZWxlY3RlZEh1bms6IEBzZWxlY3RlZEh1bmssIGlzRGlmZmVyZW50fVxuXG4gIHVwZGF0ZVNlbGVjdGVkSHVuazogKGN1cnJlbnRSb3cpIC0+XG4gICAgQHNlbGVjdGVkSHVuayA9IG51bGxcblxuICAgIGlmIEBsaW5lRGlmZkRldGFpbHM/XG4gICAgICBmb3IgaHVuayBpbiBAbGluZURpZmZEZXRhaWxzXG4gICAgICAgIGlmIEBsaWVzQmV0d2VlbihodW5rLCBjdXJyZW50Um93KVxuICAgICAgICAgIEBzZWxlY3RlZEh1bmsgPSBodW5rXG4gICAgICAgICAgYnJlYWtcblxuICB1cGRhdGVMaW5lRGlmZkRldGFpbHM6IC0+XG4gICAgaWYgIUBsaW5lRGlmZkRldGFpbHM/IG9yIEBsaW5lRGlmZkRldGFpbHNJbnZhbGlkYXRlZFxuICAgICAgQHByZXBhcmVMaW5lRGlmZkRldGFpbHMoQHJlcG8sIEBwYXRoLCBAdGV4dClcbiAgICAgIEBwcmVwYXJlV29yZERpZmZzKEBsaW5lRGlmZkRldGFpbHMpIGlmIEBsaW5lRGlmZkRldGFpbHNcblxuICAgIEBsaW5lRGlmZkRldGFpbHNJbnZhbGlkYXRlZCA9IGZhbHNlXG4gICAgQGxpbmVEaWZmRGV0YWlsc1xuXG4gIHByZXBhcmVMaW5lRGlmZkRldGFpbHM6IChyZXBvLCBwYXRoLCB0ZXh0KSAtPlxuICAgIEBsaW5lRGlmZkRldGFpbHMgPSBudWxsXG5cbiAgICByZXBvID0gcmVwby5nZXRSZXBvKHBhdGgpXG5cbiAgICBvcHRpb25zID0gaWdub3JlRW9sV2hpdGVzcGFjZTogcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnd2luMzInXG5cbiAgICByYXdMaW5lRGlmZkRldGFpbHMgPSByZXBvLmdldExpbmVEaWZmRGV0YWlscyhyZXBvLnJlbGF0aXZpemUocGF0aCksIHRleHQsIG9wdGlvbnMpXG5cbiAgICByZXR1cm4gdW5sZXNzIHJhd0xpbmVEaWZmRGV0YWlscz9cblxuICAgIEBsaW5lRGlmZkRldGFpbHMgPSBbXVxuICAgIGh1bmsgPSBudWxsXG5cbiAgICBmb3Ige29sZFN0YXJ0LCBuZXdTdGFydCwgb2xkTGluZXMsIG5ld0xpbmVzLCBvbGRMaW5lTnVtYmVyLCBuZXdMaW5lTnVtYmVyLCBsaW5lfSBpbiByYXdMaW5lRGlmZkRldGFpbHNcbiAgICAgICMgcHJvY2VzcyBtb2RpZmljYXRpb25zIGFuZCBkZWxldGlvbnMgb25seVxuICAgICAgdW5sZXNzIG9sZExpbmVzIGlzIDAgYW5kIG5ld0xpbmVzID4gMFxuICAgICAgICAjIGNyZWF0ZSBhIG5ldyBodW5rIGVudHJ5IGlmIHRoZSBodW5rIHN0YXJ0IG9mIHRoZSBwcmV2aW91cyBsaW5lXG4gICAgICAgICMgaXMgZGlmZmVyZW50IHRvIHRoZSBjdXJyZW50XG4gICAgICAgIGlmIG5vdCBodW5rPyBvciAobmV3U3RhcnQgaXNudCBodW5rLnN0YXJ0KVxuICAgICAgICAgIG5ld0VuZCA9IG51bGxcbiAgICAgICAgICBraW5kID0gbnVsbFxuICAgICAgICAgIGlmIG5ld0xpbmVzIGlzIDAgYW5kIG9sZExpbmVzID4gMFxuICAgICAgICAgICAgbmV3RW5kID0gbmV3U3RhcnRcbiAgICAgICAgICAgIGtpbmQgPSBcImRcIlxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIG5ld0VuZCA9IG5ld1N0YXJ0ICsgbmV3TGluZXMgLSAxXG4gICAgICAgICAgICBraW5kID0gXCJtXCJcblxuICAgICAgICAgIGh1bmsgPSB7XG4gICAgICAgICAgICBzdGFydDogbmV3U3RhcnQsIGVuZDogbmV3RW5kLFxuICAgICAgICAgICAgb2xkTGluZXM6IFtdLCBuZXdMaW5lczogW10sXG4gICAgICAgICAgICBuZXdTdHJpbmc6IFwiXCIsIG9sZFN0cmluZzogXCJcIlxuICAgICAgICAgICAga2luZFxuICAgICAgICAgIH1cbiAgICAgICAgICBAbGluZURpZmZEZXRhaWxzLnB1c2goaHVuaylcblxuICAgICAgICBpZiBuZXdMaW5lTnVtYmVyID49IDBcbiAgICAgICAgICBodW5rLm5ld0xpbmVzLnB1c2gobGluZSlcbiAgICAgICAgICBodW5rLm5ld1N0cmluZyArPSBsaW5lXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBodW5rLm9sZExpbmVzLnB1c2gobGluZSlcbiAgICAgICAgICBodW5rLm9sZFN0cmluZyArPSBsaW5lXG5cbiAgcHJlcGFyZVdvcmREaWZmczogKGxpbmVEaWZmRGV0YWlscykgLT5cbiAgICBmb3IgaHVuayBpbiBsaW5lRGlmZkRldGFpbHNcbiAgICAgIGNvbnRpbnVlIGlmIGh1bmsua2luZCBpc250IFwibVwiIG9yIGh1bmsubmV3TGluZXMubGVuZ3RoICE9IGh1bmsub2xkTGluZXMubGVuZ3RoXG4gICAgICBodW5rLm5ld1dvcmRzID0gW11cbiAgICAgIGh1bmsub2xkV29yZHMgPSBbXVxuICAgICAgZm9yIGkgaW4gWzAuLi5odW5rLm5ld0xpbmVzLmxlbmd0aF0gYnkgMVxuICAgICAgICBuZXdDb2wgPSBvbGRDb2wgPSAwXG4gICAgICAgIGRpZmYgPSBKc0RpZmYuZGlmZldvcmRzV2l0aFNwYWNlKGh1bmsub2xkTGluZXNbaV0sIGh1bmsubmV3TGluZXNbaV0pXG4gICAgICAgIGZvciB3b3JkIGluIGRpZmZcbiAgICAgICAgICB3b3JkLm9mZnNldFJvdyA9IGlcbiAgICAgICAgICBpZiB3b3JkLmFkZGVkXG4gICAgICAgICAgICB3b3JkLmNoYW5nZWQgPSB0cnVlXG4gICAgICAgICAgICB3b3JkLnN0YXJ0Q29sID0gbmV3Q29sXG4gICAgICAgICAgICBuZXdDb2wgKz0gd29yZC52YWx1ZS5sZW5ndGhcbiAgICAgICAgICAgIHdvcmQuZW5kQ29sID0gbmV3Q29sXG4gICAgICAgICAgICBodW5rLm5ld1dvcmRzLnB1c2god29yZClcbiAgICAgICAgICBlbHNlIGlmIHdvcmQucmVtb3ZlZFxuICAgICAgICAgICAgd29yZC5jaGFuZ2VkID0gdHJ1ZVxuICAgICAgICAgICAgd29yZC5zdGFydENvbCA9IG9sZENvbFxuICAgICAgICAgICAgb2xkQ29sICs9IHdvcmQudmFsdWUubGVuZ3RoXG4gICAgICAgICAgICB3b3JkLmVuZENvbCA9IG9sZENvbFxuICAgICAgICAgICAgaHVuay5vbGRXb3Jkcy5wdXNoKHdvcmQpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgbmV3Q29sICs9IHdvcmQudmFsdWUubGVuZ3RoXG4gICAgICAgICAgICBvbGRDb2wgKz0gd29yZC52YWx1ZS5sZW5ndGhcbiAgICAgICAgICAgIGh1bmsubmV3V29yZHMucHVzaCh3b3JkKVxuICAgICAgICAgICAgaHVuay5vbGRXb3Jkcy5wdXNoKHdvcmQpXG5cbiAgaW52YWxpZGF0ZTogKEByZXBvLCBAcGF0aCwgQHRleHQpIC0+XG4gICAgQHNlbGVjdGVkSHVua0ludmFsaWRhdGVkID0gdHJ1ZVxuICAgIEBsaW5lRGlmZkRldGFpbHNJbnZhbGlkYXRlZCA9IHRydWVcbiAgICBAaW52YWxpZGF0ZVByZXZpb3VzU2VsZWN0ZWRIdW5rKClcblxuICBpbnZhbGlkYXRlUHJldmlvdXNTZWxlY3RlZEh1bms6IC0+XG4gICAgQHByZXZpb3VzU2VsZWN0ZWRIdW5rID0gbnVsbFxuIl19
