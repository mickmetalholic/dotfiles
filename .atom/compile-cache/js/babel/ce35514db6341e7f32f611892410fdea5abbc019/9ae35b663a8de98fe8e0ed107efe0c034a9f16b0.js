'use babel';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('atom');

var Range = _require.Range;
var Point = _require.Point;

// [TODO] Need overhaul
//  - [ ] Make expandable by selection.getBufferRange().union(this.getRange(selection))
//  - [ ] Count support(priority low)?
var Base = require('./base');
var PairFinder = require('./pair-finder');

var TextObject = (function (_Base) {
  _inherits(TextObject, _Base);

  function TextObject() {
    _classCallCheck(this, TextObject);

    _get(Object.getPrototypeOf(TextObject.prototype), 'constructor', this).apply(this, arguments);

    this.operator = null;
    this.wise = 'characterwise';
    this.supportCount = false;
    this.selectOnce = false;
    this.selectSucceeded = false;
  }

  // Section: Word
  // =========================

  _createClass(TextObject, [{
    key: 'isInner',
    value: function isInner() {
      return this.inner;
    }
  }, {
    key: 'isA',
    value: function isA() {
      return !this.inner;
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
      return this.wise = wise; // FIXME currently not well supported
    }
  }, {
    key: 'resetState',
    value: function resetState() {
      this.selectSucceeded = false;
    }

    // execute: Called from Operator::selectTarget()
    //  - `v i p`, is `VisualModeSelect` operator with @target = `InnerParagraph`.
    //  - `d i p`, is `Delete` operator with @target = `InnerParagraph`.
  }, {
    key: 'execute',
    value: function execute() {
      // Whennever TextObject is executed, it has @operator
      if (!this.operator) throw new Error('in TextObject: Must not happen');
      this.select();
    }
  }, {
    key: 'select',
    value: function select() {
      var _this = this;

      if (this.isMode('visual', 'blockwise')) {
        this.swrap.normalize(this.editor);
      }

      this.countTimes(this.getCount(), function (_ref2) {
        var stop = _ref2.stop;

        if (!_this.supportCount) stop(); // quick-fix for #560

        for (var selection of _this.editor.getSelections()) {
          var oldRange = selection.getBufferRange();
          if (_this.selectTextObject(selection)) _this.selectSucceeded = true;
          if (selection.getBufferRange().isEqual(oldRange)) stop();
          if (_this.selectOnce) break;
        }
      });

      this.editor.mergeIntersectingSelections();
      // Some TextObject's wise is NOT deterministic. It has to be detected from selected range.
      if (this.wise == null) this.wise = this.swrap.detectWise(this.editor);

      if (this.operator['instanceof']('SelectBase')) {
        if (this.selectSucceeded) {
          if (this.wise === 'characterwise') {
            this.swrap.saveProperties(this.editor, { force: true });
          } else if (this.wise === 'linewise') {
            // When target is persistent-selection, new selection is added after selectTextObject.
            // So we have to assure all selection have selction property.
            // Maybe this logic can be moved to operation stack.
            for (var $selection of this.swrap.getSelections(this.editor)) {
              if (this.getConfig('stayOnSelectTextObject')) {
                if (!$selection.hasProperties()) {
                  $selection.saveProperties();
                }
              } else {
                $selection.saveProperties();
              }
              $selection.fixPropertyRowToRowRange();
            }
          }
        }

        if (this.submode === 'blockwise') {
          for (var $selection of this.swrap.getSelections(this.editor)) {
            $selection.normalize();
            $selection.applyWise('blockwise');
          }
        }
      }
    }

    // Return true or false
  }, {
    key: 'selectTextObject',
    value: function selectTextObject(selection) {
      var range = this.getRange(selection);
      if (range) {
        this.swrap(selection).setBufferRange(range);
        return true;
      } else {
        return false;
      }
    }

    // to override
  }, {
    key: 'getRange',
    value: function getRange(selection) {}
  }], [{
    key: 'deriveClass',
    value: function deriveClass(innerAndA, innerAndAForAllowForwarding) {
      this.command = false; // HACK: klass to derive child class is not command
      var store = {};
      if (innerAndA) {
        var klassA = this.generateClass(false);
        var klassI = this.generateClass(true);
        store[klassA.name] = klassA;
        store[klassI.name] = klassI;
      }
      if (innerAndAForAllowForwarding) {
        var klassA = this.generateClass(false, true);
        var klassI = this.generateClass(true, true);
        store[klassA.name] = klassA;
        store[klassI.name] = klassI;
      }
      return store;
    }
  }, {
    key: 'generateClass',
    value: function generateClass(inner, allowForwarding) {
      var name = (inner ? 'Inner' : 'A') + this.name;
      if (allowForwarding) {
        name += 'AllowForwarding';
      }

      return (function (_ref) {
        _inherits(_class, _ref);

        _createClass(_class, null, [{
          key: 'name',
          value: name,
          enumerable: true
        }]);

        function _class(vimState) {
          _classCallCheck(this, _class);

          _get(Object.getPrototypeOf(_class.prototype), 'constructor', this).call(this, vimState);
          this.inner = inner;
          if (allowForwarding != null) {
            this.allowForwarding = allowForwarding;
          }
        }

        return _class;
      })(this);
    }
  }, {
    key: 'operationKind',
    value: 'text-object',
    enumerable: true
  }, {
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return TextObject;
})(Base);

var Word = (function (_TextObject) {
  _inherits(Word, _TextObject);

  function Word() {
    _classCallCheck(this, Word);

    _get(Object.getPrototypeOf(Word.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(Word, [{
    key: 'getRange',
    value: function getRange(selection) {
      var point = this.getCursorPositionForSelection(selection);

      var _getWordBufferRangeAndKindAtBufferPosition = this.getWordBufferRangeAndKindAtBufferPosition(point, { wordRegex: this.wordRegex });

      var range = _getWordBufferRangeAndKindAtBufferPosition.range;

      return this.isA() ? this.utils.expandRangeToWhiteSpaces(this.editor, range) : range;
    }
  }]);

  return Word;
})(TextObject);

var WholeWord = (function (_Word) {
  _inherits(WholeWord, _Word);

  function WholeWord() {
    _classCallCheck(this, WholeWord);

    _get(Object.getPrototypeOf(WholeWord.prototype), 'constructor', this).apply(this, arguments);

    this.wordRegex = /\S+/;
  }

  // Just include _, -
  return WholeWord;
})(Word);

var SmartWord = (function (_Word2) {
  _inherits(SmartWord, _Word2);

  function SmartWord() {
    _classCallCheck(this, SmartWord);

    _get(Object.getPrototypeOf(SmartWord.prototype), 'constructor', this).apply(this, arguments);

    this.wordRegex = /[\w-]+/;
  }

  // Just include _, -
  return SmartWord;
})(Word);

var Subword = (function (_Word3) {
  _inherits(Subword, _Word3);

  function Subword() {
    _classCallCheck(this, Subword);

    _get(Object.getPrototypeOf(Subword.prototype), 'constructor', this).apply(this, arguments);
  }

  // Section: Pair
  // =========================

  _createClass(Subword, [{
    key: 'getRange',
    value: function getRange(selection) {
      this.wordRegex = selection.cursor.subwordRegExp();
      return _get(Object.getPrototypeOf(Subword.prototype), 'getRange', this).call(this, selection);
    }
  }]);

  return Subword;
})(Word);

var Pair = (function (_TextObject2) {
  _inherits(Pair, _TextObject2);

  function Pair() {
    _classCallCheck(this, Pair);

    _get(Object.getPrototypeOf(Pair.prototype), 'constructor', this).apply(this, arguments);

    this.supportCount = true;
    this.allowNextLine = null;
    this.adjustInnerRange = true;
    this.pair = null;
    this.inclusive = true;
  }

  // Used by DeleteSurround

  _createClass(Pair, [{
    key: 'isAllowNextLine',
    value: function isAllowNextLine() {
      if (this.allowNextLine != null) {
        return this.allowNextLine;
      } else {
        return this.pair && this.pair[0] !== this.pair[1];
      }
    }
  }, {
    key: 'adjustRange',
    value: function adjustRange(_ref3) {
      var start = _ref3.start;
      var end = _ref3.end;

      // Dirty work to feel natural for human, to behave compatible with pure Vim.
      // Where this adjustment appear is in following situation.
      // op-1: `ci{` replace only 2nd line
      // op-2: `di{` delete only 2nd line.
      // text:
      //  {
      //    aaa
      //  }
      if (this.utils.pointIsAtEndOfLine(this.editor, start)) {
        start = start.traverse([1, 0]);
      }

      if (this.utils.getLineTextToBufferPosition(this.editor, end).match(/^\s*$/)) {
        if (this.mode === 'visual') {
          // This is slightly innconsistent with regular Vim
          // - regular Vim: select new line after EOL
          // - vim-mode-plus: select to EOL(before new line)
          // This is intentional since to make submode `characterwise` when auto-detect submode
          // innerEnd = new Point(innerEnd.row - 1, Infinity)
          end = new Point(end.row - 1, Infinity);
        } else {
          end = new Point(end.row, 0);
        }
      }
      return new Range(start, end);
    }
  }, {
    key: 'getFinder',
    value: function getFinder() {
      var finderName = this.pair[0] === this.pair[1] ? 'QuoteFinder' : 'BracketFinder';
      return new PairFinder[finderName](this.editor, {
        allowNextLine: this.isAllowNextLine(),
        allowForwarding: this.allowForwarding,
        pair: this.pair,
        inclusive: this.inclusive
      });
    }
  }, {
    key: 'getPairInfo',
    value: function getPairInfo(from) {
      var pairInfo = this.getFinder().find(from);
      if (pairInfo) {
        if (this.adjustInnerRange) {
          pairInfo.innerRange = this.adjustRange(pairInfo.innerRange);
        }
        pairInfo.targetRange = this.isInner() ? pairInfo.innerRange : pairInfo.aRange;
        return pairInfo;
      }
    }
  }, {
    key: 'getRange',
    value: function getRange(selection) {
      var originalRange = selection.getBufferRange();
      var pairInfo = this.getPairInfo(this.getCursorPositionForSelection(selection));
      // When range was same, try to expand range
      if (pairInfo && pairInfo.targetRange.isEqual(originalRange)) {
        pairInfo = this.getPairInfo(pairInfo.aRange.end);
      }
      if (pairInfo) {
        return pairInfo.targetRange;
      }
    }
  }], [{
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return Pair;
})(TextObject);

var APair = (function (_Pair) {
  _inherits(APair, _Pair);

  function APair() {
    _classCallCheck(this, APair);

    _get(Object.getPrototypeOf(APair.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(APair, null, [{
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return APair;
})(Pair);

var AnyPair = (function (_Pair2) {
  _inherits(AnyPair, _Pair2);

  function AnyPair() {
    _classCallCheck(this, AnyPair);

    _get(Object.getPrototypeOf(AnyPair.prototype), 'constructor', this).apply(this, arguments);

    this.allowForwarding = false;
    this.member = ['DoubleQuote', 'SingleQuote', 'BackTick', 'CurlyBracket', 'AngleBracket', 'SquareBracket', 'Parenthesis'];
  }

  _createClass(AnyPair, [{
    key: 'getRanges',
    value: function getRanges(selection) {
      var _this2 = this;

      var options = {
        inner: this.inner,
        allowForwarding: this.allowForwarding,
        inclusive: this.inclusive
      };
      var getRangeByMember = function getRangeByMember(member) {
        return _this2.getInstance(member, options).getRange(selection);
      };
      return this.member.map(getRangeByMember).filter(function (v) {
        return v;
      });
    }
  }, {
    key: 'getRange',
    value: function getRange(selection) {
      return this.utils.sortRanges(this.getRanges(selection)).pop();
    }
  }]);

  return AnyPair;
})(Pair);

var AnyPairAllowForwarding = (function (_AnyPair) {
  _inherits(AnyPairAllowForwarding, _AnyPair);

  function AnyPairAllowForwarding() {
    _classCallCheck(this, AnyPairAllowForwarding);

    _get(Object.getPrototypeOf(AnyPairAllowForwarding.prototype), 'constructor', this).apply(this, arguments);

    this.allowForwarding = true;
  }

  _createClass(AnyPairAllowForwarding, [{
    key: 'getRange',
    value: function getRange(selection) {
      var ranges = this.getRanges(selection);
      var from = selection.cursor.getBufferPosition();

      var _$partition = this._.partition(ranges, function (range) {
        return range.start.isGreaterThanOrEqual(from);
      });

      var _$partition2 = _slicedToArray(_$partition, 2);

      var forwardingRanges = _$partition2[0];
      var enclosingRanges = _$partition2[1];

      var enclosingRange = this.utils.sortRanges(enclosingRanges).pop();
      forwardingRanges = this.utils.sortRanges(forwardingRanges);

      // When enclosingRange is exists,
      // We don't go across enclosingRange.end.
      // So choose from ranges contained in enclosingRange.
      if (enclosingRange) {
        forwardingRanges = forwardingRanges.filter(function (range) {
          return enclosingRange.containsRange(range);
        });
      }

      return forwardingRanges[0] || enclosingRange;
    }
  }]);

  return AnyPairAllowForwarding;
})(AnyPair);

var AnyQuote = (function (_AnyPair2) {
  _inherits(AnyQuote, _AnyPair2);

  function AnyQuote() {
    _classCallCheck(this, AnyQuote);

    _get(Object.getPrototypeOf(AnyQuote.prototype), 'constructor', this).apply(this, arguments);

    this.allowForwarding = true;
    this.member = ['DoubleQuote', 'SingleQuote', 'BackTick'];
  }

  _createClass(AnyQuote, [{
    key: 'getRange',
    value: function getRange(selection) {
      // Pick range which end.colum is leftmost(mean, closed first)
      return this.getRanges(selection).sort(function (a, b) {
        return a.end.column - b.end.column;
      })[0];
    }
  }]);

  return AnyQuote;
})(AnyPair);

var Quote = (function (_Pair3) {
  _inherits(Quote, _Pair3);

  function Quote() {
    _classCallCheck(this, Quote);

    _get(Object.getPrototypeOf(Quote.prototype), 'constructor', this).apply(this, arguments);

    this.allowForwarding = true;
  }

  _createClass(Quote, null, [{
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return Quote;
})(Pair);

var DoubleQuote = (function (_Quote) {
  _inherits(DoubleQuote, _Quote);

  function DoubleQuote() {
    _classCallCheck(this, DoubleQuote);

    _get(Object.getPrototypeOf(DoubleQuote.prototype), 'constructor', this).apply(this, arguments);

    this.pair = ['"', '"'];
  }

  return DoubleQuote;
})(Quote);

var SingleQuote = (function (_Quote2) {
  _inherits(SingleQuote, _Quote2);

  function SingleQuote() {
    _classCallCheck(this, SingleQuote);

    _get(Object.getPrototypeOf(SingleQuote.prototype), 'constructor', this).apply(this, arguments);

    this.pair = ["'", "'"];
  }

  return SingleQuote;
})(Quote);

var BackTick = (function (_Quote3) {
  _inherits(BackTick, _Quote3);

  function BackTick() {
    _classCallCheck(this, BackTick);

    _get(Object.getPrototypeOf(BackTick.prototype), 'constructor', this).apply(this, arguments);

    this.pair = ['`', '`'];
  }

  return BackTick;
})(Quote);

var CurlyBracket = (function (_Pair4) {
  _inherits(CurlyBracket, _Pair4);

  function CurlyBracket() {
    _classCallCheck(this, CurlyBracket);

    _get(Object.getPrototypeOf(CurlyBracket.prototype), 'constructor', this).apply(this, arguments);

    this.pair = ['{', '}'];
  }

  return CurlyBracket;
})(Pair);

var SquareBracket = (function (_Pair5) {
  _inherits(SquareBracket, _Pair5);

  function SquareBracket() {
    _classCallCheck(this, SquareBracket);

    _get(Object.getPrototypeOf(SquareBracket.prototype), 'constructor', this).apply(this, arguments);

    this.pair = ['[', ']'];
  }

  return SquareBracket;
})(Pair);

var Parenthesis = (function (_Pair6) {
  _inherits(Parenthesis, _Pair6);

  function Parenthesis() {
    _classCallCheck(this, Parenthesis);

    _get(Object.getPrototypeOf(Parenthesis.prototype), 'constructor', this).apply(this, arguments);

    this.pair = ['(', ')'];
  }

  return Parenthesis;
})(Pair);

var AngleBracket = (function (_Pair7) {
  _inherits(AngleBracket, _Pair7);

  function AngleBracket() {
    _classCallCheck(this, AngleBracket);

    _get(Object.getPrototypeOf(AngleBracket.prototype), 'constructor', this).apply(this, arguments);

    this.pair = ['<', '>'];
  }

  return AngleBracket;
})(Pair);

var Tag = (function (_Pair8) {
  _inherits(Tag, _Pair8);

  function Tag() {
    _classCallCheck(this, Tag);

    _get(Object.getPrototypeOf(Tag.prototype), 'constructor', this).apply(this, arguments);

    this.allowNextLine = true;
    this.allowForwarding = true;
    this.adjustInnerRange = false;
  }

  // Section: Paragraph
  // =========================
  // Paragraph is defined as consecutive (non-)blank-line.

  _createClass(Tag, [{
    key: 'getTagStartPoint',
    value: function getTagStartPoint(from) {
      var regex = PairFinder.TagFinder.pattern;
      var options = { from: [from.row, 0] };
      return this.findInEditor('forward', regex, options, function (_ref4) {
        var range = _ref4.range;
        return range.containsPoint(from, true) && range.start;
      });
    }
  }, {
    key: 'getFinder',
    value: function getFinder() {
      return new PairFinder.TagFinder(this.editor, {
        allowNextLine: this.isAllowNextLine(),
        allowForwarding: this.allowForwarding,
        inclusive: this.inclusive
      });
    }
  }, {
    key: 'getPairInfo',
    value: function getPairInfo(from) {
      return _get(Object.getPrototypeOf(Tag.prototype), 'getPairInfo', this).call(this, this.getTagStartPoint(from) || from);
    }
  }]);

  return Tag;
})(Pair);

var Paragraph = (function (_TextObject3) {
  _inherits(Paragraph, _TextObject3);

  function Paragraph() {
    _classCallCheck(this, Paragraph);

    _get(Object.getPrototypeOf(Paragraph.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'linewise';
    this.supportCount = true;
  }

  _createClass(Paragraph, [{
    key: 'findRow',
    value: function findRow(fromRow, direction, fn) {
      if (fn.reset) fn.reset();
      var foundRow = fromRow;
      for (var row of this.getBufferRows({ startRow: fromRow, direction: direction })) {
        if (!fn(row, direction)) break;
        foundRow = row;
      }
      return foundRow;
    }
  }, {
    key: 'findRowRangeBy',
    value: function findRowRangeBy(fromRow, fn) {
      var startRow = this.findRow(fromRow, 'previous', fn);
      var endRow = this.findRow(fromRow, 'next', fn);
      return [startRow, endRow];
    }
  }, {
    key: 'getPredictFunction',
    value: function getPredictFunction(fromRow, selection) {
      var _this3 = this;

      var fromRowResult = this.editor.isBufferRowBlank(fromRow);

      if (this.isInner()) {
        return function (row, direction) {
          return _this3.editor.isBufferRowBlank(row) === fromRowResult;
        };
      } else {
        var _ret = (function () {
          var directionToExtend = selection.isReversed() ? 'previous' : 'next';

          var flip = false;
          var predict = function predict(row, direction) {
            var result = _this3.editor.isBufferRowBlank(row) === fromRowResult;
            if (flip) {
              return !result;
            } else {
              if (!result && direction === directionToExtend) {
                return flip = true;
              }
              return result;
            }
          };
          predict.reset = function () {
            return flip = false;
          };
          return {
            v: predict
          };
        })();

        if (typeof _ret === 'object') return _ret.v;
      }
    }
  }, {
    key: 'getRange',
    value: function getRange(selection) {
      var fromRow = this.getCursorPositionForSelection(selection).row;
      if (this.isMode('visual', 'linewise')) {
        if (selection.isReversed()) fromRow--;else fromRow++;
        fromRow = this.getValidVimBufferRow(fromRow);
      }
      var rowRange = this.findRowRangeBy(fromRow, this.getPredictFunction(fromRow, selection));
      return selection.getBufferRange().union(this.getBufferRangeForRowRange(rowRange));
    }
  }]);

  return Paragraph;
})(TextObject);

var Indentation = (function (_Paragraph) {
  _inherits(Indentation, _Paragraph);

  function Indentation() {
    _classCallCheck(this, Indentation);

    _get(Object.getPrototypeOf(Indentation.prototype), 'constructor', this).apply(this, arguments);
  }

  // Section: Comment
  // =========================

  _createClass(Indentation, [{
    key: 'getRange',
    value: function getRange(selection) {
      var _this4 = this;

      var fromRow = this.getCursorPositionForSelection(selection).row;
      var baseIndentLevel = this.editor.indentationForBufferRow(fromRow);
      var rowRange = this.findRowRangeBy(fromRow, function (row) {
        if (_this4.editor.isBufferRowBlank(row)) {
          return _this4.isA();
        } else {
          return _this4.editor.indentationForBufferRow(row) >= baseIndentLevel;
        }
      });
      return this.getBufferRangeForRowRange(rowRange);
    }
  }]);

  return Indentation;
})(Paragraph);

var Comment = (function (_TextObject4) {
  _inherits(Comment, _TextObject4);

  function Comment() {
    _classCallCheck(this, Comment);

    _get(Object.getPrototypeOf(Comment.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'linewise';
  }

  _createClass(Comment, [{
    key: 'getRange',
    value: function getRange(selection) {
      var _getCursorPositionForSelection = this.getCursorPositionForSelection(selection);

      var row = _getCursorPositionForSelection.row;

      var rowRange = this.utils.getRowRangeForCommentAtBufferRow(this.editor, row);
      if (rowRange) {
        return this.getBufferRangeForRowRange(rowRange);
      }
    }
  }]);

  return Comment;
})(TextObject);

var BlockComment = (function (_TextObject5) {
  _inherits(BlockComment, _TextObject5);

  function BlockComment() {
    _classCallCheck(this, BlockComment);

    _get(Object.getPrototypeOf(BlockComment.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'characterwise';
  }

  _createClass(BlockComment, [{
    key: 'getRange',
    value: function getRange(selection) {
      // Following one-column-right translation is necessary when cursor is "on" `/` char of beginning `/*`.
      var from = this.editor.clipBufferPosition(this.getCursorPositionForSelection(selection).translate([0, 1]));

      var range = this.getBlockCommentRangeForPoint(from);
      if (range) {
        range.start = this.getStartOfBlockComment(range.start);
        range.end = this.getEndOfBlockComment(range.end);
        var scanRange = range;

        if (this.isInner()) {
          this.scanEditor('forward', /\s+/, { scanRange: scanRange }, function (event) {
            range.start = event.range.end;
            event.stop();
          });
          this.scanEditor('backward', /\s+/, { scanRange: scanRange }, function (event) {
            range.end = event.range.start;
            event.stop();
          });
        }
        return range;
      }
    }
  }, {
    key: 'getStartOfBlockComment',
    value: function getStartOfBlockComment(start) {
      while (start.column === 0) {
        var range = this.getBlockCommentRangeForPoint(start.translate([-1, Infinity]));
        if (!range) break;
        start = range.start;
      }
      return start;
    }
  }, {
    key: 'getEndOfBlockComment',
    value: function getEndOfBlockComment(end) {
      while (this.utils.pointIsAtEndOfLine(this.editor, end)) {
        var range = this.getBlockCommentRangeForPoint([end.row + 1, 0]);
        if (!range) break;
        end = range.end;
      }
      return end;
    }
  }, {
    key: 'getBlockCommentRangeForPoint',
    value: function getBlockCommentRangeForPoint(point) {
      var scope = 'comment.block';
      return this.editor.bufferRangeForScopeAtPosition(scope, point);
    }
  }]);

  return BlockComment;
})(TextObject);

var CommentOrParagraph = (function (_TextObject6) {
  _inherits(CommentOrParagraph, _TextObject6);

  function CommentOrParagraph() {
    _classCallCheck(this, CommentOrParagraph);

    _get(Object.getPrototypeOf(CommentOrParagraph.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'linewise';
  }

  // Section: Fold
  // =========================

  _createClass(CommentOrParagraph, [{
    key: 'getRange',
    value: function getRange(selection) {
      var inner = this.inner;

      for (var klass of ['Comment', 'Paragraph']) {
        var range = this.getInstance(klass, { inner: inner }).getRange(selection);
        if (range) {
          return range;
        }
      }
    }
  }]);

  return CommentOrParagraph;
})(TextObject);

var Fold = (function (_TextObject7) {
  _inherits(Fold, _TextObject7);

  function Fold() {
    _classCallCheck(this, Fold);

    _get(Object.getPrototypeOf(Fold.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'linewise';
  }

  _createClass(Fold, [{
    key: 'getRange',
    value: function getRange(selection) {
      var _getCursorPositionForSelection2 = this.getCursorPositionForSelection(selection);

      var row = _getCursorPositionForSelection2.row;

      var selectedRange = selection.getBufferRange();
      var foldRanges = this.utils.getCodeFoldRanges(this.editor);
      var foldRangesContainsCursorRow = foldRanges.filter(function (range) {
        return range.start.row <= row && row <= range.end.row;
      });
      var useTreeSitter = this.utils.isUsingTreeSitter(selection.editor);

      for (var foldRange of foldRangesContainsCursorRow.reverse()) {
        if (this.isA()) {
          foldRange = unionConjoinedFoldRange(foldRange, foldRanges, { useTreeSitter: useTreeSitter });
        } else {
          if (this.utils.doesRangeStartAndEndWithSameIndentLevel(this.editor, foldRange)) {
            foldRange.end.row -= 1;
          }
          foldRange.start.row += 1;
        }
        foldRange = this.getBufferRangeForRowRange([foldRange.start.row, foldRange.end.row]);
        if (!selectedRange.containsRange(foldRange)) {
          return foldRange;
        }
      }
    }
  }]);

  return Fold;
})(TextObject);

function unionConjoinedFoldRange(foldRange, foldRanges, _ref5) {
  var useTreeSitter = _ref5.useTreeSitter;

  var index = foldRanges.findIndex(function (range) {
    return range === foldRange;
  });

  // Extend to downwards
  for (var i = index + 1; i < foldRanges.length; i++) {
    if (foldRange.end.column !== Infinity) break;
    var endRow = useTreeSitter ? foldRange.end.row + 1 : foldRange.end.row;
    if (foldRanges[i].start.isEqual([endRow, Infinity])) {
      foldRange = foldRange.union(foldRanges[i]);
    }
  }

  // Extend to upwards
  for (var i = index - 1; i >= 0; i--) {
    if (foldRange.start.column !== Infinity) break;
    var startRow = useTreeSitter ? foldRange.start.row - 1 : foldRange.start.row;
    if (foldRanges[i].end.isEqual([startRow, Infinity])) {
      foldRange = foldRange.union(foldRanges[i]);
    }
  }

  return foldRange;
}

var Function = (function (_TextObject8) {
  _inherits(Function, _TextObject8);

  function Function() {
    _classCallCheck(this, Function);

    _get(Object.getPrototypeOf(Function.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'linewise';
    this.scopeNamesOmittingClosingBrace = ['source.go', 'source.elixir'];
  }

  // Section: Other
  // =========================

  _createClass(Function, [{
    key: 'getFunctionBodyStartRegex',
    // language doesn't include closing `}` into fold.

    value: function getFunctionBodyStartRegex(_ref6) {
      var scopeName = _ref6.scopeName;

      if (scopeName === 'source.python') {
        return (/:$/
        );
      } else if (scopeName === 'source.coffee') {
        return (/-|=>$/
        );
      } else {
        return (/{$/
        );
      }
    }
  }, {
    key: 'isMultiLineParameterFunctionRange',
    value: function isMultiLineParameterFunctionRange(parameterRange, bodyRange, bodyStartRegex) {
      var _this5 = this;

      var isBodyStartRow = function isBodyStartRow(row) {
        return bodyStartRegex.test(_this5.editor.lineTextForBufferRow(row));
      };
      if (isBodyStartRow(parameterRange.start.row)) return false;
      if (isBodyStartRow(parameterRange.end.row)) return parameterRange.end.row === bodyRange.start.row;
      if (isBodyStartRow(parameterRange.end.row + 1)) return parameterRange.end.row + 1 === bodyRange.start.row;
      return false;
    }
  }, {
    key: 'getRangeWithTreeSitter',
    value: function getRangeWithTreeSitter(selection) {
      var editor = this.editor;
      var cursorPosition = this.getCursorPositionForSelection(selection);
      var firstCharacterPosition = this.utils.getFirstCharacterPositionForBufferRow(this.editor, cursorPosition.row);
      var searchStartPoint = Point.max(firstCharacterPosition, cursorPosition);
      var startNode = editor.languageMode.getSyntaxNodeAtPosition(searchStartPoint);

      var node = this.utils.findParentNodeForFunctionType(editor, startNode);
      if (node) {
        var range = node.range;

        if (!this.isA()) {
          var bodyNode = this.utils.findFunctionBodyNode(editor, node);
          if (bodyNode) {
            range = bodyNode.range;
          }

          var endRowTranslation = this.utils.doesRangeStartAndEndWithSameIndentLevel(editor, range) ? -1 : 0;
          range = range.translate([1, 0], [endRowTranslation, 0]);
        }
        if (range.end.column !== 0) {
          // The 'preproc_function_def' type used in C and C++ header's "#define" returns linewise range.
          // In this case, we shouldn't translate to linewise since it already contains ending newline.
          range = this.utils.getBufferRangeForRowRange(editor, [range.start.row, range.end.row]);
        }
        return range;
      }
    }
  }, {
    key: 'getRange',
    value: function getRange(selection) {
      var _this6 = this;

      var useTreeSitter = this.utils.isUsingTreeSitter(selection.editor);
      if (useTreeSitter) {
        return this.getRangeWithTreeSitter(selection);
      }

      var editor = this.editor;
      var cursorRow = this.getCursorPositionForSelection(selection).row;
      var bodyStartRegex = this.getFunctionBodyStartRegex(editor.getGrammar());
      var isIncludeFunctionScopeForRow = function isIncludeFunctionScopeForRow(row) {
        return _this6.utils.isIncludeFunctionScopeForRow(editor, row);
      };

      var functionRanges = [];
      var saveFunctionRange = function saveFunctionRange(_ref7) {
        var aRange = _ref7.aRange;
        var innerRange = _ref7.innerRange;

        functionRanges.push({
          aRange: _this6.buildARange(aRange),
          innerRange: _this6.buildInnerRange(innerRange)
        });
      };

      var foldRanges = this.utils.getCodeFoldRanges(editor);
      while (foldRanges.length) {
        var range = foldRanges.shift();
        if (isIncludeFunctionScopeForRow(range.start.row)) {
          var nextRange = foldRanges[0];
          var nextFoldIsConnected = nextRange && nextRange.start.row <= range.end.row + 1;
          var maybeAFunctionRange = nextFoldIsConnected ? range.union(nextRange) : range;
          if (!maybeAFunctionRange.containsPoint([cursorRow, Infinity])) continue; // skip to avoid heavy computation
          if (nextFoldIsConnected && this.isMultiLineParameterFunctionRange(range, nextRange, bodyStartRegex)) {
            var bodyRange = foldRanges.shift();
            saveFunctionRange({ aRange: range.union(bodyRange), innerRange: bodyRange });
          } else {
            saveFunctionRange({ aRange: range, innerRange: range });
          }
        } else {
          var previousRow = range.start.row - 1;
          if (previousRow < 0) continue;
          if (editor.isFoldableAtBufferRow(previousRow)) continue;
          var maybeAFunctionRange = range.union(editor.bufferRangeForBufferRow(previousRow));
          if (!maybeAFunctionRange.containsPoint([cursorRow, Infinity])) continue; // skip to avoid heavy computation

          var isBodyStartOnlyRow = function isBodyStartOnlyRow(row) {
            return new RegExp('^\\s*' + bodyStartRegex.source).test(editor.lineTextForBufferRow(row));
          };
          if (isBodyStartOnlyRow(range.start.row) && isIncludeFunctionScopeForRow(previousRow)) {
            saveFunctionRange({ aRange: maybeAFunctionRange, innerRange: range });
          }
        }
      }

      for (var functionRange of functionRanges.reverse()) {
        var _ref8 = this.isA() ? functionRange.aRange : functionRange.innerRange;

        var start = _ref8.start;
        var end = _ref8.end;

        var range = this.getBufferRangeForRowRange([start.row, end.row]);
        if (!selection.getBufferRange().containsRange(range)) return range;
      }
    }
  }, {
    key: 'buildInnerRange',
    value: function buildInnerRange(range) {
      var endRowTranslation = this.utils.doesRangeStartAndEndWithSameIndentLevel(this.editor, range) ? -1 : 0;
      return range.translate([1, 0], [endRowTranslation, 0]);
    }
  }, {
    key: 'buildARange',
    value: function buildARange(range) {
      // NOTE: This adjustment shoud not be necessary if language-syntax is properly defined.
      var endRowTranslation = this.isGrammarDoesNotFoldClosingRow() ? +1 : 0;
      return range.translate([0, 0], [endRowTranslation, 0]);
    }
  }, {
    key: 'isGrammarDoesNotFoldClosingRow',
    value: function isGrammarDoesNotFoldClosingRow() {
      var _editor$getGrammar = this.editor.getGrammar();

      var scopeName = _editor$getGrammar.scopeName;
      var packageName = _editor$getGrammar.packageName;

      if (this.scopeNamesOmittingClosingBrace.includes(scopeName)) {
        return true;
      } else {
        // HACK: Rust have two package `language-rust` and `atom-language-rust`
        // language-rust don't fold ending `}`, but atom-language-rust does.
        return scopeName === 'source.rust' && packageName === 'language-rust';
      }
    }
  }]);

  return Function;
})(TextObject);

var Arguments = (function (_TextObject9) {
  _inherits(Arguments, _TextObject9);

  function Arguments() {
    _classCallCheck(this, Arguments);

    _get(Object.getPrototypeOf(Arguments.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(Arguments, [{
    key: 'newArgInfo',
    value: function newArgInfo(argStart, arg, separator) {
      var argEnd = this.utils.traverseTextFromPoint(argStart, arg);
      var argRange = new Range(argStart, argEnd);

      var separatorEnd = this.utils.traverseTextFromPoint(argEnd, separator != null ? separator : '');
      var separatorRange = new Range(argEnd, separatorEnd);

      var innerRange = argRange;
      var aRange = argRange.union(separatorRange);
      return { argRange: argRange, separatorRange: separatorRange, innerRange: innerRange, aRange: aRange };
    }
  }, {
    key: 'getArgumentsRangeForSelection',
    value: function getArgumentsRangeForSelection(selection) {
      var options = {
        member: ['CurlyBracket', 'SquareBracket', 'Parenthesis'],
        inclusive: false
      };
      return this.getInstance('InnerAnyPair', options).getRange(selection);
    }
  }, {
    key: 'getRange',
    value: function getRange(selection) {
      var _utils = this.utils;
      var splitArguments = _utils.splitArguments;
      var traverseTextFromPoint = _utils.traverseTextFromPoint;
      var getLast = _utils.getLast;

      var range = this.getArgumentsRangeForSelection(selection);
      var pairRangeFound = range != null;

      range = range || this.getInstance('InnerCurrentLine').getRange(selection); // fallback
      if (!range) return;

      range = this.trimBufferRange(range);

      var text = this.editor.getTextInBufferRange(range);
      var allTokens = splitArguments(text, pairRangeFound);

      var argInfos = [];
      var argStart = range.start;

      // Skip starting separator
      if (allTokens.length && allTokens[0].type === 'separator') {
        var token = allTokens.shift();
        argStart = traverseTextFromPoint(argStart, token.text);
      }

      while (allTokens.length) {
        var token = allTokens.shift();
        if (token.type === 'argument') {
          var nextToken = allTokens.shift();
          var separator = nextToken ? nextToken.text : undefined;
          var argInfo = this.newArgInfo(argStart, token.text, separator);

          if (allTokens.length === 0 && argInfos.length) {
            argInfo.aRange = argInfo.argRange.union(getLast(argInfos).separatorRange);
          }

          argStart = argInfo.aRange.end;
          argInfos.push(argInfo);
        } else {
          throw new Error('must not happen');
        }
      }

      var point = this.getCursorPositionForSelection(selection);
      for (var _ref92 of argInfos) {
        var innerRange = _ref92.innerRange;
        var aRange = _ref92.aRange;

        if (innerRange.end.isGreaterThanOrEqual(point)) {
          return this.isInner() ? innerRange : aRange;
        }
      }
    }
  }]);

  return Arguments;
})(TextObject);

var CurrentLine = (function (_TextObject10) {
  _inherits(CurrentLine, _TextObject10);

  function CurrentLine() {
    _classCallCheck(this, CurrentLine);

    _get(Object.getPrototypeOf(CurrentLine.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(CurrentLine, [{
    key: 'getRange',
    value: function getRange(selection) {
      var _getCursorPositionForSelection3 = this.getCursorPositionForSelection(selection);

      var row = _getCursorPositionForSelection3.row;

      var range = this.editor.bufferRangeForBufferRow(row);
      return this.isA() ? range : this.trimBufferRange(range);
    }
  }]);

  return CurrentLine;
})(TextObject);

var Entire = (function (_TextObject11) {
  _inherits(Entire, _TextObject11);

  function Entire() {
    _classCallCheck(this, Entire);

    _get(Object.getPrototypeOf(Entire.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'linewise';
    this.selectOnce = true;
  }

  _createClass(Entire, [{
    key: 'getRange',
    value: function getRange(selection) {
      return this.editor.buffer.getRange();
    }
  }]);

  return Entire;
})(TextObject);

var Empty = (function (_TextObject12) {
  _inherits(Empty, _TextObject12);

  function Empty() {
    _classCallCheck(this, Empty);

    _get(Object.getPrototypeOf(Empty.prototype), 'constructor', this).apply(this, arguments);

    this.selectOnce = true;
  }

  _createClass(Empty, null, [{
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return Empty;
})(TextObject);

var LatestChange = (function (_TextObject13) {
  _inherits(LatestChange, _TextObject13);

  function LatestChange() {
    _classCallCheck(this, LatestChange);

    _get(Object.getPrototypeOf(LatestChange.prototype), 'constructor', this).apply(this, arguments);

    this.wise = null;
    this.selectOnce = true;
  }

  _createClass(LatestChange, [{
    key: 'getRange',
    value: function getRange(selection) {
      var start = this.vimState.mark.get('[');
      var end = this.vimState.mark.get(']');
      if (start && end) {
        return new Range(start, end);
      }
    }
  }]);

  return LatestChange;
})(TextObject);

var SearchMatchForward = (function (_TextObject14) {
  _inherits(SearchMatchForward, _TextObject14);

  function SearchMatchForward() {
    _classCallCheck(this, SearchMatchForward);

    _get(Object.getPrototypeOf(SearchMatchForward.prototype), 'constructor', this).apply(this, arguments);

    this.backward = false;
  }

  _createClass(SearchMatchForward, [{
    key: 'findMatch',
    value: function findMatch(from, regex) {
      if (this.backward) {
        if (this.mode === 'visual') {
          from = this.utils.translatePointAndClip(this.editor, from, 'backward');
        }

        var options = { from: [from.row, Infinity] };
        return {
          range: this.findInEditor('backward', regex, options, function (_ref10) {
            var range = _ref10.range;
            return range.start.isLessThan(from) && range;
          }),
          whichIsHead: 'start'
        };
      } else {
        if (this.mode === 'visual') {
          from = this.utils.translatePointAndClip(this.editor, from, 'forward');
        }

        var options = { from: [from.row, 0] };
        return {
          range: this.findInEditor('forward', regex, options, function (_ref11) {
            var range = _ref11.range;
            return range.end.isGreaterThan(from) && range;
          }),
          whichIsHead: 'end'
        };
      }
    }
  }, {
    key: 'getRange',
    value: function getRange(selection) {
      var pattern = this.globalState.get('lastSearchPattern');
      if (!pattern) return;

      var fromPoint = selection.getHeadBufferPosition();

      var _findMatch = this.findMatch(fromPoint, pattern);

      var range = _findMatch.range;
      var whichIsHead = _findMatch.whichIsHead;

      if (range) {
        return this.unionRangeAndDetermineReversedState(selection, range, whichIsHead);
      }
    }
  }, {
    key: 'unionRangeAndDetermineReversedState',
    value: function unionRangeAndDetermineReversedState(selection, range, whichIsHead) {
      if (selection.isEmpty()) return range;

      var head = range[whichIsHead];
      var tail = selection.getTailBufferPosition();

      if (this.backward) {
        if (tail.isLessThan(head)) head = this.utils.translatePointAndClip(this.editor, head, 'forward');
      } else {
        if (head.isLessThan(tail)) head = this.utils.translatePointAndClip(this.editor, head, 'backward');
      }

      this.reversed = head.isLessThan(tail);
      return new Range(tail, head).union(this.swrap(selection).getTailBufferRange());
    }
  }, {
    key: 'selectTextObject',
    value: function selectTextObject(selection) {
      var range = this.getRange(selection);
      if (range) {
        this.swrap(selection).setBufferRange(range, { reversed: this.reversed != null ? this.reversed : this.backward });
        return true;
      }
    }
  }]);

  return SearchMatchForward;
})(TextObject);

var SearchMatchBackward = (function (_SearchMatchForward) {
  _inherits(SearchMatchBackward, _SearchMatchForward);

  function SearchMatchBackward() {
    _classCallCheck(this, SearchMatchBackward);

    _get(Object.getPrototypeOf(SearchMatchBackward.prototype), 'constructor', this).apply(this, arguments);

    this.backward = true;
  }

  // [Limitation: won't fix]: Selected range is not submode aware. always characterwise.
  // So even if original selection was vL or vB, selected range by this text-object
  // is always vC range.
  return SearchMatchBackward;
})(SearchMatchForward);

var PreviousSelection = (function (_TextObject15) {
  _inherits(PreviousSelection, _TextObject15);

  function PreviousSelection() {
    _classCallCheck(this, PreviousSelection);

    _get(Object.getPrototypeOf(PreviousSelection.prototype), 'constructor', this).apply(this, arguments);

    this.wise = null;
    this.selectOnce = true;
  }

  _createClass(PreviousSelection, [{
    key: 'selectTextObject',
    value: function selectTextObject(selection) {
      var _vimState$previousSelection = this.vimState.previousSelection;
      var properties = _vimState$previousSelection.properties;
      var submode = _vimState$previousSelection.submode;

      if (properties && submode) {
        this.wise = submode;
        this.swrap(this.editor.getLastSelection()).selectByProperties(properties);
        return true;
      }
    }
  }]);

  return PreviousSelection;
})(TextObject);

var PersistentSelection = (function (_TextObject16) {
  _inherits(PersistentSelection, _TextObject16);

  function PersistentSelection() {
    _classCallCheck(this, PersistentSelection);

    _get(Object.getPrototypeOf(PersistentSelection.prototype), 'constructor', this).apply(this, arguments);

    this.wise = null;
    this.selectOnce = true;
  }

  // Used only by ReplaceWithRegister and PutBefore and its' children.

  _createClass(PersistentSelection, [{
    key: 'selectTextObject',
    value: function selectTextObject(selection) {
      if (this.vimState.hasPersistentSelections()) {
        this.persistentSelection.setSelectedBufferRanges();
        return true;
      }
    }
  }]);

  return PersistentSelection;
})(TextObject);

var LastPastedRange = (function (_TextObject17) {
  _inherits(LastPastedRange, _TextObject17);

  function LastPastedRange() {
    _classCallCheck(this, LastPastedRange);

    _get(Object.getPrototypeOf(LastPastedRange.prototype), 'constructor', this).apply(this, arguments);

    this.wise = null;
    this.selectOnce = true;
  }

  _createClass(LastPastedRange, [{
    key: 'selectTextObject',
    value: function selectTextObject(selection) {
      for (selection of this.editor.getSelections()) {
        var range = this.vimState.sequentialPasteManager.getPastedRangeForSelection(selection);
        selection.setBufferRange(range);
      }
      return true;
    }
  }], [{
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return LastPastedRange;
})(TextObject);

var VisibleArea = (function (_TextObject18) {
  _inherits(VisibleArea, _TextObject18);

  function VisibleArea() {
    _classCallCheck(this, VisibleArea);

    _get(Object.getPrototypeOf(VisibleArea.prototype), 'constructor', this).apply(this, arguments);

    this.selectOnce = true;
  }

  _createClass(VisibleArea, [{
    key: 'getRange',
    value: function getRange(selection) {
      var _editor$getVisibleRowRange = this.editor.getVisibleRowRange();

      var _editor$getVisibleRowRange2 = _slicedToArray(_editor$getVisibleRowRange, 2);

      var startRow = _editor$getVisibleRowRange2[0];
      var endRow = _editor$getVisibleRowRange2[1];

      return this.editor.bufferRangeForScreenRange([[startRow, 0], [endRow, Infinity]]);
    }
  }]);

  return VisibleArea;
})(TextObject);

var DiffHunk = (function (_TextObject19) {
  _inherits(DiffHunk, _TextObject19);

  function DiffHunk() {
    _classCallCheck(this, DiffHunk);

    _get(Object.getPrototypeOf(DiffHunk.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'linewise';
    this.selectOnce = true;
  }

  _createClass(DiffHunk, [{
    key: 'getRange',
    value: function getRange(selection) {
      var row = this.getCursorPositionForSelection(selection).row;
      return this.utils.getHunkRangeAtBufferRow(this.editor, row);
    }
  }]);

  return DiffHunk;
})(TextObject);

module.exports = Object.assign({
  TextObject: TextObject,
  Word: Word,
  WholeWord: WholeWord,
  SmartWord: SmartWord,
  Subword: Subword,
  Pair: Pair,
  APair: APair,
  AnyPair: AnyPair,
  AnyPairAllowForwarding: AnyPairAllowForwarding,
  AnyQuote: AnyQuote,
  Quote: Quote,
  DoubleQuote: DoubleQuote,
  SingleQuote: SingleQuote,
  BackTick: BackTick,
  CurlyBracket: CurlyBracket,
  SquareBracket: SquareBracket,
  Parenthesis: Parenthesis,
  AngleBracket: AngleBracket,
  Tag: Tag,
  Paragraph: Paragraph,
  Indentation: Indentation,
  Comment: Comment,
  CommentOrParagraph: CommentOrParagraph,
  Fold: Fold,
  Function: Function,
  Arguments: Arguments,
  CurrentLine: CurrentLine,
  Entire: Entire,
  Empty: Empty,
  LatestChange: LatestChange,
  SearchMatchForward: SearchMatchForward,
  SearchMatchBackward: SearchMatchBackward,
  PreviousSelection: PreviousSelection,
  PersistentSelection: PersistentSelection,
  LastPastedRange: LastPastedRange,
  VisibleArea: VisibleArea
}, Word.deriveClass(true), WholeWord.deriveClass(true), SmartWord.deriveClass(true), Subword.deriveClass(true), AnyPair.deriveClass(true), AnyPairAllowForwarding.deriveClass(true), AnyQuote.deriveClass(true), DoubleQuote.deriveClass(true), SingleQuote.deriveClass(true), BackTick.deriveClass(true), CurlyBracket.deriveClass(true, true), SquareBracket.deriveClass(true, true), Parenthesis.deriveClass(true, true), AngleBracket.deriveClass(true, true), Tag.deriveClass(true), Paragraph.deriveClass(true), Indentation.deriveClass(true), Comment.deriveClass(true), BlockComment.deriveClass(true), CommentOrParagraph.deriveClass(true), Fold.deriveClass(true), Function.deriveClass(true), Arguments.deriveClass(true), CurrentLine.deriveClass(true), Entire.deriveClass(true), LatestChange.deriveClass(true), PersistentSelection.deriveClass(true), VisibleArea.deriveClass(true), DiffHunk.deriveClass(true));
// FIXME #472, #66
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3l1YW5zaGVuLy5hdG9tL3BhY2thZ2VzL3ZpbS1tb2RlLXBsdXMvbGliL3RleHQtb2JqZWN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQTs7Ozs7Ozs7Ozs7O2VBRVksT0FBTyxDQUFDLE1BQU0sQ0FBQzs7SUFBL0IsS0FBSyxZQUFMLEtBQUs7SUFBRSxLQUFLLFlBQUwsS0FBSzs7Ozs7QUFLbkIsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFBO0FBQzlCLElBQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQTs7SUFFckMsVUFBVTtZQUFWLFVBQVU7O1dBQVYsVUFBVTswQkFBVixVQUFVOzsrQkFBVixVQUFVOztTQUlkLFFBQVEsR0FBRyxJQUFJO1NBQ2YsSUFBSSxHQUFHLGVBQWU7U0FDdEIsWUFBWSxHQUFHLEtBQUs7U0FDcEIsVUFBVSxHQUFHLEtBQUs7U0FDbEIsZUFBZSxHQUFHLEtBQUs7Ozs7OztlQVJuQixVQUFVOztXQThDTixtQkFBRztBQUNULGFBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQTtLQUNsQjs7O1dBRUcsZUFBRztBQUNMLGFBQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFBO0tBQ25COzs7V0FFVSxzQkFBRztBQUNaLGFBQU8sSUFBSSxDQUFDLElBQUksS0FBSyxVQUFVLENBQUE7S0FDaEM7OztXQUVXLHVCQUFHO0FBQ2IsYUFBTyxJQUFJLENBQUMsSUFBSSxLQUFLLFdBQVcsQ0FBQTtLQUNqQzs7O1dBRVMsbUJBQUMsSUFBSSxFQUFFO0FBQ2YsYUFBUSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztLQUMxQjs7O1dBRVUsc0JBQUc7QUFDWixVQUFJLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQTtLQUM3Qjs7Ozs7OztXQUtPLG1CQUFHOztBQUVULFVBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0NBQWdD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QVcsQ0FBQyxJQUFJLENBQUMsRUFDckMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFDN0IsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FDM0IsQ0FBQSIsImZpbGUiOiIvaG9tZS95dWFuc2hlbi8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi90ZXh0LW9iamVjdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnXG5cbmNvbnN0IHtSYW5nZSwgUG9pbnR9ID0gcmVxdWlyZSgnYXRvbScpXG5cbi8vIFtUT0RPXSBOZWVkIG92ZXJoYXVsXG4vLyAgLSBbIF0gTWFrZSBleHBhbmRhYmxlIGJ5IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpLnVuaW9uKHRoaXMuZ2V0UmFuZ2Uoc2VsZWN0aW9uKSlcbi8vICAtIFsgXSBDb3VudCBzdXBwb3J0KHByaW9yaXR5IGxvdyk/XG5jb25zdCBCYXNlID0gcmVxdWlyZSgnLi9iYXNlJylcbmNvbnN0IFBhaXJGaW5kZXIgPSByZXF1aXJlKCcuL3BhaXItZmluZGVyJylcblxuY2xhc3MgVGV4dE9iamVjdCBleHRlbmRzIEJhc2Uge1xuICBzdGF0aWMgb3BlcmF0aW9uS2luZCA9ICd0ZXh0LW9iamVjdCdcbiAgc3RhdGljIGNvbW1hbmQgPSBmYWxzZVxuXG4gIG9wZXJhdG9yID0gbnVsbFxuICB3aXNlID0gJ2NoYXJhY3Rlcndpc2UnXG4gIHN1cHBvcnRDb3VudCA9IGZhbHNlIC8vIEZJWE1FICM0NzIsICM2NlxuICBzZWxlY3RPbmNlID0gZmFsc2VcbiAgc2VsZWN0U3VjY2VlZGVkID0gZmFsc2VcblxuICBzdGF0aWMgZGVyaXZlQ2xhc3MgKGlubmVyQW5kQSwgaW5uZXJBbmRBRm9yQWxsb3dGb3J3YXJkaW5nKSB7XG4gICAgdGhpcy5jb21tYW5kID0gZmFsc2UgLy8gSEFDSzoga2xhc3MgdG8gZGVyaXZlIGNoaWxkIGNsYXNzIGlzIG5vdCBjb21tYW5kXG4gICAgY29uc3Qgc3RvcmUgPSB7fVxuICAgIGlmIChpbm5lckFuZEEpIHtcbiAgICAgIGNvbnN0IGtsYXNzQSA9IHRoaXMuZ2VuZXJhdGVDbGFzcyhmYWxzZSlcbiAgICAgIGNvbnN0IGtsYXNzSSA9IHRoaXMuZ2VuZXJhdGVDbGFzcyh0cnVlKVxuICAgICAgc3RvcmVba2xhc3NBLm5hbWVdID0ga2xhc3NBXG4gICAgICBzdG9yZVtrbGFzc0kubmFtZV0gPSBrbGFzc0lcbiAgICB9XG4gICAgaWYgKGlubmVyQW5kQUZvckFsbG93Rm9yd2FyZGluZykge1xuICAgICAgY29uc3Qga2xhc3NBID0gdGhpcy5nZW5lcmF0ZUNsYXNzKGZhbHNlLCB0cnVlKVxuICAgICAgY29uc3Qga2xhc3NJID0gdGhpcy5nZW5lcmF0ZUNsYXNzKHRydWUsIHRydWUpXG4gICAgICBzdG9yZVtrbGFzc0EubmFtZV0gPSBrbGFzc0FcbiAgICAgIHN0b3JlW2tsYXNzSS5uYW1lXSA9IGtsYXNzSVxuICAgIH1cbiAgICByZXR1cm4gc3RvcmVcbiAgfVxuXG4gIHN0YXRpYyBnZW5lcmF0ZUNsYXNzIChpbm5lciwgYWxsb3dGb3J3YXJkaW5nKSB7XG4gICAgbGV0IG5hbWUgPSAoaW5uZXIgPyAnSW5uZXInIDogJ0EnKSArIHRoaXMubmFtZVxuICAgIGlmIChhbGxvd0ZvcndhcmRpbmcpIHtcbiAgICAgIG5hbWUgKz0gJ0FsbG93Rm9yd2FyZGluZydcbiAgICB9XG5cbiAgICByZXR1cm4gY2xhc3MgZXh0ZW5kcyB0aGlzIHtcbiAgICAgIHN0YXRpYyBuYW1lID0gbmFtZVxuICAgICAgY29uc3RydWN0b3IgKHZpbVN0YXRlKSB7XG4gICAgICAgIHN1cGVyKHZpbVN0YXRlKVxuICAgICAgICB0aGlzLmlubmVyID0gaW5uZXJcbiAgICAgICAgaWYgKGFsbG93Rm9yd2FyZGluZyAhPSBudWxsKSB7XG4gICAgICAgICAgdGhpcy5hbGxvd0ZvcndhcmRpbmcgPSBhbGxvd0ZvcndhcmRpbmdcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlzSW5uZXIgKCkge1xuICAgIHJldHVybiB0aGlzLmlubmVyXG4gIH1cblxuICBpc0EgKCkge1xuICAgIHJldHVybiAhdGhpcy5pbm5lclxuICB9XG5cbiAgaXNMaW5ld2lzZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMud2lzZSA9PT0gJ2xpbmV3aXNlJ1xuICB9XG5cbiAgaXNCbG9ja3dpc2UgKCkge1xuICAgIHJldHVybiB0aGlzLndpc2UgPT09ICdibG9ja3dpc2UnXG4gIH1cblxuICBmb3JjZVdpc2UgKHdpc2UpIHtcbiAgICByZXR1cm4gKHRoaXMud2lzZSA9IHdpc2UpIC8vIEZJWE1FIGN1cnJlbnRseSBub3Qgd2VsbCBzdXBwb3J0ZWRcbiAgfVxuXG4gIHJlc2V0U3RhdGUgKCkge1xuICAgIHRoaXMuc2VsZWN0U3VjY2VlZGVkID0gZmFsc2VcbiAgfVxuXG4gIC8vIGV4ZWN1dGU6IENhbGxlZCBmcm9tIE9wZXJhdG9yOjpzZWxlY3RUYXJnZXQoKVxuICAvLyAgLSBgdiBpIHBgLCBpcyBgVmlzdWFsTW9kZVNlbGVjdGAgb3BlcmF0b3Igd2l0aCBAdGFyZ2V0ID0gYElubmVyUGFyYWdyYXBoYC5cbiAgLy8gIC0gYGQgaSBwYCwgaXMgYERlbGV0ZWAgb3BlcmF0b3Igd2l0aCBAdGFyZ2V0ID0gYElubmVyUGFyYWdyYXBoYC5cbiAgZXhlY3V0ZSAoKSB7XG4gICAgLy8gV2hlbm5ldmVyIFRleHRPYmplY3QgaXMgZXhlY3V0ZWQsIGl0IGhhcyBAb3BlcmF0b3JcbiAgICBpZiAoIXRoaXMub3BlcmF0b3IpIHRocm93IG5ldyBFcnJvcignaW4gVGV4dE9iamVjdDogTXVzdCBub3QgaGFwcGVuJylcbiAgICB0aGlzLnNlbGVjdCgpXG4gIH1cblxuICBzZWxlY3QgKCkge1xuICAgIGlmICh0aGlzLmlzTW9kZSgndmlzdWFsJywgJ2Jsb2Nrd2lzZScpKSB7XG4gICAgICB0aGlzLnN3cmFwLm5vcm1hbGl6ZSh0aGlzLmVkaXRvcilcbiAgICB9XG5cbiAgICB0aGlzLmNvdW50VGltZXModGhpcy5nZXRDb3VudCgpLCAoe3N0b3B9KSA9PiB7XG4gICAgICBpZiAoIXRoaXMuc3VwcG9ydENvdW50KSBzdG9wKCkgLy8gcXVpY2stZml4IGZvciAjNTYwXG5cbiAgICAgIGZvciAoY29uc3Qgc2VsZWN0aW9uIG9mIHRoaXMuZWRpdG9yLmdldFNlbGVjdGlvbnMoKSkge1xuICAgICAgICBjb25zdCBvbGRSYW5nZSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgICAgIGlmICh0aGlzLnNlbGVjdFRleHRPYmplY3Qoc2VsZWN0aW9uKSkgdGhpcy5zZWxlY3RTdWNjZWVkZWQgPSB0cnVlXG4gICAgICAgIGlmIChzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKS5pc0VxdWFsKG9sZFJhbmdlKSkgc3RvcCgpXG4gICAgICAgIGlmICh0aGlzLnNlbGVjdE9uY2UpIGJyZWFrXG4gICAgICB9XG4gICAgfSlcblxuICAgIHRoaXMuZWRpdG9yLm1lcmdlSW50ZXJzZWN0aW5nU2VsZWN0aW9ucygpXG4gICAgLy8gU29tZSBUZXh0T2JqZWN0J3Mgd2lzZSBpcyBOT1QgZGV0ZXJtaW5pc3RpYy4gSXQgaGFzIHRvIGJlIGRldGVjdGVkIGZyb20gc2VsZWN0ZWQgcmFuZ2UuXG4gICAgaWYgKHRoaXMud2lzZSA9PSBudWxsKSB0aGlzLndpc2UgPSB0aGlzLnN3cmFwLmRldGVjdFdpc2UodGhpcy5lZGl0b3IpXG5cbiAgICBpZiAodGhpcy5vcGVyYXRvci5pbnN0YW5jZW9mKCdTZWxlY3RCYXNlJykpIHtcbiAgICAgIGlmICh0aGlzLnNlbGVjdFN1Y2NlZWRlZCkge1xuICAgICAgICBpZiAodGhpcy53aXNlID09PSAnY2hhcmFjdGVyd2lzZScpIHtcbiAgICAgICAgICB0aGlzLnN3cmFwLnNhdmVQcm9wZXJ0aWVzKHRoaXMuZWRpdG9yLCB7Zm9yY2U6IHRydWV9KVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMud2lzZSA9PT0gJ2xpbmV3aXNlJykge1xuICAgICAgICAgIC8vIFdoZW4gdGFyZ2V0IGlzIHBlcnNpc3RlbnQtc2VsZWN0aW9uLCBuZXcgc2VsZWN0aW9uIGlzIGFkZGVkIGFmdGVyIHNlbGVjdFRleHRPYmplY3QuXG4gICAgICAgICAgLy8gU28gd2UgaGF2ZSB0byBhc3N1cmUgYWxsIHNlbGVjdGlvbiBoYXZlIHNlbGN0aW9uIHByb3BlcnR5LlxuICAgICAgICAgIC8vIE1heWJlIHRoaXMgbG9naWMgY2FuIGJlIG1vdmVkIHRvIG9wZXJhdGlvbiBzdGFjay5cbiAgICAgICAgICBmb3IgKGNvbnN0ICRzZWxlY3Rpb24gb2YgdGhpcy5zd3JhcC5nZXRTZWxlY3Rpb25zKHRoaXMuZWRpdG9yKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZ2V0Q29uZmlnKCdzdGF5T25TZWxlY3RUZXh0T2JqZWN0JykpIHtcbiAgICAgICAgICAgICAgaWYgKCEkc2VsZWN0aW9uLmhhc1Byb3BlcnRpZXMoKSkge1xuICAgICAgICAgICAgICAgICRzZWxlY3Rpb24uc2F2ZVByb3BlcnRpZXMoKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAkc2VsZWN0aW9uLnNhdmVQcm9wZXJ0aWVzKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICRzZWxlY3Rpb24uZml4UHJvcGVydHlSb3dUb1Jvd1JhbmdlKClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuc3VibW9kZSA9PT0gJ2Jsb2Nrd2lzZScpIHtcbiAgICAgICAgZm9yIChjb25zdCAkc2VsZWN0aW9uIG9mIHRoaXMuc3dyYXAuZ2V0U2VsZWN0aW9ucyh0aGlzLmVkaXRvcikpIHtcbiAgICAgICAgICAkc2VsZWN0aW9uLm5vcm1hbGl6ZSgpXG4gICAgICAgICAgJHNlbGVjdGlvbi5hcHBseVdpc2UoJ2Jsb2Nrd2lzZScpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBSZXR1cm4gdHJ1ZSBvciBmYWxzZVxuICBzZWxlY3RUZXh0T2JqZWN0IChzZWxlY3Rpb24pIHtcbiAgICBjb25zdCByYW5nZSA9IHRoaXMuZ2V0UmFuZ2Uoc2VsZWN0aW9uKVxuICAgIGlmIChyYW5nZSkge1xuICAgICAgdGhpcy5zd3JhcChzZWxlY3Rpb24pLnNldEJ1ZmZlclJhbmdlKHJhbmdlKVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG5cbiAgLy8gdG8gb3ZlcnJpZGVcbiAgZ2V0UmFuZ2UgKHNlbGVjdGlvbikge31cbn1cblxuLy8gU2VjdGlvbjogV29yZFxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgV29yZCBleHRlbmRzIFRleHRPYmplY3Qge1xuICBnZXRSYW5nZSAoc2VsZWN0aW9uKSB7XG4gICAgY29uc3QgcG9pbnQgPSB0aGlzLmdldEN1cnNvclBvc2l0aW9uRm9yU2VsZWN0aW9uKHNlbGVjdGlvbilcbiAgICBjb25zdCB7cmFuZ2V9ID0gdGhpcy5nZXRXb3JkQnVmZmVyUmFuZ2VBbmRLaW5kQXRCdWZmZXJQb3NpdGlvbihwb2ludCwge3dvcmRSZWdleDogdGhpcy53b3JkUmVnZXh9KVxuICAgIHJldHVybiB0aGlzLmlzQSgpID8gdGhpcy51dGlscy5leHBhbmRSYW5nZVRvV2hpdGVTcGFjZXModGhpcy5lZGl0b3IsIHJhbmdlKSA6IHJhbmdlXG4gIH1cbn1cblxuY2xhc3MgV2hvbGVXb3JkIGV4dGVuZHMgV29yZCB7XG4gIHdvcmRSZWdleCA9IC9cXFMrL1xufVxuXG4vLyBKdXN0IGluY2x1ZGUgXywgLVxuY2xhc3MgU21hcnRXb3JkIGV4dGVuZHMgV29yZCB7XG4gIHdvcmRSZWdleCA9IC9bXFx3LV0rL1xufVxuXG4vLyBKdXN0IGluY2x1ZGUgXywgLVxuY2xhc3MgU3Vid29yZCBleHRlbmRzIFdvcmQge1xuICBnZXRSYW5nZSAoc2VsZWN0aW9uKSB7XG4gICAgdGhpcy53b3JkUmVnZXggPSBzZWxlY3Rpb24uY3Vyc29yLnN1YndvcmRSZWdFeHAoKVxuICAgIHJldHVybiBzdXBlci5nZXRSYW5nZShzZWxlY3Rpb24pXG4gIH1cbn1cblxuLy8gU2VjdGlvbjogUGFpclxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgUGFpciBleHRlbmRzIFRleHRPYmplY3Qge1xuICBzdGF0aWMgY29tbWFuZCA9IGZhbHNlXG4gIHN1cHBvcnRDb3VudCA9IHRydWVcbiAgYWxsb3dOZXh0TGluZSA9IG51bGxcbiAgYWRqdXN0SW5uZXJSYW5nZSA9IHRydWVcbiAgcGFpciA9IG51bGxcbiAgaW5jbHVzaXZlID0gdHJ1ZVxuXG4gIGlzQWxsb3dOZXh0TGluZSAoKSB7XG4gICAgaWYgKHRoaXMuYWxsb3dOZXh0TGluZSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5hbGxvd05leHRMaW5lXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnBhaXIgJiYgdGhpcy5wYWlyWzBdICE9PSB0aGlzLnBhaXJbMV1cbiAgICB9XG4gIH1cblxuICBhZGp1c3RSYW5nZSAoe3N0YXJ0LCBlbmR9KSB7XG4gICAgLy8gRGlydHkgd29yayB0byBmZWVsIG5hdHVyYWwgZm9yIGh1bWFuLCB0byBiZWhhdmUgY29tcGF0aWJsZSB3aXRoIHB1cmUgVmltLlxuICAgIC8vIFdoZXJlIHRoaXMgYWRqdXN0bWVudCBhcHBlYXIgaXMgaW4gZm9sbG93aW5nIHNpdHVhdGlvbi5cbiAgICAvLyBvcC0xOiBgY2l7YCByZXBsYWNlIG9ubHkgMm5kIGxpbmVcbiAgICAvLyBvcC0yOiBgZGl7YCBkZWxldGUgb25seSAybmQgbGluZS5cbiAgICAvLyB0ZXh0OlxuICAgIC8vICB7XG4gICAgLy8gICAgYWFhXG4gICAgLy8gIH1cbiAgICBpZiAodGhpcy51dGlscy5wb2ludElzQXRFbmRPZkxpbmUodGhpcy5lZGl0b3IsIHN0YXJ0KSkge1xuICAgICAgc3RhcnQgPSBzdGFydC50cmF2ZXJzZShbMSwgMF0pXG4gICAgfVxuXG4gICAgaWYgKHRoaXMudXRpbHMuZ2V0TGluZVRleHRUb0J1ZmZlclBvc2l0aW9uKHRoaXMuZWRpdG9yLCBlbmQpLm1hdGNoKC9eXFxzKiQvKSkge1xuICAgICAgaWYgKHRoaXMubW9kZSA9PT0gJ3Zpc3VhbCcpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBzbGlnaHRseSBpbm5jb25zaXN0ZW50IHdpdGggcmVndWxhciBWaW1cbiAgICAgICAgLy8gLSByZWd1bGFyIFZpbTogc2VsZWN0IG5ldyBsaW5lIGFmdGVyIEVPTFxuICAgICAgICAvLyAtIHZpbS1tb2RlLXBsdXM6IHNlbGVjdCB0byBFT0woYmVmb3JlIG5ldyBsaW5lKVxuICAgICAgICAvLyBUaGlzIGlzIGludGVudGlvbmFsIHNpbmNlIHRvIG1ha2Ugc3VibW9kZSBgY2hhcmFjdGVyd2lzZWAgd2hlbiBhdXRvLWRldGVjdCBzdWJtb2RlXG4gICAgICAgIC8vIGlubmVyRW5kID0gbmV3IFBvaW50KGlubmVyRW5kLnJvdyAtIDEsIEluZmluaXR5KVxuICAgICAgICBlbmQgPSBuZXcgUG9pbnQoZW5kLnJvdyAtIDEsIEluZmluaXR5KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZW5kID0gbmV3IFBvaW50KGVuZC5yb3csIDApXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBuZXcgUmFuZ2Uoc3RhcnQsIGVuZClcbiAgfVxuXG4gIGdldEZpbmRlciAoKSB7XG4gICAgY29uc3QgZmluZGVyTmFtZSA9IHRoaXMucGFpclswXSA9PT0gdGhpcy5wYWlyWzFdID8gJ1F1b3RlRmluZGVyJyA6ICdCcmFja2V0RmluZGVyJ1xuICAgIHJldHVybiBuZXcgUGFpckZpbmRlcltmaW5kZXJOYW1lXSh0aGlzLmVkaXRvciwge1xuICAgICAgYWxsb3dOZXh0TGluZTogdGhpcy5pc0FsbG93TmV4dExpbmUoKSxcbiAgICAgIGFsbG93Rm9yd2FyZGluZzogdGhpcy5hbGxvd0ZvcndhcmRpbmcsXG4gICAgICBwYWlyOiB0aGlzLnBhaXIsXG4gICAgICBpbmNsdXNpdmU6IHRoaXMuaW5jbHVzaXZlXG4gICAgfSlcbiAgfVxuXG4gIGdldFBhaXJJbmZvIChmcm9tKSB7XG4gICAgY29uc3QgcGFpckluZm8gPSB0aGlzLmdldEZpbmRlcigpLmZpbmQoZnJvbSlcbiAgICBpZiAocGFpckluZm8pIHtcbiAgICAgIGlmICh0aGlzLmFkanVzdElubmVyUmFuZ2UpIHtcbiAgICAgICAgcGFpckluZm8uaW5uZXJSYW5nZSA9IHRoaXMuYWRqdXN0UmFuZ2UocGFpckluZm8uaW5uZXJSYW5nZSlcbiAgICAgIH1cbiAgICAgIHBhaXJJbmZvLnRhcmdldFJhbmdlID0gdGhpcy5pc0lubmVyKCkgPyBwYWlySW5mby5pbm5lclJhbmdlIDogcGFpckluZm8uYVJhbmdlXG4gICAgICByZXR1cm4gcGFpckluZm9cbiAgICB9XG4gIH1cblxuICBnZXRSYW5nZSAoc2VsZWN0aW9uKSB7XG4gICAgY29uc3Qgb3JpZ2luYWxSYW5nZSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgbGV0IHBhaXJJbmZvID0gdGhpcy5nZXRQYWlySW5mbyh0aGlzLmdldEN1cnNvclBvc2l0aW9uRm9yU2VsZWN0aW9uKHNlbGVjdGlvbikpXG4gICAgLy8gV2hlbiByYW5nZSB3YXMgc2FtZSwgdHJ5IHRvIGV4cGFuZCByYW5nZVxuICAgIGlmIChwYWlySW5mbyAmJiBwYWlySW5mby50YXJnZXRSYW5nZS5pc0VxdWFsKG9yaWdpbmFsUmFuZ2UpKSB7XG4gICAgICBwYWlySW5mbyA9IHRoaXMuZ2V0UGFpckluZm8ocGFpckluZm8uYVJhbmdlLmVuZClcbiAgICB9XG4gICAgaWYgKHBhaXJJbmZvKSB7XG4gICAgICByZXR1cm4gcGFpckluZm8udGFyZ2V0UmFuZ2VcbiAgICB9XG4gIH1cbn1cblxuLy8gVXNlZCBieSBEZWxldGVTdXJyb3VuZFxuY2xhc3MgQVBhaXIgZXh0ZW5kcyBQYWlyIHtcbiAgc3RhdGljIGNvbW1hbmQgPSBmYWxzZVxufVxuXG5jbGFzcyBBbnlQYWlyIGV4dGVuZHMgUGFpciB7XG4gIGFsbG93Rm9yd2FyZGluZyA9IGZhbHNlXG4gIG1lbWJlciA9IFsnRG91YmxlUXVvdGUnLCAnU2luZ2xlUXVvdGUnLCAnQmFja1RpY2snLCAnQ3VybHlCcmFja2V0JywgJ0FuZ2xlQnJhY2tldCcsICdTcXVhcmVCcmFja2V0JywgJ1BhcmVudGhlc2lzJ11cblxuICBnZXRSYW5nZXMgKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICBpbm5lcjogdGhpcy5pbm5lcixcbiAgICAgIGFsbG93Rm9yd2FyZGluZzogdGhpcy5hbGxvd0ZvcndhcmRpbmcsXG4gICAgICBpbmNsdXNpdmU6IHRoaXMuaW5jbHVzaXZlXG4gICAgfVxuICAgIGNvbnN0IGdldFJhbmdlQnlNZW1iZXIgPSBtZW1iZXIgPT4gdGhpcy5nZXRJbnN0YW5jZShtZW1iZXIsIG9wdGlvbnMpLmdldFJhbmdlKHNlbGVjdGlvbilcbiAgICByZXR1cm4gdGhpcy5tZW1iZXIubWFwKGdldFJhbmdlQnlNZW1iZXIpLmZpbHRlcih2ID0+IHYpXG4gIH1cblxuICBnZXRSYW5nZSAoc2VsZWN0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMudXRpbHMuc29ydFJhbmdlcyh0aGlzLmdldFJhbmdlcyhzZWxlY3Rpb24pKS5wb3AoKVxuICB9XG59XG5cbmNsYXNzIEFueVBhaXJBbGxvd0ZvcndhcmRpbmcgZXh0ZW5kcyBBbnlQYWlyIHtcbiAgYWxsb3dGb3J3YXJkaW5nID0gdHJ1ZVxuXG4gIGdldFJhbmdlIChzZWxlY3Rpb24pIHtcbiAgICBjb25zdCByYW5nZXMgPSB0aGlzLmdldFJhbmdlcyhzZWxlY3Rpb24pXG4gICAgY29uc3QgZnJvbSA9IHNlbGVjdGlvbi5jdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIGxldCBbZm9yd2FyZGluZ1JhbmdlcywgZW5jbG9zaW5nUmFuZ2VzXSA9IHRoaXMuXy5wYXJ0aXRpb24ocmFuZ2VzLCByYW5nZSA9PiByYW5nZS5zdGFydC5pc0dyZWF0ZXJUaGFuT3JFcXVhbChmcm9tKSlcbiAgICBjb25zdCBlbmNsb3NpbmdSYW5nZSA9IHRoaXMudXRpbHMuc29ydFJhbmdlcyhlbmNsb3NpbmdSYW5nZXMpLnBvcCgpXG4gICAgZm9yd2FyZGluZ1JhbmdlcyA9IHRoaXMudXRpbHMuc29ydFJhbmdlcyhmb3J3YXJkaW5nUmFuZ2VzKVxuXG4gICAgLy8gV2hlbiBlbmNsb3NpbmdSYW5nZSBpcyBleGlzdHMsXG4gICAgLy8gV2UgZG9uJ3QgZ28gYWNyb3NzIGVuY2xvc2luZ1JhbmdlLmVuZC5cbiAgICAvLyBTbyBjaG9vc2UgZnJvbSByYW5nZXMgY29udGFpbmVkIGluIGVuY2xvc2luZ1JhbmdlLlxuICAgIGlmIChlbmNsb3NpbmdSYW5nZSkge1xuICAgICAgZm9yd2FyZGluZ1JhbmdlcyA9IGZvcndhcmRpbmdSYW5nZXMuZmlsdGVyKHJhbmdlID0+IGVuY2xvc2luZ1JhbmdlLmNvbnRhaW5zUmFuZ2UocmFuZ2UpKVxuICAgIH1cblxuICAgIHJldHVybiBmb3J3YXJkaW5nUmFuZ2VzWzBdIHx8IGVuY2xvc2luZ1JhbmdlXG4gIH1cbn1cblxuY2xhc3MgQW55UXVvdGUgZXh0ZW5kcyBBbnlQYWlyIHtcbiAgYWxsb3dGb3J3YXJkaW5nID0gdHJ1ZVxuICBtZW1iZXIgPSBbJ0RvdWJsZVF1b3RlJywgJ1NpbmdsZVF1b3RlJywgJ0JhY2tUaWNrJ11cblxuICBnZXRSYW5nZSAoc2VsZWN0aW9uKSB7XG4gICAgLy8gUGljayByYW5nZSB3aGljaCBlbmQuY29sdW0gaXMgbGVmdG1vc3QobWVhbiwgY2xvc2VkIGZpcnN0KVxuICAgIHJldHVybiB0aGlzLmdldFJhbmdlcyhzZWxlY3Rpb24pLnNvcnQoKGEsIGIpID0+IGEuZW5kLmNvbHVtbiAtIGIuZW5kLmNvbHVtbilbMF1cbiAgfVxufVxuXG5jbGFzcyBRdW90ZSBleHRlbmRzIFBhaXIge1xuICBzdGF0aWMgY29tbWFuZCA9IGZhbHNlXG4gIGFsbG93Rm9yd2FyZGluZyA9IHRydWVcbn1cblxuY2xhc3MgRG91YmxlUXVvdGUgZXh0ZW5kcyBRdW90ZSB7XG4gIHBhaXIgPSBbJ1wiJywgJ1wiJ11cbn1cblxuY2xhc3MgU2luZ2xlUXVvdGUgZXh0ZW5kcyBRdW90ZSB7XG4gIHBhaXIgPSBbXCInXCIsIFwiJ1wiXVxufVxuXG5jbGFzcyBCYWNrVGljayBleHRlbmRzIFF1b3RlIHtcbiAgcGFpciA9IFsnYCcsICdgJ11cbn1cblxuY2xhc3MgQ3VybHlCcmFja2V0IGV4dGVuZHMgUGFpciB7XG4gIHBhaXIgPSBbJ3snLCAnfSddXG59XG5cbmNsYXNzIFNxdWFyZUJyYWNrZXQgZXh0ZW5kcyBQYWlyIHtcbiAgcGFpciA9IFsnWycsICddJ11cbn1cblxuY2xhc3MgUGFyZW50aGVzaXMgZXh0ZW5kcyBQYWlyIHtcbiAgcGFpciA9IFsnKCcsICcpJ11cbn1cblxuY2xhc3MgQW5nbGVCcmFja2V0IGV4dGVuZHMgUGFpciB7XG4gIHBhaXIgPSBbJzwnLCAnPiddXG59XG5cbmNsYXNzIFRhZyBleHRlbmRzIFBhaXIge1xuICBhbGxvd05leHRMaW5lID0gdHJ1ZVxuICBhbGxvd0ZvcndhcmRpbmcgPSB0cnVlXG4gIGFkanVzdElubmVyUmFuZ2UgPSBmYWxzZVxuXG4gIGdldFRhZ1N0YXJ0UG9pbnQgKGZyb20pIHtcbiAgICBjb25zdCByZWdleCA9IFBhaXJGaW5kZXIuVGFnRmluZGVyLnBhdHRlcm5cbiAgICBjb25zdCBvcHRpb25zID0ge2Zyb206IFtmcm9tLnJvdywgMF19XG4gICAgcmV0dXJuIHRoaXMuZmluZEluRWRpdG9yKCdmb3J3YXJkJywgcmVnZXgsIG9wdGlvbnMsICh7cmFuZ2V9KSA9PiByYW5nZS5jb250YWluc1BvaW50KGZyb20sIHRydWUpICYmIHJhbmdlLnN0YXJ0KVxuICB9XG5cbiAgZ2V0RmluZGVyICgpIHtcbiAgICByZXR1cm4gbmV3IFBhaXJGaW5kZXIuVGFnRmluZGVyKHRoaXMuZWRpdG9yLCB7XG4gICAgICBhbGxvd05leHRMaW5lOiB0aGlzLmlzQWxsb3dOZXh0TGluZSgpLFxuICAgICAgYWxsb3dGb3J3YXJkaW5nOiB0aGlzLmFsbG93Rm9yd2FyZGluZyxcbiAgICAgIGluY2x1c2l2ZTogdGhpcy5pbmNsdXNpdmVcbiAgICB9KVxuICB9XG5cbiAgZ2V0UGFpckluZm8gKGZyb20pIHtcbiAgICByZXR1cm4gc3VwZXIuZ2V0UGFpckluZm8odGhpcy5nZXRUYWdTdGFydFBvaW50KGZyb20pIHx8IGZyb20pXG4gIH1cbn1cblxuLy8gU2VjdGlvbjogUGFyYWdyYXBoXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBQYXJhZ3JhcGggaXMgZGVmaW5lZCBhcyBjb25zZWN1dGl2ZSAobm9uLSlibGFuay1saW5lLlxuY2xhc3MgUGFyYWdyYXBoIGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIHdpc2UgPSAnbGluZXdpc2UnXG4gIHN1cHBvcnRDb3VudCA9IHRydWVcblxuICBmaW5kUm93IChmcm9tUm93LCBkaXJlY3Rpb24sIGZuKSB7XG4gICAgaWYgKGZuLnJlc2V0KSBmbi5yZXNldCgpXG4gICAgbGV0IGZvdW5kUm93ID0gZnJvbVJvd1xuICAgIGZvciAoY29uc3Qgcm93IG9mIHRoaXMuZ2V0QnVmZmVyUm93cyh7c3RhcnRSb3c6IGZyb21Sb3csIGRpcmVjdGlvbn0pKSB7XG4gICAgICBpZiAoIWZuKHJvdywgZGlyZWN0aW9uKSkgYnJlYWtcbiAgICAgIGZvdW5kUm93ID0gcm93XG4gICAgfVxuICAgIHJldHVybiBmb3VuZFJvd1xuICB9XG5cbiAgZmluZFJvd1JhbmdlQnkgKGZyb21Sb3csIGZuKSB7XG4gICAgY29uc3Qgc3RhcnRSb3cgPSB0aGlzLmZpbmRSb3coZnJvbVJvdywgJ3ByZXZpb3VzJywgZm4pXG4gICAgY29uc3QgZW5kUm93ID0gdGhpcy5maW5kUm93KGZyb21Sb3csICduZXh0JywgZm4pXG4gICAgcmV0dXJuIFtzdGFydFJvdywgZW5kUm93XVxuICB9XG5cbiAgZ2V0UHJlZGljdEZ1bmN0aW9uIChmcm9tUm93LCBzZWxlY3Rpb24pIHtcbiAgICBjb25zdCBmcm9tUm93UmVzdWx0ID0gdGhpcy5lZGl0b3IuaXNCdWZmZXJSb3dCbGFuayhmcm9tUm93KVxuXG4gICAgaWYgKHRoaXMuaXNJbm5lcigpKSB7XG4gICAgICByZXR1cm4gKHJvdywgZGlyZWN0aW9uKSA9PiB0aGlzLmVkaXRvci5pc0J1ZmZlclJvd0JsYW5rKHJvdykgPT09IGZyb21Sb3dSZXN1bHRcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZGlyZWN0aW9uVG9FeHRlbmQgPSBzZWxlY3Rpb24uaXNSZXZlcnNlZCgpID8gJ3ByZXZpb3VzJyA6ICduZXh0J1xuXG4gICAgICBsZXQgZmxpcCA9IGZhbHNlXG4gICAgICBjb25zdCBwcmVkaWN0ID0gKHJvdywgZGlyZWN0aW9uKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZWRpdG9yLmlzQnVmZmVyUm93Qmxhbmsocm93KSA9PT0gZnJvbVJvd1Jlc3VsdFxuICAgICAgICBpZiAoZmxpcCkge1xuICAgICAgICAgIHJldHVybiAhcmVzdWx0XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKCFyZXN1bHQgJiYgZGlyZWN0aW9uID09PSBkaXJlY3Rpb25Ub0V4dGVuZCkge1xuICAgICAgICAgICAgcmV0dXJuIChmbGlwID0gdHJ1ZSlcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwcmVkaWN0LnJlc2V0ID0gKCkgPT4gKGZsaXAgPSBmYWxzZSlcbiAgICAgIHJldHVybiBwcmVkaWN0XG4gICAgfVxuICB9XG5cbiAgZ2V0UmFuZ2UgKHNlbGVjdGlvbikge1xuICAgIGxldCBmcm9tUm93ID0gdGhpcy5nZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbihzZWxlY3Rpb24pLnJvd1xuICAgIGlmICh0aGlzLmlzTW9kZSgndmlzdWFsJywgJ2xpbmV3aXNlJykpIHtcbiAgICAgIGlmIChzZWxlY3Rpb24uaXNSZXZlcnNlZCgpKSBmcm9tUm93LS1cbiAgICAgIGVsc2UgZnJvbVJvdysrXG4gICAgICBmcm9tUm93ID0gdGhpcy5nZXRWYWxpZFZpbUJ1ZmZlclJvdyhmcm9tUm93KVxuICAgIH1cbiAgICBjb25zdCByb3dSYW5nZSA9IHRoaXMuZmluZFJvd1JhbmdlQnkoZnJvbVJvdywgdGhpcy5nZXRQcmVkaWN0RnVuY3Rpb24oZnJvbVJvdywgc2VsZWN0aW9uKSlcbiAgICByZXR1cm4gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCkudW5pb24odGhpcy5nZXRCdWZmZXJSYW5nZUZvclJvd1JhbmdlKHJvd1JhbmdlKSlcbiAgfVxufVxuXG5jbGFzcyBJbmRlbnRhdGlvbiBleHRlbmRzIFBhcmFncmFwaCB7XG4gIGdldFJhbmdlIChzZWxlY3Rpb24pIHtcbiAgICBjb25zdCBmcm9tUm93ID0gdGhpcy5nZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbihzZWxlY3Rpb24pLnJvd1xuICAgIGNvbnN0IGJhc2VJbmRlbnRMZXZlbCA9IHRoaXMuZWRpdG9yLmluZGVudGF0aW9uRm9yQnVmZmVyUm93KGZyb21Sb3cpXG4gICAgY29uc3Qgcm93UmFuZ2UgPSB0aGlzLmZpbmRSb3dSYW5nZUJ5KGZyb21Sb3csIHJvdyA9PiB7XG4gICAgICBpZiAodGhpcy5lZGl0b3IuaXNCdWZmZXJSb3dCbGFuayhyb3cpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzQSgpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5lZGl0b3IuaW5kZW50YXRpb25Gb3JCdWZmZXJSb3cocm93KSA+PSBiYXNlSW5kZW50TGV2ZWxcbiAgICAgIH1cbiAgICB9KVxuICAgIHJldHVybiB0aGlzLmdldEJ1ZmZlclJhbmdlRm9yUm93UmFuZ2Uocm93UmFuZ2UpXG4gIH1cbn1cblxuLy8gU2VjdGlvbjogQ29tbWVudFxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgQ29tbWVudCBleHRlbmRzIFRleHRPYmplY3Qge1xuICB3aXNlID0gJ2xpbmV3aXNlJ1xuXG4gIGdldFJhbmdlIChzZWxlY3Rpb24pIHtcbiAgICBjb25zdCB7cm93fSA9IHRoaXMuZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgIGNvbnN0IHJvd1JhbmdlID0gdGhpcy51dGlscy5nZXRSb3dSYW5nZUZvckNvbW1lbnRBdEJ1ZmZlclJvdyh0aGlzLmVkaXRvciwgcm93KVxuICAgIGlmIChyb3dSYW5nZSkge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0QnVmZmVyUmFuZ2VGb3JSb3dSYW5nZShyb3dSYW5nZSlcbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgQmxvY2tDb21tZW50IGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIHdpc2UgPSAnY2hhcmFjdGVyd2lzZSdcblxuICBnZXRSYW5nZSAoc2VsZWN0aW9uKSB7XG4gICAgLy8gRm9sbG93aW5nIG9uZS1jb2x1bW4tcmlnaHQgdHJhbnNsYXRpb24gaXMgbmVjZXNzYXJ5IHdoZW4gY3Vyc29yIGlzIFwib25cIiBgL2AgY2hhciBvZiBiZWdpbm5pbmcgYC8qYC5cbiAgICBjb25zdCBmcm9tID0gdGhpcy5lZGl0b3IuY2xpcEJ1ZmZlclBvc2l0aW9uKHRoaXMuZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKS50cmFuc2xhdGUoWzAsIDFdKSlcblxuICAgIGNvbnN0IHJhbmdlID0gdGhpcy5nZXRCbG9ja0NvbW1lbnRSYW5nZUZvclBvaW50KGZyb20pXG4gICAgaWYgKHJhbmdlKSB7XG4gICAgICByYW5nZS5zdGFydCA9IHRoaXMuZ2V0U3RhcnRPZkJsb2NrQ29tbWVudChyYW5nZS5zdGFydClcbiAgICAgIHJhbmdlLmVuZCA9IHRoaXMuZ2V0RW5kT2ZCbG9ja0NvbW1lbnQocmFuZ2UuZW5kKVxuICAgICAgY29uc3Qgc2NhblJhbmdlID0gcmFuZ2VcblxuICAgICAgaWYgKHRoaXMuaXNJbm5lcigpKSB7XG4gICAgICAgIHRoaXMuc2NhbkVkaXRvcignZm9yd2FyZCcsIC9cXHMrLywge3NjYW5SYW5nZX0sIGV2ZW50ID0+IHtcbiAgICAgICAgICByYW5nZS5zdGFydCA9IGV2ZW50LnJhbmdlLmVuZFxuICAgICAgICAgIGV2ZW50LnN0b3AoKVxuICAgICAgICB9KVxuICAgICAgICB0aGlzLnNjYW5FZGl0b3IoJ2JhY2t3YXJkJywgL1xccysvLCB7c2NhblJhbmdlfSwgZXZlbnQgPT4ge1xuICAgICAgICAgIHJhbmdlLmVuZCA9IGV2ZW50LnJhbmdlLnN0YXJ0XG4gICAgICAgICAgZXZlbnQuc3RvcCgpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICByZXR1cm4gcmFuZ2VcbiAgICB9XG4gIH1cblxuICBnZXRTdGFydE9mQmxvY2tDb21tZW50IChzdGFydCkge1xuICAgIHdoaWxlIChzdGFydC5jb2x1bW4gPT09IDApIHtcbiAgICAgIGNvbnN0IHJhbmdlID0gdGhpcy5nZXRCbG9ja0NvbW1lbnRSYW5nZUZvclBvaW50KHN0YXJ0LnRyYW5zbGF0ZShbLTEsIEluZmluaXR5XSkpXG4gICAgICBpZiAoIXJhbmdlKSBicmVha1xuICAgICAgc3RhcnQgPSByYW5nZS5zdGFydFxuICAgIH1cbiAgICByZXR1cm4gc3RhcnRcbiAgfVxuXG4gIGdldEVuZE9mQmxvY2tDb21tZW50IChlbmQpIHtcbiAgICB3aGlsZSAodGhpcy51dGlscy5wb2ludElzQXRFbmRPZkxpbmUodGhpcy5lZGl0b3IsIGVuZCkpIHtcbiAgICAgIGNvbnN0IHJhbmdlID0gdGhpcy5nZXRCbG9ja0NvbW1lbnRSYW5nZUZvclBvaW50KFtlbmQucm93ICsgMSwgMF0pXG4gICAgICBpZiAoIXJhbmdlKSBicmVha1xuICAgICAgZW5kID0gcmFuZ2UuZW5kXG4gICAgfVxuICAgIHJldHVybiBlbmRcbiAgfVxuXG4gIGdldEJsb2NrQ29tbWVudFJhbmdlRm9yUG9pbnQgKHBvaW50KSB7XG4gICAgY29uc3Qgc2NvcGUgPSAnY29tbWVudC5ibG9jaydcbiAgICByZXR1cm4gdGhpcy5lZGl0b3IuYnVmZmVyUmFuZ2VGb3JTY29wZUF0UG9zaXRpb24oc2NvcGUsIHBvaW50KVxuICB9XG59XG5cbmNsYXNzIENvbW1lbnRPclBhcmFncmFwaCBleHRlbmRzIFRleHRPYmplY3Qge1xuICB3aXNlID0gJ2xpbmV3aXNlJ1xuXG4gIGdldFJhbmdlIChzZWxlY3Rpb24pIHtcbiAgICBjb25zdCB7aW5uZXJ9ID0gdGhpc1xuICAgIGZvciAoY29uc3Qga2xhc3Mgb2YgWydDb21tZW50JywgJ1BhcmFncmFwaCddKSB7XG4gICAgICBjb25zdCByYW5nZSA9IHRoaXMuZ2V0SW5zdGFuY2Uoa2xhc3MsIHtpbm5lcn0pLmdldFJhbmdlKHNlbGVjdGlvbilcbiAgICAgIGlmIChyYW5nZSkge1xuICAgICAgICByZXR1cm4gcmFuZ2VcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLy8gU2VjdGlvbjogRm9sZFxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgRm9sZCBleHRlbmRzIFRleHRPYmplY3Qge1xuICB3aXNlID0gJ2xpbmV3aXNlJ1xuXG4gIGdldFJhbmdlIChzZWxlY3Rpb24pIHtcbiAgICBjb25zdCB7cm93fSA9IHRoaXMuZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgIGNvbnN0IHNlbGVjdGVkUmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgIGNvbnN0IGZvbGRSYW5nZXMgPSB0aGlzLnV0aWxzLmdldENvZGVGb2xkUmFuZ2VzKHRoaXMuZWRpdG9yKVxuICAgIGNvbnN0IGZvbGRSYW5nZXNDb250YWluc0N1cnNvclJvdyA9IGZvbGRSYW5nZXMuZmlsdGVyKHJhbmdlID0+IHJhbmdlLnN0YXJ0LnJvdyA8PSByb3cgJiYgcm93IDw9IHJhbmdlLmVuZC5yb3cpXG4gICAgY29uc3QgdXNlVHJlZVNpdHRlciA9IHRoaXMudXRpbHMuaXNVc2luZ1RyZWVTaXR0ZXIoc2VsZWN0aW9uLmVkaXRvcilcblxuICAgIGZvciAobGV0IGZvbGRSYW5nZSBvZiBmb2xkUmFuZ2VzQ29udGFpbnNDdXJzb3JSb3cucmV2ZXJzZSgpKSB7XG4gICAgICBpZiAodGhpcy5pc0EoKSkge1xuICAgICAgICBmb2xkUmFuZ2UgPSB1bmlvbkNvbmpvaW5lZEZvbGRSYW5nZShmb2xkUmFuZ2UsIGZvbGRSYW5nZXMsIHt1c2VUcmVlU2l0dGVyfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLnV0aWxzLmRvZXNSYW5nZVN0YXJ0QW5kRW5kV2l0aFNhbWVJbmRlbnRMZXZlbCh0aGlzLmVkaXRvciwgZm9sZFJhbmdlKSkge1xuICAgICAgICAgIGZvbGRSYW5nZS5lbmQucm93IC09IDFcbiAgICAgICAgfVxuICAgICAgICBmb2xkUmFuZ2Uuc3RhcnQucm93ICs9IDFcbiAgICAgIH1cbiAgICAgIGZvbGRSYW5nZSA9IHRoaXMuZ2V0QnVmZmVyUmFuZ2VGb3JSb3dSYW5nZShbZm9sZFJhbmdlLnN0YXJ0LnJvdywgZm9sZFJhbmdlLmVuZC5yb3ddKVxuICAgICAgaWYgKCFzZWxlY3RlZFJhbmdlLmNvbnRhaW5zUmFuZ2UoZm9sZFJhbmdlKSkge1xuICAgICAgICByZXR1cm4gZm9sZFJhbmdlXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHVuaW9uQ29uam9pbmVkRm9sZFJhbmdlIChmb2xkUmFuZ2UsIGZvbGRSYW5nZXMsIHt1c2VUcmVlU2l0dGVyfSkge1xuICBjb25zdCBpbmRleCA9IGZvbGRSYW5nZXMuZmluZEluZGV4KHJhbmdlID0+IHJhbmdlID09PSBmb2xkUmFuZ2UpXG5cbiAgLy8gRXh0ZW5kIHRvIGRvd253YXJkc1xuICBmb3IgKGxldCBpID0gaW5kZXggKyAxOyBpIDwgZm9sZFJhbmdlcy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChmb2xkUmFuZ2UuZW5kLmNvbHVtbiAhPT0gSW5maW5pdHkpIGJyZWFrXG4gICAgY29uc3QgZW5kUm93ID0gdXNlVHJlZVNpdHRlciA/IGZvbGRSYW5nZS5lbmQucm93ICsgMSA6IGZvbGRSYW5nZS5lbmQucm93XG4gICAgaWYgKGZvbGRSYW5nZXNbaV0uc3RhcnQuaXNFcXVhbChbZW5kUm93LCBJbmZpbml0eV0pKSB7XG4gICAgICBmb2xkUmFuZ2UgPSBmb2xkUmFuZ2UudW5pb24oZm9sZFJhbmdlc1tpXSlcbiAgICB9XG4gIH1cblxuICAvLyBFeHRlbmQgdG8gdXB3YXJkc1xuICBmb3IgKGxldCBpID0gaW5kZXggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChmb2xkUmFuZ2Uuc3RhcnQuY29sdW1uICE9PSBJbmZpbml0eSkgYnJlYWtcbiAgICBjb25zdCBzdGFydFJvdyA9IHVzZVRyZWVTaXR0ZXIgPyBmb2xkUmFuZ2Uuc3RhcnQucm93IC0gMSA6IGZvbGRSYW5nZS5zdGFydC5yb3dcbiAgICBpZiAoZm9sZFJhbmdlc1tpXS5lbmQuaXNFcXVhbChbc3RhcnRSb3csIEluZmluaXR5XSkpIHtcbiAgICAgIGZvbGRSYW5nZSA9IGZvbGRSYW5nZS51bmlvbihmb2xkUmFuZ2VzW2ldKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmb2xkUmFuZ2Vcbn1cblxuY2xhc3MgRnVuY3Rpb24gZXh0ZW5kcyBUZXh0T2JqZWN0IHtcbiAgd2lzZSA9ICdsaW5ld2lzZSdcbiAgc2NvcGVOYW1lc09taXR0aW5nQ2xvc2luZ0JyYWNlID0gWydzb3VyY2UuZ28nLCAnc291cmNlLmVsaXhpciddIC8vIGxhbmd1YWdlIGRvZXNuJ3QgaW5jbHVkZSBjbG9zaW5nIGB9YCBpbnRvIGZvbGQuXG5cbiAgZ2V0RnVuY3Rpb25Cb2R5U3RhcnRSZWdleCAoe3Njb3BlTmFtZX0pIHtcbiAgICBpZiAoc2NvcGVOYW1lID09PSAnc291cmNlLnB5dGhvbicpIHtcbiAgICAgIHJldHVybiAvOiQvXG4gICAgfSBlbHNlIGlmIChzY29wZU5hbWUgPT09ICdzb3VyY2UuY29mZmVlJykge1xuICAgICAgcmV0dXJuIC8tfD0+JC9cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIC97JC9cbiAgICB9XG4gIH1cblxuICBpc011bHRpTGluZVBhcmFtZXRlckZ1bmN0aW9uUmFuZ2UgKHBhcmFtZXRlclJhbmdlLCBib2R5UmFuZ2UsIGJvZHlTdGFydFJlZ2V4KSB7XG4gICAgY29uc3QgaXNCb2R5U3RhcnRSb3cgPSByb3cgPT4gYm9keVN0YXJ0UmVnZXgudGVzdCh0aGlzLmVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cpKVxuICAgIGlmIChpc0JvZHlTdGFydFJvdyhwYXJhbWV0ZXJSYW5nZS5zdGFydC5yb3cpKSByZXR1cm4gZmFsc2VcbiAgICBpZiAoaXNCb2R5U3RhcnRSb3cocGFyYW1ldGVyUmFuZ2UuZW5kLnJvdykpIHJldHVybiBwYXJhbWV0ZXJSYW5nZS5lbmQucm93ID09PSBib2R5UmFuZ2Uuc3RhcnQucm93XG4gICAgaWYgKGlzQm9keVN0YXJ0Um93KHBhcmFtZXRlclJhbmdlLmVuZC5yb3cgKyAxKSkgcmV0dXJuIHBhcmFtZXRlclJhbmdlLmVuZC5yb3cgKyAxID09PSBib2R5UmFuZ2Uuc3RhcnQucm93XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBnZXRSYW5nZVdpdGhUcmVlU2l0dGVyIChzZWxlY3Rpb24pIHtcbiAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmVkaXRvclxuICAgIGNvbnN0IGN1cnNvclBvc2l0aW9uID0gdGhpcy5nZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbihzZWxlY3Rpb24pXG4gICAgY29uc3QgZmlyc3RDaGFyYWN0ZXJQb3NpdGlvbiA9IHRoaXMudXRpbHMuZ2V0Rmlyc3RDaGFyYWN0ZXJQb3NpdGlvbkZvckJ1ZmZlclJvdyh0aGlzLmVkaXRvciwgY3Vyc29yUG9zaXRpb24ucm93KVxuICAgIGNvbnN0IHNlYXJjaFN0YXJ0UG9pbnQgPSBQb2ludC5tYXgoZmlyc3RDaGFyYWN0ZXJQb3NpdGlvbiwgY3Vyc29yUG9zaXRpb24pXG4gICAgY29uc3Qgc3RhcnROb2RlID0gZWRpdG9yLmxhbmd1YWdlTW9kZS5nZXRTeW50YXhOb2RlQXRQb3NpdGlvbihzZWFyY2hTdGFydFBvaW50KVxuXG4gICAgY29uc3Qgbm9kZSA9IHRoaXMudXRpbHMuZmluZFBhcmVudE5vZGVGb3JGdW5jdGlvblR5cGUoZWRpdG9yLCBzdGFydE5vZGUpXG4gICAgaWYgKG5vZGUpIHtcbiAgICAgIGxldCByYW5nZSA9IG5vZGUucmFuZ2VcblxuICAgICAgaWYgKCF0aGlzLmlzQSgpKSB7XG4gICAgICAgIGNvbnN0IGJvZHlOb2RlID0gdGhpcy51dGlscy5maW5kRnVuY3Rpb25Cb2R5Tm9kZShlZGl0b3IsIG5vZGUpXG4gICAgICAgIGlmIChib2R5Tm9kZSkge1xuICAgICAgICAgIHJhbmdlID0gYm9keU5vZGUucmFuZ2VcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGVuZFJvd1RyYW5zbGF0aW9uID0gdGhpcy51dGlscy5kb2VzUmFuZ2VTdGFydEFuZEVuZFdpdGhTYW1lSW5kZW50TGV2ZWwoZWRpdG9yLCByYW5nZSkgPyAtMSA6IDBcbiAgICAgICAgcmFuZ2UgPSByYW5nZS50cmFuc2xhdGUoWzEsIDBdLCBbZW5kUm93VHJhbnNsYXRpb24sIDBdKVxuICAgICAgfVxuICAgICAgaWYgKHJhbmdlLmVuZC5jb2x1bW4gIT09IDApIHtcbiAgICAgICAgLy8gVGhlICdwcmVwcm9jX2Z1bmN0aW9uX2RlZicgdHlwZSB1c2VkIGluIEMgYW5kIEMrKyBoZWFkZXIncyBcIiNkZWZpbmVcIiByZXR1cm5zIGxpbmV3aXNlIHJhbmdlLlxuICAgICAgICAvLyBJbiB0aGlzIGNhc2UsIHdlIHNob3VsZG4ndCB0cmFuc2xhdGUgdG8gbGluZXdpc2Ugc2luY2UgaXQgYWxyZWFkeSBjb250YWlucyBlbmRpbmcgbmV3bGluZS5cbiAgICAgICAgcmFuZ2UgPSB0aGlzLnV0aWxzLmdldEJ1ZmZlclJhbmdlRm9yUm93UmFuZ2UoZWRpdG9yLCBbcmFuZ2Uuc3RhcnQucm93LCByYW5nZS5lbmQucm93XSlcbiAgICAgIH1cbiAgICAgIHJldHVybiByYW5nZVxuICAgIH1cbiAgfVxuXG4gIGdldFJhbmdlIChzZWxlY3Rpb24pIHtcbiAgICBjb25zdCB1c2VUcmVlU2l0dGVyID0gdGhpcy51dGlscy5pc1VzaW5nVHJlZVNpdHRlcihzZWxlY3Rpb24uZWRpdG9yKVxuICAgIGlmICh1c2VUcmVlU2l0dGVyKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRSYW5nZVdpdGhUcmVlU2l0dGVyKHNlbGVjdGlvbilcbiAgICB9XG5cbiAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmVkaXRvclxuICAgIGNvbnN0IGN1cnNvclJvdyA9IHRoaXMuZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKS5yb3dcbiAgICBjb25zdCBib2R5U3RhcnRSZWdleCA9IHRoaXMuZ2V0RnVuY3Rpb25Cb2R5U3RhcnRSZWdleChlZGl0b3IuZ2V0R3JhbW1hcigpKVxuICAgIGNvbnN0IGlzSW5jbHVkZUZ1bmN0aW9uU2NvcGVGb3JSb3cgPSByb3cgPT4gdGhpcy51dGlscy5pc0luY2x1ZGVGdW5jdGlvblNjb3BlRm9yUm93KGVkaXRvciwgcm93KVxuXG4gICAgY29uc3QgZnVuY3Rpb25SYW5nZXMgPSBbXVxuICAgIGNvbnN0IHNhdmVGdW5jdGlvblJhbmdlID0gKHthUmFuZ2UsIGlubmVyUmFuZ2V9KSA9PiB7XG4gICAgICBmdW5jdGlvblJhbmdlcy5wdXNoKHtcbiAgICAgICAgYVJhbmdlOiB0aGlzLmJ1aWxkQVJhbmdlKGFSYW5nZSksXG4gICAgICAgIGlubmVyUmFuZ2U6IHRoaXMuYnVpbGRJbm5lclJhbmdlKGlubmVyUmFuZ2UpXG4gICAgICB9KVxuICAgIH1cblxuICAgIGNvbnN0IGZvbGRSYW5nZXMgPSB0aGlzLnV0aWxzLmdldENvZGVGb2xkUmFuZ2VzKGVkaXRvcilcbiAgICB3aGlsZSAoZm9sZFJhbmdlcy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHJhbmdlID0gZm9sZFJhbmdlcy5zaGlmdCgpXG4gICAgICBpZiAoaXNJbmNsdWRlRnVuY3Rpb25TY29wZUZvclJvdyhyYW5nZS5zdGFydC5yb3cpKSB7XG4gICAgICAgIGNvbnN0IG5leHRSYW5nZSA9IGZvbGRSYW5nZXNbMF1cbiAgICAgICAgY29uc3QgbmV4dEZvbGRJc0Nvbm5lY3RlZCA9IG5leHRSYW5nZSAmJiBuZXh0UmFuZ2Uuc3RhcnQucm93IDw9IHJhbmdlLmVuZC5yb3cgKyAxXG4gICAgICAgIGNvbnN0IG1heWJlQUZ1bmN0aW9uUmFuZ2UgPSBuZXh0Rm9sZElzQ29ubmVjdGVkID8gcmFuZ2UudW5pb24obmV4dFJhbmdlKSA6IHJhbmdlXG4gICAgICAgIGlmICghbWF5YmVBRnVuY3Rpb25SYW5nZS5jb250YWluc1BvaW50KFtjdXJzb3JSb3csIEluZmluaXR5XSkpIGNvbnRpbnVlIC8vIHNraXAgdG8gYXZvaWQgaGVhdnkgY29tcHV0YXRpb25cbiAgICAgICAgaWYgKG5leHRGb2xkSXNDb25uZWN0ZWQgJiYgdGhpcy5pc011bHRpTGluZVBhcmFtZXRlckZ1bmN0aW9uUmFuZ2UocmFuZ2UsIG5leHRSYW5nZSwgYm9keVN0YXJ0UmVnZXgpKSB7XG4gICAgICAgICAgY29uc3QgYm9keVJhbmdlID0gZm9sZFJhbmdlcy5zaGlmdCgpXG4gICAgICAgICAgc2F2ZUZ1bmN0aW9uUmFuZ2Uoe2FSYW5nZTogcmFuZ2UudW5pb24oYm9keVJhbmdlKSwgaW5uZXJSYW5nZTogYm9keVJhbmdlfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzYXZlRnVuY3Rpb25SYW5nZSh7YVJhbmdlOiByYW5nZSwgaW5uZXJSYW5nZTogcmFuZ2V9KVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwcmV2aW91c1JvdyA9IHJhbmdlLnN0YXJ0LnJvdyAtIDFcbiAgICAgICAgaWYgKHByZXZpb3VzUm93IDwgMCkgY29udGludWVcbiAgICAgICAgaWYgKGVkaXRvci5pc0ZvbGRhYmxlQXRCdWZmZXJSb3cocHJldmlvdXNSb3cpKSBjb250aW51ZVxuICAgICAgICBjb25zdCBtYXliZUFGdW5jdGlvblJhbmdlID0gcmFuZ2UudW5pb24oZWRpdG9yLmJ1ZmZlclJhbmdlRm9yQnVmZmVyUm93KHByZXZpb3VzUm93KSlcbiAgICAgICAgaWYgKCFtYXliZUFGdW5jdGlvblJhbmdlLmNvbnRhaW5zUG9pbnQoW2N1cnNvclJvdywgSW5maW5pdHldKSkgY29udGludWUgLy8gc2tpcCB0byBhdm9pZCBoZWF2eSBjb21wdXRhdGlvblxuXG4gICAgICAgIGNvbnN0IGlzQm9keVN0YXJ0T25seVJvdyA9IHJvdyA9PlxuICAgICAgICAgIG5ldyBSZWdFeHAoJ15cXFxccyonICsgYm9keVN0YXJ0UmVnZXguc291cmNlKS50ZXN0KGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cpKVxuICAgICAgICBpZiAoaXNCb2R5U3RhcnRPbmx5Um93KHJhbmdlLnN0YXJ0LnJvdykgJiYgaXNJbmNsdWRlRnVuY3Rpb25TY29wZUZvclJvdyhwcmV2aW91c1JvdykpIHtcbiAgICAgICAgICBzYXZlRnVuY3Rpb25SYW5nZSh7YVJhbmdlOiBtYXliZUFGdW5jdGlvblJhbmdlLCBpbm5lclJhbmdlOiByYW5nZX0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGZ1bmN0aW9uUmFuZ2Ugb2YgZnVuY3Rpb25SYW5nZXMucmV2ZXJzZSgpKSB7XG4gICAgICBjb25zdCB7c3RhcnQsIGVuZH0gPSB0aGlzLmlzQSgpID8gZnVuY3Rpb25SYW5nZS5hUmFuZ2UgOiBmdW5jdGlvblJhbmdlLmlubmVyUmFuZ2VcbiAgICAgIGNvbnN0IHJhbmdlID0gdGhpcy5nZXRCdWZmZXJSYW5nZUZvclJvd1JhbmdlKFtzdGFydC5yb3csIGVuZC5yb3ddKVxuICAgICAgaWYgKCFzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKS5jb250YWluc1JhbmdlKHJhbmdlKSkgcmV0dXJuIHJhbmdlXG4gICAgfVxuICB9XG5cbiAgYnVpbGRJbm5lclJhbmdlIChyYW5nZSkge1xuICAgIGNvbnN0IGVuZFJvd1RyYW5zbGF0aW9uID0gdGhpcy51dGlscy5kb2VzUmFuZ2VTdGFydEFuZEVuZFdpdGhTYW1lSW5kZW50TGV2ZWwodGhpcy5lZGl0b3IsIHJhbmdlKSA/IC0xIDogMFxuICAgIHJldHVybiByYW5nZS50cmFuc2xhdGUoWzEsIDBdLCBbZW5kUm93VHJhbnNsYXRpb24sIDBdKVxuICB9XG5cbiAgYnVpbGRBUmFuZ2UgKHJhbmdlKSB7XG4gICAgLy8gTk9URTogVGhpcyBhZGp1c3RtZW50IHNob3VkIG5vdCBiZSBuZWNlc3NhcnkgaWYgbGFuZ3VhZ2Utc3ludGF4IGlzIHByb3Blcmx5IGRlZmluZWQuXG4gICAgY29uc3QgZW5kUm93VHJhbnNsYXRpb24gPSB0aGlzLmlzR3JhbW1hckRvZXNOb3RGb2xkQ2xvc2luZ1JvdygpID8gKzEgOiAwXG4gICAgcmV0dXJuIHJhbmdlLnRyYW5zbGF0ZShbMCwgMF0sIFtlbmRSb3dUcmFuc2xhdGlvbiwgMF0pXG4gIH1cblxuICBpc0dyYW1tYXJEb2VzTm90Rm9sZENsb3NpbmdSb3cgKCkge1xuICAgIGNvbnN0IHtzY29wZU5hbWUsIHBhY2thZ2VOYW1lfSA9IHRoaXMuZWRpdG9yLmdldEdyYW1tYXIoKVxuICAgIGlmICh0aGlzLnNjb3BlTmFtZXNPbWl0dGluZ0Nsb3NpbmdCcmFjZS5pbmNsdWRlcyhzY29wZU5hbWUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBIQUNLOiBSdXN0IGhhdmUgdHdvIHBhY2thZ2UgYGxhbmd1YWdlLXJ1c3RgIGFuZCBgYXRvbS1sYW5ndWFnZS1ydXN0YFxuICAgICAgLy8gbGFuZ3VhZ2UtcnVzdCBkb24ndCBmb2xkIGVuZGluZyBgfWAsIGJ1dCBhdG9tLWxhbmd1YWdlLXJ1c3QgZG9lcy5cbiAgICAgIHJldHVybiBzY29wZU5hbWUgPT09ICdzb3VyY2UucnVzdCcgJiYgcGFja2FnZU5hbWUgPT09ICdsYW5ndWFnZS1ydXN0J1xuICAgIH1cbiAgfVxufVxuXG4vLyBTZWN0aW9uOiBPdGhlclxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgQXJndW1lbnRzIGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIG5ld0FyZ0luZm8gKGFyZ1N0YXJ0LCBhcmcsIHNlcGFyYXRvcikge1xuICAgIGNvbnN0IGFyZ0VuZCA9IHRoaXMudXRpbHMudHJhdmVyc2VUZXh0RnJvbVBvaW50KGFyZ1N0YXJ0LCBhcmcpXG4gICAgY29uc3QgYXJnUmFuZ2UgPSBuZXcgUmFuZ2UoYXJnU3RhcnQsIGFyZ0VuZClcblxuICAgIGNvbnN0IHNlcGFyYXRvckVuZCA9IHRoaXMudXRpbHMudHJhdmVyc2VUZXh0RnJvbVBvaW50KGFyZ0VuZCwgc2VwYXJhdG9yICE9IG51bGwgPyBzZXBhcmF0b3IgOiAnJylcbiAgICBjb25zdCBzZXBhcmF0b3JSYW5nZSA9IG5ldyBSYW5nZShhcmdFbmQsIHNlcGFyYXRvckVuZClcblxuICAgIGNvbnN0IGlubmVyUmFuZ2UgPSBhcmdSYW5nZVxuICAgIGNvbnN0IGFSYW5nZSA9IGFyZ1JhbmdlLnVuaW9uKHNlcGFyYXRvclJhbmdlKVxuICAgIHJldHVybiB7YXJnUmFuZ2UsIHNlcGFyYXRvclJhbmdlLCBpbm5lclJhbmdlLCBhUmFuZ2V9XG4gIH1cblxuICBnZXRBcmd1bWVudHNSYW5nZUZvclNlbGVjdGlvbiAoc2VsZWN0aW9uKSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgIG1lbWJlcjogWydDdXJseUJyYWNrZXQnLCAnU3F1YXJlQnJhY2tldCcsICdQYXJlbnRoZXNpcyddLFxuICAgICAgaW5jbHVzaXZlOiBmYWxzZVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5nZXRJbnN0YW5jZSgnSW5uZXJBbnlQYWlyJywgb3B0aW9ucykuZ2V0UmFuZ2Uoc2VsZWN0aW9uKVxuICB9XG5cbiAgZ2V0UmFuZ2UgKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IHtzcGxpdEFyZ3VtZW50cywgdHJhdmVyc2VUZXh0RnJvbVBvaW50LCBnZXRMYXN0fSA9IHRoaXMudXRpbHNcbiAgICBsZXQgcmFuZ2UgPSB0aGlzLmdldEFyZ3VtZW50c1JhbmdlRm9yU2VsZWN0aW9uKHNlbGVjdGlvbilcbiAgICBjb25zdCBwYWlyUmFuZ2VGb3VuZCA9IHJhbmdlICE9IG51bGxcblxuICAgIHJhbmdlID0gcmFuZ2UgfHwgdGhpcy5nZXRJbnN0YW5jZSgnSW5uZXJDdXJyZW50TGluZScpLmdldFJhbmdlKHNlbGVjdGlvbikgLy8gZmFsbGJhY2tcbiAgICBpZiAoIXJhbmdlKSByZXR1cm5cblxuICAgIHJhbmdlID0gdGhpcy50cmltQnVmZmVyUmFuZ2UocmFuZ2UpXG5cbiAgICBjb25zdCB0ZXh0ID0gdGhpcy5lZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UpXG4gICAgY29uc3QgYWxsVG9rZW5zID0gc3BsaXRBcmd1bWVudHModGV4dCwgcGFpclJhbmdlRm91bmQpXG5cbiAgICBjb25zdCBhcmdJbmZvcyA9IFtdXG4gICAgbGV0IGFyZ1N0YXJ0ID0gcmFuZ2Uuc3RhcnRcblxuICAgIC8vIFNraXAgc3RhcnRpbmcgc2VwYXJhdG9yXG4gICAgaWYgKGFsbFRva2Vucy5sZW5ndGggJiYgYWxsVG9rZW5zWzBdLnR5cGUgPT09ICdzZXBhcmF0b3InKSB7XG4gICAgICBjb25zdCB0b2tlbiA9IGFsbFRva2Vucy5zaGlmdCgpXG4gICAgICBhcmdTdGFydCA9IHRyYXZlcnNlVGV4dEZyb21Qb2ludChhcmdTdGFydCwgdG9rZW4udGV4dClcbiAgICB9XG5cbiAgICB3aGlsZSAoYWxsVG9rZW5zLmxlbmd0aCkge1xuICAgICAgY29uc3QgdG9rZW4gPSBhbGxUb2tlbnMuc2hpZnQoKVxuICAgICAgaWYgKHRva2VuLnR5cGUgPT09ICdhcmd1bWVudCcpIHtcbiAgICAgICAgY29uc3QgbmV4dFRva2VuID0gYWxsVG9rZW5zLnNoaWZ0KClcbiAgICAgICAgY29uc3Qgc2VwYXJhdG9yID0gbmV4dFRva2VuID8gbmV4dFRva2VuLnRleHQgOiB1bmRlZmluZWRcbiAgICAgICAgY29uc3QgYXJnSW5mbyA9IHRoaXMubmV3QXJnSW5mbyhhcmdTdGFydCwgdG9rZW4udGV4dCwgc2VwYXJhdG9yKVxuXG4gICAgICAgIGlmIChhbGxUb2tlbnMubGVuZ3RoID09PSAwICYmIGFyZ0luZm9zLmxlbmd0aCkge1xuICAgICAgICAgIGFyZ0luZm8uYVJhbmdlID0gYXJnSW5mby5hcmdSYW5nZS51bmlvbihnZXRMYXN0KGFyZ0luZm9zKS5zZXBhcmF0b3JSYW5nZSlcbiAgICAgICAgfVxuXG4gICAgICAgIGFyZ1N0YXJ0ID0gYXJnSW5mby5hUmFuZ2UuZW5kXG4gICAgICAgIGFyZ0luZm9zLnB1c2goYXJnSW5mbylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignbXVzdCBub3QgaGFwcGVuJylcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBwb2ludCA9IHRoaXMuZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgIGZvciAoY29uc3Qge2lubmVyUmFuZ2UsIGFSYW5nZX0gb2YgYXJnSW5mb3MpIHtcbiAgICAgIGlmIChpbm5lclJhbmdlLmVuZC5pc0dyZWF0ZXJUaGFuT3JFcXVhbChwb2ludCkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNJbm5lcigpID8gaW5uZXJSYW5nZSA6IGFSYW5nZVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBDdXJyZW50TGluZSBleHRlbmRzIFRleHRPYmplY3Qge1xuICBnZXRSYW5nZSAoc2VsZWN0aW9uKSB7XG4gICAgY29uc3Qge3Jvd30gPSB0aGlzLmdldEN1cnNvclBvc2l0aW9uRm9yU2VsZWN0aW9uKHNlbGVjdGlvbilcbiAgICBjb25zdCByYW5nZSA9IHRoaXMuZWRpdG9yLmJ1ZmZlclJhbmdlRm9yQnVmZmVyUm93KHJvdylcbiAgICByZXR1cm4gdGhpcy5pc0EoKSA/IHJhbmdlIDogdGhpcy50cmltQnVmZmVyUmFuZ2UocmFuZ2UpXG4gIH1cbn1cblxuY2xhc3MgRW50aXJlIGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIHdpc2UgPSAnbGluZXdpc2UnXG4gIHNlbGVjdE9uY2UgPSB0cnVlXG5cbiAgZ2V0UmFuZ2UgKHNlbGVjdGlvbikge1xuICAgIHJldHVybiB0aGlzLmVkaXRvci5idWZmZXIuZ2V0UmFuZ2UoKVxuICB9XG59XG5cbmNsYXNzIEVtcHR5IGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIHN0YXRpYyBjb21tYW5kID0gZmFsc2VcbiAgc2VsZWN0T25jZSA9IHRydWVcbn1cblxuY2xhc3MgTGF0ZXN0Q2hhbmdlIGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIHdpc2UgPSBudWxsXG4gIHNlbGVjdE9uY2UgPSB0cnVlXG4gIGdldFJhbmdlIChzZWxlY3Rpb24pIHtcbiAgICBjb25zdCBzdGFydCA9IHRoaXMudmltU3RhdGUubWFyay5nZXQoJ1snKVxuICAgIGNvbnN0IGVuZCA9IHRoaXMudmltU3RhdGUubWFyay5nZXQoJ10nKVxuICAgIGlmIChzdGFydCAmJiBlbmQpIHtcbiAgICAgIHJldHVybiBuZXcgUmFuZ2Uoc3RhcnQsIGVuZClcbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgU2VhcmNoTWF0Y2hGb3J3YXJkIGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIGJhY2t3YXJkID0gZmFsc2VcblxuICBmaW5kTWF0Y2ggKGZyb20sIHJlZ2V4KSB7XG4gICAgaWYgKHRoaXMuYmFja3dhcmQpIHtcbiAgICAgIGlmICh0aGlzLm1vZGUgPT09ICd2aXN1YWwnKSB7XG4gICAgICAgIGZyb20gPSB0aGlzLnV0aWxzLnRyYW5zbGF0ZVBvaW50QW5kQ2xpcCh0aGlzLmVkaXRvciwgZnJvbSwgJ2JhY2t3YXJkJylcbiAgICAgIH1cblxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtmcm9tOiBbZnJvbS5yb3csIEluZmluaXR5XX1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJhbmdlOiB0aGlzLmZpbmRJbkVkaXRvcignYmFja3dhcmQnLCByZWdleCwgb3B0aW9ucywgKHtyYW5nZX0pID0+IHJhbmdlLnN0YXJ0LmlzTGVzc1RoYW4oZnJvbSkgJiYgcmFuZ2UpLFxuICAgICAgICB3aGljaElzSGVhZDogJ3N0YXJ0J1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5tb2RlID09PSAndmlzdWFsJykge1xuICAgICAgICBmcm9tID0gdGhpcy51dGlscy50cmFuc2xhdGVQb2ludEFuZENsaXAodGhpcy5lZGl0b3IsIGZyb20sICdmb3J3YXJkJylcbiAgICAgIH1cblxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtmcm9tOiBbZnJvbS5yb3csIDBdfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmFuZ2U6IHRoaXMuZmluZEluRWRpdG9yKCdmb3J3YXJkJywgcmVnZXgsIG9wdGlvbnMsICh7cmFuZ2V9KSA9PiByYW5nZS5lbmQuaXNHcmVhdGVyVGhhbihmcm9tKSAmJiByYW5nZSksXG4gICAgICAgIHdoaWNoSXNIZWFkOiAnZW5kJ1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldFJhbmdlIChzZWxlY3Rpb24pIHtcbiAgICBjb25zdCBwYXR0ZXJuID0gdGhpcy5nbG9iYWxTdGF0ZS5nZXQoJ2xhc3RTZWFyY2hQYXR0ZXJuJylcbiAgICBpZiAoIXBhdHRlcm4pIHJldHVyblxuXG4gICAgY29uc3QgZnJvbVBvaW50ID0gc2VsZWN0aW9uLmdldEhlYWRCdWZmZXJQb3NpdGlvbigpXG4gICAgY29uc3Qge3JhbmdlLCB3aGljaElzSGVhZH0gPSB0aGlzLmZpbmRNYXRjaChmcm9tUG9pbnQsIHBhdHRlcm4pXG4gICAgaWYgKHJhbmdlKSB7XG4gICAgICByZXR1cm4gdGhpcy51bmlvblJhbmdlQW5kRGV0ZXJtaW5lUmV2ZXJzZWRTdGF0ZShzZWxlY3Rpb24sIHJhbmdlLCB3aGljaElzSGVhZClcbiAgICB9XG4gIH1cblxuICB1bmlvblJhbmdlQW5kRGV0ZXJtaW5lUmV2ZXJzZWRTdGF0ZSAoc2VsZWN0aW9uLCByYW5nZSwgd2hpY2hJc0hlYWQpIHtcbiAgICBpZiAoc2VsZWN0aW9uLmlzRW1wdHkoKSkgcmV0dXJuIHJhbmdlXG5cbiAgICBsZXQgaGVhZCA9IHJhbmdlW3doaWNoSXNIZWFkXVxuICAgIGNvbnN0IHRhaWwgPSBzZWxlY3Rpb24uZ2V0VGFpbEJ1ZmZlclBvc2l0aW9uKClcblxuICAgIGlmICh0aGlzLmJhY2t3YXJkKSB7XG4gICAgICBpZiAodGFpbC5pc0xlc3NUaGFuKGhlYWQpKSBoZWFkID0gdGhpcy51dGlscy50cmFuc2xhdGVQb2ludEFuZENsaXAodGhpcy5lZGl0b3IsIGhlYWQsICdmb3J3YXJkJylcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGhlYWQuaXNMZXNzVGhhbih0YWlsKSkgaGVhZCA9IHRoaXMudXRpbHMudHJhbnNsYXRlUG9pbnRBbmRDbGlwKHRoaXMuZWRpdG9yLCBoZWFkLCAnYmFja3dhcmQnKVxuICAgIH1cblxuICAgIHRoaXMucmV2ZXJzZWQgPSBoZWFkLmlzTGVzc1RoYW4odGFpbClcbiAgICByZXR1cm4gbmV3IFJhbmdlKHRhaWwsIGhlYWQpLnVuaW9uKHRoaXMuc3dyYXAoc2VsZWN0aW9uKS5nZXRUYWlsQnVmZmVyUmFuZ2UoKSlcbiAgfVxuXG4gIHNlbGVjdFRleHRPYmplY3QgKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IHJhbmdlID0gdGhpcy5nZXRSYW5nZShzZWxlY3Rpb24pXG4gICAgaWYgKHJhbmdlKSB7XG4gICAgICB0aGlzLnN3cmFwKHNlbGVjdGlvbikuc2V0QnVmZmVyUmFuZ2UocmFuZ2UsIHtyZXZlcnNlZDogdGhpcy5yZXZlcnNlZCAhPSBudWxsID8gdGhpcy5yZXZlcnNlZCA6IHRoaXMuYmFja3dhcmR9KVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgU2VhcmNoTWF0Y2hCYWNrd2FyZCBleHRlbmRzIFNlYXJjaE1hdGNoRm9yd2FyZCB7XG4gIGJhY2t3YXJkID0gdHJ1ZVxufVxuXG4vLyBbTGltaXRhdGlvbjogd29uJ3QgZml4XTogU2VsZWN0ZWQgcmFuZ2UgaXMgbm90IHN1Ym1vZGUgYXdhcmUuIGFsd2F5cyBjaGFyYWN0ZXJ3aXNlLlxuLy8gU28gZXZlbiBpZiBvcmlnaW5hbCBzZWxlY3Rpb24gd2FzIHZMIG9yIHZCLCBzZWxlY3RlZCByYW5nZSBieSB0aGlzIHRleHQtb2JqZWN0XG4vLyBpcyBhbHdheXMgdkMgcmFuZ2UuXG5jbGFzcyBQcmV2aW91c1NlbGVjdGlvbiBleHRlbmRzIFRleHRPYmplY3Qge1xuICB3aXNlID0gbnVsbFxuICBzZWxlY3RPbmNlID0gdHJ1ZVxuXG4gIHNlbGVjdFRleHRPYmplY3QgKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IHtwcm9wZXJ0aWVzLCBzdWJtb2RlfSA9IHRoaXMudmltU3RhdGUucHJldmlvdXNTZWxlY3Rpb25cbiAgICBpZiAocHJvcGVydGllcyAmJiBzdWJtb2RlKSB7XG4gICAgICB0aGlzLndpc2UgPSBzdWJtb2RlXG4gICAgICB0aGlzLnN3cmFwKHRoaXMuZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKSkuc2VsZWN0QnlQcm9wZXJ0aWVzKHByb3BlcnRpZXMpXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBQZXJzaXN0ZW50U2VsZWN0aW9uIGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIHdpc2UgPSBudWxsXG4gIHNlbGVjdE9uY2UgPSB0cnVlXG5cbiAgc2VsZWN0VGV4dE9iamVjdCAoc2VsZWN0aW9uKSB7XG4gICAgaWYgKHRoaXMudmltU3RhdGUuaGFzUGVyc2lzdGVudFNlbGVjdGlvbnMoKSkge1xuICAgICAgdGhpcy5wZXJzaXN0ZW50U2VsZWN0aW9uLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2VzKClcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG59XG5cbi8vIFVzZWQgb25seSBieSBSZXBsYWNlV2l0aFJlZ2lzdGVyIGFuZCBQdXRCZWZvcmUgYW5kIGl0cycgY2hpbGRyZW4uXG5jbGFzcyBMYXN0UGFzdGVkUmFuZ2UgZXh0ZW5kcyBUZXh0T2JqZWN0IHtcbiAgc3RhdGljIGNvbW1hbmQgPSBmYWxzZVxuICB3aXNlID0gbnVsbFxuICBzZWxlY3RPbmNlID0gdHJ1ZVxuXG4gIHNlbGVjdFRleHRPYmplY3QgKHNlbGVjdGlvbikge1xuICAgIGZvciAoc2VsZWN0aW9uIG9mIHRoaXMuZWRpdG9yLmdldFNlbGVjdGlvbnMoKSkge1xuICAgICAgY29uc3QgcmFuZ2UgPSB0aGlzLnZpbVN0YXRlLnNlcXVlbnRpYWxQYXN0ZU1hbmFnZXIuZ2V0UGFzdGVkUmFuZ2VGb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgICAgc2VsZWN0aW9uLnNldEJ1ZmZlclJhbmdlKHJhbmdlKVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG59XG5cbmNsYXNzIFZpc2libGVBcmVhIGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIHNlbGVjdE9uY2UgPSB0cnVlXG5cbiAgZ2V0UmFuZ2UgKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IFtzdGFydFJvdywgZW5kUm93XSA9IHRoaXMuZWRpdG9yLmdldFZpc2libGVSb3dSYW5nZSgpXG4gICAgcmV0dXJuIHRoaXMuZWRpdG9yLmJ1ZmZlclJhbmdlRm9yU2NyZWVuUmFuZ2UoW1tzdGFydFJvdywgMF0sIFtlbmRSb3csIEluZmluaXR5XV0pXG4gIH1cbn1cblxuY2xhc3MgRGlmZkh1bmsgZXh0ZW5kcyBUZXh0T2JqZWN0IHtcbiAgd2lzZSA9ICdsaW5ld2lzZSdcbiAgc2VsZWN0T25jZSA9IHRydWVcbiAgZ2V0UmFuZ2UgKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IHJvdyA9IHRoaXMuZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKS5yb3dcbiAgICByZXR1cm4gdGhpcy51dGlscy5nZXRIdW5rUmFuZ2VBdEJ1ZmZlclJvdyh0aGlzLmVkaXRvciwgcm93KVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmFzc2lnbihcbiAge1xuICAgIFRleHRPYmplY3QsXG4gICAgV29yZCxcbiAgICBXaG9sZVdvcmQsXG4gICAgU21hcnRXb3JkLFxuICAgIFN1YndvcmQsXG4gICAgUGFpcixcbiAgICBBUGFpcixcbiAgICBBbnlQYWlyLFxuICAgIEFueVBhaXJBbGxvd0ZvcndhcmRpbmcsXG4gICAgQW55UXVvdGUsXG4gICAgUXVvdGUsXG4gICAgRG91YmxlUXVvdGUsXG4gICAgU2luZ2xlUXVvdGUsXG4gICAgQmFja1RpY2ssXG4gICAgQ3VybHlCcmFja2V0LFxuICAgIFNxdWFyZUJyYWNrZXQsXG4gICAgUGFyZW50aGVzaXMsXG4gICAgQW5nbGVCcmFja2V0LFxuICAgIFRhZyxcbiAgICBQYXJhZ3JhcGgsXG4gICAgSW5kZW50YXRpb24sXG4gICAgQ29tbWVudCxcbiAgICBDb21tZW50T3JQYXJhZ3JhcGgsXG4gICAgRm9sZCxcbiAgICBGdW5jdGlvbixcbiAgICBBcmd1bWVudHMsXG4gICAgQ3VycmVudExpbmUsXG4gICAgRW50aXJlLFxuICAgIEVtcHR5LFxuICAgIExhdGVzdENoYW5nZSxcbiAgICBTZWFyY2hNYXRjaEZvcndhcmQsXG4gICAgU2VhcmNoTWF0Y2hCYWNrd2FyZCxcbiAgICBQcmV2aW91c1NlbGVjdGlvbixcbiAgICBQZXJzaXN0ZW50U2VsZWN0aW9uLFxuICAgIExhc3RQYXN0ZWRSYW5nZSxcbiAgICBWaXNpYmxlQXJlYVxuICB9LFxuICBXb3JkLmRlcml2ZUNsYXNzKHRydWUpLFxuICBXaG9sZVdvcmQuZGVyaXZlQ2xhc3ModHJ1ZSksXG4gIFNtYXJ0V29yZC5kZXJpdmVDbGFzcyh0cnVlKSxcbiAgU3Vid29yZC5kZXJpdmVDbGFzcyh0cnVlKSxcbiAgQW55UGFpci5kZXJpdmVDbGFzcyh0cnVlKSxcbiAgQW55UGFpckFsbG93Rm9yd2FyZGluZy5kZXJpdmVDbGFzcyh0cnVlKSxcbiAgQW55UXVvdGUuZGVyaXZlQ2xhc3ModHJ1ZSksXG4gIERvdWJsZVF1b3RlLmRlcml2ZUNsYXNzKHRydWUpLFxuICBTaW5nbGVRdW90ZS5kZXJpdmVDbGFzcyh0cnVlKSxcbiAgQmFja1RpY2suZGVyaXZlQ2xhc3ModHJ1ZSksXG4gIEN1cmx5QnJhY2tldC5kZXJpdmVDbGFzcyh0cnVlLCB0cnVlKSxcbiAgU3F1YXJlQnJhY2tldC5kZXJpdmVDbGFzcyh0cnVlLCB0cnVlKSxcbiAgUGFyZW50aGVzaXMuZGVyaXZlQ2xhc3ModHJ1ZSwgdHJ1ZSksXG4gIEFuZ2xlQnJhY2tldC5kZXJpdmVDbGFzcyh0cnVlLCB0cnVlKSxcbiAgVGFnLmRlcml2ZUNsYXNzKHRydWUpLFxuICBQYXJhZ3JhcGguZGVyaXZlQ2xhc3ModHJ1ZSksXG4gIEluZGVudGF0aW9uLmRlcml2ZUNsYXNzKHRydWUpLFxuICBDb21tZW50LmRlcml2ZUNsYXNzKHRydWUpLFxuICBCbG9ja0NvbW1lbnQuZGVyaXZlQ2xhc3ModHJ1ZSksXG4gIENvbW1lbnRPclBhcmFncmFwaC5kZXJpdmVDbGFzcyh0cnVlKSxcbiAgRm9sZC5kZXJpdmVDbGFzcyh0cnVlKSxcbiAgRnVuY3Rpb24uZGVyaXZlQ2xhc3ModHJ1ZSksXG4gIEFyZ3VtZW50cy5kZXJpdmVDbGFzcyh0cnVlKSxcbiAgQ3VycmVudExpbmUuZGVyaXZlQ2xhc3ModHJ1ZSksXG4gIEVudGlyZS5kZXJpdmVDbGFzcyh0cnVlKSxcbiAgTGF0ZXN0Q2hhbmdlLmRlcml2ZUNsYXNzKHRydWUpLFxuICBQZXJzaXN0ZW50U2VsZWN0aW9uLmRlcml2ZUNsYXNzKHRydWUpLFxuICBWaXNpYmxlQXJlYS5kZXJpdmVDbGFzcyh0cnVlKSxcbiAgRGlmZkh1bmsuZGVyaXZlQ2xhc3ModHJ1ZSlcbilcbiJdfQ==