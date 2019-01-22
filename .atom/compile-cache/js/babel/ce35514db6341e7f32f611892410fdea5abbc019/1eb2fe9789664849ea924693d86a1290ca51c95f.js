'use babel';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x3, _x4, _x5) { var _again = true; _function: while (_again) { var object = _x3, property = _x4, receiver = _x5; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x3 = parent; _x4 = property; _x5 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('atom');

var Point = _require.Point;
var Range = _require.Range;

var Base = require('./base');

var Motion = (function (_Base) {
  _inherits(Motion, _Base);

  function Motion() {
    _classCallCheck(this, Motion);

    _get(Object.getPrototypeOf(Motion.prototype), 'constructor', this).apply(this, arguments);

    this.operator = null;
    this.inclusive = false;
    this.wise = 'characterwise';
    this.jump = false;
    this.verticalMotion = false;
    this.moveSucceeded = null;
    this.moveSuccessOnLinewise = false;
    this.selectSucceeded = false;
    this.requireInput = false;
    this.caseSensitivityKind = null;
  }

  // Used as operator's target in visual-mode.

  _createClass(Motion, [{
    key: 'isReady',
    value: function isReady() {
      return !this.requireInput || this.input != null;
    }
  }, {
    key: 'isLinewise',
    value: function isLinewise() {
      return this.wise === 'linewise';
    }
  }, {
    key: 'isBlockwise',
    value: function isBlockwise() {
      return this.wise === 'blockwise';
    }
  }, {
    key: 'forceWise',
    value: function forceWise(wise) {
      if (wise === 'characterwise') {
        this.inclusive = this.wise === 'linewise' ? false : !this.inclusive;
      }
      this.wise = wise;
    }
  }, {
    key: 'resetState',
    value: function resetState() {
      this.selectSucceeded = false;
    }
  }, {
    key: 'moveWithSaveJump',
    value: function moveWithSaveJump(cursor) {
      var originalPosition = this.jump && cursor.isLastCursor() ? cursor.getBufferPosition() : undefined;

      this.moveCursor(cursor);

      if (originalPosition && !cursor.getBufferPosition().isEqual(originalPosition)) {
        this.vimState.mark.set('`', originalPosition);
        this.vimState.mark.set("'", originalPosition);
      }
    }
  }, {
    key: 'execute',
    value: function execute() {
      if (this.operator) {
        this.select();
      } else {
        for (var cursor of this.editor.getCursors()) {
          this.moveWithSaveJump(cursor);
        }
      }
      this.editor.mergeCursors();
      this.editor.mergeIntersectingSelections();
    }

    // NOTE: selection is already "normalized" before this function is called.
  }, {
    key: 'select',
    value: function select() {
      var _this = this;

      // need to care was visual for `.` repeated.
      var isOrWasVisual = this.operator['instanceof']('SelectBase') || this.name === 'CurrentSelection';

      var _loop = function (selection) {
        selection.modifySelection(function () {
          return _this.moveWithSaveJump(selection.cursor);
        });

        var selectSucceeded = _this.moveSucceeded != null ? _this.moveSucceeded : !selection.isEmpty() || _this.isLinewise() && _this.moveSuccessOnLinewise;
        if (!_this.selectSucceeded) _this.selectSucceeded = selectSucceeded;

        if (isOrWasVisual || selectSucceeded && (_this.inclusive || _this.isLinewise())) {
          var $selection = _this.swrap(selection);
          $selection.saveProperties(true); // save property of "already-normalized-selection"
          $selection.applyWise(_this.wise);
        }
      };

      for (var selection of this.editor.getSelections()) {
        _loop(selection);
      }

      if (this.wise === 'blockwise') {
        this.vimState.getLastBlockwiseSelection().autoscroll();
      }
    }
  }, {
    key: 'setCursorBufferRow',
    value: function setCursorBufferRow(cursor, row, options) {
      if (this.verticalMotion && !this.getConfig('stayOnVerticalMotion')) {
        cursor.setBufferPosition(this.getFirstCharacterPositionForBufferRow(row), options);
      } else {
        this.utils.setBufferRow(cursor, row, options);
      }
    }

    // Call callback count times.
    // But break iteration when cursor position did not change before/after callback.
  }, {
    key: 'moveCursorCountTimes',
    value: function moveCursorCountTimes(cursor, fn) {
      var oldPosition = cursor.getBufferPosition();
      this.countTimes(this.getCount(), function (state) {
        fn(state);
        var newPosition = cursor.getBufferPosition();
        if (newPosition.isEqual(oldPosition)) state.stop();
        oldPosition = newPosition;
      });
    }
  }, {
    key: 'isCaseSensitive',
    value: function isCaseSensitive(term) {
      if (this.getConfig('useSmartcaseFor' + this.caseSensitivityKind)) {
        return term.search(/[A-Z]/) !== -1;
      } else {
        return !this.getConfig('ignoreCaseFor' + this.caseSensitivityKind);
      }
    }
  }, {
    key: 'getLastResortPoint',
    value: function getLastResortPoint(direction) {
      if (direction === 'next') {
        return this.getVimEofBufferPosition();
      } else {
        return new Point(0, 0);
      }
    }
  }], [{
    key: 'operationKind',
    value: 'motion',
    enumerable: true
  }, {
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return Motion;
})(Base);

var CurrentSelection = (function (_Motion) {
  _inherits(CurrentSelection, _Motion);

  function CurrentSelection() {
    _classCallCheck(this, CurrentSelection);

    _get(Object.getPrototypeOf(CurrentSelection.prototype), 'constructor', this).apply(this, arguments);

    this.selectionExtent = null;
    this.blockwiseSelectionExtent = null;
    this.inclusive = true;
    this.pointInfoByCursor = new Map();
  }

  _createClass(CurrentSelection, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      if (this.mode === 'visual') {
        this.selectionExtent = this.isBlockwise() ? this.swrap(cursor.selection).getBlockwiseSelectionExtent() : this.editor.getSelectedBufferRange().getExtent();
      } else {
        // `.` repeat case
        cursor.setBufferPosition(cursor.getBufferPosition().translate(this.selectionExtent));
      }
    }
  }, {
    key: 'select',
    value: function select() {
      var _this2 = this;

      if (this.mode === 'visual') {
        _get(Object.getPrototypeOf(CurrentSelection.prototype), 'select', this).call(this);
      } else {
        for (var cursor of this.editor.getCursors()) {
          var pointInfo = this.pointInfoByCursor.get(cursor);
          if (pointInfo) {
            var cursorPosition = pointInfo.cursorPosition;
            var startOfSelection = pointInfo.startOfSelection;

            if (cursorPosition.isEqual(cursor.getBufferPosition())) {
              cursor.setBufferPosition(startOfSelection);
            }
          }
        }
        _get(Object.getPrototypeOf(CurrentSelection.prototype), 'select', this).call(this);
      }

      // * Purpose of pointInfoByCursor? see #235 for detail.
      // When stayOnTransformString is enabled, cursor pos is not set on start of
      // of selected range.
      // But I want following behavior, so need to preserve position info.
      //  1. `vj>.` -> indent same two rows regardless of current cursor's row.
      //  2. `vj>j.` -> indent two rows from cursor's row.

      var _loop2 = function (cursor) {
        var startOfSelection = cursor.selection.getBufferRange().start;
        _this2.onDidFinishOperation(function () {
          var cursorPosition = cursor.getBufferPosition();
          _this2.pointInfoByCursor.set(cursor, { startOfSelection: startOfSelection, cursorPosition: cursorPosition });
        });
      };

      for (var cursor of this.editor.getCursors()) {
        _loop2(cursor);
      }
    }
  }], [{
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return CurrentSelection;
})(Motion);

var MoveLeft = (function (_Motion2) {
  _inherits(MoveLeft, _Motion2);

  function MoveLeft() {
    _classCallCheck(this, MoveLeft);

    _get(Object.getPrototypeOf(MoveLeft.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(MoveLeft, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var _this3 = this;

      var allowWrap = this.getConfig('wrapLeftRightMotion');
      this.moveCursorCountTimes(cursor, function () {
        _this3.utils.moveCursorLeft(cursor, { allowWrap: allowWrap });
      });
    }
  }]);

  return MoveLeft;
})(Motion);

var MoveRight = (function (_Motion3) {
  _inherits(MoveRight, _Motion3);

  function MoveRight() {
    _classCallCheck(this, MoveRight);

    _get(Object.getPrototypeOf(MoveRight.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(MoveRight, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var _this4 = this;

      var allowWrap = this.getConfig('wrapLeftRightMotion');

      this.moveCursorCountTimes(cursor, function () {
        _this4.editor.unfoldBufferRow(cursor.getBufferRow());

        // - When `wrapLeftRightMotion` enabled and executed as pure-motion in `normal-mode`,
        //   we need to move **again** to wrap to next-line if it rached to EOL.
        // - Expression `!this.operator` means normal-mode motion.
        // - Expression `this.mode === "normal"` is not appropreate since it matches `x` operator's target case.
        var needMoveAgain = allowWrap && !_this4.operator && !cursor.isAtEndOfLine();

        _this4.utils.moveCursorRight(cursor, { allowWrap: allowWrap });

        if (needMoveAgain && cursor.isAtEndOfLine()) {
          _this4.utils.moveCursorRight(cursor, { allowWrap: allowWrap });
        }
      });
    }
  }]);

  return MoveRight;
})(Motion);

var MoveRightBufferColumn = (function (_Motion4) {
  _inherits(MoveRightBufferColumn, _Motion4);

  function MoveRightBufferColumn() {
    _classCallCheck(this, MoveRightBufferColumn);

    _get(Object.getPrototypeOf(MoveRightBufferColumn.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(MoveRightBufferColumn, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      this.utils.setBufferColumn(cursor, cursor.getBufferColumn() + this.getCount());
    }
  }], [{
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return MoveRightBufferColumn;
})(Motion);

var MoveUp = (function (_Motion5) {
  _inherits(MoveUp, _Motion5);

  function MoveUp() {
    _classCallCheck(this, MoveUp);

    _get(Object.getPrototypeOf(MoveUp.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'linewise';
    this.wrap = false;
    this.direction = 'up';
  }

  _createClass(MoveUp, [{
    key: 'getBufferRow',
    value: function getBufferRow(row) {
      var min = 0;
      var max = this.getVimLastBufferRow();

      if (this.direction === 'up') {
        row = this.getFoldStartRowForRow(row) - 1;
        row = this.wrap && row < min ? max : this.limitNumber(row, { min: min });
      } else {
        row = this.getFoldEndRowForRow(row) + 1;
        row = this.wrap && row > max ? min : this.limitNumber(row, { max: max });
      }
      return this.getFoldStartRowForRow(row);
    }
  }, {
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var _this5 = this;

      this.moveCursorCountTimes(cursor, function () {
        var row = _this5.getBufferRow(cursor.getBufferRow());
        _this5.utils.setBufferRow(cursor, row);
      });
    }
  }]);

  return MoveUp;
})(Motion);

var MoveUpWrap = (function (_MoveUp) {
  _inherits(MoveUpWrap, _MoveUp);

  function MoveUpWrap() {
    _classCallCheck(this, MoveUpWrap);

    _get(Object.getPrototypeOf(MoveUpWrap.prototype), 'constructor', this).apply(this, arguments);

    this.wrap = true;
  }

  return MoveUpWrap;
})(MoveUp);

var MoveDown = (function (_MoveUp2) {
  _inherits(MoveDown, _MoveUp2);

  function MoveDown() {
    _classCallCheck(this, MoveDown);

    _get(Object.getPrototypeOf(MoveDown.prototype), 'constructor', this).apply(this, arguments);

    this.direction = 'down';
  }

  return MoveDown;
})(MoveUp);

var MoveDownWrap = (function (_MoveDown) {
  _inherits(MoveDownWrap, _MoveDown);

  function MoveDownWrap() {
    _classCallCheck(this, MoveDownWrap);

    _get(Object.getPrototypeOf(MoveDownWrap.prototype), 'constructor', this).apply(this, arguments);

    this.wrap = true;
  }

  return MoveDownWrap;
})(MoveDown);

var MoveUpScreen = (function (_Motion6) {
  _inherits(MoveUpScreen, _Motion6);

  function MoveUpScreen() {
    _classCallCheck(this, MoveUpScreen);

    _get(Object.getPrototypeOf(MoveUpScreen.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'linewise';
    this.direction = 'up';
  }

  _createClass(MoveUpScreen, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var _this6 = this;

      this.moveCursorCountTimes(cursor, function () {
        _this6.utils.moveCursorUpScreen(cursor);
      });
    }
  }]);

  return MoveUpScreen;
})(Motion);

var MoveDownScreen = (function (_MoveUpScreen) {
  _inherits(MoveDownScreen, _MoveUpScreen);

  function MoveDownScreen() {
    _classCallCheck(this, MoveDownScreen);

    _get(Object.getPrototypeOf(MoveDownScreen.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'linewise';
    this.direction = 'down';
  }

  _createClass(MoveDownScreen, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var _this7 = this;

      this.moveCursorCountTimes(cursor, function () {
        _this7.utils.moveCursorDownScreen(cursor);
      });
    }
  }]);

  return MoveDownScreen;
})(MoveUpScreen);

var MoveUpToEdge = (function (_Motion7) {
  _inherits(MoveUpToEdge, _Motion7);

  function MoveUpToEdge() {
    _classCallCheck(this, MoveUpToEdge);

    _get(Object.getPrototypeOf(MoveUpToEdge.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'linewise';
    this.jump = true;
    this.direction = 'previous';
  }

  _createClass(MoveUpToEdge, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var _this8 = this;

      this.moveCursorCountTimes(cursor, function () {
        var point = _this8.getPoint(cursor.getScreenPosition());
        if (point) cursor.setScreenPosition(point);
      });
    }
  }, {
    key: 'getPoint',
    value: function getPoint(fromPoint) {
      var column = fromPoint.column;
      var startRow = fromPoint.row;

      for (var row of this.getScreenRows({ startRow: startRow, direction: this.direction })) {
        var point = new Point(row, column);
        if (this.isEdge(point)) return point;
      }
    }
  }, {
    key: 'isEdge',
    value: function isEdge(point) {
      // If point is stoppable and above or below point is not stoppable, it's Edge!
      return this.isStoppable(point) && (!this.isStoppable(point.translate([-1, 0])) || !this.isStoppable(point.translate([+1, 0])));
    }
  }, {
    key: 'isStoppable',
    value: function isStoppable(point) {
      return this.isNonWhiteSpace(point) || this.isFirstRowOrLastRowAndStoppable(point) ||
      // If right or left column is non-white-space char, it's stoppable.
      this.isNonWhiteSpace(point.translate([0, -1])) && this.isNonWhiteSpace(point.translate([0, +1]));
    }
  }, {
    key: 'isNonWhiteSpace',
    value: function isNonWhiteSpace(point) {
      var char = this.utils.getTextInScreenRange(this.editor, Range.fromPointWithDelta(point, 0, 1));
      return char != null && /\S/.test(char);
    }
  }, {
    key: 'isFirstRowOrLastRowAndStoppable',
    value: function isFirstRowOrLastRowAndStoppable(point) {
      // In notmal-mode, cursor is NOT stoppable to EOL of non-blank row.
      // So explicitly guard to not answer it stoppable.
      if (this.mode === 'normal' && this.utils.pointIsAtEndOfLineAtNonEmptyRow(this.editor, point)) {
        return false;
      }

      // If clipped, it means that original ponit was non stoppable(e.g. point.colum > EOL).
      var row = point.row;

      return (row === 0 || row === this.getVimLastScreenRow()) && point.isEqual(this.editor.clipScreenPosition(point));
    }
  }]);

  return MoveUpToEdge;
})(Motion);

var MoveDownToEdge = (function (_MoveUpToEdge) {
  _inherits(MoveDownToEdge, _MoveUpToEdge);

  function MoveDownToEdge() {
    _classCallCheck(this, MoveDownToEdge);

    _get(Object.getPrototypeOf(MoveDownToEdge.prototype), 'constructor', this).apply(this, arguments);

    this.direction = 'next';
  }

  // Word Motion family
  // +----------------------------------------------------------------------------+
  // | direction | which      | word  | WORD | subword | smartword | alphanumeric |
  // |-----------+------------+-------+------+---------+-----------+--------------+
  // | next      | word-start | w     | W    | -       | -         | -            |
  // | previous  | word-start | b     | b    | -       | -         | -            |
  // | next      | word-end   | e     | E    | -       | -         | -            |
  // | previous  | word-end   | ge    | g E  | n/a     | n/a       | n/a          |
  // +----------------------------------------------------------------------------+

  return MoveDownToEdge;
})(MoveUpToEdge);

var MotionByWord = (function (_Motion8) {
  _inherits(MotionByWord, _Motion8);

  function MotionByWord() {
    _classCallCheck(this, MotionByWord);

    _get(Object.getPrototypeOf(MotionByWord.prototype), 'constructor', this).apply(this, arguments);

    this.wordRegex = null;
    this.skipBlankRow = false;
    this.skipWhiteSpaceOnlyRow = false;
  }

  // w

  _createClass(MotionByWord, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var _this9 = this;

      this.moveCursorCountTimes(cursor, function (countState) {
        cursor.setBufferPosition(_this9.getPoint(cursor, countState));
      });
    }
  }, {
    key: 'getPoint',
    value: function getPoint(cursor, countState) {
      var direction = this.direction;
      var which = this.which;

      var regex = this.getWordRegexForCursor(cursor);

      var from = cursor.getBufferPosition();
      if (direction === 'next' && which === 'start' && this.operator && countState.isFinal) {
        // [NOTE] Exceptional behavior for w and W: [Detail in vim help `:help w`.]
        // [case-A] cw, cW treated as ce, cE when cursor is at non-blank.
        // [case-B] when w, W used as TARGET, it doesn't move over new line.
        if (this.isEmptyRow(from.row)) return [from.row + 1, 0];

        // [case-A]
        if (this.operator.name === 'Change' && !this.utils.pointIsAtWhiteSpace(this.editor, from)) {
          which = 'end';
        }
        var point = this.findPoint(direction, regex, which, this.buildOptions(from));
        // [case-B]
        return point ? Point.min(point, [from.row, Infinity]) : this.getLastResortPoint(direction);
      } else {
        return this.findPoint(direction, regex, which, this.buildOptions(from)) || this.getLastResortPoint(direction);
      }
    }
  }, {
    key: 'buildOptions',
    value: function buildOptions(from) {
      return {
        from: from,
        skipEmptyRow: this.skipEmptyRow,
        skipWhiteSpaceOnlyRow: this.skipWhiteSpaceOnlyRow,
        preTranslate: this.which === 'end' && [0, +1] || undefined,
        postTranslate: this.which === 'end' && [0, -1] || undefined
      };
    }
  }, {
    key: 'getWordRegexForCursor',
    value: function getWordRegexForCursor(cursor) {
      if (this.name.endsWith('Subword')) {
        return cursor.subwordRegExp();
      }

      if (this.wordRegex) {
        return this.wordRegex;
      }

      if (this.getConfig('useLanguageIndependentNonWordCharacters')) {
        var nonWordCharacters = this._.escapeRegExp(this.utils.getNonWordCharactersForCursor(cursor));
        var source = '^[\\t\\r ]*$|[^\\s' + nonWordCharacters + ']+|[' + nonWordCharacters + ']+';
        return new RegExp(source, 'g');
      }
      return cursor.wordRegExp();
    }
  }], [{
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return MotionByWord;
})(Motion);

var MoveToNextWord = (function (_MotionByWord) {
  _inherits(MoveToNextWord, _MotionByWord);

  function MoveToNextWord() {
    _classCallCheck(this, MoveToNextWord);

    _get(Object.getPrototypeOf(MoveToNextWord.prototype), 'constructor', this).apply(this, arguments);

    this.direction = 'next';
    this.which = 'start';
  }

  // W
  return MoveToNextWord;
})(MotionByWord);

var MoveToNextWholeWord = (function (_MoveToNextWord) {
  _inherits(MoveToNextWholeWord, _MoveToNextWord);

  function MoveToNextWholeWord() {
    _classCallCheck(this, MoveToNextWholeWord);

    _get(Object.getPrototypeOf(MoveToNextWholeWord.prototype), 'constructor', this).apply(this, arguments);

    this.wordRegex = /^$|\S+/g;
  }

  // no-keymap
  return MoveToNextWholeWord;
})(MoveToNextWord);

var MoveToNextSubword = (function (_MoveToNextWord2) {
  _inherits(MoveToNextSubword, _MoveToNextWord2);

  function MoveToNextSubword() {
    _classCallCheck(this, MoveToNextSubword);

    _get(Object.getPrototypeOf(MoveToNextSubword.prototype), 'constructor', this).apply(this, arguments);
  }

  // no-keymap
  return MoveToNextSubword;
})(MoveToNextWord);

var MoveToNextSmartWord = (function (_MoveToNextWord3) {
  _inherits(MoveToNextSmartWord, _MoveToNextWord3);

  function MoveToNextSmartWord() {
    _classCallCheck(this, MoveToNextSmartWord);

    _get(Object.getPrototypeOf(MoveToNextSmartWord.prototype), 'constructor', this).apply(this, arguments);

    this.wordRegex = /[\w-]+/g;
  }

  // no-keymap
  return MoveToNextSmartWord;
})(MoveToNextWord);

var MoveToNextAlphanumericWord = (function (_MoveToNextWord4) {
  _inherits(MoveToNextAlphanumericWord, _MoveToNextWord4);

  function MoveToNextAlphanumericWord() {
    _classCallCheck(this, MoveToNextAlphanumericWord);

    _get(Object.getPrototypeOf(MoveToNextAlphanumericWord.prototype), 'constructor', this).apply(this, arguments);

    this.wordRegex = /\w+/g;
  }

  // b
  return MoveToNextAlphanumericWord;
})(MoveToNextWord);

var MoveToPreviousWord = (function (_MotionByWord2) {
  _inherits(MoveToPreviousWord, _MotionByWord2);

  function MoveToPreviousWord() {
    _classCallCheck(this, MoveToPreviousWord);

    _get(Object.getPrototypeOf(MoveToPreviousWord.prototype), 'constructor', this).apply(this, arguments);

    this.direction = 'previous';
    this.which = 'start';
    this.skipWhiteSpaceOnlyRow = true;
  }

  // B
  return MoveToPreviousWord;
})(MotionByWord);

var MoveToPreviousWholeWord = (function (_MoveToPreviousWord) {
  _inherits(MoveToPreviousWholeWord, _MoveToPreviousWord);

  function MoveToPreviousWholeWord() {
    _classCallCheck(this, MoveToPreviousWholeWord);

    _get(Object.getPrototypeOf(MoveToPreviousWholeWord.prototype), 'constructor', this).apply(this, arguments);

    this.wordRegex = /^$|\S+/g;
  }

  // no-keymap
  return MoveToPreviousWholeWord;
})(MoveToPreviousWord);

var MoveToPreviousSubword = (function (_MoveToPreviousWord2) {
  _inherits(MoveToPreviousSubword, _MoveToPreviousWord2);

  function MoveToPreviousSubword() {
    _classCallCheck(this, MoveToPreviousSubword);

    _get(Object.getPrototypeOf(MoveToPreviousSubword.prototype), 'constructor', this).apply(this, arguments);
  }

  // no-keymap
  return MoveToPreviousSubword;
})(MoveToPreviousWord);

var MoveToPreviousSmartWord = (function (_MoveToPreviousWord3) {
  _inherits(MoveToPreviousSmartWord, _MoveToPreviousWord3);

  function MoveToPreviousSmartWord() {
    _classCallCheck(this, MoveToPreviousSmartWord);

    _get(Object.getPrototypeOf(MoveToPreviousSmartWord.prototype), 'constructor', this).apply(this, arguments);

    this.wordRegex = /[\w-]+/;
  }

  // no-keymap
  return MoveToPreviousSmartWord;
})(MoveToPreviousWord);

var MoveToPreviousAlphanumericWord = (function (_MoveToPreviousWord4) {
  _inherits(MoveToPreviousAlphanumericWord, _MoveToPreviousWord4);

  function MoveToPreviousAlphanumericWord() {
    _classCallCheck(this, MoveToPreviousAlphanumericWord);

    _get(Object.getPrototypeOf(MoveToPreviousAlphanumericWord.prototype), 'constructor', this).apply(this, arguments);

    this.wordRegex = /\w+/;
  }

  // e
  return MoveToPreviousAlphanumericWord;
})(MoveToPreviousWord);

var MoveToEndOfWord = (function (_MotionByWord3) {
  _inherits(MoveToEndOfWord, _MotionByWord3);

  function MoveToEndOfWord() {
    _classCallCheck(this, MoveToEndOfWord);

    _get(Object.getPrototypeOf(MoveToEndOfWord.prototype), 'constructor', this).apply(this, arguments);

    this.inclusive = true;
    this.direction = 'next';
    this.which = 'end';
    this.skipEmptyRow = true;
    this.skipWhiteSpaceOnlyRow = true;
  }

  // E
  return MoveToEndOfWord;
})(MotionByWord);

var MoveToEndOfWholeWord = (function (_MoveToEndOfWord) {
  _inherits(MoveToEndOfWholeWord, _MoveToEndOfWord);

  function MoveToEndOfWholeWord() {
    _classCallCheck(this, MoveToEndOfWholeWord);

    _get(Object.getPrototypeOf(MoveToEndOfWholeWord.prototype), 'constructor', this).apply(this, arguments);

    this.wordRegex = /\S+/g;
  }

  // no-keymap
  return MoveToEndOfWholeWord;
})(MoveToEndOfWord);

var MoveToEndOfSubword = (function (_MoveToEndOfWord2) {
  _inherits(MoveToEndOfSubword, _MoveToEndOfWord2);

  function MoveToEndOfSubword() {
    _classCallCheck(this, MoveToEndOfSubword);

    _get(Object.getPrototypeOf(MoveToEndOfSubword.prototype), 'constructor', this).apply(this, arguments);
  }

  // no-keymap
  return MoveToEndOfSubword;
})(MoveToEndOfWord);

var MoveToEndOfSmartWord = (function (_MoveToEndOfWord3) {
  _inherits(MoveToEndOfSmartWord, _MoveToEndOfWord3);

  function MoveToEndOfSmartWord() {
    _classCallCheck(this, MoveToEndOfSmartWord);

    _get(Object.getPrototypeOf(MoveToEndOfSmartWord.prototype), 'constructor', this).apply(this, arguments);

    this.wordRegex = /[\w-]+/g;
  }

  // no-keymap
  return MoveToEndOfSmartWord;
})(MoveToEndOfWord);

var MoveToEndOfAlphanumericWord = (function (_MoveToEndOfWord4) {
  _inherits(MoveToEndOfAlphanumericWord, _MoveToEndOfWord4);

  function MoveToEndOfAlphanumericWord() {
    _classCallCheck(this, MoveToEndOfAlphanumericWord);

    _get(Object.getPrototypeOf(MoveToEndOfAlphanumericWord.prototype), 'constructor', this).apply(this, arguments);

    this.wordRegex = /\w+/g;
  }

  // ge
  return MoveToEndOfAlphanumericWord;
})(MoveToEndOfWord);

var MoveToPreviousEndOfWord = (function (_MotionByWord4) {
  _inherits(MoveToPreviousEndOfWord, _MotionByWord4);

  function MoveToPreviousEndOfWord() {
    _classCallCheck(this, MoveToPreviousEndOfWord);

    _get(Object.getPrototypeOf(MoveToPreviousEndOfWord.prototype), 'constructor', this).apply(this, arguments);

    this.inclusive = true;
    this.direction = 'previous';
    this.which = 'end';
    this.skipWhiteSpaceOnlyRow = true;
  }

  // gE
  return MoveToPreviousEndOfWord;
})(MotionByWord);

var MoveToPreviousEndOfWholeWord = (function (_MoveToPreviousEndOfWord) {
  _inherits(MoveToPreviousEndOfWholeWord, _MoveToPreviousEndOfWord);

  function MoveToPreviousEndOfWholeWord() {
    _classCallCheck(this, MoveToPreviousEndOfWholeWord);

    _get(Object.getPrototypeOf(MoveToPreviousEndOfWholeWord.prototype), 'constructor', this).apply(this, arguments);

    this.wordRegex = /\S+/g;
  }

  // Sentence
  // -------------------------
  // Sentence is defined as below
  //  - end with ['.', '!', '?']
  //  - optionally followed by [')', ']', '"', "'"]
  //  - followed by ['$', ' ', '\t']
  //  - paragraph boundary is also sentence boundary
  //  - section boundary is also sentence boundary(ignore)
  return MoveToPreviousEndOfWholeWord;
})(MoveToPreviousEndOfWord);

var MoveToNextSentence = (function (_Motion9) {
  _inherits(MoveToNextSentence, _Motion9);

  function MoveToNextSentence() {
    _classCallCheck(this, MoveToNextSentence);

    _get(Object.getPrototypeOf(MoveToNextSentence.prototype), 'constructor', this).apply(this, arguments);

    this.jump = true;
    this.sentenceRegex = new RegExp('(?:[\\.!\\?][\\)\\]"\']*\\s+)|(\\n|\\r\\n)', 'g');
    this.direction = 'next';
  }

  _createClass(MoveToNextSentence, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var _this10 = this;

      this.moveCursorCountTimes(cursor, function () {
        var point = _this10.direction === 'next' ? _this10.getNextStartOfSentence(cursor.getBufferPosition()) : _this10.getPreviousStartOfSentence(cursor.getBufferPosition());
        cursor.setBufferPosition(point || _this10.getLastResortPoint(_this10.direction));
      });
    }
  }, {
    key: 'isBlankRow',
    value: function isBlankRow(row) {
      return this.editor.isBufferRowBlank(row);
    }
  }, {
    key: 'getNextStartOfSentence',
    value: function getNextStartOfSentence(from) {
      var _this11 = this;

      return this.findInEditor('forward', this.sentenceRegex, { from: from }, function (_ref) {
        var range = _ref.range;
        var match = _ref.match;

        if (match[1] != null) {
          var startRow = range.start.row;
          var endRow = range.end.row;

          if (_this11.skipBlankRow && _this11.isBlankRow(endRow)) return;
          if (_this11.isBlankRow(startRow) !== _this11.isBlankRow(endRow)) {
            return _this11.getFirstCharacterPositionForBufferRow(endRow);
          }
        } else {
          return range.end;
        }
      });
    }
  }, {
    key: 'getPreviousStartOfSentence',
    value: function getPreviousStartOfSentence(from) {
      var _this12 = this;

      return this.findInEditor('backward', this.sentenceRegex, { from: from }, function (_ref2) {
        var range = _ref2.range;
        var match = _ref2.match;

        if (match[1] != null) {
          var startRow = range.start.row;
          var endRow = range.end.row;

          if (!_this12.isBlankRow(endRow) && _this12.isBlankRow(startRow)) {
            var point = _this12.getFirstCharacterPositionForBufferRow(endRow);
            if (point.isLessThan(from)) return point;else if (!_this12.skipBlankRow) return _this12.getFirstCharacterPositionForBufferRow(startRow);
          }
        } else if (range.end.isLessThan(from)) {
          return range.end;
        }
      });
    }
  }]);

  return MoveToNextSentence;
})(Motion);

var MoveToPreviousSentence = (function (_MoveToNextSentence) {
  _inherits(MoveToPreviousSentence, _MoveToNextSentence);

  function MoveToPreviousSentence() {
    _classCallCheck(this, MoveToPreviousSentence);

    _get(Object.getPrototypeOf(MoveToPreviousSentence.prototype), 'constructor', this).apply(this, arguments);

    this.direction = 'previous';
  }

  return MoveToPreviousSentence;
})(MoveToNextSentence);

var MoveToNextSentenceSkipBlankRow = (function (_MoveToNextSentence2) {
  _inherits(MoveToNextSentenceSkipBlankRow, _MoveToNextSentence2);

  function MoveToNextSentenceSkipBlankRow() {
    _classCallCheck(this, MoveToNextSentenceSkipBlankRow);

    _get(Object.getPrototypeOf(MoveToNextSentenceSkipBlankRow.prototype), 'constructor', this).apply(this, arguments);

    this.skipBlankRow = true;
  }

  return MoveToNextSentenceSkipBlankRow;
})(MoveToNextSentence);

var MoveToPreviousSentenceSkipBlankRow = (function (_MoveToPreviousSentence) {
  _inherits(MoveToPreviousSentenceSkipBlankRow, _MoveToPreviousSentence);

  function MoveToPreviousSentenceSkipBlankRow() {
    _classCallCheck(this, MoveToPreviousSentenceSkipBlankRow);

    _get(Object.getPrototypeOf(MoveToPreviousSentenceSkipBlankRow.prototype), 'constructor', this).apply(this, arguments);

    this.skipBlankRow = true;
  }

  // Paragraph
  // -------------------------
  return MoveToPreviousSentenceSkipBlankRow;
})(MoveToPreviousSentence);

var MoveToNextParagraph = (function (_Motion10) {
  _inherits(MoveToNextParagraph, _Motion10);

  function MoveToNextParagraph() {
    _classCallCheck(this, MoveToNextParagraph);

    _get(Object.getPrototypeOf(MoveToNextParagraph.prototype), 'constructor', this).apply(this, arguments);

    this.jump = true;
    this.direction = 'next';
  }

  _createClass(MoveToNextParagraph, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var _this13 = this;

      this.moveCursorCountTimes(cursor, function () {
        var point = _this13.getPoint(cursor.getBufferPosition());
        cursor.setBufferPosition(point || _this13.getLastResortPoint(_this13.direction));
      });
    }
  }, {
    key: 'getPoint',
    value: function getPoint(from) {
      var wasBlankRow = this.editor.isBufferRowBlank(from.row);
      var rows = this.getBufferRows({ startRow: from.row, direction: this.direction });
      for (var row of rows) {
        var isBlankRow = this.editor.isBufferRowBlank(row);
        if (!wasBlankRow && isBlankRow) {
          return [row, 0];
        }
        wasBlankRow = isBlankRow;
      }
    }
  }]);

  return MoveToNextParagraph;
})(Motion);

