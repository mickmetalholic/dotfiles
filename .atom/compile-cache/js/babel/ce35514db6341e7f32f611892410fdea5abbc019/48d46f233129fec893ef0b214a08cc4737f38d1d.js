'use babel';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SearchModel = require('./search-model');

var _require = require('./motion');

var Motion = _require.Motion;

var SearchBase = (function (_Motion) {
  _inherits(SearchBase, _Motion);

  function SearchBase() {
    _classCallCheck(this, SearchBase);

    _get(Object.getPrototypeOf(SearchBase.prototype), 'constructor', this).apply(this, arguments);

    this.jump = true;
    this.backwards = false;
    this.useRegexp = true;
    this.landingPoint = null;
    this.defaultLandingPoint = 'start';
    this.relativeIndex = null;
    this.updatelastSearchPattern = true;
  }

  // /, ?
  // -------------------------

  _createClass(SearchBase, [{
    key: 'isBackwards',
    value: function isBackwards() {
      return this.backwards;
    }
  }, {
    key: 'resetState',
    value: function resetState() {
      _get(Object.getPrototypeOf(SearchBase.prototype), 'resetState', this).call(this);
      this.relativeIndex = null;
    }
  }, {
    key: 'isIncrementalSearch',
    value: function isIncrementalSearch() {
      return this['instanceof']('Search') && !this.repeated && this.getConfig('incrementalSearch');
    }
  }, {
    key: 'initialize',
    value: function initialize() {
      var _this = this;

      this.onDidFinishOperation(function () {
        return _this.finish();
      });
      _get(Object.getPrototypeOf(SearchBase.prototype), 'initialize', this).call(this);
    }
  }, {
    key: 'getCount',
    value: function getCount() {
      return _get(Object.getPrototypeOf(SearchBase.prototype), 'getCount', this).call(this) * (this.isBackwards() ? -1 : 1);
    }
  }, {
    key: 'finish',
    value: function finish() {
      if (this.isIncrementalSearch() && this.getConfig('showHoverSearchCounter')) {
        this.vimState.hoverSearchCounter.reset();
      }
      if (this.searchModel) this.searchModel.destroy();

      this.relativeIndex = null;
      this.searchModel = null;
    }
  }, {
    key: 'getLandingPoint',
    value: function getLandingPoint() {
      if (!this.landingPoint) this.landingPoint = this.defaultLandingPoint;
      return this.landingPoint;
    }
  }, {
    key: 'getPoint',
    value: function getPoint(cursor) {
      if (this.searchModel) {
        this.relativeIndex = this.getCount() + this.searchModel.getRelativeIndex();
      } else if (this.relativeIndex == null) {
        this.relativeIndex = this.getCount();
      }

      var range = this.search(cursor, this.input, this.relativeIndex);

      this.searchModel.destroy();
      this.searchModel = null;

      if (range) return range[this.getLandingPoint()];
    }
  }, {
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      if (!this.input) return;
      var point = this.getPoint(cursor);

      if (point) {
        if (this.restoreEditorState) {
          this.restoreEditorState({ anchorPosition: point, skipRow: point.row });
          this.restoreEditorState = null; // HACK: dont refold on `n`, `N` repeat
        }
        cursor.setBufferPosition(point, { autoscroll: false });
      }

      if (!this.repeated) {
        this.globalState.set('currentSearch', this);
        this.vimState.searchHistory.save(this.input);
      }

      if (this.updatelastSearchPattern) {
        this.globalState.set('lastSearchPattern', this.getPattern(this.input));
      }
    }
  }, {
    key: 'getSearchModel',
    value: function getSearchModel() {
      if (!this.searchModel) {
        this.searchModel = new SearchModel(this.vimState, { incrementalSearch: this.isIncrementalSearch() });
      }
      return this.searchModel;
    }
  }, {
    key: 'search',
    value: function search(cursor, input, relativeIndex) {
      var searchModel = this.getSearchModel();
      if (input) {
        var fromPoint = this.getBufferPositionForCursor(cursor);
        return searchModel.search(fromPoint, this.getPattern(input), relativeIndex);
      }
      this.vimState.hoverSearchCounter.reset();
      searchModel.clearMarkers();
    }
  }], [{
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return SearchBase;
})(Motion);

var Search = (function (_SearchBase) {
  _inherits(Search, _SearchBase);

  function Search() {
    _classCallCheck(this, Search);

    _get(Object.getPrototypeOf(Search.prototype), 'constructor', this).apply(this, arguments);

    this.caseSensitivityKind = 'Search';
    this.requireInput = true;
  }

  _createClass(Search, [{
    key: 'initialize',
    value: function initialize() {
      if (this.isIncrementalSearch()) {
        this.restoreEditorState = this.utils.saveEditorState(this.editor);
        this.onDidCommandSearch(this.handleCommandEvent.bind(this));
      }

      this.onDidConfirmSearch(this.handleConfirmSearch.bind(this));
      this.onDidCancelSearch(this.handleCancelSearch.bind(this));
      this.onDidChangeSearch(this.handleChangeSearch.bind(this));

      this.focusSearchInputEditor();

      _get(Object.getPrototypeOf(Search.prototype), 'initialize', this).call(this);
    }
  }, {
    key: 'focusSearchInputEditor',
    value: function focusSearchInputEditor() {
      var classList = this.isBackwards() ? ['backwards'] : [];
      this.vimState.searchInput.focus({ classList: classList });
    }
  }, {
    key: 'handleCommandEvent',
    value: function handleCommandEvent(event) {
      if (!event.input) return;

      if (event.name === 'visit') {
        var direction = event.direction;

        if (this.isBackwards() && this.getConfig('incrementalSearchVisitDirection') === 'relative') {
          direction = direction === 'next' ? 'prev' : 'next';
        }
        this.getSearchModel().visit(direction === 'next' ? +1 : -1);
      } else if (event.name === 'occurrence') {
        var operation = event.operation;
        var input = event.input;

        this.occurrenceManager.addPattern(this.getPattern(input), { reset: operation != null });
        this.occurrenceManager.saveLastPattern();

        this.vimState.searchHistory.save(input);
        this.vimState.searchInput.cancel();
        if (operation != null) this.vimState.operationStack.run(operation);
      } else if (event.name === 'project-find') {
        this.vimState.searchHistory.save(event.input);
        this.vimState.searchInput.cancel();
        this.utils.searchByProjectFind(this.editor, event.input);
      }
    }
  }, {
    key: 'handleCancelSearch',
    value: function handleCancelSearch() {
      if (!['visual', 'insert'].includes(this.mode)) this.vimState.resetNormalMode();

      if (this.restoreEditorState) this.restoreEditorState();
      this.vimState.reset();
      this.finish();
    }
  }, {
    key: 'isSearchRepeatCharacter',
    value: function isSearchRepeatCharacter(char) {
      return this.isIncrementalSearch() ? char === '' : ['', this.isBackwards() ? '?' : '/'].includes(char); // empty confirm or invoking-char
    }
  }, {
    key: 'handleConfirmSearch',
    value: function handleConfirmSearch(_ref) {
      var input = _ref.input;
      var landingPoint = _ref.landingPoint;

      this.input = input;
      this.landingPoint = landingPoint;
      if (this.isSearchRepeatCharacter(this.input)) {
        this.input = this.vimState.searchHistory.get('prev');
        if (!this.input) atom.beep();
      }
      this.processOperation();
    }
  }, {
    key: 'handleChangeSearch',
    value: function handleChangeSearch(input) {
      // If input starts with space, remove first space and disable useRegexp.
      if (input.startsWith(' ')) {
        // FIXME: Sould I remove this unknown hack and implement visible button to togle regexp?
        input = input.replace(/^ /, '');
        this.useRegexp = false;
      }
      this.vimState.searchInput.updateOptionSettings({ useRegexp: this.useRegexp });

      if (this.isIncrementalSearch()) {
        this.search(this.editor.getLastCursor(), input, this.getCount());
      }
    }
  }, {
    key: 'getPattern',
    value: function getPattern(term) {
      var modifiers = this.isCaseSensitive(term) ? 'g' : 'gi';
      // FIXME this prevent search \\c itself.
      // DONT thinklessly mimic pure Vim. Instead, provide ignorecase button and shortcut.
      if (term.indexOf('\\c') >= 0) {
        term = term.replace('\\c', '');
        if (!modifiers.includes('i')) modifiers += 'i';
      }

      if (this.useRegexp) {
        try {
          return new RegExp(term, modifiers);
        } catch (error) {}
      }
      return new RegExp(this._.escapeRegExp(term), modifiers);
    }
  }]);

  return Search;
})(SearchBase);

var SearchBackwards = (function (_Search) {
  _inherits(SearchBackwards, _Search);

  function SearchBackwards() {
    _classCallCheck(this, SearchBackwards);

    _get(Object.getPrototypeOf(SearchBackwards.prototype), 'constructor', this).apply(this, arguments);

    this.backwards = true;
  }

  // *, #
  // -------------------------
  return SearchBackwards;
})(Search);

var SearchCurrentWord = (function (_SearchBase2) {
  _inherits(SearchCurrentWord, _SearchBase2);

  function SearchCurrentWord() {
    _classCallCheck(this, SearchCurrentWord);

    _get(Object.getPrototypeOf(SearchCurrentWord.prototype), 'constructor', this).apply(this, arguments);

    this.caseSensitivityKind = 'SearchCurrentWord';
  }

  _createClass(SearchCurrentWord, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      if (this.input == null) {
        var wordRange = this.getCurrentWordBufferRange();
        if (wordRange) {
          this.editor.setCursorBufferPosition(wordRange.start);
          this.input = this.editor.getTextInBufferRange(wordRange);
        } else {
          this.input = '';
        }
      }

      _get(Object.getPrototypeOf(SearchCurrentWord.prototype), 'moveCursor', this).call(this, cursor);
    }
  }, {
    key: 'getPattern',
    value: function getPattern(term) {
      var escaped = this._.escapeRegExp(term);
      var source = /\W/.test(term) ? escaped + '\\b' : '\\b' + escaped + '\\b';
      return new RegExp(source, this.isCaseSensitive(term) ? 'g' : 'gi');
    }
  }, {
    key: 'getCurrentWordBufferRange',
    value: function getCurrentWordBufferRange() {
      var cursor = this.editor.getLastCursor();
      var point = cursor.getBufferPosition();

      var nonWordCharacters = this.utils.getNonWordCharactersForCursor(cursor);
      var regex = new RegExp('[^\\s' + this._.escapeRegExp(nonWordCharacters) + ']+', 'g');
      var options = { from: [point.row, 0], allowNextLine: false };
      return this.findInEditor('forward', regex, options, function (_ref2) {
        var range = _ref2.range;
        return range.end.isGreaterThan(point) && range;
      });
    }
  }]);

  return SearchCurrentWord;
})(SearchBase);

