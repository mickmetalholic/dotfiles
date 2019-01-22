(function() {
  var CompositeDisposable, LineNumberView, debounce,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  CompositeDisposable = require('atom').CompositeDisposable;

  debounce = require('lodash').debounce;

  module.exports = LineNumberView = (function() {
    function LineNumberView(editor) {
      this.editor = editor;
      this._undo = bind(this._undo, this);
      this._updateSync = bind(this._updateSync, this);
      this._handleUpdate = bind(this._handleUpdate, this);
      this._update = bind(this._update, this);
      this.subscriptions = new CompositeDisposable();
      this.editorView = atom.views.getView(this.editor);
      this.debounceMotion = atom.config.get('relative-numbers.debounceMotion');
      this.trueNumberCurrentLine = atom.config.get('relative-numbers.trueNumberCurrentLine');
      this.showAbsoluteNumbers = atom.config.get('relative-numbers.showAbsoluteNumbers');
      this.startAtOne = atom.config.get('relative-numbers.startAtOne');
      this.softWrapsCount = atom.config.get('relative-numbers.softWrapsCount');
      this.showAbsoluteNumbersInInsertMode = atom.config.get('relative-numbers.showAbsoluteNumbersInInsertMode');
      this.lineNumberGutterView = atom.views.getView(this.editor.gutterWithName('line-number'));
      this.gutter = this.editor.addGutter({
        name: 'relative-numbers'
      });
      this.gutter.view = this;
      this._updateDebounce();
      try {
        this.subscriptions.add(this.editorView.model.onDidChange((function(_this) {
          return function() {
            return setTimeout(_this._update, 0);
          };
        })(this)));
      } catch (error) {
        this.subscriptions.add(this.editorView.onDidAttach(this._update));
        this.subscriptions.add(this.editor.onDidStopChanging(this._update));
      }
      this.subscriptions.add(this.editor.onDidChangeCursorPosition(this._update));
      this.subscriptions.add(this.editorView.onDidChangeScrollTop(this._update));
      this.subscriptions.add(atom.config.onDidChange('relative-numbers.debounceMotion', (function(_this) {
        return function() {
          _this.debounceMotion = atom.config.get('relative-numbers.debounceMotion');
          return _this._updateDebounce();
        };
      })(this)));
      this.subscriptions.add(atom.config.onDidChange('relative-numbers.trueNumberCurrentLine', (function(_this) {
        return function() {
          _this.trueNumberCurrentLine = atom.config.get('relative-numbers.trueNumberCurrentLine');
          return _this._update();
        };
      })(this)));
      this.subscriptions.add(atom.config.onDidChange('relative-numbers.showAbsoluteNumbers', (function(_this) {
        return function() {
          _this.showAbsoluteNumbers = atom.config.get('relative-numbers.showAbsoluteNumbers');
          return _this._updateAbsoluteNumbers();
        };
      })(this)));
      this.subscriptions.add(atom.config.onDidChange('relative-numbers.startAtOne', (function(_this) {
        return function() {
          _this.startAtOne = atom.config.get('relative-numbers.startAtOne');
          return _this._update();
        };
      })(this)));
      this.subscriptions.add(atom.config.onDidChange('relative-numbers.softWrapsCount', (function(_this) {
        return function() {
          _this.softWrapsCount = atom.config.get('relative-numbers.softWrapsCount');
          return _this._update();
        };
      })(this)));
      this.subscriptions.add(atom.config.onDidChange('relative-numbers.showAbsoluteNumbersInInsertMode', (function(_this) {
        return function() {
          _this.showAbsoluteNumbersInInsertMode = atom.config.get('relative-numbers.showAbsoluteNumbersInInsertMode');
          return _this._updateInsertMode();
        };
      })(this)));
      this.subscriptions.add(this.editor.onDidDestroy((function(_this) {
        return function() {
          return _this.subscriptions.dispose();
        };
      })(this)));
      this._update();
      this._updateAbsoluteNumbers();
      this._updateInsertMode();
    }

    LineNumberView.prototype.destroy = function() {
      this.subscriptions.dispose();
      this._undo();
      return this.gutter.destroy();
    };

    LineNumberView.prototype._spacer = function(totalLines, currentIndex) {
      var width;
      width = Math.max(0, totalLines.toString().length - currentIndex.toString().length);
      return Array(width + 1).join('&nbsp;');
    };

    LineNumberView.prototype._update = function() {
      return this.debouncedUpdate();
    };

    LineNumberView.prototype._handleUpdate = function() {
      if (this.editorView.isUpdatedSynchronously()) {
        return this._updateSync();
      } else {
        return atom.views.updateDocument((function(_this) {
          return function() {
            return _this._updateSync();
          };
        })(this));
      }
    };

    LineNumberView.prototype._updateSync = function() {
      var absolute, absoluteText, counting_attribute, currentLineNumber, endOfLineSelected, i, len, lineNumberElement, lineNumberElements, offset, relative, relativeClass, relativeText, results, row, totalLines;
      if (this.editor.isDestroyed()) {
        return;
      }
      totalLines = this.editor.getLineCount();
      currentLineNumber = this.softWrapsCount ? this.editor.getCursorScreenPosition().row : this.editor.getCursorBufferPosition().row;
      if (this.editor.getSelectedText().match(/\n$/)) {
        endOfLineSelected = true;
      } else {
        currentLineNumber = currentLineNumber + 1;
      }
      lineNumberElements = this.editorView.querySelectorAll('.line-numbers .line-number');
      offset = this.startAtOne ? 1 : 0;
      counting_attribute = this.softWrapsCount ? 'data-screen-row' : 'data-buffer-row';
      results = [];
      for (i = 0, len = lineNumberElements.length; i < len; i++) {
        lineNumberElement = lineNumberElements[i];
        row = Number(lineNumberElement.getAttribute(counting_attribute)) || 0;
        absolute = Number(lineNumberElement.getAttribute('data-buffer-row')) + 1 || 1;
        relative = Math.abs(currentLineNumber - row - 1);
        relativeClass = 'relative';
        if (this.trueNumberCurrentLine && relative === 0) {
          if (endOfLineSelected) {
            relative = Number(this.editor.getCursorBufferPosition().row);
          } else {
            relative = Number(this.editor.getCursorBufferPosition().row) + 1;
          }
          relativeClass += ' current-line';
        } else {
          relative += offset;
        }
        absoluteText = this._spacer(totalLines, absolute) + absolute;
        relativeText = this._spacer(totalLines, relative) + relative;
        if (lineNumberElement.innerHTML.indexOf('•') === -1) {
          results.push(lineNumberElement.innerHTML = "<span class=\"absolute\">" + absoluteText + "</span><span class=\"" + relativeClass + "\">" + relativeText + "</span><div class=\"icon-right\"></div>");
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    LineNumberView.prototype._updateAbsoluteNumbers = function() {
      return this.lineNumberGutterView.classList.toggle('show-absolute', this.showAbsoluteNumbers);
    };

    LineNumberView.prototype._updateInsertMode = function() {
      return this.lineNumberGutterView.classList.toggle('show-absolute-insert-mode', this.showAbsoluteNumbersInInsertMode);
    };

    LineNumberView.prototype._updateDebounce = function() {
      if (this.debounceMotion) {
        return this.debouncedUpdate = debounce(this._handleUpdate, this.debounceMotion, {
          maxWait: this.debounceMotion
        });
      } else {
        return this.debouncedUpdate = this._handleUpdate;
      }
    };

    LineNumberView.prototype._undo = function() {
      var absolute, absoluteText, i, len, lineNumberElement, lineNumberElements, row, totalLines;
      totalLines = this.editor.getLineCount();
      lineNumberElements = this.editorView.querySelectorAll('.line-number');
      for (i = 0, len = lineNumberElements.length; i < len; i++) {
        lineNumberElement = lineNumberElements[i];
        row = Number(lineNumberElement.getAttribute('data-buffer-row'));
        absolute = row + 1;
        absoluteText = this._spacer(totalLines, absolute) + absolute;
        if (lineNumberElement.innerHTML.indexOf('•') === -1) {
          lineNumberElement.innerHTML = absoluteText + "<div class=\"icon-right\"></div>";
        }
      }
      this.lineNumberGutterView.classList.remove('show-absolute');
      return this.lineNumberGutterView.classList.remove('show-absolute-insert-mode');
    };

    return LineNumberView;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvcmVsYXRpdmUtbnVtYmVycy9saWIvbGluZS1udW1iZXItdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDZDQUFBO0lBQUE7O0VBQUMsc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUN2QixXQUFhLE9BQUEsQ0FBUSxRQUFSOztFQUVkLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyx3QkFBQyxNQUFEO01BQUMsSUFBQyxDQUFBLFNBQUQ7Ozs7O01BQ1osSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSSxtQkFBSixDQUFBO01BQ2pCLElBQUMsQ0FBQSxVQUFELEdBQWMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFYLENBQW1CLElBQUMsQ0FBQSxNQUFwQjtNQUNkLElBQUMsQ0FBQSxjQUFELEdBQWtCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixpQ0FBaEI7TUFDbEIsSUFBQyxDQUFBLHFCQUFELEdBQXlCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQix3Q0FBaEI7TUFDekIsSUFBQyxDQUFBLG1CQUFELEdBQXVCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixzQ0FBaEI7TUFDdkIsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsNkJBQWhCO01BQ2QsSUFBQyxDQUFBLGNBQUQsR0FBa0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLGlDQUFoQjtNQUNsQixJQUFDLENBQUEsK0JBQUQsR0FBbUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLGtEQUFoQjtNQUVuQyxJQUFDLENBQUEsb0JBQUQsR0FBd0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFYLENBQW1CLElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUF1QixhQUF2QixD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bUNBRGhEOztBQUpGO01BT0EsSUFBQyxDQUFBLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxNQUFoQyxDQUF1QyxlQUF2QzthQUNBLElBQUMsQ0FBQSxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsTUFBaEMsQ0FBdUMsMkJBQXZDO0lBWEs7Ozs7O0FBN0pUIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbntkZWJvdW5jZX0gID0gcmVxdWlyZSAnbG9kYXNoJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBMaW5lTnVtYmVyVmlld1xuICBjb25zdHJ1Y3RvcjogKEBlZGl0b3IpIC0+XG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgQGVkaXRvclZpZXcgPSBhdG9tLnZpZXdzLmdldFZpZXcoQGVkaXRvcilcbiAgICBAZGVib3VuY2VNb3Rpb24gPSBhdG9tLmNvbmZpZy5nZXQoJ3JlbGF0aXZlLW51bWJlcnMuZGVib3VuY2VNb3Rpb24nKVxuICAgIEB0cnVlTnVtYmVyQ3VycmVudExpbmUgPSBhdG9tLmNvbmZpZy5nZXQoJ3JlbGF0aXZlLW51bWJlcnMudHJ1ZU51bWJlckN1cnJlbnRMaW5lJylcbiAgICBAc2hvd0Fic29sdXRlTnVtYmVycyA9IGF0b20uY29uZmlnLmdldCgncmVsYXRpdmUtbnVtYmVycy5zaG93QWJzb2x1dGVOdW1iZXJzJylcbiAgICBAc3RhcnRBdE9uZSA9IGF0b20uY29uZmlnLmdldCgncmVsYXRpdmUtbnVtYmVycy5zdGFydEF0T25lJylcbiAgICBAc29mdFdyYXBzQ291bnQgPSBhdG9tLmNvbmZpZy5nZXQoJ3JlbGF0aXZlLW51bWJlcnMuc29mdFdyYXBzQ291bnQnKVxuICAgIEBzaG93QWJzb2x1dGVOdW1iZXJzSW5JbnNlcnRNb2RlID0gYXRvbS5jb25maWcuZ2V0KCdyZWxhdGl2ZS1udW1iZXJzLnNob3dBYnNvbHV0ZU51bWJlcnNJbkluc2VydE1vZGUnKVxuXG4gICAgQGxpbmVOdW1iZXJHdXR0ZXJWaWV3ID0gYXRvbS52aWV3cy5nZXRWaWV3KEBlZGl0b3IuZ3V0dGVyV2l0aE5hbWUoJ2xpbmUtbnVtYmVyJykpXG5cbiAgICBAZ3V0dGVyID0gQGVkaXRvci5hZGRHdXR0ZXJcbiAgICAgIG5hbWU6ICdyZWxhdGl2ZS1udW1iZXJzJ1xuICAgIEBndXR0ZXIudmlldyA9IHRoaXNcblxuICAgIEBfdXBkYXRlRGVib3VuY2UoKVxuXG4gICAgdHJ5XG4gICAgICAjIFByZWZlcnJlZDogU3Vic2NyaWJlIHRvIGFueSBlZGl0b3IgbW9kZWwgY2hhbmdlc1xuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBlZGl0b3JWaWV3Lm1vZGVsLm9uRGlkQ2hhbmdlID0+XG4gICAgICAgIHNldFRpbWVvdXQgQF91cGRhdGUsIDBcbiAgICBjYXRjaFxuICAgICAgIyBGYWxsYmFjazogU3Vic2NyaWJlIHRvIGluaXRpYWxpemF0aW9uIGFuZCBlZGl0b3IgY2hhbmdlc1xuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBlZGl0b3JWaWV3Lm9uRGlkQXR0YWNoKEBfdXBkYXRlKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBlZGl0b3Iub25EaWRTdG9wQ2hhbmdpbmcoQF91cGRhdGUpXG5cbiAgICAjIFN1YnNjcmliZSBmb3Igd2hlbiB0aGUgY3Vyc29yIHBvc2l0aW9uIGNoYW5nZXNcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQGVkaXRvci5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKEBfdXBkYXRlKVxuXG4gICAgIyBVcGRhdGUgd2hlbiBzY3JvbGxpbmdcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQGVkaXRvclZpZXcub25EaWRDaGFuZ2VTY3JvbGxUb3AoQF91cGRhdGUpXG5cbiAgICAjIFN1YnNjcmliZSB0byB3aGVuIHRoZSByZXZlcnQgdG8gYWJzb2x1dGUgbnVtYmVycyBjb25maWcgb3B0aW9uIGlzIG1vZGlmaWVkXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlICdyZWxhdGl2ZS1udW1iZXJzLmRlYm91bmNlTW90aW9uJywgPT5cbiAgICAgIEBkZWJvdW5jZU1vdGlvbiA9IGF0b20uY29uZmlnLmdldCgncmVsYXRpdmUtbnVtYmVycy5kZWJvdW5jZU1vdGlvbicpXG4gICAgICBAX3VwZGF0ZURlYm91bmNlKClcblxuICAgICMgU3Vic2NyaWJlIHRvIHdoZW4gdGhlIHRydWUgbnVtYmVyIG9uIGN1cnJlbnQgbGluZSBjb25maWcgaXMgbW9kaWZpZWQuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlICdyZWxhdGl2ZS1udW1iZXJzLnRydWVOdW1iZXJDdXJyZW50TGluZScsID0+XG4gICAgICBAdHJ1ZU51bWJlckN1cnJlbnRMaW5lID0gYXRvbS5jb25maWcuZ2V0KCdyZWxhdGl2ZS1udW1iZXJzLnRydWVOdW1iZXJDdXJyZW50TGluZScpXG4gICAgICBAX3VwZGF0ZSgpXG5cbiAgICAjIFN1YnNjcmliZSB0byB3aGVuIHRoZSBzaG93IGFic29sdXRlIG51bWJlcnMgc2V0dGluZyBoYXMgY2hhbmdlZFxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAncmVsYXRpdmUtbnVtYmVycy5zaG93QWJzb2x1dGVOdW1iZXJzJywgPT5cbiAgICAgIEBzaG93QWJzb2x1dGVOdW1iZXJzID0gYXRvbS5jb25maWcuZ2V0KCdyZWxhdGl2ZS1udW1iZXJzLnNob3dBYnNvbHV0ZU51bWJlcnMnKVxuICAgICAgQF91cGRhdGVBYnNvbHV0ZU51bWJlcnMoKVxuXG4gICAgIyBTdWJzY3JpYmUgdG8gd2hlbiB0aGUgc3RhcnQgYXQgb25lIGNvbmZpZyBvcHRpb24gaXMgbW9kaWZpZWRcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ3JlbGF0aXZlLW51bWJlcnMuc3RhcnRBdE9uZScsID0+XG4gICAgICBAc3RhcnRBdE9uZSA9IGF0b20uY29uZmlnLmdldCgncmVsYXRpdmUtbnVtYmVycy5zdGFydEF0T25lJylcbiAgICAgIEBfdXBkYXRlKClcblxuICAgICMgU3Vic2NyaWJlIHRvIHdoZW4gdGhlIHN0YXJ0IGF0IG9uZSBjb25maWcgb3B0aW9uIGlzIG1vZGlmaWVkXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlICdyZWxhdGl2ZS1udW1iZXJzLnNvZnRXcmFwc0NvdW50JywgPT5cbiAgICAgIEBzb2Z0V3JhcHNDb3VudCA9IGF0b20uY29uZmlnLmdldCgncmVsYXRpdmUtbnVtYmVycy5zb2Z0V3JhcHNDb3VudCcpXG4gICAgICBAX3VwZGF0ZSgpXG5cbiAgICAjIFN1YnNjcmliZSB0byB3aGVuIHRoZSByZXZlcnQgdG8gYWJzb2x1dGUgbnVtYmVycyBjb25maWcgb3B0aW9uIGlzIG1vZGlmaWVkXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlICdyZWxhdGl2ZS1udW1iZXJzLnNob3dBYnNvbHV0ZU51bWJlcnNJbkluc2VydE1vZGUnLCA9PlxuICAgICAgQHNob3dBYnNvbHV0ZU51bWJlcnNJbkluc2VydE1vZGUgPSBhdG9tLmNvbmZpZy5nZXQoJ3JlbGF0aXZlLW51bWJlcnMuc2hvd0Fic29sdXRlTnVtYmVyc0luSW5zZXJ0TW9kZScpXG4gICAgICBAX3VwZGF0ZUluc2VydE1vZGUoKVxuXG5cbiAgICAjIERpc3Bvc2UgdGhlIHN1YnNjcmlwdGlvbnMgd2hlbiB0aGUgZWRpdG9yIGlzIGRlc3Ryb3llZC5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQGVkaXRvci5vbkRpZERlc3Ryb3kgPT5cbiAgICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuXG4gICAgQF91cGRhdGUoKVxuICAgIEBfdXBkYXRlQWJzb2x1dGVOdW1iZXJzKClcbiAgICBAX3VwZGF0ZUluc2VydE1vZGUoKVxuXG4gIGRlc3Ryb3k6ICgpIC0+XG4gICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgQF91bmRvKClcbiAgICBAZ3V0dGVyLmRlc3Ryb3koKVxuXG4gIF9zcGFjZXI6ICh0b3RhbExpbmVzLCBjdXJyZW50SW5kZXgpIC0+XG4gICAgd2lkdGggPSBNYXRoLm1heCgwLCB0b3RhbExpbmVzLnRvU3RyaW5nKCkubGVuZ3RoIC0gY3VycmVudEluZGV4LnRvU3RyaW5nKCkubGVuZ3RoKVxuICAgIEFycmF5KHdpZHRoICsgMSkuam9pbiAnJm5ic3A7J1xuXG4gIF91cGRhdGU6ICgpID0+XG4gICAgQGRlYm91bmNlZFVwZGF0ZSgpXG5cbiAgIyBVcGRhdGUgdGhlIGxpbmUgbnVtYmVycyBvbiB0aGUgZWRpdG9yXG4gIF9oYW5kbGVVcGRhdGU6ICgpID0+XG4gICAgIyBJZiB0aGUgZ3V0dGVyIGlzIHVwZGF0ZWQgYXN5bmNocm9ub3VzbHksIHdlIG5lZWQgdG8gZG8gdGhlIHNhbWUgdGhpbmdcbiAgICAjIG90aGVyd2lzZSBvdXIgY2hhbmdlcyB3aWxsIGp1c3QgZ2V0IHJldmVydGVkIGJhY2suXG4gICAgaWYgQGVkaXRvclZpZXcuaXNVcGRhdGVkU3luY2hyb25vdXNseSgpXG4gICAgICBAX3VwZGF0ZVN5bmMoKVxuICAgIGVsc2VcbiAgICAgIGF0b20udmlld3MudXBkYXRlRG9jdW1lbnQgKCkgPT4gQF91cGRhdGVTeW5jKClcblxuICBfdXBkYXRlU3luYzogKCkgPT5cbiAgICBpZiBAZWRpdG9yLmlzRGVzdHJveWVkKClcbiAgICAgIHJldHVyblxuXG4gICAgdG90YWxMaW5lcyA9IEBlZGl0b3IuZ2V0TGluZUNvdW50KClcbiAgICBjdXJyZW50TGluZU51bWJlciA9IGlmIEBzb2Z0V3JhcHNDb3VudCB0aGVuIEBlZGl0b3IuZ2V0Q3Vyc29yU2NyZWVuUG9zaXRpb24oKS5yb3cgZWxzZSBAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkucm93XG5cbiAgICAjIENoZWNrIGlmIHNlbGVjdGlvbiBlbmRzIHdpdGggbmV3bGluZVxuICAgICMgKFRoZSBzZWxlY3Rpb24gZW5kcyB3aXRoIG5ldyBsaW5lIGJlY2F1c2Ugb2YgdGhlIHBhY2thZ2UgdmltLW1vZGUgd2hlblxuICAgICMgY3RybCt2IGlzIHByZXNzZWQgaW4gdmlzdWFsIG1vZGUpXG4gICAgaWYgQGVkaXRvci5nZXRTZWxlY3RlZFRleHQoKS5tYXRjaCgvXFxuJC8pXG4gICAgICBlbmRPZkxpbmVTZWxlY3RlZCA9IHRydWVcbiAgICBlbHNlXG4gICAgICBjdXJyZW50TGluZU51bWJlciA9IGN1cnJlbnRMaW5lTnVtYmVyICsgMVxuXG4gICAgbGluZU51bWJlckVsZW1lbnRzID0gQGVkaXRvclZpZXcucXVlcnlTZWxlY3RvckFsbCgnLmxpbmUtbnVtYmVycyAubGluZS1udW1iZXInKVxuICAgIG9mZnNldCA9IGlmIEBzdGFydEF0T25lIHRoZW4gMSBlbHNlIDBcbiAgICBjb3VudGluZ19hdHRyaWJ1dGUgPSBpZiBAc29mdFdyYXBzQ291bnQgdGhlbiAnZGF0YS1zY3JlZW4tcm93JyBlbHNlICdkYXRhLWJ1ZmZlci1yb3cnXG5cbiAgICBmb3IgbGluZU51bWJlckVsZW1lbnQgaW4gbGluZU51bWJlckVsZW1lbnRzXG4gICAgICAjIFwifHwgMFwiIGlzIHVzZWQgZ2l2ZW4gZGF0YS1zY3JlZW4tcm93IGlzIHVuZGVmaW5lZCBmb3IgdGhlIGZpcnN0IHJvd1xuICAgICAgcm93ID0gTnVtYmVyKGxpbmVOdW1iZXJFbGVtZW50LmdldEF0dHJpYnV0ZShjb3VudGluZ19hdHRyaWJ1dGUpKSB8fCAwXG5cbiAgICAgIGFic29sdXRlID0gTnVtYmVyKGxpbmVOdW1iZXJFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1idWZmZXItcm93JykpICsgMSB8fCAxXG5cbiAgICAgIHJlbGF0aXZlID0gTWF0aC5hYnMoY3VycmVudExpbmVOdW1iZXIgLSByb3cgLSAxKVxuICAgICAgcmVsYXRpdmVDbGFzcyA9ICdyZWxhdGl2ZSdcblxuICAgICAgaWYgQHRydWVOdW1iZXJDdXJyZW50TGluZSBhbmQgcmVsYXRpdmUgPT0gMFxuICAgICAgICBpZiBlbmRPZkxpbmVTZWxlY3RlZFxuICAgICAgICAgIHJlbGF0aXZlID0gTnVtYmVyKEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKS5yb3cpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZWxhdGl2ZSA9IE51bWJlcihAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkucm93KSArIDFcblxuICAgICAgICByZWxhdGl2ZUNsYXNzICs9ICcgY3VycmVudC1saW5lJ1xuICAgICAgZWxzZVxuICAgICAgICAjIEFwcGx5IG9mZnNldCBsYXN0IHRoaW5nIGJlZm9yZSByZW5kZXJpbmdcbiAgICAgICAgcmVsYXRpdmUgKz0gb2Zmc2V0XG5cbiAgICAgIGFic29sdXRlVGV4dCA9IEBfc3BhY2VyKHRvdGFsTGluZXMsIGFic29sdXRlKSArIGFic29sdXRlXG4gICAgICByZWxhdGl2ZVRleHQgPSBAX3NwYWNlcih0b3RhbExpbmVzLCByZWxhdGl2ZSkgKyByZWxhdGl2ZVxuXG4gICAgICAjIEtlZXAgc29mdC13cmFwcGVkIGxpbmVzIGluZGljYXRvclxuICAgICAgaWYgbGluZU51bWJlckVsZW1lbnQuaW5uZXJIVE1MLmluZGV4T2YoJ+KAoicpID09IC0xXG4gICAgICAgIGxpbmVOdW1iZXJFbGVtZW50LmlubmVySFRNTCA9IFwiPHNwYW4gY2xhc3M9XFxcImFic29sdXRlXFxcIj4je2Fic29sdXRlVGV4dH08L3NwYW4+PHNwYW4gY2xhc3M9XFxcIiN7cmVsYXRpdmVDbGFzc31cXFwiPiN7cmVsYXRpdmVUZXh0fTwvc3Bhbj48ZGl2IGNsYXNzPVxcXCJpY29uLXJpZ2h0XFxcIj48L2Rpdj5cIlxuXG4gIF91cGRhdGVBYnNvbHV0ZU51bWJlcnM6IC0+XG4gICAgQGxpbmVOdW1iZXJHdXR0ZXJWaWV3LmNsYXNzTGlzdC50b2dnbGUoJ3Nob3ctYWJzb2x1dGUnLCBAc2hvd0Fic29sdXRlTnVtYmVycylcblxuICBfdXBkYXRlSW5zZXJ0TW9kZTogLT5cbiAgICBAbGluZU51bWJlckd1dHRlclZpZXcuY2xhc3NMaXN0LnRvZ2dsZSgnc2hvdy1hYnNvbHV0ZS1pbnNlcnQtbW9kZScsIEBzaG93QWJzb2x1dGVOdW1iZXJzSW5JbnNlcnRNb2RlKVxuXG4gIF91cGRhdGVEZWJvdW5jZTogLT5cbiAgICBpZiBAZGVib3VuY2VNb3Rpb25cbiAgICAgIEBkZWJvdW5jZWRVcGRhdGUgPSBkZWJvdW5jZShAX2hhbmRsZVVwZGF0ZSwgQGRlYm91bmNlTW90aW9uLCBtYXhXYWl0OiBAZGVib3VuY2VNb3Rpb24pXG4gICAgZWxzZVxuICAgICAgQGRlYm91bmNlZFVwZGF0ZSA9IEBfaGFuZGxlVXBkYXRlXG5cbiAgIyBVbmRvIGNoYW5nZXMgdG8gRE9NXG4gIF91bmRvOiAoKSA9PlxuICAgIHRvdGFsTGluZXMgPSBAZWRpdG9yLmdldExpbmVDb3VudCgpXG4gICAgbGluZU51bWJlckVsZW1lbnRzID0gQGVkaXRvclZpZXcucXVlcnlTZWxlY3RvckFsbCgnLmxpbmUtbnVtYmVyJylcbiAgICBmb3IgbGluZU51bWJlckVsZW1lbnQgaW4gbGluZU51bWJlckVsZW1lbnRzXG4gICAgICByb3cgPSBOdW1iZXIobGluZU51bWJlckVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWJ1ZmZlci1yb3cnKSlcbiAgICAgIGFic29sdXRlID0gcm93ICsgMVxuICAgICAgYWJzb2x1dGVUZXh0ID0gQF9zcGFjZXIodG90YWxMaW5lcywgYWJzb2x1dGUpICsgYWJzb2x1dGVcbiAgICAgIGlmIGxpbmVOdW1iZXJFbGVtZW50LmlubmVySFRNTC5pbmRleE9mKCfigKInKSA9PSAtMVxuICAgICAgICBsaW5lTnVtYmVyRWxlbWVudC5pbm5lckhUTUwgPSBcIiN7YWJzb2x1dGVUZXh0fTxkaXYgY2xhc3M9XFxcImljb24tcmlnaHRcXFwiPjwvZGl2PlwiXG5cbiAgICBAbGluZU51bWJlckd1dHRlclZpZXcuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdy1hYnNvbHV0ZScpXG4gICAgQGxpbmVOdW1iZXJHdXR0ZXJWaWV3LmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3ctYWJzb2x1dGUtaW5zZXJ0LW1vZGUnKVxuIl19