var MoveToPreviousParagraph = (function (_MoveToNextParagraph) {
  _inherits(MoveToPreviousParagraph, _MoveToNextParagraph);

  function MoveToPreviousParagraph() {
    _classCallCheck(this, MoveToPreviousParagraph);

    _get(Object.getPrototypeOf(MoveToPreviousParagraph.prototype), 'constructor', this).apply(this, arguments);

    this.direction = 'previous';
  }

  return MoveToPreviousParagraph;
})(MoveToNextParagraph);

var MoveToNextDiffHunk = (function (_Motion11) {
  _inherits(MoveToNextDiffHunk, _Motion11);

  function MoveToNextDiffHunk() {
    _classCallCheck(this, MoveToNextDiffHunk);

    _get(Object.getPrototypeOf(MoveToNextDiffHunk.prototype), 'constructor', this).apply(this, arguments);

    this.jump = true;
    this.direction = 'next';
  }

  _createClass(MoveToNextDiffHunk, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var _this14 = this;

      this.moveCursorCountTimes(cursor, function () {
        var point = _this14.getPoint(cursor.getBufferPosition());
        if (point) cursor.setBufferPosition(point);
      });
    }
  }, {
    key: 'getPoint',
    value: function getPoint(from) {
      var _this15 = this;

      var getHunkRange = function getHunkRange(row) {
        return _this15.utils.getHunkRangeAtBufferRow(_this15.editor, row);
      };
      var hunkRange = getHunkRange(from.row);
      return this.findInEditor(this.direction, /^[+-]/g, { from: from }, function (_ref3) {
        var range = _ref3.range;

        if (hunkRange && hunkRange.containsPoint(range.start)) return;

        return getHunkRange(range.start.row).start;
      });
    }
  }]);

  return MoveToNextDiffHunk;
})(Motion);

var MoveToPreviousDiffHunk = (function (_MoveToNextDiffHunk) {
  _inherits(MoveToPreviousDiffHunk, _MoveToNextDiffHunk);

  function MoveToPreviousDiffHunk() {
    _classCallCheck(this, MoveToPreviousDiffHunk);

    _get(Object.getPrototypeOf(MoveToPreviousDiffHunk.prototype), 'constructor', this).apply(this, arguments);

    this.direction = 'previous';
  }

  // -------------------------
  // keymap: 0
  return MoveToPreviousDiffHunk;
})(MoveToNextDiffHunk);

var MoveToBeginningOfLine = (function (_Motion12) {
  _inherits(MoveToBeginningOfLine, _Motion12);

  function MoveToBeginningOfLine() {
    _classCallCheck(this, MoveToBeginningOfLine);

    _get(Object.getPrototypeOf(MoveToBeginningOfLine.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(MoveToBeginningOfLine, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      this.utils.setBufferColumn(cursor, 0);
    }
  }]);

  return MoveToBeginningOfLine;
})(Motion);

var MoveToColumn = (function (_Motion13) {
  _inherits(MoveToColumn, _Motion13);

  function MoveToColumn() {
    _classCallCheck(this, MoveToColumn);

    _get(Object.getPrototypeOf(MoveToColumn.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(MoveToColumn, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      this.utils.setBufferColumn(cursor, this.getCount() - 1);
    }
  }]);

  return MoveToColumn;
})(Motion);

var MoveToLastCharacterOfLine = (function (_Motion14) {
  _inherits(MoveToLastCharacterOfLine, _Motion14);

  function MoveToLastCharacterOfLine() {
    _classCallCheck(this, MoveToLastCharacterOfLine);

    _get(Object.getPrototypeOf(MoveToLastCharacterOfLine.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(MoveToLastCharacterOfLine, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var row = this.getValidVimBufferRow(cursor.getBufferRow() + this.getCount() - 1);
      cursor.setBufferPosition([row, Infinity]);
      cursor.goalColumn = Infinity;
    }
  }]);

  return MoveToLastCharacterOfLine;
})(Motion);

var MoveToLastNonblankCharacterOfLineAndDown = (function (_Motion15) {
  _inherits(MoveToLastNonblankCharacterOfLineAndDown, _Motion15);

  function MoveToLastNonblankCharacterOfLineAndDown() {
    _classCallCheck(this, MoveToLastNonblankCharacterOfLineAndDown);

    _get(Object.getPrototypeOf(MoveToLastNonblankCharacterOfLineAndDown.prototype), 'constructor', this).apply(this, arguments);

    this.inclusive = true;
  }

  // MoveToFirstCharacterOfLine faimily
  // ------------------------------------
  // ^

  _createClass(MoveToLastNonblankCharacterOfLineAndDown, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var row = this.limitNumber(cursor.getBufferRow() + this.getCount() - 1, { max: this.getVimLastBufferRow() });
      var options = { from: [row, Infinity], allowNextLine: false };
      var point = this.findInEditor('backward', /\S|^/, options, function (event) {
        return event.range.start;
      });
      cursor.setBufferPosition(point);
    }
  }]);

  return MoveToLastNonblankCharacterOfLineAndDown;
})(Motion);

var MoveToFirstCharacterOfLine = (function (_Motion16) {
  _inherits(MoveToFirstCharacterOfLine, _Motion16);

  function MoveToFirstCharacterOfLine() {
    _classCallCheck(this, MoveToFirstCharacterOfLine);

    _get(Object.getPrototypeOf(MoveToFirstCharacterOfLine.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(MoveToFirstCharacterOfLine, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      cursor.setBufferPosition(this.getFirstCharacterPositionForBufferRow(cursor.getBufferRow()));
    }
  }]);

  return MoveToFirstCharacterOfLine;
})(Motion);

var MoveToFirstCharacterOfLineUp = (function (_MoveToFirstCharacterOfLine) {
  _inherits(MoveToFirstCharacterOfLineUp, _MoveToFirstCharacterOfLine);

  function MoveToFirstCharacterOfLineUp() {
    _classCallCheck(this, MoveToFirstCharacterOfLineUp);

    _get(Object.getPrototypeOf(MoveToFirstCharacterOfLineUp.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'linewise';
  }

  _createClass(MoveToFirstCharacterOfLineUp, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var _this16 = this;

      this.moveCursorCountTimes(cursor, function () {
        var row = _this16.getValidVimBufferRow(cursor.getBufferRow() - 1);
        cursor.setBufferPosition([row, 0]);
      });
      _get(Object.getPrototypeOf(MoveToFirstCharacterOfLineUp.prototype), 'moveCursor', this).call(this, cursor);
    }
  }]);

  return MoveToFirstCharacterOfLineUp;
})(MoveToFirstCharacterOfLine);

var MoveToFirstCharacterOfLineDown = (function (_MoveToFirstCharacterOfLine2) {
  _inherits(MoveToFirstCharacterOfLineDown, _MoveToFirstCharacterOfLine2);

  function MoveToFirstCharacterOfLineDown() {
    _classCallCheck(this, MoveToFirstCharacterOfLineDown);

    _get(Object.getPrototypeOf(MoveToFirstCharacterOfLineDown.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'linewise';
  }

  _createClass(MoveToFirstCharacterOfLineDown, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var _this17 = this;

      this.moveCursorCountTimes(cursor, function () {
        var point = cursor.getBufferPosition();
        if (point.row < _this17.getVimLastBufferRow()) {
          cursor.setBufferPosition(point.translate([+1, 0]));
        }
      });
      _get(Object.getPrototypeOf(MoveToFirstCharacterOfLineDown.prototype), 'moveCursor', this).call(this, cursor);
    }
  }]);

  return MoveToFirstCharacterOfLineDown;
})(MoveToFirstCharacterOfLine);

