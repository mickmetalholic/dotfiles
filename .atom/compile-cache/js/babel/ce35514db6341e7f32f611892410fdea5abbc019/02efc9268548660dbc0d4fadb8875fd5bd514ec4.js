'use babel';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('atom');

var Range = _require.Range;

var Base = require('./base');

var MiscCommand = (function (_Base) {
  _inherits(MiscCommand, _Base);

  function MiscCommand() {
    _classCallCheck(this, MiscCommand);

    _get(Object.getPrototypeOf(MiscCommand.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(MiscCommand, null, [{
    key: 'command',
    value: false,
    enumerable: true
  }, {
    key: 'operationKind',
    value: 'misc-command',
    enumerable: true
  }]);

  return MiscCommand;
})(Base);

var Mark = (function (_MiscCommand) {
  _inherits(Mark, _MiscCommand);

  function Mark() {
    _classCallCheck(this, Mark);

    _get(Object.getPrototypeOf(Mark.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(Mark, [{
    key: 'execute',
    value: _asyncToGenerator(function* () {
      var mark = yield this.readCharPromised();
      if (mark) {
        this.vimState.mark.set(mark, this.getCursorBufferPosition());
      }
    })
  }]);

  return Mark;
})(MiscCommand);

var ReverseSelections = (function (_MiscCommand2) {
  _inherits(ReverseSelections, _MiscCommand2);

  function ReverseSelections() {
    _classCallCheck(this, ReverseSelections);

    _get(Object.getPrototypeOf(ReverseSelections.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(ReverseSelections, [{
    key: 'execute',
    value: function execute() {
      this.swrap.setReversedState(this.editor, !this.editor.getLastSelection().isReversed());
      if (this.isMode('visual', 'blockwise')) {
        this.getLastBlockwiseSelection().autoscroll();
      }
    }
  }]);

  return ReverseSelections;
})(MiscCommand);

var BlockwiseOtherEnd = (function (_ReverseSelections) {
  _inherits(BlockwiseOtherEnd, _ReverseSelections);

  function BlockwiseOtherEnd() {
    _classCallCheck(this, BlockwiseOtherEnd);

    _get(Object.getPrototypeOf(BlockwiseOtherEnd.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(BlockwiseOtherEnd, [{
    key: 'execute',
    value: function execute() {
      for (var blockwiseSelection of this.getBlockwiseSelections()) {
        blockwiseSelection.reverse();
      }
      _get(Object.getPrototypeOf(BlockwiseOtherEnd.prototype), 'execute', this).call(this);
    }
  }]);

  return BlockwiseOtherEnd;
})(ReverseSelections);

var Undo = (function (_MiscCommand3) {
  _inherits(Undo, _MiscCommand3);

  function Undo() {
    _classCallCheck(this, Undo);

    _get(Object.getPrototypeOf(Undo.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(Undo, [{
    key: 'execute',
    value: function execute() {
      var newRanges = [];
      var oldRanges = [];

      var disposable = this.editor.getBuffer().onDidChangeText(function (event) {
        for (var _ref2 of event.changes) {
          var newRange = _ref2.newRange;
          var oldRange = _ref2.oldRange;

          if (newRange.isEmpty()) {
            oldRanges.push(oldRange); // Remove only
          } else {
              newRanges.push(newRange);
            }
        }
      });

      if (this.name === 'Undo') {
        this.editor.undo();
      } else {
        this.editor.redo();
      }

      disposable.dispose();

      for (var selection of this.editor.getSelections()) {
        selection.clear();
      }

      if (this.getConfig('setCursorToStartOfChangeOnUndoRedo')) {
        var strategy = this.getConfig('setCursorToStartOfChangeOnUndoRedoStrategy');
        this.setCursorPosition({ newRanges: newRanges, oldRanges: oldRanges, strategy: strategy });
        this.vimState.clearSelections();
      }

      if (this.getConfig('flashOnUndoRedo')) {
        if (newRanges.length) {
          this.flashChanges(newRanges, 'changes');
        } else {
          this.flashChanges(oldRanges, 'deletes');
        }
      }
      this.activateMode('normal');
    }
  }, {
    key: 'setCursorPosition',
    value: function setCursorPosition(_ref3) {
      var newRanges = _ref3.newRanges;
      var oldRanges = _ref3.oldRanges;
      var strategy = _ref3.strategy;

      var lastCursor = this.editor.getLastCursor(); // This is restored cursor

      var changedRange = undefined;

      if (strategy === 'smart') {
        changedRange = this.utils.findRangeContainsPoint(newRanges, lastCursor.getBufferPosition());
      } else if (strategy === 'simple') {
        changedRange = this.utils.sortRanges(newRanges.concat(oldRanges))[0];
      }

      if (changedRange) {
        if (this.utils.isLinewiseRange(changedRange)) this.utils.setBufferRow(lastCursor, changedRange.start.row);else lastCursor.setBufferPosition(changedRange.start);
      }
    }
  }, {
    key: 'flashChanges',
    value: function flashChanges(ranges, mutationType) {
      var _this = this;

      var isMultipleSingleLineRanges = function isMultipleSingleLineRanges(ranges) {
        return ranges.length > 1 && ranges.every(_this.utils.isSingleLineRange);
      };
      var humanizeNewLineForBufferRange = this.utils.humanizeNewLineForBufferRange.bind(null, this.editor);
      var isNotLeadingWhiteSpaceRange = this.utils.isNotLeadingWhiteSpaceRange.bind(null, this.editor);
      if (!this.utils.isMultipleAndAllRangeHaveSameColumnAndConsecutiveRows(ranges)) {
        ranges = ranges.map(humanizeNewLineForBufferRange);
        var type = isMultipleSingleLineRanges(ranges) ? 'undo-redo-multiple-' + mutationType : 'undo-redo';
        if (!(type === 'undo-redo' && mutationType === 'deletes')) {
          this.vimState.flash(ranges.filter(isNotLeadingWhiteSpaceRange), { type: type });
        }
      }
    }
  }]);

  return Undo;
})(MiscCommand);

var Redo = (function (_Undo) {
  _inherits(Redo, _Undo);

  function Redo() {
    _classCallCheck(this, Redo);

    _get(Object.getPrototypeOf(Redo.prototype), 'constructor', this).apply(this, arguments);
  }

  // zc
  return Redo;
})(Undo);

var FoldCurrentRow = (function (_MiscCommand4) {
  _inherits(FoldCurrentRow, _MiscCommand4);

  function FoldCurrentRow() {
    _classCallCheck(this, FoldCurrentRow);

    _get(Object.getPrototypeOf(FoldCurrentRow.prototype), 'constructor', this).apply(this, arguments);
  }

  // zo

  _createClass(FoldCurrentRow, [{
    key: 'execute',
    value: function execute() {
      for (var point of this.getCursorBufferPositions()) {
        this.editor.foldBufferRow(point.row);
      }
    }
  }]);

  return FoldCurrentRow;
})(MiscCommand);

var UnfoldCurrentRow = (function (_MiscCommand5) {
  _inherits(UnfoldCurrentRow, _MiscCommand5);

  function UnfoldCurrentRow() {
    _classCallCheck(this, UnfoldCurrentRow);

    _get(Object.getPrototypeOf(UnfoldCurrentRow.prototype), 'constructor', this).apply(this, arguments);
  }

  // za

  _createClass(UnfoldCurrentRow, [{
    key: 'execute',
    value: function execute() {
      for (var point of this.getCursorBufferPositions()) {
        this.editor.unfoldBufferRow(point.row);
      }
    }
  }]);

  return UnfoldCurrentRow;
})(MiscCommand);

var ToggleFold = (function (_MiscCommand6) {
  _inherits(ToggleFold, _MiscCommand6);

  function ToggleFold() {
    _classCallCheck(this, ToggleFold);

    _get(Object.getPrototypeOf(ToggleFold.prototype), 'constructor', this).apply(this, arguments);
  }

  // Base of zC, zO, zA

  _createClass(ToggleFold, [{
    key: 'execute',
    value: function execute() {
      for (var point of this.getCursorBufferPositions()) {
        this.editor.toggleFoldAtBufferRow(point.row);
      }
    }
  }]);

  return ToggleFold;
})(MiscCommand);

var FoldCurrentRowRecursivelyBase = (function (_MiscCommand7) {
  _inherits(FoldCurrentRowRecursivelyBase, _MiscCommand7);

  function FoldCurrentRowRecursivelyBase() {
    _classCallCheck(this, FoldCurrentRowRecursivelyBase);

    _get(Object.getPrototypeOf(FoldCurrentRowRecursivelyBase.prototype), 'constructor', this).apply(this, arguments);
  }

  // zC

  _createClass(FoldCurrentRowRecursivelyBase, [{
    key: 'eachFoldStartRow',
    value: function eachFoldStartRow(fn) {
      var _this2 = this;

      var _loop = function (_ref4) {
        var row = _ref4.row;

        if (!_this2.editor.isFoldableAtBufferRow(row)) return 'continue';

        var foldRanges = _this2.utils.getCodeFoldRanges(_this2.editor);
        var enclosingFoldRange = foldRanges.find(function (range) {
          return range.start.row === row;
        });
        var enclosedFoldRanges = foldRanges.filter(function (range) {
          return enclosingFoldRange.containsRange(range);
        });

        // Why reverse() is to process encolosed(nested) fold first than encolosing fold.
        enclosedFoldRanges.reverse().forEach(function (range) {
          return fn(range.start.row);
        });
      };

      for (var _ref4 of this.getCursorBufferPositionsOrdered().reverse()) {
        var _ret = _loop(_ref4);

        if (_ret === 'continue') continue;
      }
    }
  }, {
    key: 'foldRecursively',
    value: function foldRecursively() {
      var _this3 = this;

      this.eachFoldStartRow(function (row) {
        if (!_this3.editor.isFoldedAtBufferRow(row)) _this3.editor.foldBufferRow(row);
      });
    }
  }, {
    key: 'unfoldRecursively',
    value: function unfoldRecursively() {
      var _this4 = this;

      this.eachFoldStartRow(function (row) {
        if (_this4.editor.isFoldedAtBufferRow(row)) _this4.editor.unfoldBufferRow(row);
      });
    }
  }], [{
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return FoldCurrentRowRecursivelyBase;
})(MiscCommand);

var FoldCurrentRowRecursively = (function (_FoldCurrentRowRecursivelyBase) {
  _inherits(FoldCurrentRowRecursively, _FoldCurrentRowRecursivelyBase);

  function FoldCurrentRowRecursively() {
    _classCallCheck(this, FoldCurrentRowRecursively);

    _get(Object.getPrototypeOf(FoldCurrentRowRecursively.prototype), 'constructor', this).apply(this, arguments);
  }

  // zO

  _createClass(FoldCurrentRowRecursively, [{
    key: 'execute',
    value: function execute() {
      this.foldRecursively();
    }
  }]);

  return FoldCurrentRowRecursively;
})(FoldCurrentRowRecursivelyBase);

var UnfoldCurrentRowRecursively = (function (_FoldCurrentRowRecursivelyBase2) {
  _inherits(UnfoldCurrentRowRecursively, _FoldCurrentRowRecursivelyBase2);

  function UnfoldCurrentRowRecursively() {
    _classCallCheck(this, UnfoldCurrentRowRecursively);

    _get(Object.getPrototypeOf(UnfoldCurrentRowRecursively.prototype), 'constructor', this).apply(this, arguments);
  }

  // zA

  _createClass(UnfoldCurrentRowRecursively, [{
    key: 'execute',
    value: function execute() {
      this.unfoldRecursively();
    }
  }]);

  return UnfoldCurrentRowRecursively;
})(FoldCurrentRowRecursivelyBase);

var ToggleFoldRecursively = (function (_FoldCurrentRowRecursivelyBase3) {
  _inherits(ToggleFoldRecursively, _FoldCurrentRowRecursivelyBase3);

  function ToggleFoldRecursively() {
    _classCallCheck(this, ToggleFoldRecursively);

    _get(Object.getPrototypeOf(ToggleFoldRecursively.prototype), 'constructor', this).apply(this, arguments);
  }

  // zR

  _createClass(ToggleFoldRecursively, [{
    key: 'execute',
    value: function execute() {
      if (this.editor.isFoldedAtBufferRow(this.getCursorBufferPosition().row)) {
        this.unfoldRecursively();
      } else {
        this.foldRecursively();
      }
    }
  }]);

  return ToggleFoldRecursively;
})(FoldCurrentRowRecursivelyBase);

var UnfoldAll = (function (_MiscCommand8) {
  _inherits(UnfoldAll, _MiscCommand8);

  function UnfoldAll() {
    _classCallCheck(this, UnfoldAll);

    _get(Object.getPrototypeOf(UnfoldAll.prototype), 'constructor', this).apply(this, arguments);
  }

  // zM

  _createClass(UnfoldAll, [{
    key: 'execute',
    value: function execute() {
      this.editor.unfoldAll();
    }
  }]);

  return UnfoldAll;
})(MiscCommand);

var FoldAll = (function (_MiscCommand9) {
  _inherits(FoldAll, _MiscCommand9);

  function FoldAll() {
    _classCallCheck(this, FoldAll);

    _get(Object.getPrototypeOf(FoldAll.prototype), 'constructor', this).apply(this, arguments);
  }

  // zr

  _createClass(FoldAll, [{
    key: 'execute',
    value: function execute() {
      var _utils$getFoldInfoByKind = this.utils.getFoldInfoByKind(this.editor);

      var allFold = _utils$getFoldInfoByKind.allFold;

      if (!allFold) return;

      this.editor.unfoldAll();
      for (var _ref52 of allFold.listOfRangeAndIndent) {
        var indent = _ref52.indent;
        var range = _ref52.range;

        if (indent <= this.getConfig('maxFoldableIndentLevel')) {
          this.editor.foldBufferRange(range);
        }
      }
      this.editor.scrollToCursorPosition({ center: true });
    }
  }]);

  return FoldAll;
})(MiscCommand);

var UnfoldNextIndentLevel = (function (_MiscCommand10) {
  _inherits(UnfoldNextIndentLevel, _MiscCommand10);

  function UnfoldNextIndentLevel() {
    _classCallCheck(this, UnfoldNextIndentLevel);

    _get(Object.getPrototypeOf(UnfoldNextIndentLevel.prototype), 'constructor', this).apply(this, arguments);
  }

  // zm

  _createClass(UnfoldNextIndentLevel, [{
    key: 'execute',
    value: function execute() {
      var _utils$getFoldInfoByKind2 = this.utils.getFoldInfoByKind(this.editor);

      var folded = _utils$getFoldInfoByKind2.folded;

      if (!folded) return;
      var minIndent = folded.minIndent;
      var listOfRangeAndIndent = folded.listOfRangeAndIndent;

      var targetIndents = this.utils.getList(minIndent, minIndent + this.getCount() - 1);
      for (var _ref62 of listOfRangeAndIndent) {
        var indent = _ref62.indent;
        var range = _ref62.range;

        if (targetIndents.includes(indent)) {
          this.editor.unfoldBufferRow(range.start.row);
        }
      }
    }
  }]);

  return UnfoldNextIndentLevel;
})(MiscCommand);

var FoldNextIndentLevel = (function (_MiscCommand11) {
  _inherits(FoldNextIndentLevel, _MiscCommand11);

  function FoldNextIndentLevel() {
    _classCallCheck(this, FoldNextIndentLevel);

    _get(Object.getPrototypeOf(FoldNextIndentLevel.prototype), 'constructor', this).apply(this, arguments);
  }

  // ctrl-e scroll lines downwards

  _createClass(FoldNextIndentLevel, [{
    key: 'execute',
    value: function execute() {
      var _utils$getFoldInfoByKind3 = this.utils.getFoldInfoByKind(this.editor);

      var unfolded = _utils$getFoldInfoByKind3.unfolded;
      var allFold = _utils$getFoldInfoByKind3.allFold;

      if (!unfolded) return;
      // FIXME: Why I need unfoldAll()? Why can't I just fold non-folded-fold only?
      // Unless unfoldAll() here, @editor.unfoldAll() delete foldMarker but fail
      // to render unfolded rows correctly.
      // I believe this is bug of text-buffer's markerLayer which assume folds are
      // created **in-order** from top-row to bottom-row.
      this.editor.unfoldAll();

      var maxFoldable = this.getConfig('maxFoldableIndentLevel');
      var fromLevel = Math.min(unfolded.maxIndent, maxFoldable);
      fromLevel = this.limitNumber(fromLevel - this.getCount() - 1, { min: 0 });
      var targetIndents = this.utils.getList(fromLevel, maxFoldable);
      for (var _ref72 of allFold.listOfRangeAndIndent) {
        var indent = _ref72.indent;
        var range = _ref72.range;

        if (targetIndents.includes(indent)) {
          this.editor.foldBufferRange(range);
        }
      }
    }
  }]);

  return FoldNextIndentLevel;
})(MiscCommand);

var MiniScrollDown = (function (_MiscCommand12) {
  _inherits(MiniScrollDown, _MiscCommand12);

  function MiniScrollDown() {
    _classCallCheck(this, MiniScrollDown);

    _get(Object.getPrototypeOf(MiniScrollDown.prototype), 'constructor', this).apply(this, arguments);

    this.defaultCount = this.getConfig('defaultScrollRowsOnMiniScroll');
    this.direction = 'down';
  }

  // ctrl-y scroll lines upwards

  _createClass(MiniScrollDown, [{
    key: 'keepCursorOnScreen',
    value: function keepCursorOnScreen() {
      var cursor = this.editor.getLastCursor();
      var row = cursor.getScreenRow();
      var offset = 2;
      var validRow = this.direction === 'down' ? this.limitNumber(row, { min: this.editor.getFirstVisibleScreenRow() + offset }) : this.limitNumber(row, { max: this.editor.getLastVisibleScreenRow() - offset });
      if (row !== validRow) {
        this.utils.setBufferRow(cursor, this.editor.bufferRowForScreenRow(validRow), { autoscroll: false });
      }
    }
  }, {
    key: 'execute',
    value: function execute() {
      var _this5 = this;

      this.vimState.requestScroll({
        amountOfPixels: (this.direction === 'down' ? 1 : -1) * this.getCount() * this.editor.getLineHeightInPixels(),
        duration: this.getSmoothScrollDuation('MiniScroll'),
        onFinish: function onFinish() {
          return _this5.keepCursorOnScreen();
        }
      });
    }
  }]);

  return MiniScrollDown;
})(MiscCommand);

var MiniScrollUp = (function (_MiniScrollDown) {
  _inherits(MiniScrollUp, _MiniScrollDown);

  function MiniScrollUp() {
    _classCallCheck(this, MiniScrollUp);

    _get(Object.getPrototypeOf(MiniScrollUp.prototype), 'constructor', this).apply(this, arguments);

    this.direction = 'up';
  }

  // RedrawCursorLineAt{XXX} in viewport.
  // +-------------------------------------------+
  // | where        | no move | move to 1st char |
  // |--------------+---------+------------------|
  // | top          | z t     | z enter          |
  // | upper-middle | z u     | z space          |
  // | middle       | z z     | z .              |
  // | bottom       | z b     | z -              |
  // +-------------------------------------------+
  return MiniScrollUp;
})(MiniScrollDown);

var RedrawCursorLine = (function (_MiscCommand13) {
  _inherits(RedrawCursorLine, _MiscCommand13);

  function RedrawCursorLine() {
    _classCallCheck(this, RedrawCursorLine);

    _get(Object.getPrototypeOf(RedrawCursorLine.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(RedrawCursorLine, [{
    key: 'initialize',
    value: function initialize() {
      var baseName = this.name.replace(/AndMoveToFirstCharacterOfLine$/, '');
      this.coefficient = this.constructor.coefficientByName[baseName];
      this.moveToFirstCharacterOfLine = this.name.endsWith('AndMoveToFirstCharacterOfLine');
      _get(Object.getPrototypeOf(RedrawCursorLine.prototype), 'initialize', this).call(this);
    }
  }, {
    key: 'execute',
    value: function execute() {
      var _this6 = this;

      var scrollTop = Math.round(this.getScrollTop());
      this.vimState.requestScroll({
        scrollTop: scrollTop,
        duration: this.getSmoothScrollDuation('RedrawCursorLine'),
        onFinish: function onFinish() {
          if (_this6.editorElement.getScrollTop() !== scrollTop && !_this6.editor.getScrollPastEnd()) {
            _this6.recommendToEnableScrollPastEnd();
          }
        }
      });
      if (this.moveToFirstCharacterOfLine) this.editor.moveToFirstCharacterOfLine();
    }
  }, {
    key: 'getScrollTop',
    value: function getScrollTop() {
      var _editorElement$pixelPositionForScreenPosition = this.editorElement.pixelPositionForScreenPosition(this.editor.getCursorScreenPosition());

      var top = _editorElement$pixelPositionForScreenPosition.top;

      var editorHeight = this.editorElement.getHeight();
      var lineHeightInPixel = this.editor.getLineHeightInPixels();

      return this.limitNumber(top - editorHeight * this.coefficient, {
        min: top - editorHeight + lineHeightInPixel * 3,
        max: top - lineHeightInPixel * 2
      });
    }
  }, {
    key: 'recommendToEnableScrollPastEnd',
    value: function recommendToEnableScrollPastEnd() {
      var message = ['vim-mode-plus', '- Failed to scroll. To successfully scroll, `editor.scrollPastEnd` need to be enabled.', '- You can do it from `"Settings" > "Editor" > "Scroll Past End"`.', '- Or **do you allow vmp enable it for you now?**'].join('\n');

      var notification = atom.notifications.addInfo(message, {
        dismissable: true,
        buttons: [{
          text: 'No thanks.',
          onDidClick: function onDidClick() {
            return notification.dismiss();
          }
        }, {
          text: 'OK. Enable it now!!',
          onDidClick: function onDidClick() {
            atom.config.set('editor.scrollPastEnd', true);
            notification.dismiss();
          }
        }]
      });
    }
  }], [{
    key: 'command',
    value: false,
    enumerable: true
  }, {
    key: 'coefficientByName',
    value: {
      RedrawCursorLineAtTop: 0,
      RedrawCursorLineAtUpperMiddle: 0.25,
      RedrawCursorLineAtMiddle: 0.5,
      RedrawCursorLineAtBottom: 1
    },
    enumerable: true
  }]);

  return RedrawCursorLine;
})(MiscCommand);

var RedrawCursorLineAtTop = (function (_RedrawCursorLine) {
  _inherits(RedrawCursorLineAtTop, _RedrawCursorLine);

  function RedrawCursorLineAtTop() {
    _classCallCheck(this, RedrawCursorLineAtTop);

    _get(Object.getPrototypeOf(RedrawCursorLineAtTop.prototype), 'constructor', this).apply(this, arguments);
  }

  // zt
  return RedrawCursorLineAtTop;
})(RedrawCursorLine);

var RedrawCursorLineAtTopAndMoveToFirstCharacterOfLine = (function (_RedrawCursorLine2) {
  _inherits(RedrawCursorLineAtTopAndMoveToFirstCharacterOfLine, _RedrawCursorLine2);

  function RedrawCursorLineAtTopAndMoveToFirstCharacterOfLine() {
    _classCallCheck(this, RedrawCursorLineAtTopAndMoveToFirstCharacterOfLine);

    _get(Object.getPrototypeOf(RedrawCursorLineAtTopAndMoveToFirstCharacterOfLine.prototype), 'constructor', this).apply(this, arguments);
  }

  // z enter
  return RedrawCursorLineAtTopAndMoveToFirstCharacterOfLine;
})(RedrawCursorLine);

var RedrawCursorLineAtUpperMiddle = (function (_RedrawCursorLine3) {
  _inherits(RedrawCursorLineAtUpperMiddle, _RedrawCursorLine3);

  function RedrawCursorLineAtUpperMiddle() {
    _classCallCheck(this, RedrawCursorLineAtUpperMiddle);

    _get(Object.getPrototypeOf(RedrawCursorLineAtUpperMiddle.prototype), 'constructor', this).apply(this, arguments);
  }

  // zu
  return RedrawCursorLineAtUpperMiddle;
})(RedrawCursorLine);

var RedrawCursorLineAtUpperMiddleAndMoveToFirstCharacterOfLine = (function (_RedrawCursorLine4) {
  _inherits(RedrawCursorLineAtUpperMiddleAndMoveToFirstCharacterOfLine, _RedrawCursorLine4);

  function RedrawCursorLineAtUpperMiddleAndMoveToFirstCharacterOfLine() {
    _classCallCheck(this, RedrawCursorLineAtUpperMiddleAndMoveToFirstCharacterOfLine);

    _get(Object.getPrototypeOf(RedrawCursorLineAtUpperMiddleAndMoveToFirstCharacterOfLine.prototype), 'constructor', this).apply(this, arguments);
  }

  // z space
  return RedrawCursorLineAtUpperMiddleAndMoveToFirstCharacterOfLine;
})(RedrawCursorLine);

var RedrawCursorLineAtMiddle = (function (_RedrawCursorLine5) {
  _inherits(RedrawCursorLineAtMiddle, _RedrawCursorLine5);

  function RedrawCursorLineAtMiddle() {
    _classCallCheck(this, RedrawCursorLineAtMiddle);

    _get(Object.getPrototypeOf(RedrawCursorLineAtMiddle.prototype), 'constructor', this).apply(this, arguments);
  }

  // z z
  return RedrawCursorLineAtMiddle;
})(RedrawCursorLine);

var RedrawCursorLineAtMiddleAndMoveToFirstCharacterOfLine = (function (_RedrawCursorLine6) {
  _inherits(RedrawCursorLineAtMiddleAndMoveToFirstCharacterOfLine, _RedrawCursorLine6);

  function RedrawCursorLineAtMiddleAndMoveToFirstCharacterOfLine() {
    _classCallCheck(this, RedrawCursorLineAtMiddleAndMoveToFirstCharacterOfLine);

    _get(Object.getPrototypeOf(RedrawCursorLineAtMiddleAndMoveToFirstCharacterOfLine.prototype), 'constructor', this).apply(this, arguments);
  }

  // z .
  return RedrawCursorLineAtMiddleAndMoveToFirstCharacterOfLine;
})(RedrawCursorLine);

var RedrawCursorLineAtBottom = (function (_RedrawCursorLine7) {
  _inherits(RedrawCursorLineAtBottom, _RedrawCursorLine7);

  function RedrawCursorLineAtBottom() {
    _classCallCheck(this, RedrawCursorLineAtBottom);

    _get(Object.getPrototypeOf(RedrawCursorLineAtBottom.prototype), 'constructor', this).apply(this, arguments);
  }

  // z b
  return RedrawCursorLineAtBottom;
})(RedrawCursorLine);

var RedrawCursorLineAtBottomAndMoveToFirstCharacterOfLine = (function (_RedrawCursorLine8) {
  _inherits(RedrawCursorLineAtBottomAndMoveToFirstCharacterOfLine, _RedrawCursorLine8);

  function RedrawCursorLineAtBottomAndMoveToFirstCharacterOfLine() {
    _classCallCheck(this, RedrawCursorLineAtBottomAndMoveToFirstCharacterOfLine);

    _get(Object.getPrototypeOf(RedrawCursorLineAtBottomAndMoveToFirstCharacterOfLine.prototype), 'constructor', this).apply(this, arguments);
  }

  // z -

  // Horizontal Scroll without changing cursor position
  // -------------------------
  // zs
  return RedrawCursorLineAtBottomAndMoveToFirstCharacterOfLine;
})(RedrawCursorLine);

var ScrollCursorToLeft = (function (_MiscCommand14) {
  _inherits(ScrollCursorToLeft, _MiscCommand14);

  function ScrollCursorToLeft() {
    _classCallCheck(this, ScrollCursorToLeft);

    _get(Object.getPrototypeOf(ScrollCursorToLeft.prototype), 'constructor', this).apply(this, arguments);

    this.which = 'left';
  }

  // ze

  _createClass(ScrollCursorToLeft, [{
    key: 'execute',
    value: function execute() {
      var translation = this.which === 'left' ? [0, 0] : [0, 1];
      var screenPosition = this.editor.getCursorScreenPosition().translate(translation);
      var pixel = this.editorElement.pixelPositionForScreenPosition(screenPosition);
      if (this.which === 'left') {
        this.editorElement.setScrollLeft(pixel.left);
      } else {
        this.editorElement.setScrollRight(pixel.left);
        this.editor.component.updateSync(); // FIXME: This is necessary maybe because of bug of atom-core.
      }
    }
  }]);

  return ScrollCursorToLeft;
})(MiscCommand);

var ScrollCursorToRight = (function (_ScrollCursorToLeft) {
  _inherits(ScrollCursorToRight, _ScrollCursorToLeft);

  function ScrollCursorToRight() {
    _classCallCheck(this, ScrollCursorToRight);

    _get(Object.getPrototypeOf(ScrollCursorToRight.prototype), 'constructor', this).apply(this, arguments);

    this.which = 'right';
  }

  // insert-mode specific commands
  // -------------------------
  return ScrollCursorToRight;
})(ScrollCursorToLeft);

var InsertMode = (function (_MiscCommand15) {
  _inherits(InsertMode, _MiscCommand15);

  function InsertMode() {
    _classCallCheck(this, InsertMode);

    _get(Object.getPrototypeOf(InsertMode.prototype), 'constructor', this).apply(this, arguments);
  }

  // just namespace

  return InsertMode;
})(MiscCommand);

var ActivateNormalModeOnce = (function (_InsertMode) {
  _inherits(ActivateNormalModeOnce, _InsertMode);

  function ActivateNormalModeOnce() {
    _classCallCheck(this, ActivateNormalModeOnce);

    _get(Object.getPrototypeOf(ActivateNormalModeOnce.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(ActivateNormalModeOnce, [{
    key: 'execute',
    value: function execute() {
      var _this7 = this;

      var cursorsToMoveRight = this.editor.getCursors().filter(function (cursor) {
        return !cursor.isAtBeginningOfLine();
      });
      this.vimState.activate('normal');
      for (var cursor of cursorsToMoveRight) {
        this.utils.moveCursorRight(cursor);
      }

      var disposable = atom.commands.onDidDispatch(function (event) {
        if (event.type !== _this7.getCommandName()) {
          disposable.dispose();
          _this7.vimState.activate('insert');
        }
      });
    }
  }]);

  return ActivateNormalModeOnce;
})(InsertMode);

var ToggleReplaceMode = (function (_MiscCommand16) {
  _inherits(ToggleReplaceMode, _MiscCommand16);

  function ToggleReplaceMode() {
    _classCallCheck(this, ToggleReplaceMode);

    _get(Object.getPrototypeOf(ToggleReplaceMode.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(ToggleReplaceMode, [{
    key: 'execute',
    value: function execute() {
      if (this.mode === 'insert') {
        if (this.submode === 'replace') {
          this.vimState.operationStack.runNext('ActivateInsertMode');
        } else {
          this.vimState.operationStack.runNext('ActivateReplaceMode');
        }
      }
    }
  }]);

  return ToggleReplaceMode;
})(MiscCommand);

var InsertRegister = (function (_InsertMode2) {
  _inherits(InsertRegister, _InsertMode2);

  function InsertRegister() {
    _classCallCheck(this, InsertRegister);

    _get(Object.getPrototypeOf(InsertRegister.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(InsertRegister, [{
    key: 'execute',
    value: _asyncToGenerator(function* () {
      var _this8 = this;

      var input = yield this.readCharPromised();
      if (input) {
        this.editor.transact(function () {
          for (var selection of _this8.editor.getSelections()) {
            selection.insertText(_this8.vimState.register.getText(input, selection));
          }
        });
      }
    })
  }]);

  return InsertRegister;
})(InsertMode);

var InsertLastInserted = (function (_InsertMode3) {
  _inherits(InsertLastInserted, _InsertMode3);

  function InsertLastInserted() {
    _classCallCheck(this, InsertLastInserted);

    _get(Object.getPrototypeOf(InsertLastInserted.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(InsertLastInserted, [{
    key: 'execute',
    value: function execute() {
      this.editor.insertText(this.vimState.register.getText('.'));
    }
  }]);

  return InsertLastInserted;
})(InsertMode);

var CopyFromLineAbove = (function (_InsertMode4) {
  _inherits(CopyFromLineAbove, _InsertMode4);

  function CopyFromLineAbove() {
    _classCallCheck(this, CopyFromLineAbove);

    _get(Object.getPrototypeOf(CopyFromLineAbove.prototype), 'constructor', this).apply(this, arguments);

    this.rowDelta = -1;
  }

  _createClass(CopyFromLineAbove, [{
    key: 'execute',
    value: function execute() {
      var _this9 = this;

      var translation = [this.rowDelta, 0];
      this.editor.transact(function () {
        for (var selection of _this9.editor.getSelections()) {
          var point = selection.cursor.getBufferPosition().translate(translation);
          if (point.row >= 0) {
            var range = Range.fromPointWithDelta(point, 0, 1);
            var text = _this9.editor.getTextInBufferRange(range);
            if (text) selection.insertText(text);
          }
        }
      });
    }
  }]);

  return CopyFromLineAbove;
})(InsertMode);

var CopyFromLineBelow = (function (_CopyFromLineAbove) {
  _inherits(CopyFromLineBelow, _CopyFromLineAbove);

  function CopyFromLineBelow() {
    _classCallCheck(this, CopyFromLineBelow);

    _get(Object.getPrototypeOf(CopyFromLineBelow.prototype), 'constructor', this).apply(this, arguments);

    this.rowDelta = +1;
  }

  return CopyFromLineBelow;
})(CopyFromLineAbove);

var NextTab = (function (_MiscCommand17) {
  _inherits(NextTab, _MiscCommand17);

  function NextTab() {
    _classCallCheck(this, NextTab);

    _get(Object.getPrototypeOf(NextTab.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(NextTab, [{
    key: 'execute',
    value: function execute() {
      var pane = atom.workspace.paneForItem(this.editor);

      if (this.hasCount()) {
        pane.activateItemAtIndex(this.getCount() - 1);
      } else {
        pane.activateNextItem();
      }
    }
  }]);

  return NextTab;
})(MiscCommand);

var PreviousTab = (function (_MiscCommand18) {
  _inherits(PreviousTab, _MiscCommand18);

  function PreviousTab() {
    _classCallCheck(this, PreviousTab);

    _get(Object.getPrototypeOf(PreviousTab.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(PreviousTab, [{
    key: 'execute',
    value: function execute() {
      atom.workspace.paneForItem(this.editor).activatePreviousItem();
    }
  }]);

  return PreviousTab;
})(MiscCommand);

module.exports = {
  MiscCommand: MiscCommand,
  Mark: Mark,
  ReverseSelections: ReverseSelections,
  BlockwiseOtherEnd: BlockwiseOtherEnd,
  Undo: Undo,
  Redo: Redo,
  FoldCurrentRow: FoldCurrentRow,
  UnfoldCurrentRow: UnfoldCurrentRow,
  ToggleFold: ToggleFold,
  FoldCurrentRowRecursivelyBase: FoldCurrentRowRecursivelyBase,
  FoldCurrentRowRecursively: FoldCurrentRowRecursively,
  UnfoldCurrentRowRecursively: UnfoldCurrentRowRecursively,
  ToggleFoldRecursively: ToggleFoldRecursively,
  UnfoldAll: UnfoldAll,
  FoldAll: FoldAll,
  UnfoldNextIndentLevel: UnfoldNextIndentLevel,
  FoldNextIndentLevel: FoldNextIndentLevel,
  MiniScrollDown: MiniScrollDown,
  MiniScrollUp: MiniScrollUp,
  RedrawCursorLine: RedrawCursorLine,
  RedrawCursorLineAtTop: RedrawCursorLineAtTop,
  RedrawCursorLineAtTopAndMoveToFirstCharacterOfLine: RedrawCursorLineAtTopAndMoveToFirstCharacterOfLine,
  RedrawCursorLineAtUpperMiddle: RedrawCursorLineAtUpperMiddle,
  RedrawCursorLineAtUpperMiddleAndMoveToFirstCharacterOfLine: RedrawCursorLineAtUpperMiddleAndMoveToFirstCharacterOfLine,
  RedrawCursorLineAtMiddle: RedrawCursorLineAtMiddle,
  RedrawCursorLineAtMiddleAndMoveToFirstCharacterOfLine: RedrawCursorLineAtMiddleAndMoveToFirstCharacterOfLine,
  RedrawCursorLineAtBottom: RedrawCursorLineAtBottom,
  RedrawCursorLineAtBottomAndMoveToFirstCharacterOfLine: RedrawCursorLineAtBottomAndMoveToFirstCharacterOfLine,
  ScrollCursorToLeft: ScrollCursorToLeft,
  ScrollCursorToRight: ScrollCursorToRight,
  ActivateNormalModeOnce: ActivateNormalModeOnce,
  ToggleReplaceMode: ToggleReplaceMode,
  InsertRegister: InsertRegister,
  InsertLastInserted: InsertLastInserted,
  CopyFromLineAbove: CopyFromLineAbove,
  CopyFromLineBelow: CopyFromLineBelow,
  NextTab: NextTab,
  PreviousTab: PreviousTab
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3l1YW5zaGVuLy5hdG9tL3BhY2thZ2VzL3ZpbS1tb2RlLXBsdXMvbGliL21pc2MtY29tbWFuZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUE7Ozs7Ozs7Ozs7OztlQUVLLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQXhCLEtBQUssWUFBTCxLQUFLOztBQUNaLElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTs7SUFFeEIsV0FBVztZQUFYLFdBQVc7O1dBQVgsV0FBVzswQkFBWCxXQUFXOzsrQkFBWCxXQUFXOzs7ZUFBWCxXQUFXOztXQUNFLEtBQUs7Ozs7V0FDQyxjQUFjOzs7O1NBRmpDLFdBQVc7R0FBUyxJQUFJOztJQUt4QixJQUFJO1lBQUosSUFBSTs7V0FBSixJQUFJOzBCQUFKLElBQUk7OytCQUFKLElBQUk7OztlQUFKLElBQUk7OzZCQUNNLGFBQUc7QUFDZixVQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFBO0FBQzFDLFVBQUksSUFBSSxFQUFFO0FBQ1IsWUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxDQUFBO09BQzdEO0tBQ0Y7OztTQU5HLElBQUk7R0FBUyxXQUFXOztJQVN4QixpQkFBaUI7WUFBakIsaUJBQWlCOztXQUFqQixpQkFBaUI7MEJBQWpCLGlCQUFpQjs7K0JBQWpCLGlCQUFpQjs7O2VBQWpCLGlCQUFpQjs7V0FDYixtQkFBRztBQUNULFVBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFBO0FBQ3RGLFVBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLEVBQUU7QUFDdEMs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LGdCQUFnQjtBQUNoQixZQUFVLEVBQVYsVUFBVTtBQUNWLCtCQUE2QixFQUE3Qiw2QkFBNkI7QUFDN0IsMkJBQXlCLEVBQXpCLHlCQUF5QjtBQUN6Qiw2QkFBMkIsRUFBM0IsMkJBQTJCO0FBQzNCLHVCQUFxQixFQUFyQixxQkFBcUI7QUFDckIsV0FBUyxFQUFULFNBQVM7QUFDVCxTQUFPLEVBQVAsT0FBTztBQUNQLHVCQUFxQixFQUFyQixxQkFBcUI7QUFDckIscUJBQW1CLEVBQW5CLG1CQUFtQjtBQUNuQixnQkFBYyxFQUFkLGNBQWM7QUFDZCxjQUFZLEVBQVosWUFBWTtBQUNaLGtCQUFnQixFQUFoQixnQkFBZ0I7QUFDaEIsdUJBQXFCLEVBQXJCLHFCQUFxQjtBQUNyQixvREFBa0QsRUFBbEQsa0RBQWtEO0FBQ2xELCtCQUE2QixFQUE3Qiw2QkFBNkI7QUFDN0IsNERBQTBELEVBQTFELDBEQUEwRDtBQUMxRCwwQkFBd0IsRUFBeEIsd0JBQXdCO0FBQ3hCLHVEQUFxRCxFQUFyRCxxREFBcUQ7QUFDckQsMEJBQXdCLEVBQXhCLHdCQUF3QjtBQUN4Qix1REFBcUQsRUFBckQscURBQXFEO0FBQ3JELG9CQUFrQixFQUFsQixrQkFBa0I7QUFDbEIscUJBQW1CLEVBQW5CLG1CQUFtQjtBQUNuQix3QkFBc0IsRUFBdEIsc0JBQXNCO0FBQ3RCLG1CQUFpQixFQUFqQixpQkFBaUI7QUFDakIsZ0JBQWMsRUFBZCxjQUFjO0FBQ2Qsb0JBQWtCLEVBQWxCLGtCQUFrQjtBQUNsQixtQkFBaUIsRUFBakIsaUJBQWlCO0FBQ2pCLG1CQUFpQixFQUFqQixpQkFBaUI7QUFDakIsU0FBTyxFQUFQLE9BQU87QUFDUCxhQUFXLEVBQVgsV0FBVztDQUNaLENBQUEiLCJmaWxlIjoiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvbWlzYy1jb21tYW5kLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCdcblxuY29uc3Qge1JhbmdlfSA9IHJlcXVpcmUoJ2F0b20nKVxuY29uc3QgQmFzZSA9IHJlcXVpcmUoJy4vYmFzZScpXG5cbmNsYXNzIE1pc2NDb21tYW5kIGV4dGVuZHMgQmFzZSB7XG4gIHN0YXRpYyBjb21tYW5kID0gZmFsc2VcbiAgc3RhdGljIG9wZXJhdGlvbktpbmQgPSAnbWlzYy1jb21tYW5kJ1xufVxuXG5jbGFzcyBNYXJrIGV4dGVuZHMgTWlzY0NvbW1hbmQge1xuICBhc3luYyBleGVjdXRlICgpIHtcbiAgICBjb25zdCBtYXJrID0gYXdhaXQgdGhpcy5yZWFkQ2hhclByb21pc2VkKClcbiAgICBpZiAobWFyaykge1xuICAgICAgdGhpcy52aW1TdGF0ZS5tYXJrLnNldChtYXJrLCB0aGlzLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFJldmVyc2VTZWxlY3Rpb25zIGV4dGVuZHMgTWlzY0NvbW1hbmQge1xuICBleGVjdXRlICgpIHtcbiAgICB0aGlzLnN3cmFwLnNldFJldmVyc2VkU3RhdGUodGhpcy5lZGl0b3IsICF0aGlzLmVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkuaXNSZXZlcnNlZCgpKVxuICAgIGlmICh0aGlzLmlzTW9kZSgndmlzdWFsJywgJ2Jsb2Nrd2lzZScpKSB7XG4gICAgICB0aGlzLmdldExhc3RCbG9ja3dpc2VTZWxlY3Rpb24oKS5hdXRvc2Nyb2xsKClcbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgQmxvY2t3aXNlT3RoZXJFbmQgZXh0ZW5kcyBSZXZlcnNlU2VsZWN0aW9ucyB7XG4gIGV4ZWN1dGUgKCkge1xuICAgIGZvciAoY29uc3QgYmxvY2t3aXNlU2VsZWN0aW9uIG9mIHRoaXMuZ2V0QmxvY2t3aXNlU2VsZWN0aW9ucygpKSB7XG4gICAgICBibG9ja3dpc2VTZWxlY3Rpb24ucmV2ZXJzZSgpXG4gICAgfVxuICAgIHN1cGVyLmV4ZWN1dGUoKVxuICB9XG59XG5cbmNsYXNzIFVuZG8gZXh0ZW5kcyBNaXNjQ29tbWFuZCB7XG4gIGV4ZWN1dGUgKCkge1xuICAgIGNvbnN0IG5ld1JhbmdlcyA9IFtdXG4gICAgY29uc3Qgb2xkUmFuZ2VzID0gW11cblxuICAgIGNvbnN0IGRpc3Bvc2FibGUgPSB0aGlzLmVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZENoYW5nZVRleHQoZXZlbnQgPT4ge1xuICAgICAgZm9yIChjb25zdCB7bmV3UmFuZ2UsIG9sZFJhbmdlfSBvZiBldmVudC5jaGFuZ2VzKSB7XG4gICAgICAgIGlmIChuZXdSYW5nZS5pc0VtcHR5KCkpIHtcbiAgICAgICAgICBvbGRSYW5nZXMucHVzaChvbGRSYW5nZSkgLy8gUmVtb3ZlIG9ubHlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXdSYW5nZXMucHVzaChuZXdSYW5nZSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBpZiAodGhpcy5uYW1lID09PSAnVW5kbycpIHtcbiAgICAgIHRoaXMuZWRpdG9yLnVuZG8oKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVkaXRvci5yZWRvKClcbiAgICB9XG5cbiAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKVxuXG4gICAgZm9yIChjb25zdCBzZWxlY3Rpb24gb2YgdGhpcy5lZGl0b3IuZ2V0U2VsZWN0aW9ucygpKSB7XG4gICAgICBzZWxlY3Rpb24uY2xlYXIoKVxuICAgIH1cblxuICAgIGlmICh0aGlzLmdldENvbmZpZygnc2V0Q3Vyc29yVG9TdGFydE9mQ2hhbmdlT25VbmRvUmVkbycpKSB7XG4gICAgICBjb25zdCBzdHJhdGVneSA9IHRoaXMuZ2V0Q29uZmlnKCdzZXRDdXJzb3JUb1N0YXJ0T2ZDaGFuZ2VPblVuZG9SZWRvU3RyYXRlZ3knKVxuICAgICAgdGhpcy5zZXRDdXJzb3JQb3NpdGlvbih7bmV3UmFuZ2VzLCBvbGRSYW5nZXMsIHN0cmF0ZWd5fSlcbiAgICAgIHRoaXMudmltU3RhdGUuY2xlYXJTZWxlY3Rpb25zKClcbiAgICB9XG5cbiAgICBpZiAodGhpcy5nZXRDb25maWcoJ2ZsYXNoT25VbmRvUmVkbycpKSB7XG4gICAgICBpZiAobmV3UmFuZ2VzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLmZsYXNoQ2hhbmdlcyhuZXdSYW5nZXMsICdjaGFuZ2VzJylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZmxhc2hDaGFuZ2VzKG9sZFJhbmdlcywgJ2RlbGV0ZXMnKVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmFjdGl2YXRlTW9kZSgnbm9ybWFsJylcbiAgfVxuXG4gIHNldEN1cnNvclBvc2l0aW9uICh7bmV3UmFuZ2VzLCBvbGRSYW5nZXMsIHN0cmF0ZWd5fSkge1xuICAgIGNvbnN0IGxhc3RDdXJzb3IgPSB0aGlzLmVkaXRvci5nZXRMYXN0Q3Vyc29yKCkgLy8gVGhpcyBpcyByZXN0b3JlZCBjdXJzb3JcblxuICAgIGxldCBjaGFuZ2VkUmFuZ2VcblxuICAgIGlmIChzdHJhdGVneSA9PT0gJ3NtYXJ0Jykge1xuICAgICAgY2hhbmdlZFJhbmdlID0gdGhpcy51dGlscy5maW5kUmFuZ2VDb250YWluc1BvaW50KG5ld1JhbmdlcywgbGFzdEN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKVxuICAgIH0gZWxzZSBpZiAoc3RyYXRlZ3kgPT09ICdzaW1wbGUnKSB7XG4gICAgICBjaGFuZ2VkUmFuZ2UgPSB0aGlzLnV0aWxzLnNvcnRSYW5nZXMobmV3UmFuZ2VzLmNvbmNhdChvbGRSYW5nZXMpKVswXVxuICAgIH1cblxuICAgIGlmIChjaGFuZ2VkUmFuZ2UpIHtcbiAgICAgIGlmICh0aGlzLnV0aWxzLmlzTGluZXdpc2VSYW5nZShjaGFuZ2VkUmFuZ2UpKSB0aGlzLnV0aWxzLnNldEJ1ZmZlclJvdyhsYXN0Q3Vyc29yLCBjaGFuZ2VkUmFuZ2Uuc3RhcnQucm93KVxuICAgICAgZWxzZSBsYXN0Q3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKGNoYW5nZWRSYW5nZS5zdGFydClcbiAgICB9XG4gIH1cblxuICBmbGFzaENoYW5nZXMgKHJhbmdlcywgbXV0YXRpb25UeXBlKSB7XG4gICAgY29uc3QgaXNNdWx0aXBsZVNpbmdsZUxpbmVSYW5nZXMgPSByYW5nZXMgPT4gcmFuZ2VzLmxlbmd0aCA+IDEgJiYgcmFuZ2VzLmV2ZXJ5KHRoaXMudXRpbHMuaXNTaW5nbGVMaW5lUmFuZ2UpXG4gICAgY29uc3QgaHVtYW5pemVOZXdMaW5lRm9yQnVmZmVyUmFuZ2UgPSB0aGlzLnV0aWxzLmh1bWFuaXplTmV3TGluZUZvckJ1ZmZlclJhbmdlLmJpbmQobnVsbCwgdGhpcy5lZGl0b3IpXG4gICAgY29uc3QgaXNOb3RMZWFkaW5nV2hpdGVTcGFjZVJhbmdlID0gdGhpcy51dGlscy5pc05vdExlYWRpbmdXaGl0ZVNwYWNlUmFuZ2UuYmluZChudWxsLCB0aGlzLmVkaXRvcilcbiAgICBpZiAoIXRoaXMudXRpbHMuaXNNdWx0aXBsZUFuZEFsbFJhbmdlSGF2ZVNhbWVDb2x1bW5BbmRDb25zZWN1dGl2ZVJvd3MocmFuZ2VzKSkge1xuICAgICAgcmFuZ2VzID0gcmFuZ2VzLm1hcChodW1hbml6ZU5ld0xpbmVGb3JCdWZmZXJSYW5nZSlcbiAgICAgIGNvbnN0IHR5cGUgPSBpc011bHRpcGxlU2luZ2xlTGluZVJhbmdlcyhyYW5nZXMpID8gYHVuZG8tcmVkby1tdWx0aXBsZS0ke211dGF0aW9uVHlwZX1gIDogJ3VuZG8tcmVkbydcbiAgICAgIGlmICghKHR5cGUgPT09ICd1bmRvLXJlZG8nICYmIG11dGF0aW9uVHlwZSA9PT0gJ2RlbGV0ZXMnKSkge1xuICAgICAgICB0aGlzLnZpbVN0YXRlLmZsYXNoKHJhbmdlcy5maWx0ZXIoaXNOb3RMZWFkaW5nV2hpdGVTcGFjZVJhbmdlKSwge3R5cGV9KVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBSZWRvIGV4dGVuZHMgVW5kbyB7fVxuXG4vLyB6Y1xuY2xhc3MgRm9sZEN1cnJlbnRSb3cgZXh0ZW5kcyBNaXNjQ29tbWFuZCB7XG4gIGV4ZWN1dGUgKCkge1xuICAgIGZvciAoY29uc3QgcG9pbnQgb2YgdGhpcy5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbnMoKSkge1xuICAgICAgdGhpcy5lZGl0b3IuZm9sZEJ1ZmZlclJvdyhwb2ludC5yb3cpXG4gICAgfVxuICB9XG59XG5cbi8vIHpvXG5jbGFzcyBVbmZvbGRDdXJyZW50Um93IGV4dGVuZHMgTWlzY0NvbW1hbmQge1xuICBleGVjdXRlICgpIHtcbiAgICBmb3IgKGNvbnN0IHBvaW50IG9mIHRoaXMuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb25zKCkpIHtcbiAgICAgIHRoaXMuZWRpdG9yLnVuZm9sZEJ1ZmZlclJvdyhwb2ludC5yb3cpXG4gICAgfVxuICB9XG59XG5cbi8vIHphXG5jbGFzcyBUb2dnbGVGb2xkIGV4dGVuZHMgTWlzY0NvbW1hbmQge1xuICBleGVjdXRlICgpIHtcbiAgICBmb3IgKGNvbnN0IHBvaW50IG9mIHRoaXMuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb25zKCkpIHtcbiAgICAgIHRoaXMuZWRpdG9yLnRvZ2dsZUZvbGRBdEJ1ZmZlclJvdyhwb2ludC5yb3cpXG4gICAgfVxuICB9XG59XG5cbi8vIEJhc2Ugb2YgekMsIHpPLCB6QVxuY2xhc3MgRm9sZEN1cnJlbnRSb3dSZWN1cnNpdmVseUJhc2UgZXh0ZW5kcyBNaXNjQ29tbWFuZCB7XG4gIHN0YXRpYyBjb21tYW5kID0gZmFsc2VcbiAgZWFjaEZvbGRTdGFydFJvdyAoZm4pIHtcbiAgICBmb3IgKGNvbnN0IHtyb3d9IG9mIHRoaXMuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb25zT3JkZXJlZCgpLnJldmVyc2UoKSkge1xuICAgICAgaWYgKCF0aGlzLmVkaXRvci5pc0ZvbGRhYmxlQXRCdWZmZXJSb3cocm93KSkgY29udGludWVcblxuICAgICAgY29uc3QgZm9sZFJhbmdlcyA9IHRoaXMudXRpbHMuZ2V0Q29kZUZvbGRSYW5nZXModGhpcy5lZGl0b3IpXG4gICAgICBjb25zdCBlbmNsb3NpbmdGb2xkUmFuZ2UgPSBmb2xkUmFuZ2VzLmZpbmQocmFuZ2UgPT4gcmFuZ2Uuc3RhcnQucm93ID09PSByb3cpXG4gICAgICBjb25zdCBlbmNsb3NlZEZvbGRSYW5nZXMgPSBmb2xkUmFuZ2VzLmZpbHRlcihyYW5nZSA9PiBlbmNsb3NpbmdGb2xkUmFuZ2UuY29udGFpbnNSYW5nZShyYW5nZSkpXG5cbiAgICAgIC8vIFdoeSByZXZlcnNlKCkgaXMgdG8gcHJvY2VzcyBlbmNvbG9zZWQobmVzdGVkKSBmb2xkIGZpcnN0IHRoYW4gZW5jb2xvc2luZyBmb2xkLlxuICAgICAgZW5jbG9zZWRGb2xkUmFuZ2VzLnJldmVyc2UoKS5mb3JFYWNoKHJhbmdlID0+IGZuKHJhbmdlLnN0YXJ0LnJvdykpXG4gICAgfVxuICB9XG5cbiAgZm9sZFJlY3Vyc2l2ZWx5ICgpIHtcbiAgICB0aGlzLmVhY2hGb2xkU3RhcnRSb3cocm93ID0+IHtcbiAgICAgIGlmICghdGhpcy5lZGl0b3IuaXNGb2xkZWRBdEJ1ZmZlclJvdyhyb3cpKSB0aGlzLmVkaXRvci5mb2xkQnVmZmVyUm93KHJvdylcbiAgICB9KVxuICB9XG5cbiAgdW5mb2xkUmVjdXJzaXZlbHkgKCkge1xuICAgIHRoaXMuZWFjaEZvbGRTdGFydFJvdyhyb3cgPT4ge1xuICAgICAgaWYgKHRoaXMuZWRpdG9yLmlzRm9sZGVkQXRCdWZmZXJSb3cocm93KSkgdGhpcy5lZGl0b3IudW5mb2xkQnVmZmVyUm93KHJvdylcbiAgICB9KVxuICB9XG59XG5cbi8vIHpDXG5jbGFzcyBGb2xkQ3VycmVudFJvd1JlY3Vyc2l2ZWx5IGV4dGVuZHMgRm9sZEN1cnJlbnRSb3dSZWN1cnNpdmVseUJhc2Uge1xuICBleGVjdXRlICgpIHtcbiAgICB0aGlzLmZvbGRSZWN1cnNpdmVseSgpXG4gIH1cbn1cblxuLy8gek9cbmNsYXNzIFVuZm9sZEN1cnJlbnRSb3dSZWN1cnNpdmVseSBleHRlbmRzIEZvbGRDdXJyZW50Um93UmVjdXJzaXZlbHlCYXNlIHtcbiAgZXhlY3V0ZSAoKSB7XG4gICAgdGhpcy51bmZvbGRSZWN1cnNpdmVseSgpXG4gIH1cbn1cblxuLy8gekFcbmNsYXNzIFRvZ2dsZUZvbGRSZWN1cnNpdmVseSBleHRlbmRzIEZvbGRDdXJyZW50Um93UmVjdXJzaXZlbHlCYXNlIHtcbiAgZXhlY3V0ZSAoKSB7XG4gICAgaWYgKHRoaXMuZWRpdG9yLmlzRm9sZGVkQXRCdWZmZXJSb3codGhpcy5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpLnJvdykpIHtcbiAgICAgIHRoaXMudW5mb2xkUmVjdXJzaXZlbHkoKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmZvbGRSZWN1cnNpdmVseSgpXG4gICAgfVxuICB9XG59XG5cbi8vIHpSXG5jbGFzcyBVbmZvbGRBbGwgZXh0ZW5kcyBNaXNjQ29tbWFuZCB7XG4gIGV4ZWN1dGUgKCkge1xuICAgIHRoaXMuZWRpdG9yLnVuZm9sZEFsbCgpXG4gIH1cbn1cblxuLy8gek1cbmNsYXNzIEZvbGRBbGwgZXh0ZW5kcyBNaXNjQ29tbWFuZCB7XG4gIGV4ZWN1dGUgKCkge1xuICAgIGNvbnN0IHthbGxGb2xkfSA9IHRoaXMudXRpbHMuZ2V0Rm9sZEluZm9CeUtpbmQodGhpcy5lZGl0b3IpXG4gICAgaWYgKCFhbGxGb2xkKSByZXR1cm5cblxuICAgIHRoaXMuZWRpdG9yLnVuZm9sZEFsbCgpXG4gICAgZm9yIChjb25zdCB7aW5kZW50LCByYW5nZX0gb2YgYWxsRm9sZC5saXN0T2ZSYW5nZUFuZEluZGVudCkge1xuICAgICAgaWYgKGluZGVudCA8PSB0aGlzLmdldENvbmZpZygnbWF4Rm9sZGFibGVJbmRlbnRMZXZlbCcpKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yLmZvbGRCdWZmZXJSYW5nZShyYW5nZSlcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5lZGl0b3Iuc2Nyb2xsVG9DdXJzb3JQb3NpdGlvbih7Y2VudGVyOiB0cnVlfSlcbiAgfVxufVxuXG4vLyB6clxuY2xhc3MgVW5mb2xkTmV4dEluZGVudExldmVsIGV4dGVuZHMgTWlzY0NvbW1hbmQge1xuICBleGVjdXRlICgpIHtcbiAgICBjb25zdCB7Zm9sZGVkfSA9IHRoaXMudXRpbHMuZ2V0Rm9sZEluZm9CeUtpbmQodGhpcy5lZGl0b3IpXG4gICAgaWYgKCFmb2xkZWQpIHJldHVyblxuICAgIGNvbnN0IHttaW5JbmRlbnQsIGxpc3RPZlJhbmdlQW5kSW5kZW50fSA9IGZvbGRlZFxuICAgIGNvbnN0IHRhcmdldEluZGVudHMgPSB0aGlzLnV0aWxzLmdldExpc3QobWluSW5kZW50LCBtaW5JbmRlbnQgKyB0aGlzLmdldENvdW50KCkgLSAxKVxuICAgIGZvciAoY29uc3Qge2luZGVudCwgcmFuZ2V9IG9mIGxpc3RPZlJhbmdlQW5kSW5kZW50KSB7XG4gICAgICBpZiAodGFyZ2V0SW5kZW50cy5pbmNsdWRlcyhpbmRlbnQpKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yLnVuZm9sZEJ1ZmZlclJvdyhyYW5nZS5zdGFydC5yb3cpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vIHptXG5jbGFzcyBGb2xkTmV4dEluZGVudExldmVsIGV4dGVuZHMgTWlzY0NvbW1hbmQge1xuICBleGVjdXRlICgpIHtcbiAgICBjb25zdCB7dW5mb2xkZWQsIGFsbEZvbGR9ID0gdGhpcy51dGlscy5nZXRGb2xkSW5mb0J5S2luZCh0aGlzLmVkaXRvcilcbiAgICBpZiAoIXVuZm9sZGVkKSByZXR1cm5cbiAgICAvLyBGSVhNRTogV2h5IEkgbmVlZCB1bmZvbGRBbGwoKT8gV2h5IGNhbid0IEkganVzdCBmb2xkIG5vbi1mb2xkZWQtZm9sZCBvbmx5P1xuICAgIC8vIFVubGVzcyB1bmZvbGRBbGwoKSBoZXJlLCBAZWRpdG9yLnVuZm9sZEFsbCgpIGRlbGV0ZSBmb2xkTWFya2VyIGJ1dCBmYWlsXG4gICAgLy8gdG8gcmVuZGVyIHVuZm9sZGVkIHJvd3MgY29ycmVjdGx5LlxuICAgIC8vIEkgYmVsaWV2ZSB0aGlzIGlzIGJ1ZyBvZiB0ZXh0LWJ1ZmZlcidzIG1hcmtlckxheWVyIHdoaWNoIGFzc3VtZSBmb2xkcyBhcmVcbiAgICAvLyBjcmVhdGVkICoqaW4tb3JkZXIqKiBmcm9tIHRvcC1yb3cgdG8gYm90dG9tLXJvdy5cbiAgICB0aGlzLmVkaXRvci51bmZvbGRBbGwoKVxuXG4gICAgY29uc3QgbWF4Rm9sZGFibGUgPSB0aGlzLmdldENvbmZpZygnbWF4Rm9sZGFibGVJbmRlbnRMZXZlbCcpXG4gICAgbGV0IGZyb21MZXZlbCA9IE1hdGgubWluKHVuZm9sZGVkLm1heEluZGVudCwgbWF4Rm9sZGFibGUpXG4gICAgZnJvbUxldmVsID0gdGhpcy5saW1pdE51bWJlcihmcm9tTGV2ZWwgLSB0aGlzLmdldENvdW50KCkgLSAxLCB7bWluOiAwfSlcbiAgICBjb25zdCB0YXJnZXRJbmRlbnRzID0gdGhpcy51dGlscy5nZXRMaXN0KGZyb21MZXZlbCwgbWF4Rm9sZGFibGUpXG4gICAgZm9yIChjb25zdCB7aW5kZW50LCByYW5nZX0gb2YgYWxsRm9sZC5saXN0T2ZSYW5nZUFuZEluZGVudCkge1xuICAgICAgaWYgKHRhcmdldEluZGVudHMuaW5jbHVkZXMoaW5kZW50KSkge1xuICAgICAgICB0aGlzLmVkaXRvci5mb2xkQnVmZmVyUmFuZ2UocmFuZ2UpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vIGN0cmwtZSBzY3JvbGwgbGluZXMgZG93bndhcmRzXG5jbGFzcyBNaW5pU2Nyb2xsRG93biBleHRlbmRzIE1pc2NDb21tYW5kIHtcbiAgZGVmYXVsdENvdW50ID0gdGhpcy5nZXRDb25maWcoJ2RlZmF1bHRTY3JvbGxSb3dzT25NaW5pU2Nyb2xsJylcbiAgZGlyZWN0aW9uID0gJ2Rvd24nXG5cbiAga2VlcEN1cnNvck9uU2NyZWVuICgpIHtcbiAgICBjb25zdCBjdXJzb3IgPSB0aGlzLmVkaXRvci5nZXRMYXN0Q3Vyc29yKClcbiAgICBjb25zdCByb3cgPSBjdXJzb3IuZ2V0U2NyZWVuUm93KClcbiAgICBjb25zdCBvZmZzZXQgPSAyXG4gICAgY29uc3QgdmFsaWRSb3cgPVxuICAgICAgdGhpcy5kaXJlY3Rpb24gPT09ICdkb3duJ1xuICAgICAgICA/IHRoaXMubGltaXROdW1iZXIocm93LCB7bWluOiB0aGlzLmVkaXRvci5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKSArIG9mZnNldH0pXG4gICAgICAgIDogdGhpcy5saW1pdE51bWJlcihyb3csIHttYXg6IHRoaXMuZWRpdG9yLmdldExhc3RWaXNpYmxlU2NyZWVuUm93KCkgLSBvZmZzZXR9KVxuICAgIGlmIChyb3cgIT09IHZhbGlkUm93KSB7XG4gICAgICB0aGlzLnV0aWxzLnNldEJ1ZmZlclJvdyhjdXJzb3IsIHRoaXMuZWRpdG9yLmJ1ZmZlclJvd0ZvclNjcmVlblJvdyh2YWxpZFJvdyksIHthdXRvc2Nyb2xsOiBmYWxzZX0pXG4gICAgfVxuICB9XG5cbiAgZXhlY3V0ZSAoKSB7XG4gICAgdGhpcy52aW1TdGF0ZS5yZXF1ZXN0U2Nyb2xsKHtcbiAgICAgIGFtb3VudE9mUGl4ZWxzOiAodGhpcy5kaXJlY3Rpb24gPT09ICdkb3duJyA/IDEgOiAtMSkgKiB0aGlzLmdldENvdW50KCkgKiB0aGlzLmVkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKSxcbiAgICAgIGR1cmF0aW9uOiB0aGlzLmdldFNtb290aFNjcm9sbER1YXRpb24oJ01pbmlTY3JvbGwnKSxcbiAgICAgIG9uRmluaXNoOiAoKSA9PiB0aGlzLmtlZXBDdXJzb3JPblNjcmVlbigpXG4gICAgfSlcbiAgfVxufVxuXG4vLyBjdHJsLXkgc2Nyb2xsIGxpbmVzIHVwd2FyZHNcbmNsYXNzIE1pbmlTY3JvbGxVcCBleHRlbmRzIE1pbmlTY3JvbGxEb3duIHtcbiAgZGlyZWN0aW9uID0gJ3VwJ1xufVxuXG4vLyBSZWRyYXdDdXJzb3JMaW5lQXR7WFhYfSBpbiB2aWV3cG9ydC5cbi8vICstLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tK1xuLy8gfCB3aGVyZSAgICAgICAgfCBubyBtb3ZlIHwgbW92ZSB0byAxc3QgY2hhciB8XG4vLyB8LS0tLS0tLS0tLS0tLS0rLS0tLS0tLS0tKy0tLS0tLS0tLS0tLS0tLS0tLXxcbi8vIHwgdG9wICAgICAgICAgIHwgeiB0ICAgICB8IHogZW50ZXIgICAgICAgICAgfFxuLy8gfCB1cHBlci1taWRkbGUgfCB6IHUgICAgIHwgeiBzcGFjZSAgICAgICAgICB8XG4vLyB8IG1pZGRsZSAgICAgICB8IHogeiAgICAgfCB6IC4gICAgICAgICAgICAgIHxcbi8vIHwgYm90dG9tICAgICAgIHwgeiBiICAgICB8IHogLSAgICAgICAgICAgICAgfFxuLy8gKy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0rXG5jbGFzcyBSZWRyYXdDdXJzb3JMaW5lIGV4dGVuZHMgTWlzY0NvbW1hbmQge1xuICBzdGF0aWMgY29tbWFuZCA9IGZhbHNlXG4gIHN0YXRpYyBjb2VmZmljaWVudEJ5TmFtZSA9IHtcbiAgICBSZWRyYXdDdXJzb3JMaW5lQXRUb3A6IDAsXG4gICAgUmVkcmF3Q3Vyc29yTGluZUF0VXBwZXJNaWRkbGU6IDAuMjUsXG4gICAgUmVkcmF3Q3Vyc29yTGluZUF0TWlkZGxlOiAwLjUsXG4gICAgUmVkcmF3Q3Vyc29yTGluZUF0Qm90dG9tOiAxXG4gIH1cblxuICBpbml0aWFsaXplICgpIHtcbiAgICBjb25zdCBiYXNlTmFtZSA9IHRoaXMubmFtZS5yZXBsYWNlKC9BbmRNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSQvLCAnJylcbiAgICB0aGlzLmNvZWZmaWNpZW50ID0gdGhpcy5jb25zdHJ1Y3Rvci5jb2VmZmljaWVudEJ5TmFtZVtiYXNlTmFtZV1cbiAgICB0aGlzLm1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lID0gdGhpcy5uYW1lLmVuZHNXaXRoKCdBbmRNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZScpXG4gICAgc3VwZXIuaW5pdGlhbGl6ZSgpXG4gIH1cblxuICBleGVjdXRlICgpIHtcbiAgICBjb25zdCBzY3JvbGxUb3AgPSBNYXRoLnJvdW5kKHRoaXMuZ2V0U2Nyb2xsVG9wKCkpXG4gICAgdGhpcy52aW1TdGF0ZS5yZXF1ZXN0U2Nyb2xsKHtcbiAgICAgIHNjcm9sbFRvcDogc2Nyb2xsVG9wLFxuICAgICAgZHVyYXRpb246IHRoaXMuZ2V0U21vb3RoU2Nyb2xsRHVhdGlvbignUmVkcmF3Q3Vyc29yTGluZScpLFxuICAgICAgb25GaW5pc2g6ICgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yRWxlbWVudC5nZXRTY3JvbGxUb3AoKSAhPT0gc2Nyb2xsVG9wICYmICF0aGlzLmVkaXRvci5nZXRTY3JvbGxQYXN0RW5kKCkpIHtcbiAgICAgICAgICB0aGlzLnJlY29tbWVuZFRvRW5hYmxlU2Nyb2xsUGFzdEVuZCgpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICAgIGlmICh0aGlzLm1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lKSB0aGlzLmVkaXRvci5tb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSgpXG4gIH1cblxuICBnZXRTY3JvbGxUb3AgKCkge1xuICAgIGNvbnN0IHt0b3B9ID0gdGhpcy5lZGl0b3JFbGVtZW50LnBpeGVsUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbih0aGlzLmVkaXRvci5nZXRDdXJzb3JTY3JlZW5Qb3NpdGlvbigpKVxuICAgIGNvbnN0IGVkaXRvckhlaWdodCA9IHRoaXMuZWRpdG9yRWxlbWVudC5nZXRIZWlnaHQoKVxuICAgIGNvbnN0IGxpbmVIZWlnaHRJblBpeGVsID0gdGhpcy5lZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKClcblxuICAgIHJldHVybiB0aGlzLmxpbWl0TnVtYmVyKHRvcCAtIGVkaXRvckhlaWdodCAqIHRoaXMuY29lZmZpY2llbnQsIHtcbiAgICAgIG1pbjogdG9wIC0gZWRpdG9ySGVpZ2h0ICsgbGluZUhlaWdodEluUGl4ZWwgKiAzLFxuICAgICAgbWF4OiB0b3AgLSBsaW5lSGVpZ2h0SW5QaXhlbCAqIDJcbiAgICB9KVxuICB9XG5cbiAgcmVjb21tZW5kVG9FbmFibGVTY3JvbGxQYXN0RW5kICgpIHtcbiAgICBjb25zdCBtZXNzYWdlID0gW1xuICAgICAgJ3ZpbS1tb2RlLXBsdXMnLFxuICAgICAgJy0gRmFpbGVkIHRvIHNjcm9sbC4gVG8gc3VjY2Vzc2Z1bGx5IHNjcm9sbCwgYGVkaXRvci5zY3JvbGxQYXN0RW5kYCBuZWVkIHRvIGJlIGVuYWJsZWQuJyxcbiAgICAgICctIFlvdSBjYW4gZG8gaXQgZnJvbSBgXCJTZXR0aW5nc1wiID4gXCJFZGl0b3JcIiA+IFwiU2Nyb2xsIFBhc3QgRW5kXCJgLicsXG4gICAgICAnLSBPciAqKmRvIHlvdSBhbGxvdyB2bXAgZW5hYmxlIGl0IGZvciB5b3Ugbm93PyoqJ1xuICAgIF0uam9pbignXFxuJylcblxuICAgIGNvbnN0IG5vdGlmaWNhdGlvbiA9IGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKG1lc3NhZ2UsIHtcbiAgICAgIGRpc21pc3NhYmxlOiB0cnVlLFxuICAgICAgYnV0dG9uczogW1xuICAgICAgICB7XG4gICAgICAgICAgdGV4dDogJ05vIHRoYW5rcy4nLFxuICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IG5vdGlmaWNhdGlvbi5kaXNtaXNzKClcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHRleHQ6ICdPSy4gRW5hYmxlIGl0IG5vdyEhJyxcbiAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgICBhdG9tLmNvbmZpZy5zZXQoYGVkaXRvci5zY3JvbGxQYXN0RW5kYCwgdHJ1ZSlcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9KVxuICB9XG59XG5cbmNsYXNzIFJlZHJhd0N1cnNvckxpbmVBdFRvcCBleHRlbmRzIFJlZHJhd0N1cnNvckxpbmUge30gLy8genRcbmNsYXNzIFJlZHJhd0N1cnNvckxpbmVBdFRvcEFuZE1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lIGV4dGVuZHMgUmVkcmF3Q3Vyc29yTGluZSB7fSAvLyB6IGVudGVyXG5jbGFzcyBSZWRyYXdDdXJzb3JMaW5lQXRVcHBlck1pZGRsZSBleHRlbmRzIFJlZHJhd0N1cnNvckxpbmUge30gLy8genVcbmNsYXNzIFJlZHJhd0N1cnNvckxpbmVBdFVwcGVyTWlkZGxlQW5kTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUgZXh0ZW5kcyBSZWRyYXdDdXJzb3JMaW5lIHt9IC8vIHogc3BhY2VcbmNsYXNzIFJlZHJhd0N1cnNvckxpbmVBdE1pZGRsZSBleHRlbmRzIFJlZHJhd0N1cnNvckxpbmUge30gLy8geiB6XG5jbGFzcyBSZWRyYXdDdXJzb3JMaW5lQXRNaWRkbGVBbmRNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSBleHRlbmRzIFJlZHJhd0N1cnNvckxpbmUge30gLy8geiAuXG5jbGFzcyBSZWRyYXdDdXJzb3JMaW5lQXRCb3R0b20gZXh0ZW5kcyBSZWRyYXdDdXJzb3JMaW5lIHt9IC8vIHogYlxuY2xhc3MgUmVkcmF3Q3Vyc29yTGluZUF0Qm90dG9tQW5kTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUgZXh0ZW5kcyBSZWRyYXdDdXJzb3JMaW5lIHt9IC8vIHogLVxuXG4vLyBIb3Jpem9udGFsIFNjcm9sbCB3aXRob3V0IGNoYW5naW5nIGN1cnNvciBwb3NpdGlvblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8genNcbmNsYXNzIFNjcm9sbEN1cnNvclRvTGVmdCBleHRlbmRzIE1pc2NDb21tYW5kIHtcbiAgd2hpY2ggPSAnbGVmdCdcbiAgZXhlY3V0ZSAoKSB7XG4gICAgY29uc3QgdHJhbnNsYXRpb24gPSB0aGlzLndoaWNoID09PSAnbGVmdCcgPyBbMCwgMF0gOiBbMCwgMV1cbiAgICBjb25zdCBzY3JlZW5Qb3NpdGlvbiA9IHRoaXMuZWRpdG9yLmdldEN1cnNvclNjcmVlblBvc2l0aW9uKCkudHJhbnNsYXRlKHRyYW5zbGF0aW9uKVxuICAgIGNvbnN0IHBpeGVsID0gdGhpcy5lZGl0b3JFbGVtZW50LnBpeGVsUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5Qb3NpdGlvbilcbiAgICBpZiAodGhpcy53aGljaCA9PT0gJ2xlZnQnKSB7XG4gICAgICB0aGlzLmVkaXRvckVsZW1lbnQuc2V0U2Nyb2xsTGVmdChwaXhlbC5sZWZ0KVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVkaXRvckVsZW1lbnQuc2V0U2Nyb2xsUmlnaHQocGl4ZWwubGVmdClcbiAgICAgIHRoaXMuZWRpdG9yLmNvbXBvbmVudC51cGRhdGVTeW5jKCkgLy8gRklYTUU6IFRoaXMgaXMgbmVjZXNzYXJ5IG1heWJlIGJlY2F1c2Ugb2YgYnVnIG9mIGF0b20tY29yZS5cbiAgICB9XG4gIH1cbn1cblxuLy8gemVcbmNsYXNzIFNjcm9sbEN1cnNvclRvUmlnaHQgZXh0ZW5kcyBTY3JvbGxDdXJzb3JUb0xlZnQge1xuICB3aGljaCA9ICdyaWdodCdcbn1cblxuLy8gaW5zZXJ0LW1vZGUgc3BlY2lmaWMgY29tbWFuZHNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIEluc2VydE1vZGUgZXh0ZW5kcyBNaXNjQ29tbWFuZCB7fSAvLyBqdXN0IG5hbWVzcGFjZVxuXG5jbGFzcyBBY3RpdmF0ZU5vcm1hbE1vZGVPbmNlIGV4dGVuZHMgSW5zZXJ0TW9kZSB7XG4gIGV4ZWN1dGUgKCkge1xuICAgIGNvbnN0IGN1cnNvcnNUb01vdmVSaWdodCA9IHRoaXMuZWRpdG9yLmdldEN1cnNvcnMoKS5maWx0ZXIoY3Vyc29yID0+ICFjdXJzb3IuaXNBdEJlZ2lubmluZ09mTGluZSgpKVxuICAgIHRoaXMudmltU3RhdGUuYWN0aXZhdGUoJ25vcm1hbCcpXG4gICAgZm9yIChjb25zdCBjdXJzb3Igb2YgY3Vyc29yc1RvTW92ZVJpZ2h0KSB7XG4gICAgICB0aGlzLnV0aWxzLm1vdmVDdXJzb3JSaWdodChjdXJzb3IpXG4gICAgfVxuXG4gICAgY29uc3QgZGlzcG9zYWJsZSA9IGF0b20uY29tbWFuZHMub25EaWREaXNwYXRjaChldmVudCA9PiB7XG4gICAgICBpZiAoZXZlbnQudHlwZSAhPT0gdGhpcy5nZXRDb21tYW5kTmFtZSgpKSB7XG4gICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpXG4gICAgICAgIHRoaXMudmltU3RhdGUuYWN0aXZhdGUoJ2luc2VydCcpXG4gICAgICB9XG4gICAgfSlcbiAgfVxufVxuXG5jbGFzcyBUb2dnbGVSZXBsYWNlTW9kZSBleHRlbmRzIE1pc2NDb21tYW5kIHtcbiAgZXhlY3V0ZSAoKSB7XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gJ2luc2VydCcpIHtcbiAgICAgIGlmICh0aGlzLnN1Ym1vZGUgPT09ICdyZXBsYWNlJykge1xuICAgICAgICB0aGlzLnZpbVN0YXRlLm9wZXJhdGlvblN0YWNrLnJ1bk5leHQoJ0FjdGl2YXRlSW5zZXJ0TW9kZScpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnZpbVN0YXRlLm9wZXJhdGlvblN0YWNrLnJ1bk5leHQoJ0FjdGl2YXRlUmVwbGFjZU1vZGUnKVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBJbnNlcnRSZWdpc3RlciBleHRlbmRzIEluc2VydE1vZGUge1xuICBhc3luYyBleGVjdXRlICgpIHtcbiAgICBjb25zdCBpbnB1dCA9IGF3YWl0IHRoaXMucmVhZENoYXJQcm9taXNlZCgpXG4gICAgaWYgKGlucHV0KSB7XG4gICAgICB0aGlzLmVkaXRvci50cmFuc2FjdCgoKSA9PiB7XG4gICAgICAgIGZvciAoY29uc3Qgc2VsZWN0aW9uIG9mIHRoaXMuZWRpdG9yLmdldFNlbGVjdGlvbnMoKSkge1xuICAgICAgICAgIHNlbGVjdGlvbi5pbnNlcnRUZXh0KHRoaXMudmltU3RhdGUucmVnaXN0ZXIuZ2V0VGV4dChpbnB1dCwgc2VsZWN0aW9uKSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgSW5zZXJ0TGFzdEluc2VydGVkIGV4dGVuZHMgSW5zZXJ0TW9kZSB7XG4gIGV4ZWN1dGUgKCkge1xuICAgIHRoaXMuZWRpdG9yLmluc2VydFRleHQodGhpcy52aW1TdGF0ZS5yZWdpc3Rlci5nZXRUZXh0KCcuJykpXG4gIH1cbn1cblxuY2xhc3MgQ29weUZyb21MaW5lQWJvdmUgZXh0ZW5kcyBJbnNlcnRNb2RlIHtcbiAgcm93RGVsdGEgPSAtMVxuXG4gIGV4ZWN1dGUgKCkge1xuICAgIGNvbnN0IHRyYW5zbGF0aW9uID0gW3RoaXMucm93RGVsdGEsIDBdXG4gICAgdGhpcy5lZGl0b3IudHJhbnNhY3QoKCkgPT4ge1xuICAgICAgZm9yIChjb25zdCBzZWxlY3Rpb24gb2YgdGhpcy5lZGl0b3IuZ2V0U2VsZWN0aW9ucygpKSB7XG4gICAgICAgIGNvbnN0IHBvaW50ID0gc2VsZWN0aW9uLmN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpLnRyYW5zbGF0ZSh0cmFuc2xhdGlvbilcbiAgICAgICAgaWYgKHBvaW50LnJvdyA+PSAwKSB7XG4gICAgICAgICAgY29uc3QgcmFuZ2UgPSBSYW5nZS5mcm9tUG9pbnRXaXRoRGVsdGEocG9pbnQsIDAsIDEpXG4gICAgICAgICAgY29uc3QgdGV4dCA9IHRoaXMuZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlKVxuICAgICAgICAgIGlmICh0ZXh0KSBzZWxlY3Rpb24uaW5zZXJ0VGV4dCh0ZXh0KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgfVxufVxuXG5jbGFzcyBDb3B5RnJvbUxpbmVCZWxvdyBleHRlbmRzIENvcHlGcm9tTGluZUFib3ZlIHtcbiAgcm93RGVsdGEgPSArMVxufVxuXG5jbGFzcyBOZXh0VGFiIGV4dGVuZHMgTWlzY0NvbW1hbmQge1xuICBleGVjdXRlICgpIHtcbiAgICBjb25zdCBwYW5lID0gYXRvbS53b3Jrc3BhY2UucGFuZUZvckl0ZW0odGhpcy5lZGl0b3IpXG5cbiAgICBpZiAodGhpcy5oYXNDb3VudCgpKSB7XG4gICAgICBwYW5lLmFjdGl2YXRlSXRlbUF0SW5kZXgodGhpcy5nZXRDb3VudCgpIC0gMSlcbiAgICB9IGVsc2Uge1xuICAgICAgcGFuZS5hY3RpdmF0ZU5leHRJdGVtKClcbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgUHJldmlvdXNUYWIgZXh0ZW5kcyBNaXNjQ29tbWFuZCB7XG4gIGV4ZWN1dGUgKCkge1xuICAgIGF0b20ud29ya3NwYWNlLnBhbmVGb3JJdGVtKHRoaXMuZWRpdG9yKS5hY3RpdmF0ZVByZXZpb3VzSXRlbSgpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIE1pc2NDb21tYW5kLFxuICBNYXJrLFxuICBSZXZlcnNlU2VsZWN0aW9ucyxcbiAgQmxvY2t3aXNlT3RoZXJFbmQsXG4gIFVuZG8sXG4gIFJlZG8sXG4gIEZvbGRDdXJyZW50Um93LFxuICBVbmZvbGRDdXJyZW50Um93LFxuICBUb2dnbGVGb2xkLFxuICBGb2xkQ3VycmVudFJvd1JlY3Vyc2l2ZWx5QmFzZSxcbiAgRm9sZEN1cnJlbnRSb3dSZWN1cnNpdmVseSxcbiAgVW5mb2xkQ3VycmVudFJvd1JlY3Vyc2l2ZWx5LFxuICBUb2dnbGVGb2xkUmVjdXJzaXZlbHksXG4gIFVuZm9sZEFsbCxcbiAgRm9sZEFsbCxcbiAgVW5mb2xkTmV4dEluZGVudExldmVsLFxuICBGb2xkTmV4dEluZGVudExldmVsLFxuICBNaW5pU2Nyb2xsRG93bixcbiAgTWluaVNjcm9sbFVwLFxuICBSZWRyYXdDdXJzb3JMaW5lLFxuICBSZWRyYXdDdXJzb3JMaW5lQXRUb3AsXG4gIFJlZHJhd0N1cnNvckxpbmVBdFRvcEFuZE1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lLFxuICBSZWRyYXdDdXJzb3JMaW5lQXRVcHBlck1pZGRsZSxcbiAgUmVkcmF3Q3Vyc29yTGluZUF0VXBwZXJNaWRkbGVBbmRNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSxcbiAgUmVkcmF3Q3Vyc29yTGluZUF0TWlkZGxlLFxuICBSZWRyYXdDdXJzb3JMaW5lQXRNaWRkbGVBbmRNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSxcbiAgUmVkcmF3Q3Vyc29yTGluZUF0Qm90dG9tLFxuICBSZWRyYXdDdXJzb3JMaW5lQXRCb3R0b21BbmRNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSxcbiAgU2Nyb2xsQ3Vyc29yVG9MZWZ0LFxuICBTY3JvbGxDdXJzb3JUb1JpZ2h0LFxuICBBY3RpdmF0ZU5vcm1hbE1vZGVPbmNlLFxuICBUb2dnbGVSZXBsYWNlTW9kZSxcbiAgSW5zZXJ0UmVnaXN0ZXIsXG4gIEluc2VydExhc3RJbnNlcnRlZCxcbiAgQ29weUZyb21MaW5lQWJvdmUsXG4gIENvcHlGcm9tTGluZUJlbG93LFxuICBOZXh0VGFiLFxuICBQcmV2aW91c1RhYlxufVxuIl19