var SearchCurrentWordBackwards = (function (_SearchCurrentWord) {
  _inherits(SearchCurrentWordBackwards, _SearchCurrentWord);

  function SearchCurrentWordBackwards() {
    _classCallCheck(this, SearchCurrentWordBackwards);

    _get(Object.getPrototypeOf(SearchCurrentWordBackwards.prototype), 'constructor', this).apply(this, arguments);

    this.backwards = true;
  }

  return SearchCurrentWordBackwards;
})(SearchCurrentWord);

module.exports = {
  SearchBase: SearchBase,
  Search: Search,
  SearchBackwards: SearchBackwards,
  SearchCurrentWord: SearchCurrentWord,
  SearchCurrentWordBackwards: SearchCurrentWordBackwards
};
// ['start' or 'end']
// ['start' or 'end']
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3l1YW5zaGVuLy5hdG9tL3BhY2thZ2VzL3ZpbS1tb2RlLXBsdXMvbGliL21vdGlvbi1zZWFyY2guanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFBOzs7Ozs7Ozs7O0FBRVgsSUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUE7O2VBQzVCLE9BQU8sQ0FBQyxVQUFVLENBQUM7O0lBQTdCLE1BQU0sWUFBTixNQUFNOztJQUVQLFVBQVU7WUFBVixVQUFVOztXQUFWLFVBQVU7MEJBQVYsVUFBVTs7K0JBQVYsVUFBVTs7U0FFZCxJQUFJLEdBQUcsSUFBSTtTQUNYLFNBQVMsR0FBRyxLQUFLO1NBQ2pCLFNBQVMsR0FBRyxJQUFJO1NBQ2hCLFlBQVksR0FBRyxJQUFJO1NBQ25CLG1CQUFtQixHQUFHLE9BQU87U0FDN0IsYUFBYSxHQUFHLElBQUk7U0FDcEIsdUJBQXVCLEdBQUcsSUFBSTs7Ozs7O2VBUjFCLFVBQVU7O1dBVUYsdUJBQUc7QUFDYixhQUFPLElBQUksQ0FBQyxTQUFTLENBQUE7S0FDdEI7OztXQUVVLHNCQUFHO0FBQ1osaUNBZkUsVUFBVSw0Q0FlTTtBQUNsQixVQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQTtLQUMxQjs7O1dBRW1CLCtCQUFHO0FBQ3JCLGFBQU8sSUFBSSxjQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsQ0FBQTtLQUMxRjs7O1dBRVUsc0JBQUc7OztBQUNaLFVBQUksQ0FBQyxvQkFBb0IsQ0FBQztlQUFNLE1BQUssTUFBTSxFQUFFO09BQUEsQ0FBQyxDQUFBO0FBQzlDLGlDQXpCRSxVQUFVLDRDQXlCTTtLQUNuQjs7O1dBRVEsb0JBQUc7QUFDVixhQUFPLDJCQTdCTCxVQUFVLDZDQTZCZSxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxD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QUMsQ0FBQTtBQUM1RCxhQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsVUFBQyxLQUFPO1lBQU4sS0FBSyxHQUFOLEtBQU8sQ0FBTixLQUFLO2VBQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSztPQUFBLENBQUMsQ0FBQTtLQUMxRzs7O1NBL0JHLGlCQUFpQjtHQUFTLFVBQVU7O0lBa0NwQywwQkFBMEI7WUFBMUIsMEJBQTBCOztXQUExQiwwQkFBMEI7MEJBQTFCLDBCQUEwQjs7K0JBQTFCLDBCQUEwQjs7U0FDOUIsU0FBUyxHQUFHLElBQUk7OztTQURaLDBCQUEwQjtHQUFTLGlCQUFpQjs7QUFJMUQsTUFBTSxDQUFDLE9BQU8sR0FBRztBQUNmLFlBQVUsRUFBVixVQUFVO0FBQ1YsUUFBTSxFQUFOLE1BQU07QUFDTixpQkFBZSxFQUFmLGVBQWU7QUFDZixtQkFBaUIsRUFBakIsaUJBQWlCO0FBQ2pCLDRCQUEwQixFQUExQiwwQkFBMEI7Q0FDM0IsQ0FBQSIsImZpbGUiOiIvaG9tZS95dWFuc2hlbi8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9tb3Rpb24tc2VhcmNoLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCdcblxuY29uc3QgU2VhcmNoTW9kZWwgPSByZXF1aXJlKCcuL3NlYXJjaC1tb2RlbCcpXG5jb25zdCB7TW90aW9ufSA9IHJlcXVpcmUoJy4vbW90aW9uJylcblxuY2xhc3MgU2VhcmNoQmFzZSBleHRlbmRzIE1vdGlvbiB7XG4gIHN0YXRpYyBjb21tYW5kID0gZmFsc2VcbiAganVtcCA9IHRydWVcbiAgYmFja3dhcmRzID0gZmFsc2VcbiAgdXNlUmVnZXhwID0gdHJ1ZVxuICBsYW5kaW5nUG9pbnQgPSBudWxsIC8vIFsnc3RhcnQnIG9yICdlbmQnXVxuICBkZWZhdWx0TGFuZGluZ1BvaW50ID0gJ3N0YXJ0JyAvLyBbJ3N0YXJ0JyBvciAnZW5kJ11cbiAgcmVsYXRpdmVJbmRleCA9IG51bGxcbiAgdXBkYXRlbGFzdFNlYXJjaFBhdHRlcm4gPSB0cnVlXG5cbiAgaXNCYWNrd2FyZHMgKCkge1xuICAgIHJldHVybiB0aGlzLmJhY2t3YXJkc1xuICB9XG5cbiAgcmVzZXRTdGF0ZSAoKSB7XG4gICAgc3VwZXIucmVzZXRTdGF0ZSgpXG4gICAgdGhpcy5yZWxhdGl2ZUluZGV4ID0gbnVsbFxuICB9XG5cbiAgaXNJbmNyZW1lbnRhbFNlYXJjaCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zdGFuY2VvZignU2VhcmNoJykgJiYgIXRoaXMucmVwZWF0ZWQgJiYgdGhpcy5nZXRDb25maWcoJ2luY3JlbWVudGFsU2VhcmNoJylcbiAgfVxuXG4gIGluaXRpYWxpemUgKCkge1xuICAgIHRoaXMub25EaWRGaW5pc2hPcGVyYXRpb24oKCkgPT4gdGhpcy5maW5pc2goKSlcbiAgICBzdXBlci5pbml0aWFsaXplKClcbiAgfVxuXG4gIGdldENvdW50ICgpIHtcbiAgICByZXR1cm4gc3VwZXIuZ2V0Q291bnQoKSAqICh0aGlzLmlzQmFja3dhcmRzKCkgPyAtMSA6IDEpXG4gIH1cblxuICBmaW5pc2ggKCkge1xuICAgIGlmICh0aGlzLmlzSW5jcmVtZW50YWxTZWFyY2goKSAmJiB0aGlzLmdldENvbmZpZygnc2hvd0hvdmVyU2VhcmNoQ291bnRlcicpKSB7XG4gICAgICB0aGlzLnZpbVN0YXRlLmhvdmVyU2VhcmNoQ291bnRlci5yZXNldCgpXG4gICAgfVxuICAgIGlmICh0aGlzLnNlYXJjaE1vZGVsKSB0aGlzLnNlYXJjaE1vZGVsLmRlc3Ryb3koKVxuXG4gICAgdGhpcy5yZWxhdGl2ZUluZGV4ID0gbnVsbFxuICAgIHRoaXMuc2VhcmNoTW9kZWwgPSBudWxsXG4gIH1cblxuICBnZXRMYW5kaW5nUG9pbnQgKCkge1xuICAgIGlmICghdGhpcy5sYW5kaW5nUG9pbnQpIHRoaXMubGFuZGluZ1BvaW50ID0gdGhpcy5kZWZhdWx0TGFuZGluZ1BvaW50XG4gICAgcmV0dXJuIHRoaXMubGFuZGluZ1BvaW50XG4gIH1cblxuICBnZXRQb2ludCAoY3Vyc29yKSB7XG4gICAgaWYgKHRoaXMuc2VhcmNoTW9kZWwpIHtcbiAgICAgIHRoaXMucmVsYXRpdmVJbmRleCA9IHRoaXMuZ2V0Q291bnQoKSArIHRoaXMuc2VhcmNoTW9kZWwuZ2V0UmVsYXRpdmVJbmRleCgpXG4gICAgfSBlbHNlIGlmICh0aGlzLnJlbGF0aXZlSW5kZXggPT0gbnVsbCkge1xuICAgICAgdGhpcy5yZWxhdGl2ZUluZGV4ID0gdGhpcy5nZXRDb3VudCgpXG4gICAgfVxuXG4gICAgY29uc3QgcmFuZ2UgPSB0aGlzLnNlYXJjaChjdXJzb3IsIHRoaXMuaW5wdXQsIHRoaXMucmVsYXRpdmVJbmRleClcblxuICAgIHRoaXMuc2VhcmNoTW9kZWwuZGVzdHJveSgpXG4gICAgdGhpcy5zZWFyY2hNb2RlbCA9IG51bGxcblxuICAgIGlmIChyYW5nZSkgcmV0dXJuIHJhbmdlW3RoaXMuZ2V0TGFuZGluZ1BvaW50KCldXG4gIH1cblxuICBtb3ZlQ3Vyc29yIChjdXJzb3IpIHtcbiAgICBpZiAoIXRoaXMuaW5wdXQpIHJldHVyblxuICAgIGNvbnN0IHBvaW50ID0gdGhpcy5nZXRQb2ludChjdXJzb3IpXG5cbiAgICBpZiAocG9pbnQpIHtcbiAgICAgIGlmICh0aGlzLnJlc3RvcmVFZGl0b3JTdGF0ZSkge1xuICAgICAgICB0aGlzLnJlc3RvcmVFZGl0b3JTdGF0ZSh7YW5jaG9yUG9zaXRpb246IHBvaW50LCBza2lwUm93OiBwb2ludC5yb3d9KVxuICAgICAgICB0aGlzLnJlc3RvcmVFZGl0b3JTdGF0ZSA9IG51bGwgLy8gSEFDSzogZG9udCByZWZvbGQgb24gYG5gLCBgTmAgcmVwZWF0XG4gICAgICB9XG4gICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQsIHthdXRvc2Nyb2xsOiBmYWxzZX0pXG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLnJlcGVhdGVkKSB7XG4gICAgICB0aGlzLmdsb2JhbFN0YXRlLnNldCgnY3VycmVudFNlYXJjaCcsIHRoaXMpXG4gICAgICB0aGlzLnZpbVN0YXRlLnNlYXJjaEhpc3Rvcnkuc2F2ZSh0aGlzLmlucHV0KVxuICAgIH1cblxuICAgIGlmICh0aGlzLnVwZGF0ZWxhc3RTZWFyY2hQYXR0ZXJuKSB7XG4gICAgICB0aGlzLmdsb2JhbFN0YXRlLnNldCgnbGFzdFNlYXJjaFBhdHRlcm4nLCB0aGlzLmdldFBhdHRlcm4odGhpcy5pbnB1dCkpXG4gICAgfVxuICB9XG5cbiAgZ2V0U2VhcmNoTW9kZWwgKCkge1xuICAgIGlmICghdGhpcy5zZWFyY2hNb2RlbCkge1xuICAgICAgdGhpcy5zZWFyY2hNb2RlbCA9IG5ldyBTZWFyY2hNb2RlbCh0aGlzLnZpbVN0YXRlLCB7aW5jcmVtZW50YWxTZWFyY2g6IHRoaXMuaXNJbmNyZW1lbnRhbFNlYXJjaCgpfSlcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuc2VhcmNoTW9kZWxcbiAgfVxuXG4gIHNlYXJjaCAoY3Vyc29yLCBpbnB1dCwgcmVsYXRpdmVJbmRleCkge1xuICAgIGNvbnN0IHNlYXJjaE1vZGVsID0gdGhpcy5nZXRTZWFyY2hNb2RlbCgpXG4gICAgaWYgKGlucHV0KSB7XG4gICAgICBjb25zdCBmcm9tUG9pbnQgPSB0aGlzLmdldEJ1ZmZlclBvc2l0aW9uRm9yQ3Vyc29yKGN1cnNvcilcbiAgICAgIHJldHVybiBzZWFyY2hNb2RlbC5zZWFyY2goZnJvbVBvaW50LCB0aGlzLmdldFBhdHRlcm4oaW5wdXQpLCByZWxhdGl2ZUluZGV4KVxuICAgIH1cbiAgICB0aGlzLnZpbVN0YXRlLmhvdmVyU2VhcmNoQ291bnRlci5yZXNldCgpXG4gICAgc2VhcmNoTW9kZWwuY2xlYXJNYXJrZXJzKClcbiAgfVxufVxuXG4vLyAvLCA/XG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBTZWFyY2ggZXh0ZW5kcyBTZWFyY2hCYXNlIHtcbiAgY2FzZVNlbnNpdGl2aXR5S2luZCA9ICdTZWFyY2gnXG4gIHJlcXVpcmVJbnB1dCA9IHRydWVcblxuICBpbml0aWFsaXplICgpIHtcbiAgICBpZiAodGhpcy5pc0luY3JlbWVudGFsU2VhcmNoKCkpIHtcbiAgICAgIHRoaXMucmVzdG9yZUVkaXRvclN0YXRlID0gdGhpcy51dGlscy5zYXZlRWRpdG9yU3RhdGUodGhpcy5lZGl0b3IpXG4gICAgICB0aGlzLm9uRGlkQ29tbWFuZFNlYXJjaCh0aGlzLmhhbmRsZUNvbW1hbmRFdmVudC5iaW5kKHRoaXMpKVxuICAgIH1cblxuICAgIHRoaXMub25EaWRDb25maXJtU2VhcmNoKHRoaXMuaGFuZGxlQ29uZmlybVNlYXJjaC5iaW5kKHRoaXMpKVxuICAgIHRoaXMub25EaWRDYW5jZWxTZWFyY2godGhpcy5oYW5kbGVDYW5jZWxTZWFyY2guYmluZCh0aGlzKSlcbiAgICB0aGlzLm9uRGlkQ2hhbmdlU2VhcmNoKHRoaXMuaGFuZGxlQ2hhbmdlU2VhcmNoLmJpbmQodGhpcykpXG5cbiAgICB0aGlzLmZvY3VzU2VhcmNoSW5wdXRFZGl0b3IoKVxuXG4gICAgc3VwZXIuaW5pdGlhbGl6ZSgpXG4gIH1cblxuICBmb2N1c1NlYXJjaElucHV0RWRpdG9yICgpIHtcbiAgICBjb25zdCBjbGFzc0xpc3QgPSB0aGlzLmlzQmFja3dhcmRzKCkgPyBbJ2JhY2t3YXJkcyddIDogW11cbiAgICB0aGlzLnZpbVN0YXRlLnNlYXJjaElucHV0LmZvY3VzKHtjbGFzc0xpc3R9KVxuICB9XG5cbiAgaGFuZGxlQ29tbWFuZEV2ZW50IChldmVudCkge1xuICAgIGlmICghZXZlbnQuaW5wdXQpIHJldHVyblxuXG4gICAgaWYgKGV2ZW50Lm5hbWUgPT09ICd2aXNpdCcpIHtcbiAgICAgIGxldCB7ZGlyZWN0aW9ufSA9IGV2ZW50XG4gICAgICBpZiAodGhpcy5pc0JhY2t3YXJkcygpICYmIHRoaXMuZ2V0Q29uZmlnKCdpbmNyZW1lbnRhbFNlYXJjaFZpc2l0RGlyZWN0aW9uJykgPT09ICdyZWxhdGl2ZScpIHtcbiAgICAgICAgZGlyZWN0aW9uID0gZGlyZWN0aW9uID09PSAnbmV4dCcgPyAncHJldicgOiAnbmV4dCdcbiAgICAgIH1cbiAgICAgIHRoaXMuZ2V0U2VhcmNoTW9kZWwoKS52aXNpdChkaXJlY3Rpb24gPT09ICduZXh0JyA/ICsxIDogLTEpXG4gICAgfSBlbHNlIGlmIChldmVudC5uYW1lID09PSAnb2NjdXJyZW5jZScpIHtcbiAgICAgIGNvbnN0IHtvcGVyYXRpb24sIGlucHV0fSA9IGV2ZW50XG4gICAgICB0aGlzLm9jY3VycmVuY2VNYW5hZ2VyLmFkZFBhdHRlcm4odGhpcy5nZXRQYXR0ZXJuKGlucHV0KSwge3Jlc2V0OiBvcGVyYXRpb24gIT0gbnVsbH0pXG4gICAgICB0aGlzLm9jY3VycmVuY2VNYW5hZ2VyLnNhdmVMYXN0UGF0dGVybigpXG5cbiAgICAgIHRoaXMudmltU3RhdGUuc2VhcmNoSGlzdG9yeS5zYXZlKGlucHV0KVxuICAgICAgdGhpcy52aW1TdGF0ZS5zZWFyY2hJbnB1dC5jYW5jZWwoKVxuICAgICAgaWYgKG9wZXJhdGlvbiAhPSBudWxsKSB0aGlzLnZpbVN0YXRlLm9wZXJhdGlvblN0YWNrLnJ1bihvcGVyYXRpb24pXG4gICAgfSBlbHNlIGlmIChldmVudC5uYW1lID09PSAncHJvamVjdC1maW5kJykge1xuICAgICAgdGhpcy52aW1TdGF0ZS5zZWFyY2hIaXN0b3J5LnNhdmUoZXZlbnQuaW5wdXQpXG4gICAgICB0aGlzLnZpbVN0YXRlLnNlYXJjaElucHV0LmNhbmNlbCgpXG4gICAgICB0aGlzLnV0aWxzLnNlYXJjaEJ5UHJvamVjdEZpbmQodGhpcy5lZGl0b3IsIGV2ZW50LmlucHV0KVxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZUNhbmNlbFNlYXJjaCAoKSB7XG4gICAgaWYgKCFbJ3Zpc3VhbCcsICdpbnNlcnQnXS5pbmNsdWRlcyh0aGlzLm1vZGUpKSB0aGlzLnZpbVN0YXRlLnJlc2V0Tm9ybWFsTW9kZSgpXG5cbiAgICBpZiAodGhpcy5yZXN0b3JlRWRpdG9yU3RhdGUpIHRoaXMucmVzdG9yZUVkaXRvclN0YXRlKClcbiAgICB0aGlzLnZpbVN0YXRlLnJlc2V0KClcbiAgICB0aGlzLmZpbmlzaCgpXG4gIH1cblxuICBpc1NlYXJjaFJlcGVhdENoYXJhY3RlciAoY2hhcikge1xuICAgIHJldHVybiB0aGlzLmlzSW5jcmVtZW50YWxTZWFyY2goKSA/IGNoYXIgPT09ICcnIDogWycnLCB0aGlzLmlzQmFja3dhcmRzKCkgPyAnPycgOiAnLyddLmluY2x1ZGVzKGNoYXIpIC8vIGVtcHR5IGNvbmZpcm0gb3IgaW52b2tpbmctY2hhclxuICB9XG5cbiAgaGFuZGxlQ29uZmlybVNlYXJjaCAoe2lucHV0LCBsYW5kaW5nUG9pbnR9KSB7XG4gICAgdGhpcy5pbnB1dCA9IGlucHV0XG4gICAgdGhpcy5sYW5kaW5nUG9pbnQgPSBsYW5kaW5nUG9pbnRcbiAgICBpZiAodGhpcy5pc1NlYXJjaFJlcGVhdENoYXJhY3Rlcih0aGlzLmlucHV0KSkge1xuICAgICAgdGhpcy5pbnB1dCA9IHRoaXMudmltU3RhdGUuc2VhcmNoSGlzdG9yeS5nZXQoJ3ByZXYnKVxuICAgICAgaWYgKCF0aGlzLmlucHV0KSBhdG9tLmJlZXAoKVxuICAgIH1cbiAgICB0aGlzLnByb2Nlc3NPcGVyYXRpb24oKVxuICB9XG5cbiAgaGFuZGxlQ2hhbmdlU2VhcmNoIChpbnB1dCkge1xuICAgIC8vIElmIGlucHV0IHN0YXJ0cyB3aXRoIHNwYWNlLCByZW1vdmUgZmlyc3Qgc3BhY2UgYW5kIGRpc2FibGUgdXNlUmVnZXhwLlxuICAgIGlmIChpbnB1dC5zdGFydHNXaXRoKCcgJykpIHtcbiAgICAgIC8vIEZJWE1FOiBTb3VsZCBJIHJlbW92ZSB0aGlzIHVua25vd24gaGFjayBhbmQgaW1wbGVtZW50IHZpc2libGUgYnV0dG9uIHRvIHRvZ2xlIHJlZ2V4cD9cbiAgICAgIGlucHV0ID0gaW5wdXQucmVwbGFjZSgvXiAvLCAnJylcbiAgICAgIHRoaXMudXNlUmVnZXhwID0gZmFsc2VcbiAgICB9XG4gICAgdGhpcy52aW1TdGF0ZS5zZWFyY2hJbnB1dC51cGRhdGVPcHRpb25TZXR0aW5ncyh7dXNlUmVnZXhwOiB0aGlzLnVzZVJlZ2V4cH0pXG5cbiAgICBpZiAodGhpcy5pc0luY3JlbWVudGFsU2VhcmNoKCkpIHtcbiAgICAgIHRoaXMuc2VhcmNoKHRoaXMuZWRpdG9yLmdldExhc3RDdXJzb3IoKSwgaW5wdXQsIHRoaXMuZ2V0Q291bnQoKSlcbiAgICB9XG4gIH1cblxuICBnZXRQYXR0ZXJuICh0ZXJtKSB7XG4gICAgbGV0IG1vZGlmaWVycyA9IHRoaXMuaXNDYXNlU2Vuc2l0aXZlKHRlcm0pID8gJ2cnIDogJ2dpJ1xuICAgIC8vIEZJWE1FIHRoaXMgcHJldmVudCBzZWFyY2ggXFxcXGMgaXRzZWxmLlxuICAgIC8vIERPTlQgdGhpbmtsZXNzbHkgbWltaWMgcHVyZSBWaW0uIEluc3RlYWQsIHByb3ZpZGUgaWdub3JlY2FzZSBidXR0b24gYW5kIHNob3J0Y3V0LlxuICAgIGlmICh0ZXJtLmluZGV4T2YoJ1xcXFxjJykgPj0gMCkge1xuICAgICAgdGVybSA9IHRlcm0ucmVwbGFjZSgnXFxcXGMnLCAnJylcbiAgICAgIGlmICghbW9kaWZpZXJzLmluY2x1ZGVzKCdpJykpIG1vZGlmaWVycyArPSAnaSdcbiAgICB9XG5cbiAgICBpZiAodGhpcy51c2VSZWdleHApIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVnRXhwKHRlcm0sIG1vZGlmaWVycylcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7fVxuICAgIH1cbiAgICByZXR1cm4gbmV3IFJlZ0V4cCh0aGlzLl8uZXNjYXBlUmVnRXhwKHRlcm0pLCBtb2RpZmllcnMpXG4gIH1cbn1cblxuY2xhc3MgU2VhcmNoQmFja3dhcmRzIGV4dGVuZHMgU2VhcmNoIHtcbiAgYmFja3dhcmRzID0gdHJ1ZVxufVxuXG4vLyAqLCAjXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBTZWFyY2hDdXJyZW50V29yZCBleHRlbmRzIFNlYXJjaEJhc2Uge1xuICBjYXNlU2Vuc2l0aXZpdHlLaW5kID0gJ1NlYXJjaEN1cnJlbnRXb3JkJ1xuXG4gIG1vdmVDdXJzb3IgKGN1cnNvcikge1xuICAgIGlmICh0aGlzLmlucHV0ID09IG51bGwpIHtcbiAgICAgIGNvbnN0IHdvcmRSYW5nZSA9IHRoaXMuZ2V0Q3VycmVudFdvcmRCdWZmZXJSYW5nZSgpXG4gICAgICBpZiAod29yZFJhbmdlKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKHdvcmRSYW5nZS5zdGFydClcbiAgICAgICAgdGhpcy5pbnB1dCA9IHRoaXMuZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHdvcmRSYW5nZSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaW5wdXQgPSAnJ1xuICAgICAgfVxuICAgIH1cblxuICAgIHN1cGVyLm1vdmVDdXJzb3IoY3Vyc29yKVxuICB9XG5cbiAgZ2V0UGF0dGVybiAodGVybSkge1xuICAgIGNvbnN0IGVzY2FwZWQgPSB0aGlzLl8uZXNjYXBlUmVnRXhwKHRlcm0pXG4gICAgY29uc3Qgc291cmNlID0gL1xcVy8udGVzdCh0ZXJtKSA/IGAke2VzY2FwZWR9XFxcXGJgIDogYFxcXFxiJHtlc2NhcGVkfVxcXFxiYFxuICAgIHJldHVybiBuZXcgUmVnRXhwKHNvdXJjZSwgdGhpcy5pc0Nhc2VTZW5zaXRpdmUodGVybSkgPyAnZycgOiAnZ2knKVxuICB9XG5cbiAgZ2V0Q3VycmVudFdvcmRCdWZmZXJSYW5nZSAoKSB7XG4gICAgY29uc3QgY3Vyc29yID0gdGhpcy5lZGl0b3IuZ2V0TGFzdEN1cnNvcigpXG4gICAgY29uc3QgcG9pbnQgPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuXG4gICAgY29uc3Qgbm9uV29yZENoYXJhY3RlcnMgPSB0aGlzLnV0aWxzLmdldE5vbldvcmRDaGFyYWN0ZXJzRm9yQ3Vyc29yKGN1cnNvcilcbiAgICBjb25zdCByZWdleCA9IG5ldyBSZWdFeHAoYFteXFxcXHMke3RoaXMuXy5lc2NhcGVSZWdFeHAobm9uV29yZENoYXJhY3RlcnMpfV0rYCwgJ2cnKVxuICAgIGNvbnN0IG9wdGlvbnMgPSB7ZnJvbTogW3BvaW50LnJvdywgMF0sIGFsbG93TmV4dExpbmU6IGZhbHNlfVxuICAgIHJldHVybiB0aGlzLmZpbmRJbkVkaXRvcignZm9yd2FyZCcsIHJlZ2V4LCBvcHRpb25zLCAoe3JhbmdlfSkgPT4gcmFuZ2UuZW5kLmlzR3JlYXRlclRoYW4ocG9pbnQpICYmIHJhbmdlKVxuICB9XG59XG5cbmNsYXNzIFNlYXJjaEN1cnJlbnRXb3JkQmFja3dhcmRzIGV4dGVuZHMgU2VhcmNoQ3VycmVudFdvcmQge1xuICBiYWNrd2FyZHMgPSB0cnVlXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBTZWFyY2hCYXNlLFxuICBTZWFyY2gsXG4gIFNlYXJjaEJhY2t3YXJkcyxcbiAgU2VhcmNoQ3VycmVudFdvcmQsXG4gIFNlYXJjaEN1cnJlbnRXb3JkQmFja3dhcmRzXG59XG4iXX0=