var MoveToFirstCharacterOfLineAndDown = (function (_MoveToFirstCharacterOfLineDown) {
  _inherits(MoveToFirstCharacterOfLineAndDown, _MoveToFirstCharacterOfLineDown);

  function MoveToFirstCharacterOfLineAndDown() {
    _classCallCheck(this, MoveToFirstCharacterOfLineAndDown);

    _get(Object.getPrototypeOf(MoveToFirstCharacterOfLineAndDown.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(MoveToFirstCharacterOfLineAndDown, [{
    key: 'getCount',
    value: function getCount() {
      return _get(Object.getPrototypeOf(MoveToFirstCharacterOfLineAndDown.prototype), 'getCount', this).call(this) - 1;
    }
  }]);

  return MoveToFirstCharacterOfLineAndDown;
})(MoveToFirstCharacterOfLineDown);

var MoveToScreenColumn = (function (_Motion17) {
  _inherits(MoveToScreenColumn, _Motion17);

  function MoveToScreenColumn() {
    _classCallCheck(this, MoveToScreenColumn);

    _get(Object.getPrototypeOf(MoveToScreenColumn.prototype), 'constructor', this).apply(this, arguments);
  }

  // keymap: g 0

  _createClass(MoveToScreenColumn, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var point = this.utils.getScreenPositionForScreenRow(this.editor, cursor.getScreenRow(), this.which, {
        allowOffScreenPosition: this.getConfig('allowMoveToOffScreenColumnOnScreenLineMotion')
      });
      if (point) cursor.setScreenPosition(point);
    }
  }], [{
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return MoveToScreenColumn;
})(Motion);

var MoveToBeginningOfScreenLine = (function (_MoveToScreenColumn) {
  _inherits(MoveToBeginningOfScreenLine, _MoveToScreenColumn);

  function MoveToBeginningOfScreenLine() {
    _classCallCheck(this, MoveToBeginningOfScreenLine);

    _get(Object.getPrototypeOf(MoveToBeginningOfScreenLine.prototype), 'constructor', this).apply(this, arguments);

    this.which = 'beginning';
  }

  // g ^: `move-to-first-character-of-screen-line`
  return MoveToBeginningOfScreenLine;
})(MoveToScreenColumn);

var MoveToFirstCharacterOfScreenLine = (function (_MoveToScreenColumn2) {
  _inherits(MoveToFirstCharacterOfScreenLine, _MoveToScreenColumn2);

  function MoveToFirstCharacterOfScreenLine() {
    _classCallCheck(this, MoveToFirstCharacterOfScreenLine);

    _get(Object.getPrototypeOf(MoveToFirstCharacterOfScreenLine.prototype), 'constructor', this).apply(this, arguments);

    this.which = 'first-character';
  }

  // keymap: g $
  return MoveToFirstCharacterOfScreenLine;
})(MoveToScreenColumn);

var MoveToLastCharacterOfScreenLine = (function (_MoveToScreenColumn3) {
  _inherits(MoveToLastCharacterOfScreenLine, _MoveToScreenColumn3);

  function MoveToLastCharacterOfScreenLine() {
    _classCallCheck(this, MoveToLastCharacterOfScreenLine);

    _get(Object.getPrototypeOf(MoveToLastCharacterOfScreenLine.prototype), 'constructor', this).apply(this, arguments);

    this.which = 'last-character';
  }

  // keymap: g g
  return MoveToLastCharacterOfScreenLine;
})(MoveToScreenColumn);

var MoveToFirstLine = (function (_Motion18) {
  _inherits(MoveToFirstLine, _Motion18);

  function MoveToFirstLine() {
    _classCallCheck(this, MoveToFirstLine);

    _get(Object.getPrototypeOf(MoveToFirstLine.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'linewise';
    this.jump = true;
    this.verticalMotion = true;
    this.moveSuccessOnLinewise = true;
  }

  // keymap: G

  _createClass(MoveToFirstLine, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      this.setCursorBufferRow(cursor, this.getValidVimBufferRow(this.getRow()));
      cursor.autoscroll({ center: true });
    }
  }, {
    key: 'getRow',
    value: function getRow() {
      return this.getCount() - 1;
    }
  }]);

  return MoveToFirstLine;
})(Motion);

var MoveToLastLine = (function (_MoveToFirstLine) {
  _inherits(MoveToLastLine, _MoveToFirstLine);

  function MoveToLastLine() {
    _classCallCheck(this, MoveToLastLine);

    _get(Object.getPrototypeOf(MoveToLastLine.prototype), 'constructor', this).apply(this, arguments);

    this.defaultCount = Infinity;
  }

  // keymap: N% e.g. 10%
  return MoveToLastLine;
})(MoveToFirstLine);

var MoveToLineByPercent = (function (_MoveToFirstLine2) {
  _inherits(MoveToLineByPercent, _MoveToFirstLine2);

  function MoveToLineByPercent() {
    _classCallCheck(this, MoveToLineByPercent);

    _get(Object.getPrototypeOf(MoveToLineByPercent.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(MoveToLineByPercent, [{
    key: 'getRow',
    value: function getRow() {
      var percent = this.limitNumber(this.getCount(), { max: 100 });
      return Math.floor(this.getVimLastBufferRow() * (percent / 100));
    }
  }]);

  return MoveToLineByPercent;
})(MoveToFirstLine);

var MoveToRelativeLine = (function (_Motion19) {
  _inherits(MoveToRelativeLine, _Motion19);

  function MoveToRelativeLine() {
    _classCallCheck(this, MoveToRelativeLine);

    _get(Object.getPrototypeOf(MoveToRelativeLine.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'linewise';
    this.moveSuccessOnLinewise = true;
  }

  _createClass(MoveToRelativeLine, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var row = undefined;
      var count = this.getCount();
      if (count < 0) {
        // Support negative count
        // Negative count can be passed like `operationStack.run("MoveToRelativeLine", {count: -5})`.
        // Currently used in vim-mode-plus-ex-mode pkg.
        while (count++ < 0) {
          row = this.getFoldStartRowForRow(row == null ? cursor.getBufferRow() : row - 1);
          if (row <= 0) break;
        }
      } else {
        var maxRow = this.getVimLastBufferRow();
        while (count-- > 0) {
          row = this.getFoldEndRowForRow(row == null ? cursor.getBufferRow() : row + 1);
          if (row >= maxRow) break;
        }
      }
      this.utils.setBufferRow(cursor, row);
    }
  }], [{
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return MoveToRelativeLine;
})(Motion);

var MoveToRelativeLineMinimumTwo = (function (_MoveToRelativeLine) {
  _inherits(MoveToRelativeLineMinimumTwo, _MoveToRelativeLine);

  function MoveToRelativeLineMinimumTwo() {
    _classCallCheck(this, MoveToRelativeLineMinimumTwo);

    _get(Object.getPrototypeOf(MoveToRelativeLineMinimumTwo.prototype), 'constructor', this).apply(this, arguments);
  }

  // Position cursor without scrolling., H, M, L
  // -------------------------
  // keymap: H

  _createClass(MoveToRelativeLineMinimumTwo, [{
    key: 'getCount',
    value: function getCount() {
      return this.limitNumber(_get(Object.getPrototypeOf(MoveToRelativeLineMinimumTwo.prototype), 'getCount', this).call(this), { min: 2 });
    }
  }], [{
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return MoveToRelativeLineMinimumTwo;
})(MoveToRelativeLine);

var MoveToTopOfScreen = (function (_Motion20) {
  _inherits(MoveToTopOfScreen, _Motion20);

  function MoveToTopOfScreen() {
    _classCallCheck(this, MoveToTopOfScreen);

    _get(Object.getPrototypeOf(MoveToTopOfScreen.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'linewise';
    this.jump = true;
    this.defaultCount = 0;
    this.verticalMotion = true;
  }

  _createClass(MoveToTopOfScreen, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var bufferRow = this.editor.bufferRowForScreenRow(this.getScreenRow());
      this.setCursorBufferRow(cursor, bufferRow);
    }
  }, {
    key: 'getScreenRow',
    value: function getScreenRow() {
      var firstVisibleRow = this.editor.getFirstVisibleScreenRow();
      var lastVisibleRow = this.limitNumber(this.editor.getLastVisibleScreenRow(), { max: this.getVimLastScreenRow() });

      var baseOffset = 2;
      if (this.name === 'MoveToTopOfScreen') {
        var offset = firstVisibleRow === 0 ? 0 : baseOffset;
        var count = this.getCount() - 1;
        return this.limitNumber(firstVisibleRow + count, { min: firstVisibleRow + offset, max: lastVisibleRow });
      } else if (this.name === 'MoveToMiddleOfScreen') {
        return firstVisibleRow + Math.floor((lastVisibleRow - firstVisibleRow) / 2);
      } else if (this.name === 'MoveToBottomOfScreen') {
        var offset = lastVisibleRow === this.getVimLastScreenRow() ? 0 : baseOffset + 1;
        var count = this.getCount() - 1;
        return this.limitNumber(lastVisibleRow - count, { min: firstVisibleRow, max: lastVisibleRow - offset });
      }
    }
  }]);

  return MoveToTopOfScreen;
})(Motion);

var MoveToMiddleOfScreen = (function (_MoveToTopOfScreen) {
  _inherits(MoveToMiddleOfScreen, _MoveToTopOfScreen);

  function MoveToMiddleOfScreen() {
    _classCallCheck(this, MoveToMiddleOfScreen);

    _get(Object.getPrototypeOf(MoveToMiddleOfScreen.prototype), 'constructor', this).apply(this, arguments);
  }

  // keymap: M
  return MoveToMiddleOfScreen;
})(MoveToTopOfScreen);

var MoveToBottomOfScreen = (function (_MoveToTopOfScreen2) {
  _inherits(MoveToBottomOfScreen, _MoveToTopOfScreen2);

  function MoveToBottomOfScreen() {
    _classCallCheck(this, MoveToBottomOfScreen);

    _get(Object.getPrototypeOf(MoveToBottomOfScreen.prototype), 'constructor', this).apply(this, arguments);
  }

  // keymap: L

  // Scrolling
  // Half: ctrl-d, ctrl-u
  // Full: ctrl-f, ctrl-b
  // -------------------------
  // [FIXME] count behave differently from original Vim.
  return MoveToBottomOfScreen;
})(MoveToTopOfScreen);

var Scroll = (function (_Motion21) {
  _inherits(Scroll, _Motion21);

  function Scroll() {
    _classCallCheck(this, Scroll);

    _get(Object.getPrototypeOf(Scroll.prototype), 'constructor', this).apply(this, arguments);

    this.verticalMotion = true;
  }

  _createClass(Scroll, [{
    key: 'execute',
    value: function execute() {
      var amountOfPage = this.constructor.amountOfPageByName[this.name];
      var amountOfScreenRows = Math.trunc(amountOfPage * this.editor.getRowsPerPage() * this.getCount());
      this.amountOfPixels = amountOfScreenRows * this.editor.getLineHeightInPixels();

      _get(Object.getPrototypeOf(Scroll.prototype), 'execute', this).call(this);

      this.vimState.requestScroll({
        amountOfPixels: this.amountOfPixels,
        duration: this.getSmoothScrollDuation((Math.abs(amountOfPage) === 1 ? 'Full' : 'Half') + 'ScrollMotion')
      });
    }
  }, {
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var cursorPixel = this.editorElement.pixelPositionForScreenPosition(cursor.getScreenPosition());
      cursorPixel.top += this.amountOfPixels;
      var screenPosition = this.editorElement.screenPositionForPixelPosition(cursorPixel);
      var screenRow = this.getValidVimScreenRow(screenPosition.row);
      this.setCursorBufferRow(cursor, this.editor.bufferRowForScreenRow(screenRow), { autoscroll: false });
    }
  }], [{
    key: 'command',
    value: false,
    enumerable: true
  }, {
    key: 'scrollTask',
    value: null,
    enumerable: true
  }, {
    key: 'amountOfPageByName',
    value: {
      ScrollFullScreenDown: 1,
      ScrollFullScreenUp: -1,
      ScrollHalfScreenDown: 0.5,
      ScrollHalfScreenUp: -0.5,
      ScrollQuarterScreenDown: 0.25,
      ScrollQuarterScreenUp: -0.25
    },
    enumerable: true
  }]);

  return Scroll;
})(Motion);

var ScrollFullScreenDown = (function (_Scroll) {
  _inherits(ScrollFullScreenDown, _Scroll);

  function ScrollFullScreenDown() {
    _classCallCheck(this, ScrollFullScreenDown);

    _get(Object.getPrototypeOf(ScrollFullScreenDown.prototype), 'constructor', this).apply(this, arguments);
  }

  // ctrl-f
  return ScrollFullScreenDown;
})(Scroll);

var ScrollFullScreenUp = (function (_Scroll2) {
  _inherits(ScrollFullScreenUp, _Scroll2);

  function ScrollFullScreenUp() {
    _classCallCheck(this, ScrollFullScreenUp);

    _get(Object.getPrototypeOf(ScrollFullScreenUp.prototype), 'constructor', this).apply(this, arguments);
  }

  // ctrl-b
  return ScrollFullScreenUp;
})(Scroll);

var ScrollHalfScreenDown = (function (_Scroll3) {
  _inherits(ScrollHalfScreenDown, _Scroll3);

  function ScrollHalfScreenDown() {
    _classCallCheck(this, ScrollHalfScreenDown);

    _get(Object.getPrototypeOf(ScrollHalfScreenDown.prototype), 'constructor', this).apply(this, arguments);
  }

  // ctrl-d
  return ScrollHalfScreenDown;
})(Scroll);

var ScrollHalfScreenUp = (function (_Scroll4) {
  _inherits(ScrollHalfScreenUp, _Scroll4);

  function ScrollHalfScreenUp() {
    _classCallCheck(this, ScrollHalfScreenUp);

    _get(Object.getPrototypeOf(ScrollHalfScreenUp.prototype), 'constructor', this).apply(this, arguments);
  }

  // ctrl-u
  return ScrollHalfScreenUp;
})(Scroll);

var ScrollQuarterScreenDown = (function (_Scroll5) {
  _inherits(ScrollQuarterScreenDown, _Scroll5);

  function ScrollQuarterScreenDown() {
    _classCallCheck(this, ScrollQuarterScreenDown);

    _get(Object.getPrototypeOf(ScrollQuarterScreenDown.prototype), 'constructor', this).apply(this, arguments);
  }

  // g ctrl-d
  return ScrollQuarterScreenDown;
})(Scroll);

var ScrollQuarterScreenUp = (function (_Scroll6) {
  _inherits(ScrollQuarterScreenUp, _Scroll6);

  function ScrollQuarterScreenUp() {
    _classCallCheck(this, ScrollQuarterScreenUp);

    _get(Object.getPrototypeOf(ScrollQuarterScreenUp.prototype), 'constructor', this).apply(this, arguments);
  }

  // g ctrl-u

  // Find
  // -------------------------
  // keymap: f
  return ScrollQuarterScreenUp;
})(Scroll);

var Find = (function (_Motion22) {
  _inherits(Find, _Motion22);

  function Find() {
    _classCallCheck(this, Find);

    _get(Object.getPrototypeOf(Find.prototype), 'constructor', this).apply(this, arguments);

    this.backwards = false;
    this.inclusive = true;
    this.offset = 0;
    this.requireInput = true;
    this.caseSensitivityKind = 'Find';
  }

  // keymap: F

  _createClass(Find, [{
    key: 'restoreEditorState',
    value: function restoreEditorState() {
      if (this._restoreEditorState) this._restoreEditorState();
      this._restoreEditorState = null;
    }
  }, {
    key: 'cancelOperation',
    value: function cancelOperation() {
      this.restoreEditorState();
      _get(Object.getPrototypeOf(Find.prototype), 'cancelOperation', this).call(this);
    }
  }, {
    key: 'initialize',
    value: function initialize() {
      var _this18 = this;

      if (this.getConfig('reuseFindForRepeatFind')) this.repeatIfNecessary();

      if (!this.repeated) {
        var charsMax = this.getConfig('findCharsMax');
        var optionsBase = { purpose: 'find', charsMax: charsMax };

        if (charsMax === 1) {
          this.focusInput(optionsBase);
        } else {
          this._restoreEditorState = this.utils.saveEditorState(this.editor);
          var options = {
            autoConfirmTimeout: this.getConfig('findConfirmByTimeout'),
            onConfirm: function onConfirm(input) {
              _this18.input = input;
              if (input) _this18.processOperation();else _this18.cancelOperation();
            },
            onChange: function onChange(preConfirmedChars) {
              _this18.preConfirmedChars = preConfirmedChars;
              _this18.highlightTextInCursorRows(_this18.preConfirmedChars, 'pre-confirm', _this18.isBackwards());
            },
            onCancel: function onCancel() {
              _this18.vimState.highlightFind.clearMarkers();
              _this18.cancelOperation();
            },
            commands: {
              'vim-mode-plus:find-next-pre-confirmed': function vimModePlusFindNextPreConfirmed() {
                return _this18.findPreConfirmed(+1);
              },
              'vim-mode-plus:find-previous-pre-confirmed': function vimModePlusFindPreviousPreConfirmed() {
                return _this18.findPreConfirmed(-1);
              }
            }
          };
          this.focusInput(Object.assign(options, optionsBase));
        }
      }
      _get(Object.getPrototypeOf(Find.prototype), 'initialize', this).call(this);
    }
  }, {
    key: 'findPreConfirmed',
    value: function findPreConfirmed(delta) {
      if (this.preConfirmedChars && this.getConfig('highlightFindChar')) {
        var index = this.highlightTextInCursorRows(this.preConfirmedChars, 'pre-confirm', this.isBackwards(), this.getCount() - 1 + delta, true);
        this.count = index + 1;
      }
    }
  }, {
    key: 'repeatIfNecessary',
    value: function repeatIfNecessary() {
      var findCommandNames = ['Find', 'FindBackwards', 'Till', 'TillBackwards'];
      var currentFind = this.globalState.get('currentFind');
      if (currentFind && findCommandNames.includes(this.vimState.operationStack.getLastCommandName())) {
        this.input = currentFind.input;
        this.repeated = true;
      }
    }
  }, {
    key: 'isBackwards',
    value: function isBackwards() {
      return this.backwards;
    }
  }, {
    key: 'execute',
    value: function execute() {
      var _this19 = this;

      _get(Object.getPrototypeOf(Find.prototype), 'execute', this).call(this);
      var decorationType = 'post-confirm';
      if (this.operator && !this.operator['instanceof']('SelectBase')) {
        decorationType += ' long';
      }

      // HACK: When repeated by ",", this.backwards is temporary inverted and
      // restored after execution finished.
      // But final highlightTextInCursorRows is executed in async(=after operation finished).
      // Thus we need to preserve before restored `backwards` value and pass it.
      var backwards = this.isBackwards();
      this.editor.component.getNextUpdatePromise().then(function () {
        _this19.highlightTextInCursorRows(_this19.input, decorationType, backwards);
      });
    }
  }, {
    key: 'getPoint',
    value: function getPoint(fromPoint) {
      var scanRange = this.editor.bufferRangeForBufferRow(fromPoint.row);
      var points = [];
      var regex = this.getRegex(this.input);
      var indexWantAccess = this.getCount() - 1;

      var translation = new Point(0, this.isBackwards() ? this.offset : -this.offset);
      if (this.repeated) {
        fromPoint = fromPoint.translate(translation.negate());
      }

      if (this.isBackwards()) {
        if (this.getConfig('findAcrossLines')) scanRange.start = Point.ZERO;

        this.editor.backwardsScanInBufferRange(regex, scanRange, function (_ref4) {
          var range = _ref4.range;
          var stop = _ref4.stop;

          if (range.start.isLessThan(fromPoint)) {
            points.push(range.start);
            if (points.length > indexWantAccess) stop();
          }
        });
      } else {
        if (this.getConfig('findAcrossLines')) scanRange.end = this.editor.getEofBufferPosition();

        this.editor.scanInBufferRange(regex, scanRange, function (_ref5) {
          var range = _ref5.range;
          var stop = _ref5.stop;

          if (range.start.isGreaterThan(fromPoint)) {
            points.push(range.start);
            if (points.length > indexWantAccess) stop();
          }
        });
      }

      var point = points[indexWantAccess];
      if (point) return point.translate(translation);
    }

    // FIXME: bad naming, this function must return index
  }, {
    key: 'highlightTextInCursorRows',
    value: function highlightTextInCursorRows(text, decorationType, backwards) {
      var index = arguments.length <= 3 || arguments[3] === undefined ? this.getCount() - 1 : arguments[3];
      var adjustIndex = arguments.length <= 4 || arguments[4] === undefined ? false : arguments[4];

      if (!this.getConfig('highlightFindChar')) return;

      return this.vimState.highlightFind.highlightCursorRows(this.getRegex(text), decorationType, backwards, this.offset, index, adjustIndex);
    }
  }, {
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var point = this.getPoint(cursor.getBufferPosition());
      if (point) cursor.setBufferPosition(point);else this.restoreEditorState();

      if (!this.repeated) this.globalState.set('currentFind', this);
    }
  }, {
    key: 'getRegex',
    value: function getRegex(term) {
      var modifiers = this.isCaseSensitive(term) ? 'g' : 'gi';
      return new RegExp(this._.escapeRegExp(term), modifiers);
    }
  }]);

  return Find;
})(Motion);

var FindBackwards = (function (_Find) {
  _inherits(FindBackwards, _Find);

  function FindBackwards() {
    _classCallCheck(this, FindBackwards);

    _get(Object.getPrototypeOf(FindBackwards.prototype), 'constructor', this).apply(this, arguments);

    this.inclusive = false;
    this.backwards = true;
  }

  // keymap: t
  return FindBackwards;
})(Find);

var Till = (function (_Find2) {
  _inherits(Till, _Find2);

  function Till() {
    _classCallCheck(this, Till);

    _get(Object.getPrototypeOf(Till.prototype), 'constructor', this).apply(this, arguments);

    this.offset = 1;
  }

  // keymap: T

  _createClass(Till, [{
    key: 'getPoint',
    value: function getPoint() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var point = _get(Object.getPrototypeOf(Till.prototype), 'getPoint', this).apply(this, args);
      this.moveSucceeded = point != null;
      return point;
    }
  }]);

  return Till;
})(Find);

var TillBackwards = (function (_Till) {
  _inherits(TillBackwards, _Till);

  function TillBackwards() {
    _classCallCheck(this, TillBackwards);

    _get(Object.getPrototypeOf(TillBackwards.prototype), 'constructor', this).apply(this, arguments);

    this.inclusive = false;
    this.backwards = true;
  }

  // Mark
  // -------------------------
  // keymap: `
  return TillBackwards;
})(Till);

var MoveToMark = (function (_Motion23) {
  _inherits(MoveToMark, _Motion23);

  function MoveToMark() {
    _classCallCheck(this, MoveToMark);

    _get(Object.getPrototypeOf(MoveToMark.prototype), 'constructor', this).apply(this, arguments);

    this.jump = true;
    this.requireInput = true;
    this.input = null;
    this.moveToFirstCharacterOfLine = false;
  }

  // keymap: '

  _createClass(MoveToMark, [{
    key: 'initialize',
    value: function initialize() {
      this.readChar();
      _get(Object.getPrototypeOf(MoveToMark.prototype), 'initialize', this).call(this);
    }
  }, {
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var point = this.vimState.mark.get(this.input);
      if (point) {
        if (this.moveToFirstCharacterOfLine) {
          point = this.getFirstCharacterPositionForBufferRow(point.row);
        }
        cursor.setBufferPosition(point);
        cursor.autoscroll({ center: true });
      }
    }
  }]);

  return MoveToMark;
})(Motion);

var MoveToMarkLine = (function (_MoveToMark) {
  _inherits(MoveToMarkLine, _MoveToMark);

  function MoveToMarkLine() {
    _classCallCheck(this, MoveToMarkLine);

    _get(Object.getPrototypeOf(MoveToMarkLine.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'linewise';
    this.moveToFirstCharacterOfLine = true;
  }

  // Fold motion
  // -------------------------
  return MoveToMarkLine;
})(MoveToMark);

var MotionByFold = (function (_Motion24) {
  _inherits(MotionByFold, _Motion24);

  function MotionByFold() {
    _classCallCheck(this, MotionByFold);

    _get(Object.getPrototypeOf(MotionByFold.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'characterwise';
    this.which = null;
    this.direction = null;
  }

  _createClass(MotionByFold, [{
    key: 'execute',
    value: function execute() {
      this.foldRanges = this.utils.getCodeFoldRanges(this.editor);
      _get(Object.getPrototypeOf(MotionByFold.prototype), 'execute', this).call(this);
    }
  }, {
    key: 'getRows',
    value: function getRows() {
      var _this20 = this;

      var rows = this.foldRanges.map(function (foldRange) {
        return foldRange[_this20.which].row;
      }).sort(function (a, b) {
        return a - b;
      });
      if (this.direction === 'previous') {
        return rows.reverse();
      } else {
        return rows;
      }
    }
  }, {
    key: 'findRowBy',
    value: function findRowBy(cursor, fn) {
      var _this21 = this;

      var cursorRow = cursor.getBufferRow();
      return this.getRows().find(function (row) {
        if (_this21.direction === 'previous') {
          return row < cursorRow && fn(row);
        } else {
          return row > cursorRow && fn(row);
        }
      });
    }
  }, {
    key: 'findRow',
    value: function findRow(cursor) {
      return this.findRowBy(cursor, function () {
        return true;
      });
    }
  }, {
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var _this22 = this;

      this.moveCursorCountTimes(cursor, function () {
        var row = _this22.findRow(cursor);
        if (row != null) _this22.utils.moveCursorToFirstCharacterAtRow(cursor, row);
      });
    }
  }], [{
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return MotionByFold;
})(Motion);

var MoveToPreviousFoldStart = (function (_MotionByFold) {
  _inherits(MoveToPreviousFoldStart, _MotionByFold);

  function MoveToPreviousFoldStart() {
    _classCallCheck(this, MoveToPreviousFoldStart);

    _get(Object.getPrototypeOf(MoveToPreviousFoldStart.prototype), 'constructor', this).apply(this, arguments);

    this.which = 'start';
    this.direction = 'previous';
  }

  return MoveToPreviousFoldStart;
})(MotionByFold);

var MoveToNextFoldStart = (function (_MotionByFold2) {
  _inherits(MoveToNextFoldStart, _MotionByFold2);

  function MoveToNextFoldStart() {
    _classCallCheck(this, MoveToNextFoldStart);

    _get(Object.getPrototypeOf(MoveToNextFoldStart.prototype), 'constructor', this).apply(this, arguments);

    this.which = 'start';
    this.direction = 'next';
  }

  return MoveToNextFoldStart;
})(MotionByFold);

var MoveToPreviousFoldEnd = (function (_MotionByFold3) {
  _inherits(MoveToPreviousFoldEnd, _MotionByFold3);

  function MoveToPreviousFoldEnd() {
    _classCallCheck(this, MoveToPreviousFoldEnd);

    _get(Object.getPrototypeOf(MoveToPreviousFoldEnd.prototype), 'constructor', this).apply(this, arguments);

    this.which = 'end';
    this.direction = 'previous';
  }

  return MoveToPreviousFoldEnd;
})(MotionByFold);

var MoveToNextFoldEnd = (function (_MotionByFold4) {
  _inherits(MoveToNextFoldEnd, _MotionByFold4);

  function MoveToNextFoldEnd() {
    _classCallCheck(this, MoveToNextFoldEnd);

    _get(Object.getPrototypeOf(MoveToNextFoldEnd.prototype), 'constructor', this).apply(this, arguments);

    this.which = 'end';
    this.direction = 'next';
  }

  // -------------------------
  return MoveToNextFoldEnd;
})(MotionByFold);

var MoveToPreviousFunction = (function (_MotionByFold5) {
  _inherits(MoveToPreviousFunction, _MotionByFold5);

  function MoveToPreviousFunction() {
    _classCallCheck(this, MoveToPreviousFunction);

    _get(Object.getPrototypeOf(MoveToPreviousFunction.prototype), 'constructor', this).apply(this, arguments);

    this.which = 'start';
    this.direction = 'previous';
  }

  _createClass(MoveToPreviousFunction, [{
    key: 'findRow',
    value: function findRow(cursor) {
      var _this23 = this;

      return this.findRowBy(cursor, function (row) {
        return _this23.utils.isIncludeFunctionScopeForRow(_this23.editor, row);
      });
    }
  }]);

  return MoveToPreviousFunction;
})(MotionByFold);

var MoveToNextFunction = (function (_MoveToPreviousFunction) {
  _inherits(MoveToNextFunction, _MoveToPreviousFunction);

  function MoveToNextFunction() {
    _classCallCheck(this, MoveToNextFunction);

    _get(Object.getPrototypeOf(MoveToNextFunction.prototype), 'constructor', this).apply(this, arguments);

    this.direction = 'next';
  }

  return MoveToNextFunction;
})(MoveToPreviousFunction);

var MoveToPreviousFunctionAndRedrawCursorLineAtUpperMiddle = (function (_MoveToPreviousFunction2) {
  _inherits(MoveToPreviousFunctionAndRedrawCursorLineAtUpperMiddle, _MoveToPreviousFunction2);

  function MoveToPreviousFunctionAndRedrawCursorLineAtUpperMiddle() {
    _classCallCheck(this, MoveToPreviousFunctionAndRedrawCursorLineAtUpperMiddle);

    _get(Object.getPrototypeOf(MoveToPreviousFunctionAndRedrawCursorLineAtUpperMiddle.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(MoveToPreviousFunctionAndRedrawCursorLineAtUpperMiddle, [{
    key: 'execute',
    value: function execute() {
      _get(Object.getPrototypeOf(MoveToPreviousFunctionAndRedrawCursorLineAtUpperMiddle.prototype), 'execute', this).call(this);
      this.getInstance('RedrawCursorLineAtUpperMiddle').execute();
    }
  }]);

  return MoveToPreviousFunctionAndRedrawCursorLineAtUpperMiddle;
})(MoveToPreviousFunction);

var MoveToNextFunctionAndRedrawCursorLineAtUpperMiddle = (function (_MoveToPreviousFunctionAndRedrawCursorLineAtUpperMiddle) {
  _inherits(MoveToNextFunctionAndRedrawCursorLineAtUpperMiddle, _MoveToPreviousFunctionAndRedrawCursorLineAtUpperMiddle);

  function MoveToNextFunctionAndRedrawCursorLineAtUpperMiddle() {
    _classCallCheck(this, MoveToNextFunctionAndRedrawCursorLineAtUpperMiddle);

    _get(Object.getPrototypeOf(MoveToNextFunctionAndRedrawCursorLineAtUpperMiddle.prototype), 'constructor', this).apply(this, arguments);

    this.direction = 'next';
  }

  // -------------------------
  return MoveToNextFunctionAndRedrawCursorLineAtUpperMiddle;
})(MoveToPreviousFunctionAndRedrawCursorLineAtUpperMiddle);

var MotionByFoldWithSameIndent = (function (_MotionByFold6) {
  _inherits(MotionByFoldWithSameIndent, _MotionByFold6);

  function MotionByFoldWithSameIndent() {
    _classCallCheck(this, MotionByFoldWithSameIndent);

    _get(Object.getPrototypeOf(MotionByFoldWithSameIndent.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(MotionByFoldWithSameIndent, [{
    key: 'findRow',
    value: function findRow(cursor) {
      var _this24 = this;

      var closestFoldRange = this.utils.getClosestFoldRangeContainsRow(this.editor, cursor.getBufferRow());
      var indentationForBufferRow = function indentationForBufferRow(row) {
        return _this24.editor.indentationForBufferRow(row);
      };
      var baseIndentLevel = closestFoldRange ? indentationForBufferRow(closestFoldRange.start.row) : 0;
      var isEqualIndentLevel = function isEqualIndentLevel(range) {
        return indentationForBufferRow(range.start.row) === baseIndentLevel;
      };

      var cursorRow = cursor.getBufferRow();
      var foldRanges = this.direction === 'previous' ? this.foldRanges.slice().reverse() : this.foldRanges;
      var foldRange = foldRanges.find(function (foldRange) {
        var row = foldRange[_this24.which].row;
        if (_this24.direction === 'previous') {
          return row < cursorRow && isEqualIndentLevel(foldRange);
        } else {
          return row > cursorRow && isEqualIndentLevel(foldRange);
        }
      });
      if (foldRange) {
        return foldRange[this.which].row;
      }
    }
  }], [{
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return MotionByFoldWithSameIndent;
})(MotionByFold);

var MoveToPreviousFoldStartWithSameIndent = (function (_MotionByFoldWithSameIndent) {
  _inherits(MoveToPreviousFoldStartWithSameIndent, _MotionByFoldWithSameIndent);

  function MoveToPreviousFoldStartWithSameIndent() {
    _classCallCheck(this, MoveToPreviousFoldStartWithSameIndent);

    _get(Object.getPrototypeOf(MoveToPreviousFoldStartWithSameIndent.prototype), 'constructor', this).apply(this, arguments);

    this.which = 'start';
    this.direction = 'previous';
  }

  return MoveToPreviousFoldStartWithSameIndent;
})(MotionByFoldWithSameIndent);

var MoveToNextFoldStartWithSameIndent = (function (_MotionByFoldWithSameIndent2) {
  _inherits(MoveToNextFoldStartWithSameIndent, _MotionByFoldWithSameIndent2);

  function MoveToNextFoldStartWithSameIndent() {
    _classCallCheck(this, MoveToNextFoldStartWithSameIndent);

    _get(Object.getPrototypeOf(MoveToNextFoldStartWithSameIndent.prototype), 'constructor', this).apply(this, arguments);

    this.which = 'start';
    this.direction = 'next';
  }

  return MoveToNextFoldStartWithSameIndent;
})(MotionByFoldWithSameIndent);

var MoveToPreviousFoldEndWithSameIndent = (function (_MotionByFoldWithSameIndent3) {
  _inherits(MoveToPreviousFoldEndWithSameIndent, _MotionByFoldWithSameIndent3);

  function MoveToPreviousFoldEndWithSameIndent() {
    _classCallCheck(this, MoveToPreviousFoldEndWithSameIndent);

    _get(Object.getPrototypeOf(MoveToPreviousFoldEndWithSameIndent.prototype), 'constructor', this).apply(this, arguments);

    this.which = 'end';
    this.direction = 'previous';
  }

  return MoveToPreviousFoldEndWithSameIndent;
})(MotionByFoldWithSameIndent);

var MoveToNextFoldEndWithSameIndent = (function (_MotionByFoldWithSameIndent4) {
  _inherits(MoveToNextFoldEndWithSameIndent, _MotionByFoldWithSameIndent4);

  function MoveToNextFoldEndWithSameIndent() {
    _classCallCheck(this, MoveToNextFoldEndWithSameIndent);

    _get(Object.getPrototypeOf(MoveToNextFoldEndWithSameIndent.prototype), 'constructor', this).apply(this, arguments);

    this.which = 'end';
    this.direction = 'next';
  }

  // Scope based
  // -------------------------
  return MoveToNextFoldEndWithSameIndent;
})(MotionByFoldWithSameIndent);

var MotionByScope = (function (_Motion25) {
  _inherits(MotionByScope, _Motion25);

  function MotionByScope() {
    _classCallCheck(this, MotionByScope);

    _get(Object.getPrototypeOf(MotionByScope.prototype), 'constructor', this).apply(this, arguments);

    this.direction = 'backward';
    this.scope = '.';
  }

  _createClass(MotionByScope, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var _this25 = this;

      this.moveCursorCountTimes(cursor, function () {
        var cursorPosition = cursor.getBufferPosition();
        var point = _this25.utils.detectScopeStartPositionForScope(_this25.editor, cursorPosition, _this25.direction, _this25.scope);
        if (point) cursor.setBufferPosition(point);
      });
    }
  }], [{
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return MotionByScope;
})(Motion);

var MoveToPreviousString = (function (_MotionByScope) {
  _inherits(MoveToPreviousString, _MotionByScope);

  function MoveToPreviousString() {
    _classCallCheck(this, MoveToPreviousString);

    _get(Object.getPrototypeOf(MoveToPreviousString.prototype), 'constructor', this).apply(this, arguments);

    this.direction = 'backward';
    this.scope = 'string.begin';
  }

  return MoveToPreviousString;
})(MotionByScope);

var MoveToNextString = (function (_MoveToPreviousString) {
  _inherits(MoveToNextString, _MoveToPreviousString);

  function MoveToNextString() {
    _classCallCheck(this, MoveToNextString);

    _get(Object.getPrototypeOf(MoveToNextString.prototype), 'constructor', this).apply(this, arguments);

    this.direction = 'forward';
  }

  return MoveToNextString;
})(MoveToPreviousString);

var MoveToPreviousNumber = (function (_MotionByScope2) {
  _inherits(MoveToPreviousNumber, _MotionByScope2);

  function MoveToPreviousNumber() {
    _classCallCheck(this, MoveToPreviousNumber);

    _get(Object.getPrototypeOf(MoveToPreviousNumber.prototype), 'constructor', this).apply(this, arguments);

    this.direction = 'backward';
    this.scope = 'constant.numeric';
  }

  return MoveToPreviousNumber;
})(MotionByScope);

var MoveToNextNumber = (function (_MoveToPreviousNumber) {
  _inherits(MoveToNextNumber, _MoveToPreviousNumber);

  function MoveToNextNumber() {
    _classCallCheck(this, MoveToNextNumber);

    _get(Object.getPrototypeOf(MoveToNextNumber.prototype), 'constructor', this).apply(this, arguments);

    this.direction = 'forward';
  }

  return MoveToNextNumber;
})(MoveToPreviousNumber);

var MoveToNextOccurrence = (function (_Motion26) {
  _inherits(MoveToNextOccurrence, _Motion26);

  function MoveToNextOccurrence() {
    _classCallCheck(this, MoveToNextOccurrence);

    _get(Object.getPrototypeOf(MoveToNextOccurrence.prototype), 'constructor', this).apply(this, arguments);

    this.jump = true;
    this.direction = 'next';
  }

  _createClass(MoveToNextOccurrence, [{
    key: 'execute',
    value: function execute() {
      this.ranges = this.utils.sortRanges(this.occurrenceManager.getMarkers().map(function (marker) {
        return marker.getBufferRange();
      }));
      _get(Object.getPrototypeOf(MoveToNextOccurrence.prototype), 'execute', this).call(this);
    }
  }, {
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var range = this.ranges[this.utils.getIndex(this.getIndex(cursor.getBufferPosition()), this.ranges)];
      var point = range.start;
      cursor.setBufferPosition(point, { autoscroll: false });

      this.editor.unfoldBufferRow(point.row);
      if (cursor.isLastCursor()) {
        this.utils.smartScrollToBufferPosition(this.editor, point);
      }

      if (this.getConfig('flashOnMoveToOccurrence')) {
        this.vimState.flash(range, { type: 'search' });
      }
    }
  }, {
    key: 'getIndex',
    value: function getIndex(fromPoint) {
      var index = this.ranges.findIndex(function (range) {
        return range.start.isGreaterThan(fromPoint);
      });
      return (index >= 0 ? index : 0) + this.getCount() - 1;
    }
  }], [{
    key: 'commandScope',

    // Ensure this command is available when only has-occurrence
    value: 'atom-text-editor.vim-mode-plus.has-occurrence',
    enumerable: true
  }]);

  return MoveToNextOccurrence;
})(Motion);

var MoveToPreviousOccurrence = (function (_MoveToNextOccurrence) {
  _inherits(MoveToPreviousOccurrence, _MoveToNextOccurrence);

  function MoveToPreviousOccurrence() {
    _classCallCheck(this, MoveToPreviousOccurrence);

    _get(Object.getPrototypeOf(MoveToPreviousOccurrence.prototype), 'constructor', this).apply(this, arguments);

    this.direction = 'previous';
  }

  // -------------------------
  // keymap: %

  _createClass(MoveToPreviousOccurrence, [{
    key: 'getIndex',
    value: function getIndex(fromPoint) {
      var ranges = this.ranges.slice().reverse();
      var range = ranges.find(function (range) {
        return range.end.isLessThan(fromPoint);
      });
      var index = range ? this.ranges.indexOf(range) : this.ranges.length - 1;
      return index - (this.getCount() - 1);
    }
  }]);

  return MoveToPreviousOccurrence;
})(MoveToNextOccurrence);

var MoveToPair = (function (_Motion27) {
  _inherits(MoveToPair, _Motion27);

  function MoveToPair() {
    _classCallCheck(this, MoveToPair);

    _get(Object.getPrototypeOf(MoveToPair.prototype), 'constructor', this).apply(this, arguments);

    this.inclusive = true;
    this.jump = true;
    this.member = ['Parenthesis', 'CurlyBracket', 'SquareBracket'];
  }

  _createClass(MoveToPair, [{
    key: 'moveCursor',
    value: function moveCursor(cursor) {
      var point = this.getPoint(cursor);
      if (point) cursor.setBufferPosition(point);
    }
  }, {
    key: 'getPointForTag',
    value: function getPointForTag(point) {
      var pairInfo = this.getInstance('ATag').getPairInfo(point);
      if (!pairInfo) return;

      var openRange = pairInfo.openRange;
      var closeRange = pairInfo.closeRange;

      openRange = openRange.translate([0, +1], [0, -1]);
      closeRange = closeRange.translate([0, +1], [0, -1]);
      if (openRange.containsPoint(point) && !point.isEqual(openRange.end)) {
        return closeRange.start;
      }
      if (closeRange.containsPoint(point) && !point.isEqual(closeRange.end)) {
        return openRange.start;
      }
    }
  }, {
    key: 'getPoint',
    value: function getPoint(cursor) {
      var cursorPosition = cursor.getBufferPosition();
      var cursorRow = cursorPosition.row;
      var point = this.getPointForTag(cursorPosition);
      if (point) return point;

      // AAnyPairAllowForwarding return forwarding range or enclosing range.
      var range = this.getInstance('AAnyPairAllowForwarding', { member: this.member }).getRange(cursor.selection);
      if (!range) return;

      var start = range.start;
      var end = range.end;

      if (start.row === cursorRow && start.isGreaterThanOrEqual(cursorPosition)) {
        // Forwarding range found
        return end.translate([0, -1]);
      } else if (end.row === cursorPosition.row) {
        // Enclosing range was returned
        // We move to start( open-pair ) only when close-pair was at same row as cursor-row.
        return start;
      }
    }
  }]);

  return MoveToPair;
})(Motion);

module.exports = {
  Motion: Motion,
  CurrentSelection: CurrentSelection,
  MoveLeft: MoveLeft,
  MoveRight: MoveRight,
  MoveRightBufferColumn: MoveRightBufferColumn,
  MoveUp: MoveUp,
  MoveUpWrap: MoveUpWrap,
  MoveDown: MoveDown,
  MoveDownWrap: MoveDownWrap,
  MoveUpScreen: MoveUpScreen,
  MoveDownScreen: MoveDownScreen,
  MoveUpToEdge: MoveUpToEdge,
  MoveDownToEdge: MoveDownToEdge,
  MotionByWord: MotionByWord,
  MoveToNextWord: MoveToNextWord,
  MoveToNextWholeWord: MoveToNextWholeWord,
  MoveToNextAlphanumericWord: MoveToNextAlphanumericWord,
  MoveToNextSmartWord: MoveToNextSmartWord,
  MoveToNextSubword: MoveToNextSubword,
  MoveToPreviousWord: MoveToPreviousWord,
  MoveToPreviousWholeWord: MoveToPreviousWholeWord,
  MoveToPreviousAlphanumericWord: MoveToPreviousAlphanumericWord,
  MoveToPreviousSmartWord: MoveToPreviousSmartWord,
  MoveToPreviousSubword: MoveToPreviousSubword,
  MoveToEndOfWord: MoveToEndOfWord,
  MoveToEndOfWholeWord: MoveToEndOfWholeWord,
  MoveToEndOfAlphanumericWord: MoveToEndOfAlphanumericWord,
  MoveToEndOfSmartWord: MoveToEndOfSmartWord,
  MoveToEndOfSubword: MoveToEndOfSubword,
  MoveToPreviousEndOfWord: MoveToPreviousEndOfWord,
  MoveToPreviousEndOfWholeWord: MoveToPreviousEndOfWholeWord,
  MoveToNextSentence: MoveToNextSentence,
  MoveToPreviousSentence: MoveToPreviousSentence,
  MoveToNextSentenceSkipBlankRow: MoveToNextSentenceSkipBlankRow,
  MoveToPreviousSentenceSkipBlankRow: MoveToPreviousSentenceSkipBlankRow,
  MoveToNextParagraph: MoveToNextParagraph,
  MoveToPreviousParagraph: MoveToPreviousParagraph,
  MoveToNextDiffHunk: MoveToNextDiffHunk,
  MoveToPreviousDiffHunk: MoveToPreviousDiffHunk,
  MoveToBeginningOfLine: MoveToBeginningOfLine,
  MoveToColumn: MoveToColumn,
  MoveToLastCharacterOfLine: MoveToLastCharacterOfLine,
  MoveToLastNonblankCharacterOfLineAndDown: MoveToLastNonblankCharacterOfLineAndDown,
  MoveToFirstCharacterOfLine: MoveToFirstCharacterOfLine,
  MoveToFirstCharacterOfLineUp: MoveToFirstCharacterOfLineUp,
  MoveToFirstCharacterOfLineDown: MoveToFirstCharacterOfLineDown,
  MoveToFirstCharacterOfLineAndDown: MoveToFirstCharacterOfLineAndDown,
  MoveToScreenColumn: MoveToScreenColumn,
  MoveToBeginningOfScreenLine: MoveToBeginningOfScreenLine,
  MoveToFirstCharacterOfScreenLine: MoveToFirstCharacterOfScreenLine,
  MoveToLastCharacterOfScreenLine: MoveToLastCharacterOfScreenLine,
  MoveToFirstLine: MoveToFirstLine,
  MoveToLastLine: MoveToLastLine,
  MoveToLineByPercent: MoveToLineByPercent,
  MoveToRelativeLine: MoveToRelativeLine,
  MoveToRelativeLineMinimumTwo: MoveToRelativeLineMinimumTwo,
  MoveToTopOfScreen: MoveToTopOfScreen,
  MoveToMiddleOfScreen: MoveToMiddleOfScreen,
  MoveToBottomOfScreen: MoveToBottomOfScreen,
  Scroll: Scroll,
  ScrollFullScreenDown: ScrollFullScreenDown,
  ScrollFullScreenUp: ScrollFullScreenUp,
  ScrollHalfScreenDown: ScrollHalfScreenDown,
  ScrollHalfScreenUp: ScrollHalfScreenUp,
  ScrollQuarterScreenDown: ScrollQuarterScreenDown,
  ScrollQuarterScreenUp: ScrollQuarterScreenUp,
  Find: Find,
  FindBackwards: FindBackwards,
  Till: Till,
  TillBackwards: TillBackwards,
  MoveToMark: MoveToMark,
  MoveToMarkLine: MoveToMarkLine,
  MotionByFold: MotionByFold,
  MoveToPreviousFoldStart: MoveToPreviousFoldStart,
  MoveToNextFoldStart: MoveToNextFoldStart,
  MotionByFoldWithSameIndent: MotionByFoldWithSameIndent,
  MoveToPreviousFoldStartWithSameIndent: MoveToPreviousFoldStartWithSameIndent,
  MoveToNextFoldStartWithSameIndent: MoveToNextFoldStartWithSameIndent,
  MoveToPreviousFoldEndWithSameIndent: MoveToPreviousFoldEndWithSameIndent,
  MoveToNextFoldEndWithSameIndent: MoveToNextFoldEndWithSameIndent,
  MoveToPreviousFoldEnd: MoveToPreviousFoldEnd,
  MoveToNextFoldEnd: MoveToNextFoldEnd,
  MoveToPreviousFunction: MoveToPreviousFunction,
  MoveToNextFunction: MoveToNextFunction,
  MoveToPreviousFunctionAndRedrawCursorLineAtUpperMiddle: MoveToPreviousFunctionAndRedrawCursorLineAtUpperMiddle,
  MoveToNextFunctionAndRedrawCursorLineAtUpperMiddle: MoveToNextFunctionAndRedrawCursorLineAtUpperMiddle,
  MotionByScope: MotionByScope,
  MoveToPreviousString: MoveToPreviousString,
  MoveToNextString: MoveToNextString,
  MoveToPreviousNumber: MoveToPreviousNumber,
  MoveToNextNumber: MoveToNextNumber,
  MoveToNextOccurrence: MoveToNextOccurrence,
  MoveToPreviousOccurrence: MoveToPreviousOccurrence,
  MoveToPair: MoveToPair
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3l1YW5zaGVuLy5hdG9tL3BhY2thZ2VzL3ZpbS1tb2RlLXBsdXMvbGliL21vdGlvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUE7Ozs7Ozs7Ozs7ZUFFWSxPQUFPLENBQUMsTUFBTSxDQUFDOztJQUEvQixLQUFLLFlBQUwsS0FBSztJQUFFLEtBQUssWUFBTCxLQUFLOztBQUVuQixJQUFNLElBQUksR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7O0lBRXhCLE1BQU07WUFBTixNQUFNOztXQUFOLE1BQU07MEJBQU4sTUFBTTs7K0JBQU4sTUFBTTs7U0FJVixRQUFRLEdBQUcsSUFBSTtTQUNmLFNBQVMsR0FBRyxLQUFLO1NBQ2pCLElBQUksR0FBRyxlQUFlO1NBQ3RCLElBQUksR0FBRyxLQUFLO1NBQ1osY0FBYyxHQUFHLEtBQUs7U0FDdEIsYUFBYSxHQUFHLElBQUk7U0FDcEIscUJBQXFCLEdBQUcsS0FBSztTQUM3QixlQUFlLEdBQUcsS0FBSztTQUN2QixZQUFZLEdBQUcsS0FBSztTQUNwQixtQkFBbUIsR0FBRyxJQUFJOzs7OztlQWJ0QixNQUFNOztXQWVGLG1CQUFHO0FBQ1QsYUFBTyxDQUFDLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUE7S0FDaEQ7OztXQUVVLHNCQUFHO0FBQ1osYUFBTyxJQUFJLENBQUMsSUFBSSxLQUFLLFVBQVUsQ0FBQTtLQUNoQzs7O1dBRVcsdUJBQUc7QUFDYixhQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssV0FBVyxDQUFBO0tBQ2pDOzs7V0FFUyxtQkFBQyxJQUFJLEVBQUU7QUFDZixVQUFJLElBQUksS0FBSyxlQUFlLEVBQUU7QUFDNUIsWUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxLQUFLLFVBQVUsR0FBRyxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFBO09BQ3BFO0FBQ0QsVUFBSSxDQUFDLElBQUks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QUFrQixFQUFsQixrQkFBa0I7QUFDbEIseUJBQXVCLEVBQXZCLHVCQUF1QjtBQUN2Qix1QkFBcUIsRUFBckIscUJBQXFCO0FBQ3JCLE1BQUksRUFBSixJQUFJO0FBQ0osZUFBYSxFQUFiLGFBQWE7QUFDYixNQUFJLEVBQUosSUFBSTtBQUNKLGVBQWEsRUFBYixhQUFhO0FBQ2IsWUFBVSxFQUFWLFVBQVU7QUFDVixnQkFBYyxFQUFkLGNBQWM7QUFDZCxjQUFZLEVBQVosWUFBWTtBQUNaLHlCQUF1QixFQUF2Qix1QkFBdUI7QUFDdkIscUJBQW1CLEVBQW5CLG1CQUFtQjtBQUNuQiw0QkFBMEIsRUFBMUIsMEJBQTBCO0FBQzFCLHVDQUFxQyxFQUFyQyxxQ0FBcUM7QUFDckMsbUNBQWlDLEVBQWpDLGlDQUFpQztBQUNqQyxxQ0FBbUMsRUFBbkMsbUNBQW1DO0FBQ25DLGlDQUErQixFQUEvQiwrQkFBK0I7QUFDL0IsdUJBQXFCLEVBQXJCLHFCQUFxQjtBQUNyQixtQkFBaUIsRUFBakIsaUJBQWlCO0FBQ2pCLHdCQUFzQixFQUF0QixzQkFBc0I7QUFDdEIsb0JBQWtCLEVBQWxCLGtCQUFrQjtBQUNsQix3REFBc0QsRUFBdEQsc0RBQXNEO0FBQ3RELG9EQUFrRCxFQUFsRCxrREFBa0Q7QUFDbEQsZUFBYSxFQUFiLGFBQWE7QUFDYixzQkFBb0IsRUFBcEIsb0JBQW9CO0FBQ3BCLGtCQUFnQixFQUFoQixnQkFBZ0I7QUFDaEIsc0JBQW9CLEVBQXBCLG9CQUFvQjtBQUNwQixrQkFBZ0IsRUFBaEIsZ0JBQWdCO0FBQ2hCLHNCQUFvQixFQUFwQixvQkFBb0I7QUFDcEIsMEJBQXdCLEVBQXhCLHdCQUF3QjtBQUN4QixZQUFVLEVBQVYsVUFBVTtDQUNYLENBQUEiLCJmaWxlIjoiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvbW90aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCdcblxuY29uc3Qge1BvaW50LCBSYW5nZX0gPSByZXF1aXJlKCdhdG9tJylcblxuY29uc3QgQmFzZSA9IHJlcXVpcmUoJy4vYmFzZScpXG5cbmNsYXNzIE1vdGlvbiBleHRlbmRzIEJhc2Uge1xuICBzdGF0aWMgb3BlcmF0aW9uS2luZCA9ICdtb3Rpb24nXG4gIHN0YXRpYyBjb21tYW5kID0gZmFsc2VcblxuICBvcGVyYXRvciA9IG51bGxcbiAgaW5jbHVzaXZlID0gZmFsc2VcbiAgd2lzZSA9ICdjaGFyYWN0ZXJ3aXNlJ1xuICBqdW1wID0gZmFsc2VcbiAgdmVydGljYWxNb3Rpb24gPSBmYWxzZVxuICBtb3ZlU3VjY2VlZGVkID0gbnVsbFxuICBtb3ZlU3VjY2Vzc09uTGluZXdpc2UgPSBmYWxzZVxuICBzZWxlY3RTdWNjZWVkZWQgPSBmYWxzZVxuICByZXF1aXJlSW5wdXQgPSBmYWxzZVxuICBjYXNlU2Vuc2l0aXZpdHlLaW5kID0gbnVsbFxuXG4gIGlzUmVhZHkgKCkge1xuICAgIHJldHVybiAhdGhpcy5yZXF1aXJlSW5wdXQgfHwgdGhpcy5pbnB1dCAhPSBudWxsXG4gIH1cblxuICBpc0xpbmV3aXNlICgpIHtcbiAgICByZXR1cm4gdGhpcy53aXNlID09PSAnbGluZXdpc2UnXG4gIH1cblxuICBpc0Jsb2Nrd2lzZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMud2lzZSA9PT0gJ2Jsb2Nrd2lzZSdcbiAgfVxuXG4gIGZvcmNlV2lzZSAod2lzZSkge1xuICAgIGlmICh3aXNlID09PSAnY2hhcmFjdGVyd2lzZScpIHtcbiAgICAgIHRoaXMuaW5jbHVzaXZlID0gdGhpcy53aXNlID09PSAnbGluZXdpc2UnID8gZmFsc2UgOiAhdGhpcy5pbmNsdXNpdmVcbiAgICB9XG4gICAgdGhpcy53aXNlID0gd2lzZVxuICB9XG5cbiAgcmVzZXRTdGF0ZSAoKSB7XG4gICAgdGhpcy5zZWxlY3RTdWNjZWVkZWQgPSBmYWxzZVxuICB9XG5cbiAgbW92ZVdpdGhTYXZlSnVtcCAoY3Vyc29yKSB7XG4gICAgY29uc3Qgb3JpZ2luYWxQb3NpdGlvbiA9IHRoaXMuanVtcCAmJiBjdXJzb3IuaXNMYXN0Q3Vyc29yKCkgPyBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSA6IHVuZGVmaW5lZFxuXG4gICAgdGhpcy5tb3ZlQ3Vyc29yKGN1cnNvcilcblxuICAgIGlmIChvcmlnaW5hbFBvc2l0aW9uICYmICFjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKS5pc0VxdWFsKG9yaWdpbmFsUG9zaXRpb24pKSB7XG4gICAgICB0aGlzLnZpbVN0YXRlLm1hcmsuc2V0KCdgJywgb3JpZ2luYWxQb3NpdGlvbilcbiAgICAgIHRoaXMudmltU3RhdGUubWFyay5zZXQoXCInXCIsIG9yaWdpbmFsUG9zaXRpb24pXG4gICAgfVxuICB9XG5cbiAgZXhlY3V0ZSAoKSB7XG4gICAgaWYgKHRoaXMub3BlcmF0b3IpIHtcbiAgICAgIHRoaXMuc2VsZWN0KClcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChjb25zdCBjdXJzb3Igb2YgdGhpcy5lZGl0b3IuZ2V0Q3Vyc29ycygpKSB7XG4gICAgICAgIHRoaXMubW92ZVdpdGhTYXZlSnVtcChjdXJzb3IpXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZWRpdG9yLm1lcmdlQ3Vyc29ycygpXG4gICAgdGhpcy5lZGl0b3IubWVyZ2VJbnRlcnNlY3RpbmdTZWxlY3Rpb25zKClcbiAgfVxuXG4gIC8vIE5PVEU6IHNlbGVjdGlvbiBpcyBhbHJlYWR5IFwibm9ybWFsaXplZFwiIGJlZm9yZSB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZC5cbiAgc2VsZWN0ICgpIHtcbiAgICAvLyBuZWVkIHRvIGNhcmUgd2FzIHZpc3VhbCBmb3IgYC5gIHJlcGVhdGVkLlxuICAgIGNvbnN0IGlzT3JXYXNWaXN1YWwgPSB0aGlzLm9wZXJhdG9yLmluc3RhbmNlb2YoJ1NlbGVjdEJhc2UnKSB8fCB0aGlzLm5hbWUgPT09ICdDdXJyZW50U2VsZWN0aW9uJ1xuXG4gICAgZm9yIChjb25zdCBzZWxlY3Rpb24gb2YgdGhpcy5lZGl0b3IuZ2V0U2VsZWN0aW9ucygpKSB7XG4gICAgICBzZWxlY3Rpb24ubW9kaWZ5U2VsZWN0aW9uKCgpID0+IHRoaXMubW92ZVdpdGhTYXZlSnVtcChzZWxlY3Rpb24uY3Vyc29yKSlcblxuICAgICAgY29uc3Qgc2VsZWN0U3VjY2VlZGVkID1cbiAgICAgICAgdGhpcy5tb3ZlU3VjY2VlZGVkICE9IG51bGxcbiAgICAgICAgICA/IHRoaXMubW92ZVN1Y2NlZWRlZFxuICAgICAgICAgIDogIXNlbGVjdGlvbi5pc0VtcHR5KCkgfHwgKHRoaXMuaXNMaW5ld2lzZSgpICYmIHRoaXMubW92ZVN1Y2Nlc3NPbkxpbmV3aXNlKVxuICAgICAgaWYgKCF0aGlzLnNlbGVjdFN1Y2NlZWRlZCkgdGhpcy5zZWxlY3RTdWNjZWVkZWQgPSBzZWxlY3RTdWNjZWVkZWRcblxuICAgICAgaWYgKGlzT3JXYXNWaXN1YWwgfHwgKHNlbGVjdFN1Y2NlZWRlZCAmJiAodGhpcy5pbmNsdXNpdmUgfHwgdGhpcy5pc0xpbmV3aXNlKCkpKSkge1xuICAgICAgICBjb25zdCAkc2VsZWN0aW9uID0gdGhpcy5zd3JhcChzZWxlY3Rpb24pXG4gICAgICAgICRzZWxlY3Rpb24uc2F2ZVByb3BlcnRpZXModHJ1ZSkgLy8gc2F2ZSBwcm9wZXJ0eSBvZiBcImFscmVhZHktbm9ybWFsaXplZC1zZWxlY3Rpb25cIlxuICAgICAgICAkc2VsZWN0aW9uLmFwcGx5V2lzZSh0aGlzLndpc2UpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMud2lzZSA9PT0gJ2Jsb2Nrd2lzZScpIHtcbiAgICAgIHRoaXMudmltU3RhdGUuZ2V0TGFzdEJsb2Nrd2lzZVNlbGVjdGlvbigpLmF1dG9zY3JvbGwoKVxuICAgIH1cbiAgfVxuXG4gIHNldEN1cnNvckJ1ZmZlclJvdyAoY3Vyc29yLCByb3csIG9wdGlvbnMpIHtcbiAgICBpZiAodGhpcy52ZXJ0aWNhbE1vdGlvbiAmJiAhdGhpcy5nZXRDb25maWcoJ3N0YXlPblZlcnRpY2FsTW90aW9uJykpIHtcbiAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbih0aGlzLmdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JCdWZmZXJSb3cocm93KSwgb3B0aW9ucylcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy51dGlscy5zZXRCdWZmZXJSb3coY3Vyc29yLCByb3csIG9wdGlvbnMpXG4gICAgfVxuICB9XG5cbiAgLy8gQ2FsbCBjYWxsYmFjayBjb3VudCB0aW1lcy5cbiAgLy8gQnV0IGJyZWFrIGl0ZXJhdGlvbiB3aGVuIGN1cnNvciBwb3NpdGlvbiBkaWQgbm90IGNoYW5nZSBiZWZvcmUvYWZ0ZXIgY2FsbGJhY2suXG4gIG1vdmVDdXJzb3JDb3VudFRpbWVzIChjdXJzb3IsIGZuKSB7XG4gICAgbGV0IG9sZFBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICB0aGlzLmNvdW50VGltZXModGhpcy5nZXRDb3VudCgpLCBzdGF0ZSA9PiB7XG4gICAgICBmbihzdGF0ZSlcbiAgICAgIGNvbnN0IG5ld1Bvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIGlmIChuZXdQb3NpdGlvbi5pc0VxdWFsKG9sZFBvc2l0aW9uKSkgc3RhdGUuc3RvcCgpXG4gICAgICBvbGRQb3NpdGlvbiA9IG5ld1Bvc2l0aW9uXG4gICAgfSlcbiAgfVxuXG4gIGlzQ2FzZVNlbnNpdGl2ZSAodGVybSkge1xuICAgIGlmICh0aGlzLmdldENvbmZpZyhgdXNlU21hcnRjYXNlRm9yJHt0aGlzLmNhc2VTZW5zaXRpdml0eUtpbmR9YCkpIHtcbiAgICAgIHJldHVybiB0ZXJtLnNlYXJjaCgvW0EtWl0vKSAhPT0gLTFcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICF0aGlzLmdldENvbmZpZyhgaWdub3JlQ2FzZUZvciR7dGhpcy5jYXNlU2Vuc2l0aXZpdHlLaW5kfWApXG4gICAgfVxuICB9XG5cbiAgZ2V0TGFzdFJlc29ydFBvaW50IChkaXJlY3Rpb24pIHtcbiAgICBpZiAoZGlyZWN0aW9uID09PSAnbmV4dCcpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldFZpbUVvZkJ1ZmZlclBvc2l0aW9uKClcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBQb2ludCgwLCAwKVxuICAgIH1cbiAgfVxufVxuXG4vLyBVc2VkIGFzIG9wZXJhdG9yJ3MgdGFyZ2V0IGluIHZpc3VhbC1tb2RlLlxuY2xhc3MgQ3VycmVudFNlbGVjdGlvbiBleHRlbmRzIE1vdGlvbiB7XG4gIHN0YXRpYyBjb21tYW5kID0gZmFsc2VcbiAgc2VsZWN0aW9uRXh0ZW50ID0gbnVsbFxuICBibG9ja3dpc2VTZWxlY3Rpb25FeHRlbnQgPSBudWxsXG4gIGluY2x1c2l2ZSA9IHRydWVcbiAgcG9pbnRJbmZvQnlDdXJzb3IgPSBuZXcgTWFwKClcblxuICBtb3ZlQ3Vyc29yIChjdXJzb3IpIHtcbiAgICBpZiAodGhpcy5tb2RlID09PSAndmlzdWFsJykge1xuICAgICAgdGhpcy5zZWxlY3Rpb25FeHRlbnQgPSB0aGlzLmlzQmxvY2t3aXNlKClcbiAgICAgICAgPyB0aGlzLnN3cmFwKGN1cnNvci5zZWxlY3Rpb24pLmdldEJsb2Nrd2lzZVNlbGVjdGlvbkV4dGVudCgpXG4gICAgICAgIDogdGhpcy5lZGl0b3IuZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZSgpLmdldEV4dGVudCgpXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGAuYCByZXBlYXQgY2FzZVxuICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpLnRyYW5zbGF0ZSh0aGlzLnNlbGVjdGlvbkV4dGVudCkpXG4gICAgfVxuICB9XG5cbiAgc2VsZWN0ICgpIHtcbiAgICBpZiAodGhpcy5tb2RlID09PSAndmlzdWFsJykge1xuICAgICAgc3VwZXIuc2VsZWN0KClcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChjb25zdCBjdXJzb3Igb2YgdGhpcy5lZGl0b3IuZ2V0Q3Vyc29ycygpKSB7XG4gICAgICAgIGNvbnN0IHBvaW50SW5mbyA9IHRoaXMucG9pbnRJbmZvQnlDdXJzb3IuZ2V0KGN1cnNvcilcbiAgICAgICAgaWYgKHBvaW50SW5mbykge1xuICAgICAgICAgIGNvbnN0IHtjdXJzb3JQb3NpdGlvbiwgc3RhcnRPZlNlbGVjdGlvbn0gPSBwb2ludEluZm9cbiAgICAgICAgICBpZiAoY3Vyc29yUG9zaXRpb24uaXNFcXVhbChjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSkpIHtcbiAgICAgICAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihzdGFydE9mU2VsZWN0aW9uKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc3VwZXIuc2VsZWN0KClcbiAgICB9XG5cbiAgICAvLyAqIFB1cnBvc2Ugb2YgcG9pbnRJbmZvQnlDdXJzb3I/IHNlZSAjMjM1IGZvciBkZXRhaWwuXG4gICAgLy8gV2hlbiBzdGF5T25UcmFuc2Zvcm1TdHJpbmcgaXMgZW5hYmxlZCwgY3Vyc29yIHBvcyBpcyBub3Qgc2V0IG9uIHN0YXJ0IG9mXG4gICAgLy8gb2Ygc2VsZWN0ZWQgcmFuZ2UuXG4gICAgLy8gQnV0IEkgd2FudCBmb2xsb3dpbmcgYmVoYXZpb3IsIHNvIG5lZWQgdG8gcHJlc2VydmUgcG9zaXRpb24gaW5mby5cbiAgICAvLyAgMS4gYHZqPi5gIC0+IGluZGVudCBzYW1lIHR3byByb3dzIHJlZ2FyZGxlc3Mgb2YgY3VycmVudCBjdXJzb3IncyByb3cuXG4gICAgLy8gIDIuIGB2aj5qLmAgLT4gaW5kZW50IHR3byByb3dzIGZyb20gY3Vyc29yJ3Mgcm93LlxuICAgIGZvciAoY29uc3QgY3Vyc29yIG9mIHRoaXMuZWRpdG9yLmdldEN1cnNvcnMoKSkge1xuICAgICAgY29uc3Qgc3RhcnRPZlNlbGVjdGlvbiA9IGN1cnNvci5zZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKS5zdGFydFxuICAgICAgdGhpcy5vbkRpZEZpbmlzaE9wZXJhdGlvbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IGN1cnNvclBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgICAgdGhpcy5wb2ludEluZm9CeUN1cnNvci5zZXQoY3Vyc29yLCB7c3RhcnRPZlNlbGVjdGlvbiwgY3Vyc29yUG9zaXRpb259KVxuICAgICAgfSlcbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgTW92ZUxlZnQgZXh0ZW5kcyBNb3Rpb24ge1xuICBtb3ZlQ3Vyc29yIChjdXJzb3IpIHtcbiAgICBjb25zdCBhbGxvd1dyYXAgPSB0aGlzLmdldENvbmZpZygnd3JhcExlZnRSaWdodE1vdGlvbicpXG4gICAgdGhpcy5tb3ZlQ3Vyc29yQ291bnRUaW1lcyhjdXJzb3IsICgpID0+IHtcbiAgICAgIHRoaXMudXRpbHMubW92ZUN1cnNvckxlZnQoY3Vyc29yLCB7YWxsb3dXcmFwfSlcbiAgICB9KVxuICB9XG59XG5cbmNsYXNzIE1vdmVSaWdodCBleHRlbmRzIE1vdGlvbiB7XG4gIG1vdmVDdXJzb3IgKGN1cnNvcikge1xuICAgIGNvbnN0IGFsbG93V3JhcCA9IHRoaXMuZ2V0Q29uZmlnKCd3cmFwTGVmdFJpZ2h0TW90aW9uJylcblxuICAgIHRoaXMubW92ZUN1cnNvckNvdW50VGltZXMoY3Vyc29yLCAoKSA9PiB7XG4gICAgICB0aGlzLmVkaXRvci51bmZvbGRCdWZmZXJSb3coY3Vyc29yLmdldEJ1ZmZlclJvdygpKVxuXG4gICAgICAvLyAtIFdoZW4gYHdyYXBMZWZ0UmlnaHRNb3Rpb25gIGVuYWJsZWQgYW5kIGV4ZWN1dGVkIGFzIHB1cmUtbW90aW9uIGluIGBub3JtYWwtbW9kZWAsXG4gICAgICAvLyAgIHdlIG5lZWQgdG8gbW92ZSAqKmFnYWluKiogdG8gd3JhcCB0byBuZXh0LWxpbmUgaWYgaXQgcmFjaGVkIHRvIEVPTC5cbiAgICAgIC8vIC0gRXhwcmVzc2lvbiBgIXRoaXMub3BlcmF0b3JgIG1lYW5zIG5vcm1hbC1tb2RlIG1vdGlvbi5cbiAgICAgIC8vIC0gRXhwcmVzc2lvbiBgdGhpcy5tb2RlID09PSBcIm5vcm1hbFwiYCBpcyBub3QgYXBwcm9wcmVhdGUgc2luY2UgaXQgbWF0Y2hlcyBgeGAgb3BlcmF0b3IncyB0YXJnZXQgY2FzZS5cbiAgICAgIGNvbnN0IG5lZWRNb3ZlQWdhaW4gPSBhbGxvd1dyYXAgJiYgIXRoaXMub3BlcmF0b3IgJiYgIWN1cnNvci5pc0F0RW5kT2ZMaW5lKClcblxuICAgICAgdGhpcy51dGlscy5tb3ZlQ3Vyc29yUmlnaHQoY3Vyc29yLCB7YWxsb3dXcmFwfSlcblxuICAgICAgaWYgKG5lZWRNb3ZlQWdhaW4gJiYgY3Vyc29yLmlzQXRFbmRPZkxpbmUoKSkge1xuICAgICAgICB0aGlzLnV0aWxzLm1vdmVDdXJzb3JSaWdodChjdXJzb3IsIHthbGxvd1dyYXB9KVxuICAgICAgfVxuICAgIH0pXG4gIH1cbn1cblxuY2xhc3MgTW92ZVJpZ2h0QnVmZmVyQ29sdW1uIGV4dGVuZHMgTW90aW9uIHtcbiAgc3RhdGljIGNvbW1hbmQgPSBmYWxzZVxuICBtb3ZlQ3Vyc29yIChjdXJzb3IpIHtcbiAgICB0aGlzLnV0aWxzLnNldEJ1ZmZlckNvbHVtbihjdXJzb3IsIGN1cnNvci5nZXRCdWZmZXJDb2x1bW4oKSArIHRoaXMuZ2V0Q291bnQoKSlcbiAgfVxufVxuXG5jbGFzcyBNb3ZlVXAgZXh0ZW5kcyBNb3Rpb24ge1xuICB3aXNlID0gJ2xpbmV3aXNlJ1xuICB3cmFwID0gZmFsc2VcbiAgZGlyZWN0aW9uID0gJ3VwJ1xuXG4gIGdldEJ1ZmZlclJvdyAocm93KSB7XG4gICAgY29uc3QgbWluID0gMFxuICAgIGNvbnN0IG1heCA9IHRoaXMuZ2V0VmltTGFzdEJ1ZmZlclJvdygpXG5cbiAgICBpZiAodGhpcy5kaXJlY3Rpb24gPT09ICd1cCcpIHtcbiAgICAgIHJvdyA9IHRoaXMuZ2V0Rm9sZFN0YXJ0Um93Rm9yUm93KHJvdykgLSAxXG4gICAgICByb3cgPSB0aGlzLndyYXAgJiYgcm93IDwgbWluID8gbWF4IDogdGhpcy5saW1pdE51bWJlcihyb3csIHttaW59KVxuICAgIH0gZWxzZSB7XG4gICAgICByb3cgPSB0aGlzLmdldEZvbGRFbmRSb3dGb3JSb3cocm93KSArIDFcbiAgICAgIHJvdyA9IHRoaXMud3JhcCAmJiByb3cgPiBtYXggPyBtaW4gOiB0aGlzLmxpbWl0TnVtYmVyKHJvdywge21heH0pXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmdldEZvbGRTdGFydFJvd0ZvclJvdyhyb3cpXG4gIH1cblxuICBtb3ZlQ3Vyc29yIChjdXJzb3IpIHtcbiAgICB0aGlzLm1vdmVDdXJzb3JDb3VudFRpbWVzKGN1cnNvciwgKCkgPT4ge1xuICAgICAgY29uc3Qgcm93ID0gdGhpcy5nZXRCdWZmZXJSb3coY3Vyc29yLmdldEJ1ZmZlclJvdygpKVxuICAgICAgdGhpcy51dGlscy5zZXRCdWZmZXJSb3coY3Vyc29yLCByb3cpXG4gICAgfSlcbiAgfVxufVxuXG5jbGFzcyBNb3ZlVXBXcmFwIGV4dGVuZHMgTW92ZVVwIHtcbiAgd3JhcCA9IHRydWVcbn1cblxuY2xhc3MgTW92ZURvd24gZXh0ZW5kcyBNb3ZlVXAge1xuICBkaXJlY3Rpb24gPSAnZG93bidcbn1cblxuY2xhc3MgTW92ZURvd25XcmFwIGV4dGVuZHMgTW92ZURvd24ge1xuICB3cmFwID0gdHJ1ZVxufVxuXG5jbGFzcyBNb3ZlVXBTY3JlZW4gZXh0ZW5kcyBNb3Rpb24ge1xuICB3aXNlID0gJ2xpbmV3aXNlJ1xuICBkaXJlY3Rpb24gPSAndXAnXG4gIG1vdmVDdXJzb3IgKGN1cnNvcikge1xuICAgIHRoaXMubW92ZUN1cnNvckNvdW50VGltZXMoY3Vyc29yLCAoKSA9PiB7XG4gICAgICB0aGlzLnV0aWxzLm1vdmVDdXJzb3JVcFNjcmVlbihjdXJzb3IpXG4gICAgfSlcbiAgfVxufVxuXG5jbGFzcyBNb3ZlRG93blNjcmVlbiBleHRlbmRzIE1vdmVVcFNjcmVlbiB7XG4gIHdpc2UgPSAnbGluZXdpc2UnXG4gIGRpcmVjdGlvbiA9ICdkb3duJ1xuICBtb3ZlQ3Vyc29yIChjdXJzb3IpIHtcbiAgICB0aGlzLm1vdmVDdXJzb3JDb3VudFRpbWVzKGN1cnNvciwgKCkgPT4ge1xuICAgICAgdGhpcy51dGlscy5tb3ZlQ3Vyc29yRG93blNjcmVlbihjdXJzb3IpXG4gICAgfSlcbiAgfVxufVxuXG5jbGFzcyBNb3ZlVXBUb0VkZ2UgZXh0ZW5kcyBNb3Rpb24ge1xuICB3aXNlID0gJ2xpbmV3aXNlJ1xuICBqdW1wID0gdHJ1ZVxuICBkaXJlY3Rpb24gPSAncHJldmlvdXMnXG4gIG1vdmVDdXJzb3IgKGN1cnNvcikge1xuICAgIHRoaXMubW92ZUN1cnNvckNvdW50VGltZXMoY3Vyc29yLCAoKSA9PiB7XG4gICAgICBjb25zdCBwb2ludCA9IHRoaXMuZ2V0UG9pbnQoY3Vyc29yLmdldFNjcmVlblBvc2l0aW9uKCkpXG4gICAgICBpZiAocG9pbnQpIGN1cnNvci5zZXRTY3JlZW5Qb3NpdGlvbihwb2ludClcbiAgICB9KVxuICB9XG5cbiAgZ2V0UG9pbnQgKGZyb21Qb2ludCkge1xuICAgIGNvbnN0IHtjb2x1bW4sIHJvdzogc3RhcnRSb3d9ID0gZnJvbVBvaW50XG4gICAgZm9yIChjb25zdCByb3cgb2YgdGhpcy5nZXRTY3JlZW5Sb3dzKHtzdGFydFJvdywgZGlyZWN0aW9uOiB0aGlzLmRpcmVjdGlvbn0pKSB7XG4gICAgICBjb25zdCBwb2ludCA9IG5ldyBQb2ludChyb3csIGNvbHVtbilcbiAgICAgIGlmICh0aGlzLmlzRWRnZShwb2ludCkpIHJldHVybiBwb2ludFxuICAgIH1cbiAgfVxuXG4gIGlzRWRnZSAocG9pbnQpIHtcbiAgICAvLyBJZiBwb2ludCBpcyBzdG9wcGFibGUgYW5kIGFib3ZlIG9yIGJlbG93IHBvaW50IGlzIG5vdCBzdG9wcGFibGUsIGl0J3MgRWRnZSFcbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy5pc1N0b3BwYWJsZShwb2ludCkgJiZcbiAgICAgICghdGhpcy5pc1N0b3BwYWJsZShwb2ludC50cmFuc2xhdGUoWy0xLCAwXSkpIHx8ICF0aGlzLmlzU3RvcHBhYmxlKHBvaW50LnRyYW5zbGF0ZShbKzEsIDBdKSkpXG4gICAgKVxuICB9XG5cbiAgaXNTdG9wcGFibGUgKHBvaW50KSB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuaXNOb25XaGl0ZVNwYWNlKHBvaW50KSB8fFxuICAgICAgdGhpcy5pc0ZpcnN0Um93T3JMYXN0Um93QW5kU3RvcHBhYmxlKHBvaW50KSB8fFxuICAgICAgLy8gSWYgcmlnaHQgb3IgbGVmdCBjb2x1bW4gaXMgbm9uLXdoaXRlLXNwYWNlIGNoYXIsIGl0J3Mgc3RvcHBhYmxlLlxuICAgICAgKHRoaXMuaXNOb25XaGl0ZVNwYWNlKHBvaW50LnRyYW5zbGF0ZShbMCwgLTFdKSkgJiYgdGhpcy5pc05vbldoaXRlU3BhY2UocG9pbnQudHJhbnNsYXRlKFswLCArMV0pKSlcbiAgICApXG4gIH1cblxuICBpc05vbldoaXRlU3BhY2UgKHBvaW50KSB7XG4gICAgY29uc3QgY2hhciA9IHRoaXMudXRpbHMuZ2V0VGV4dEluU2NyZWVuUmFuZ2UodGhpcy5lZGl0b3IsIFJhbmdlLmZyb21Qb2ludFdpdGhEZWx0YShwb2ludCwgMCwgMSkpXG4gICAgcmV0dXJuIGNoYXIgIT0gbnVsbCAmJiAvXFxTLy50ZXN0KGNoYXIpXG4gIH1cblxuICBpc0ZpcnN0Um93T3JMYXN0Um93QW5kU3RvcHBhYmxlIChwb2ludCkge1xuICAgIC8vIEluIG5vdG1hbC1tb2RlLCBjdXJzb3IgaXMgTk9UIHN0b3BwYWJsZSB0byBFT0wgb2Ygbm9uLWJsYW5rIHJvdy5cbiAgICAvLyBTbyBleHBsaWNpdGx5IGd1YXJkIHRvIG5vdCBhbnN3ZXIgaXQgc3RvcHBhYmxlLlxuICAgIGlmICh0aGlzLm1vZGUgPT09ICdub3JtYWwnICYmIHRoaXMudXRpbHMucG9pbnRJc0F0RW5kT2ZMaW5lQXROb25FbXB0eVJvdyh0aGlzLmVkaXRvciwgcG9pbnQpKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICAvLyBJZiBjbGlwcGVkLCBpdCBtZWFucyB0aGF0IG9yaWdpbmFsIHBvbml0IHdhcyBub24gc3RvcHBhYmxlKGUuZy4gcG9pbnQuY29sdW0gPiBFT0wpLlxuICAgIGNvbnN0IHtyb3d9ID0gcG9pbnRcbiAgICByZXR1cm4gKHJvdyA9PT0gMCB8fCByb3cgPT09IHRoaXMuZ2V0VmltTGFzdFNjcmVlblJvdygpKSAmJiBwb2ludC5pc0VxdWFsKHRoaXMuZWRpdG9yLmNsaXBTY3JlZW5Qb3NpdGlvbihwb2ludCkpXG4gIH1cbn1cblxuY2xhc3MgTW92ZURvd25Ub0VkZ2UgZXh0ZW5kcyBNb3ZlVXBUb0VkZ2Uge1xuICBkaXJlY3Rpb24gPSAnbmV4dCdcbn1cblxuLy8gV29yZCBNb3Rpb24gZmFtaWx5XG4vLyArLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLStcbi8vIHwgZGlyZWN0aW9uIHwgd2hpY2ggICAgICB8IHdvcmQgIHwgV09SRCB8IHN1YndvcmQgfCBzbWFydHdvcmQgfCBhbHBoYW51bWVyaWMgfFxuLy8gfC0tLS0tLS0tLS0tKy0tLS0tLS0tLS0tLSstLS0tLS0tKy0tLS0tLSstLS0tLS0tLS0rLS0tLS0tLS0tLS0rLS0tLS0tLS0tLS0tLS0rXG4vLyB8IG5leHQgICAgICB8IHdvcmQtc3RhcnQgfCB3ICAgICB8IFcgICAgfCAtICAgICAgIHwgLSAgICAgICAgIHwgLSAgICAgICAgICAgIHxcbi8vIHwgcHJldmlvdXMgIHwgd29yZC1zdGFydCB8IGIgICAgIHwgYiAgICB8IC0gICAgICAgfCAtICAgICAgICAgfCAtICAgICAgICAgICAgfFxuLy8gfCBuZXh0ICAgICAgfCB3b3JkLWVuZCAgIHwgZSAgICAgfCBFICAgIHwgLSAgICAgICB8IC0gICAgICAgICB8IC0gICAgICAgICAgICB8XG4vLyB8IHByZXZpb3VzICB8IHdvcmQtZW5kICAgfCBnZSAgICB8IGcgRSAgfCBuL2EgICAgIHwgbi9hICAgICAgIHwgbi9hICAgICAgICAgIHxcbi8vICstLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tK1xuXG5jbGFzcyBNb3Rpb25CeVdvcmQgZXh0ZW5kcyBNb3Rpb24ge1xuICBzdGF0aWMgY29tbWFuZCA9IGZhbHNlXG4gIHdvcmRSZWdleCA9IG51bGxcbiAgc2tpcEJsYW5rUm93ID0gZmFsc2VcbiAgc2tpcFdoaXRlU3BhY2VPbmx5Um93ID0gZmFsc2VcblxuICBtb3ZlQ3Vyc29yIChjdXJzb3IpIHtcbiAgICB0aGlzLm1vdmVDdXJzb3JDb3VudFRpbWVzKGN1cnNvciwgY291bnRTdGF0ZSA9PiB7XG4gICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24odGhpcy5nZXRQb2ludChjdXJzb3IsIGNvdW50U3RhdGUpKVxuICAgIH0pXG4gIH1cblxuICBnZXRQb2ludCAoY3Vyc29yLCBjb3VudFN0YXRlKSB7XG4gICAgY29uc3Qge2RpcmVjdGlvbn0gPSB0aGlzXG4gICAgbGV0IHt3aGljaH0gPSB0aGlzXG4gICAgY29uc3QgcmVnZXggPSB0aGlzLmdldFdvcmRSZWdleEZvckN1cnNvcihjdXJzb3IpXG5cbiAgICBjb25zdCBmcm9tID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBpZiAoZGlyZWN0aW9uID09PSAnbmV4dCcgJiYgd2hpY2ggPT09ICdzdGFydCcgJiYgdGhpcy5vcGVyYXRvciAmJiBjb3VudFN0YXRlLmlzRmluYWwpIHtcbiAgICAgIC8vIFtOT1RFXSBFeGNlcHRpb25hbCBiZWhhdmlvciBmb3IgdyBhbmQgVzogW0RldGFpbCBpbiB2aW0gaGVscCBgOmhlbHAgd2AuXVxuICAgICAgLy8gW2Nhc2UtQV0gY3csIGNXIHRyZWF0ZWQgYXMgY2UsIGNFIHdoZW4gY3Vyc29yIGlzIGF0IG5vbi1ibGFuay5cbiAgICAgIC8vIFtjYXNlLUJdIHdoZW4gdywgVyB1c2VkIGFzIFRBUkdFVCwgaXQgZG9lc24ndCBtb3ZlIG92ZXIgbmV3IGxpbmUuXG4gICAgICBpZiAodGhpcy5pc0VtcHR5Um93KGZyb20ucm93KSkgcmV0dXJuIFtmcm9tLnJvdyArIDEsIDBdXG5cbiAgICAgIC8vIFtjYXNlLUFdXG4gICAgICBpZiAodGhpcy5vcGVyYXRvci5uYW1lID09PSAnQ2hhbmdlJyAmJiAhdGhpcy51dGlscy5wb2ludElzQXRXaGl0ZVNwYWNlKHRoaXMuZWRpdG9yLCBmcm9tKSkge1xuICAgICAgICB3aGljaCA9ICdlbmQnXG4gICAgICB9XG4gICAgICBjb25zdCBwb2ludCA9IHRoaXMuZmluZFBvaW50KGRpcmVjdGlvbiwgcmVnZXgsIHdoaWNoLCB0aGlzLmJ1aWxkT3B0aW9ucyhmcm9tKSlcbiAgICAgIC8vIFtjYXNlLUJdXG4gICAgICByZXR1cm4gcG9pbnQgPyBQb2ludC5taW4ocG9pbnQsIFtmcm9tLnJvdywgSW5maW5pdHldKSA6IHRoaXMuZ2V0TGFzdFJlc29ydFBvaW50KGRpcmVjdGlvbilcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuZmluZFBvaW50KGRpcmVjdGlvbiwgcmVnZXgsIHdoaWNoLCB0aGlzLmJ1aWxkT3B0aW9ucyhmcm9tKSkgfHwgdGhpcy5nZXRMYXN0UmVzb3J0UG9pbnQoZGlyZWN0aW9uKVxuICAgIH1cbiAgfVxuXG4gIGJ1aWxkT3B0aW9ucyAoZnJvbSkge1xuICAgIHJldHVybiB7XG4gICAgICBmcm9tOiBmcm9tLFxuICAgICAgc2tpcEVtcHR5Um93OiB0aGlzLnNraXBFbXB0eVJvdyxcbiAgICAgIHNraXBXaGl0ZVNwYWNlT25seVJvdzogdGhpcy5za2lwV2hpdGVTcGFjZU9ubHlSb3csXG4gICAgICBwcmVUcmFuc2xhdGU6ICh0aGlzLndoaWNoID09PSAnZW5kJyAmJiBbMCwgKzFdKSB8fCB1bmRlZmluZWQsXG4gICAgICBwb3N0VHJhbnNsYXRlOiAodGhpcy53aGljaCA9PT0gJ2VuZCcgJiYgWzAsIC0xXSkgfHwgdW5kZWZpbmVkXG4gICAgfVxuICB9XG5cbiAgZ2V0V29yZFJlZ2V4Rm9yQ3Vyc29yIChjdXJzb3IpIHtcbiAgICBpZiAodGhpcy5uYW1lLmVuZHNXaXRoKCdTdWJ3b3JkJykpIHtcbiAgICAgIHJldHVybiBjdXJzb3Iuc3Vid29yZFJlZ0V4cCgpXG4gICAgfVxuXG4gICAgaWYgKHRoaXMud29yZFJlZ2V4KSB7XG4gICAgICByZXR1cm4gdGhpcy53b3JkUmVnZXhcbiAgICB9XG5cbiAgICBpZiAodGhpcy5nZXRDb25maWcoJ3VzZUxhbmd1YWdlSW5kZXBlbmRlbnROb25Xb3JkQ2hhcmFjdGVycycpKSB7XG4gICAgICBjb25zdCBub25Xb3JkQ2hhcmFjdGVycyA9IHRoaXMuXy5lc2NhcGVSZWdFeHAodGhpcy51dGlscy5nZXROb25Xb3JkQ2hhcmFjdGVyc0ZvckN1cnNvcihjdXJzb3IpKVxuICAgICAgY29uc3Qgc291cmNlID0gYF5bXFxcXHRcXFxcciBdKiR8W15cXFxccyR7bm9uV29yZENoYXJhY3RlcnN9XSt8WyR7bm9uV29yZENoYXJhY3RlcnN9XStgXG4gICAgICByZXR1cm4gbmV3IFJlZ0V4cChzb3VyY2UsICdnJylcbiAgICB9XG4gICAgcmV0dXJuIGN1cnNvci53b3JkUmVnRXhwKClcbiAgfVxufVxuXG4vLyB3XG5jbGFzcyBNb3ZlVG9OZXh0V29yZCBleHRlbmRzIE1vdGlvbkJ5V29yZCB7XG4gIGRpcmVjdGlvbiA9ICduZXh0J1xuICB3aGljaCA9ICdzdGFydCdcbn1cblxuLy8gV1xuY2xhc3MgTW92ZVRvTmV4dFdob2xlV29yZCBleHRlbmRzIE1vdmVUb05leHRXb3JkIHtcbiAgd29yZFJlZ2V4ID0gL14kfFxcUysvZ1xufVxuXG4vLyBuby1rZXltYXBcbmNsYXNzIE1vdmVUb05leHRTdWJ3b3JkIGV4dGVuZHMgTW92ZVRvTmV4dFdvcmQge31cblxuLy8gbm8ta2V5bWFwXG5jbGFzcyBNb3ZlVG9OZXh0U21hcnRXb3JkIGV4dGVuZHMgTW92ZVRvTmV4dFdvcmQge1xuICB3b3JkUmVnZXggPSAvW1xcdy1dKy9nXG59XG5cbi8vIG5vLWtleW1hcFxuY2xhc3MgTW92ZVRvTmV4dEFscGhhbnVtZXJpY1dvcmQgZXh0ZW5kcyBNb3ZlVG9OZXh0V29yZCB7XG4gIHdvcmRSZWdleCA9IC9cXHcrL2dcbn1cblxuLy8gYlxuY2xhc3MgTW92ZVRvUHJldmlvdXNXb3JkIGV4dGVuZHMgTW90aW9uQnlXb3JkIHtcbiAgZGlyZWN0aW9uID0gJ3ByZXZpb3VzJ1xuICB3aGljaCA9ICdzdGFydCdcbiAgc2tpcFdoaXRlU3BhY2VPbmx5Um93ID0gdHJ1ZVxufVxuXG4vLyBCXG5jbGFzcyBNb3ZlVG9QcmV2aW91c1dob2xlV29yZCBleHRlbmRzIE1vdmVUb1ByZXZpb3VzV29yZCB7XG4gIHdvcmRSZWdleCA9IC9eJHxcXFMrL2dcbn1cblxuLy8gbm8ta2V5bWFwXG5jbGFzcyBNb3ZlVG9QcmV2aW91c1N1YndvcmQgZXh0ZW5kcyBNb3ZlVG9QcmV2aW91c1dvcmQge31cblxuLy8gbm8ta2V5bWFwXG5jbGFzcyBNb3ZlVG9QcmV2aW91c1NtYXJ0V29yZCBleHRlbmRzIE1vdmVUb1ByZXZpb3VzV29yZCB7XG4gIHdvcmRSZWdleCA9IC9bXFx3LV0rL1xufVxuXG4vLyBuby1rZXltYXBcbmNsYXNzIE1vdmVUb1ByZXZpb3VzQWxwaGFudW1lcmljV29yZCBleHRlbmRzIE1vdmVUb1ByZXZpb3VzV29yZCB7XG4gIHdvcmRSZWdleCA9IC9cXHcrL1xufVxuXG4vLyBlXG5jbGFzcyBNb3ZlVG9FbmRPZldvcmQgZXh0ZW5kcyBNb3Rpb25CeVdvcmQge1xuICBpbmNsdXNpdmUgPSB0cnVlXG4gIGRpcmVjdGlvbiA9ICduZXh0J1xuICB3aGljaCA9ICdlbmQnXG4gIHNraXBFbXB0eVJvdyA9IHRydWVcbiAgc2tpcFdoaXRlU3BhY2VPbmx5Um93ID0gdHJ1ZVxufVxuXG4vLyBFXG5jbGFzcyBNb3ZlVG9FbmRPZldob2xlV29yZCBleHRlbmRzIE1vdmVUb0VuZE9mV29yZCB7XG4gIHdvcmRSZWdleCA9IC9cXFMrL2dcbn1cblxuLy8gbm8ta2V5bWFwXG5jbGFzcyBNb3ZlVG9FbmRPZlN1YndvcmQgZXh0ZW5kcyBNb3ZlVG9FbmRPZldvcmQge31cblxuLy8gbm8ta2V5bWFwXG5jbGFzcyBNb3ZlVG9FbmRPZlNtYXJ0V29yZCBleHRlbmRzIE1vdmVUb0VuZE9mV29yZCB7XG4gIHdvcmRSZWdleCA9IC9bXFx3LV0rL2dcbn1cblxuLy8gbm8ta2V5bWFwXG5jbGFzcyBNb3ZlVG9FbmRPZkFscGhhbnVtZXJpY1dvcmQgZXh0ZW5kcyBNb3ZlVG9FbmRPZldvcmQge1xuICB3b3JkUmVnZXggPSAvXFx3Ky9nXG59XG5cbi8vIGdlXG5jbGFzcyBNb3ZlVG9QcmV2aW91c0VuZE9mV29yZCBleHRlbmRzIE1vdGlvbkJ5V29yZCB7XG4gIGluY2x1c2l2ZSA9IHRydWVcbiAgZGlyZWN0aW9uID0gJ3ByZXZpb3VzJ1xuICB3aGljaCA9ICdlbmQnXG4gIHNraXBXaGl0ZVNwYWNlT25seVJvdyA9IHRydWVcbn1cblxuLy8gZ0VcbmNsYXNzIE1vdmVUb1ByZXZpb3VzRW5kT2ZXaG9sZVdvcmQgZXh0ZW5kcyBNb3ZlVG9QcmV2aW91c0VuZE9mV29yZCB7XG4gIHdvcmRSZWdleCA9IC9cXFMrL2dcbn1cblxuLy8gU2VudGVuY2Vcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFNlbnRlbmNlIGlzIGRlZmluZWQgYXMgYmVsb3dcbi8vICAtIGVuZCB3aXRoIFsnLicsICchJywgJz8nXVxuLy8gIC0gb3B0aW9uYWxseSBmb2xsb3dlZCBieSBbJyknLCAnXScsICdcIicsIFwiJ1wiXVxuLy8gIC0gZm9sbG93ZWQgYnkgWyckJywgJyAnLCAnXFx0J11cbi8vICAtIHBhcmFncmFwaCBib3VuZGFyeSBpcyBhbHNvIHNlbnRlbmNlIGJvdW5kYXJ5XG4vLyAgLSBzZWN0aW9uIGJvdW5kYXJ5IGlzIGFsc28gc2VudGVuY2UgYm91bmRhcnkoaWdub3JlKVxuY2xhc3MgTW92ZVRvTmV4dFNlbnRlbmNlIGV4dGVuZHMgTW90aW9uIHtcbiAganVtcCA9IHRydWVcbiAgc2VudGVuY2VSZWdleCA9IG5ldyBSZWdFeHAoYCg/OltcXFxcLiFcXFxcP11bXFxcXClcXFxcXVwiJ10qXFxcXHMrKXwoXFxcXG58XFxcXHJcXFxcbilgLCAnZycpXG4gIGRpcmVjdGlvbiA9ICduZXh0J1xuXG4gIG1vdmVDdXJzb3IgKGN1cnNvcikge1xuICAgIHRoaXMubW92ZUN1cnNvckNvdW50VGltZXMoY3Vyc29yLCAoKSA9PiB7XG4gICAgICBjb25zdCBwb2ludCA9XG4gICAgICAgIHRoaXMuZGlyZWN0aW9uID09PSAnbmV4dCdcbiAgICAgICAgICA/IHRoaXMuZ2V0TmV4dFN0YXJ0T2ZTZW50ZW5jZShjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICAgICAgICA6IHRoaXMuZ2V0UHJldmlvdXNTdGFydE9mU2VudGVuY2UoY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQgfHwgdGhpcy5nZXRMYXN0UmVzb3J0UG9pbnQodGhpcy5kaXJlY3Rpb24pKVxuICAgIH0pXG4gIH1cblxuICBpc0JsYW5rUm93IChyb3cpIHtcbiAgICByZXR1cm4gdGhpcy5lZGl0b3IuaXNCdWZmZXJSb3dCbGFuayhyb3cpXG4gIH1cblxuICBnZXROZXh0U3RhcnRPZlNlbnRlbmNlIChmcm9tKSB7XG4gICAgcmV0dXJuIHRoaXMuZmluZEluRWRpdG9yKCdmb3J3YXJkJywgdGhpcy5zZW50ZW5jZVJlZ2V4LCB7ZnJvbX0sICh7cmFuZ2UsIG1hdGNofSkgPT4ge1xuICAgICAgaWYgKG1hdGNoWzFdICE9IG51bGwpIHtcbiAgICAgICAgY29uc3QgW3N0YXJ0Um93LCBlbmRSb3ddID0gW3JhbmdlLnN0YXJ0LnJvdywgcmFuZ2UuZW5kLnJvd11cbiAgICAgICAgaWYgKHRoaXMuc2tpcEJsYW5rUm93ICYmIHRoaXMuaXNCbGFua1JvdyhlbmRSb3cpKSByZXR1cm5cbiAgICAgICAgaWYgKHRoaXMuaXNCbGFua1JvdyhzdGFydFJvdykgIT09IHRoaXMuaXNCbGFua1JvdyhlbmRSb3cpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Rmlyc3RDaGFyYWN0ZXJQb3NpdGlvbkZvckJ1ZmZlclJvdyhlbmRSb3cpXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiByYW5nZS5lbmRcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgZ2V0UHJldmlvdXNTdGFydE9mU2VudGVuY2UgKGZyb20pIHtcbiAgICByZXR1cm4gdGhpcy5maW5kSW5FZGl0b3IoJ2JhY2t3YXJkJywgdGhpcy5zZW50ZW5jZVJlZ2V4LCB7ZnJvbX0sICh7cmFuZ2UsIG1hdGNofSkgPT4ge1xuICAgICAgaWYgKG1hdGNoWzFdICE9IG51bGwpIHtcbiAgICAgICAgY29uc3QgW3N0YXJ0Um93LCBlbmRSb3ddID0gW3JhbmdlLnN0YXJ0LnJvdywgcmFuZ2UuZW5kLnJvd11cbiAgICAgICAgaWYgKCF0aGlzLmlzQmxhbmtSb3coZW5kUm93KSAmJiB0aGlzLmlzQmxhbmtSb3coc3RhcnRSb3cpKSB7XG4gICAgICAgICAgY29uc3QgcG9pbnQgPSB0aGlzLmdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JCdWZmZXJSb3coZW5kUm93KVxuICAgICAgICAgIGlmIChwb2ludC5pc0xlc3NUaGFuKGZyb20pKSByZXR1cm4gcG9pbnRcbiAgICAgICAgICBlbHNlIGlmICghdGhpcy5za2lwQmxhbmtSb3cpIHJldHVybiB0aGlzLmdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JCdWZmZXJSb3coc3RhcnRSb3cpXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAocmFuZ2UuZW5kLmlzTGVzc1RoYW4oZnJvbSkpIHtcbiAgICAgICAgcmV0dXJuIHJhbmdlLmVuZFxuICAgICAgfVxuICAgIH0pXG4gIH1cbn1cblxuY2xhc3MgTW92ZVRvUHJldmlvdXNTZW50ZW5jZSBleHRlbmRzIE1vdmVUb05leHRTZW50ZW5jZSB7XG4gIGRpcmVjdGlvbiA9ICdwcmV2aW91cydcbn1cblxuY2xhc3MgTW92ZVRvTmV4dFNlbnRlbmNlU2tpcEJsYW5rUm93IGV4dGVuZHMgTW92ZVRvTmV4dFNlbnRlbmNlIHtcbiAgc2tpcEJsYW5rUm93ID0gdHJ1ZVxufVxuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c1NlbnRlbmNlU2tpcEJsYW5rUm93IGV4dGVuZHMgTW92ZVRvUHJldmlvdXNTZW50ZW5jZSB7XG4gIHNraXBCbGFua1JvdyA9IHRydWVcbn1cblxuLy8gUGFyYWdyYXBoXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBNb3ZlVG9OZXh0UGFyYWdyYXBoIGV4dGVuZHMgTW90aW9uIHtcbiAganVtcCA9IHRydWVcbiAgZGlyZWN0aW9uID0gJ25leHQnXG5cbiAgbW92ZUN1cnNvciAoY3Vyc29yKSB7XG4gICAgdGhpcy5tb3ZlQ3Vyc29yQ291bnRUaW1lcyhjdXJzb3IsICgpID0+IHtcbiAgICAgIGNvbnN0IHBvaW50ID0gdGhpcy5nZXRQb2ludChjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludCB8fCB0aGlzLmdldExhc3RSZXNvcnRQb2ludCh0aGlzLmRpcmVjdGlvbikpXG4gICAgfSlcbiAgfVxuXG4gIGdldFBvaW50IChmcm9tKSB7XG4gICAgbGV0IHdhc0JsYW5rUm93ID0gdGhpcy5lZGl0b3IuaXNCdWZmZXJSb3dCbGFuayhmcm9tLnJvdylcbiAgICBjb25zdCByb3dzID0gdGhpcy5nZXRCdWZmZXJSb3dzKHtzdGFydFJvdzogZnJvbS5yb3csIGRpcmVjdGlvbjogdGhpcy5kaXJlY3Rpb259KVxuICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgIGNvbnN0IGlzQmxhbmtSb3cgPSB0aGlzLmVkaXRvci5pc0J1ZmZlclJvd0JsYW5rKHJvdylcbiAgICAgIGlmICghd2FzQmxhbmtSb3cgJiYgaXNCbGFua1Jvdykge1xuICAgICAgICByZXR1cm4gW3JvdywgMF1cbiAgICAgIH1cbiAgICAgIHdhc0JsYW5rUm93ID0gaXNCbGFua1Jvd1xuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c1BhcmFncmFwaCBleHRlbmRzIE1vdmVUb05leHRQYXJhZ3JhcGgge1xuICBkaXJlY3Rpb24gPSAncHJldmlvdXMnXG59XG5cbmNsYXNzIE1vdmVUb05leHREaWZmSHVuayBleHRlbmRzIE1vdGlvbiB7XG4gIGp1bXAgPSB0cnVlXG4gIGRpcmVjdGlvbiA9ICduZXh0J1xuXG4gIG1vdmVDdXJzb3IgKGN1cnNvcikge1xuICAgIHRoaXMubW92ZUN1cnNvckNvdW50VGltZXMoY3Vyc29yLCAoKSA9PiB7XG4gICAgICBjb25zdCBwb2ludCA9IHRoaXMuZ2V0UG9pbnQoY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgICBpZiAocG9pbnQpIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcbiAgICB9KVxuICB9XG5cbiAgZ2V0UG9pbnQgKGZyb20pIHtcbiAgICBjb25zdCBnZXRIdW5rUmFuZ2UgPSByb3cgPT4gdGhpcy51dGlscy5nZXRIdW5rUmFuZ2VBdEJ1ZmZlclJvdyh0aGlzLmVkaXRvciwgcm93KVxuICAgIGxldCBodW5rUmFuZ2UgPSBnZXRIdW5rUmFuZ2UoZnJvbS5yb3cpXG4gICAgcmV0dXJuIHRoaXMuZmluZEluRWRpdG9yKHRoaXMuZGlyZWN0aW9uLCAvXlsrLV0vZywge2Zyb219LCAoe3JhbmdlfSkgPT4ge1xuICAgICAgaWYgKGh1bmtSYW5nZSAmJiBodW5rUmFuZ2UuY29udGFpbnNQb2ludChyYW5nZS5zdGFydCkpIHJldHVyblxuXG4gICAgICByZXR1cm4gZ2V0SHVua1JhbmdlKHJhbmdlLnN0YXJ0LnJvdykuc3RhcnRcbiAgICB9KVxuICB9XG59XG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzRGlmZkh1bmsgZXh0ZW5kcyBNb3ZlVG9OZXh0RGlmZkh1bmsge1xuICBkaXJlY3Rpb24gPSAncHJldmlvdXMnXG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIGtleW1hcDogMFxuY2xhc3MgTW92ZVRvQmVnaW5uaW5nT2ZMaW5lIGV4dGVuZHMgTW90aW9uIHtcbiAgbW92ZUN1cnNvciAoY3Vyc29yKSB7XG4gICAgdGhpcy51dGlscy5zZXRCdWZmZXJDb2x1bW4oY3Vyc29yLCAwKVxuICB9XG59XG5cbmNsYXNzIE1vdmVUb0NvbHVtbiBleHRlbmRzIE1vdGlvbiB7XG4gIG1vdmVDdXJzb3IgKGN1cnNvcikge1xuICAgIHRoaXMudXRpbHMuc2V0QnVmZmVyQ29sdW1uKGN1cnNvciwgdGhpcy5nZXRDb3VudCgpIC0gMSlcbiAgfVxufVxuXG5jbGFzcyBNb3ZlVG9MYXN0Q2hhcmFjdGVyT2ZMaW5lIGV4dGVuZHMgTW90aW9uIHtcbiAgbW92ZUN1cnNvciAoY3Vyc29yKSB7XG4gICAgY29uc3Qgcm93ID0gdGhpcy5nZXRWYWxpZFZpbUJ1ZmZlclJvdyhjdXJzb3IuZ2V0QnVmZmVyUm93KCkgKyB0aGlzLmdldENvdW50KCkgLSAxKVxuICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihbcm93LCBJbmZpbml0eV0pXG4gICAgY3Vyc29yLmdvYWxDb2x1bW4gPSBJbmZpbml0eVxuICB9XG59XG5cbmNsYXNzIE1vdmVUb0xhc3ROb25ibGFua0NoYXJhY3Rlck9mTGluZUFuZERvd24gZXh0ZW5kcyBNb3Rpb24ge1xuICBpbmNsdXNpdmUgPSB0cnVlXG5cbiAgbW92ZUN1cnNvciAoY3Vyc29yKSB7XG4gICAgY29uc3Qgcm93ID0gdGhpcy5saW1pdE51bWJlcihjdXJzb3IuZ2V0QnVmZmVyUm93KCkgKyB0aGlzLmdldENvdW50KCkgLSAxLCB7bWF4OiB0aGlzLmdldFZpbUxhc3RCdWZmZXJSb3coKX0pXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtmcm9tOiBbcm93LCBJbmZpbml0eV0sIGFsbG93TmV4dExpbmU6IGZhbHNlfVxuICAgIGNvbnN0IHBvaW50ID0gdGhpcy5maW5kSW5FZGl0b3IoJ2JhY2t3YXJkJywgL1xcU3xeLywgb3B0aW9ucywgZXZlbnQgPT4gZXZlbnQucmFuZ2Uuc3RhcnQpXG4gICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuICB9XG59XG5cbi8vIE1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lIGZhaW1pbHlcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gXlxuY2xhc3MgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUgZXh0ZW5kcyBNb3Rpb24ge1xuICBtb3ZlQ3Vyc29yIChjdXJzb3IpIHtcbiAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24odGhpcy5nZXRGaXJzdENoYXJhY3RlclBvc2l0aW9uRm9yQnVmZmVyUm93KGN1cnNvci5nZXRCdWZmZXJSb3coKSkpXG4gIH1cbn1cblxuY2xhc3MgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmVVcCBleHRlbmRzIE1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lIHtcbiAgd2lzZSA9ICdsaW5ld2lzZSdcbiAgbW92ZUN1cnNvciAoY3Vyc29yKSB7XG4gICAgdGhpcy5tb3ZlQ3Vyc29yQ291bnRUaW1lcyhjdXJzb3IsICgpID0+IHtcbiAgICAgIGNvbnN0IHJvdyA9IHRoaXMuZ2V0VmFsaWRWaW1CdWZmZXJSb3coY3Vyc29yLmdldEJ1ZmZlclJvdygpIC0gMSlcbiAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihbcm93LCAwXSlcbiAgICB9KVxuICAgIHN1cGVyLm1vdmVDdXJzb3IoY3Vyc29yKVxuICB9XG59XG5cbmNsYXNzIE1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lRG93biBleHRlbmRzIE1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lIHtcbiAgd2lzZSA9ICdsaW5ld2lzZSdcbiAgbW92ZUN1cnNvciAoY3Vyc29yKSB7XG4gICAgdGhpcy5tb3ZlQ3Vyc29yQ291bnRUaW1lcyhjdXJzb3IsICgpID0+IHtcbiAgICAgIGNvbnN0IHBvaW50ID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIGlmIChwb2ludC5yb3cgPCB0aGlzLmdldFZpbUxhc3RCdWZmZXJSb3coKSkge1xuICAgICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQudHJhbnNsYXRlKFsrMSwgMF0pKVxuICAgICAgfVxuICAgIH0pXG4gICAgc3VwZXIubW92ZUN1cnNvcihjdXJzb3IpXG4gIH1cbn1cblxuY2xhc3MgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmVBbmREb3duIGV4dGVuZHMgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmVEb3duIHtcbiAgZ2V0Q291bnQgKCkge1xuICAgIHJldHVybiBzdXBlci5nZXRDb3VudCgpIC0gMVxuICB9XG59XG5cbmNsYXNzIE1vdmVUb1NjcmVlbkNvbHVtbiBleHRlbmRzIE1vdGlvbiB7XG4gIHN0YXRpYyBjb21tYW5kID0gZmFsc2VcbiAgbW92ZUN1cnNvciAoY3Vyc29yKSB7XG4gICAgY29uc3QgcG9pbnQgPSB0aGlzLnV0aWxzLmdldFNjcmVlblBvc2l0aW9uRm9yU2NyZWVuUm93KHRoaXMuZWRpdG9yLCBjdXJzb3IuZ2V0U2NyZWVuUm93KCksIHRoaXMud2hpY2gsIHtcbiAgICAgIGFsbG93T2ZmU2NyZWVuUG9zaXRpb246IHRoaXMuZ2V0Q29uZmlnKCdhbGxvd01vdmVUb09mZlNjcmVlbkNvbHVtbk9uU2NyZWVuTGluZU1vdGlvbicpXG4gICAgfSlcbiAgICBpZiAocG9pbnQpIGN1cnNvci5zZXRTY3JlZW5Qb3NpdGlvbihwb2ludClcbiAgfVxufVxuXG4vLyBrZXltYXA6IGcgMFxuY2xhc3MgTW92ZVRvQmVnaW5uaW5nT2ZTY3JlZW5MaW5lIGV4dGVuZHMgTW92ZVRvU2NyZWVuQ29sdW1uIHtcbiAgd2hpY2ggPSAnYmVnaW5uaW5nJ1xufVxuXG4vLyBnIF46IGBtb3ZlLXRvLWZpcnN0LWNoYXJhY3Rlci1vZi1zY3JlZW4tbGluZWBcbmNsYXNzIE1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZTY3JlZW5MaW5lIGV4dGVuZHMgTW92ZVRvU2NyZWVuQ29sdW1uIHtcbiAgd2hpY2ggPSAnZmlyc3QtY2hhcmFjdGVyJ1xufVxuXG4vLyBrZXltYXA6IGcgJFxuY2xhc3MgTW92ZVRvTGFzdENoYXJhY3Rlck9mU2NyZWVuTGluZSBleHRlbmRzIE1vdmVUb1NjcmVlbkNvbHVtbiB7XG4gIHdoaWNoID0gJ2xhc3QtY2hhcmFjdGVyJ1xufVxuXG4vLyBrZXltYXA6IGcgZ1xuY2xhc3MgTW92ZVRvRmlyc3RMaW5lIGV4dGVuZHMgTW90aW9uIHtcbiAgd2lzZSA9ICdsaW5ld2lzZSdcbiAganVtcCA9IHRydWVcbiAgdmVydGljYWxNb3Rpb24gPSB0cnVlXG4gIG1vdmVTdWNjZXNzT25MaW5ld2lzZSA9IHRydWVcblxuICBtb3ZlQ3Vyc29yIChjdXJzb3IpIHtcbiAgICB0aGlzLnNldEN1cnNvckJ1ZmZlclJvdyhjdXJzb3IsIHRoaXMuZ2V0VmFsaWRWaW1CdWZmZXJSb3codGhpcy5nZXRSb3coKSkpXG4gICAgY3Vyc29yLmF1dG9zY3JvbGwoe2NlbnRlcjogdHJ1ZX0pXG4gIH1cblxuICBnZXRSb3cgKCkge1xuICAgIHJldHVybiB0aGlzLmdldENvdW50KCkgLSAxXG4gIH1cbn1cblxuLy8ga2V5bWFwOiBHXG5jbGFzcyBNb3ZlVG9MYXN0TGluZSBleHRlbmRzIE1vdmVUb0ZpcnN0TGluZSB7XG4gIGRlZmF1bHRDb3VudCA9IEluZmluaXR5XG59XG5cbi8vIGtleW1hcDogTiUgZS5nLiAxMCVcbmNsYXNzIE1vdmVUb0xpbmVCeVBlcmNlbnQgZXh0ZW5kcyBNb3ZlVG9GaXJzdExpbmUge1xuICBnZXRSb3cgKCkge1xuICAgIGNvbnN0IHBlcmNlbnQgPSB0aGlzLmxpbWl0TnVtYmVyKHRoaXMuZ2V0Q291bnQoKSwge21heDogMTAwfSlcbiAgICByZXR1cm4gTWF0aC5mbG9vcih0aGlzLmdldFZpbUxhc3RCdWZmZXJSb3coKSAqIChwZXJjZW50IC8gMTAwKSlcbiAgfVxufVxuXG5jbGFzcyBNb3ZlVG9SZWxhdGl2ZUxpbmUgZXh0ZW5kcyBNb3Rpb24ge1xuICBzdGF0aWMgY29tbWFuZCA9IGZhbHNlXG4gIHdpc2UgPSAnbGluZXdpc2UnXG4gIG1vdmVTdWNjZXNzT25MaW5ld2lzZSA9IHRydWVcblxuICBtb3ZlQ3Vyc29yIChjdXJzb3IpIHtcbiAgICBsZXQgcm93XG4gICAgbGV0IGNvdW50ID0gdGhpcy5nZXRDb3VudCgpXG4gICAgaWYgKGNvdW50IDwgMCkge1xuICAgICAgLy8gU3VwcG9ydCBuZWdhdGl2ZSBjb3VudFxuICAgICAgLy8gTmVnYXRpdmUgY291bnQgY2FuIGJlIHBhc3NlZCBsaWtlIGBvcGVyYXRpb25TdGFjay5ydW4oXCJNb3ZlVG9SZWxhdGl2ZUxpbmVcIiwge2NvdW50OiAtNX0pYC5cbiAgICAgIC8vIEN1cnJlbnRseSB1c2VkIGluIHZpbS1tb2RlLXBsdXMtZXgtbW9kZSBwa2cuXG4gICAgICB3aGlsZSAoY291bnQrKyA8IDApIHtcbiAgICAgICAgcm93ID0gdGhpcy5nZXRGb2xkU3RhcnRSb3dGb3JSb3cocm93ID09IG51bGwgPyBjdXJzb3IuZ2V0QnVmZmVyUm93KCkgOiByb3cgLSAxKVxuICAgICAgICBpZiAocm93IDw9IDApIGJyZWFrXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG1heFJvdyA9IHRoaXMuZ2V0VmltTGFzdEJ1ZmZlclJvdygpXG4gICAgICB3aGlsZSAoY291bnQtLSA+IDApIHtcbiAgICAgICAgcm93ID0gdGhpcy5nZXRGb2xkRW5kUm93Rm9yUm93KHJvdyA9PSBudWxsID8gY3Vyc29yLmdldEJ1ZmZlclJvdygpIDogcm93ICsgMSlcbiAgICAgICAgaWYgKHJvdyA+PSBtYXhSb3cpIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMudXRpbHMuc2V0QnVmZmVyUm93KGN1cnNvciwgcm93KVxuICB9XG59XG5cbmNsYXNzIE1vdmVUb1JlbGF0aXZlTGluZU1pbmltdW1Ud28gZXh0ZW5kcyBNb3ZlVG9SZWxhdGl2ZUxpbmUge1xuICBzdGF0aWMgY29tbWFuZCA9IGZhbHNlXG4gIGdldENvdW50ICgpIHtcbiAgICByZXR1cm4gdGhpcy5saW1pdE51bWJlcihzdXBlci5nZXRDb3VudCgpLCB7bWluOiAyfSlcbiAgfVxufVxuXG4vLyBQb3NpdGlvbiBjdXJzb3Igd2l0aG91dCBzY3JvbGxpbmcuLCBILCBNLCBMXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBrZXltYXA6IEhcbmNsYXNzIE1vdmVUb1RvcE9mU2NyZWVuIGV4dGVuZHMgTW90aW9uIHtcbiAgd2lzZSA9ICdsaW5ld2lzZSdcbiAganVtcCA9IHRydWVcbiAgZGVmYXVsdENvdW50ID0gMFxuICB2ZXJ0aWNhbE1vdGlvbiA9IHRydWVcblxuICBtb3ZlQ3Vyc29yIChjdXJzb3IpIHtcbiAgICBjb25zdCBidWZmZXJSb3cgPSB0aGlzLmVkaXRvci5idWZmZXJSb3dGb3JTY3JlZW5Sb3codGhpcy5nZXRTY3JlZW5Sb3coKSlcbiAgICB0aGlzLnNldEN1cnNvckJ1ZmZlclJvdyhjdXJzb3IsIGJ1ZmZlclJvdylcbiAgfVxuXG4gIGdldFNjcmVlblJvdyAoKSB7XG4gICAgY29uc3QgZmlyc3RWaXNpYmxlUm93ID0gdGhpcy5lZGl0b3IuZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KClcbiAgICBjb25zdCBsYXN0VmlzaWJsZVJvdyA9IHRoaXMubGltaXROdW1iZXIodGhpcy5lZGl0b3IuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKSwge21heDogdGhpcy5nZXRWaW1MYXN0U2NyZWVuUm93KCl9KVxuXG4gICAgY29uc3QgYmFzZU9mZnNldCA9IDJcbiAgICBpZiAodGhpcy5uYW1lID09PSAnTW92ZVRvVG9wT2ZTY3JlZW4nKSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSBmaXJzdFZpc2libGVSb3cgPT09IDAgPyAwIDogYmFzZU9mZnNldFxuICAgICAgY29uc3QgY291bnQgPSB0aGlzLmdldENvdW50KCkgLSAxXG4gICAgICByZXR1cm4gdGhpcy5saW1pdE51bWJlcihmaXJzdFZpc2libGVSb3cgKyBjb3VudCwge21pbjogZmlyc3RWaXNpYmxlUm93ICsgb2Zmc2V0LCBtYXg6IGxhc3RWaXNpYmxlUm93fSlcbiAgICB9IGVsc2UgaWYgKHRoaXMubmFtZSA9PT0gJ01vdmVUb01pZGRsZU9mU2NyZWVuJykge1xuICAgICAgcmV0dXJuIGZpcnN0VmlzaWJsZVJvdyArIE1hdGguZmxvb3IoKGxhc3RWaXNpYmxlUm93IC0gZmlyc3RWaXNpYmxlUm93KSAvIDIpXG4gICAgfSBlbHNlIGlmICh0aGlzLm5hbWUgPT09ICdNb3ZlVG9Cb3R0b21PZlNjcmVlbicpIHtcbiAgICAgIGNvbnN0IG9mZnNldCA9IGxhc3RWaXNpYmxlUm93ID09PSB0aGlzLmdldFZpbUxhc3RTY3JlZW5Sb3coKSA/IDAgOiBiYXNlT2Zmc2V0ICsgMVxuICAgICAgY29uc3QgY291bnQgPSB0aGlzLmdldENvdW50KCkgLSAxXG4gICAgICByZXR1cm4gdGhpcy5saW1pdE51bWJlcihsYXN0VmlzaWJsZVJvdyAtIGNvdW50LCB7bWluOiBmaXJzdFZpc2libGVSb3csIG1heDogbGFzdFZpc2libGVSb3cgLSBvZmZzZXR9KVxuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBNb3ZlVG9NaWRkbGVPZlNjcmVlbiBleHRlbmRzIE1vdmVUb1RvcE9mU2NyZWVuIHt9IC8vIGtleW1hcDogTVxuY2xhc3MgTW92ZVRvQm90dG9tT2ZTY3JlZW4gZXh0ZW5kcyBNb3ZlVG9Ub3BPZlNjcmVlbiB7fSAvLyBrZXltYXA6IExcblxuLy8gU2Nyb2xsaW5nXG4vLyBIYWxmOiBjdHJsLWQsIGN0cmwtdVxuLy8gRnVsbDogY3RybC1mLCBjdHJsLWJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFtGSVhNRV0gY291bnQgYmVoYXZlIGRpZmZlcmVudGx5IGZyb20gb3JpZ2luYWwgVmltLlxuY2xhc3MgU2Nyb2xsIGV4dGVuZHMgTW90aW9uIHtcbiAgc3RhdGljIGNvbW1hbmQgPSBmYWxzZVxuICBzdGF0aWMgc2Nyb2xsVGFzayA9IG51bGxcbiAgc3RhdGljIGFtb3VudE9mUGFnZUJ5TmFtZSA9IHtcbiAgICBTY3JvbGxGdWxsU2NyZWVuRG93bjogMSxcbiAgICBTY3JvbGxGdWxsU2NyZWVuVXA6IC0xLFxuICAgIFNjcm9sbEhhbGZTY3JlZW5Eb3duOiAwLjUsXG4gICAgU2Nyb2xsSGFsZlNjcmVlblVwOiAtMC41LFxuICAgIFNjcm9sbFF1YXJ0ZXJTY3JlZW5Eb3duOiAwLjI1LFxuICAgIFNjcm9sbFF1YXJ0ZXJTY3JlZW5VcDogLTAuMjVcbiAgfVxuICB2ZXJ0aWNhbE1vdGlvbiA9IHRydWVcblxuICBleGVjdXRlICgpIHtcbiAgICBjb25zdCBhbW91bnRPZlBhZ2UgPSB0aGlzLmNvbnN0cnVjdG9yLmFtb3VudE9mUGFnZUJ5TmFtZVt0aGlzLm5hbWVdXG4gICAgY29uc3QgYW1vdW50T2ZTY3JlZW5Sb3dzID0gTWF0aC50cnVuYyhhbW91bnRPZlBhZ2UgKiB0aGlzLmVkaXRvci5nZXRSb3dzUGVyUGFnZSgpICogdGhpcy5nZXRDb3VudCgpKVxuICAgIHRoaXMuYW1vdW50T2ZQaXhlbHMgPSBhbW91bnRPZlNjcmVlblJvd3MgKiB0aGlzLmVkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKVxuXG4gICAgc3VwZXIuZXhlY3V0ZSgpXG5cbiAgICB0aGlzLnZpbVN0YXRlLnJlcXVlc3RTY3JvbGwoe1xuICAgICAgYW1vdW50T2ZQaXhlbHM6IHRoaXMuYW1vdW50T2ZQaXhlbHMsXG4gICAgICBkdXJhdGlvbjogdGhpcy5nZXRTbW9vdGhTY3JvbGxEdWF0aW9uKChNYXRoLmFicyhhbW91bnRPZlBhZ2UpID09PSAxID8gJ0Z1bGwnIDogJ0hhbGYnKSArICdTY3JvbGxNb3Rpb24nKVxuICAgIH0pXG4gIH1cblxuICBtb3ZlQ3Vyc29yIChjdXJzb3IpIHtcbiAgICBjb25zdCBjdXJzb3JQaXhlbCA9IHRoaXMuZWRpdG9yRWxlbWVudC5waXhlbFBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24oY3Vyc29yLmdldFNjcmVlblBvc2l0aW9uKCkpXG4gICAgY3Vyc29yUGl4ZWwudG9wICs9IHRoaXMuYW1vdW50T2ZQaXhlbHNcbiAgICBjb25zdCBzY3JlZW5Qb3NpdGlvbiA9IHRoaXMuZWRpdG9yRWxlbWVudC5zY3JlZW5Qb3NpdGlvbkZvclBpeGVsUG9zaXRpb24oY3Vyc29yUGl4ZWwpXG4gICAgY29uc3Qgc2NyZWVuUm93ID0gdGhpcy5nZXRWYWxpZFZpbVNjcmVlblJvdyhzY3JlZW5Qb3NpdGlvbi5yb3cpXG4gICAgdGhpcy5zZXRDdXJzb3JCdWZmZXJSb3coY3Vyc29yLCB0aGlzLmVkaXRvci5idWZmZXJSb3dGb3JTY3JlZW5Sb3coc2NyZWVuUm93KSwge2F1dG9zY3JvbGw6IGZhbHNlfSlcbiAgfVxufVxuXG5jbGFzcyBTY3JvbGxGdWxsU2NyZWVuRG93biBleHRlbmRzIFNjcm9sbCB7fSAvLyBjdHJsLWZcbmNsYXNzIFNjcm9sbEZ1bGxTY3JlZW5VcCBleHRlbmRzIFNjcm9sbCB7fSAvLyBjdHJsLWJcbmNsYXNzIFNjcm9sbEhhbGZTY3JlZW5Eb3duIGV4dGVuZHMgU2Nyb2xsIHt9IC8vIGN0cmwtZFxuY2xhc3MgU2Nyb2xsSGFsZlNjcmVlblVwIGV4dGVuZHMgU2Nyb2xsIHt9IC8vIGN0cmwtdVxuY2xhc3MgU2Nyb2xsUXVhcnRlclNjcmVlbkRvd24gZXh0ZW5kcyBTY3JvbGwge30gLy8gZyBjdHJsLWRcbmNsYXNzIFNjcm9sbFF1YXJ0ZXJTY3JlZW5VcCBleHRlbmRzIFNjcm9sbCB7fSAvLyBnIGN0cmwtdVxuXG4vLyBGaW5kXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBrZXltYXA6IGZcbmNsYXNzIEZpbmQgZXh0ZW5kcyBNb3Rpb24ge1xuICBiYWNrd2FyZHMgPSBmYWxzZVxuICBpbmNsdXNpdmUgPSB0cnVlXG4gIG9mZnNldCA9IDBcbiAgcmVxdWlyZUlucHV0ID0gdHJ1ZVxuICBjYXNlU2Vuc2l0aXZpdHlLaW5kID0gJ0ZpbmQnXG5cbiAgcmVzdG9yZUVkaXRvclN0YXRlICgpIHtcbiAgICBpZiAodGhpcy5fcmVzdG9yZUVkaXRvclN0YXRlKSB0aGlzLl9yZXN0b3JlRWRpdG9yU3RhdGUoKVxuICAgIHRoaXMuX3Jlc3RvcmVFZGl0b3JTdGF0ZSA9IG51bGxcbiAgfVxuXG4gIGNhbmNlbE9wZXJhdGlvbiAoKSB7XG4gICAgdGhpcy5yZXN0b3JlRWRpdG9yU3RhdGUoKVxuICAgIHN1cGVyLmNhbmNlbE9wZXJhdGlvbigpXG4gIH1cblxuICBpbml0aWFsaXplICgpIHtcbiAgICBpZiAodGhpcy5nZXRDb25maWcoJ3JldXNlRmluZEZvclJlcGVhdEZpbmQnKSkgdGhpcy5yZXBlYXRJZk5lY2Vzc2FyeSgpXG5cbiAgICBpZiAoIXRoaXMucmVwZWF0ZWQpIHtcbiAgICAgIGNvbnN0IGNoYXJzTWF4ID0gdGhpcy5nZXRDb25maWcoJ2ZpbmRDaGFyc01heCcpXG4gICAgICBjb25zdCBvcHRpb25zQmFzZSA9IHtwdXJwb3NlOiAnZmluZCcsIGNoYXJzTWF4fVxuXG4gICAgICBpZiAoY2hhcnNNYXggPT09IDEpIHtcbiAgICAgICAgdGhpcy5mb2N1c0lucHV0KG9wdGlvbnNCYXNlKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fcmVzdG9yZUVkaXRvclN0YXRlID0gdGhpcy51dGlscy5zYXZlRWRpdG9yU3RhdGUodGhpcy5lZGl0b3IpXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgYXV0b0NvbmZpcm1UaW1lb3V0OiB0aGlzLmdldENvbmZpZygnZmluZENvbmZpcm1CeVRpbWVvdXQnKSxcbiAgICAgICAgICBvbkNvbmZpcm06IGlucHV0ID0+IHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXQgPSBpbnB1dFxuICAgICAgICAgICAgaWYgKGlucHV0KSB0aGlzLnByb2Nlc3NPcGVyYXRpb24oKVxuICAgICAgICAgICAgZWxzZSB0aGlzLmNhbmNlbE9wZXJhdGlvbigpXG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkNoYW5nZTogcHJlQ29uZmlybWVkQ2hhcnMgPT4ge1xuICAgICAgICAgICAgdGhpcy5wcmVDb25maXJtZWRDaGFycyA9IHByZUNvbmZpcm1lZENoYXJzXG4gICAgICAgICAgICB0aGlzLmhpZ2hsaWdodFRleHRJbkN1cnNvclJvd3ModGhpcy5wcmVDb25maXJtZWRDaGFycywgJ3ByZS1jb25maXJtJywgdGhpcy5pc0JhY2t3YXJkcygpKVxuICAgICAgICAgIH0sXG4gICAgICAgICAgb25DYW5jZWw6ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMudmltU3RhdGUuaGlnaGxpZ2h0RmluZC5jbGVhck1hcmtlcnMoKVxuICAgICAgICAgICAgdGhpcy5jYW5jZWxPcGVyYXRpb24oKVxuICAgICAgICAgIH0sXG4gICAgICAgICAgY29tbWFuZHM6IHtcbiAgICAgICAgICAgICd2aW0tbW9kZS1wbHVzOmZpbmQtbmV4dC1wcmUtY29uZmlybWVkJzogKCkgPT4gdGhpcy5maW5kUHJlQ29uZmlybWVkKCsxKSxcbiAgICAgICAgICAgICd2aW0tbW9kZS1wbHVzOmZpbmQtcHJldmlvdXMtcHJlLWNvbmZpcm1lZCc6ICgpID0+IHRoaXMuZmluZFByZUNvbmZpcm1lZCgtMSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5mb2N1c0lucHV0KE9iamVjdC5hc3NpZ24ob3B0aW9ucywgb3B0aW9uc0Jhc2UpKVxuICAgICAgfVxuICAgIH1cbiAgICBzdXBlci5pbml0aWFsaXplKClcbiAgfVxuXG4gIGZpbmRQcmVDb25maXJtZWQgKGRlbHRhKSB7XG4gICAgaWYgKHRoaXMucHJlQ29uZmlybWVkQ2hhcnMgJiYgdGhpcy5nZXRDb25maWcoJ2hpZ2hsaWdodEZpbmRDaGFyJykpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5oaWdobGlnaHRUZXh0SW5DdXJzb3JSb3dzKFxuICAgICAgICB0aGlzLnByZUNvbmZpcm1lZENoYXJzLFxuICAgICAgICAncHJlLWNvbmZpcm0nLFxuICAgICAgICB0aGlzLmlzQmFja3dhcmRzKCksXG4gICAgICAgIHRoaXMuZ2V0Q291bnQoKSAtIDEgKyBkZWx0YSxcbiAgICAgICAgdHJ1ZVxuICAgICAgKVxuICAgICAgdGhpcy5jb3VudCA9IGluZGV4ICsgMVxuICAgIH1cbiAgfVxuXG4gIHJlcGVhdElmTmVjZXNzYXJ5ICgpIHtcbiAgICBjb25zdCBmaW5kQ29tbWFuZE5hbWVzID0gWydGaW5kJywgJ0ZpbmRCYWNrd2FyZHMnLCAnVGlsbCcsICdUaWxsQmFja3dhcmRzJ11cbiAgICBjb25zdCBjdXJyZW50RmluZCA9IHRoaXMuZ2xvYmFsU3RhdGUuZ2V0KCdjdXJyZW50RmluZCcpXG4gICAgaWYgKGN1cnJlbnRGaW5kICYmIGZpbmRDb21tYW5kTmFtZXMuaW5jbHVkZXModGhpcy52aW1TdGF0ZS5vcGVyYXRpb25TdGFjay5nZXRMYXN0Q29tbWFuZE5hbWUoKSkpIHtcbiAgICAgIHRoaXMuaW5wdXQgPSBjdXJyZW50RmluZC5pbnB1dFxuICAgICAgdGhpcy5yZXBlYXRlZCA9IHRydWVcbiAgICB9XG4gIH1cblxuICBpc0JhY2t3YXJkcyAoKSB7XG4gICAgcmV0dXJuIHRoaXMuYmFja3dhcmRzXG4gIH1cblxuICBleGVjdXRlICgpIHtcbiAgICBzdXBlci5leGVjdXRlKClcbiAgICBsZXQgZGVjb3JhdGlvblR5cGUgPSAncG9zdC1jb25maXJtJ1xuICAgIGlmICh0aGlzLm9wZXJhdG9yICYmICF0aGlzLm9wZXJhdG9yLmluc3RhbmNlb2YoJ1NlbGVjdEJhc2UnKSkge1xuICAgICAgZGVjb3JhdGlvblR5cGUgKz0gJyBsb25nJ1xuICAgIH1cblxuICAgIC8vIEhBQ0s6IFdoZW4gcmVwZWF0ZWQgYnkgXCIsXCIsIHRoaXMuYmFja3dhcmRzIGlzIHRlbXBvcmFyeSBpbnZlcnRlZCBhbmRcbiAgICAvLyByZXN0b3JlZCBhZnRlciBleGVjdXRpb24gZmluaXNoZWQuXG4gICAgLy8gQnV0IGZpbmFsIGhpZ2hsaWdodFRleHRJbkN1cnNvclJvd3MgaXMgZXhlY3V0ZWQgaW4gYXN5bmMoPWFmdGVyIG9wZXJhdGlvbiBmaW5pc2hlZCkuXG4gICAgLy8gVGh1cyB3ZSBuZWVkIHRvIHByZXNlcnZlIGJlZm9yZSByZXN0b3JlZCBgYmFja3dhcmRzYCB2YWx1ZSBhbmQgcGFzcyBpdC5cbiAgICBjb25zdCBiYWNrd2FyZHMgPSB0aGlzLmlzQmFja3dhcmRzKClcbiAgICB0aGlzLmVkaXRvci5jb21wb25lbnQuZ2V0TmV4dFVwZGF0ZVByb21pc2UoKS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuaGlnaGxpZ2h0VGV4dEluQ3Vyc29yUm93cyh0aGlzLmlucHV0LCBkZWNvcmF0aW9uVHlwZSwgYmFja3dhcmRzKVxuICAgIH0pXG4gIH1cblxuICBnZXRQb2ludCAoZnJvbVBvaW50KSB7XG4gICAgY29uc3Qgc2NhblJhbmdlID0gdGhpcy5lZGl0b3IuYnVmZmVyUmFuZ2VGb3JCdWZmZXJSb3coZnJvbVBvaW50LnJvdylcbiAgICBjb25zdCBwb2ludHMgPSBbXVxuICAgIGNvbnN0IHJlZ2V4ID0gdGhpcy5nZXRSZWdleCh0aGlzLmlucHV0KVxuICAgIGNvbnN0IGluZGV4V2FudEFjY2VzcyA9IHRoaXMuZ2V0Q291bnQoKSAtIDFcblxuICAgIGNvbnN0IHRyYW5zbGF0aW9uID0gbmV3IFBvaW50KDAsIHRoaXMuaXNCYWNrd2FyZHMoKSA/IHRoaXMub2Zmc2V0IDogLXRoaXMub2Zmc2V0KVxuICAgIGlmICh0aGlzLnJlcGVhdGVkKSB7XG4gICAgICBmcm9tUG9pbnQgPSBmcm9tUG9pbnQudHJhbnNsYXRlKHRyYW5zbGF0aW9uLm5lZ2F0ZSgpKVxuICAgIH1cblxuICAgIGlmICh0aGlzLmlzQmFja3dhcmRzKCkpIHtcbiAgICAgIGlmICh0aGlzLmdldENvbmZpZygnZmluZEFjcm9zc0xpbmVzJykpIHNjYW5SYW5nZS5zdGFydCA9IFBvaW50LlpFUk9cblxuICAgICAgdGhpcy5lZGl0b3IuYmFja3dhcmRzU2NhbkluQnVmZmVyUmFuZ2UocmVnZXgsIHNjYW5SYW5nZSwgKHtyYW5nZSwgc3RvcH0pID0+IHtcbiAgICAgICAgaWYgKHJhbmdlLnN0YXJ0LmlzTGVzc1RoYW4oZnJvbVBvaW50KSkge1xuICAgICAgICAgIHBvaW50cy5wdXNoKHJhbmdlLnN0YXJ0KVxuICAgICAgICAgIGlmIChwb2ludHMubGVuZ3RoID4gaW5kZXhXYW50QWNjZXNzKSBzdG9wKClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMuZ2V0Q29uZmlnKCdmaW5kQWNyb3NzTGluZXMnKSkgc2NhblJhbmdlLmVuZCA9IHRoaXMuZWRpdG9yLmdldEVvZkJ1ZmZlclBvc2l0aW9uKClcblxuICAgICAgdGhpcy5lZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2UocmVnZXgsIHNjYW5SYW5nZSwgKHtyYW5nZSwgc3RvcH0pID0+IHtcbiAgICAgICAgaWYgKHJhbmdlLnN0YXJ0LmlzR3JlYXRlclRoYW4oZnJvbVBvaW50KSkge1xuICAgICAgICAgIHBvaW50cy5wdXNoKHJhbmdlLnN0YXJ0KVxuICAgICAgICAgIGlmIChwb2ludHMubGVuZ3RoID4gaW5kZXhXYW50QWNjZXNzKSBzdG9wKClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBjb25zdCBwb2ludCA9IHBvaW50c1tpbmRleFdhbnRBY2Nlc3NdXG4gICAgaWYgKHBvaW50KSByZXR1cm4gcG9pbnQudHJhbnNsYXRlKHRyYW5zbGF0aW9uKVxuICB9XG5cbiAgLy8gRklYTUU6IGJhZCBuYW1pbmcsIHRoaXMgZnVuY3Rpb24gbXVzdCByZXR1cm4gaW5kZXhcbiAgaGlnaGxpZ2h0VGV4dEluQ3Vyc29yUm93cyAodGV4dCwgZGVjb3JhdGlvblR5cGUsIGJhY2t3YXJkcywgaW5kZXggPSB0aGlzLmdldENvdW50KCkgLSAxLCBhZGp1c3RJbmRleCA9IGZhbHNlKSB7XG4gICAgaWYgKCF0aGlzLmdldENvbmZpZygnaGlnaGxpZ2h0RmluZENoYXInKSkgcmV0dXJuXG5cbiAgICByZXR1cm4gdGhpcy52aW1TdGF0ZS5oaWdobGlnaHRGaW5kLmhpZ2hsaWdodEN1cnNvclJvd3MoXG4gICAgICB0aGlzLmdldFJlZ2V4KHRleHQpLFxuICAgICAgZGVjb3JhdGlvblR5cGUsXG4gICAgICBiYWNrd2FyZHMsXG4gICAgICB0aGlzLm9mZnNldCxcbiAgICAgIGluZGV4LFxuICAgICAgYWRqdXN0SW5kZXhcbiAgICApXG4gIH1cblxuICBtb3ZlQ3Vyc29yIChjdXJzb3IpIHtcbiAgICBjb25zdCBwb2ludCA9IHRoaXMuZ2V0UG9pbnQoY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgaWYgKHBvaW50KSBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG4gICAgZWxzZSB0aGlzLnJlc3RvcmVFZGl0b3JTdGF0ZSgpXG5cbiAgICBpZiAoIXRoaXMucmVwZWF0ZWQpIHRoaXMuZ2xvYmFsU3RhdGUuc2V0KCdjdXJyZW50RmluZCcsIHRoaXMpXG4gIH1cblxuICBnZXRSZWdleCAodGVybSkge1xuICAgIGNvbnN0IG1vZGlmaWVycyA9IHRoaXMuaXNDYXNlU2Vuc2l0aXZlKHRlcm0pID8gJ2cnIDogJ2dpJ1xuICAgIHJldHVybiBuZXcgUmVnRXhwKHRoaXMuXy5lc2NhcGVSZWdFeHAodGVybSksIG1vZGlmaWVycylcbiAgfVxufVxuXG4vLyBrZXltYXA6IEZcbmNsYXNzIEZpbmRCYWNrd2FyZHMgZXh0ZW5kcyBGaW5kIHtcbiAgaW5jbHVzaXZlID0gZmFsc2VcbiAgYmFja3dhcmRzID0gdHJ1ZVxufVxuXG4vLyBrZXltYXA6IHRcbmNsYXNzIFRpbGwgZXh0ZW5kcyBGaW5kIHtcbiAgb2Zmc2V0ID0gMVxuICBnZXRQb2ludCAoLi4uYXJncykge1xuICAgIGNvbnN0IHBvaW50ID0gc3VwZXIuZ2V0UG9pbnQoLi4uYXJncylcbiAgICB0aGlzLm1vdmVTdWNjZWVkZWQgPSBwb2ludCAhPSBudWxsXG4gICAgcmV0dXJuIHBvaW50XG4gIH1cbn1cblxuLy8ga2V5bWFwOiBUXG5jbGFzcyBUaWxsQmFja3dhcmRzIGV4dGVuZHMgVGlsbCB7XG4gIGluY2x1c2l2ZSA9IGZhbHNlXG4gIGJhY2t3YXJkcyA9IHRydWVcbn1cblxuLy8gTWFya1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8ga2V5bWFwOiBgXG5jbGFzcyBNb3ZlVG9NYXJrIGV4dGVuZHMgTW90aW9uIHtcbiAganVtcCA9IHRydWVcbiAgcmVxdWlyZUlucHV0ID0gdHJ1ZVxuICBpbnB1dCA9IG51bGxcbiAgbW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUgPSBmYWxzZVxuXG4gIGluaXRpYWxpemUgKCkge1xuICAgIHRoaXMucmVhZENoYXIoKVxuICAgIHN1cGVyLmluaXRpYWxpemUoKVxuICB9XG5cbiAgbW92ZUN1cnNvciAoY3Vyc29yKSB7XG4gICAgbGV0IHBvaW50ID0gdGhpcy52aW1TdGF0ZS5tYXJrLmdldCh0aGlzLmlucHV0KVxuICAgIGlmIChwb2ludCkge1xuICAgICAgaWYgKHRoaXMubW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUpIHtcbiAgICAgICAgcG9pbnQgPSB0aGlzLmdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JCdWZmZXJSb3cocG9pbnQucm93KVxuICAgICAgfVxuICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuICAgICAgY3Vyc29yLmF1dG9zY3JvbGwoe2NlbnRlcjogdHJ1ZX0pXG4gICAgfVxuICB9XG59XG5cbi8vIGtleW1hcDogJ1xuY2xhc3MgTW92ZVRvTWFya0xpbmUgZXh0ZW5kcyBNb3ZlVG9NYXJrIHtcbiAgd2lzZSA9ICdsaW5ld2lzZSdcbiAgbW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUgPSB0cnVlXG59XG5cbi8vIEZvbGQgbW90aW9uXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBNb3Rpb25CeUZvbGQgZXh0ZW5kcyBNb3Rpb24ge1xuICBzdGF0aWMgY29tbWFuZCA9IGZhbHNlXG4gIHdpc2UgPSAnY2hhcmFjdGVyd2lzZSdcbiAgd2hpY2ggPSBudWxsXG4gIGRpcmVjdGlvbiA9IG51bGxcblxuICBleGVjdXRlICgpIHtcbiAgICB0aGlzLmZvbGRSYW5nZXMgPSB0aGlzLnV0aWxzLmdldENvZGVGb2xkUmFuZ2VzKHRoaXMuZWRpdG9yKVxuICAgIHN1cGVyLmV4ZWN1dGUoKVxuICB9XG5cbiAgZ2V0Um93cyAoKSB7XG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZm9sZFJhbmdlcy5tYXAoZm9sZFJhbmdlID0+IGZvbGRSYW5nZVt0aGlzLndoaWNoXS5yb3cpLnNvcnQoKGEsIGIpID0+IGEgLSBiKVxuICAgIGlmICh0aGlzLmRpcmVjdGlvbiA9PT0gJ3ByZXZpb3VzJykge1xuICAgICAgcmV0dXJuIHJvd3MucmV2ZXJzZSgpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiByb3dzXG4gICAgfVxuICB9XG5cbiAgZmluZFJvd0J5IChjdXJzb3IsIGZuKSB7XG4gICAgY29uc3QgY3Vyc29yUm93ID0gY3Vyc29yLmdldEJ1ZmZlclJvdygpXG4gICAgcmV0dXJuIHRoaXMuZ2V0Um93cygpLmZpbmQocm93ID0+IHtcbiAgICAgIGlmICh0aGlzLmRpcmVjdGlvbiA9PT0gJ3ByZXZpb3VzJykge1xuICAgICAgICByZXR1cm4gcm93IDwgY3Vyc29yUm93ICYmIGZuKHJvdylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiByb3cgPiBjdXJzb3JSb3cgJiYgZm4ocm93KVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBmaW5kUm93IChjdXJzb3IpIHtcbiAgICByZXR1cm4gdGhpcy5maW5kUm93QnkoY3Vyc29yLCAoKSA9PiB0cnVlKVxuICB9XG5cbiAgbW92ZUN1cnNvciAoY3Vyc29yKSB7XG4gICAgdGhpcy5tb3ZlQ3Vyc29yQ291bnRUaW1lcyhjdXJzb3IsICgpID0+IHtcbiAgICAgIGNvbnN0IHJvdyA9IHRoaXMuZmluZFJvdyhjdXJzb3IpXG4gICAgICBpZiAocm93ICE9IG51bGwpIHRoaXMudXRpbHMubW92ZUN1cnNvclRvRmlyc3RDaGFyYWN0ZXJBdFJvdyhjdXJzb3IsIHJvdylcbiAgICB9KVxuICB9XG59XG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzRm9sZFN0YXJ0IGV4dGVuZHMgTW90aW9uQnlGb2xkIHtcbiAgd2hpY2ggPSAnc3RhcnQnXG4gIGRpcmVjdGlvbiA9ICdwcmV2aW91cydcbn1cblxuY2xhc3MgTW92ZVRvTmV4dEZvbGRTdGFydCBleHRlbmRzIE1vdGlvbkJ5Rm9sZCB7XG4gIHdoaWNoID0gJ3N0YXJ0J1xuICBkaXJlY3Rpb24gPSAnbmV4dCdcbn1cblxuY2xhc3MgTW92ZVRvUHJldmlvdXNGb2xkRW5kIGV4dGVuZHMgTW90aW9uQnlGb2xkIHtcbiAgd2hpY2ggPSAnZW5kJ1xuICBkaXJlY3Rpb24gPSAncHJldmlvdXMnXG59XG5cbmNsYXNzIE1vdmVUb05leHRGb2xkRW5kIGV4dGVuZHMgTW90aW9uQnlGb2xkIHtcbiAgd2hpY2ggPSAnZW5kJ1xuICBkaXJlY3Rpb24gPSAnbmV4dCdcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgTW92ZVRvUHJldmlvdXNGdW5jdGlvbiBleHRlbmRzIE1vdGlvbkJ5Rm9sZCB7XG4gIHdoaWNoID0gJ3N0YXJ0J1xuICBkaXJlY3Rpb24gPSAncHJldmlvdXMnXG4gIGZpbmRSb3cgKGN1cnNvcikge1xuICAgIHJldHVybiB0aGlzLmZpbmRSb3dCeShjdXJzb3IsIHJvdyA9PiB0aGlzLnV0aWxzLmlzSW5jbHVkZUZ1bmN0aW9uU2NvcGVGb3JSb3codGhpcy5lZGl0b3IsIHJvdykpXG4gIH1cbn1cblxuY2xhc3MgTW92ZVRvTmV4dEZ1bmN0aW9uIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNGdW5jdGlvbiB7XG4gIGRpcmVjdGlvbiA9ICduZXh0J1xufVxuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c0Z1bmN0aW9uQW5kUmVkcmF3Q3Vyc29yTGluZUF0VXBwZXJNaWRkbGUgZXh0ZW5kcyBNb3ZlVG9QcmV2aW91c0Z1bmN0aW9uIHtcbiAgZXhlY3V0ZSAoKSB7XG4gICAgc3VwZXIuZXhlY3V0ZSgpXG4gICAgdGhpcy5nZXRJbnN0YW5jZSgnUmVkcmF3Q3Vyc29yTGluZUF0VXBwZXJNaWRkbGUnKS5leGVjdXRlKClcbiAgfVxufVxuXG5jbGFzcyBNb3ZlVG9OZXh0RnVuY3Rpb25BbmRSZWRyYXdDdXJzb3JMaW5lQXRVcHBlck1pZGRsZSBleHRlbmRzIE1vdmVUb1ByZXZpb3VzRnVuY3Rpb25BbmRSZWRyYXdDdXJzb3JMaW5lQXRVcHBlck1pZGRsZSB7XG4gIGRpcmVjdGlvbiA9ICduZXh0J1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBNb3Rpb25CeUZvbGRXaXRoU2FtZUluZGVudCBleHRlbmRzIE1vdGlvbkJ5Rm9sZCB7XG4gIHN0YXRpYyBjb21tYW5kID0gZmFsc2VcblxuICBmaW5kUm93IChjdXJzb3IpIHtcbiAgICBjb25zdCBjbG9zZXN0Rm9sZFJhbmdlID0gdGhpcy51dGlscy5nZXRDbG9zZXN0Rm9sZFJhbmdlQ29udGFpbnNSb3codGhpcy5lZGl0b3IsIGN1cnNvci5nZXRCdWZmZXJSb3coKSlcbiAgICBjb25zdCBpbmRlbnRhdGlvbkZvckJ1ZmZlclJvdyA9IHJvdyA9PiB0aGlzLmVkaXRvci5pbmRlbnRhdGlvbkZvckJ1ZmZlclJvdyhyb3cpXG4gICAgY29uc3QgYmFzZUluZGVudExldmVsID0gY2xvc2VzdEZvbGRSYW5nZSA/IGluZGVudGF0aW9uRm9yQnVmZmVyUm93KGNsb3Nlc3RGb2xkUmFuZ2Uuc3RhcnQucm93KSA6IDBcbiAgICBjb25zdCBpc0VxdWFsSW5kZW50TGV2ZWwgPSByYW5nZSA9PiBpbmRlbnRhdGlvbkZvckJ1ZmZlclJvdyhyYW5nZS5zdGFydC5yb3cpID09PSBiYXNlSW5kZW50TGV2ZWxcblxuICAgIGNvbnN0IGN1cnNvclJvdyA9IGN1cnNvci5nZXRCdWZmZXJSb3coKVxuICAgIGNvbnN0IGZvbGRSYW5nZXMgPSB0aGlzLmRpcmVjdGlvbiA9PT0gJ3ByZXZpb3VzJyA/IHRoaXMuZm9sZFJhbmdlcy5zbGljZSgpLnJldmVyc2UoKSA6IHRoaXMuZm9sZFJhbmdlc1xuICAgIGNvbnN0IGZvbGRSYW5nZSA9IGZvbGRSYW5nZXMuZmluZChmb2xkUmFuZ2UgPT4ge1xuICAgICAgY29uc3Qgcm93ID0gZm9sZFJhbmdlW3RoaXMud2hpY2hdLnJvd1xuICAgICAgaWYgKHRoaXMuZGlyZWN0aW9uID09PSAncHJldmlvdXMnKSB7XG4gICAgICAgIHJldHVybiByb3cgPCBjdXJzb3JSb3cgJiYgaXNFcXVhbEluZGVudExldmVsKGZvbGRSYW5nZSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiByb3cgPiBjdXJzb3JSb3cgJiYgaXNFcXVhbEluZGVudExldmVsKGZvbGRSYW5nZSlcbiAgICAgIH1cbiAgICB9KVxuICAgIGlmIChmb2xkUmFuZ2UpIHtcbiAgICAgIHJldHVybiBmb2xkUmFuZ2VbdGhpcy53aGljaF0ucm93XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzRm9sZFN0YXJ0V2l0aFNhbWVJbmRlbnQgZXh0ZW5kcyBNb3Rpb25CeUZvbGRXaXRoU2FtZUluZGVudCB7XG4gIHdoaWNoID0gJ3N0YXJ0J1xuICBkaXJlY3Rpb24gPSAncHJldmlvdXMnXG59XG5cbmNsYXNzIE1vdmVUb05leHRGb2xkU3RhcnRXaXRoU2FtZUluZGVudCBleHRlbmRzIE1vdGlvbkJ5Rm9sZFdpdGhTYW1lSW5kZW50IHtcbiAgd2hpY2ggPSAnc3RhcnQnXG4gIGRpcmVjdGlvbiA9ICduZXh0J1xufVxuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c0ZvbGRFbmRXaXRoU2FtZUluZGVudCBleHRlbmRzIE1vdGlvbkJ5Rm9sZFdpdGhTYW1lSW5kZW50IHtcbiAgd2hpY2ggPSAnZW5kJ1xuICBkaXJlY3Rpb24gPSAncHJldmlvdXMnXG59XG5cbmNsYXNzIE1vdmVUb05leHRGb2xkRW5kV2l0aFNhbWVJbmRlbnQgZXh0ZW5kcyBNb3Rpb25CeUZvbGRXaXRoU2FtZUluZGVudCB7XG4gIHdoaWNoID0gJ2VuZCdcbiAgZGlyZWN0aW9uID0gJ25leHQnXG59XG5cbi8vIFNjb3BlIGJhc2VkXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBNb3Rpb25CeVNjb3BlIGV4dGVuZHMgTW90aW9uIHtcbiAgc3RhdGljIGNvbW1hbmQgPSBmYWxzZVxuICBkaXJlY3Rpb24gPSAnYmFja3dhcmQnXG4gIHNjb3BlID0gJy4nXG5cbiAgbW92ZUN1cnNvciAoY3Vyc29yKSB7XG4gICAgdGhpcy5tb3ZlQ3Vyc29yQ291bnRUaW1lcyhjdXJzb3IsICgpID0+IHtcbiAgICAgIGNvbnN0IGN1cnNvclBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIGNvbnN0IHBvaW50ID0gdGhpcy51dGlscy5kZXRlY3RTY29wZVN0YXJ0UG9zaXRpb25Gb3JTY29wZSh0aGlzLmVkaXRvciwgY3Vyc29yUG9zaXRpb24sIHRoaXMuZGlyZWN0aW9uLCB0aGlzLnNjb3BlKVxuICAgICAgaWYgKHBvaW50KSBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG4gICAgfSlcbiAgfVxufVxuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c1N0cmluZyBleHRlbmRzIE1vdGlvbkJ5U2NvcGUge1xuICBkaXJlY3Rpb24gPSAnYmFja3dhcmQnXG4gIHNjb3BlID0gJ3N0cmluZy5iZWdpbidcbn1cblxuY2xhc3MgTW92ZVRvTmV4dFN0cmluZyBleHRlbmRzIE1vdmVUb1ByZXZpb3VzU3RyaW5nIHtcbiAgZGlyZWN0aW9uID0gJ2ZvcndhcmQnXG59XG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzTnVtYmVyIGV4dGVuZHMgTW90aW9uQnlTY29wZSB7XG4gIGRpcmVjdGlvbiA9ICdiYWNrd2FyZCdcbiAgc2NvcGUgPSAnY29uc3RhbnQubnVtZXJpYydcbn1cblxuY2xhc3MgTW92ZVRvTmV4dE51bWJlciBleHRlbmRzIE1vdmVUb1ByZXZpb3VzTnVtYmVyIHtcbiAgZGlyZWN0aW9uID0gJ2ZvcndhcmQnXG59XG5cbmNsYXNzIE1vdmVUb05leHRPY2N1cnJlbmNlIGV4dGVuZHMgTW90aW9uIHtcbiAgLy8gRW5zdXJlIHRoaXMgY29tbWFuZCBpcyBhdmFpbGFibGUgd2hlbiBvbmx5IGhhcy1vY2N1cnJlbmNlXG4gIHN0YXRpYyBjb21tYW5kU2NvcGUgPSAnYXRvbS10ZXh0LWVkaXRvci52aW0tbW9kZS1wbHVzLmhhcy1vY2N1cnJlbmNlJ1xuICBqdW1wID0gdHJ1ZVxuICBkaXJlY3Rpb24gPSAnbmV4dCdcblxuICBleGVjdXRlICgpIHtcbiAgICB0aGlzLnJhbmdlcyA9IHRoaXMudXRpbHMuc29ydFJhbmdlcyh0aGlzLm9jY3VycmVuY2VNYW5hZ2VyLmdldE1hcmtlcnMoKS5tYXAobWFya2VyID0+IG1hcmtlci5nZXRCdWZmZXJSYW5nZSgpKSlcbiAgICBzdXBlci5leGVjdXRlKClcbiAgfVxuXG4gIG1vdmVDdXJzb3IgKGN1cnNvcikge1xuICAgIGNvbnN0IHJhbmdlID0gdGhpcy5yYW5nZXNbdGhpcy51dGlscy5nZXRJbmRleCh0aGlzLmdldEluZGV4KGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKSwgdGhpcy5yYW5nZXMpXVxuICAgIGNvbnN0IHBvaW50ID0gcmFuZ2Uuc3RhcnRcbiAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQsIHthdXRvc2Nyb2xsOiBmYWxzZX0pXG5cbiAgICB0aGlzLmVkaXRvci51bmZvbGRCdWZmZXJSb3cocG9pbnQucm93KVxuICAgIGlmIChjdXJzb3IuaXNMYXN0Q3Vyc29yKCkpIHtcbiAgICAgIHRoaXMudXRpbHMuc21hcnRTY3JvbGxUb0J1ZmZlclBvc2l0aW9uKHRoaXMuZWRpdG9yLCBwb2ludClcbiAgICB9XG5cbiAgICBpZiAodGhpcy5nZXRDb25maWcoJ2ZsYXNoT25Nb3ZlVG9PY2N1cnJlbmNlJykpIHtcbiAgICAgIHRoaXMudmltU3RhdGUuZmxhc2gocmFuZ2UsIHt0eXBlOiAnc2VhcmNoJ30pXG4gICAgfVxuICB9XG5cbiAgZ2V0SW5kZXggKGZyb21Qb2ludCkge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5yYW5nZXMuZmluZEluZGV4KHJhbmdlID0+IHJhbmdlLnN0YXJ0LmlzR3JlYXRlclRoYW4oZnJvbVBvaW50KSlcbiAgICByZXR1cm4gKGluZGV4ID49IDAgPyBpbmRleCA6IDApICsgdGhpcy5nZXRDb3VudCgpIC0gMVxuICB9XG59XG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzT2NjdXJyZW5jZSBleHRlbmRzIE1vdmVUb05leHRPY2N1cnJlbmNlIHtcbiAgZGlyZWN0aW9uID0gJ3ByZXZpb3VzJ1xuXG4gIGdldEluZGV4IChmcm9tUG9pbnQpIHtcbiAgICBjb25zdCByYW5nZXMgPSB0aGlzLnJhbmdlcy5zbGljZSgpLnJldmVyc2UoKVxuICAgIGNvbnN0IHJhbmdlID0gcmFuZ2VzLmZpbmQocmFuZ2UgPT4gcmFuZ2UuZW5kLmlzTGVzc1RoYW4oZnJvbVBvaW50KSlcbiAgICBjb25zdCBpbmRleCA9IHJhbmdlID8gdGhpcy5yYW5nZXMuaW5kZXhPZihyYW5nZSkgOiB0aGlzLnJhbmdlcy5sZW5ndGggLSAxXG4gICAgcmV0dXJuIGluZGV4IC0gKHRoaXMuZ2V0Q291bnQoKSAtIDEpXG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8ga2V5bWFwOiAlXG5jbGFzcyBNb3ZlVG9QYWlyIGV4dGVuZHMgTW90aW9uIHtcbiAgaW5jbHVzaXZlID0gdHJ1ZVxuICBqdW1wID0gdHJ1ZVxuICBtZW1iZXIgPSBbJ1BhcmVudGhlc2lzJywgJ0N1cmx5QnJhY2tldCcsICdTcXVhcmVCcmFja2V0J11cblxuICBtb3ZlQ3Vyc29yIChjdXJzb3IpIHtcbiAgICBjb25zdCBwb2ludCA9IHRoaXMuZ2V0UG9pbnQoY3Vyc29yKVxuICAgIGlmIChwb2ludCkgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuICB9XG5cbiAgZ2V0UG9pbnRGb3JUYWcgKHBvaW50KSB7XG4gICAgY29uc3QgcGFpckluZm8gPSB0aGlzLmdldEluc3RhbmNlKCdBVGFnJykuZ2V0UGFpckluZm8ocG9pbnQpXG4gICAgaWYgKCFwYWlySW5mbykgcmV0dXJuXG5cbiAgICBsZXQge29wZW5SYW5nZSwgY2xvc2VSYW5nZX0gPSBwYWlySW5mb1xuICAgIG9wZW5SYW5nZSA9IG9wZW5SYW5nZS50cmFuc2xhdGUoWzAsICsxXSwgWzAsIC0xXSlcbiAgICBjbG9zZVJhbmdlID0gY2xvc2VSYW5nZS50cmFuc2xhdGUoWzAsICsxXSwgWzAsIC0xXSlcbiAgICBpZiAob3BlblJhbmdlLmNvbnRhaW5zUG9pbnQocG9pbnQpICYmICFwb2ludC5pc0VxdWFsKG9wZW5SYW5nZS5lbmQpKSB7XG4gICAgICByZXR1cm4gY2xvc2VSYW5nZS5zdGFydFxuICAgIH1cbiAgICBpZiAoY2xvc2VSYW5nZS5jb250YWluc1BvaW50KHBvaW50KSAmJiAhcG9pbnQuaXNFcXVhbChjbG9zZVJhbmdlLmVuZCkpIHtcbiAgICAgIHJldHVybiBvcGVuUmFuZ2Uuc3RhcnRcbiAgICB9XG4gIH1cblxuICBnZXRQb2ludCAoY3Vyc29yKSB7XG4gICAgY29uc3QgY3Vyc29yUG9zaXRpb24gPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIGNvbnN0IGN1cnNvclJvdyA9IGN1cnNvclBvc2l0aW9uLnJvd1xuICAgIGNvbnN0IHBvaW50ID0gdGhpcy5nZXRQb2ludEZvclRhZyhjdXJzb3JQb3NpdGlvbilcbiAgICBpZiAocG9pbnQpIHJldHVybiBwb2ludFxuXG4gICAgLy8gQUFueVBhaXJBbGxvd0ZvcndhcmRpbmcgcmV0dXJuIGZvcndhcmRpbmcgcmFuZ2Ugb3IgZW5jbG9zaW5nIHJhbmdlLlxuICAgIGNvbnN0IHJhbmdlID0gdGhpcy5nZXRJbnN0YW5jZSgnQUFueVBhaXJBbGxvd0ZvcndhcmRpbmcnLCB7bWVtYmVyOiB0aGlzLm1lbWJlcn0pLmdldFJhbmdlKGN1cnNvci5zZWxlY3Rpb24pXG4gICAgaWYgKCFyYW5nZSkgcmV0dXJuXG5cbiAgICBjb25zdCB7c3RhcnQsIGVuZH0gPSByYW5nZVxuICAgIGlmIChzdGFydC5yb3cgPT09IGN1cnNvclJvdyAmJiBzdGFydC5pc0dyZWF0ZXJUaGFuT3JFcXVhbChjdXJzb3JQb3NpdGlvbikpIHtcbiAgICAgIC8vIEZvcndhcmRpbmcgcmFuZ2UgZm91bmRcbiAgICAgIHJldHVybiBlbmQudHJhbnNsYXRlKFswLCAtMV0pXG4gICAgfSBlbHNlIGlmIChlbmQucm93ID09PSBjdXJzb3JQb3NpdGlvbi5yb3cpIHtcbiAgICAgIC8vIEVuY2xvc2luZyByYW5nZSB3YXMgcmV0dXJuZWRcbiAgICAgIC8vIFdlIG1vdmUgdG8gc3RhcnQoIG9wZW4tcGFpciApIG9ubHkgd2hlbiBjbG9zZS1wYWlyIHdhcyBhdCBzYW1lIHJvdyBhcyBjdXJzb3Itcm93LlxuICAgICAgcmV0dXJuIHN0YXJ0XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBNb3Rpb24sXG4gIEN1cnJlbnRTZWxlY3Rpb24sXG4gIE1vdmVMZWZ0LFxuICBNb3ZlUmlnaHQsXG4gIE1vdmVSaWdodEJ1ZmZlckNvbHVtbixcbiAgTW92ZVVwLFxuICBNb3ZlVXBXcmFwLFxuICBNb3ZlRG93bixcbiAgTW92ZURvd25XcmFwLFxuICBNb3ZlVXBTY3JlZW4sXG4gIE1vdmVEb3duU2NyZWVuLFxuICBNb3ZlVXBUb0VkZ2UsXG4gIE1vdmVEb3duVG9FZGdlLFxuICBNb3Rpb25CeVdvcmQsXG4gIE1vdmVUb05leHRXb3JkLFxuICBNb3ZlVG9OZXh0V2hvbGVXb3JkLFxuICBNb3ZlVG9OZXh0QWxwaGFudW1lcmljV29yZCxcbiAgTW92ZVRvTmV4dFNtYXJ0V29yZCxcbiAgTW92ZVRvTmV4dFN1YndvcmQsXG4gIE1vdmVUb1ByZXZpb3VzV29yZCxcbiAgTW92ZVRvUHJldmlvdXNXaG9sZVdvcmQsXG4gIE1vdmVUb1ByZXZpb3VzQWxwaGFudW1lcmljV29yZCxcbiAgTW92ZVRvUHJldmlvdXNTbWFydFdvcmQsXG4gIE1vdmVUb1ByZXZpb3VzU3Vid29yZCxcbiAgTW92ZVRvRW5kT2ZXb3JkLFxuICBNb3ZlVG9FbmRPZldob2xlV29yZCxcbiAgTW92ZVRvRW5kT2ZBbHBoYW51bWVyaWNXb3JkLFxuICBNb3ZlVG9FbmRPZlNtYXJ0V29yZCxcbiAgTW92ZVRvRW5kT2ZTdWJ3b3JkLFxuICBNb3ZlVG9QcmV2aW91c0VuZE9mV29yZCxcbiAgTW92ZVRvUHJldmlvdXNFbmRPZldob2xlV29yZCxcbiAgTW92ZVRvTmV4dFNlbnRlbmNlLFxuICBNb3ZlVG9QcmV2aW91c1NlbnRlbmNlLFxuICBNb3ZlVG9OZXh0U2VudGVuY2VTa2lwQmxhbmtSb3csXG4gIE1vdmVUb1ByZXZpb3VzU2VudGVuY2VTa2lwQmxhbmtSb3csXG4gIE1vdmVUb05leHRQYXJhZ3JhcGgsXG4gIE1vdmVUb1ByZXZpb3VzUGFyYWdyYXBoLFxuICBNb3ZlVG9OZXh0RGlmZkh1bmssXG4gIE1vdmVUb1ByZXZpb3VzRGlmZkh1bmssXG4gIE1vdmVUb0JlZ2lubmluZ09mTGluZSxcbiAgTW92ZVRvQ29sdW1uLFxuICBNb3ZlVG9MYXN0Q2hhcmFjdGVyT2ZMaW5lLFxuICBNb3ZlVG9MYXN0Tm9uYmxhbmtDaGFyYWN0ZXJPZkxpbmVBbmREb3duLFxuICBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSxcbiAgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmVVcCxcbiAgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmVEb3duLFxuICBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZUFuZERvd24sXG4gIE1vdmVUb1NjcmVlbkNvbHVtbixcbiAgTW92ZVRvQmVnaW5uaW5nT2ZTY3JlZW5MaW5lLFxuICBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mU2NyZWVuTGluZSxcbiAgTW92ZVRvTGFzdENoYXJhY3Rlck9mU2NyZWVuTGluZSxcbiAgTW92ZVRvRmlyc3RMaW5lLFxuICBNb3ZlVG9MYXN0TGluZSxcbiAgTW92ZVRvTGluZUJ5UGVyY2VudCxcbiAgTW92ZVRvUmVsYXRpdmVMaW5lLFxuICBNb3ZlVG9SZWxhdGl2ZUxpbmVNaW5pbXVtVHdvLFxuICBNb3ZlVG9Ub3BPZlNjcmVlbixcbiAgTW92ZVRvTWlkZGxlT2ZTY3JlZW4sXG4gIE1vdmVUb0JvdHRvbU9mU2NyZWVuLFxuICBTY3JvbGwsXG4gIFNjcm9sbEZ1bGxTY3JlZW5Eb3duLFxuICBTY3JvbGxGdWxsU2NyZWVuVXAsXG4gIFNjcm9sbEhhbGZTY3JlZW5Eb3duLFxuICBTY3JvbGxIYWxmU2NyZWVuVXAsXG4gIFNjcm9sbFF1YXJ0ZXJTY3JlZW5Eb3duLFxuICBTY3JvbGxRdWFydGVyU2NyZWVuVXAsXG4gIEZpbmQsXG4gIEZpbmRCYWNrd2FyZHMsXG4gIFRpbGwsXG4gIFRpbGxCYWNrd2FyZHMsXG4gIE1vdmVUb01hcmssXG4gIE1vdmVUb01hcmtMaW5lLFxuICBNb3Rpb25CeUZvbGQsXG4gIE1vdmVUb1ByZXZpb3VzRm9sZFN0YXJ0LFxuICBNb3ZlVG9OZXh0Rm9sZFN0YXJ0LFxuICBNb3Rpb25CeUZvbGRXaXRoU2FtZUluZGVudCxcbiAgTW92ZVRvUHJldmlvdXNGb2xkU3RhcnRXaXRoU2FtZUluZGVudCxcbiAgTW92ZVRvTmV4dEZvbGRTdGFydFdpdGhTYW1lSW5kZW50LFxuICBNb3ZlVG9QcmV2aW91c0ZvbGRFbmRXaXRoU2FtZUluZGVudCxcbiAgTW92ZVRvTmV4dEZvbGRFbmRXaXRoU2FtZUluZGVudCxcbiAgTW92ZVRvUHJldmlvdXNGb2xkRW5kLFxuICBNb3ZlVG9OZXh0Rm9sZEVuZCxcbiAgTW92ZVRvUHJldmlvdXNGdW5jdGlvbixcbiAgTW92ZVRvTmV4dEZ1bmN0aW9uLFxuICBNb3ZlVG9QcmV2aW91c0Z1bmN0aW9uQW5kUmVkcmF3Q3Vyc29yTGluZUF0VXBwZXJNaWRkbGUsXG4gIE1vdmVUb05leHRGdW5jdGlvbkFuZFJlZHJhd0N1cnNvckxpbmVBdFVwcGVyTWlkZGxlLFxuICBNb3Rpb25CeVNjb3BlLFxuICBNb3ZlVG9QcmV2aW91c1N0cmluZyxcbiAgTW92ZVRvTmV4dFN0cmluZyxcbiAgTW92ZVRvUHJldmlvdXNOdW1iZXIsXG4gIE1vdmVUb05leHROdW1iZXIsXG4gIE1vdmVUb05leHRPY2N1cnJlbmNlLFxuICBNb3ZlVG9QcmV2aW91c09jY3VycmVuY2UsXG4gIE1vdmVUb1BhaXJcbn1cbiJdfQ==