'use babel';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('atom');

var Range = _require.Range;
var CompositeDisposable = _require.CompositeDisposable;

var _require2 = require('./operator');

var Operator = _require2.Operator;

// Operator which start 'insert-mode'
// -------------------------
// [NOTE]
// Rule: Don't make any text mutation before calling `@selectTarget()`.

var ActivateInsertModeBase = (function (_Operator) {
  _inherits(ActivateInsertModeBase, _Operator);

  function ActivateInsertModeBase() {
    _classCallCheck(this, ActivateInsertModeBase);

    _get(Object.getPrototypeOf(ActivateInsertModeBase.prototype), 'constructor', this).apply(this, arguments);

    this.flashTarget = false;
    this.supportInsertionCount = true;
  }

  _createClass(ActivateInsertModeBase, [{
    key: 'getChangeSinceCheckpoint',

    // When each mutaion's extent is not intersecting, muitiple changes are recorded
    // e.g
    //  - Multicursors edit
    //  - Cursor moved in insert-mode(e.g ctrl-f, ctrl-b)
    // But I don't care multiple changes just because I'm lazy(so not perfect implementation).
    // I only take care of one change happened at earliest(topCursor's change) position.
    // Thats' why I save topCursor's position to @topCursorPositionAtInsertionStart to compare traversal to deletionStart
    // Why I use topCursor's change? Just because it's easy to use first change returned by getChangeSinceCheckpoint().
    value: function getChangeSinceCheckpoint(purpose) {
      var checkpoint = this.getBufferCheckpoint(purpose);
      return this.editor.buffer.getChangesSinceCheckpoint(checkpoint)[0];
    }

    // [BUG-BUT-OK] Replaying text-deletion-operation is not compatible to pure Vim.
    // Pure Vim record all operation in insert-mode as keystroke level and can distinguish
    // character deleted by `Delete` or by `ctrl-u`.
    // But I can not and don't trying to minic this level of compatibility.
    // So basically deletion-done-in-one is expected to work well.
  }, {
    key: 'replayLastChange',
    value: function replayLastChange(selection) {
      var textToInsert = undefined;
      if (this.lastChange != null) {
        var _lastChange = this.lastChange;
        var start = _lastChange.start;
        var oldExtent = _lastChange.oldExtent;
        var newText = _lastChange.newText;

        if (!oldExtent.isZero()) {
          var traversalToStartOfDelete = start.traversalFrom(this.topCursorPositionAtInsertionStart);
          var deletionStart = selection.cursor.getBufferPosition().traverse(traversalToStartOfDelete);
          var deletionEnd = deletionStart.traverse(oldExtent);
          selection.setBufferRange([deletionStart, deletionEnd]);
        }
        textToInsert = newText;
      } else {
        textToInsert = '';
      }
      selection.insertText(textToInsert, { autoIndent: true });
    }

    // called when repeated
    // [FIXME] to use replayLastChange in repeatInsert overriding subclasss.
  }, {
    key: 'repeatInsert',
    value: function repeatInsert(selection, text) {
      this.replayLastChange(selection);
    }
  }, {
    key: 'disposeReplaceMode',
    value: function disposeReplaceMode() {
      if (this.vimState.replaceModeDisposable) {
        this.vimState.replaceModeDisposable.dispose();
        this.vimState.replaceModeDisposable = null;
      }
    }
  }, {
    key: 'initialize',
    value: function initialize() {
      this.disposeReplaceMode();
      _get(Object.getPrototypeOf(ActivateInsertModeBase.prototype), 'initialize', this).call(this);
    }
  }, {
    key: 'execute',
    value: function execute() {
      if (this.repeated) this.flashTarget = this.trackChange = true;

      this.preSelect();

      if (this.selectTarget() || this.target.wise !== 'linewise') {
        if (this.mutateText) this.mutateText();

        if (this.repeated) {
          for (var selection of this.editor.getSelections()) {
            var textToInsert = this.lastChange && this.lastChange.newText || '';
            this.repeatInsert(selection, textToInsert);
            this.utils.moveCursorLeft(selection.cursor);
          }
          this.mutationManager.setCheckpoint('did-finish');
          this.groupChangesSinceBufferCheckpoint('undo');
          this.emitDidFinishMutation();
          if (this.getConfig('clearMultipleCursorsOnEscapeInsertMode')) this.vimState.clearSelections();
        } else {
          if (this.mode !== 'insert') {
            this.initializeInsertMode();
          }

          if (this.name === 'ActivateReplaceMode') {
            this.activateMode('insert', 'replace');
          } else {
            this.activateMode('insert');
          }
        }
      } else {
        this.activateMode('normal');
      }
    }
  }, {
    key: 'initializeInsertMode',
    value: function initializeInsertMode() {
      var _this = this;

      // Avoid freezing by acccidental big count(e.g. `5555555555555i`), See #560, #596
      var insertionCount = this.supportInsertionCount ? this.limitNumber(this.getCount() - 1, { max: 100 }) : 0;

      var textByOperator = '';
      if (insertionCount > 0) {
        var change = this.getChangeSinceCheckpoint('undo');
        textByOperator = change && change.newText || '';
      }

      this.createBufferCheckpoint('insert');
      var topCursor = this.editor.getCursorsOrderedByBufferPosition()[0];
      this.topCursorPositionAtInsertionStart = topCursor.getBufferPosition();

      // Skip normalization of blockwiseSelection.
      // Since want to keep multi-cursor and it's position in when shift to insert-mode.
      for (var blockwiseSelection of this.getBlockwiseSelections()) {
        blockwiseSelection.skipNormalization();
      }

      var insertModeDisposable = this.vimState.preemptWillDeactivateMode(function (_ref) {
        var mode = _ref.mode;

        if (mode !== 'insert') {
          return;
        }
        insertModeDisposable.dispose();
        _this.disposeReplaceMode();

        _this.vimState.mark.set('^', _this.editor.getCursorBufferPosition()); // Last insert-mode position
        var textByUserInput = '';
        var change = _this.getChangeSinceCheckpoint('insert');
        if (change) {
          _this.lastChange = change;
          _this.setMarkForChange(new Range(change.start, change.start.traverse(change.newExtent)));
          textByUserInput = change.newText;
        }
        _this.vimState.register.set('.', { text: textByUserInput }); // Last inserted text

        while (insertionCount) {
          insertionCount--;
          for (var selection of _this.editor.getSelections()) {
            selection.insertText(textByOperator + textByUserInput, { autoIndent: true });
          }
        }

        // This cursor state is restored on undo.
        // So cursor state has to be updated before next groupChangesSinceCheckpoint()
        if (_this.getConfig('clearMultipleCursorsOnEscapeInsertMode')) _this.vimState.clearSelections();

        // grouping changes for undo checkpoint need to come last
        _this.groupChangesSinceBufferCheckpoint('undo');

        var preventIncorrectWrap = _this.editor.hasAtomicSoftTabs();
        for (var cursor of _this.editor.getCursors()) {
          _this.utils.moveCursorLeft(cursor, { preventIncorrectWrap: preventIncorrectWrap });
        }
      });
    }
  }], [{
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return ActivateInsertModeBase;
})(Operator);

var ActivateInsertMode = (function (_ActivateInsertModeBase) {
  _inherits(ActivateInsertMode, _ActivateInsertModeBase);

  function ActivateInsertMode() {
    _classCallCheck(this, ActivateInsertMode);

    _get(Object.getPrototypeOf(ActivateInsertMode.prototype), 'constructor', this).apply(this, arguments);

    this.target = 'Empty';
    this.acceptPresetOccurrence = false;
    this.acceptPersistentSelection = false;
  }

  return ActivateInsertMode;
})(ActivateInsertModeBase);

var ActivateReplaceMode = (function (_ActivateInsertMode) {
  _inherits(ActivateReplaceMode, _ActivateInsertMode);

  function ActivateReplaceMode() {
    _classCallCheck(this, ActivateReplaceMode);

    _get(Object.getPrototypeOf(ActivateReplaceMode.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(ActivateReplaceMode, [{
    key: 'initialize',
    value: function initialize() {
      var _this2 = this;

      _get(Object.getPrototypeOf(ActivateReplaceMode.prototype), 'initialize', this).call(this);

      var replacedCharsBySelection = new WeakMap();
      this.vimState.replaceModeDisposable = new CompositeDisposable(this.editor.onWillInsertText(function (_ref2) {
        var _ref2$text = _ref2.text;
        var text = _ref2$text === undefined ? '' : _ref2$text;
        var cancel = _ref2.cancel;

        cancel();
        for (var selection of _this2.editor.getSelections()) {
          for (var char of text.split('')) {
            if (char !== '\n' && !selection.cursor.isAtEndOfLine()) selection.selectRight();
            if (!replacedCharsBySelection.has(selection)) replacedCharsBySelection.set(selection, []);
            replacedCharsBySelection.get(selection).push(selection.getText());
            selection.insertText(char);
          }
        }
      }), atom.commands.add(this.editorElement, 'core:backspace', function (event) {
        event.stopImmediatePropagation();
        for (var selection of _this2.editor.getSelections()) {
          var chars = replacedCharsBySelection.get(selection);
          if (chars && chars.length) {
            selection.selectLeft();
            if (!selection.insertText(chars.pop()).isEmpty()) selection.cursor.moveLeft();
          }
        }
      }));
    }
  }, {
    key: 'repeatInsert',
    value: function repeatInsert(selection, text) {
      for (var char of text) {
        if (char === '\n') continue;
        if (selection.cursor.isAtEndOfLine()) break;
        selection.selectRight();
      }
      selection.insertText(text, { autoIndent: false });
    }
  }]);

  return ActivateReplaceMode;
})(ActivateInsertMode);

var InsertAfter = (function (_ActivateInsertMode2) {
  _inherits(InsertAfter, _ActivateInsertMode2);

  function InsertAfter() {
    _classCallCheck(this, InsertAfter);

    _get(Object.getPrototypeOf(InsertAfter.prototype), 'constructor', this).apply(this, arguments);
  }

  // key: 'g I' in all mode

  _createClass(InsertAfter, [{
    key: 'execute',
    value: function execute() {
      for (var cursor of this.editor.getCursors()) {
        this.utils.moveCursorRight(cursor);
      }
      _get(Object.getPrototypeOf(InsertAfter.prototype), 'execute', this).call(this);
    }
  }]);

  return InsertAfter;
})(ActivateInsertMode);

var InsertAtBeginningOfLine = (function (_ActivateInsertMode3) {
  _inherits(InsertAtBeginningOfLine, _ActivateInsertMode3);

  function InsertAtBeginningOfLine() {
    _classCallCheck(this, InsertAtBeginningOfLine);

    _get(Object.getPrototypeOf(InsertAtBeginningOfLine.prototype), 'constructor', this).apply(this, arguments);
  }

  // key: normal 'A'

  _createClass(InsertAtBeginningOfLine, [{
    key: 'execute',
    value: function execute() {
      if (this.mode === 'visual' && this.submode !== 'blockwise') {
        this.editor.splitSelectionsIntoLines();
      }
      for (var blockwiseSelection of this.getBlockwiseSelections()) {
        blockwiseSelection.skipNormalization();
      }
      this.editor.moveToBeginningOfLine();
      _get(Object.getPrototypeOf(InsertAtBeginningOfLine.prototype), 'execute', this).call(this);
    }
  }]);

  return InsertAtBeginningOfLine;
})(ActivateInsertMode);

var InsertAfterEndOfLine = (function (_ActivateInsertMode4) {
  _inherits(InsertAfterEndOfLine, _ActivateInsertMode4);

  function InsertAfterEndOfLine() {
    _classCallCheck(this, InsertAfterEndOfLine);

    _get(Object.getPrototypeOf(InsertAfterEndOfLine.prototype), 'constructor', this).apply(this, arguments);
  }

  // key: normal 'I'

  _createClass(InsertAfterEndOfLine, [{
    key: 'execute',
    value: function execute() {
      this.editor.moveToEndOfLine();
      _get(Object.getPrototypeOf(InsertAfterEndOfLine.prototype), 'execute', this).call(this);
    }
  }]);

  return InsertAfterEndOfLine;
})(ActivateInsertMode);

var InsertAtFirstCharacterOfLine = (function (_ActivateInsertMode5) {
  _inherits(InsertAtFirstCharacterOfLine, _ActivateInsertMode5);

  function InsertAtFirstCharacterOfLine() {
    _classCallCheck(this, InsertAtFirstCharacterOfLine);

    _get(Object.getPrototypeOf(InsertAtFirstCharacterOfLine.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(InsertAtFirstCharacterOfLine, [{
    key: 'execute',
    value: function execute() {
      for (var cursor of this.editor.getCursors()) {
        this.utils.moveCursorToFirstCharacterAtRow(cursor, cursor.getBufferRow());
      }
      _get(Object.getPrototypeOf(InsertAtFirstCharacterOfLine.prototype), 'execute', this).call(this);
    }
  }]);

  return InsertAtFirstCharacterOfLine;
})(ActivateInsertMode);

var InsertAtLastInsert = (function (_ActivateInsertMode6) {
  _inherits(InsertAtLastInsert, _ActivateInsertMode6);

  function InsertAtLastInsert() {
    _classCallCheck(this, InsertAtLastInsert);

    _get(Object.getPrototypeOf(InsertAtLastInsert.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(InsertAtLastInsert, [{
    key: 'execute',
    value: function execute() {
      var point = this.vimState.mark.get('^');
      if (point) {
        this.editor.setCursorBufferPosition(point);
        this.editor.scrollToCursorPosition({ center: true });
      }
      _get(Object.getPrototypeOf(InsertAtLastInsert.prototype), 'execute', this).call(this);
    }
  }]);

  return InsertAtLastInsert;
})(ActivateInsertMode);

var InsertAboveWithNewline = (function (_ActivateInsertMode7) {
  _inherits(InsertAboveWithNewline, _ActivateInsertMode7);

  function InsertAboveWithNewline() {
    _classCallCheck(this, InsertAboveWithNewline);

    _get(Object.getPrototypeOf(InsertAboveWithNewline.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(InsertAboveWithNewline, [{
    key: 'initialize',
    value: function initialize() {
      this.originalCursorPositionMarker = this.editor.markBufferPosition(this.editor.getCursorBufferPosition());
      _get(Object.getPrototypeOf(InsertAboveWithNewline.prototype), 'initialize', this).call(this);
    }

    // This is for `o` and `O` operator.
    // On undo/redo put cursor at original point where user type `o` or `O`.
  }, {
    key: 'groupChangesSinceBufferCheckpoint',
    value: function groupChangesSinceBufferCheckpoint(purpose) {
      if (this.repeated) {
        _get(Object.getPrototypeOf(InsertAboveWithNewline.prototype), 'groupChangesSinceBufferCheckpoint', this).call(this, purpose);
        return;
      }

      var lastCursor = this.editor.getLastCursor();
      var cursorPosition = lastCursor.getBufferPosition();
      lastCursor.setBufferPosition(this.originalCursorPositionMarker.getHeadBufferPosition());
      this.originalCursorPositionMarker.destroy();
      this.originalCursorPositionMarker = null;

      if (this.getConfig('groupChangesWhenLeavingInsertMode')) {
        _get(Object.getPrototypeOf(InsertAboveWithNewline.prototype), 'groupChangesSinceBufferCheckpoint', this).call(this, purpose);
      }
      lastCursor.setBufferPosition(cursorPosition);
    }
  }, {
    key: 'autoIndentEmptyRows',
    value: function autoIndentEmptyRows() {
      for (var cursor of this.editor.getCursors()) {
        var row = cursor.getBufferRow();
        if (this.isEmptyRow(row)) this.editor.autoIndentBufferRow(row);
      }
    }
  }, {
    key: 'mutateText',
    value: function mutateText() {
      this.editor.insertNewlineAbove();
      if (this.editor.autoIndent) this.autoIndentEmptyRows();
    }
  }, {
    key: 'repeatInsert',
    value: function repeatInsert(selection, text) {
      selection.insertText(text.trimLeft(), { autoIndent: true });
    }
  }]);

  return InsertAboveWithNewline;
})(ActivateInsertMode);

var InsertBelowWithNewline = (function (_InsertAboveWithNewline) {
  _inherits(InsertBelowWithNewline, _InsertAboveWithNewline);

  function InsertBelowWithNewline() {
    _classCallCheck(this, InsertBelowWithNewline);

    _get(Object.getPrototypeOf(InsertBelowWithNewline.prototype), 'constructor', this).apply(this, arguments);
  }

  // Advanced Insertion
  // -------------------------

  _createClass(InsertBelowWithNewline, [{
    key: 'mutateText',
    value: function mutateText() {
      for (var cursor of this.editor.getCursors()) {
        this.utils.setBufferRow(cursor, this.getFoldEndRowForRow(cursor.getBufferRow()));
      }

      this.editor.insertNewlineBelow();
      if (this.editor.autoIndent) this.autoIndentEmptyRows();
    }
  }]);

  return InsertBelowWithNewline;
})(InsertAboveWithNewline);

var InsertByTarget = (function (_ActivateInsertModeBase2) {
  _inherits(InsertByTarget, _ActivateInsertModeBase2);

  function InsertByTarget() {
    _classCallCheck(this, InsertByTarget);

    _get(Object.getPrototypeOf(InsertByTarget.prototype), 'constructor', this).apply(this, arguments);

    this.which = null;
  }

  // key: 'I', Used in 'visual-mode.characterwise', visual-mode.blockwise

  _createClass(InsertByTarget, [{
    key: 'initialize',
    // one of ['start', 'end', 'head', 'tail']

    value: function initialize() {
      // HACK
      // When g i is mapped to `insert-at-start-of-target`.
      // `g i 3 l` start insert at 3 column right position.
      // In this case, we don't want repeat insertion 3 times.
      // This @getCount() call cache number at the timing BEFORE '3' is specified.
      this.getCount();
      _get(Object.getPrototypeOf(InsertByTarget.prototype), 'initialize', this).call(this);
    }
  }, {
    key: 'execute',
    value: function execute() {
      var _this3 = this;

      this.onDidSelectTarget(function () {
        // In vC/vL, when occurrence marker was NOT selected,
        // it behave's very specially
        // vC: `I` and `A` behaves as shoft hand of `ctrl-v I` and `ctrl-v A`.
        // vL: `I` and `A` place cursors at each selected lines of start( or end ) of non-white-space char.
        if (!_this3.occurrenceSelected && _this3.mode === 'visual' && _this3.submode !== 'blockwise') {
          for (var $selection of _this3.swrap.getSelections(_this3.editor)) {
            $selection.normalize();
            $selection.applyWise('blockwise');
          }

          if (_this3.submode === 'linewise') {
            for (var blockwiseSelection of _this3.getBlockwiseSelections()) {
              blockwiseSelection.expandMemberSelectionsOverLineWithTrimRange();
            }
          }
        }

        for (var $selection of _this3.swrap.getSelections(_this3.editor)) {
          $selection.setBufferPositionTo(_this3.which);
        }
      });
      _get(Object.getPrototypeOf(InsertByTarget.prototype), 'execute', this).call(this);
    }
  }], [{
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return InsertByTarget;
})(ActivateInsertModeBase);

var InsertAtStartOfTarget = (function (_InsertByTarget) {
  _inherits(InsertAtStartOfTarget, _InsertByTarget);

  function InsertAtStartOfTarget() {
    _classCallCheck(this, InsertAtStartOfTarget);

    _get(Object.getPrototypeOf(InsertAtStartOfTarget.prototype), 'constructor', this).apply(this, arguments);

    this.which = 'start';
  }

  // key: 'A', Used in 'visual-mode.characterwise', 'visual-mode.blockwise'
  return InsertAtStartOfTarget;
})(InsertByTarget);

var InsertAtEndOfTarget = (function (_InsertByTarget2) {
  _inherits(InsertAtEndOfTarget, _InsertByTarget2);

  function InsertAtEndOfTarget() {
    _classCallCheck(this, InsertAtEndOfTarget);

    _get(Object.getPrototypeOf(InsertAtEndOfTarget.prototype), 'constructor', this).apply(this, arguments);

    this.which = 'end';
  }

  return InsertAtEndOfTarget;
})(InsertByTarget);

var InsertAtHeadOfTarget = (function (_InsertByTarget3) {
  _inherits(InsertAtHeadOfTarget, _InsertByTarget3);

  function InsertAtHeadOfTarget() {
    _classCallCheck(this, InsertAtHeadOfTarget);

    _get(Object.getPrototypeOf(InsertAtHeadOfTarget.prototype), 'constructor', this).apply(this, arguments);

    this.which = 'head';
  }

  return InsertAtHeadOfTarget;
})(InsertByTarget);

var InsertAtStartOfOccurrence = (function (_InsertAtStartOfTarget) {
  _inherits(InsertAtStartOfOccurrence, _InsertAtStartOfTarget);

  function InsertAtStartOfOccurrence() {
    _classCallCheck(this, InsertAtStartOfOccurrence);

    _get(Object.getPrototypeOf(InsertAtStartOfOccurrence.prototype), 'constructor', this).apply(this, arguments);

    this.occurrence = true;
  }

  return InsertAtStartOfOccurrence;
})(InsertAtStartOfTarget);

var InsertAtEndOfOccurrence = (function (_InsertAtEndOfTarget) {
  _inherits(InsertAtEndOfOccurrence, _InsertAtEndOfTarget);

  function InsertAtEndOfOccurrence() {
    _classCallCheck(this, InsertAtEndOfOccurrence);

    _get(Object.getPrototypeOf(InsertAtEndOfOccurrence.prototype), 'constructor', this).apply(this, arguments);

    this.occurrence = true;
  }

  return InsertAtEndOfOccurrence;
})(InsertAtEndOfTarget);

var InsertAtHeadOfOccurrence = (function (_InsertAtHeadOfTarget) {
  _inherits(InsertAtHeadOfOccurrence, _InsertAtHeadOfTarget);

  function InsertAtHeadOfOccurrence() {
    _classCallCheck(this, InsertAtHeadOfOccurrence);

    _get(Object.getPrototypeOf(InsertAtHeadOfOccurrence.prototype), 'constructor', this).apply(this, arguments);

    this.occurrence = true;
  }

  return InsertAtHeadOfOccurrence;
})(InsertAtHeadOfTarget);

var InsertAtStartOfSubwordOccurrence = (function (_InsertAtStartOfOccurrence) {
  _inherits(InsertAtStartOfSubwordOccurrence, _InsertAtStartOfOccurrence);

  function InsertAtStartOfSubwordOccurrence() {
    _classCallCheck(this, InsertAtStartOfSubwordOccurrence);

    _get(Object.getPrototypeOf(InsertAtStartOfSubwordOccurrence.prototype), 'constructor', this).apply(this, arguments);

    this.occurrenceType = 'subword';
  }

  return InsertAtStartOfSubwordOccurrence;
})(InsertAtStartOfOccurrence);

var InsertAtEndOfSubwordOccurrence = (function (_InsertAtEndOfOccurrence) {
  _inherits(InsertAtEndOfSubwordOccurrence, _InsertAtEndOfOccurrence);

  function InsertAtEndOfSubwordOccurrence() {
    _classCallCheck(this, InsertAtEndOfSubwordOccurrence);

    _get(Object.getPrototypeOf(InsertAtEndOfSubwordOccurrence.prototype), 'constructor', this).apply(this, arguments);

    this.occurrenceType = 'subword';
  }

  return InsertAtEndOfSubwordOccurrence;
})(InsertAtEndOfOccurrence);

var InsertAtHeadOfSubwordOccurrence = (function (_InsertAtHeadOfOccurrence) {
  _inherits(InsertAtHeadOfSubwordOccurrence, _InsertAtHeadOfOccurrence);

  function InsertAtHeadOfSubwordOccurrence() {
    _classCallCheck(this, InsertAtHeadOfSubwordOccurrence);

    _get(Object.getPrototypeOf(InsertAtHeadOfSubwordOccurrence.prototype), 'constructor', this).apply(this, arguments);

    this.occurrenceType = 'subword';
  }

  return InsertAtHeadOfSubwordOccurrence;
})(InsertAtHeadOfOccurrence);

var InsertAtStartOfSmartWord = (function (_InsertByTarget4) {
  _inherits(InsertAtStartOfSmartWord, _InsertByTarget4);

  function InsertAtStartOfSmartWord() {
    _classCallCheck(this, InsertAtStartOfSmartWord);

    _get(Object.getPrototypeOf(InsertAtStartOfSmartWord.prototype), 'constructor', this).apply(this, arguments);

    this.which = 'start';
    this.target = 'MoveToPreviousSmartWord';
  }

  return InsertAtStartOfSmartWord;
})(InsertByTarget);

var InsertAtEndOfSmartWord = (function (_InsertByTarget5) {
  _inherits(InsertAtEndOfSmartWord, _InsertByTarget5);

  function InsertAtEndOfSmartWord() {
    _classCallCheck(this, InsertAtEndOfSmartWord);

    _get(Object.getPrototypeOf(InsertAtEndOfSmartWord.prototype), 'constructor', this).apply(this, arguments);

    this.which = 'end';
    this.target = 'MoveToEndOfSmartWord';
  }

  return InsertAtEndOfSmartWord;
})(InsertByTarget);

var InsertAtPreviousFoldStart = (function (_InsertByTarget6) {
  _inherits(InsertAtPreviousFoldStart, _InsertByTarget6);

  function InsertAtPreviousFoldStart() {
    _classCallCheck(this, InsertAtPreviousFoldStart);

    _get(Object.getPrototypeOf(InsertAtPreviousFoldStart.prototype), 'constructor', this).apply(this, arguments);

    this.which = 'start';
    this.target = 'MoveToPreviousFoldStart';
  }

  return InsertAtPreviousFoldStart;
})(InsertByTarget);

var InsertAtNextFoldStart = (function (_InsertByTarget7) {
  _inherits(InsertAtNextFoldStart, _InsertByTarget7);

  function InsertAtNextFoldStart() {
    _classCallCheck(this, InsertAtNextFoldStart);

    _get(Object.getPrototypeOf(InsertAtNextFoldStart.prototype), 'constructor', this).apply(this, arguments);

    this.which = 'end';
    this.target = 'MoveToNextFoldStart';
  }

  // -------------------------
  return InsertAtNextFoldStart;
})(InsertByTarget);

var Change = (function (_ActivateInsertModeBase3) {
  _inherits(Change, _ActivateInsertModeBase3);

  function Change() {
    _classCallCheck(this, Change);

    _get(Object.getPrototypeOf(Change.prototype), 'constructor', this).apply(this, arguments);

    this.trackChange = true;
    this.supportInsertionCount = false;
  }

  _createClass(Change, [{
    key: 'mutateText',
    value: function mutateText() {
      // Allways dynamically determine selection wise wthout consulting target.wise
      // Reason: when `c i {`, wise is 'characterwise', but actually selected range is 'linewise'
      //   {
      //     a
      //   }
      var isLinewiseTarget = this.swrap.detectWise(this.editor) === 'linewise';
      for (var selection of this.editor.getSelections()) {
        if (!this.getConfig('dontUpdateRegisterOnChangeOrSubstitute')) {
          this.setTextToRegister(selection.getText(), selection);
        }
        if (isLinewiseTarget) {
          selection.insertText('\n', { autoIndent: true });
          // selection.insertText("", {autoIndent: true})
          selection.cursor.moveLeft();
        } else {
          selection.insertText('', { autoIndent: true });
        }
      }
    }
  }]);

  return Change;
})(ActivateInsertModeBase);

var ChangeOccurrence = (function (_Change) {
  _inherits(ChangeOccurrence, _Change);

  function ChangeOccurrence() {
    _classCallCheck(this, ChangeOccurrence);

    _get(Object.getPrototypeOf(ChangeOccurrence.prototype), 'constructor', this).apply(this, arguments);

    this.occurrence = true;
  }

  return ChangeOccurrence;
})(Change);

var ChangeSubwordOccurrence = (function (_ChangeOccurrence) {
  _inherits(ChangeSubwordOccurrence, _ChangeOccurrence);

  function ChangeSubwordOccurrence() {
    _classCallCheck(this, ChangeSubwordOccurrence);

    _get(Object.getPrototypeOf(ChangeSubwordOccurrence.prototype), 'constructor', this).apply(this, arguments);

    this.occurrenceType = 'subword';
  }

  return ChangeSubwordOccurrence;
})(ChangeOccurrence);

var Substitute = (function (_Change2) {
  _inherits(Substitute, _Change2);

  function Substitute() {
    _classCallCheck(this, Substitute);

    _get(Object.getPrototypeOf(Substitute.prototype), 'constructor', this).apply(this, arguments);

    this.target = 'MoveRight';
  }

  return Substitute;
})(Change);

var SubstituteLine = (function (_Change3) {
  _inherits(SubstituteLine, _Change3);

  function SubstituteLine() {
    _classCallCheck(this, SubstituteLine);

    _get(Object.getPrototypeOf(SubstituteLine.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'linewise';
    this.target = 'MoveToRelativeLine';
  }

  // alias
  return SubstituteLine;
})(Change);

var ChangeLine = (function (_SubstituteLine) {
  _inherits(ChangeLine, _SubstituteLine);

  function ChangeLine() {
    _classCallCheck(this, ChangeLine);

    _get(Object.getPrototypeOf(ChangeLine.prototype), 'constructor', this).apply(this, arguments);
  }

  return ChangeLine;
})(SubstituteLine);

var ChangeToLastCharacterOfLine = (function (_Change4) {
  _inherits(ChangeToLastCharacterOfLine, _Change4);

  function ChangeToLastCharacterOfLine() {
    _classCallCheck(this, ChangeToLastCharacterOfLine);

    _get(Object.getPrototypeOf(ChangeToLastCharacterOfLine.prototype), 'constructor', this).apply(this, arguments);

    this.target = 'MoveToLastCharacterOfLine';
  }

  _createClass(ChangeToLastCharacterOfLine, [{
    key: 'execute',
    value: function execute() {
      var _this4 = this;

      this.onDidSelectTarget(function () {
        if (_this4.target.wise === 'blockwise') {
          for (var blockwiseSelection of _this4.getBlockwiseSelections()) {
            blockwiseSelection.extendMemberSelectionsToEndOfLine();
          }
        }
      });
      _get(Object.getPrototypeOf(ChangeToLastCharacterOfLine.prototype), 'execute', this).call(this);
    }
  }]);

  return ChangeToLastCharacterOfLine;
})(Change);

module.exports = {
  ActivateInsertModeBase: ActivateInsertModeBase,
  ActivateInsertMode: ActivateInsertMode,
  ActivateReplaceMode: ActivateReplaceMode,
  InsertAfter: InsertAfter,
  InsertAtBeginningOfLine: InsertAtBeginningOfLine,
  InsertAfterEndOfLine: InsertAfterEndOfLine,
  InsertAtFirstCharacterOfLine: InsertAtFirstCharacterOfLine,
  InsertAtLastInsert: InsertAtLastInsert,
  InsertAboveWithNewline: InsertAboveWithNewline,
  InsertBelowWithNewline: InsertBelowWithNewline,
  InsertByTarget: InsertByTarget,
  InsertAtStartOfTarget: InsertAtStartOfTarget,
  InsertAtEndOfTarget: InsertAtEndOfTarget,
  InsertAtHeadOfTarget: InsertAtHeadOfTarget,
  InsertAtStartOfOccurrence: InsertAtStartOfOccurrence,
  InsertAtEndOfOccurrence: InsertAtEndOfOccurrence,
  InsertAtHeadOfOccurrence: InsertAtHeadOfOccurrence,
  InsertAtStartOfSubwordOccurrence: InsertAtStartOfSubwordOccurrence,
  InsertAtEndOfSubwordOccurrence: InsertAtEndOfSubwordOccurrence,
  InsertAtHeadOfSubwordOccurrence: InsertAtHeadOfSubwordOccurrence,
  InsertAtStartOfSmartWord: InsertAtStartOfSmartWord,
  InsertAtEndOfSmartWord: InsertAtEndOfSmartWord,
  InsertAtPreviousFoldStart: InsertAtPreviousFoldStart,
  InsertAtNextFoldStart: InsertAtNextFoldStart,
  Change: Change,
  ChangeOccurrence: ChangeOccurrence,
  ChangeSubwordOccurrence: ChangeSubwordOccurrence,
  Substitute: Substitute,
  SubstituteLine: SubstituteLine,
  ChangeLine: ChangeLine,
  ChangeToLastCharacterOfLine: ChangeToLastCharacterOfLine
};
// [FIXME] to re-override target.wise in visual-mode
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3l1YW5zaGVuLy5hdG9tL3BhY2thZ2VzL3ZpbS1tb2RlLXBsdXMvbGliL29wZXJhdG9yLWluc2VydC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUE7Ozs7Ozs7Ozs7ZUFFMEIsT0FBTyxDQUFDLE1BQU0sQ0FBQzs7SUFBN0MsS0FBSyxZQUFMLEtBQUs7SUFBRSxtQkFBbUIsWUFBbkIsbUJBQW1COztnQkFDZCxPQUFPLENBQUMsWUFBWSxDQUFDOztJQUFqQyxRQUFRLGFBQVIsUUFBUTs7Ozs7OztJQU1ULHNCQUFzQjtZQUF0QixzQkFBc0I7O1dBQXRCLHNCQUFzQjswQkFBdEIsc0JBQXNCOzsrQkFBdEIsc0JBQXNCOztTQUUxQixXQUFXLEdBQUcsS0FBSztTQUNuQixxQkFBcUIsR0FBRyxJQUFJOzs7ZUFIeEIsc0JBQXNCOzs7Ozs7Ozs7OztXQWFELGtDQUFDLE9BQU8sRUFBRTtBQUNqQyxVQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUE7QUFDcEQsYUFBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUNuRTs7Ozs7Ozs7O1dBT2dCLDBCQUFDLFNBQVMsRUFBRTtBQUMzQixVQUFJLFlBQVksWUFBQSxDQUFBO0FBQ2hCLFVBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJLEVBQUU7MEJBQ1MsSUFBSSxDQUFDLFVBQVU7WUFBNUMsS0FBSyxlQUFMLEtBQUs7WUFBRSxTQUFTLGVBQVQsU0FBUztZQUFFLE9BQU8sZUFBUCxPQUFPOztBQUNoQyxZQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxFQUFFO0FBQ3ZCLGNBQU0sd0JBQXdCLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsaUNBQWlDLENBQUMsQ0FBQTtBQUM1RixjQUFNLGFBQWEsR0FBRyxTQUFTLENBQUMsTUFB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QUFrQixFQUFsQixrQkFBa0I7QUFDbEIscUJBQW1CLEVBQW5CLG1CQUFtQjtBQUNuQixhQUFXLEVBQVgsV0FBVztBQUNYLHlCQUF1QixFQUF2Qix1QkFBdUI7QUFDdkIsc0JBQW9CLEVBQXBCLG9CQUFvQjtBQUNwQiw4QkFBNEIsRUFBNUIsNEJBQTRCO0FBQzVCLG9CQUFrQixFQUFsQixrQkFBa0I7QUFDbEIsd0JBQXNCLEVBQXRCLHNCQUFzQjtBQUN0Qix3QkFBc0IsRUFBdEIsc0JBQXNCO0FBQ3RCLGdCQUFjLEVBQWQsY0FBYztBQUNkLHVCQUFxQixFQUFyQixxQkFBcUI7QUFDckIscUJBQW1CLEVBQW5CLG1CQUFtQjtBQUNuQixzQkFBb0IsRUFBcEIsb0JBQW9CO0FBQ3BCLDJCQUF5QixFQUF6Qix5QkFBeUI7QUFDekIseUJBQXVCLEVBQXZCLHVCQUF1QjtBQUN2QiwwQkFBd0IsRUFBeEIsd0JBQXdCO0FBQ3hCLGtDQUFnQyxFQUFoQyxnQ0FBZ0M7QUFDaEMsZ0NBQThCLEVBQTlCLDhCQUE4QjtBQUM5QixpQ0FBK0IsRUFBL0IsK0JBQStCO0FBQy9CLDBCQUF3QixFQUF4Qix3QkFBd0I7QUFDeEIsd0JBQXNCLEVBQXRCLHNCQUFzQjtBQUN0QiwyQkFBeUIsRUFBekIseUJBQXlCO0FBQ3pCLHVCQUFxQixFQUFyQixxQkFBcUI7QUFDckIsUUFBTSxFQUFOLE1BQU07QUFDTixrQkFBZ0IsRUFBaEIsZ0JBQWdCO0FBQ2hCLHlCQUF1QixFQUF2Qix1QkFBdUI7QUFDdkIsWUFBVSxFQUFWLFVBQVU7QUFDVixnQkFBYyxFQUFkLGNBQWM7QUFDZCxZQUFVLEVBQVYsVUFBVTtBQUNWLDZCQUEyQixFQUEzQiwyQkFBMkI7Q0FDNUIsQ0FBQSIsImZpbGUiOiIvaG9tZS95dWFuc2hlbi8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9vcGVyYXRvci1pbnNlcnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJ1xuXG5jb25zdCB7UmFuZ2UsIENvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSgnYXRvbScpXG5jb25zdCB7T3BlcmF0b3J9ID0gcmVxdWlyZSgnLi9vcGVyYXRvcicpXG5cbi8vIE9wZXJhdG9yIHdoaWNoIHN0YXJ0ICdpbnNlcnQtbW9kZSdcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFtOT1RFXVxuLy8gUnVsZTogRG9uJ3QgbWFrZSBhbnkgdGV4dCBtdXRhdGlvbiBiZWZvcmUgY2FsbGluZyBgQHNlbGVjdFRhcmdldCgpYC5cbmNsYXNzIEFjdGl2YXRlSW5zZXJ0TW9kZUJhc2UgZXh0ZW5kcyBPcGVyYXRvciB7XG4gIHN0YXRpYyBjb21tYW5kID0gZmFsc2VcbiAgZmxhc2hUYXJnZXQgPSBmYWxzZVxuICBzdXBwb3J0SW5zZXJ0aW9uQ291bnQgPSB0cnVlXG5cbiAgLy8gV2hlbiBlYWNoIG11dGFpb24ncyBleHRlbnQgaXMgbm90IGludGVyc2VjdGluZywgbXVpdGlwbGUgY2hhbmdlcyBhcmUgcmVjb3JkZWRcbiAgLy8gZS5nXG4gIC8vICAtIE11bHRpY3Vyc29ycyBlZGl0XG4gIC8vICAtIEN1cnNvciBtb3ZlZCBpbiBpbnNlcnQtbW9kZShlLmcgY3RybC1mLCBjdHJsLWIpXG4gIC8vIEJ1dCBJIGRvbid0IGNhcmUgbXVsdGlwbGUgY2hhbmdlcyBqdXN0IGJlY2F1c2UgSSdtIGxhenkoc28gbm90IHBlcmZlY3QgaW1wbGVtZW50YXRpb24pLlxuICAvLyBJIG9ubHkgdGFrZSBjYXJlIG9mIG9uZSBjaGFuZ2UgaGFwcGVuZWQgYXQgZWFybGllc3QodG9wQ3Vyc29yJ3MgY2hhbmdlKSBwb3NpdGlvbi5cbiAgLy8gVGhhdHMnIHdoeSBJIHNhdmUgdG9wQ3Vyc29yJ3MgcG9zaXRpb24gdG8gQHRvcEN1cnNvclBvc2l0aW9uQXRJbnNlcnRpb25TdGFydCB0byBjb21wYXJlIHRyYXZlcnNhbCB0byBkZWxldGlvblN0YXJ0XG4gIC8vIFdoeSBJIHVzZSB0b3BDdXJzb3IncyBjaGFuZ2U/IEp1c3QgYmVjYXVzZSBpdCdzIGVhc3kgdG8gdXNlIGZpcnN0IGNoYW5nZSByZXR1cm5lZCBieSBnZXRDaGFuZ2VTaW5jZUNoZWNrcG9pbnQoKS5cbiAgZ2V0Q2hhbmdlU2luY2VDaGVja3BvaW50IChwdXJwb3NlKSB7XG4gICAgY29uc3QgY2hlY2twb2ludCA9IHRoaXMuZ2V0QnVmZmVyQ2hlY2twb2ludChwdXJwb3NlKVxuICAgIHJldHVybiB0aGlzLmVkaXRvci5idWZmZXIuZ2V0Q2hhbmdlc1NpbmNlQ2hlY2twb2ludChjaGVja3BvaW50KVswXVxuICB9XG5cbiAgLy8gW0JVRy1CVVQtT0tdIFJlcGxheWluZyB0ZXh0LWRlbGV0aW9uLW9wZXJhdGlvbiBpcyBub3QgY29tcGF0aWJsZSB0byBwdXJlIFZpbS5cbiAgLy8gUHVyZSBWaW0gcmVjb3JkIGFsbCBvcGVyYXRpb24gaW4gaW5zZXJ0LW1vZGUgYXMga2V5c3Ryb2tlIGxldmVsIGFuZCBjYW4gZGlzdGluZ3Vpc2hcbiAgLy8gY2hhcmFjdGVyIGRlbGV0ZWQgYnkgYERlbGV0ZWAgb3IgYnkgYGN0cmwtdWAuXG4gIC8vIEJ1dCBJIGNhbiBub3QgYW5kIGRvbid0IHRyeWluZyB0byBtaW5pYyB0aGlzIGxldmVsIG9mIGNvbXBhdGliaWxpdHkuXG4gIC8vIFNvIGJhc2ljYWxseSBkZWxldGlvbi1kb25lLWluLW9uZSBpcyBleHBlY3RlZCB0byB3b3JrIHdlbGwuXG4gIHJlcGxheUxhc3RDaGFuZ2UgKHNlbGVjdGlvbikge1xuICAgIGxldCB0ZXh0VG9JbnNlcnRcbiAgICBpZiAodGhpcy5sYXN0Q2hhbmdlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHtzdGFydCwgb2xkRXh0ZW50LCBuZXdUZXh0fSA9IHRoaXMubGFzdENoYW5nZVxuICAgICAgaWYgKCFvbGRFeHRlbnQuaXNaZXJvKCkpIHtcbiAgICAgICAgY29uc3QgdHJhdmVyc2FsVG9TdGFydE9mRGVsZXRlID0gc3RhcnQudHJhdmVyc2FsRnJvbSh0aGlzLnRvcEN1cnNvclBvc2l0aW9uQXRJbnNlcnRpb25TdGFydClcbiAgICAgICAgY29uc3QgZGVsZXRpb25TdGFydCA9IHNlbGVjdGlvbi5jdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKS50cmF2ZXJzZSh0cmF2ZXJzYWxUb1N0YXJ0T2ZEZWxldGUpXG4gICAgICAgIGNvbnN0IGRlbGV0aW9uRW5kID0gZGVsZXRpb25TdGFydC50cmF2ZXJzZShvbGRFeHRlbnQpXG4gICAgICAgIHNlbGVjdGlvbi5zZXRCdWZmZXJSYW5nZShbZGVsZXRpb25TdGFydCwgZGVsZXRpb25FbmRdKVxuICAgICAgfVxuICAgICAgdGV4dFRvSW5zZXJ0ID0gbmV3VGV4dFxuICAgIH0gZWxzZSB7XG4gICAgICB0ZXh0VG9JbnNlcnQgPSAnJ1xuICAgIH1cbiAgICBzZWxlY3Rpb24uaW5zZXJ0VGV4dCh0ZXh0VG9JbnNlcnQsIHthdXRvSW5kZW50OiB0cnVlfSlcbiAgfVxuXG4gIC8vIGNhbGxlZCB3aGVuIHJlcGVhdGVkXG4gIC8vIFtGSVhNRV0gdG8gdXNlIHJlcGxheUxhc3RDaGFuZ2UgaW4gcmVwZWF0SW5zZXJ0IG92ZXJyaWRpbmcgc3ViY2xhc3NzLlxuICByZXBlYXRJbnNlcnQgKHNlbGVjdGlvbiwgdGV4dCkge1xuICAgIHRoaXMucmVwbGF5TGFzdENoYW5nZShzZWxlY3Rpb24pXG4gIH1cblxuICBkaXNwb3NlUmVwbGFjZU1vZGUgKCkge1xuICAgIGlmICh0aGlzLnZpbVN0YXRlLnJlcGxhY2VNb2RlRGlzcG9zYWJsZSkge1xuICAgICAgdGhpcy52aW1TdGF0ZS5yZXBsYWNlTW9kZURpc3Bvc2FibGUuZGlzcG9zZSgpXG4gICAgICB0aGlzLnZpbVN0YXRlLnJlcGxhY2VNb2RlRGlzcG9zYWJsZSA9IG51bGxcbiAgICB9XG4gIH1cblxuICBpbml0aWFsaXplICgpIHtcbiAgICB0aGlzLmRpc3Bvc2VSZXBsYWNlTW9kZSgpXG4gICAgc3VwZXIuaW5pdGlhbGl6ZSgpXG4gIH1cblxuICBleGVjdXRlICgpIHtcbiAgICBpZiAodGhpcy5yZXBlYXRlZCkgdGhpcy5mbGFzaFRhcmdldCA9IHRoaXMudHJhY2tDaGFuZ2UgPSB0cnVlXG5cbiAgICB0aGlzLnByZVNlbGVjdCgpXG5cbiAgICBpZiAodGhpcy5zZWxlY3RUYXJnZXQoKSB8fCB0aGlzLnRhcmdldC53aXNlICE9PSAnbGluZXdpc2UnKSB7XG4gICAgICBpZiAodGhpcy5tdXRhdGVUZXh0KSB0aGlzLm11dGF0ZVRleHQoKVxuXG4gICAgICBpZiAodGhpcy5yZXBlYXRlZCkge1xuICAgICAgICBmb3IgKGNvbnN0IHNlbGVjdGlvbiBvZiB0aGlzLmVkaXRvci5nZXRTZWxlY3Rpb25zKCkpIHtcbiAgICAgICAgICBjb25zdCB0ZXh0VG9JbnNlcnQgPSAodGhpcy5sYXN0Q2hhbmdlICYmIHRoaXMubGFzdENoYW5nZS5uZXdUZXh0KSB8fCAnJ1xuICAgICAgICAgIHRoaXMucmVwZWF0SW5zZXJ0KHNlbGVjdGlvbiwgdGV4dFRvSW5zZXJ0KVxuICAgICAgICAgIHRoaXMudXRpbHMubW92ZUN1cnNvckxlZnQoc2VsZWN0aW9uLmN1cnNvcilcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm11dGF0aW9uTWFuYWdlci5zZXRDaGVja3BvaW50KCdkaWQtZmluaXNoJylcbiAgICAgICAgdGhpcy5ncm91cENoYW5nZXNTaW5jZUJ1ZmZlckNoZWNrcG9pbnQoJ3VuZG8nKVxuICAgICAgICB0aGlzLmVtaXREaWRGaW5pc2hNdXRhdGlvbigpXG4gICAgICAgIGlmICh0aGlzLmdldENvbmZpZygnY2xlYXJNdWx0aXBsZUN1cnNvcnNPbkVzY2FwZUluc2VydE1vZGUnKSkgdGhpcy52aW1TdGF0ZS5jbGVhclNlbGVjdGlvbnMoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMubW9kZSAhPT0gJ2luc2VydCcpIHtcbiAgICAgICAgICB0aGlzLmluaXRpYWxpemVJbnNlcnRNb2RlKClcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm5hbWUgPT09ICdBY3RpdmF0ZVJlcGxhY2VNb2RlJykge1xuICAgICAgICAgIHRoaXMuYWN0aXZhdGVNb2RlKCdpbnNlcnQnLCAncmVwbGFjZScpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5hY3RpdmF0ZU1vZGUoJ2luc2VydCcpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hY3RpdmF0ZU1vZGUoJ25vcm1hbCcpXG4gICAgfVxuICB9XG5cbiAgaW5pdGlhbGl6ZUluc2VydE1vZGUgKCkge1xuICAgIC8vIEF2b2lkIGZyZWV6aW5nIGJ5IGFjY2NpZGVudGFsIGJpZyBjb3VudChlLmcuIGA1NTU1NTU1NTU1NTU1aWApLCBTZWUgIzU2MCwgIzU5NlxuICAgIGxldCBpbnNlcnRpb25Db3VudCA9IHRoaXMuc3VwcG9ydEluc2VydGlvbkNvdW50ID8gdGhpcy5saW1pdE51bWJlcih0aGlzLmdldENvdW50KCkgLSAxLCB7bWF4OiAxMDB9KSA6IDBcblxuICAgIGxldCB0ZXh0QnlPcGVyYXRvciA9ICcnXG4gICAgaWYgKGluc2VydGlvbkNvdW50ID4gMCkge1xuICAgICAgY29uc3QgY2hhbmdlID0gdGhpcy5nZXRDaGFuZ2VTaW5jZUNoZWNrcG9pbnQoJ3VuZG8nKVxuICAgICAgdGV4dEJ5T3BlcmF0b3IgPSAoY2hhbmdlICYmIGNoYW5nZS5uZXdUZXh0KSB8fCAnJ1xuICAgIH1cblxuICAgIHRoaXMuY3JlYXRlQnVmZmVyQ2hlY2twb2ludCgnaW5zZXJ0JylcbiAgICBjb25zdCB0b3BDdXJzb3IgPSB0aGlzLmVkaXRvci5nZXRDdXJzb3JzT3JkZXJlZEJ5QnVmZmVyUG9zaXRpb24oKVswXVxuICAgIHRoaXMudG9wQ3Vyc29yUG9zaXRpb25BdEluc2VydGlvblN0YXJ0ID0gdG9wQ3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcblxuICAgIC8vIFNraXAgbm9ybWFsaXphdGlvbiBvZiBibG9ja3dpc2VTZWxlY3Rpb24uXG4gICAgLy8gU2luY2Ugd2FudCB0byBrZWVwIG11bHRpLWN1cnNvciBhbmQgaXQncyBwb3NpdGlvbiBpbiB3aGVuIHNoaWZ0IHRvIGluc2VydC1tb2RlLlxuICAgIGZvciAoY29uc3QgYmxvY2t3aXNlU2VsZWN0aW9uIG9mIHRoaXMuZ2V0QmxvY2t3aXNlU2VsZWN0aW9ucygpKSB7XG4gICAgICBibG9ja3dpc2VTZWxlY3Rpb24uc2tpcE5vcm1hbGl6YXRpb24oKVxuICAgIH1cblxuICAgIGNvbnN0IGluc2VydE1vZGVEaXNwb3NhYmxlID0gdGhpcy52aW1TdGF0ZS5wcmVlbXB0V2lsbERlYWN0aXZhdGVNb2RlKCh7bW9kZX0pID0+IHtcbiAgICAgIGlmIChtb2RlICE9PSAnaW5zZXJ0Jykge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGluc2VydE1vZGVEaXNwb3NhYmxlLmRpc3Bvc2UoKVxuICAgICAgdGhpcy5kaXNwb3NlUmVwbGFjZU1vZGUoKVxuXG4gICAgICB0aGlzLnZpbVN0YXRlLm1hcmsuc2V0KCdeJywgdGhpcy5lZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSkgLy8gTGFzdCBpbnNlcnQtbW9kZSBwb3NpdGlvblxuICAgICAgbGV0IHRleHRCeVVzZXJJbnB1dCA9ICcnXG4gICAgICBjb25zdCBjaGFuZ2UgPSB0aGlzLmdldENoYW5nZVNpbmNlQ2hlY2twb2ludCgnaW5zZXJ0JylcbiAgICAgIGlmIChjaGFuZ2UpIHtcbiAgICAgICAgdGhpcy5sYXN0Q2hhbmdlID0gY2hhbmdlXG4gICAgICAgIHRoaXMuc2V0TWFya0ZvckNoYW5nZShuZXcgUmFuZ2UoY2hhbmdlLnN0YXJ0LCBjaGFuZ2Uuc3RhcnQudHJhdmVyc2UoY2hhbmdlLm5ld0V4dGVudCkpKVxuICAgICAgICB0ZXh0QnlVc2VySW5wdXQgPSBjaGFuZ2UubmV3VGV4dFxuICAgICAgfVxuICAgICAgdGhpcy52aW1TdGF0ZS5yZWdpc3Rlci5zZXQoJy4nLCB7dGV4dDogdGV4dEJ5VXNlcklucHV0fSkgLy8gTGFzdCBpbnNlcnRlZCB0ZXh0XG5cbiAgICAgIHdoaWxlIChpbnNlcnRpb25Db3VudCkge1xuICAgICAgICBpbnNlcnRpb25Db3VudC0tXG4gICAgICAgIGZvciAoY29uc3Qgc2VsZWN0aW9uIG9mIHRoaXMuZWRpdG9yLmdldFNlbGVjdGlvbnMoKSkge1xuICAgICAgICAgIHNlbGVjdGlvbi5pbnNlcnRUZXh0KHRleHRCeU9wZXJhdG9yICsgdGV4dEJ5VXNlcklucHV0LCB7YXV0b0luZGVudDogdHJ1ZX0pXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gVGhpcyBjdXJzb3Igc3RhdGUgaXMgcmVzdG9yZWQgb24gdW5kby5cbiAgICAgIC8vIFNvIGN1cnNvciBzdGF0ZSBoYXMgdG8gYmUgdXBkYXRlZCBiZWZvcmUgbmV4dCBncm91cENoYW5nZXNTaW5jZUNoZWNrcG9pbnQoKVxuICAgICAgaWYgKHRoaXMuZ2V0Q29uZmlnKCdjbGVhck11bHRpcGxlQ3Vyc29yc09uRXNjYXBlSW5zZXJ0TW9kZScpKSB0aGlzLnZpbVN0YXRlLmNsZWFyU2VsZWN0aW9ucygpXG5cbiAgICAgIC8vIGdyb3VwaW5nIGNoYW5nZXMgZm9yIHVuZG8gY2hlY2twb2ludCBuZWVkIHRvIGNvbWUgbGFzdFxuICAgICAgdGhpcy5ncm91cENoYW5nZXNTaW5jZUJ1ZmZlckNoZWNrcG9pbnQoJ3VuZG8nKVxuXG4gICAgICBjb25zdCBwcmV2ZW50SW5jb3JyZWN0V3JhcCA9IHRoaXMuZWRpdG9yLmhhc0F0b21pY1NvZnRUYWJzKClcbiAgICAgIGZvciAoY29uc3QgY3Vyc29yIG9mIHRoaXMuZWRpdG9yLmdldEN1cnNvcnMoKSkge1xuICAgICAgICB0aGlzLnV0aWxzLm1vdmVDdXJzb3JMZWZ0KGN1cnNvciwge3ByZXZlbnRJbmNvcnJlY3RXcmFwfSlcbiAgICAgIH1cbiAgICB9KVxuICB9XG59XG5cbmNsYXNzIEFjdGl2YXRlSW5zZXJ0TW9kZSBleHRlbmRzIEFjdGl2YXRlSW5zZXJ0TW9kZUJhc2Uge1xuICB0YXJnZXQgPSAnRW1wdHknXG4gIGFjY2VwdFByZXNldE9jY3VycmVuY2UgPSBmYWxzZVxuICBhY2NlcHRQZXJzaXN0ZW50U2VsZWN0aW9uID0gZmFsc2Vcbn1cblxuY2xhc3MgQWN0aXZhdGVSZXBsYWNlTW9kZSBleHRlbmRzIEFjdGl2YXRlSW5zZXJ0TW9kZSB7XG4gIGluaXRpYWxpemUgKCkge1xuICAgIHN1cGVyLmluaXRpYWxpemUoKVxuXG4gICAgY29uc3QgcmVwbGFjZWRDaGFyc0J5U2VsZWN0aW9uID0gbmV3IFdlYWtNYXAoKVxuICAgIHRoaXMudmltU3RhdGUucmVwbGFjZU1vZGVEaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoXG4gICAgICB0aGlzLmVkaXRvci5vbldpbGxJbnNlcnRUZXh0KCh7dGV4dCA9ICcnLCBjYW5jZWx9KSA9PiB7XG4gICAgICAgIGNhbmNlbCgpXG4gICAgICAgIGZvciAoY29uc3Qgc2VsZWN0aW9uIG9mIHRoaXMuZWRpdG9yLmdldFNlbGVjdGlvbnMoKSkge1xuICAgICAgICAgIGZvciAoY29uc3QgY2hhciBvZiB0ZXh0LnNwbGl0KCcnKSkge1xuICAgICAgICAgICAgaWYgKGNoYXIgIT09ICdcXG4nICYmICFzZWxlY3Rpb24uY3Vyc29yLmlzQXRFbmRPZkxpbmUoKSkgc2VsZWN0aW9uLnNlbGVjdFJpZ2h0KClcbiAgICAgICAgICAgIGlmICghcmVwbGFjZWRDaGFyc0J5U2VsZWN0aW9uLmhhcyhzZWxlY3Rpb24pKSByZXBsYWNlZENoYXJzQnlTZWxlY3Rpb24uc2V0KHNlbGVjdGlvbiwgW10pXG4gICAgICAgICAgICByZXBsYWNlZENoYXJzQnlTZWxlY3Rpb24uZ2V0KHNlbGVjdGlvbikucHVzaChzZWxlY3Rpb24uZ2V0VGV4dCgpKVxuICAgICAgICAgICAgc2VsZWN0aW9uLmluc2VydFRleHQoY2hhcilcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pLFxuXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZCh0aGlzLmVkaXRvckVsZW1lbnQsICdjb3JlOmJhY2tzcGFjZScsIGV2ZW50ID0+IHtcbiAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICAgICAgZm9yIChjb25zdCBzZWxlY3Rpb24gb2YgdGhpcy5lZGl0b3IuZ2V0U2VsZWN0aW9ucygpKSB7XG4gICAgICAgICAgY29uc3QgY2hhcnMgPSByZXBsYWNlZENoYXJzQnlTZWxlY3Rpb24uZ2V0KHNlbGVjdGlvbilcbiAgICAgICAgICBpZiAoY2hhcnMgJiYgY2hhcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBzZWxlY3Rpb24uc2VsZWN0TGVmdCgpXG4gICAgICAgICAgICBpZiAoIXNlbGVjdGlvbi5pbnNlcnRUZXh0KGNoYXJzLnBvcCgpKS5pc0VtcHR5KCkpIHNlbGVjdGlvbi5jdXJzb3IubW92ZUxlZnQoKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICApXG4gIH1cblxuICByZXBlYXRJbnNlcnQgKHNlbGVjdGlvbiwgdGV4dCkge1xuICAgIGZvciAoY29uc3QgY2hhciBvZiB0ZXh0KSB7XG4gICAgICBpZiAoY2hhciA9PT0gJ1xcbicpIGNvbnRpbnVlXG4gICAgICBpZiAoc2VsZWN0aW9uLmN1cnNvci5pc0F0RW5kT2ZMaW5lKCkpIGJyZWFrXG4gICAgICBzZWxlY3Rpb24uc2VsZWN0UmlnaHQoKVxuICAgIH1cbiAgICBzZWxlY3Rpb24uaW5zZXJ0VGV4dCh0ZXh0LCB7YXV0b0luZGVudDogZmFsc2V9KVxuICB9XG59XG5cbmNsYXNzIEluc2VydEFmdGVyIGV4dGVuZHMgQWN0aXZhdGVJbnNlcnRNb2RlIHtcbiAgZXhlY3V0ZSAoKSB7XG4gICAgZm9yIChjb25zdCBjdXJzb3Igb2YgdGhpcy5lZGl0b3IuZ2V0Q3Vyc29ycygpKSB7XG4gICAgICB0aGlzLnV0aWxzLm1vdmVDdXJzb3JSaWdodChjdXJzb3IpXG4gICAgfVxuICAgIHN1cGVyLmV4ZWN1dGUoKVxuICB9XG59XG5cbi8vIGtleTogJ2cgSScgaW4gYWxsIG1vZGVcbmNsYXNzIEluc2VydEF0QmVnaW5uaW5nT2ZMaW5lIGV4dGVuZHMgQWN0aXZhdGVJbnNlcnRNb2RlIHtcbiAgZXhlY3V0ZSAoKSB7XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gJ3Zpc3VhbCcgJiYgdGhpcy5zdWJtb2RlICE9PSAnYmxvY2t3aXNlJykge1xuICAgICAgdGhpcy5lZGl0b3Iuc3BsaXRTZWxlY3Rpb25zSW50b0xpbmVzKClcbiAgICB9XG4gICAgZm9yIChjb25zdCBibG9ja3dpc2VTZWxlY3Rpb24gb2YgdGhpcy5nZXRCbG9ja3dpc2VTZWxlY3Rpb25zKCkpIHtcbiAgICAgIGJsb2Nrd2lzZVNlbGVjdGlvbi5za2lwTm9ybWFsaXphdGlvbigpXG4gICAgfVxuICAgIHRoaXMuZWRpdG9yLm1vdmVUb0JlZ2lubmluZ09mTGluZSgpXG4gICAgc3VwZXIuZXhlY3V0ZSgpXG4gIH1cbn1cblxuLy8ga2V5OiBub3JtYWwgJ0EnXG5jbGFzcyBJbnNlcnRBZnRlckVuZE9mTGluZSBleHRlbmRzIEFjdGl2YXRlSW5zZXJ0TW9kZSB7XG4gIGV4ZWN1dGUgKCkge1xuICAgIHRoaXMuZWRpdG9yLm1vdmVUb0VuZE9mTGluZSgpXG4gICAgc3VwZXIuZXhlY3V0ZSgpXG4gIH1cbn1cblxuLy8ga2V5OiBub3JtYWwgJ0knXG5jbGFzcyBJbnNlcnRBdEZpcnN0Q2hhcmFjdGVyT2ZMaW5lIGV4dGVuZHMgQWN0aXZhdGVJbnNlcnRNb2RlIHtcbiAgZXhlY3V0ZSAoKSB7XG4gICAgZm9yIChjb25zdCBjdXJzb3Igb2YgdGhpcy5lZGl0b3IuZ2V0Q3Vyc29ycygpKSB7XG4gICAgICB0aGlzLnV0aWxzLm1vdmVDdXJzb3JUb0ZpcnN0Q2hhcmFjdGVyQXRSb3coY3Vyc29yLCBjdXJzb3IuZ2V0QnVmZmVyUm93KCkpXG4gICAgfVxuICAgIHN1cGVyLmV4ZWN1dGUoKVxuICB9XG59XG5cbmNsYXNzIEluc2VydEF0TGFzdEluc2VydCBleHRlbmRzIEFjdGl2YXRlSW5zZXJ0TW9kZSB7XG4gIGV4ZWN1dGUgKCkge1xuICAgIGNvbnN0IHBvaW50ID0gdGhpcy52aW1TdGF0ZS5tYXJrLmdldCgnXicpXG4gICAgaWYgKHBvaW50KSB7XG4gICAgICB0aGlzLmVkaXRvci5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbihwb2ludClcbiAgICAgIHRoaXMuZWRpdG9yLnNjcm9sbFRvQ3Vyc29yUG9zaXRpb24oe2NlbnRlcjogdHJ1ZX0pXG4gICAgfVxuICAgIHN1cGVyLmV4ZWN1dGUoKVxuICB9XG59XG5cbmNsYXNzIEluc2VydEFib3ZlV2l0aE5ld2xpbmUgZXh0ZW5kcyBBY3RpdmF0ZUluc2VydE1vZGUge1xuICBpbml0aWFsaXplICgpIHtcbiAgICB0aGlzLm9yaWdpbmFsQ3Vyc29yUG9zaXRpb25NYXJrZXIgPSB0aGlzLmVkaXRvci5tYXJrQnVmZmVyUG9zaXRpb24odGhpcy5lZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSlcbiAgICBzdXBlci5pbml0aWFsaXplKClcbiAgfVxuXG4gIC8vIFRoaXMgaXMgZm9yIGBvYCBhbmQgYE9gIG9wZXJhdG9yLlxuICAvLyBPbiB1bmRvL3JlZG8gcHV0IGN1cnNvciBhdCBvcmlnaW5hbCBwb2ludCB3aGVyZSB1c2VyIHR5cGUgYG9gIG9yIGBPYC5cbiAgZ3JvdXBDaGFuZ2VzU2luY2VCdWZmZXJDaGVja3BvaW50IChwdXJwb3NlKSB7XG4gICAgaWYgKHRoaXMucmVwZWF0ZWQpIHtcbiAgICAgIHN1cGVyLmdyb3VwQ2hhbmdlc1NpbmNlQnVmZmVyQ2hlY2twb2ludChwdXJwb3NlKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgbGFzdEN1cnNvciA9IHRoaXMuZWRpdG9yLmdldExhc3RDdXJzb3IoKVxuICAgIGNvbnN0IGN1cnNvclBvc2l0aW9uID0gbGFzdEN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgbGFzdEN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbih0aGlzLm9yaWdpbmFsQ3Vyc29yUG9zaXRpb25NYXJrZXIuZ2V0SGVhZEJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgdGhpcy5vcmlnaW5hbEN1cnNvclBvc2l0aW9uTWFya2VyLmRlc3Ryb3koKVxuICAgIHRoaXMub3JpZ2luYWxDdXJzb3JQb3NpdGlvbk1hcmtlciA9IG51bGxcblxuICAgIGlmICh0aGlzLmdldENvbmZpZygnZ3JvdXBDaGFuZ2VzV2hlbkxlYXZpbmdJbnNlcnRNb2RlJykpIHtcbiAgICAgIHN1cGVyLmdyb3VwQ2hhbmdlc1NpbmNlQnVmZmVyQ2hlY2twb2ludChwdXJwb3NlKVxuICAgIH1cbiAgICBsYXN0Q3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKGN1cnNvclBvc2l0aW9uKVxuICB9XG5cbiAgYXV0b0luZGVudEVtcHR5Um93cyAoKSB7XG4gICAgZm9yIChjb25zdCBjdXJzb3Igb2YgdGhpcy5lZGl0b3IuZ2V0Q3Vyc29ycygpKSB7XG4gICAgICBjb25zdCByb3cgPSBjdXJzb3IuZ2V0QnVmZmVyUm93KClcbiAgICAgIGlmICh0aGlzLmlzRW1wdHlSb3cocm93KSkgdGhpcy5lZGl0b3IuYXV0b0luZGVudEJ1ZmZlclJvdyhyb3cpXG4gICAgfVxuICB9XG5cbiAgbXV0YXRlVGV4dCAoKSB7XG4gICAgdGhpcy5lZGl0b3IuaW5zZXJ0TmV3bGluZUFib3ZlKClcbiAgICBpZiAodGhpcy5lZGl0b3IuYXV0b0luZGVudCkgdGhpcy5hdXRvSW5kZW50RW1wdHlSb3dzKClcbiAgfVxuXG4gIHJlcGVhdEluc2VydCAoc2VsZWN0aW9uLCB0ZXh0KSB7XG4gICAgc2VsZWN0aW9uLmluc2VydFRleHQodGV4dC50cmltTGVmdCgpLCB7YXV0b0luZGVudDogdHJ1ZX0pXG4gIH1cbn1cblxuY2xhc3MgSW5zZXJ0QmVsb3dXaXRoTmV3bGluZSBleHRlbmRzIEluc2VydEFib3ZlV2l0aE5ld2xpbmUge1xuICBtdXRhdGVUZXh0ICgpIHtcbiAgICBmb3IgKGNvbnN0IGN1cnNvciBvZiB0aGlzLmVkaXRvci5nZXRDdXJzb3JzKCkpIHtcbiAgICAgIHRoaXMudXRpbHMuc2V0QnVmZmVyUm93KGN1cnNvciwgdGhpcy5nZXRGb2xkRW5kUm93Rm9yUm93KGN1cnNvci5nZXRCdWZmZXJSb3coKSkpXG4gICAgfVxuXG4gICAgdGhpcy5lZGl0b3IuaW5zZXJ0TmV3bGluZUJlbG93KClcbiAgICBpZiAodGhpcy5lZGl0b3IuYXV0b0luZGVudCkgdGhpcy5hdXRvSW5kZW50RW1wdHlSb3dzKClcbiAgfVxufVxuXG4vLyBBZHZhbmNlZCBJbnNlcnRpb25cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIEluc2VydEJ5VGFyZ2V0IGV4dGVuZHMgQWN0aXZhdGVJbnNlcnRNb2RlQmFzZSB7XG4gIHN0YXRpYyBjb21tYW5kID0gZmFsc2VcbiAgd2hpY2ggPSBudWxsIC8vIG9uZSBvZiBbJ3N0YXJ0JywgJ2VuZCcsICdoZWFkJywgJ3RhaWwnXVxuXG4gIGluaXRpYWxpemUgKCkge1xuICAgIC8vIEhBQ0tcbiAgICAvLyBXaGVuIGcgaSBpcyBtYXBwZWQgdG8gYGluc2VydC1hdC1zdGFydC1vZi10YXJnZXRgLlxuICAgIC8vIGBnIGkgMyBsYCBzdGFydCBpbnNlcnQgYXQgMyBjb2x1bW4gcmlnaHQgcG9zaXRpb24uXG4gICAgLy8gSW4gdGhpcyBjYXNlLCB3ZSBkb24ndCB3YW50IHJlcGVhdCBpbnNlcnRpb24gMyB0aW1lcy5cbiAgICAvLyBUaGlzIEBnZXRDb3VudCgpIGNhbGwgY2FjaGUgbnVtYmVyIGF0IHRoZSB0aW1pbmcgQkVGT1JFICczJyBpcyBzcGVjaWZpZWQuXG4gICAgdGhpcy5nZXRDb3VudCgpXG4gICAgc3VwZXIuaW5pdGlhbGl6ZSgpXG4gIH1cblxuICBleGVjdXRlICgpIHtcbiAgICB0aGlzLm9uRGlkU2VsZWN0VGFyZ2V0KCgpID0+IHtcbiAgICAgIC8vIEluIHZDL3ZMLCB3aGVuIG9jY3VycmVuY2UgbWFya2VyIHdhcyBOT1Qgc2VsZWN0ZWQsXG4gICAgICAvLyBpdCBiZWhhdmUncyB2ZXJ5IHNwZWNpYWxseVxuICAgICAgLy8gdkM6IGBJYCBhbmQgYEFgIGJlaGF2ZXMgYXMgc2hvZnQgaGFuZCBvZiBgY3RybC12IElgIGFuZCBgY3RybC12IEFgLlxuICAgICAgLy8gdkw6IGBJYCBhbmQgYEFgIHBsYWNlIGN1cnNvcnMgYXQgZWFjaCBzZWxlY3RlZCBsaW5lcyBvZiBzdGFydCggb3IgZW5kICkgb2Ygbm9uLXdoaXRlLXNwYWNlIGNoYXIuXG4gICAgICBpZiAoIXRoaXMub2NjdXJyZW5jZVNlbGVjdGVkICYmIHRoaXMubW9kZSA9PT0gJ3Zpc3VhbCcgJiYgdGhpcy5zdWJtb2RlICE9PSAnYmxvY2t3aXNlJykge1xuICAgICAgICBmb3IgKGNvbnN0ICRzZWxlY3Rpb24gb2YgdGhpcy5zd3JhcC5nZXRTZWxlY3Rpb25zKHRoaXMuZWRpdG9yKSkge1xuICAgICAgICAgICRzZWxlY3Rpb24ubm9ybWFsaXplKClcbiAgICAgICAgICAkc2VsZWN0aW9uLmFwcGx5V2lzZSgnYmxvY2t3aXNlJylcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnN1Ym1vZGUgPT09ICdsaW5ld2lzZScpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGJsb2Nrd2lzZVNlbGVjdGlvbiBvZiB0aGlzLmdldEJsb2Nrd2lzZVNlbGVjdGlvbnMoKSkge1xuICAgICAgICAgICAgYmxvY2t3aXNlU2VsZWN0aW9uLmV4cGFuZE1lbWJlclNlbGVjdGlvbnNPdmVyTGluZVdpdGhUcmltUmFuZ2UoKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0ICRzZWxlY3Rpb24gb2YgdGhpcy5zd3JhcC5nZXRTZWxlY3Rpb25zKHRoaXMuZWRpdG9yKSkge1xuICAgICAgICAkc2VsZWN0aW9uLnNldEJ1ZmZlclBvc2l0aW9uVG8odGhpcy53aGljaClcbiAgICAgIH1cbiAgICB9KVxuICAgIHN1cGVyLmV4ZWN1dGUoKVxuICB9XG59XG5cbi8vIGtleTogJ0knLCBVc2VkIGluICd2aXN1YWwtbW9kZS5jaGFyYWN0ZXJ3aXNlJywgdmlzdWFsLW1vZGUuYmxvY2t3aXNlXG5jbGFzcyBJbnNlcnRBdFN0YXJ0T2ZUYXJnZXQgZXh0ZW5kcyBJbnNlcnRCeVRhcmdldCB7XG4gIHdoaWNoID0gJ3N0YXJ0J1xufVxuXG4vLyBrZXk6ICdBJywgVXNlZCBpbiAndmlzdWFsLW1vZGUuY2hhcmFjdGVyd2lzZScsICd2aXN1YWwtbW9kZS5ibG9ja3dpc2UnXG5jbGFzcyBJbnNlcnRBdEVuZE9mVGFyZ2V0IGV4dGVuZHMgSW5zZXJ0QnlUYXJnZXQge1xuICB3aGljaCA9ICdlbmQnXG59XG5cbmNsYXNzIEluc2VydEF0SGVhZE9mVGFyZ2V0IGV4dGVuZHMgSW5zZXJ0QnlUYXJnZXQge1xuICB3aGljaCA9ICdoZWFkJ1xufVxuXG5jbGFzcyBJbnNlcnRBdFN0YXJ0T2ZPY2N1cnJlbmNlIGV4dGVuZHMgSW5zZXJ0QXRTdGFydE9mVGFyZ2V0IHtcbiAgb2NjdXJyZW5jZSA9IHRydWVcbn1cblxuY2xhc3MgSW5zZXJ0QXRFbmRPZk9jY3VycmVuY2UgZXh0ZW5kcyBJbnNlcnRBdEVuZE9mVGFyZ2V0IHtcbiAgb2NjdXJyZW5jZSA9IHRydWVcbn1cblxuY2xhc3MgSW5zZXJ0QXRIZWFkT2ZPY2N1cnJlbmNlIGV4dGVuZHMgSW5zZXJ0QXRIZWFkT2ZUYXJnZXQge1xuICBvY2N1cnJlbmNlID0gdHJ1ZVxufVxuXG5jbGFzcyBJbnNlcnRBdFN0YXJ0T2ZTdWJ3b3JkT2NjdXJyZW5jZSBleHRlbmRzIEluc2VydEF0U3RhcnRPZk9jY3VycmVuY2Uge1xuICBvY2N1cnJlbmNlVHlwZSA9ICdzdWJ3b3JkJ1xufVxuXG5jbGFzcyBJbnNlcnRBdEVuZE9mU3Vid29yZE9jY3VycmVuY2UgZXh0ZW5kcyBJbnNlcnRBdEVuZE9mT2NjdXJyZW5jZSB7XG4gIG9jY3VycmVuY2VUeXBlID0gJ3N1YndvcmQnXG59XG5cbmNsYXNzIEluc2VydEF0SGVhZE9mU3Vid29yZE9jY3VycmVuY2UgZXh0ZW5kcyBJbnNlcnRBdEhlYWRPZk9jY3VycmVuY2Uge1xuICBvY2N1cnJlbmNlVHlwZSA9ICdzdWJ3b3JkJ1xufVxuXG5jbGFzcyBJbnNlcnRBdFN0YXJ0T2ZTbWFydFdvcmQgZXh0ZW5kcyBJbnNlcnRCeVRhcmdldCB7XG4gIHdoaWNoID0gJ3N0YXJ0J1xuICB0YXJnZXQgPSAnTW92ZVRvUHJldmlvdXNTbWFydFdvcmQnXG59XG5cbmNsYXNzIEluc2VydEF0RW5kT2ZTbWFydFdvcmQgZXh0ZW5kcyBJbnNlcnRCeVRhcmdldCB7XG4gIHdoaWNoID0gJ2VuZCdcbiAgdGFyZ2V0ID0gJ01vdmVUb0VuZE9mU21hcnRXb3JkJ1xufVxuXG5jbGFzcyBJbnNlcnRBdFByZXZpb3VzRm9sZFN0YXJ0IGV4dGVuZHMgSW5zZXJ0QnlUYXJnZXQge1xuICB3aGljaCA9ICdzdGFydCdcbiAgdGFyZ2V0ID0gJ01vdmVUb1ByZXZpb3VzRm9sZFN0YXJ0J1xufVxuXG5jbGFzcyBJbnNlcnRBdE5leHRGb2xkU3RhcnQgZXh0ZW5kcyBJbnNlcnRCeVRhcmdldCB7XG4gIHdoaWNoID0gJ2VuZCdcbiAgdGFyZ2V0ID0gJ01vdmVUb05leHRGb2xkU3RhcnQnXG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIENoYW5nZSBleHRlbmRzIEFjdGl2YXRlSW5zZXJ0TW9kZUJhc2Uge1xuICB0cmFja0NoYW5nZSA9IHRydWVcbiAgc3VwcG9ydEluc2VydGlvbkNvdW50ID0gZmFsc2VcblxuICBtdXRhdGVUZXh0ICgpIHtcbiAgICAvLyBBbGx3YXlzIGR5bmFtaWNhbGx5IGRldGVybWluZSBzZWxlY3Rpb24gd2lzZSB3dGhvdXQgY29uc3VsdGluZyB0YXJnZXQud2lzZVxuICAgIC8vIFJlYXNvbjogd2hlbiBgYyBpIHtgLCB3aXNlIGlzICdjaGFyYWN0ZXJ3aXNlJywgYnV0IGFjdHVhbGx5IHNlbGVjdGVkIHJhbmdlIGlzICdsaW5ld2lzZSdcbiAgICAvLyAgIHtcbiAgICAvLyAgICAgYVxuICAgIC8vICAgfVxuICAgIGNvbnN0IGlzTGluZXdpc2VUYXJnZXQgPSB0aGlzLnN3cmFwLmRldGVjdFdpc2UodGhpcy5lZGl0b3IpID09PSAnbGluZXdpc2UnXG4gICAgZm9yIChjb25zdCBzZWxlY3Rpb24gb2YgdGhpcy5lZGl0b3IuZ2V0U2VsZWN0aW9ucygpKSB7XG4gICAgICBpZiAoIXRoaXMuZ2V0Q29uZmlnKCdkb250VXBkYXRlUmVnaXN0ZXJPbkNoYW5nZU9yU3Vic3RpdHV0ZScpKSB7XG4gICAgICAgIHRoaXMuc2V0VGV4dFRvUmVnaXN0ZXIoc2VsZWN0aW9uLmdldFRleHQoKSwgc2VsZWN0aW9uKVxuICAgICAgfVxuICAgICAgaWYgKGlzTGluZXdpc2VUYXJnZXQpIHtcbiAgICAgICAgc2VsZWN0aW9uLmluc2VydFRleHQoJ1xcbicsIHthdXRvSW5kZW50OiB0cnVlfSlcbiAgICAgICAgLy8gc2VsZWN0aW9uLmluc2VydFRleHQoXCJcIiwge2F1dG9JbmRlbnQ6IHRydWV9KVxuICAgICAgICBzZWxlY3Rpb24uY3Vyc29yLm1vdmVMZWZ0KClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNlbGVjdGlvbi5pbnNlcnRUZXh0KCcnLCB7YXV0b0luZGVudDogdHJ1ZX0pXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIENoYW5nZU9jY3VycmVuY2UgZXh0ZW5kcyBDaGFuZ2Uge1xuICBvY2N1cnJlbmNlID0gdHJ1ZVxufVxuXG5jbGFzcyBDaGFuZ2VTdWJ3b3JkT2NjdXJyZW5jZSBleHRlbmRzIENoYW5nZU9jY3VycmVuY2Uge1xuICBvY2N1cnJlbmNlVHlwZSA9ICdzdWJ3b3JkJ1xufVxuXG5jbGFzcyBTdWJzdGl0dXRlIGV4dGVuZHMgQ2hhbmdlIHtcbiAgdGFyZ2V0ID0gJ01vdmVSaWdodCdcbn1cblxuY2xhc3MgU3Vic3RpdHV0ZUxpbmUgZXh0ZW5kcyBDaGFuZ2Uge1xuICB3aXNlID0gJ2xpbmV3aXNlJyAvLyBbRklYTUVdIHRvIHJlLW92ZXJyaWRlIHRhcmdldC53aXNlIGluIHZpc3VhbC1tb2RlXG4gIHRhcmdldCA9ICdNb3ZlVG9SZWxhdGl2ZUxpbmUnXG59XG5cbi8vIGFsaWFzXG5jbGFzcyBDaGFuZ2VMaW5lIGV4dGVuZHMgU3Vic3RpdHV0ZUxpbmUge31cblxuY2xhc3MgQ2hhbmdlVG9MYXN0Q2hhcmFjdGVyT2ZMaW5lIGV4dGVuZHMgQ2hhbmdlIHtcbiAgdGFyZ2V0ID0gJ01vdmVUb0xhc3RDaGFyYWN0ZXJPZkxpbmUnXG5cbiAgZXhlY3V0ZSAoKSB7XG4gICAgdGhpcy5vbkRpZFNlbGVjdFRhcmdldCgoKSA9PiB7XG4gICAgICBpZiAodGhpcy50YXJnZXQud2lzZSA9PT0gJ2Jsb2Nrd2lzZScpIHtcbiAgICAgICAgZm9yIChjb25zdCBibG9ja3dpc2VTZWxlY3Rpb24gb2YgdGhpcy5nZXRCbG9ja3dpc2VTZWxlY3Rpb25zKCkpIHtcbiAgICAgICAgICBibG9ja3dpc2VTZWxlY3Rpb24uZXh0ZW5kTWVtYmVyU2VsZWN0aW9uc1RvRW5kT2ZMaW5lKClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gICAgc3VwZXIuZXhlY3V0ZSgpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIEFjdGl2YXRlSW5zZXJ0TW9kZUJhc2UsXG4gIEFjdGl2YXRlSW5zZXJ0TW9kZSxcbiAgQWN0aXZhdGVSZXBsYWNlTW9kZSxcbiAgSW5zZXJ0QWZ0ZXIsXG4gIEluc2VydEF0QmVnaW5uaW5nT2ZMaW5lLFxuICBJbnNlcnRBZnRlckVuZE9mTGluZSxcbiAgSW5zZXJ0QXRGaXJzdENoYXJhY3Rlck9mTGluZSxcbiAgSW5zZXJ0QXRMYXN0SW5zZXJ0LFxuICBJbnNlcnRBYm92ZVdpdGhOZXdsaW5lLFxuICBJbnNlcnRCZWxvd1dpdGhOZXdsaW5lLFxuICBJbnNlcnRCeVRhcmdldCxcbiAgSW5zZXJ0QXRTdGFydE9mVGFyZ2V0LFxuICBJbnNlcnRBdEVuZE9mVGFyZ2V0LFxuICBJbnNlcnRBdEhlYWRPZlRhcmdldCxcbiAgSW5zZXJ0QXRTdGFydE9mT2NjdXJyZW5jZSxcbiAgSW5zZXJ0QXRFbmRPZk9jY3VycmVuY2UsXG4gIEluc2VydEF0SGVhZE9mT2NjdXJyZW5jZSxcbiAgSW5zZXJ0QXRTdGFydE9mU3Vid29yZE9jY3VycmVuY2UsXG4gIEluc2VydEF0RW5kT2ZTdWJ3b3JkT2NjdXJyZW5jZSxcbiAgSW5zZXJ0QXRIZWFkT2ZTdWJ3b3JkT2NjdXJyZW5jZSxcbiAgSW5zZXJ0QXRTdGFydE9mU21hcnRXb3JkLFxuICBJbnNlcnRBdEVuZE9mU21hcnRXb3JkLFxuICBJbnNlcnRBdFByZXZpb3VzRm9sZFN0YXJ0LFxuICBJbnNlcnRBdE5leHRGb2xkU3RhcnQsXG4gIENoYW5nZSxcbiAgQ2hhbmdlT2NjdXJyZW5jZSxcbiAgQ2hhbmdlU3Vid29yZE9jY3VycmVuY2UsXG4gIFN1YnN0aXR1dGUsXG4gIFN1YnN0aXR1dGVMaW5lLFxuICBDaGFuZ2VMaW5lLFxuICBDaGFuZ2VUb0xhc3RDaGFyYWN0ZXJPZkxpbmVcbn1cbiJdfQ==