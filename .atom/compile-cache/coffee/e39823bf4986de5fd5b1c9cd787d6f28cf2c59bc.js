(function() {
  var CompositeDisposable, Emitter, HighlightedAreaView, MarkerLayer, Range, StatusBarView, escapeRegExp, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ref = require('atom'), Range = ref.Range, CompositeDisposable = ref.CompositeDisposable, Emitter = ref.Emitter, MarkerLayer = ref.MarkerLayer;

  StatusBarView = require('./status-bar-view');

  escapeRegExp = require('./escape-reg-exp');

  module.exports = HighlightedAreaView = (function() {
    function HighlightedAreaView() {
      this.destroyScrollMarkers = bind(this.destroyScrollMarkers, this);
      this.setScrollMarkerView = bind(this.setScrollMarkerView, this);
      this.setupMarkerLayers = bind(this.setupMarkerLayers, this);
      this.setScrollMarker = bind(this.setScrollMarker, this);
      this.selectAll = bind(this.selectAll, this);
      this.listenForStatusBarChange = bind(this.listenForStatusBarChange, this);
      this.removeStatusBar = bind(this.removeStatusBar, this);
      this.setupStatusBar = bind(this.setupStatusBar, this);
      this.removeMarkers = bind(this.removeMarkers, this);
      this.removeAllMarkers = bind(this.removeAllMarkers, this);
      this.handleSelection = bind(this.handleSelection, this);
      this.debouncedHandleSelection = bind(this.debouncedHandleSelection, this);
      this.setStatusBar = bind(this.setStatusBar, this);
      this.enable = bind(this.enable, this);
      this.disable = bind(this.disable, this);
      this.onDidRemoveAllMarkers = bind(this.onDidRemoveAllMarkers, this);
      this.onDidAddSelectedMarkerForEditor = bind(this.onDidAddSelectedMarkerForEditor, this);
      this.onDidAddMarkerForEditor = bind(this.onDidAddMarkerForEditor, this);
      this.onDidAddSelectedMarker = bind(this.onDidAddSelectedMarker, this);
      this.onDidAddMarker = bind(this.onDidAddMarker, this);
      this.destroy = bind(this.destroy, this);
      this.emitter = new Emitter;
      this.editorToMarkerLayerMap = {};
      this.markerLayers = [];
      this.resultCount = 0;
      this.editorSubscriptions = new CompositeDisposable();
      this.editorSubscriptions.add(atom.workspace.observeTextEditors((function(_this) {
        return function(editor) {
          _this.setupMarkerLayers(editor);
          return _this.setScrollMarkerView(editor);
        };
      })(this)));
      this.editorSubscriptions.add(atom.workspace.onWillDestroyPaneItem((function(_this) {
        return function(item) {
          var editor;
          if (item.item.constructor.name !== 'TextEditor') {
            return;
          }
          editor = item.item;
          _this.removeMarkers(editor.id);
          delete _this.editorToMarkerLayerMap[editor.id];
          return _this.destroyScrollMarkers(editor);
        };
      })(this)));
      this.enable();
      this.listenForTimeoutChange();
      this.activeItemSubscription = atom.workspace.onDidChangeActivePaneItem((function(_this) {
        return function() {
          _this.debouncedHandleSelection();
          return _this.subscribeToActiveTextEditor();
        };
      })(this));
      this.subscribeToActiveTextEditor();
      this.listenForStatusBarChange();
      this.enableScrollViewObserveSubscription = atom.config.observe('highlight-selected.showResultsOnScrollBar', (function(_this) {
        return function(enabled) {
          if (enabled) {
            _this.ensureScrollViewInstalled();
            return atom.workspace.getTextEditors().forEach(_this.setScrollMarkerView);
          } else {
            return atom.workspace.getTextEditors().forEach(_this.destroyScrollMarkers);
          }
        };
      })(this));
    }

    HighlightedAreaView.prototype.destroy = function() {
      var ref1, ref2, ref3, ref4, ref5;
      clearTimeout(this.handleSelectionTimeout);
      this.activeItemSubscription.dispose();
      if ((ref1 = this.selectionSubscription) != null) {
        ref1.dispose();
      }
      if ((ref2 = this.enableScrollViewObserveSubscription) != null) {
        ref2.dispose();
      }
      if ((ref3 = this.editorSubscriptions) != null) {
        ref3.dispose();
      }
      if ((ref4 = this.statusBarView) != null) {
        ref4.removeElement();
      }
      if ((ref5 = this.statusBarTile) != null) {
        ref5.destroy();
      }
      return this.statusBarTile = null;
    };

    HighlightedAreaView.prototype.onDidAddMarker = function(callback) {
      var Grim;
      Grim = require('grim');
      Grim.deprecate("Please do not use. This method will be removed.");
      return this.emitter.on('did-add-marker', callback);
    };

    HighlightedAreaView.prototype.onDidAddSelectedMarker = function(callback) {
      var Grim;
      Grim = require('grim');
      Grim.deprecate("Please do not use. This method will be removed.");
      return this.emitter.on('did-add-selected-marker', callback);
    };

    HighlightedAreaView.prototype.onDidAddMarkerForEditor = function(callback) {
      return this.emitter.on('did-add-marker-for-editor', callback);
    };

    HighlightedAreaView.prototype.onDidAddSelectedMarkerForEditor = function(callback) {
      return this.emitter.on('did-add-selected-marker-for-editor', callback);
    };

    HighlightedAreaView.prototype.onDidRemoveAllMarkers = function(callback) {
      return this.emitter.on('did-remove-marker-layer', callback);
    };

    HighlightedAreaView.prototype.disable = function() {
      this.disabled = true;
      return this.removeAllMarkers();
    };

    HighlightedAreaView.prototype.enable = function() {
      this.disabled = false;
      return this.debouncedHandleSelection();
    };

    HighlightedAreaView.prototype.setStatusBar = function(statusBar) {
      this.statusBar = statusBar;
      return this.setupStatusBar();
    };

    HighlightedAreaView.prototype.debouncedHandleSelection = function() {
      clearTimeout(this.handleSelectionTimeout);
      return this.handleSelectionTimeout = setTimeout((function(_this) {
        return function() {
          return _this.handleSelection();
        };
      })(this), atom.config.get('highlight-selected.timeout'));
    };

    HighlightedAreaView.prototype.listenForTimeoutChange = function() {
      return atom.config.onDidChange('highlight-selected.timeout', (function(_this) {
        return function() {
          return _this.debouncedHandleSelection();
        };
      })(this));
    };

    HighlightedAreaView.prototype.subscribeToActiveTextEditor = function() {
      var editor, ref1;
      if ((ref1 = this.selectionSubscription) != null) {
        ref1.dispose();
      }
      editor = this.getActiveEditor();
      if (!editor) {
        return;
      }
      this.selectionSubscription = new CompositeDisposable;
      this.selectionSubscription.add(editor.onDidAddSelection(this.debouncedHandleSelection));
      this.selectionSubscription.add(editor.onDidChangeSelectionRange(this.debouncedHandleSelection));
      return this.handleSelection();
    };

    HighlightedAreaView.prototype.getActiveEditor = function() {
      return atom.workspace.getActiveTextEditor();
    };

    HighlightedAreaView.prototype.getActiveEditors = function() {
      return atom.workspace.getPanes().map(function(pane) {
        var activeItem;
        activeItem = pane.activeItem;
        if (activeItem && activeItem.constructor.name === 'TextEditor') {
          return activeItem;
        }
      });
    };

    HighlightedAreaView.prototype.handleSelection = function() {
      var allowedCharactersToSelect, editor, lastSelection, nonWordCharacters, nonWordCharactersToStrip, originalEditor, ref1, regex, regexFlags, regexForWholeWord, regexSearch, text;
      editor = this.getActiveEditor();
      if (!editor) {
        return;
      }
      this.removeAllMarkers();
      if (this.disabled) {
        return;
      }
      if (editor.getLastSelection().isEmpty()) {
        return;
      }
      this.selections = editor.getSelections();
      lastSelection = editor.getLastSelection();
      text = lastSelection.getText();
      if (text.length < atom.config.get('highlight-selected.minimumLength')) {
        return;
      }
      regex = new RegExp("\\n");
      if (regex.exec(text)) {
        return;
      }
      regexFlags = 'g';
      if (atom.config.get('highlight-selected.ignoreCase')) {
        regexFlags = 'gi';
      }
      regexSearch = escapeRegExp(text);
      if (atom.config.get('highlight-selected.onlyHighlightWholeWords')) {
        if (!this.isWordSelected(lastSelection)) {
          return;
        }
        nonWordCharacters = atom.config.get('editor.nonWordCharacters');
        allowedCharactersToSelect = atom.config.get('highlight-selected.allowedCharactersToSelect');
        nonWordCharactersToStrip = nonWordCharacters.replace(new RegExp("[" + allowedCharactersToSelect + "]", 'g'), '');
        regexForWholeWord = new RegExp("[ \\t" + (escapeRegExp(nonWordCharactersToStrip)) + "]", regexFlags);
        if (regexForWholeWord.test(text)) {
          return;
        }
        regexSearch = ("(?:[ \\t" + (escapeRegExp(nonWordCharacters)) + "]|^)(") + regexSearch + (")(?:[ \\t" + (escapeRegExp(nonWordCharacters)) + "]|$)");
      }
      this.resultCount = 0;
      if (atom.config.get('highlight-selected.highlightInPanes')) {
        originalEditor = editor;
        this.getActiveEditors().forEach((function(_this) {
          return function(editor) {
            return _this.highlightSelectionInEditor(editor, regexSearch, regexFlags, originalEditor);
          };
        })(this));
      } else {
        this.highlightSelectionInEditor(editor, regexSearch, regexFlags);
      }
      return (ref1 = this.statusBarElement) != null ? ref1.updateCount(this.resultCount) : void 0;
    };

    HighlightedAreaView.prototype.highlightSelectionInEditor = function(editor, regexSearch, regexFlags, originalEditor) {
      var markerLayer, markerLayerForHiddenMarkers, markerLayers;
      if (editor == null) {
        return;
      }
      markerLayers = this.editorToMarkerLayerMap[editor.id];
      if (markerLayers == null) {
        return;
      }
      markerLayer = markerLayers['visibleMarkerLayer'];
      markerLayerForHiddenMarkers = markerLayers['selectedMarkerLayer'];
      editor.scan(new RegExp(regexSearch, regexFlags), (function(_this) {
        return function(result) {
          var marker, newResult;
          newResult = result;
          if (atom.config.get('highlight-selected.onlyHighlightWholeWords')) {
            editor.scanInBufferRange(new RegExp(escapeRegExp(result.match[1])), result.range, function(e) {
              return newResult = e;
            });
          }
          if (newResult == null) {
            return;
          }
          _this.resultCount += 1;
          if (_this.showHighlightOnSelectedWord(newResult.range, _this.selections) && (originalEditor != null ? originalEditor.id : void 0) === editor.id) {
            marker = markerLayerForHiddenMarkers.markBufferRange(newResult.range);
            _this.emitter.emit('did-add-selected-marker', marker);
            return _this.emitter.emit('did-add-selected-marker-for-editor', {
              marker: marker,
              editor: editor
            });
          } else {
            marker = markerLayer.markBufferRange(newResult.range);
            _this.emitter.emit('did-add-marker', marker);
            return _this.emitter.emit('did-add-marker-for-editor', {
              marker: marker,
              editor: editor
            });
          }
        };
      })(this));
      return editor.decorateMarkerLayer(markerLayer, {
        type: 'highlight',
        "class": this.makeClasses()
      });
    };

    HighlightedAreaView.prototype.makeClasses = function() {
      var className;
      className = 'highlight-selected';
      if (atom.config.get('highlight-selected.lightTheme')) {
        className += ' light-theme';
      }
      if (atom.config.get('highlight-selected.highlightBackground')) {
        className += ' background';
      }
      return className;
    };

    HighlightedAreaView.prototype.showHighlightOnSelectedWord = function(range, selections) {
      var i, len, outcome, selection, selectionRange;
      if (!atom.config.get('highlight-selected.hideHighlightOnSelectedWord')) {
        return false;
      }
      outcome = false;
      for (i = 0, len = selections.length; i < len; i++) {
        selection = selections[i];
        selectionRange = selection.getBufferRange();
        outcome = (range.start.column === selectionRange.start.column) && (range.start.row === selectionRange.start.row) && (range.end.column === selectionRange.end.column) && (range.end.row === selectionRange.end.row);
        if (outcome) {
          break;
        }
      }
      return outcome;
    };

    HighlightedAreaView.prototype.removeAllMarkers = function() {
      return Object.keys(this.editorToMarkerLayerMap).forEach(this.removeMarkers);
    };

    HighlightedAreaView.prototype.removeMarkers = function(editorId) {
      var markerLayer, ref1, selectedMarkerLayer;
      if (this.editorToMarkerLayerMap[editorId] == null) {
        return;
      }
      markerLayer = this.editorToMarkerLayerMap[editorId]['visibleMarkerLayer'];
      selectedMarkerLayer = this.editorToMarkerLayerMap[editorId]['selectedMarkerLayer'];
      markerLayer.clear();
      selectedMarkerLayer.clear();
      if ((ref1 = this.statusBarElement) != null) {
        ref1.updateCount(0);
      }
      return this.emitter.emit('did-remove-marker-layer');
    };

    HighlightedAreaView.prototype.isWordSelected = function(selection) {
      var lineRange, nonWordCharacterToTheLeft, nonWordCharacterToTheRight, selectionRange;
      if (selection.getBufferRange().isSingleLine()) {
        selectionRange = selection.getBufferRange();
        lineRange = this.getActiveEditor().bufferRangeForBufferRow(selectionRange.start.row);
        nonWordCharacterToTheLeft = selectionRange.start.isEqual(lineRange.start) || this.isNonWordCharacterToTheLeft(selection);
        nonWordCharacterToTheRight = selectionRange.end.isEqual(lineRange.end) || this.isNonWordCharacterToTheRight(selection);
        return nonWordCharacterToTheLeft && nonWordCharacterToTheRight;
      } else {
        return false;
      }
    };

    HighlightedAreaView.prototype.isNonWordCharacter = function(character) {
      var nonWordCharacters;
      nonWordCharacters = atom.config.get('editor.nonWordCharacters');
      return new RegExp("[ \t" + (escapeRegExp(nonWordCharacters)) + "]").test(character);
    };

    HighlightedAreaView.prototype.isNonWordCharacterToTheLeft = function(selection) {
      var range, selectionStart;
      selectionStart = selection.getBufferRange().start;
      range = Range.fromPointWithDelta(selectionStart, 0, -1);
      return this.isNonWordCharacter(this.getActiveEditor().getTextInBufferRange(range));
    };

    HighlightedAreaView.prototype.isNonWordCharacterToTheRight = function(selection) {
      var range, selectionEnd;
      selectionEnd = selection.getBufferRange().end;
      range = Range.fromPointWithDelta(selectionEnd, 0, 1);
      return this.isNonWordCharacter(this.getActiveEditor().getTextInBufferRange(range));
    };

    HighlightedAreaView.prototype.setupStatusBar = function() {
      if (this.statusBarElement != null) {
        return;
      }
      if (!atom.config.get('highlight-selected.showInStatusBar')) {
        return;
      }
      this.statusBarElement = new StatusBarView();
      return this.statusBarTile = this.statusBar.addLeftTile({
        item: this.statusBarElement.getElement(),
        priority: 100
      });
    };

    HighlightedAreaView.prototype.removeStatusBar = function() {
      var ref1;
      if (this.statusBarElement == null) {
        return;
      }
      if ((ref1 = this.statusBarTile) != null) {
        ref1.destroy();
      }
      this.statusBarTile = null;
      return this.statusBarElement = null;
    };

    HighlightedAreaView.prototype.listenForStatusBarChange = function() {
      return atom.config.onDidChange('highlight-selected.showInStatusBar', (function(_this) {
        return function(changed) {
          if (changed.newValue) {
            return _this.setupStatusBar();
          } else {
            return _this.removeStatusBar();
          }
        };
      })(this));
    };

    HighlightedAreaView.prototype.selectAll = function() {
      var editor, i, j, len, len1, marker, markerLayer, markerLayers, ranges, ref1, ref2;
      editor = this.getActiveEditor();
      markerLayers = this.editorToMarkerLayerMap[editor.id];
      if (markerLayers == null) {
        return;
      }
      ranges = [];
      ref1 = [markerLayers['visibleMarkerLayer'], markerLayers['selectedMarkerLayer']];
      for (i = 0, len = ref1.length; i < len; i++) {
        markerLayer = ref1[i];
        ref2 = markerLayer.getMarkers();
        for (j = 0, len1 = ref2.length; j < len1; j++) {
          marker = ref2[j];
          ranges.push(marker.getBufferRange());
        }
      }
      if (ranges.length > 0) {
        return editor.setSelectedBufferRanges(ranges, {
          flash: true
        });
      }
    };

    HighlightedAreaView.prototype.setScrollMarker = function(scrollMarkerAPI) {
      this.scrollMarker = scrollMarkerAPI;
      if (atom.config.get('highlight-selected.showResultsOnScrollBar')) {
        this.ensureScrollViewInstalled();
        return atom.workspace.getTextEditors().forEach(this.setScrollMarkerView);
      }
    };

    HighlightedAreaView.prototype.ensureScrollViewInstalled = function() {
      if (!atom.inSpecMode()) {
        return require('atom-package-deps').install('highlight-selected', true);
      }
    };

    HighlightedAreaView.prototype.setupMarkerLayers = function(editor) {
      var markerLayer, markerLayerForHiddenMarkers;
      if (this.editorToMarkerLayerMap[editor.id] != null) {
        markerLayer = this.editorToMarkerLayerMap[editor.id]['visibleMarkerLayer'];
        return markerLayerForHiddenMarkers = this.editorToMarkerLayerMap[editor.id]['selectedMarkerLayer'];
      } else {
        markerLayer = editor.addMarkerLayer();
        markerLayerForHiddenMarkers = editor.addMarkerLayer();
        return this.editorToMarkerLayerMap[editor.id] = {
          visibleMarkerLayer: markerLayer,
          selectedMarkerLayer: markerLayerForHiddenMarkers
        };
      }
    };

    HighlightedAreaView.prototype.setScrollMarkerView = function(editor) {
      var markerLayer, scrollMarkerView, selectedMarkerLayer;
      if (!atom.config.get('highlight-selected.showResultsOnScrollBar')) {
        return;
      }
      if (this.scrollMarker == null) {
        return;
      }
      scrollMarkerView = this.scrollMarker.scrollMarkerViewForEditor(editor);
      markerLayer = this.editorToMarkerLayerMap[editor.id]['visibleMarkerLayer'];
      selectedMarkerLayer = this.editorToMarkerLayerMap[editor.id]['selectedMarkerLayer'];
      scrollMarkerView.getLayer("highlight-selected-marker-layer").syncToMarkerLayer(markerLayer);
      return scrollMarkerView.getLayer("highlight-selected-selected-marker-layer").syncToMarkerLayer(selectedMarkerLayer);
    };

    HighlightedAreaView.prototype.destroyScrollMarkers = function(editor) {
      var scrollMarkerView;
      if (this.scrollMarker == null) {
        return;
      }
      scrollMarkerView = this.scrollMarker.scrollMarkerViewForEditor(editor);
      return scrollMarkerView.destroy();
    };

    return HighlightedAreaView;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvaGlnaGxpZ2h0LXNlbGVjdGVkL2xpYi9oaWdobGlnaHRlZC1hcmVhLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx1R0FBQTtJQUFBOztFQUFBLE1BQXFELE9BQUEsQ0FBUSxNQUFSLENBQXJELEVBQUMsaUJBQUQsRUFBUSw2Q0FBUixFQUE2QixxQkFBN0IsRUFBc0M7O0VBQ3RDLGFBQUEsR0FBZ0IsT0FBQSxDQUFRLG1CQUFSOztFQUNoQixZQUFBLEdBQWUsT0FBQSxDQUFRLGtCQUFSOztFQUVmLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFFUyw2QkFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztNQUNYLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtNQUNmLElBQUMsQ0FBQSxzQkFBRCxHQUEwQjtNQUMxQixJQUFDLENBQUEsWUFBRCxHQUFnQjtNQUNoQixJQUFDLENBQUEsV0FBRCxHQUFlO01BRWYsSUFBQyxDQUFBLG1CQUFELEdBQXVCLElBQUksbUJBQUosQ0FBQTtNQUN2QixJQUFDLENBQUEsbUJBQW1CLENBQUMsR0FBckIsQ0FBeUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBZixDQUFrQyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsTUFBRDtVQUN6RCxLQUFDLENBQUEsaUJBQUQsQ0FBbUIsTUFBbkI7aUJBQ0EsS0FBQyxDQUFBLG1CQUFELENBQXFCLE1BQXJCO1FBRnlEO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFsQyxDQUF6QjtNQUtBLElBQUMsQ0FBQSxtQkFBbUIsQ0FBQyxHQUFyQixDQUF5QixJQUFJLENBQUMsU0FBUyxDQUFDLHFCQUFmLENBQXFDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxJQUFEO0FBQzVELGNBQUE7VUFBQSxJQUFjLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFD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akIsQ0FBQTtJQUpvQjs7Ozs7QUFoVnhCIiwic291cmNlc0NvbnRlbnQiOlsie1JhbmdlLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBFbWl0dGVyLCBNYXJrZXJMYXllcn0gPSByZXF1aXJlICdhdG9tJ1xuU3RhdHVzQmFyVmlldyA9IHJlcXVpcmUgJy4vc3RhdHVzLWJhci12aWV3J1xuZXNjYXBlUmVnRXhwID0gcmVxdWlyZSAnLi9lc2NhcGUtcmVnLWV4cCdcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgSGlnaGxpZ2h0ZWRBcmVhVmlld1xuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICBAZWRpdG9yVG9NYXJrZXJMYXllck1hcCA9IHt9XG4gICAgQG1hcmtlckxheWVycyA9IFtdXG4gICAgQHJlc3VsdENvdW50ID0gMFxuXG4gICAgQGVkaXRvclN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgQGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkKGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycygoZWRpdG9yKSA9PlxuICAgICAgQHNldHVwTWFya2VyTGF5ZXJzKGVkaXRvcilcbiAgICAgIEBzZXRTY3JvbGxNYXJrZXJWaWV3KGVkaXRvcilcbiAgICApKVxuXG4gICAgQGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkKGF0b20ud29ya3NwYWNlLm9uV2lsbERlc3Ryb3lQYW5lSXRlbSgoaXRlbSkgPT5cbiAgICAgIHJldHVybiB1bmxlc3MgaXRlbS5pdGVtLmNvbnN0cnVjdG9yLm5hbWUgPT0gJ1RleHRFZGl0b3InXG4gICAgICBlZGl0b3IgPSBpdGVtLml0ZW1cbiAgICAgIEByZW1vdmVNYXJrZXJzKGVkaXRvci5pZClcbiAgICAgIGRlbGV0ZSBAZWRpdG9yVG9NYXJrZXJMYXllck1hcFtlZGl0b3IuaWRdXG4gICAgICBAZGVzdHJveVNjcm9sbE1hcmtlcnMoZWRpdG9yKVxuICAgICkpXG5cbiAgICBAZW5hYmxlKClcbiAgICBAbGlzdGVuRm9yVGltZW91dENoYW5nZSgpXG4gICAgQGFjdGl2ZUl0ZW1TdWJzY3JpcHRpb24gPSBhdG9tLndvcmtzcGFjZS5vbkRpZENoYW5nZUFjdGl2ZVBhbmVJdGVtID0+XG4gICAgICBAZGVib3VuY2VkSGFuZGxlU2VsZWN0aW9uKClcbiAgICAgIEBzdWJzY3JpYmVUb0FjdGl2ZVRleHRFZGl0b3IoKVxuICAgIEBzdWJzY3JpYmVUb0FjdGl2ZVRleHRFZGl0b3IoKVxuICAgIEBsaXN0ZW5Gb3JTdGF0dXNCYXJDaGFuZ2UoKVxuXG4gICAgQGVuYWJsZVNjcm9sbFZpZXdPYnNlcnZlU3Vic2NyaXB0aW9uID1cbiAgICAgIGF0b20uY29uZmlnLm9ic2VydmUgJ2hpZ2hsaWdodC1zZWxlY3RlZC5zaG93UmVzdWx0c09uU2Nyb2xsQmFyJywgKGVuYWJsZWQpID0+XG4gICAgICAgIGlmIGVuYWJsZWRcbiAgICAgICAgICBAZW5zdXJlU2Nyb2xsVmlld0luc3RhbGxlZCgpXG4gICAgICAgICAgYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKS5mb3JFYWNoKEBzZXRTY3JvbGxNYXJrZXJWaWV3KVxuICAgICAgICBlbHNlXG4gICAgICAgICAgYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKS5mb3JFYWNoKEBkZXN0cm95U2Nyb2xsTWFya2VycylcblxuICBkZXN0cm95OiA9PlxuICAgIGNsZWFyVGltZW91dChAaGFuZGxlU2VsZWN0aW9uVGltZW91dClcbiAgICBAYWN0aXZlSXRlbVN1YnNjcmlwdGlvbi5kaXNwb3NlKClcbiAgICBAc2VsZWN0aW9uU3Vic2NyaXB0aW9uPy5kaXNwb3NlKClcbiAgICBAZW5hYmxlU2Nyb2xsVmlld09ic2VydmVTdWJzY3JpcHRpb24/LmRpc3Bvc2UoKVxuICAgIEBlZGl0b3JTdWJzY3JpcHRpb25zPy5kaXNwb3NlKClcbiAgICBAc3RhdHVzQmFyVmlldz8ucmVtb3ZlRWxlbWVudCgpXG4gICAgQHN0YXR1c0JhclRpbGU/LmRlc3Ryb3koKVxuICAgIEBzdGF0dXNCYXJUaWxlID0gbnVsbFxuXG4gIG9uRGlkQWRkTWFya2VyOiAoY2FsbGJhY2spID0+XG4gICAgR3JpbSA9IHJlcXVpcmUgJ2dyaW0nXG4gICAgR3JpbS5kZXByZWNhdGUoXCJQbGVhc2UgZG8gbm90IHVzZS4gVGhpcyBtZXRob2Qgd2lsbCBiZSByZW1vdmVkLlwiKVxuICAgIEBlbWl0dGVyLm9uICdkaWQtYWRkLW1hcmtlcicsIGNhbGxiYWNrXG5cbiAgb25EaWRBZGRTZWxlY3RlZE1hcmtlcjogKGNhbGxiYWNrKSA9PlxuICAgIEdyaW0gPSByZXF1aXJlICdncmltJ1xuICAgIEdyaW0uZGVwcmVjYXRlKFwiUGxlYXNlIGRvIG5vdCB1c2UuIFRoaXMgbWV0aG9kIHdpbGwgYmUgcmVtb3ZlZC5cIilcbiAgICBAZW1pdHRlci5vbiAnZGlkLWFkZC1zZWxlY3RlZC1tYXJrZXInLCBjYWxsYmFja1xuXG4gIG9uRGlkQWRkTWFya2VyRm9yRWRpdG9yOiAoY2FsbGJhY2spID0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1hZGQtbWFya2VyLWZvci1lZGl0b3InLCBjYWxsYmFja1xuXG4gIG9uRGlkQWRkU2VsZWN0ZWRNYXJrZXJGb3JFZGl0b3I6IChjYWxsYmFjaykgPT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWFkZC1zZWxlY3RlZC1tYXJrZXItZm9yLWVkaXRvcicsIGNhbGxiYWNrXG5cbiAgb25EaWRSZW1vdmVBbGxNYXJrZXJzOiAoY2FsbGJhY2spID0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1yZW1vdmUtbWFya2VyLWxheWVyJywgY2FsbGJhY2tcblxuICBkaXNhYmxlOiA9PlxuICAgIEBkaXNhYmxlZCA9IHRydWVcbiAgICBAcmVtb3ZlQWxsTWFya2VycygpXG5cbiAgZW5hYmxlOiA9PlxuICAgIEBkaXNhYmxlZCA9IGZhbHNlXG4gICAgQGRlYm91bmNlZEhhbmRsZVNlbGVjdGlvbigpXG5cbiAgc2V0U3RhdHVzQmFyOiAoc3RhdHVzQmFyKSA9PlxuICAgIEBzdGF0dXNCYXIgPSBzdGF0dXNCYXJcbiAgICBAc2V0dXBTdGF0dXNCYXIoKVxuXG4gIGRlYm91bmNlZEhhbmRsZVNlbGVjdGlvbjogPT5cbiAgICBjbGVhclRpbWVvdXQoQGhhbmRsZVNlbGVjdGlvblRpbWVvdXQpXG4gICAgQGhhbmRsZVNlbGVjdGlvblRpbWVvdXQgPSBzZXRUaW1lb3V0ID0+XG4gICAgICBAaGFuZGxlU2VsZWN0aW9uKClcbiAgICAsIGF0b20uY29uZmlnLmdldCgnaGlnaGxpZ2h0LXNlbGVjdGVkLnRpbWVvdXQnKVxuXG4gIGxpc3RlbkZvclRpbWVvdXRDaGFuZ2U6IC0+XG4gICAgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ2hpZ2hsaWdodC1zZWxlY3RlZC50aW1lb3V0JywgPT5cbiAgICAgIEBkZWJvdW5jZWRIYW5kbGVTZWxlY3Rpb24oKVxuXG4gIHN1YnNjcmliZVRvQWN0aXZlVGV4dEVkaXRvcjogLT5cbiAgICBAc2VsZWN0aW9uU3Vic2NyaXB0aW9uPy5kaXNwb3NlKClcblxuICAgIGVkaXRvciA9IEBnZXRBY3RpdmVFZGl0b3IoKVxuICAgIHJldHVybiB1bmxlc3MgZWRpdG9yXG5cbiAgICBAc2VsZWN0aW9uU3Vic2NyaXB0aW9uID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcblxuICAgIEBzZWxlY3Rpb25TdWJzY3JpcHRpb24uYWRkKFxuICAgICAgZWRpdG9yLm9uRGlkQWRkU2VsZWN0aW9uIEBkZWJvdW5jZWRIYW5kbGVTZWxlY3Rpb25cbiAgICApXG4gICAgQHNlbGVjdGlvblN1YnNjcmlwdGlvbi5hZGQoXG4gICAgICBlZGl0b3Iub25EaWRDaGFuZ2VTZWxlY3Rpb25SYW5nZSBAZGVib3VuY2VkSGFuZGxlU2VsZWN0aW9uXG4gICAgKVxuICAgIEBoYW5kbGVTZWxlY3Rpb24oKVxuXG4gIGdldEFjdGl2ZUVkaXRvcjogLT5cbiAgICBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcblxuICBnZXRBY3RpdmVFZGl0b3JzOiAtPlxuICAgIGF0b20ud29ya3NwYWNlLmdldFBhbmVzKCkubWFwIChwYW5lKSAtPlxuICAgICAgYWN0aXZlSXRlbSA9IHBhbmUuYWN0aXZlSXRlbVxuICAgICAgYWN0aXZlSXRlbSBpZiBhY3RpdmVJdGVtIGFuZCBhY3RpdmVJdGVtLmNvbnN0cnVjdG9yLm5hbWUgPT0gJ1RleHRFZGl0b3InXG5cbiAgaGFuZGxlU2VsZWN0aW9uOiA9PlxuICAgIGVkaXRvciA9IEBnZXRBY3RpdmVFZGl0b3IoKVxuICAgIHJldHVybiB1bmxlc3MgZWRpdG9yXG5cbiAgICBAcmVtb3ZlQWxsTWFya2VycygpXG5cbiAgICByZXR1cm4gaWYgQGRpc2FibGVkXG4gICAgcmV0dXJuIGlmIGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkuaXNFbXB0eSgpXG5cbiAgICBAc2VsZWN0aW9ucyA9IGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICBsYXN0U2VsZWN0aW9uID0gZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKVxuICAgIHRleHQgPSBsYXN0U2VsZWN0aW9uLmdldFRleHQoKVxuXG4gICAgcmV0dXJuIGlmIHRleHQubGVuZ3RoIDwgYXRvbS5jb25maWcuZ2V0KCdoaWdobGlnaHQtc2VsZWN0ZWQubWluaW11bUxlbmd0aCcpXG4gICAgcmVnZXggPSBuZXcgUmVnRXhwKFwiXFxcXG5cIilcbiAgICByZXR1cm4gaWYgcmVnZXguZXhlYyh0ZXh0KVxuXG4gICAgcmVnZXhGbGFncyA9ICdnJ1xuICAgIGlmIGF0b20uY29uZmlnLmdldCgnaGlnaGxpZ2h0LXNlbGVjdGVkLmlnbm9yZUNhc2UnKVxuICAgICAgcmVnZXhGbGFncyA9ICdnaSdcblxuICAgIHJlZ2V4U2VhcmNoID0gZXNjYXBlUmVnRXhwKHRleHQpXG5cbiAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ2hpZ2hsaWdodC1zZWxlY3RlZC5vbmx5SGlnaGxpZ2h0V2hvbGVXb3JkcycpXG4gICAgICByZXR1cm4gdW5sZXNzIEBpc1dvcmRTZWxlY3RlZChsYXN0U2VsZWN0aW9uKVxuICAgICAgbm9uV29yZENoYXJhY3RlcnMgPSBhdG9tLmNvbmZpZy5nZXQoJ2VkaXRvci5ub25Xb3JkQ2hhcmFjdGVycycpXG4gICAgICBhbGxvd2VkQ2hhcmFjdGVyc1RvU2VsZWN0ID0gYXRvbS5jb25maWcuZ2V0KCdoaWdobGlnaHQtc2VsZWN0ZWQuYWxsb3dlZENoYXJhY3RlcnNUb1NlbGVjdCcpXG4gICAgICBub25Xb3JkQ2hhcmFjdGVyc1RvU3RyaXAgPSBub25Xb3JkQ2hhcmFjdGVycy5yZXBsYWNlKFxuICAgICAgICBuZXcgUmVnRXhwKFwiWyN7YWxsb3dlZENoYXJhY3RlcnNUb1NlbGVjdH1dXCIsICdnJyksICcnKVxuICAgICAgcmVnZXhGb3JXaG9sZVdvcmQgPSBuZXcgUmVnRXhwKFwiWyBcXFxcdCN7ZXNjYXBlUmVnRXhwKG5vbldvcmRDaGFyYWN0ZXJzVG9TdHJpcCl9XVwiLCByZWdleEZsYWdzKVxuICAgICAgcmV0dXJuIGlmIHJlZ2V4Rm9yV2hvbGVXb3JkLnRlc3QodGV4dClcbiAgICAgIHJlZ2V4U2VhcmNoID1cbiAgICAgICAgXCIoPzpbIFxcXFx0I3tlc2NhcGVSZWdFeHAobm9uV29yZENoYXJhY3RlcnMpfV18XikoXCIgK1xuICAgICAgICByZWdleFNlYXJjaCArXG4gICAgICAgIFwiKSg/OlsgXFxcXHQje2VzY2FwZVJlZ0V4cChub25Xb3JkQ2hhcmFjdGVycyl9XXwkKVwiXG5cbiAgICBAcmVzdWx0Q291bnQgPSAwXG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCdoaWdobGlnaHQtc2VsZWN0ZWQuaGlnaGxpZ2h0SW5QYW5lcycpXG4gICAgICBvcmlnaW5hbEVkaXRvciA9IGVkaXRvclxuICAgICAgQGdldEFjdGl2ZUVkaXRvcnMoKS5mb3JFYWNoIChlZGl0b3IpID0+XG4gICAgICAgIEBoaWdobGlnaHRTZWxlY3Rpb25JbkVkaXRvcihlZGl0b3IsIHJlZ2V4U2VhcmNoLCByZWdleEZsYWdzLCBvcmlnaW5hbEVkaXRvcilcbiAgICBlbHNlXG4gICAgICBAaGlnaGxpZ2h0U2VsZWN0aW9uSW5FZGl0b3IoZWRpdG9yLCByZWdleFNlYXJjaCwgcmVnZXhGbGFncylcblxuICAgIEBzdGF0dXNCYXJFbGVtZW50Py51cGRhdGVDb3VudChAcmVzdWx0Q291bnQpXG5cbiAgaGlnaGxpZ2h0U2VsZWN0aW9uSW5FZGl0b3I6IChlZGl0b3IsIHJlZ2V4U2VhcmNoLCByZWdleEZsYWdzLCBvcmlnaW5hbEVkaXRvcikgLT5cbiAgICByZXR1cm4gdW5sZXNzIGVkaXRvcj9cbiAgICBtYXJrZXJMYXllcnMgPSAgQGVkaXRvclRvTWFya2VyTGF5ZXJNYXBbZWRpdG9yLmlkXVxuICAgIHJldHVybiB1bmxlc3MgbWFya2VyTGF5ZXJzP1xuICAgIG1hcmtlckxheWVyID0gbWFya2VyTGF5ZXJzWyd2aXNpYmxlTWFya2VyTGF5ZXInXVxuICAgIG1hcmtlckxheWVyRm9ySGlkZGVuTWFya2VycyA9IG1hcmtlckxheWVyc1snc2VsZWN0ZWRNYXJrZXJMYXllciddXG5cbiAgICBlZGl0b3Iuc2NhbiBuZXcgUmVnRXhwKHJlZ2V4U2VhcmNoLCByZWdleEZsYWdzKSxcbiAgICAgIChyZXN1bHQpID0+XG4gICAgICAgIG5ld1Jlc3VsdCA9IHJlc3VsdFxuICAgICAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ2hpZ2hsaWdodC1zZWxlY3RlZC5vbmx5SGlnaGxpZ2h0V2hvbGVXb3JkcycpXG4gICAgICAgICAgZWRpdG9yLnNjYW5JbkJ1ZmZlclJhbmdlKFxuICAgICAgICAgICAgbmV3IFJlZ0V4cChlc2NhcGVSZWdFeHAocmVzdWx0Lm1hdGNoWzFdKSksXG4gICAgICAgICAgICByZXN1bHQucmFuZ2UsXG4gICAgICAgICAgICAoZSkgLT4gbmV3UmVzdWx0ID0gZVxuICAgICAgICAgIClcblxuICAgICAgICByZXR1cm4gdW5sZXNzIG5ld1Jlc3VsdD9cbiAgICAgICAgQHJlc3VsdENvdW50ICs9IDFcblxuICAgICAgICBpZiBAc2hvd0hpZ2hsaWdodE9uU2VsZWN0ZWRXb3JkKG5ld1Jlc3VsdC5yYW5nZSwgQHNlbGVjdGlvbnMpICYmXG4gICAgICAgICAgIG9yaWdpbmFsRWRpdG9yPy5pZCA9PSBlZGl0b3IuaWRcbiAgICAgICAgICBtYXJrZXIgPSBtYXJrZXJMYXllckZvckhpZGRlbk1hcmtlcnMubWFya0J1ZmZlclJhbmdlKG5ld1Jlc3VsdC5yYW5nZSlcbiAgICAgICAgICBAZW1pdHRlci5lbWl0ICdkaWQtYWRkLXNlbGVjdGVkLW1hcmtlcicsIG1hcmtlclxuICAgICAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1hZGQtc2VsZWN0ZWQtbWFya2VyLWZvci1lZGl0b3InLFxuICAgICAgICAgICAgbWFya2VyOiBtYXJrZXJcbiAgICAgICAgICAgIGVkaXRvcjogZWRpdG9yXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBtYXJrZXIgPSBtYXJrZXJMYXllci5tYXJrQnVmZmVyUmFuZ2UobmV3UmVzdWx0LnJhbmdlKVxuICAgICAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1hZGQtbWFya2VyJywgbWFya2VyXG4gICAgICAgICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWFkZC1tYXJrZXItZm9yLWVkaXRvcicsXG4gICAgICAgICAgICBtYXJrZXI6IG1hcmtlclxuICAgICAgICAgICAgZWRpdG9yOiBlZGl0b3JcbiAgICBlZGl0b3IuZGVjb3JhdGVNYXJrZXJMYXllcihtYXJrZXJMYXllciwge1xuICAgICAgdHlwZTogJ2hpZ2hsaWdodCcsXG4gICAgICBjbGFzczogQG1ha2VDbGFzc2VzKClcbiAgICB9KVxuXG4gIG1ha2VDbGFzc2VzOiAtPlxuICAgIGNsYXNzTmFtZSA9ICdoaWdobGlnaHQtc2VsZWN0ZWQnXG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCdoaWdobGlnaHQtc2VsZWN0ZWQubGlnaHRUaGVtZScpXG4gICAgICBjbGFzc05hbWUgKz0gJyBsaWdodC10aGVtZSdcblxuICAgIGlmIGF0b20uY29uZmlnLmdldCgnaGlnaGxpZ2h0LXNlbGVjdGVkLmhpZ2hsaWdodEJhY2tncm91bmQnKVxuICAgICAgY2xhc3NOYW1lICs9ICcgYmFja2dyb3VuZCdcbiAgICBjbGFzc05hbWVcblxuICBzaG93SGlnaGxpZ2h0T25TZWxlY3RlZFdvcmQ6IChyYW5nZSwgc2VsZWN0aW9ucykgLT5cbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIGF0b20uY29uZmlnLmdldChcbiAgICAgICdoaWdobGlnaHQtc2VsZWN0ZWQuaGlkZUhpZ2hsaWdodE9uU2VsZWN0ZWRXb3JkJylcbiAgICBvdXRjb21lID0gZmFsc2VcbiAgICBmb3Igc2VsZWN0aW9uIGluIHNlbGVjdGlvbnNcbiAgICAgIHNlbGVjdGlvblJhbmdlID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICAgIG91dGNvbWUgPSAocmFuZ2Uuc3RhcnQuY29sdW1uIGlzIHNlbGVjdGlvblJhbmdlLnN0YXJ0LmNvbHVtbikgYW5kXG4gICAgICAgICAgICAgICAgKHJhbmdlLnN0YXJ0LnJvdyBpcyBzZWxlY3Rpb25SYW5nZS5zdGFydC5yb3cpIGFuZFxuICAgICAgICAgICAgICAgIChyYW5nZS5lbmQuY29sdW1uIGlzIHNlbGVjdGlvblJhbmdlLmVuZC5jb2x1bW4pIGFuZFxuICAgICAgICAgICAgICAgIChyYW5nZS5lbmQucm93IGlzIHNlbGVjdGlvblJhbmdlLmVuZC5yb3cpXG4gICAgICBicmVhayBpZiBvdXRjb21lXG4gICAgb3V0Y29tZVxuXG4gIHJlbW92ZUFsbE1hcmtlcnM6ID0+XG4gICAgT2JqZWN0LmtleXMoQGVkaXRvclRvTWFya2VyTGF5ZXJNYXApLmZvckVhY2goQHJlbW92ZU1hcmtlcnMpXG5cbiAgcmVtb3ZlTWFya2VyczogKGVkaXRvcklkKSA9PlxuICAgIHJldHVybiB1bmxlc3MgQGVkaXRvclRvTWFya2VyTGF5ZXJNYXBbZWRpdG9ySWRdP1xuXG4gICAgbWFya2VyTGF5ZXIgPSBAZWRpdG9yVG9NYXJrZXJMYXllck1hcFtlZGl0b3JJZF1bJ3Zpc2libGVNYXJrZXJMYXllciddXG4gICAgc2VsZWN0ZWRNYXJrZXJMYXllciA9IEBlZGl0b3JUb01hcmtlckxheWVyTWFwW2VkaXRvcklkXVsnc2VsZWN0ZWRNYXJrZXJMYXllciddXG5cbiAgICBtYXJrZXJMYXllci5jbGVhcigpXG4gICAgc2VsZWN0ZWRNYXJrZXJMYXllci5jbGVhcigpXG5cbiAgICBAc3RhdHVzQmFyRWxlbWVudD8udXBkYXRlQ291bnQoMClcbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtcmVtb3ZlLW1hcmtlci1sYXllcidcblxuICBpc1dvcmRTZWxlY3RlZDogKHNlbGVjdGlvbikgLT5cbiAgICBpZiBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKS5pc1NpbmdsZUxpbmUoKVxuICAgICAgc2VsZWN0aW9uUmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgICAgbGluZVJhbmdlID0gQGdldEFjdGl2ZUVkaXRvcigpLmJ1ZmZlclJhbmdlRm9yQnVmZmVyUm93KFxuICAgICAgICBzZWxlY3Rpb25SYW5nZS5zdGFydC5yb3cpXG4gICAgICBub25Xb3JkQ2hhcmFjdGVyVG9UaGVMZWZ0ID1cbiAgICAgICAgc2VsZWN0aW9uUmFuZ2Uuc3RhcnQuaXNFcXVhbChsaW5lUmFuZ2Uuc3RhcnQpIG9yXG4gICAgICAgIEBpc05vbldvcmRDaGFyYWN0ZXJUb1RoZUxlZnQoc2VsZWN0aW9uKVxuICAgICAgbm9uV29yZENoYXJhY3RlclRvVGhlUmlnaHQgPVxuICAgICAgICBzZWxlY3Rpb25SYW5nZS5lbmQuaXNFcXVhbChsaW5lUmFuZ2UuZW5kKSBvclxuICAgICAgICBAaXNOb25Xb3JkQ2hhcmFjdGVyVG9UaGVSaWdodChzZWxlY3Rpb24pXG5cbiAgICAgIG5vbldvcmRDaGFyYWN0ZXJUb1RoZUxlZnQgYW5kIG5vbldvcmRDaGFyYWN0ZXJUb1RoZVJpZ2h0XG4gICAgZWxzZVxuICAgICAgZmFsc2VcblxuICBpc05vbldvcmRDaGFyYWN0ZXI6IChjaGFyYWN0ZXIpIC0+XG4gICAgbm9uV29yZENoYXJhY3RlcnMgPSBhdG9tLmNvbmZpZy5nZXQoJ2VkaXRvci5ub25Xb3JkQ2hhcmFjdGVycycpXG4gICAgbmV3IFJlZ0V4cChcIlsgXFx0I3tlc2NhcGVSZWdFeHAobm9uV29yZENoYXJhY3RlcnMpfV1cIikudGVzdChjaGFyYWN0ZXIpXG5cbiAgaXNOb25Xb3JkQ2hhcmFjdGVyVG9UaGVMZWZ0OiAoc2VsZWN0aW9uKSAtPlxuICAgIHNlbGVjdGlvblN0YXJ0ID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCkuc3RhcnRcbiAgICByYW5nZSA9IFJhbmdlLmZyb21Qb2ludFdpdGhEZWx0YShzZWxlY3Rpb25TdGFydCwgMCwgLTEpXG4gICAgQGlzTm9uV29yZENoYXJhY3RlcihAZ2V0QWN0aXZlRWRpdG9yKCkuZ2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UpKVxuXG4gIGlzTm9uV29yZENoYXJhY3RlclRvVGhlUmlnaHQ6IChzZWxlY3Rpb24pIC0+XG4gICAgc2VsZWN0aW9uRW5kID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCkuZW5kXG4gICAgcmFuZ2UgPSBSYW5nZS5mcm9tUG9pbnRXaXRoRGVsdGEoc2VsZWN0aW9uRW5kLCAwLCAxKVxuICAgIEBpc05vbldvcmRDaGFyYWN0ZXIoQGdldEFjdGl2ZUVkaXRvcigpLmdldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlKSlcblxuICBzZXR1cFN0YXR1c0JhcjogPT5cbiAgICByZXR1cm4gaWYgQHN0YXR1c0JhckVsZW1lbnQ/XG4gICAgcmV0dXJuIHVubGVzcyBhdG9tLmNvbmZpZy5nZXQoJ2hpZ2hsaWdodC1zZWxlY3RlZC5zaG93SW5TdGF0dXNCYXInKVxuICAgIEBzdGF0dXNCYXJFbGVtZW50ID0gbmV3IFN0YXR1c0JhclZpZXcoKVxuICAgIEBzdGF0dXNCYXJUaWxlID0gQHN0YXR1c0Jhci5hZGRMZWZ0VGlsZShcbiAgICAgIGl0ZW06IEBzdGF0dXNCYXJFbGVtZW50LmdldEVsZW1lbnQoKSwgcHJpb3JpdHk6IDEwMClcblxuICByZW1vdmVTdGF0dXNCYXI6ID0+XG4gICAgcmV0dXJuIHVubGVzcyBAc3RhdHVzQmFyRWxlbWVudD9cbiAgICBAc3RhdHVzQmFyVGlsZT8uZGVzdHJveSgpXG4gICAgQHN0YXR1c0JhclRpbGUgPSBudWxsXG4gICAgQHN0YXR1c0JhckVsZW1lbnQgPSBudWxsXG5cbiAgbGlzdGVuRm9yU3RhdHVzQmFyQ2hhbmdlOiA9PlxuICAgIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlICdoaWdobGlnaHQtc2VsZWN0ZWQuc2hvd0luU3RhdHVzQmFyJywgKGNoYW5nZWQpID0+XG4gICAgICBpZiBjaGFuZ2VkLm5ld1ZhbHVlXG4gICAgICAgIEBzZXR1cFN0YXR1c0JhcigpXG4gICAgICBlbHNlXG4gICAgICAgIEByZW1vdmVTdGF0dXNCYXIoKVxuXG4gIHNlbGVjdEFsbDogPT5cbiAgICBlZGl0b3IgPSBAZ2V0QWN0aXZlRWRpdG9yKClcbiAgICBtYXJrZXJMYXllcnMgPSBAZWRpdG9yVG9NYXJrZXJMYXllck1hcFtlZGl0b3IuaWRdXG4gICAgcmV0dXJuIHVubGVzcyBtYXJrZXJMYXllcnM/XG4gICAgcmFuZ2VzID0gW11cbiAgICBmb3IgbWFya2VyTGF5ZXIgaW4gW21hcmtlckxheWVyc1sndmlzaWJsZU1hcmtlckxheWVyJ10sIG1hcmtlckxheWVyc1snc2VsZWN0ZWRNYXJrZXJMYXllciddXVxuICAgICAgZm9yIG1hcmtlciBpbiBtYXJrZXJMYXllci5nZXRNYXJrZXJzKClcbiAgICAgICAgcmFuZ2VzLnB1c2ggbWFya2VyLmdldEJ1ZmZlclJhbmdlKClcblxuICAgIGlmIHJhbmdlcy5sZW5ndGggPiAwXG4gICAgICBlZGl0b3Iuc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZXMocmFuZ2VzLCBmbGFzaDogdHJ1ZSlcblxuICBzZXRTY3JvbGxNYXJrZXI6IChzY3JvbGxNYXJrZXJBUEkpID0+XG4gICAgQHNjcm9sbE1hcmtlciA9IHNjcm9sbE1hcmtlckFQSVxuICAgIGlmIGF0b20uY29uZmlnLmdldCgnaGlnaGxpZ2h0LXNlbGVjdGVkLnNob3dSZXN1bHRzT25TY3JvbGxCYXInKVxuICAgICAgQGVuc3VyZVNjcm9sbFZpZXdJbnN0YWxsZWQoKVxuICAgICAgYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKS5mb3JFYWNoKEBzZXRTY3JvbGxNYXJrZXJWaWV3KVxuXG4gIGVuc3VyZVNjcm9sbFZpZXdJbnN0YWxsZWQ6IC0+XG4gICAgdW5sZXNzIGF0b20uaW5TcGVjTW9kZSgpXG4gICAgICByZXF1aXJlKCdhdG9tLXBhY2thZ2UtZGVwcycpLmluc3RhbGwgJ2hpZ2hsaWdodC1zZWxlY3RlZCcsIHRydWVcblxuICBzZXR1cE1hcmtlckxheWVyczogKGVkaXRvcikgPT5cbiAgICBpZiBAZWRpdG9yVG9NYXJrZXJMYXllck1hcFtlZGl0b3IuaWRdP1xuICAgICAgbWFya2VyTGF5ZXIgPSBAZWRpdG9yVG9NYXJrZXJMYXllck1hcFtlZGl0b3IuaWRdWyd2aXNpYmxlTWFya2VyTGF5ZXInXVxuICAgICAgbWFya2VyTGF5ZXJGb3JIaWRkZW5NYXJrZXJzICA9IEBlZGl0b3JUb01hcmtlckxheWVyTWFwW2VkaXRvci5pZF1bJ3NlbGVjdGVkTWFya2VyTGF5ZXInXVxuICAgIGVsc2VcbiAgICAgIG1hcmtlckxheWVyID0gZWRpdG9yLmFkZE1hcmtlckxheWVyKClcbiAgICAgIG1hcmtlckxheWVyRm9ySGlkZGVuTWFya2VycyA9IGVkaXRvci5hZGRNYXJrZXJMYXllcigpXG4gICAgICBAZWRpdG9yVG9NYXJrZXJMYXllck1hcFtlZGl0b3IuaWRdID1cbiAgICAgICAgdmlzaWJsZU1hcmtlckxheWVyOiBtYXJrZXJMYXllclxuICAgICAgICBzZWxlY3RlZE1hcmtlckxheWVyOiBtYXJrZXJMYXllckZvckhpZGRlbk1hcmtlcnNcblxuICBzZXRTY3JvbGxNYXJrZXJWaWV3OiAoZWRpdG9yKSA9PlxuICAgIHJldHVybiB1bmxlc3MgYXRvbS5jb25maWcuZ2V0KCdoaWdobGlnaHQtc2VsZWN0ZWQuc2hvd1Jlc3VsdHNPblNjcm9sbEJhcicpXG4gICAgcmV0dXJuIHVubGVzcyBAc2Nyb2xsTWFya2VyP1xuXG4gICAgc2Nyb2xsTWFya2VyVmlldyA9IEBzY3JvbGxNYXJrZXIuc2Nyb2xsTWFya2VyVmlld0ZvckVkaXRvcihlZGl0b3IpXG5cbiAgICBtYXJrZXJMYXllciA9IEBlZGl0b3JUb01hcmtlckxheWVyTWFwW2VkaXRvci5pZF1bJ3Zpc2libGVNYXJrZXJMYXllciddXG4gICAgc2VsZWN0ZWRNYXJrZXJMYXllciA9IEBlZGl0b3JUb01hcmtlckxheWVyTWFwW2VkaXRvci5pZF1bJ3NlbGVjdGVkTWFya2VyTGF5ZXInXVxuXG4gICAgc2Nyb2xsTWFya2VyVmlldy5nZXRMYXllcihcImhpZ2hsaWdodC1zZWxlY3RlZC1tYXJrZXItbGF5ZXJcIilcbiAgICAgICAgICAgICAgICAgICAgLnN5bmNUb01hcmtlckxheWVyKG1hcmtlckxheWVyKVxuICAgIHNjcm9sbE1hcmtlclZpZXcuZ2V0TGF5ZXIoXCJoaWdobGlnaHQtc2VsZWN0ZWQtc2VsZWN0ZWQtbWFya2VyLWxheWVyXCIpXG4gICAgICAgICAgICAgICAgICAgIC5zeW5jVG9NYXJrZXJMYXllcihzZWxlY3RlZE1hcmtlckxheWVyKVxuXG4gIGRlc3Ryb3lTY3JvbGxNYXJrZXJzOiAoZWRpdG9yKSA9PlxuICAgIHJldHVybiB1bmxlc3MgQHNjcm9sbE1hcmtlcj9cblxuICAgIHNjcm9sbE1hcmtlclZpZXcgPSBAc2Nyb2xsTWFya2VyLnNjcm9sbE1hcmtlclZpZXdGb3JFZGl0b3IoZWRpdG9yKVxuICAgIHNjcm9sbE1hcmtlclZpZXcuZGVzdHJveSgpXG4iXX0=
