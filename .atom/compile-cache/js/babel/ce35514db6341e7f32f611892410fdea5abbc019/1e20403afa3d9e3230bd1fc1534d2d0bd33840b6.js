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

var CommentOrParagraph = (function (_TextObject5) {
  _inherits(CommentOrParagraph, _TextObject5);

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

var Fold = (function (_TextObject6) {
  _inherits(Fold, _TextObject6);

  function Fold() {
    _classCallCheck(this, Fold);

    _get(Object.getPrototypeOf(Fold.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'linewise';
  }

  _createClass(Fold, [{
    key: 'getRange',
    value: function getRange(selection) {
      var _this5 = this;

      var _getCursorPositionForSelection2 = this.getCursorPositionForSelection(selection);

      var row = _getCursorPositionForSelection2.row;

      var selectedRange = selection.getBufferRange();

      var foldRanges = this.utils.getCodeFoldRanges(this.editor);
      var foldRangesContainsCursorRow = foldRanges.filter(function (range) {
        return range.start.row <= row && row <= range.end.row;
      });

      var _loop = function (_foldRange) {
        if (_this5.isA()) {
          var conjoined = undefined;
          while (conjoined = foldRanges.find(function (range) {
            return range.end.row === _foldRange.start.row;
          })) {
            _foldRange = _foldRange.union(conjoined);
          }
          while (conjoined = foldRanges.find(function (range) {
            return range.start.row === _foldRange.end.row;
          })) {
            _foldRange = _foldRange.union(conjoined);
          }
        } else {
          if (_this5.utils.doesRangeStartAndEndWithSameIndentLevel(_this5.editor, _foldRange)) {
            _foldRange.end.row -= 1;
          }
          _foldRange.start.row += 1;
        }
        _foldRange = _this5.getBufferRangeForRowRange([_foldRange.start.row, _foldRange.end.row]);
        if (!selectedRange.containsRange(_foldRange)) {
          return {
            v: _foldRange
          };
        }
        foldRange = _foldRange;
      };

      for (var foldRange of foldRangesContainsCursorRow.reverse()) {
        var _ret2 = _loop(foldRange);

        if (typeof _ret2 === 'object') return _ret2.v;
      }
    }
  }]);

  return Fold;
})(TextObject);

var Function = (function (_TextObject7) {
  _inherits(Function, _TextObject7);

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

    value: function getFunctionBodyStartRegex(_ref5) {
      var scopeName = _ref5.scopeName;

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
      var _this6 = this;

      var isBodyStartRow = function isBodyStartRow(row) {
        return bodyStartRegex.test(_this6.editor.lineTextForBufferRow(row));
      };
      if (isBodyStartRow(parameterRange.start.row)) return false;
      if (isBodyStartRow(parameterRange.end.row)) return parameterRange.end.row === bodyRange.start.row;
      if (isBodyStartRow(parameterRange.end.row + 1)) return parameterRange.end.row + 1 === bodyRange.start.row;
      return false;
    }
  }, {
    key: 'getRange',
    value: function getRange(selection) {
      var _this7 = this;

      var editor = this.editor;
      var cursorRow = this.getCursorPositionForSelection(selection).row;
      var bodyStartRegex = this.getFunctionBodyStartRegex(editor.getGrammar());
      var isIncludeFunctionScopeForRow = function isIncludeFunctionScopeForRow(row) {
        return _this7.utils.isIncludeFunctionScopeForRow(editor, row);
      };

      var functionRanges = [];
      var saveFunctionRange = function saveFunctionRange(_ref6) {
        var aRange = _ref6.aRange;
        var innerRange = _ref6.innerRange;

        functionRanges.push({
          aRange: _this7.buildARange(aRange),
          innerRange: _this7.buildInnerRange(innerRange)
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
        var _ref7 = this.isA() ? functionRange.aRange : functionRange.innerRange;

        var start = _ref7.start;
        var end = _ref7.end;

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

var Arguments = (function (_TextObject8) {
  _inherits(Arguments, _TextObject8);

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
      for (var _ref82 of argInfos) {
        var innerRange = _ref82.innerRange;
        var aRange = _ref82.aRange;

        if (innerRange.end.isGreaterThanOrEqual(point)) {
          return this.isInner() ? innerRange : aRange;
        }
      }
    }
  }]);

  return Arguments;
})(TextObject);

var CurrentLine = (function (_TextObject9) {
  _inherits(CurrentLine, _TextObject9);

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

var Entire = (function (_TextObject10) {
  _inherits(Entire, _TextObject10);

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

var Empty = (function (_TextObject11) {
  _inherits(Empty, _TextObject11);

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

var LatestChange = (function (_TextObject12) {
  _inherits(LatestChange, _TextObject12);

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

var SearchMatchForward = (function (_TextObject13) {
  _inherits(SearchMatchForward, _TextObject13);

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
          range: this.findInEditor('backward', regex, options, function (_ref9) {
            var range = _ref9.range;
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
          range: this.findInEditor('forward', regex, options, function (_ref10) {
            var range = _ref10.range;
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

var PreviousSelection = (function (_TextObject14) {
  _inherits(PreviousSelection, _TextObject14);

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

var PersistentSelection = (function (_TextObject15) {
  _inherits(PersistentSelection, _TextObject15);

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

var LastPastedRange = (function (_TextObject16) {
  _inherits(LastPastedRange, _TextObject16);

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

var VisibleArea = (function (_TextObject17) {
  _inherits(VisibleArea, _TextObject17);

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

var DiffHunk = (function (_TextObject18) {
  _inherits(DiffHunk, _TextObject18);

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
}, Word.deriveClass(true), WholeWord.deriveClass(true), SmartWord.deriveClass(true), Subword.deriveClass(true), AnyPair.deriveClass(true), AnyPairAllowForwarding.deriveClass(true), AnyQuote.deriveClass(true), DoubleQuote.deriveClass(true), SingleQuote.deriveClass(true), BackTick.deriveClass(true), CurlyBracket.deriveClass(true, true), SquareBracket.deriveClass(true, true), Parenthesis.deriveClass(true, true), AngleBracket.deriveClass(true, true), Tag.deriveClass(true), Paragraph.deriveClass(true), Indentation.deriveClass(true), Comment.deriveClass(true), CommentOrParagraph.deriveClass(true), Fold.deriveClass(true), Function.deriveClass(true), Arguments.deriveClass(true), CurrentLine.deriveClass(true), Entire.deriveClass(true), LatestChange.deriveClass(true), PersistentSelection.deriveClass(true), VisibleArea.deriveClass(true), DiffHunk.deriveClass(true));
// FIXME #472, #66
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3l1YW5zaGVuLy5hdG9tL3BhY2thZ2VzL3ZpbS1tb2RlLXBsdXMvbGliL3RleHQtb2JqZWN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQTs7Ozs7Ozs7Ozs7O2VBRVksT0FBTyxDQUFDLE1BQU0sQ0FBQzs7SUFBL0IsS0FBSyxZQUFMLEtBQUs7SUFBRSxLQUFLLFlBQUwsS0FBSzs7Ozs7QUFLbkIsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFBO0FBQzlCLElBQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQTs7SUFFckMsVUFBVTtZQUFWLFVBQVU7O1dBQVYsVUFBVTswQkFBVixVQUFVOzsrQkFBVixVQUFVOztTQUlkLFFBQVEsR0FBRyxJQUFJO1NBQ2YsSUFBSSxHQUFHLGVBQWU7U0FDdEIsWUFBWSxHQUFHLEtBQUs7U0FDcEIsVUFBVSxHQUFHLEtBQUs7U0FDbEIsZUFBZSxHQUFHLEtBQUs7Ozs7OztlQVJuQixVQUFVOztXQThDTixtQkFBRztBQUNULGFBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQTtLQUNsQjs7O1dBRUcsZUFBRztBQUNMLGFBQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFBO0tBQ25COzs7V0FFVSxzQkFBRztBQUNaLGFBQU8sSUFBSSxDQUFDLElBQUksS0FBSyxVQUFVLENBQUE7S0FDaEM7OztXQUVXLHVCQUFHO0FBQ2IsYUFBTyxJQUFJLENBQUMsSUFBSSxLQUFLLFdBQVcsQ0FBQTtLQUNqQzs7O1dBRVMsbUJBQUMsSUFBSSxFQUFFO0FBQ2YsYUFBUSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztLQUMxQjs7O1dBRVUsc0JBQUc7QUFDWixVQUFJLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQTtLQUM3Qjs7Ozs7OztXQUtPLG1CQUFHOztBQUVULFVBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0NBQWdD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LElBQUksQ0FBQyxFQUMxQixXQUFXLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUM3QixXQUFXLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUM3QixRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUMxQixZQUFZLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsRUFDcEMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQ3JDLFdBQVcsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUNuQyxZQUFZLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsRUFDcEMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFDckIsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFDM0IsV0FBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFDN0IsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFDekIsa0JBQWtCLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUNwQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUN0QixRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUMxQixTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUMzQixXQUFXLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUM3QixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUN4QixZQUFZLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUM5QixtQkFBbUIsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQ3JDLFdBQVcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQzdCLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQzNCLENBQUEiLCJmaWxlIjoiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvdGV4dC1vYmplY3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJ1xuXG5jb25zdCB7UmFuZ2UsIFBvaW50fSA9IHJlcXVpcmUoJ2F0b20nKVxuXG4vLyBbVE9ET10gTmVlZCBvdmVyaGF1bFxuLy8gIC0gWyBdIE1ha2UgZXhwYW5kYWJsZSBieSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKS51bmlvbih0aGlzLmdldFJhbmdlKHNlbGVjdGlvbikpXG4vLyAgLSBbIF0gQ291bnQgc3VwcG9ydChwcmlvcml0eSBsb3cpP1xuY29uc3QgQmFzZSA9IHJlcXVpcmUoJy4vYmFzZScpXG5jb25zdCBQYWlyRmluZGVyID0gcmVxdWlyZSgnLi9wYWlyLWZpbmRlcicpXG5cbmNsYXNzIFRleHRPYmplY3QgZXh0ZW5kcyBCYXNlIHtcbiAgc3RhdGljIG9wZXJhdGlvbktpbmQgPSAndGV4dC1vYmplY3QnXG4gIHN0YXRpYyBjb21tYW5kID0gZmFsc2VcblxuICBvcGVyYXRvciA9IG51bGxcbiAgd2lzZSA9ICdjaGFyYWN0ZXJ3aXNlJ1xuICBzdXBwb3J0Q291bnQgPSBmYWxzZSAvLyBGSVhNRSAjNDcyLCAjNjZcbiAgc2VsZWN0T25jZSA9IGZhbHNlXG4gIHNlbGVjdFN1Y2NlZWRlZCA9IGZhbHNlXG5cbiAgc3RhdGljIGRlcml2ZUNsYXNzIChpbm5lckFuZEEsIGlubmVyQW5kQUZvckFsbG93Rm9yd2FyZGluZykge1xuICAgIHRoaXMuY29tbWFuZCA9IGZhbHNlIC8vIEhBQ0s6IGtsYXNzIHRvIGRlcml2ZSBjaGlsZCBjbGFzcyBpcyBub3QgY29tbWFuZFxuICAgIGNvbnN0IHN0b3JlID0ge31cbiAgICBpZiAoaW5uZXJBbmRBKSB7XG4gICAgICBjb25zdCBrbGFzc0EgPSB0aGlzLmdlbmVyYXRlQ2xhc3MoZmFsc2UpXG4gICAgICBjb25zdCBrbGFzc0kgPSB0aGlzLmdlbmVyYXRlQ2xhc3ModHJ1ZSlcbiAgICAgIHN0b3JlW2tsYXNzQS5uYW1lXSA9IGtsYXNzQVxuICAgICAgc3RvcmVba2xhc3NJLm5hbWVdID0ga2xhc3NJXG4gICAgfVxuICAgIGlmIChpbm5lckFuZEFGb3JBbGxvd0ZvcndhcmRpbmcpIHtcbiAgICAgIGNvbnN0IGtsYXNzQSA9IHRoaXMuZ2VuZXJhdGVDbGFzcyhmYWxzZSwgdHJ1ZSlcbiAgICAgIGNvbnN0IGtsYXNzSSA9IHRoaXMuZ2VuZXJhdGVDbGFzcyh0cnVlLCB0cnVlKVxuICAgICAgc3RvcmVba2xhc3NBLm5hbWVdID0ga2xhc3NBXG4gICAgICBzdG9yZVtrbGFzc0kubmFtZV0gPSBrbGFzc0lcbiAgICB9XG4gICAgcmV0dXJuIHN0b3JlXG4gIH1cblxuICBzdGF0aWMgZ2VuZXJhdGVDbGFzcyAoaW5uZXIsIGFsbG93Rm9yd2FyZGluZykge1xuICAgIGxldCBuYW1lID0gKGlubmVyID8gJ0lubmVyJyA6ICdBJykgKyB0aGlzLm5hbWVcbiAgICBpZiAoYWxsb3dGb3J3YXJkaW5nKSB7XG4gICAgICBuYW1lICs9ICdBbGxvd0ZvcndhcmRpbmcnXG4gICAgfVxuXG4gICAgcmV0dXJuIGNsYXNzIGV4dGVuZHMgdGhpcyB7XG4gICAgICBzdGF0aWMgbmFtZSA9IG5hbWVcbiAgICAgIGNvbnN0cnVjdG9yICh2aW1TdGF0ZSkge1xuICAgICAgICBzdXBlcih2aW1TdGF0ZSlcbiAgICAgICAgdGhpcy5pbm5lciA9IGlubmVyXG4gICAgICAgIGlmIChhbGxvd0ZvcndhcmRpbmcgIT0gbnVsbCkge1xuICAgICAgICAgIHRoaXMuYWxsb3dGb3J3YXJkaW5nID0gYWxsb3dGb3J3YXJkaW5nXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpc0lubmVyICgpIHtcbiAgICByZXR1cm4gdGhpcy5pbm5lclxuICB9XG5cbiAgaXNBICgpIHtcbiAgICByZXR1cm4gIXRoaXMuaW5uZXJcbiAgfVxuXG4gIGlzTGluZXdpc2UgKCkge1xuICAgIHJldHVybiB0aGlzLndpc2UgPT09ICdsaW5ld2lzZSdcbiAgfVxuXG4gIGlzQmxvY2t3aXNlICgpIHtcbiAgICByZXR1cm4gdGhpcy53aXNlID09PSAnYmxvY2t3aXNlJ1xuICB9XG5cbiAgZm9yY2VXaXNlICh3aXNlKSB7XG4gICAgcmV0dXJuICh0aGlzLndpc2UgPSB3aXNlKSAvLyBGSVhNRSBjdXJyZW50bHkgbm90IHdlbGwgc3VwcG9ydGVkXG4gIH1cblxuICByZXNldFN0YXRlICgpIHtcbiAgICB0aGlzLnNlbGVjdFN1Y2NlZWRlZCA9IGZhbHNlXG4gIH1cblxuICAvLyBleGVjdXRlOiBDYWxsZWQgZnJvbSBPcGVyYXRvcjo6c2VsZWN0VGFyZ2V0KClcbiAgLy8gIC0gYHYgaSBwYCwgaXMgYFZpc3VhbE1vZGVTZWxlY3RgIG9wZXJhdG9yIHdpdGggQHRhcmdldCA9IGBJbm5lclBhcmFncmFwaGAuXG4gIC8vICAtIGBkIGkgcGAsIGlzIGBEZWxldGVgIG9wZXJhdG9yIHdpdGggQHRhcmdldCA9IGBJbm5lclBhcmFncmFwaGAuXG4gIGV4ZWN1dGUgKCkge1xuICAgIC8vIFdoZW5uZXZlciBUZXh0T2JqZWN0IGlzIGV4ZWN1dGVkLCBpdCBoYXMgQG9wZXJhdG9yXG4gICAgaWYgKCF0aGlzLm9wZXJhdG9yKSB0aHJvdyBuZXcgRXJyb3IoJ2luIFRleHRPYmplY3Q6IE11c3Qgbm90IGhhcHBlbicpXG4gICAgdGhpcy5zZWxlY3QoKVxuICB9XG5cbiAgc2VsZWN0ICgpIHtcbiAgICBpZiAodGhpcy5pc01vZGUoJ3Zpc3VhbCcsICdibG9ja3dpc2UnKSkge1xuICAgICAgdGhpcy5zd3JhcC5ub3JtYWxpemUodGhpcy5lZGl0b3IpXG4gICAgfVxuXG4gICAgdGhpcy5jb3VudFRpbWVzKHRoaXMuZ2V0Q291bnQoKSwgKHtzdG9wfSkgPT4ge1xuICAgICAgaWYgKCF0aGlzLnN1cHBvcnRDb3VudCkgc3RvcCgpIC8vIHF1aWNrLWZpeCBmb3IgIzU2MFxuXG4gICAgICBmb3IgKGNvbnN0IHNlbGVjdGlvbiBvZiB0aGlzLmVkaXRvci5nZXRTZWxlY3Rpb25zKCkpIHtcbiAgICAgICAgY29uc3Qgb2xkUmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgICAgICBpZiAodGhpcy5zZWxlY3RUZXh0T2JqZWN0KHNlbGVjdGlvbikpIHRoaXMuc2VsZWN0U3VjY2VlZGVkID0gdHJ1ZVxuICAgICAgICBpZiAoc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCkuaXNFcXVhbChvbGRSYW5nZSkpIHN0b3AoKVxuICAgICAgICBpZiAodGhpcy5zZWxlY3RPbmNlKSBicmVha1xuICAgICAgfVxuICAgIH0pXG5cbiAgICB0aGlzLmVkaXRvci5tZXJnZUludGVyc2VjdGluZ1NlbGVjdGlvbnMoKVxuICAgIC8vIFNvbWUgVGV4dE9iamVjdCdzIHdpc2UgaXMgTk9UIGRldGVybWluaXN0aWMuIEl0IGhhcyB0byBiZSBkZXRlY3RlZCBmcm9tIHNlbGVjdGVkIHJhbmdlLlxuICAgIGlmICh0aGlzLndpc2UgPT0gbnVsbCkgdGhpcy53aXNlID0gdGhpcy5zd3JhcC5kZXRlY3RXaXNlKHRoaXMuZWRpdG9yKVxuXG4gICAgaWYgKHRoaXMub3BlcmF0b3IuaW5zdGFuY2VvZignU2VsZWN0QmFzZScpKSB7XG4gICAgICBpZiAodGhpcy5zZWxlY3RTdWNjZWVkZWQpIHtcbiAgICAgICAgaWYgKHRoaXMud2lzZSA9PT0gJ2NoYXJhY3Rlcndpc2UnKSB7XG4gICAgICAgICAgdGhpcy5zd3JhcC5zYXZlUHJvcGVydGllcyh0aGlzLmVkaXRvciwge2ZvcmNlOiB0cnVlfSlcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLndpc2UgPT09ICdsaW5ld2lzZScpIHtcbiAgICAgICAgICAvLyBXaGVuIHRhcmdldCBpcyBwZXJzaXN0ZW50LXNlbGVjdGlvbiwgbmV3IHNlbGVjdGlvbiBpcyBhZGRlZCBhZnRlciBzZWxlY3RUZXh0T2JqZWN0LlxuICAgICAgICAgIC8vIFNvIHdlIGhhdmUgdG8gYXNzdXJlIGFsbCBzZWxlY3Rpb24gaGF2ZSBzZWxjdGlvbiBwcm9wZXJ0eS5cbiAgICAgICAgICAvLyBNYXliZSB0aGlzIGxvZ2ljIGNhbiBiZSBtb3ZlZCB0byBvcGVyYXRpb24gc3RhY2suXG4gICAgICAgICAgZm9yIChjb25zdCAkc2VsZWN0aW9uIG9mIHRoaXMuc3dyYXAuZ2V0U2VsZWN0aW9ucyh0aGlzLmVkaXRvcikpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmdldENvbmZpZygnc3RheU9uU2VsZWN0VGV4dE9iamVjdCcpKSB7XG4gICAgICAgICAgICAgIGlmICghJHNlbGVjdGlvbi5oYXNQcm9wZXJ0aWVzKCkpIHtcbiAgICAgICAgICAgICAgICAkc2VsZWN0aW9uLnNhdmVQcm9wZXJ0aWVzKClcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgJHNlbGVjdGlvbi5zYXZlUHJvcGVydGllcygpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkc2VsZWN0aW9uLmZpeFByb3BlcnR5Um93VG9Sb3dSYW5nZSgpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnN1Ym1vZGUgPT09ICdibG9ja3dpc2UnKSB7XG4gICAgICAgIGZvciAoY29uc3QgJHNlbGVjdGlvbiBvZiB0aGlzLnN3cmFwLmdldFNlbGVjdGlvbnModGhpcy5lZGl0b3IpKSB7XG4gICAgICAgICAgJHNlbGVjdGlvbi5ub3JtYWxpemUoKVxuICAgICAgICAgICRzZWxlY3Rpb24uYXBwbHlXaXNlKCdibG9ja3dpc2UnKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gUmV0dXJuIHRydWUgb3IgZmFsc2VcbiAgc2VsZWN0VGV4dE9iamVjdCAoc2VsZWN0aW9uKSB7XG4gICAgY29uc3QgcmFuZ2UgPSB0aGlzLmdldFJhbmdlKHNlbGVjdGlvbilcbiAgICBpZiAocmFuZ2UpIHtcbiAgICAgIHRoaXMuc3dyYXAoc2VsZWN0aW9uKS5zZXRCdWZmZXJSYW5nZShyYW5nZSlcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuXG4gIC8vIHRvIG92ZXJyaWRlXG4gIGdldFJhbmdlIChzZWxlY3Rpb24pIHt9XG59XG5cbi8vIFNlY3Rpb246IFdvcmRcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIFdvcmQgZXh0ZW5kcyBUZXh0T2JqZWN0IHtcbiAgZ2V0UmFuZ2UgKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IHBvaW50ID0gdGhpcy5nZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbihzZWxlY3Rpb24pXG4gICAgY29uc3Qge3JhbmdlfSA9IHRoaXMuZ2V0V29yZEJ1ZmZlclJhbmdlQW5kS2luZEF0QnVmZmVyUG9zaXRpb24ocG9pbnQsIHt3b3JkUmVnZXg6IHRoaXMud29yZFJlZ2V4fSlcbiAgICByZXR1cm4gdGhpcy5pc0EoKSA/IHRoaXMudXRpbHMuZXhwYW5kUmFuZ2VUb1doaXRlU3BhY2VzKHRoaXMuZWRpdG9yLCByYW5nZSkgOiByYW5nZVxuICB9XG59XG5cbmNsYXNzIFdob2xlV29yZCBleHRlbmRzIFdvcmQge1xuICB3b3JkUmVnZXggPSAvXFxTKy9cbn1cblxuLy8gSnVzdCBpbmNsdWRlIF8sIC1cbmNsYXNzIFNtYXJ0V29yZCBleHRlbmRzIFdvcmQge1xuICB3b3JkUmVnZXggPSAvW1xcdy1dKy9cbn1cblxuLy8gSnVzdCBpbmNsdWRlIF8sIC1cbmNsYXNzIFN1YndvcmQgZXh0ZW5kcyBXb3JkIHtcbiAgZ2V0UmFuZ2UgKHNlbGVjdGlvbikge1xuICAgIHRoaXMud29yZFJlZ2V4ID0gc2VsZWN0aW9uLmN1cnNvci5zdWJ3b3JkUmVnRXhwKClcbiAgICByZXR1cm4gc3VwZXIuZ2V0UmFuZ2Uoc2VsZWN0aW9uKVxuICB9XG59XG5cbi8vIFNlY3Rpb246IFBhaXJcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIFBhaXIgZXh0ZW5kcyBUZXh0T2JqZWN0IHtcbiAgc3RhdGljIGNvbW1hbmQgPSBmYWxzZVxuICBzdXBwb3J0Q291bnQgPSB0cnVlXG4gIGFsbG93TmV4dExpbmUgPSBudWxsXG4gIGFkanVzdElubmVyUmFuZ2UgPSB0cnVlXG4gIHBhaXIgPSBudWxsXG4gIGluY2x1c2l2ZSA9IHRydWVcblxuICBpc0FsbG93TmV4dExpbmUgKCkge1xuICAgIGlmICh0aGlzLmFsbG93TmV4dExpbmUgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuYWxsb3dOZXh0TGluZVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5wYWlyICYmIHRoaXMucGFpclswXSAhPT0gdGhpcy5wYWlyWzFdXG4gICAgfVxuICB9XG5cbiAgYWRqdXN0UmFuZ2UgKHtzdGFydCwgZW5kfSkge1xuICAgIC8vIERpcnR5IHdvcmsgdG8gZmVlbCBuYXR1cmFsIGZvciBodW1hbiwgdG8gYmVoYXZlIGNvbXBhdGlibGUgd2l0aCBwdXJlIFZpbS5cbiAgICAvLyBXaGVyZSB0aGlzIGFkanVzdG1lbnQgYXBwZWFyIGlzIGluIGZvbGxvd2luZyBzaXR1YXRpb24uXG4gICAgLy8gb3AtMTogYGNpe2AgcmVwbGFjZSBvbmx5IDJuZCBsaW5lXG4gICAgLy8gb3AtMjogYGRpe2AgZGVsZXRlIG9ubHkgMm5kIGxpbmUuXG4gICAgLy8gdGV4dDpcbiAgICAvLyAge1xuICAgIC8vICAgIGFhYVxuICAgIC8vICB9XG4gICAgaWYgKHRoaXMudXRpbHMucG9pbnRJc0F0RW5kT2ZMaW5lKHRoaXMuZWRpdG9yLCBzdGFydCkpIHtcbiAgICAgIHN0YXJ0ID0gc3RhcnQudHJhdmVyc2UoWzEsIDBdKVxuICAgIH1cblxuICAgIGlmICh0aGlzLnV0aWxzLmdldExpbmVUZXh0VG9CdWZmZXJQb3NpdGlvbih0aGlzLmVkaXRvciwgZW5kKS5tYXRjaCgvXlxccyokLykpIHtcbiAgICAgIGlmICh0aGlzLm1vZGUgPT09ICd2aXN1YWwnKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgc2xpZ2h0bHkgaW5uY29uc2lzdGVudCB3aXRoIHJlZ3VsYXIgVmltXG4gICAgICAgIC8vIC0gcmVndWxhciBWaW06IHNlbGVjdCBuZXcgbGluZSBhZnRlciBFT0xcbiAgICAgICAgLy8gLSB2aW0tbW9kZS1wbHVzOiBzZWxlY3QgdG8gRU9MKGJlZm9yZSBuZXcgbGluZSlcbiAgICAgICAgLy8gVGhpcyBpcyBpbnRlbnRpb25hbCBzaW5jZSB0byBtYWtlIHN1Ym1vZGUgYGNoYXJhY3Rlcndpc2VgIHdoZW4gYXV0by1kZXRlY3Qgc3VibW9kZVxuICAgICAgICAvLyBpbm5lckVuZCA9IG5ldyBQb2ludChpbm5lckVuZC5yb3cgLSAxLCBJbmZpbml0eSlcbiAgICAgICAgZW5kID0gbmV3IFBvaW50KGVuZC5yb3cgLSAxLCBJbmZpbml0eSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVuZCA9IG5ldyBQb2ludChlbmQucm93LCAwKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmV3IFJhbmdlKHN0YXJ0LCBlbmQpXG4gIH1cblxuICBnZXRGaW5kZXIgKCkge1xuICAgIGNvbnN0IGZpbmRlck5hbWUgPSB0aGlzLnBhaXJbMF0gPT09IHRoaXMucGFpclsxXSA/ICdRdW90ZUZpbmRlcicgOiAnQnJhY2tldEZpbmRlcidcbiAgICByZXR1cm4gbmV3IFBhaXJGaW5kZXJbZmluZGVyTmFtZV0odGhpcy5lZGl0b3IsIHtcbiAgICAgIGFsbG93TmV4dExpbmU6IHRoaXMuaXNBbGxvd05leHRMaW5lKCksXG4gICAgICBhbGxvd0ZvcndhcmRpbmc6IHRoaXMuYWxsb3dGb3J3YXJkaW5nLFxuICAgICAgcGFpcjogdGhpcy5wYWlyLFxuICAgICAgaW5jbHVzaXZlOiB0aGlzLmluY2x1c2l2ZVxuICAgIH0pXG4gIH1cblxuICBnZXRQYWlySW5mbyAoZnJvbSkge1xuICAgIGNvbnN0IHBhaXJJbmZvID0gdGhpcy5nZXRGaW5kZXIoKS5maW5kKGZyb20pXG4gICAgaWYgKHBhaXJJbmZvKSB7XG4gICAgICBpZiAodGhpcy5hZGp1c3RJbm5lclJhbmdlKSB7XG4gICAgICAgIHBhaXJJbmZvLmlubmVyUmFuZ2UgPSB0aGlzLmFkanVzdFJhbmdlKHBhaXJJbmZvLmlubmVyUmFuZ2UpXG4gICAgICB9XG4gICAgICBwYWlySW5mby50YXJnZXRSYW5nZSA9IHRoaXMuaXNJbm5lcigpID8gcGFpckluZm8uaW5uZXJSYW5nZSA6IHBhaXJJbmZvLmFSYW5nZVxuICAgICAgcmV0dXJuIHBhaXJJbmZvXG4gICAgfVxuICB9XG5cbiAgZ2V0UmFuZ2UgKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IG9yaWdpbmFsUmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgIGxldCBwYWlySW5mbyA9IHRoaXMuZ2V0UGFpckluZm8odGhpcy5nZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbihzZWxlY3Rpb24pKVxuICAgIC8vIFdoZW4gcmFuZ2Ugd2FzIHNhbWUsIHRyeSB0byBleHBhbmQgcmFuZ2VcbiAgICBpZiAocGFpckluZm8gJiYgcGFpckluZm8udGFyZ2V0UmFuZ2UuaXNFcXVhbChvcmlnaW5hbFJhbmdlKSkge1xuICAgICAgcGFpckluZm8gPSB0aGlzLmdldFBhaXJJbmZvKHBhaXJJbmZvLmFSYW5nZS5lbmQpXG4gICAgfVxuICAgIGlmIChwYWlySW5mbykge1xuICAgICAgcmV0dXJuIHBhaXJJbmZvLnRhcmdldFJhbmdlXG4gICAgfVxuICB9XG59XG5cbi8vIFVzZWQgYnkgRGVsZXRlU3Vycm91bmRcbmNsYXNzIEFQYWlyIGV4dGVuZHMgUGFpciB7XG4gIHN0YXRpYyBjb21tYW5kID0gZmFsc2Vcbn1cblxuY2xhc3MgQW55UGFpciBleHRlbmRzIFBhaXIge1xuICBhbGxvd0ZvcndhcmRpbmcgPSBmYWxzZVxuICBtZW1iZXIgPSBbJ0RvdWJsZVF1b3RlJywgJ1NpbmdsZVF1b3RlJywgJ0JhY2tUaWNrJywgJ0N1cmx5QnJhY2tldCcsICdBbmdsZUJyYWNrZXQnLCAnU3F1YXJlQnJhY2tldCcsICdQYXJlbnRoZXNpcyddXG5cbiAgZ2V0UmFuZ2VzIChzZWxlY3Rpb24pIHtcbiAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgaW5uZXI6IHRoaXMuaW5uZXIsXG4gICAgICBhbGxvd0ZvcndhcmRpbmc6IHRoaXMuYWxsb3dGb3J3YXJkaW5nLFxuICAgICAgaW5jbHVzaXZlOiB0aGlzLmluY2x1c2l2ZVxuICAgIH1cbiAgICBjb25zdCBnZXRSYW5nZUJ5TWVtYmVyID0gbWVtYmVyID0+IHRoaXMuZ2V0SW5zdGFuY2UobWVtYmVyLCBvcHRpb25zKS5nZXRSYW5nZShzZWxlY3Rpb24pXG4gICAgcmV0dXJuIHRoaXMubWVtYmVyLm1hcChnZXRSYW5nZUJ5TWVtYmVyKS5maWx0ZXIodiA9PiB2KVxuICB9XG5cbiAgZ2V0UmFuZ2UgKHNlbGVjdGlvbikge1xuICAgIHJldHVybiB0aGlzLnV0aWxzLnNvcnRSYW5nZXModGhpcy5nZXRSYW5nZXMoc2VsZWN0aW9uKSkucG9wKClcbiAgfVxufVxuXG5jbGFzcyBBbnlQYWlyQWxsb3dGb3J3YXJkaW5nIGV4dGVuZHMgQW55UGFpciB7XG4gIGFsbG93Rm9yd2FyZGluZyA9IHRydWVcblxuICBnZXRSYW5nZSAoc2VsZWN0aW9uKSB7XG4gICAgY29uc3QgcmFuZ2VzID0gdGhpcy5nZXRSYW5nZXMoc2VsZWN0aW9uKVxuICAgIGNvbnN0IGZyb20gPSBzZWxlY3Rpb24uY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBsZXQgW2ZvcndhcmRpbmdSYW5nZXMsIGVuY2xvc2luZ1Jhbmdlc10gPSB0aGlzLl8ucGFydGl0aW9uKHJhbmdlcywgcmFuZ2UgPT4gcmFuZ2Uuc3RhcnQuaXNHcmVhdGVyVGhhbk9yRXF1YWwoZnJvbSkpXG4gICAgY29uc3QgZW5jbG9zaW5nUmFuZ2UgPSB0aGlzLnV0aWxzLnNvcnRSYW5nZXMoZW5jbG9zaW5nUmFuZ2VzKS5wb3AoKVxuICAgIGZvcndhcmRpbmdSYW5nZXMgPSB0aGlzLnV0aWxzLnNvcnRSYW5nZXMoZm9yd2FyZGluZ1JhbmdlcylcblxuICAgIC8vIFdoZW4gZW5jbG9zaW5nUmFuZ2UgaXMgZXhpc3RzLFxuICAgIC8vIFdlIGRvbid0IGdvIGFjcm9zcyBlbmNsb3NpbmdSYW5nZS5lbmQuXG4gICAgLy8gU28gY2hvb3NlIGZyb20gcmFuZ2VzIGNvbnRhaW5lZCBpbiBlbmNsb3NpbmdSYW5nZS5cbiAgICBpZiAoZW5jbG9zaW5nUmFuZ2UpIHtcbiAgICAgIGZvcndhcmRpbmdSYW5nZXMgPSBmb3J3YXJkaW5nUmFuZ2VzLmZpbHRlcihyYW5nZSA9PiBlbmNsb3NpbmdSYW5nZS5jb250YWluc1JhbmdlKHJhbmdlKSlcbiAgICB9XG5cbiAgICByZXR1cm4gZm9yd2FyZGluZ1Jhbmdlc1swXSB8fCBlbmNsb3NpbmdSYW5nZVxuICB9XG59XG5cbmNsYXNzIEFueVF1b3RlIGV4dGVuZHMgQW55UGFpciB7XG4gIGFsbG93Rm9yd2FyZGluZyA9IHRydWVcbiAgbWVtYmVyID0gWydEb3VibGVRdW90ZScsICdTaW5nbGVRdW90ZScsICdCYWNrVGljayddXG5cbiAgZ2V0UmFuZ2UgKHNlbGVjdGlvbikge1xuICAgIC8vIFBpY2sgcmFuZ2Ugd2hpY2ggZW5kLmNvbHVtIGlzIGxlZnRtb3N0KG1lYW4sIGNsb3NlZCBmaXJzdClcbiAgICByZXR1cm4gdGhpcy5nZXRSYW5nZXMoc2VsZWN0aW9uKS5zb3J0KChhLCBiKSA9PiBhLmVuZC5jb2x1bW4gLSBiLmVuZC5jb2x1bW4pWzBdXG4gIH1cbn1cblxuY2xhc3MgUXVvdGUgZXh0ZW5kcyBQYWlyIHtcbiAgc3RhdGljIGNvbW1hbmQgPSBmYWxzZVxuICBhbGxvd0ZvcndhcmRpbmcgPSB0cnVlXG59XG5cbmNsYXNzIERvdWJsZVF1b3RlIGV4dGVuZHMgUXVvdGUge1xuICBwYWlyID0gWydcIicsICdcIiddXG59XG5cbmNsYXNzIFNpbmdsZVF1b3RlIGV4dGVuZHMgUXVvdGUge1xuICBwYWlyID0gW1wiJ1wiLCBcIidcIl1cbn1cblxuY2xhc3MgQmFja1RpY2sgZXh0ZW5kcyBRdW90ZSB7XG4gIHBhaXIgPSBbJ2AnLCAnYCddXG59XG5cbmNsYXNzIEN1cmx5QnJhY2tldCBleHRlbmRzIFBhaXIge1xuICBwYWlyID0gWyd7JywgJ30nXVxufVxuXG5jbGFzcyBTcXVhcmVCcmFja2V0IGV4dGVuZHMgUGFpciB7XG4gIHBhaXIgPSBbJ1snLCAnXSddXG59XG5cbmNsYXNzIFBhcmVudGhlc2lzIGV4dGVuZHMgUGFpciB7XG4gIHBhaXIgPSBbJygnLCAnKSddXG59XG5cbmNsYXNzIEFuZ2xlQnJhY2tldCBleHRlbmRzIFBhaXIge1xuICBwYWlyID0gWyc8JywgJz4nXVxufVxuXG5jbGFzcyBUYWcgZXh0ZW5kcyBQYWlyIHtcbiAgYWxsb3dOZXh0TGluZSA9IHRydWVcbiAgYWxsb3dGb3J3YXJkaW5nID0gdHJ1ZVxuICBhZGp1c3RJbm5lclJhbmdlID0gZmFsc2VcblxuICBnZXRUYWdTdGFydFBvaW50IChmcm9tKSB7XG4gICAgY29uc3QgcmVnZXggPSBQYWlyRmluZGVyLlRhZ0ZpbmRlci5wYXR0ZXJuXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtmcm9tOiBbZnJvbS5yb3csIDBdfVxuICAgIHJldHVybiB0aGlzLmZpbmRJbkVkaXRvcignZm9yd2FyZCcsIHJlZ2V4LCBvcHRpb25zLCAoe3JhbmdlfSkgPT4gcmFuZ2UuY29udGFpbnNQb2ludChmcm9tLCB0cnVlKSAmJiByYW5nZS5zdGFydClcbiAgfVxuXG4gIGdldEZpbmRlciAoKSB7XG4gICAgcmV0dXJuIG5ldyBQYWlyRmluZGVyLlRhZ0ZpbmRlcih0aGlzLmVkaXRvciwge1xuICAgICAgYWxsb3dOZXh0TGluZTogdGhpcy5pc0FsbG93TmV4dExpbmUoKSxcbiAgICAgIGFsbG93Rm9yd2FyZGluZzogdGhpcy5hbGxvd0ZvcndhcmRpbmcsXG4gICAgICBpbmNsdXNpdmU6IHRoaXMuaW5jbHVzaXZlXG4gICAgfSlcbiAgfVxuXG4gIGdldFBhaXJJbmZvIChmcm9tKSB7XG4gICAgcmV0dXJuIHN1cGVyLmdldFBhaXJJbmZvKHRoaXMuZ2V0VGFnU3RhcnRQb2ludChmcm9tKSB8fCBmcm9tKVxuICB9XG59XG5cbi8vIFNlY3Rpb246IFBhcmFncmFwaFxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gUGFyYWdyYXBoIGlzIGRlZmluZWQgYXMgY29uc2VjdXRpdmUgKG5vbi0pYmxhbmstbGluZS5cbmNsYXNzIFBhcmFncmFwaCBleHRlbmRzIFRleHRPYmplY3Qge1xuICB3aXNlID0gJ2xpbmV3aXNlJ1xuICBzdXBwb3J0Q291bnQgPSB0cnVlXG5cbiAgZmluZFJvdyAoZnJvbVJvdywgZGlyZWN0aW9uLCBmbikge1xuICAgIGlmIChmbi5yZXNldCkgZm4ucmVzZXQoKVxuICAgIGxldCBmb3VuZFJvdyA9IGZyb21Sb3dcbiAgICBmb3IgKGNvbnN0IHJvdyBvZiB0aGlzLmdldEJ1ZmZlclJvd3Moe3N0YXJ0Um93OiBmcm9tUm93LCBkaXJlY3Rpb259KSkge1xuICAgICAgaWYgKCFmbihyb3csIGRpcmVjdGlvbikpIGJyZWFrXG4gICAgICBmb3VuZFJvdyA9IHJvd1xuICAgIH1cbiAgICByZXR1cm4gZm91bmRSb3dcbiAgfVxuXG4gIGZpbmRSb3dSYW5nZUJ5IChmcm9tUm93LCBmbikge1xuICAgIGNvbnN0IHN0YXJ0Um93ID0gdGhpcy5maW5kUm93KGZyb21Sb3csICdwcmV2aW91cycsIGZuKVxuICAgIGNvbnN0IGVuZFJvdyA9IHRoaXMuZmluZFJvdyhmcm9tUm93LCAnbmV4dCcsIGZuKVxuICAgIHJldHVybiBbc3RhcnRSb3csIGVuZFJvd11cbiAgfVxuXG4gIGdldFByZWRpY3RGdW5jdGlvbiAoZnJvbVJvdywgc2VsZWN0aW9uKSB7XG4gICAgY29uc3QgZnJvbVJvd1Jlc3VsdCA9IHRoaXMuZWRpdG9yLmlzQnVmZmVyUm93QmxhbmsoZnJvbVJvdylcblxuICAgIGlmICh0aGlzLmlzSW5uZXIoKSkge1xuICAgICAgcmV0dXJuIChyb3csIGRpcmVjdGlvbikgPT4gdGhpcy5lZGl0b3IuaXNCdWZmZXJSb3dCbGFuayhyb3cpID09PSBmcm9tUm93UmVzdWx0XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGRpcmVjdGlvblRvRXh0ZW5kID0gc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKSA/ICdwcmV2aW91cycgOiAnbmV4dCdcblxuICAgICAgbGV0IGZsaXAgPSBmYWxzZVxuICAgICAgY29uc3QgcHJlZGljdCA9IChyb3csIGRpcmVjdGlvbikgPT4ge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmVkaXRvci5pc0J1ZmZlclJvd0JsYW5rKHJvdykgPT09IGZyb21Sb3dSZXN1bHRcbiAgICAgICAgaWYgKGZsaXApIHtcbiAgICAgICAgICByZXR1cm4gIXJlc3VsdFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICghcmVzdWx0ICYmIGRpcmVjdGlvbiA9PT0gZGlyZWN0aW9uVG9FeHRlbmQpIHtcbiAgICAgICAgICAgIHJldHVybiAoZmxpcCA9IHRydWUpXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXN1bHRcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcHJlZGljdC5yZXNldCA9ICgpID0+IChmbGlwID0gZmFsc2UpXG4gICAgICByZXR1cm4gcHJlZGljdFxuICAgIH1cbiAgfVxuXG4gIGdldFJhbmdlIChzZWxlY3Rpb24pIHtcbiAgICBsZXQgZnJvbVJvdyA9IHRoaXMuZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKS5yb3dcbiAgICBpZiAodGhpcy5pc01vZGUoJ3Zpc3VhbCcsICdsaW5ld2lzZScpKSB7XG4gICAgICBpZiAoc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKSkgZnJvbVJvdy0tXG4gICAgICBlbHNlIGZyb21Sb3crK1xuICAgICAgZnJvbVJvdyA9IHRoaXMuZ2V0VmFsaWRWaW1CdWZmZXJSb3coZnJvbVJvdylcbiAgICB9XG4gICAgY29uc3Qgcm93UmFuZ2UgPSB0aGlzLmZpbmRSb3dSYW5nZUJ5KGZyb21Sb3csIHRoaXMuZ2V0UHJlZGljdEZ1bmN0aW9uKGZyb21Sb3csIHNlbGVjdGlvbikpXG4gICAgcmV0dXJuIHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpLnVuaW9uKHRoaXMuZ2V0QnVmZmVyUmFuZ2VGb3JSb3dSYW5nZShyb3dSYW5nZSkpXG4gIH1cbn1cblxuY2xhc3MgSW5kZW50YXRpb24gZXh0ZW5kcyBQYXJhZ3JhcGgge1xuICBnZXRSYW5nZSAoc2VsZWN0aW9uKSB7XG4gICAgY29uc3QgZnJvbVJvdyA9IHRoaXMuZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKS5yb3dcbiAgICBjb25zdCBiYXNlSW5kZW50TGV2ZWwgPSB0aGlzLmVkaXRvci5pbmRlbnRhdGlvbkZvckJ1ZmZlclJvdyhmcm9tUm93KVxuICAgIGNvbnN0IHJvd1JhbmdlID0gdGhpcy5maW5kUm93UmFuZ2VCeShmcm9tUm93LCByb3cgPT4ge1xuICAgICAgaWYgKHRoaXMuZWRpdG9yLmlzQnVmZmVyUm93Qmxhbmsocm93KSkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc0EoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWRpdG9yLmluZGVudGF0aW9uRm9yQnVmZmVyUm93KHJvdykgPj0gYmFzZUluZGVudExldmVsXG4gICAgICB9XG4gICAgfSlcbiAgICByZXR1cm4gdGhpcy5nZXRCdWZmZXJSYW5nZUZvclJvd1JhbmdlKHJvd1JhbmdlKVxuICB9XG59XG5cbi8vIFNlY3Rpb246IENvbW1lbnRcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIENvbW1lbnQgZXh0ZW5kcyBUZXh0T2JqZWN0IHtcbiAgQ29tbWVudFxuICB3aXNlID0gJ2xpbmV3aXNlJ1xuXG4gIGdldFJhbmdlIChzZWxlY3Rpb24pIHtcbiAgICBjb25zdCB7cm93fSA9IHRoaXMuZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgIGNvbnN0IHJvd1JhbmdlID0gdGhpcy51dGlscy5nZXRSb3dSYW5nZUZvckNvbW1lbnRBdEJ1ZmZlclJvdyh0aGlzLmVkaXRvciwgcm93KVxuICAgIGlmIChyb3dSYW5nZSkge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0QnVmZmVyUmFuZ2VGb3JSb3dSYW5nZShyb3dSYW5nZSlcbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgQ29tbWVudE9yUGFyYWdyYXBoIGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIHdpc2UgPSAnbGluZXdpc2UnXG5cbiAgZ2V0UmFuZ2UgKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IHtpbm5lcn0gPSB0aGlzXG4gICAgZm9yIChjb25zdCBrbGFzcyBvZiBbJ0NvbW1lbnQnLCAnUGFyYWdyYXBoJ10pIHtcbiAgICAgIGNvbnN0IHJhbmdlID0gdGhpcy5nZXRJbnN0YW5jZShrbGFzcywge2lubmVyfSkuZ2V0UmFuZ2Uoc2VsZWN0aW9uKVxuICAgICAgaWYgKHJhbmdlKSB7XG4gICAgICAgIHJldHVybiByYW5nZVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vLyBTZWN0aW9uOiBGb2xkXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBGb2xkIGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIHdpc2UgPSAnbGluZXdpc2UnXG5cbiAgZ2V0UmFuZ2UgKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IHtyb3d9ID0gdGhpcy5nZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbihzZWxlY3Rpb24pXG4gICAgY29uc3Qgc2VsZWN0ZWRSYW5nZSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG5cbiAgICBjb25zdCBmb2xkUmFuZ2VzID0gdGhpcy51dGlscy5nZXRDb2RlRm9sZFJhbmdlcyh0aGlzLmVkaXRvcilcbiAgICBjb25zdCBmb2xkUmFuZ2VzQ29udGFpbnNDdXJzb3JSb3cgPSBmb2xkUmFuZ2VzLmZpbHRlcihyYW5nZSA9PiByYW5nZS5zdGFydC5yb3cgPD0gcm93ICYmIHJvdyA8PSByYW5nZS5lbmQucm93KVxuXG4gICAgZm9yIChsZXQgZm9sZFJhbmdlIG9mIGZvbGRSYW5nZXNDb250YWluc0N1cnNvclJvdy5yZXZlcnNlKCkpIHtcbiAgICAgIGlmICh0aGlzLmlzQSgpKSB7XG4gICAgICAgIGxldCBjb25qb2luZWRcbiAgICAgICAgd2hpbGUgKChjb25qb2luZWQgPSBmb2xkUmFuZ2VzLmZpbmQocmFuZ2UgPT4gcmFuZ2UuZW5kLnJvdyA9PT0gZm9sZFJhbmdlLnN0YXJ0LnJvdykpKSB7XG4gICAgICAgICAgZm9sZFJhbmdlID0gZm9sZFJhbmdlLnVuaW9uKGNvbmpvaW5lZClcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoKGNvbmpvaW5lZCA9IGZvbGRSYW5nZXMuZmluZChyYW5nZSA9PiByYW5nZS5zdGFydC5yb3cgPT09IGZvbGRSYW5nZS5lbmQucm93KSkpIHtcbiAgICAgICAgICBmb2xkUmFuZ2UgPSBmb2xkUmFuZ2UudW5pb24oY29uam9pbmVkKVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy51dGlscy5kb2VzUmFuZ2VTdGFydEFuZEVuZFdpdGhTYW1lSW5kZW50TGV2ZWwodGhpcy5lZGl0b3IsIGZvbGRSYW5nZSkpIHtcbiAgICAgICAgICBmb2xkUmFuZ2UuZW5kLnJvdyAtPSAxXG4gICAgICAgIH1cbiAgICAgICAgZm9sZFJhbmdlLnN0YXJ0LnJvdyArPSAxXG4gICAgICB9XG4gICAgICBmb2xkUmFuZ2UgPSB0aGlzLmdldEJ1ZmZlclJhbmdlRm9yUm93UmFuZ2UoW2ZvbGRSYW5nZS5zdGFydC5yb3csIGZvbGRSYW5nZS5lbmQucm93XSlcbiAgICAgIGlmICghc2VsZWN0ZWRSYW5nZS5jb250YWluc1JhbmdlKGZvbGRSYW5nZSkpIHtcbiAgICAgICAgcmV0dXJuIGZvbGRSYW5nZVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBGdW5jdGlvbiBleHRlbmRzIFRleHRPYmplY3Qge1xuICB3aXNlID0gJ2xpbmV3aXNlJ1xuICBzY29wZU5hbWVzT21pdHRpbmdDbG9zaW5nQnJhY2UgPSBbJ3NvdXJjZS5nbycsICdzb3VyY2UuZWxpeGlyJ10gLy8gbGFuZ3VhZ2UgZG9lc24ndCBpbmNsdWRlIGNsb3NpbmcgYH1gIGludG8gZm9sZC5cblxuICBnZXRGdW5jdGlvbkJvZHlTdGFydFJlZ2V4ICh7c2NvcGVOYW1lfSkge1xuICAgIGlmIChzY29wZU5hbWUgPT09ICdzb3VyY2UucHl0aG9uJykge1xuICAgICAgcmV0dXJuIC86JC9cbiAgICB9IGVsc2UgaWYgKHNjb3BlTmFtZSA9PT0gJ3NvdXJjZS5jb2ZmZWUnKSB7XG4gICAgICByZXR1cm4gLy18PT4kL1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gL3skL1xuICAgIH1cbiAgfVxuXG4gIGlzTXVsdGlMaW5lUGFyYW1ldGVyRnVuY3Rpb25SYW5nZSAocGFyYW1ldGVyUmFuZ2UsIGJvZHlSYW5nZSwgYm9keVN0YXJ0UmVnZXgpIHtcbiAgICBjb25zdCBpc0JvZHlTdGFydFJvdyA9IHJvdyA9PiBib2R5U3RhcnRSZWdleC50ZXN0KHRoaXMuZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KHJvdykpXG4gICAgaWYgKGlzQm9keVN0YXJ0Um93KHBhcmFtZXRlclJhbmdlLnN0YXJ0LnJvdykpIHJldHVybiBmYWxzZVxuICAgIGlmIChpc0JvZHlTdGFydFJvdyhwYXJhbWV0ZXJSYW5nZS5lbmQucm93KSkgcmV0dXJuIHBhcmFtZXRlclJhbmdlLmVuZC5yb3cgPT09IGJvZHlSYW5nZS5zdGFydC5yb3dcbiAgICBpZiAoaXNCb2R5U3RhcnRSb3cocGFyYW1ldGVyUmFuZ2UuZW5kLnJvdyArIDEpKSByZXR1cm4gcGFyYW1ldGVyUmFuZ2UuZW5kLnJvdyArIDEgPT09IGJvZHlSYW5nZS5zdGFydC5yb3dcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGdldFJhbmdlIChzZWxlY3Rpb24pIHtcbiAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmVkaXRvclxuICAgIGNvbnN0IGN1cnNvclJvdyA9IHRoaXMuZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKS5yb3dcbiAgICBjb25zdCBib2R5U3RhcnRSZWdleCA9IHRoaXMuZ2V0RnVuY3Rpb25Cb2R5U3RhcnRSZWdleChlZGl0b3IuZ2V0R3JhbW1hcigpKVxuICAgIGNvbnN0IGlzSW5jbHVkZUZ1bmN0aW9uU2NvcGVGb3JSb3cgPSByb3cgPT4gdGhpcy51dGlscy5pc0luY2x1ZGVGdW5jdGlvblNjb3BlRm9yUm93KGVkaXRvciwgcm93KVxuXG4gICAgY29uc3QgZnVuY3Rpb25SYW5nZXMgPSBbXVxuICAgIGNvbnN0IHNhdmVGdW5jdGlvblJhbmdlID0gKHthUmFuZ2UsIGlubmVyUmFuZ2V9KSA9PiB7XG4gICAgICBmdW5jdGlvblJhbmdlcy5wdXNoKHtcbiAgICAgICAgYVJhbmdlOiB0aGlzLmJ1aWxkQVJhbmdlKGFSYW5nZSksXG4gICAgICAgIGlubmVyUmFuZ2U6IHRoaXMuYnVpbGRJbm5lclJhbmdlKGlubmVyUmFuZ2UpXG4gICAgICB9KVxuICAgIH1cblxuICAgIGNvbnN0IGZvbGRSYW5nZXMgPSB0aGlzLnV0aWxzLmdldENvZGVGb2xkUmFuZ2VzKGVkaXRvcilcbiAgICB3aGlsZSAoZm9sZFJhbmdlcy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHJhbmdlID0gZm9sZFJhbmdlcy5zaGlmdCgpXG4gICAgICBpZiAoaXNJbmNsdWRlRnVuY3Rpb25TY29wZUZvclJvdyhyYW5nZS5zdGFydC5yb3cpKSB7XG4gICAgICAgIGNvbnN0IG5leHRSYW5nZSA9IGZvbGRSYW5nZXNbMF1cbiAgICAgICAgY29uc3QgbmV4dEZvbGRJc0Nvbm5lY3RlZCA9IG5leHRSYW5nZSAmJiBuZXh0UmFuZ2Uuc3RhcnQucm93IDw9IHJhbmdlLmVuZC5yb3cgKyAxXG4gICAgICAgIGNvbnN0IG1heWJlQUZ1bmN0aW9uUmFuZ2UgPSBuZXh0Rm9sZElzQ29ubmVjdGVkID8gcmFuZ2UudW5pb24obmV4dFJhbmdlKSA6IHJhbmdlXG4gICAgICAgIGlmICghbWF5YmVBRnVuY3Rpb25SYW5nZS5jb250YWluc1BvaW50KFtjdXJzb3JSb3csIEluZmluaXR5XSkpIGNvbnRpbnVlIC8vIHNraXAgdG8gYXZvaWQgaGVhdnkgY29tcHV0YXRpb25cbiAgICAgICAgaWYgKG5leHRGb2xkSXNDb25uZWN0ZWQgJiYgdGhpcy5pc011bHRpTGluZVBhcmFtZXRlckZ1bmN0aW9uUmFuZ2UocmFuZ2UsIG5leHRSYW5nZSwgYm9keVN0YXJ0UmVnZXgpKSB7XG4gICAgICAgICAgY29uc3QgYm9keVJhbmdlID0gZm9sZFJhbmdlcy5zaGlmdCgpXG4gICAgICAgICAgc2F2ZUZ1bmN0aW9uUmFuZ2Uoe2FSYW5nZTogcmFuZ2UudW5pb24oYm9keVJhbmdlKSwgaW5uZXJSYW5nZTogYm9keVJhbmdlfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzYXZlRnVuY3Rpb25SYW5nZSh7YVJhbmdlOiByYW5nZSwgaW5uZXJSYW5nZTogcmFuZ2V9KVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwcmV2aW91c1JvdyA9IHJhbmdlLnN0YXJ0LnJvdyAtIDFcbiAgICAgICAgaWYgKHByZXZpb3VzUm93IDwgMCkgY29udGludWVcbiAgICAgICAgaWYgKGVkaXRvci5pc0ZvbGRhYmxlQXRCdWZmZXJSb3cocHJldmlvdXNSb3cpKSBjb250aW51ZVxuICAgICAgICBjb25zdCBtYXliZUFGdW5jdGlvblJhbmdlID0gcmFuZ2UudW5pb24oZWRpdG9yLmJ1ZmZlclJhbmdlRm9yQnVmZmVyUm93KHByZXZpb3VzUm93KSlcbiAgICAgICAgaWYgKCFtYXliZUFGdW5jdGlvblJhbmdlLmNvbnRhaW5zUG9pbnQoW2N1cnNvclJvdywgSW5maW5pdHldKSkgY29udGludWUgLy8gc2tpcCB0byBhdm9pZCBoZWF2eSBjb21wdXRhdGlvblxuXG4gICAgICAgIGNvbnN0IGlzQm9keVN0YXJ0T25seVJvdyA9IHJvdyA9PlxuICAgICAgICAgIG5ldyBSZWdFeHAoJ15cXFxccyonICsgYm9keVN0YXJ0UmVnZXguc291cmNlKS50ZXN0KGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cpKVxuICAgICAgICBpZiAoaXNCb2R5U3RhcnRPbmx5Um93KHJhbmdlLnN0YXJ0LnJvdykgJiYgaXNJbmNsdWRlRnVuY3Rpb25TY29wZUZvclJvdyhwcmV2aW91c1JvdykpIHtcbiAgICAgICAgICBzYXZlRnVuY3Rpb25SYW5nZSh7YVJhbmdlOiBtYXliZUFGdW5jdGlvblJhbmdlLCBpbm5lclJhbmdlOiByYW5nZX0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGZ1bmN0aW9uUmFuZ2Ugb2YgZnVuY3Rpb25SYW5nZXMucmV2ZXJzZSgpKSB7XG4gICAgICBjb25zdCB7c3RhcnQsIGVuZH0gPSB0aGlzLmlzQSgpID8gZnVuY3Rpb25SYW5nZS5hUmFuZ2UgOiBmdW5jdGlvblJhbmdlLmlubmVyUmFuZ2VcbiAgICAgIGNvbnN0IHJhbmdlID0gdGhpcy5nZXRCdWZmZXJSYW5nZUZvclJvd1JhbmdlKFtzdGFydC5yb3csIGVuZC5yb3ddKVxuICAgICAgaWYgKCFzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKS5jb250YWluc1JhbmdlKHJhbmdlKSkgcmV0dXJuIHJhbmdlXG4gICAgfVxuICB9XG5cbiAgYnVpbGRJbm5lclJhbmdlIChyYW5nZSkge1xuICAgIGNvbnN0IGVuZFJvd1RyYW5zbGF0aW9uID0gdGhpcy51dGlscy5kb2VzUmFuZ2VTdGFydEFuZEVuZFdpdGhTYW1lSW5kZW50TGV2ZWwodGhpcy5lZGl0b3IsIHJhbmdlKSA/IC0xIDogMFxuICAgIHJldHVybiByYW5nZS50cmFuc2xhdGUoWzEsIDBdLCBbZW5kUm93VHJhbnNsYXRpb24sIDBdKVxuICB9XG5cbiAgYnVpbGRBUmFuZ2UgKHJhbmdlKSB7XG4gICAgLy8gTk9URTogVGhpcyBhZGp1c3RtZW50IHNob3VkIG5vdCBiZSBuZWNlc3NhcnkgaWYgbGFuZ3VhZ2Utc3ludGF4IGlzIHByb3Blcmx5IGRlZmluZWQuXG4gICAgY29uc3QgZW5kUm93VHJhbnNsYXRpb24gPSB0aGlzLmlzR3JhbW1hckRvZXNOb3RGb2xkQ2xvc2luZ1JvdygpID8gKzEgOiAwXG4gICAgcmV0dXJuIHJhbmdlLnRyYW5zbGF0ZShbMCwgMF0sIFtlbmRSb3dUcmFuc2xhdGlvbiwgMF0pXG4gIH1cblxuICBpc0dyYW1tYXJEb2VzTm90Rm9sZENsb3NpbmdSb3cgKCkge1xuICAgIGNvbnN0IHtzY29wZU5hbWUsIHBhY2thZ2VOYW1lfSA9IHRoaXMuZWRpdG9yLmdldEdyYW1tYXIoKVxuICAgIGlmICh0aGlzLnNjb3BlTmFtZXNPbWl0dGluZ0Nsb3NpbmdCcmFjZS5pbmNsdWRlcyhzY29wZU5hbWUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBIQUNLOiBSdXN0IGhhdmUgdHdvIHBhY2thZ2UgYGxhbmd1YWdlLXJ1c3RgIGFuZCBgYXRvbS1sYW5ndWFnZS1ydXN0YFxuICAgICAgLy8gbGFuZ3VhZ2UtcnVzdCBkb24ndCBmb2xkIGVuZGluZyBgfWAsIGJ1dCBhdG9tLWxhbmd1YWdlLXJ1c3QgZG9lcy5cbiAgICAgIHJldHVybiBzY29wZU5hbWUgPT09ICdzb3VyY2UucnVzdCcgJiYgcGFja2FnZU5hbWUgPT09ICdsYW5ndWFnZS1ydXN0J1xuICAgIH1cbiAgfVxufVxuXG4vLyBTZWN0aW9uOiBPdGhlclxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgQXJndW1lbnRzIGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIG5ld0FyZ0luZm8gKGFyZ1N0YXJ0LCBhcmcsIHNlcGFyYXRvcikge1xuICAgIGNvbnN0IGFyZ0VuZCA9IHRoaXMudXRpbHMudHJhdmVyc2VUZXh0RnJvbVBvaW50KGFyZ1N0YXJ0LCBhcmcpXG4gICAgY29uc3QgYXJnUmFuZ2UgPSBuZXcgUmFuZ2UoYXJnU3RhcnQsIGFyZ0VuZClcblxuICAgIGNvbnN0IHNlcGFyYXRvckVuZCA9IHRoaXMudXRpbHMudHJhdmVyc2VUZXh0RnJvbVBvaW50KGFyZ0VuZCwgc2VwYXJhdG9yICE9IG51bGwgPyBzZXBhcmF0b3IgOiAnJylcbiAgICBjb25zdCBzZXBhcmF0b3JSYW5nZSA9IG5ldyBSYW5nZShhcmdFbmQsIHNlcGFyYXRvckVuZClcblxuICAgIGNvbnN0IGlubmVyUmFuZ2UgPSBhcmdSYW5nZVxuICAgIGNvbnN0IGFSYW5nZSA9IGFyZ1JhbmdlLnVuaW9uKHNlcGFyYXRvclJhbmdlKVxuICAgIHJldHVybiB7YXJnUmFuZ2UsIHNlcGFyYXRvclJhbmdlLCBpbm5lclJhbmdlLCBhUmFuZ2V9XG4gIH1cblxuICBnZXRBcmd1bWVudHNSYW5nZUZvclNlbGVjdGlvbiAoc2VsZWN0aW9uKSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgIG1lbWJlcjogWydDdXJseUJyYWNrZXQnLCAnU3F1YXJlQnJhY2tldCcsICdQYXJlbnRoZXNpcyddLFxuICAgICAgaW5jbHVzaXZlOiBmYWxzZVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5nZXRJbnN0YW5jZSgnSW5uZXJBbnlQYWlyJywgb3B0aW9ucykuZ2V0UmFuZ2Uoc2VsZWN0aW9uKVxuICB9XG5cbiAgZ2V0UmFuZ2UgKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IHtzcGxpdEFyZ3VtZW50cywgdHJhdmVyc2VUZXh0RnJvbVBvaW50LCBnZXRMYXN0fSA9IHRoaXMudXRpbHNcbiAgICBsZXQgcmFuZ2UgPSB0aGlzLmdldEFyZ3VtZW50c1JhbmdlRm9yU2VsZWN0aW9uKHNlbGVjdGlvbilcbiAgICBjb25zdCBwYWlyUmFuZ2VGb3VuZCA9IHJhbmdlICE9IG51bGxcblxuICAgIHJhbmdlID0gcmFuZ2UgfHwgdGhpcy5nZXRJbnN0YW5jZSgnSW5uZXJDdXJyZW50TGluZScpLmdldFJhbmdlKHNlbGVjdGlvbikgLy8gZmFsbGJhY2tcbiAgICBpZiAoIXJhbmdlKSByZXR1cm5cblxuICAgIHJhbmdlID0gdGhpcy50cmltQnVmZmVyUmFuZ2UocmFuZ2UpXG5cbiAgICBjb25zdCB0ZXh0ID0gdGhpcy5lZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UpXG4gICAgY29uc3QgYWxsVG9rZW5zID0gc3BsaXRBcmd1bWVudHModGV4dCwgcGFpclJhbmdlRm91bmQpXG5cbiAgICBjb25zdCBhcmdJbmZvcyA9IFtdXG4gICAgbGV0IGFyZ1N0YXJ0ID0gcmFuZ2Uuc3RhcnRcblxuICAgIC8vIFNraXAgc3RhcnRpbmcgc2VwYXJhdG9yXG4gICAgaWYgKGFsbFRva2Vucy5sZW5ndGggJiYgYWxsVG9rZW5zWzBdLnR5cGUgPT09ICdzZXBhcmF0b3InKSB7XG4gICAgICBjb25zdCB0b2tlbiA9IGFsbFRva2Vucy5zaGlmdCgpXG4gICAgICBhcmdTdGFydCA9IHRyYXZlcnNlVGV4dEZyb21Qb2ludChhcmdTdGFydCwgdG9rZW4udGV4dClcbiAgICB9XG5cbiAgICB3aGlsZSAoYWxsVG9rZW5zLmxlbmd0aCkge1xuICAgICAgY29uc3QgdG9rZW4gPSBhbGxUb2tlbnMuc2hpZnQoKVxuICAgICAgaWYgKHRva2VuLnR5cGUgPT09ICdhcmd1bWVudCcpIHtcbiAgICAgICAgY29uc3QgbmV4dFRva2VuID0gYWxsVG9rZW5zLnNoaWZ0KClcbiAgICAgICAgY29uc3Qgc2VwYXJhdG9yID0gbmV4dFRva2VuID8gbmV4dFRva2VuLnRleHQgOiB1bmRlZmluZWRcbiAgICAgICAgY29uc3QgYXJnSW5mbyA9IHRoaXMubmV3QXJnSW5mbyhhcmdTdGFydCwgdG9rZW4udGV4dCwgc2VwYXJhdG9yKVxuXG4gICAgICAgIGlmIChhbGxUb2tlbnMubGVuZ3RoID09PSAwICYmIGFyZ0luZm9zLmxlbmd0aCkge1xuICAgICAgICAgIGFyZ0luZm8uYVJhbmdlID0gYXJnSW5mby5hcmdSYW5nZS51bmlvbihnZXRMYXN0KGFyZ0luZm9zKS5zZXBhcmF0b3JSYW5nZSlcbiAgICAgICAgfVxuXG4gICAgICAgIGFyZ1N0YXJ0ID0gYXJnSW5mby5hUmFuZ2UuZW5kXG4gICAgICAgIGFyZ0luZm9zLnB1c2goYXJnSW5mbylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignbXVzdCBub3QgaGFwcGVuJylcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBwb2ludCA9IHRoaXMuZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgIGZvciAoY29uc3Qge2lubmVyUmFuZ2UsIGFSYW5nZX0gb2YgYXJnSW5mb3MpIHtcbiAgICAgIGlmIChpbm5lclJhbmdlLmVuZC5pc0dyZWF0ZXJUaGFuT3JFcXVhbChwb2ludCkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNJbm5lcigpID8gaW5uZXJSYW5nZSA6IGFSYW5nZVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBDdXJyZW50TGluZSBleHRlbmRzIFRleHRPYmplY3Qge1xuICBnZXRSYW5nZSAoc2VsZWN0aW9uKSB7XG4gICAgY29uc3Qge3Jvd30gPSB0aGlzLmdldEN1cnNvclBvc2l0aW9uRm9yU2VsZWN0aW9uKHNlbGVjdGlvbilcbiAgICBjb25zdCByYW5nZSA9IHRoaXMuZWRpdG9yLmJ1ZmZlclJhbmdlRm9yQnVmZmVyUm93KHJvdylcbiAgICByZXR1cm4gdGhpcy5pc0EoKSA/IHJhbmdlIDogdGhpcy50cmltQnVmZmVyUmFuZ2UocmFuZ2UpXG4gIH1cbn1cblxuY2xhc3MgRW50aXJlIGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIHdpc2UgPSAnbGluZXdpc2UnXG4gIHNlbGVjdE9uY2UgPSB0cnVlXG5cbiAgZ2V0UmFuZ2UgKHNlbGVjdGlvbikge1xuICAgIHJldHVybiB0aGlzLmVkaXRvci5idWZmZXIuZ2V0UmFuZ2UoKVxuICB9XG59XG5cbmNsYXNzIEVtcHR5IGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIHN0YXRpYyBjb21tYW5kID0gZmFsc2VcbiAgc2VsZWN0T25jZSA9IHRydWVcbn1cblxuY2xhc3MgTGF0ZXN0Q2hhbmdlIGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIHdpc2UgPSBudWxsXG4gIHNlbGVjdE9uY2UgPSB0cnVlXG4gIGdldFJhbmdlIChzZWxlY3Rpb24pIHtcbiAgICBjb25zdCBzdGFydCA9IHRoaXMudmltU3RhdGUubWFyay5nZXQoJ1snKVxuICAgIGNvbnN0IGVuZCA9IHRoaXMudmltU3RhdGUubWFyay5nZXQoJ10nKVxuICAgIGlmIChzdGFydCAmJiBlbmQpIHtcbiAgICAgIHJldHVybiBuZXcgUmFuZ2Uoc3RhcnQsIGVuZClcbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgU2VhcmNoTWF0Y2hGb3J3YXJkIGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIGJhY2t3YXJkID0gZmFsc2VcblxuICBmaW5kTWF0Y2ggKGZyb20sIHJlZ2V4KSB7XG4gICAgaWYgKHRoaXMuYmFja3dhcmQpIHtcbiAgICAgIGlmICh0aGlzLm1vZGUgPT09ICd2aXN1YWwnKSB7XG4gICAgICAgIGZyb20gPSB0aGlzLnV0aWxzLnRyYW5zbGF0ZVBvaW50QW5kQ2xpcCh0aGlzLmVkaXRvciwgZnJvbSwgJ2JhY2t3YXJkJylcbiAgICAgIH1cblxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtmcm9tOiBbZnJvbS5yb3csIEluZmluaXR5XX1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJhbmdlOiB0aGlzLmZpbmRJbkVkaXRvcignYmFja3dhcmQnLCByZWdleCwgb3B0aW9ucywgKHtyYW5nZX0pID0+IHJhbmdlLnN0YXJ0LmlzTGVzc1RoYW4oZnJvbSkgJiYgcmFuZ2UpLFxuICAgICAgICB3aGljaElzSGVhZDogJ3N0YXJ0J1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5tb2RlID09PSAndmlzdWFsJykge1xuICAgICAgICBmcm9tID0gdGhpcy51dGlscy50cmFuc2xhdGVQb2ludEFuZENsaXAodGhpcy5lZGl0b3IsIGZyb20sICdmb3J3YXJkJylcbiAgICAgIH1cblxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtmcm9tOiBbZnJvbS5yb3csIDBdfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmFuZ2U6IHRoaXMuZmluZEluRWRpdG9yKCdmb3J3YXJkJywgcmVnZXgsIG9wdGlvbnMsICh7cmFuZ2V9KSA9PiByYW5nZS5lbmQuaXNHcmVhdGVyVGhhbihmcm9tKSAmJiByYW5nZSksXG4gICAgICAgIHdoaWNoSXNIZWFkOiAnZW5kJ1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldFJhbmdlIChzZWxlY3Rpb24pIHtcbiAgICBjb25zdCBwYXR0ZXJuID0gdGhpcy5nbG9iYWxTdGF0ZS5nZXQoJ2xhc3RTZWFyY2hQYXR0ZXJuJylcbiAgICBpZiAoIXBhdHRlcm4pIHJldHVyblxuXG4gICAgY29uc3QgZnJvbVBvaW50ID0gc2VsZWN0aW9uLmdldEhlYWRCdWZmZXJQb3NpdGlvbigpXG4gICAgY29uc3Qge3JhbmdlLCB3aGljaElzSGVhZH0gPSB0aGlzLmZpbmRNYXRjaChmcm9tUG9pbnQsIHBhdHRlcm4pXG4gICAgaWYgKHJhbmdlKSB7XG4gICAgICByZXR1cm4gdGhpcy51bmlvblJhbmdlQW5kRGV0ZXJtaW5lUmV2ZXJzZWRTdGF0ZShzZWxlY3Rpb24sIHJhbmdlLCB3aGljaElzSGVhZClcbiAgICB9XG4gIH1cblxuICB1bmlvblJhbmdlQW5kRGV0ZXJtaW5lUmV2ZXJzZWRTdGF0ZSAoc2VsZWN0aW9uLCByYW5nZSwgd2hpY2hJc0hlYWQpIHtcbiAgICBpZiAoc2VsZWN0aW9uLmlzRW1wdHkoKSkgcmV0dXJuIHJhbmdlXG5cbiAgICBsZXQgaGVhZCA9IHJhbmdlW3doaWNoSXNIZWFkXVxuICAgIGNvbnN0IHRhaWwgPSBzZWxlY3Rpb24uZ2V0VGFpbEJ1ZmZlclBvc2l0aW9uKClcblxuICAgIGlmICh0aGlzLmJhY2t3YXJkKSB7XG4gICAgICBpZiAodGFpbC5pc0xlc3NUaGFuKGhlYWQpKSBoZWFkID0gdGhpcy51dGlscy50cmFuc2xhdGVQb2ludEFuZENsaXAodGhpcy5lZGl0b3IsIGhlYWQsICdmb3J3YXJkJylcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGhlYWQuaXNMZXNzVGhhbih0YWlsKSkgaGVhZCA9IHRoaXMudXRpbHMudHJhbnNsYXRlUG9pbnRBbmRDbGlwKHRoaXMuZWRpdG9yLCBoZWFkLCAnYmFja3dhcmQnKVxuICAgIH1cblxuICAgIHRoaXMucmV2ZXJzZWQgPSBoZWFkLmlzTGVzc1RoYW4odGFpbClcbiAgICByZXR1cm4gbmV3IFJhbmdlKHRhaWwsIGhlYWQpLnVuaW9uKHRoaXMuc3dyYXAoc2VsZWN0aW9uKS5nZXRUYWlsQnVmZmVyUmFuZ2UoKSlcbiAgfVxuXG4gIHNlbGVjdFRleHRPYmplY3QgKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IHJhbmdlID0gdGhpcy5nZXRSYW5nZShzZWxlY3Rpb24pXG4gICAgaWYgKHJhbmdlKSB7XG4gICAgICB0aGlzLnN3cmFwKHNlbGVjdGlvbikuc2V0QnVmZmVyUmFuZ2UocmFuZ2UsIHtyZXZlcnNlZDogdGhpcy5yZXZlcnNlZCAhPSBudWxsID8gdGhpcy5yZXZlcnNlZCA6IHRoaXMuYmFja3dhcmR9KVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgU2VhcmNoTWF0Y2hCYWNrd2FyZCBleHRlbmRzIFNlYXJjaE1hdGNoRm9yd2FyZCB7XG4gIGJhY2t3YXJkID0gdHJ1ZVxufVxuXG4vLyBbTGltaXRhdGlvbjogd29uJ3QgZml4XTogU2VsZWN0ZWQgcmFuZ2UgaXMgbm90IHN1Ym1vZGUgYXdhcmUuIGFsd2F5cyBjaGFyYWN0ZXJ3aXNlLlxuLy8gU28gZXZlbiBpZiBvcmlnaW5hbCBzZWxlY3Rpb24gd2FzIHZMIG9yIHZCLCBzZWxlY3RlZCByYW5nZSBieSB0aGlzIHRleHQtb2JqZWN0XG4vLyBpcyBhbHdheXMgdkMgcmFuZ2UuXG5jbGFzcyBQcmV2aW91c1NlbGVjdGlvbiBleHRlbmRzIFRleHRPYmplY3Qge1xuICB3aXNlID0gbnVsbFxuICBzZWxlY3RPbmNlID0gdHJ1ZVxuXG4gIHNlbGVjdFRleHRPYmplY3QgKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IHtwcm9wZXJ0aWVzLCBzdWJtb2RlfSA9IHRoaXMudmltU3RhdGUucHJldmlvdXNTZWxlY3Rpb25cbiAgICBpZiAocHJvcGVydGllcyAmJiBzdWJtb2RlKSB7XG4gICAgICB0aGlzLndpc2UgPSBzdWJtb2RlXG4gICAgICB0aGlzLnN3cmFwKHRoaXMuZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKSkuc2VsZWN0QnlQcm9wZXJ0aWVzKHByb3BlcnRpZXMpXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBQZXJzaXN0ZW50U2VsZWN0aW9uIGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIHdpc2UgPSBudWxsXG4gIHNlbGVjdE9uY2UgPSB0cnVlXG5cbiAgc2VsZWN0VGV4dE9iamVjdCAoc2VsZWN0aW9uKSB7XG4gICAgaWYgKHRoaXMudmltU3RhdGUuaGFzUGVyc2lzdGVudFNlbGVjdGlvbnMoKSkge1xuICAgICAgdGhpcy5wZXJzaXN0ZW50U2VsZWN0aW9uLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2VzKClcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG59XG5cbi8vIFVzZWQgb25seSBieSBSZXBsYWNlV2l0aFJlZ2lzdGVyIGFuZCBQdXRCZWZvcmUgYW5kIGl0cycgY2hpbGRyZW4uXG5jbGFzcyBMYXN0UGFzdGVkUmFuZ2UgZXh0ZW5kcyBUZXh0T2JqZWN0IHtcbiAgc3RhdGljIGNvbW1hbmQgPSBmYWxzZVxuICB3aXNlID0gbnVsbFxuICBzZWxlY3RPbmNlID0gdHJ1ZVxuXG4gIHNlbGVjdFRleHRPYmplY3QgKHNlbGVjdGlvbikge1xuICAgIGZvciAoc2VsZWN0aW9uIG9mIHRoaXMuZWRpdG9yLmdldFNlbGVjdGlvbnMoKSkge1xuICAgICAgY29uc3QgcmFuZ2UgPSB0aGlzLnZpbVN0YXRlLnNlcXVlbnRpYWxQYXN0ZU1hbmFnZXIuZ2V0UGFzdGVkUmFuZ2VGb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgICAgc2VsZWN0aW9uLnNldEJ1ZmZlclJhbmdlKHJhbmdlKVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG59XG5cbmNsYXNzIFZpc2libGVBcmVhIGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIHNlbGVjdE9uY2UgPSB0cnVlXG5cbiAgZ2V0UmFuZ2UgKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IFtzdGFydFJvdywgZW5kUm93XSA9IHRoaXMuZWRpdG9yLmdldFZpc2libGVSb3dSYW5nZSgpXG4gICAgcmV0dXJuIHRoaXMuZWRpdG9yLmJ1ZmZlclJhbmdlRm9yU2NyZWVuUmFuZ2UoW1tzdGFydFJvdywgMF0sIFtlbmRSb3csIEluZmluaXR5XV0pXG4gIH1cbn1cblxuY2xhc3MgRGlmZkh1bmsgZXh0ZW5kcyBUZXh0T2JqZWN0IHtcbiAgd2lzZSA9ICdsaW5ld2lzZSdcbiAgc2VsZWN0T25jZSA9IHRydWVcbiAgZ2V0UmFuZ2UgKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IHJvdyA9IHRoaXMuZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKS5yb3dcbiAgICByZXR1cm4gdGhpcy51dGlscy5nZXRIdW5rUmFuZ2VBdEJ1ZmZlclJvdyh0aGlzLmVkaXRvciwgcm93KVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmFzc2lnbihcbiAge1xuICAgIFRleHRPYmplY3QsXG4gICAgV29yZCxcbiAgICBXaG9sZVdvcmQsXG4gICAgU21hcnRXb3JkLFxuICAgIFN1YndvcmQsXG4gICAgUGFpcixcbiAgICBBUGFpcixcbiAgICBBbnlQYWlyLFxuICAgIEFueVBhaXJBbGxvd0ZvcndhcmRpbmcsXG4gICAgQW55UXVvdGUsXG4gICAgUXVvdGUsXG4gICAgRG91YmxlUXVvdGUsXG4gICAgU2luZ2xlUXVvdGUsXG4gICAgQmFja1RpY2ssXG4gICAgQ3VybHlCcmFja2V0LFxuICAgIFNxdWFyZUJyYWNrZXQsXG4gICAgUGFyZW50aGVzaXMsXG4gICAgQW5nbGVCcmFja2V0LFxuICAgIFRhZyxcbiAgICBQYXJhZ3JhcGgsXG4gICAgSW5kZW50YXRpb24sXG4gICAgQ29tbWVudCxcbiAgICBDb21tZW50T3JQYXJhZ3JhcGgsXG4gICAgRm9sZCxcbiAgICBGdW5jdGlvbixcbiAgICBBcmd1bWVudHMsXG4gICAgQ3VycmVudExpbmUsXG4gICAgRW50aXJlLFxuICAgIEVtcHR5LFxuICAgIExhdGVzdENoYW5nZSxcbiAgICBTZWFyY2hNYXRjaEZvcndhcmQsXG4gICAgU2VhcmNoTWF0Y2hCYWNrd2FyZCxcbiAgICBQcmV2aW91c1NlbGVjdGlvbixcbiAgICBQZXJzaXN0ZW50U2VsZWN0aW9uLFxuICAgIExhc3RQYXN0ZWRSYW5nZSxcbiAgICBWaXNpYmxlQXJlYVxuICB9LFxuICBXb3JkLmRlcml2ZUNsYXNzKHRydWUpLFxuICBXaG9sZVdvcmQuZGVyaXZlQ2xhc3ModHJ1ZSksXG4gIFNtYXJ0V29yZC5kZXJpdmVDbGFzcyh0cnVlKSxcbiAgU3Vid29yZC5kZXJpdmVDbGFzcyh0cnVlKSxcbiAgQW55UGFpci5kZXJpdmVDbGFzcyh0cnVlKSxcbiAgQW55UGFpckFsbG93Rm9yd2FyZGluZy5kZXJpdmVDbGFzcyh0cnVlKSxcbiAgQW55UXVvdGUuZGVyaXZlQ2xhc3ModHJ1ZSksXG4gIERvdWJsZVF1b3RlLmRlcml2ZUNsYXNzKHRydWUpLFxuICBTaW5nbGVRdW90ZS5kZXJpdmVDbGFzcyh0cnVlKSxcbiAgQmFja1RpY2suZGVyaXZlQ2xhc3ModHJ1ZSksXG4gIEN1cmx5QnJhY2tldC5kZXJpdmVDbGFzcyh0cnVlLCB0cnVlKSxcbiAgU3F1YXJlQnJhY2tldC5kZXJpdmVDbGFzcyh0cnVlLCB0cnVlKSxcbiAgUGFyZW50aGVzaXMuZGVyaXZlQ2xhc3ModHJ1ZSwgdHJ1ZSksXG4gIEFuZ2xlQnJhY2tldC5kZXJpdmVDbGFzcyh0cnVlLCB0cnVlKSxcbiAgVGFnLmRlcml2ZUNsYXNzKHRydWUpLFxuICBQYXJhZ3JhcGguZGVyaXZlQ2xhc3ModHJ1ZSksXG4gIEluZGVudGF0aW9uLmRlcml2ZUNsYXNzKHRydWUpLFxuICBDb21tZW50LmRlcml2ZUNsYXNzKHRydWUpLFxuICBDb21tZW50T3JQYXJhZ3JhcGguZGVyaXZlQ2xhc3ModHJ1ZSksXG4gIEZvbGQuZGVyaXZlQ2xhc3ModHJ1ZSksXG4gIEZ1bmN0aW9uLmRlcml2ZUNsYXNzKHRydWUpLFxuICBBcmd1bWVudHMuZGVyaXZlQ2xhc3ModHJ1ZSksXG4gIEN1cnJlbnRMaW5lLmRlcml2ZUNsYXNzKHRydWUpLFxuICBFbnRpcmUuZGVyaXZlQ2xhc3ModHJ1ZSksXG4gIExhdGVzdENoYW5nZS5kZXJpdmVDbGFzcyh0cnVlKSxcbiAgUGVyc2lzdGVudFNlbGVjdGlvbi5kZXJpdmVDbGFzcyh0cnVlKSxcbiAgVmlzaWJsZUFyZWEuZGVyaXZlQ2xhc3ModHJ1ZSksXG4gIERpZmZIdW5rLmRlcml2ZUNsYXNzKHRydWUpXG4pXG4iXX0=