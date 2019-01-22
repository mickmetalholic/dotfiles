'use babel';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var settings = require('./settings');
var VimState = require('./vim-state');

var FILE_TABLE = undefined;

var classify = function classify(s) {
  return s[0].toUpperCase() + s.slice(1).replace(/-(\w)/g, function (m) {
    return m[1].toUpperCase();
  });
};
var dasherize = function dasherize(s) {
  return (s[0].toLowerCase() + s.slice(1)).replace(/[A-Z]/g, function (m) {
    return '-' + m.toLowerCase();
  });
};

module.exports = (function () {
  _createClass(Base, [{
    key: 'name',
    get: function get() {
      return this.constructor.name;
    }
  }], [{
    key: 'classByName',
    value: new Map(),
    enumerable: true
  }, {
    key: 'commandPrefix',
    value: 'vim-mode-plus',
    enumerable: true
  }, {
    key: 'commandScope',
    value: 'atom-text-editor',
    enumerable: true
  }, {
    key: 'operationKind',
    value: null,
    enumerable: true
  }]);

  function Base(vimState) {
    _classCallCheck(this, Base);

    this.recordable = false;
    this.repeated = false;
    this.count = null;
    this.defaultCount = 1;

    this.vimState = vimState;
  }

  _createClass(Base, [{
    key: 'initialize',
    value: function initialize() {}

    // Called both on cancel and success
  }, {
    key: 'resetState',
    value: function resetState() {}

    // OperationStack postpone execution untill isReady() get true, overridden on subclass.
  }, {
    key: 'isReady',
    value: function isReady() {
      return true;
    }

    // VisualModeSelect is anormal, since it's auto complemented in visial mode.
    // In other word, normal-operator is explicit whereas anormal-operator is implicit.
  }, {
    key: 'isTargetOfNormalOperator',
    value: function isTargetOfNormalOperator() {
      return this.operator && this.operator.name !== 'VisualModeSelect';
    }
  }, {
    key: 'hasCount',
    value: function hasCount() {
      return this.vimState.hasCount();
    }
  }, {
    key: 'getCount',
    value: function getCount() {
      if (this.count == null) {
        this.count = this.hasCount() ? this.vimState.getCount() : this.defaultCount;
      }
      return this.count;
    }

    // Identical to utils.limitNumber. Copy here to postpone full require of utils.
  }, {
    key: 'limitNumber',
    value: function limitNumber(number) {
      var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var max = _ref.max;
      var min = _ref.min;

      if (max != null) number = Math.min(number, max);
      if (min != null) number = Math.max(number, min);
      return number;
    }
  }, {
    key: 'resetCount',
    value: function resetCount() {
      this.count = null;
    }
  }, {
    key: 'countTimes',
    value: function countTimes(last, fn) {
      if (last < 1) return;

      var stopped = false;
      var stop = function stop() {
        return stopped = true;
      };
      for (var count = 1; count <= last; count++) {
        fn({ count: count, isFinal: count === last, stop: stop });
        if (stopped) break;
      }
    }
  }, {
    key: 'activateMode',
    value: function activateMode(mode, submode) {
      var _this = this;

      this.onDidFinishOperation(function () {
        _this.vimState.activate(mode, submode);
      });
    }
  }, {
    key: 'activateModeIfNecessary',
    value: function activateModeIfNecessary(mode, submode) {
      if (!this.vimState.isMode(mode, submode)) {
        this.activateMode(mode, submode);
      }
    }
  }, {
    key: 'getInstance',
    value: function getInstance(name, properties) {
      return this.constructor.getInstance(this.vimState, name, properties);
    }
  }, {
    key: 'cancelOperation',
    value: function cancelOperation() {
      this.vimState.operationStack.cancel(this);
    }
  }, {
    key: 'processOperation',
    value: function processOperation() {
      this.vimState.operationStack.process();
    }
  }, {
    key: 'focusInput',
    value: function focusInput() {
      var _this2 = this;

      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      if (!options.onConfirm) {
        options.onConfirm = function (input) {
          _this2.input = input;
          _this2.processOperation();
        };
      }
      if (!options.onCancel) options.onCancel = function () {
        return _this2.cancelOperation();
      };
      if (!options.onChange) options.onChange = function (input) {
        return _this2.vimState.hover.set(input);
      };

      this.vimState.focusInput(options);
    }

    // Return promise which resolve with input char or `undefined` when cancelled.
  }, {
    key: 'focusInputPromised',
    value: function focusInputPromised() {
      var _this3 = this;

      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      return new Promise(function (resolve) {
        var defaultOptions = { hideCursor: true, onChange: function onChange(input) {
            return _this3.vimState.hover.set(input);
          } };
        _this3.vimState.focusInput(Object.assign(defaultOptions, options, { onConfirm: resolve, onCancel: resolve }));
      });
    }
  }, {
    key: 'readChar',
    value: function readChar() {
      var _this4 = this;

      this.vimState.readChar({
        onConfirm: function onConfirm(input) {
          _this4.input = input;
          _this4.processOperation();
        },
        onCancel: function onCancel() {
          return _this4.cancelOperation();
        }
      });
    }

    // Return promise which resolve with read char or `undefined` when cancelled.
  }, {
    key: 'readCharPromised',
    value: function readCharPromised() {
      var _this5 = this;

      return new Promise(function (resolve) {
        _this5.vimState.readChar({ onConfirm: resolve, onCancel: resolve });
      });
    }
  }, {
    key: 'instanceof',
    value: function _instanceof(klassName) {
      return this instanceof Base.getClass(klassName);
    }
  }, {
    key: 'isOperator',
    value: function isOperator() {
      // Don't use `instanceof` to postpone require for faster activation.
      return this.constructor.operationKind === 'operator';
    }
  }, {
    key: 'isMotion',
    value: function isMotion() {
      // Don't use `instanceof` to postpone require for faster activation.
      return this.constructor.operationKind === 'motion';
    }
  }, {
    key: 'isTextObject',
    value: function isTextObject() {
      // Don't use `instanceof` to postpone require for faster activation.
      return this.constructor.operationKind === 'text-object';
    }
  }, {
    key: 'getCursorBufferPosition',
    value: function getCursorBufferPosition() {
      return this.getBufferPositionForCursor(this.editor.getLastCursor());
    }
  }, {
    key: 'getCursorBufferPositions',
    value: function getCursorBufferPositions() {
      var _this6 = this;

      return this.editor.getCursors().map(function (cursor) {
        return _this6.getBufferPositionForCursor(cursor);
      });
    }
  }, {
    key: 'getCursorBufferPositionsOrdered',
    value: function getCursorBufferPositionsOrdered() {
      return this.utils.sortPoints(this.getCursorBufferPositions());
    }
  }, {
    key: 'getBufferPositionForCursor',
    value: function getBufferPositionForCursor(cursor) {
      return this.mode === 'visual' ? this.getCursorPositionForSelection(cursor.selection) : cursor.getBufferPosition();
    }
  }, {
    key: 'getCursorPositionForSelection',
    value: function getCursorPositionForSelection(selection) {
      return this.swrap(selection).getBufferPositionFor('head', { from: ['property', 'selection'] });
    }
  }, {
    key: 'getOperationTypeChar',
    value: function getOperationTypeChar() {
      return ({ operator: 'O', 'text-object': 'T', motion: 'M', 'misc-command': 'X' })[this.constructor.operationKind];
    }
  }, {
    key: 'toString',
    value: function toString() {
      var base = this.name + '<' + this.getOperationTypeChar() + '>';
      return this.target ? base + '{target = ' + this.target.toString() + '}' : base;
    }
  }, {
    key: 'getCommandName',
    value: function getCommandName() {
      return this.constructor.getCommandName();
    }
  }, {
    key: 'getCommandNameWithoutPrefix',
    value: function getCommandNameWithoutPrefix() {
      return this.constructor.getCommandNameWithoutPrefix();
    }
  }, {
    key: 'getSmoothScrollDuation',
    value: function getSmoothScrollDuation(kind) {
      var base = 'smoothScrollOn' + kind;
      return this.getConfig(base) ? this.getConfig(base + 'Duration') : 0;
    }

    // Proxy propperties and methods
    // ===========================================================================
  }, {
    key: 'onDidChangeSearch',
    // prettier-ignore

    value: function onDidChangeSearch() {
      var _vimState;

      return (_vimState = this.vimState).onDidChangeSearch.apply(_vimState, arguments);
    }
    // prettier-ignore
  }, {
    key: 'onDidConfirmSearch',
    value: function onDidConfirmSearch() {
      var _vimState2;

      return (_vimState2 = this.vimState).onDidConfirmSearch.apply(_vimState2, arguments);
    }
    // prettier-ignore
  }, {
    key: 'onDidCancelSearch',
    value: function onDidCancelSearch() {
      var _vimState3;

      return (_vimState3 = this.vimState).onDidCancelSearch.apply(_vimState3, arguments);
    }
    // prettier-ignore
  }, {
    key: 'onDidCommandSearch',
    value: function onDidCommandSearch() {
      var _vimState4;

      return (_vimState4 = this.vimState).onDidCommandSearch.apply(_vimState4, arguments);
    }
    // prettier-ignore
  }, {
    key: 'onDidSetTarget',
    value: function onDidSetTarget() {
      var _vimState5;

      return (_vimState5 = this.vimState).onDidSetTarget.apply(_vimState5, arguments);
    }
    // prettier-ignore
  }, {
    key: 'emitDidSetTarget',
    value: function emitDidSetTarget() {
      var _vimState6;

      return (_vimState6 = this.vimState).emitDidSetTarget.apply(_vimState6, arguments);
    }
    // prettier-ignore
  }, {
    key: 'onWillSelectTarget',
    value: function onWillSelectTarget() {
      var _vimState7;

      return (_vimState7 = this.vimState).onWillSelectTarget.apply(_vimState7, arguments);
    }
    // prettier-ignore
  }, {
    key: 'emitWillSelectTarget',
    value: function emitWillSelectTarget() {
      var _vimState8;

      return (_vimState8 = this.vimState).emitWillSelectTarget.apply(_vimState8, arguments);
    }
    // prettier-ignore
  }, {
    key: 'onDidSelectTarget',
    value: function onDidSelectTarget() {
      var _vimState9;

      return (_vimState9 = this.vimState).onDidSelectTarget.apply(_vimState9, arguments);
    }
    // prettier-ignore
  }, {
    key: 'emitDidSelectTarget',
    value: function emitDidSelectTarget() {
      var _vimState10;

      return (_vimState10 = this.vimState).emitDidSelectTarget.apply(_vimState10, arguments);
    }
    // prettier-ignore
  }, {
    key: 'onDidFailSelectTarget',
    value: function onDidFailSelectTarget() {
      var _vimState11;

      return (_vimState11 = this.vimState).onDidFailSelectTarget.apply(_vimState11, arguments);
    }
    // prettier-ignore
  }, {
    key: 'emitDidFailSelectTarget',
    value: function emitDidFailSelectTarget() {
      var _vimState12;

      return (_vimState12 = this.vimState).emitDidFailSelectTarget.apply(_vimState12, arguments);
    }
    // prettier-ignore
  }, {
    key: 'onWillFinishMutation',
    value: function onWillFinishMutation() {
      var _vimState13;

      return (_vimState13 = this.vimState).onWillFinishMutation.apply(_vimState13, arguments);
    }
    // prettier-ignore
  }, {
    key: 'emitWillFinishMutation',
    value: function emitWillFinishMutation() {
      var _vimState14;

      return (_vimState14 = this.vimState).emitWillFinishMutation.apply(_vimState14, arguments);
    }
    // prettier-ignore
  }, {
    key: 'onDidFinishMutation',
    value: function onDidFinishMutation() {
      var _vimState15;

      return (_vimState15 = this.vimState).onDidFinishMutation.apply(_vimState15, arguments);
    }
    // prettier-ignore
  }, {
    key: 'emitDidFinishMutation',
    value: function emitDidFinishMutation() {
      var _vimState16;

      return (_vimState16 = this.vimState).emitDidFinishMutation.apply(_vimState16, arguments);
    }
    // prettier-ignore
  }, {
    key: 'onDidFinishOperation',
    value: function onDidFinishOperation() {
      var _vimState17;

      return (_vimState17 = this.vimState).onDidFinishOperation.apply(_vimState17, arguments);
    }
    // prettier-ignore
  }, {
    key: 'onDidResetOperationStack',
    value: function onDidResetOperationStack() {
      var _vimState18;

      return (_vimState18 = this.vimState).onDidResetOperationStack.apply(_vimState18, arguments);
    }
    // prettier-ignore
  }, {
    key: 'subscribe',
    value: function subscribe() {
      var _vimState19;

      return (_vimState19 = this.vimState).subscribe.apply(_vimState19, arguments);
    }
    // prettier-ignore
  }, {
    key: 'isMode',
    value: function isMode() {
      var _vimState20;

      return (_vimState20 = this.vimState).isMode.apply(_vimState20, arguments);
    }
    // prettier-ignore
  }, {
    key: 'getBlockwiseSelections',
    value: function getBlockwiseSelections() {
      var _vimState21;

      return (_vimState21 = this.vimState).getBlockwiseSelections.apply(_vimState21, arguments);
    }
    // prettier-ignore
  }, {
    key: 'getLastBlockwiseSelection',
    value: function getLastBlockwiseSelection() {
      var _vimState22;

      return (_vimState22 = this.vimState).getLastBlockwiseSelection.apply(_vimState22, arguments);
    }
    // prettier-ignore
  }, {
    key: 'addToClassList',
    value: function addToClassList() {
      var _vimState23;

      return (_vimState23 = this.vimState).addToClassList.apply(_vimState23, arguments);
    }
    // prettier-ignore
  }, {
    key: 'getConfig',
    value: function getConfig() {
      var _vimState24;

      return (_vimState24 = this.vimState).getConfig.apply(_vimState24, arguments);
    }
    // prettier-ignore

    // Wrapper for this.utils
    // ===========================================================================
  }, {
    key: 'getVimEofBufferPosition',
    value: function getVimEofBufferPosition() {
      return this.utils.getVimEofBufferPosition(this.editor);
    }
    // prettier-ignore
  }, {
    key: 'getVimLastBufferRow',
    value: function getVimLastBufferRow() {
      return this.utils.getVimLastBufferRow(this.editor);
    }
    // prettier-ignore
  }, {
    key: 'getVimLastScreenRow',
    value: function getVimLastScreenRow() {
      return this.utils.getVimLastScreenRow(this.editor);
    }
    // prettier-ignore
  }, {
    key: 'getValidVimBufferRow',
    value: function getValidVimBufferRow(row) {
      return this.utils.getValidVimBufferRow(this.editor, row);
    }
    // prettier-ignore
  }, {
    key: 'getValidVimScreenRow',
    value: function getValidVimScreenRow(row) {
      return this.utils.getValidVimScreenRow(this.editor, row);
    }
    // prettier-ignore
  }, {
    key: 'getWordBufferRangeAndKindAtBufferPosition',
    value: function getWordBufferRangeAndKindAtBufferPosition() {
      var _utils;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return (_utils = this.utils).getWordBufferRangeAndKindAtBufferPosition.apply(_utils, [this.editor].concat(args));
    }
    // prettier-ignore
  }, {
    key: 'getFirstCharacterPositionForBufferRow',
    value: function getFirstCharacterPositionForBufferRow(row) {
      return this.utils.getFirstCharacterPositionForBufferRow(this.editor, row);
    }
    // prettier-ignore
  }, {
    key: 'getBufferRangeForRowRange',
    value: function getBufferRangeForRowRange(rowRange) {
      return this.utils.getBufferRangeForRowRange(this.editor, rowRange);
    }
    // prettier-ignore
  }, {
    key: 'scanEditor',
    value: function scanEditor() {
      var _utils2;

      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return (_utils2 = this.utils).scanEditor.apply(_utils2, [this.editor].concat(args));
    }
    // prettier-ignore
  }, {
    key: 'findInEditor',
    value: function findInEditor() {
      var _utils3;

      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      return (_utils3 = this.utils).findInEditor.apply(_utils3, [this.editor].concat(args));
    }
    // prettier-ignore
  }, {
    key: 'findPoint',
    value: function findPoint() {
      var _utils4;

      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      return (_utils4 = this.utils).findPoint.apply(_utils4, [this.editor].concat(args));
    }
    // prettier-ignore
  }, {
    key: 'trimBufferRange',
    value: function trimBufferRange() {
      var _utils5;

      for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        args[_key5] = arguments[_key5];
      }

      return (_utils5 = this.utils).trimBufferRange.apply(_utils5, [this.editor].concat(args));
    }
    // prettier-ignore
  }, {
    key: 'isEmptyRow',
    value: function isEmptyRow() {
      var _utils6;

      for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
        args[_key6] = arguments[_key6];
      }

      return (_utils6 = this.utils).isEmptyRow.apply(_utils6, [this.editor].concat(args));
    }
    // prettier-ignore
  }, {
    key: 'getFoldStartRowForRow',
    value: function getFoldStartRowForRow() {
      var _utils7;

      for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
        args[_key7] = arguments[_key7];
      }

      return (_utils7 = this.utils).getFoldStartRowForRow.apply(_utils7, [this.editor].concat(args));
    }
    // prettier-ignore
  }, {
    key: 'getFoldEndRowForRow',
    value: function getFoldEndRowForRow() {
      var _utils8;

      for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
        args[_key8] = arguments[_key8];
      }

      return (_utils8 = this.utils).getFoldEndRowForRow.apply(_utils8, [this.editor].concat(args));
    }
    // prettier-ignore
  }, {
    key: 'getBufferRows',
    value: function getBufferRows() {
      var _utils9;

      for (var _len9 = arguments.length, args = Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
        args[_key9] = arguments[_key9];
      }

      return (_utils9 = this.utils).getRows.apply(_utils9, [this.editor, 'buffer'].concat(args));
    }
    // prettier-ignore
  }, {
    key: 'getScreenRows',
    value: function getScreenRows() {
      var _utils10;

      for (var _len10 = arguments.length, args = Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {
        args[_key10] = arguments[_key10];
      }

      return (_utils10 = this.utils).getRows.apply(_utils10, [this.editor, 'screen'].concat(args));
    }
    // prettier-ignore
  }, {
    key: 'replaceTextInRangeViaDiff',
    value: function replaceTextInRangeViaDiff() {
      var _utils11;

      for (var _len11 = arguments.length, args = Array(_len11), _key11 = 0; _key11 < _len11; _key11++) {
        args[_key11] = arguments[_key11];
      }

      return (_utils11 = this.utils).replaceTextInRangeViaDiff.apply(_utils11, [this.editor].concat(args));
    }
    // prettier-ignore
  }, {
    key: 'mode',
    get: function get() {
      return this.vimState.mode;
    }
    // prettier-ignore
  }, {
    key: 'submode',
    get: function get() {
      return this.vimState.submode;
    }
    // prettier-ignore
  }, {
    key: 'swrap',
    get: function get() {
      return this.vimState.swrap;
    }
    // prettier-ignore
  }, {
    key: 'utils',
    get: function get() {
      return this.vimState.utils;
    }
    // prettier-ignore
  }, {
    key: 'editor',
    get: function get() {
      return this.vimState.editor;
    }
    // prettier-ignore
  }, {
    key: 'editorElement',
    get: function get() {
      return this.vimState.editorElement;
    }
    // prettier-ignore
  }, {
    key: 'globalState',
    get: function get() {
      return this.vimState.globalState;
    }
    // prettier-ignore
  }, {
    key: 'mutationManager',
    get: function get() {
      return this.vimState.mutationManager;
    }
    // prettier-ignore
  }, {
    key: 'occurrenceManager',
    get: function get() {
      return this.vimState.occurrenceManager;
    }
    // prettier-ignore
  }, {
    key: 'persistentSelection',
    get: function get() {
      return this.vimState.persistentSelection;
    }
    // prettier-ignore
  }, {
    key: '_',
    get: function get() {
      return this.vimState._;
    }
    // prettier-ignore
  }], [{
    key: 'isCommand',
    value: function isCommand() {
      return this.hasOwnProperty('command') ? this.command : true;
    }
  }, {
    key: 'getClass',
    value: function getClass(name) {
      if (!this.classByName.has(name)) {
        if (!FILE_TABLE) {
          (function () {
            FILE_TABLE = {};
            var namesByFile = require('./json/file-table.json');
            // convert namesByFile to fileByName(= FILE_TABLE)
            Object.keys(namesByFile).forEach(function (file) {
              return namesByFile[file].forEach(function (name) {
                return FILE_TABLE[name] = file;
              });
            });
          })();
        }
        Object.values(require(FILE_TABLE[name])).forEach(function (klass) {
          return klass.register();
        });

        if (atom.inDevMode() && settings.get('debug')) {
          console.log('lazy-require: ' + FILE_TABLE[name] + ' for ' + name);
        }
      }

      var klass = this.classByName.get(name);
      if (!klass) {
        throw new Error('class \'' + name + '\' not found');
      }
      return klass;
    }
  }, {
    key: 'getInstance',
    value: function getInstance(vimState, klass, properties) {
      klass = typeof klass === 'function' ? klass : Base.getClass(klass);
      var object = new klass(vimState); // eslint-disable-line new-cap
      if (properties) Object.assign(object, properties);
      object.initialize();
      return object;
    }

    // Don't remove this. Public API to register operations to classTable
    // This can be used from vmp-plugin such as vmp-ex-mode.
  }, {
    key: 'register',
    value: function register() {
      if (this.classByName.has(this.name)) {
        console.warn('Duplicate constructor ' + this.name);
      }
      this.classByName.set(this.name, this);
    }
  }, {
    key: 'getCommandName',
    value: function getCommandName() {
      return this.commandPrefix + ':' + this.getCommandNameWithoutPrefix();
    }
  }, {
    key: 'getCommandNameWithoutPrefix',
    value: function getCommandNameWithoutPrefix() {
      return dasherize(this.name);
    }
  }, {
    key: 'registerCommand',
    value: function registerCommand() {
      var _this7 = this;

      return VimState.registerCommandFromSpec(this.name, {
        scope: this.commandScope,
        prefix: this.commandPrefix,
        getClass: function getClass() {
          return _this7;
        }
      });
    }
  }, {
    key: 'getKindForCommandName',
    value: function getKindForCommandName(command) {
      var commandWithoutPrefix = command.replace(/^vim-mode-plus:/, '');
      var commandClassName = classify(commandWithoutPrefix);
      if (this.classByName.has(commandClassName)) {
        return this.classByName.get(commandClassName).operationKind;
      }
    }
  }, {
    key: '_',
    get: function get() {
      return VimState._;
    }
  }]);

  return Base;
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3l1YW5zaGVuLy5hdG9tL3BhY2thZ2VzL3ZpbS1tb2RlLXBsdXMvbGliL2Jhc2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFBOzs7Ozs7QUFFWCxJQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUE7QUFDdEMsSUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFBOztBQUV2QyxJQUFJLFVBQVUsWUFBQSxDQUFBOztBQUVkLElBQU0sUUFBUSxHQUFHLFNBQVgsUUFBUSxDQUFHLENBQUM7U0FBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFVBQUEsQ0FBQztXQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUU7R0FBQSxDQUFDO0NBQUEsQ0FBQTtBQUNoRyxJQUFNLFNBQVMsR0FBRyxTQUFaLFNBQVMsQ0FBRyxDQUFDO1NBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQSxDQUFFLE9BQU8sQ0FBQyxRQUFRLEVBQUUsVUFBQSxDQUFDO1dBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxXQUFXLEVBQUU7R0FBQSxDQUFDO0NBQUEsQ0FBQTs7QUFFdEcsTUFBTSxDQUFDLE9BQU87ZUFBUyxJQUFJOztTQVdoQixlQUFHO0FBQ1YsYUFBTyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQTtLQUM3Qjs7O1dBWm9CLElBQUksR0FBRyxFQUFFOzs7O1dBQ1AsZUFBZTs7OztXQUNoQixrQkFBa0I7Ozs7V0FDakIsSUFBSTs7OztBQVdmLFdBZlMsSUFBSSxDQWVaLFFBQVEsRUFBRTswQkFmRixJQUFJOztTQU16QixVQUFVLEdBQUcsS0FBSztTQUNsQixR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RyxHQUFHLEdBQUcsSUFBSSxDQUFDLDJCQUEyQixFQUFFLENBQUE7S0FDckU7OztXQUVrQyx1Q0FBRztBQUNwQyxhQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7S0FDNUI7OztXQUVzQiwyQkFBRzs7O0FBQ3hCLGFBQU8sUUFBUSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUU7QUFDakQsYUFBSyxFQUFFLElBQUksQ0FBQyxZQUFZO0FBQ3hCLGNBQU0sRUFBRSxJQUFJLENBQUMsYUFBYTtBQUMxQixnQkFBUSxFQUFFOztTQUFVO09BQ3JCLENBQUMsQ0FBQTtLQUNIOzs7V0FFNEIsK0JBQUMsT0FBTyxFQUFFO0FBQ3JDLFVBQU0sb0JBQW9CLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLENBQUMsQ0FBQTtBQUNuRSxVQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFBO0FBQ3ZELFVBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtBQUMxQyxlQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUMsYUFBYSxDQUFBO09BQzVEO0tBQ0Y7OztTQW9CWSxlQUFHO0FBQUUsYUFBTyxRQUFRLENBQUMsQ0FBQyxDQUFBO0tBQUU7OztTQS9RaEIsSUFBSTtJQThUMUIsQ0FBQSIsImZpbGUiOiIvaG9tZS95dWFuc2hlbi8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9iYXNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCdcblxuY29uc3Qgc2V0dGluZ3MgPSByZXF1aXJlKCcuL3NldHRpbmdzJylcbmNvbnN0IFZpbVN0YXRlID0gcmVxdWlyZSgnLi92aW0tc3RhdGUnKVxuXG5sZXQgRklMRV9UQUJMRVxuXG5jb25zdCBjbGFzc2lmeSA9IHMgPT4gc1swXS50b1VwcGVyQ2FzZSgpICsgcy5zbGljZSgxKS5yZXBsYWNlKC8tKFxcdykvZywgbSA9PiBtWzFdLnRvVXBwZXJDYXNlKCkpXG5jb25zdCBkYXNoZXJpemUgPSBzID0+IChzWzBdLnRvTG93ZXJDYXNlKCkgKyBzLnNsaWNlKDEpKS5yZXBsYWNlKC9bQS1aXS9nLCBtID0+ICctJyArIG0udG9Mb3dlckNhc2UoKSlcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBCYXNlIHtcbiAgc3RhdGljIGNsYXNzQnlOYW1lID0gbmV3IE1hcCgpXG4gIHN0YXRpYyBjb21tYW5kUHJlZml4ID0gJ3ZpbS1tb2RlLXBsdXMnXG4gIHN0YXRpYyBjb21tYW5kU2NvcGUgPSAnYXRvbS10ZXh0LWVkaXRvcidcbiAgc3RhdGljIG9wZXJhdGlvbktpbmQgPSBudWxsXG5cbiAgcmVjb3JkYWJsZSA9IGZhbHNlXG4gIHJlcGVhdGVkID0gZmFsc2VcbiAgY291bnQgPSBudWxsXG4gIGRlZmF1bHRDb3VudCA9IDFcblxuICBnZXQgbmFtZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IubmFtZVxuICB9XG5cbiAgY29uc3RydWN0b3IgKHZpbVN0YXRlKSB7XG4gICAgdGhpcy52aW1TdGF0ZSA9IHZpbVN0YXRlXG4gIH1cblxuICBpbml0aWFsaXplICgpIHt9XG5cbiAgLy8gQ2FsbGVkIGJvdGggb24gY2FuY2VsIGFuZCBzdWNjZXNzXG4gIHJlc2V0U3RhdGUgKCkge31cblxuICAvLyBPcGVyYXRpb25TdGFjayBwb3N0cG9uZSBleGVjdXRpb24gdW50aWxsIGlzUmVhZHkoKSBnZXQgdHJ1ZSwgb3ZlcnJpZGRlbiBvbiBzdWJjbGFzcy5cbiAgaXNSZWFkeSAoKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIC8vIFZpc3VhbE1vZGVTZWxlY3QgaXMgYW5vcm1hbCwgc2luY2UgaXQncyBhdXRvIGNvbXBsZW1lbnRlZCBpbiB2aXNpYWwgbW9kZS5cbiAgLy8gSW4gb3RoZXIgd29yZCwgbm9ybWFsLW9wZXJhdG9yIGlzIGV4cGxpY2l0IHdoZXJlYXMgYW5vcm1hbC1vcGVyYXRvciBpcyBpbXBsaWNpdC5cbiAgaXNUYXJnZXRPZk5vcm1hbE9wZXJhdG9yICgpIHtcbiAgICByZXR1cm4gdGhpcy5vcGVyYXRvciAmJiB0aGlzLm9wZXJhdG9yLm5hbWUgIT09ICdWaXN1YWxNb2RlU2VsZWN0J1xuICB9XG5cbiAgaGFzQ291bnQgKCkge1xuICAgIHJldHVybiB0aGlzLnZpbVN0YXRlLmhhc0NvdW50KClcbiAgfVxuXG4gIGdldENvdW50ICgpIHtcbiAgICBpZiAodGhpcy5jb3VudCA9PSBudWxsKSB7XG4gICAgICB0aGlzLmNvdW50ID0gdGhpcy5oYXNDb3VudCgpID8gdGhpcy52aW1TdGF0ZS5nZXRDb3VudCgpIDogdGhpcy5kZWZhdWx0Q291bnRcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY291bnRcbiAgfVxuXG4gIC8vIElkZW50aWNhbCB0byB1dGlscy5saW1pdE51bWJlci4gQ29weSBoZXJlIHRvIHBvc3Rwb25lIGZ1bGwgcmVxdWlyZSBvZiB1dGlscy5cbiAgbGltaXROdW1iZXIgKG51bWJlciwge21heCwgbWlufSA9IHt9KSB7XG4gICAgaWYgKG1heCAhPSBudWxsKSBudW1iZXIgPSBNYXRoLm1pbihudW1iZXIsIG1heClcbiAgICBpZiAobWluICE9IG51bGwpIG51bWJlciA9IE1hdGgubWF4KG51bWJlciwgbWluKVxuICAgIHJldHVybiBudW1iZXJcbiAgfVxuXG4gIHJlc2V0Q291bnQgKCkge1xuICAgIHRoaXMuY291bnQgPSBudWxsXG4gIH1cblxuICBjb3VudFRpbWVzIChsYXN0LCBmbikge1xuICAgIGlmIChsYXN0IDwgMSkgcmV0dXJuXG5cbiAgICBsZXQgc3RvcHBlZCA9IGZhbHNlXG4gICAgY29uc3Qgc3RvcCA9ICgpID0+IChzdG9wcGVkID0gdHJ1ZSlcbiAgICBmb3IgKGxldCBjb3VudCA9IDE7IGNvdW50IDw9IGxhc3Q7IGNvdW50KyspIHtcbiAgICAgIGZuKHtjb3VudCwgaXNGaW5hbDogY291bnQgPT09IGxhc3QsIHN0b3B9KVxuICAgICAgaWYgKHN0b3BwZWQpIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgYWN0aXZhdGVNb2RlIChtb2RlLCBzdWJtb2RlKSB7XG4gICAgdGhpcy5vbkRpZEZpbmlzaE9wZXJhdGlvbigoKSA9PiB7XG4gICAgICB0aGlzLnZpbVN0YXRlLmFjdGl2YXRlKG1vZGUsIHN1Ym1vZGUpXG4gICAgfSlcbiAgfVxuXG4gIGFjdGl2YXRlTW9kZUlmTmVjZXNzYXJ5IChtb2RlLCBzdWJtb2RlKSB7XG4gICAgaWYgKCF0aGlzLnZpbVN0YXRlLmlzTW9kZShtb2RlLCBzdWJtb2RlKSkge1xuICAgICAgdGhpcy5hY3RpdmF0ZU1vZGUobW9kZSwgc3VibW9kZSlcbiAgICB9XG4gIH1cblxuICBnZXRJbnN0YW5jZSAobmFtZSwgcHJvcGVydGllcykge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmdldEluc3RhbmNlKHRoaXMudmltU3RhdGUsIG5hbWUsIHByb3BlcnRpZXMpXG4gIH1cblxuICBjYW5jZWxPcGVyYXRpb24gKCkge1xuICAgIHRoaXMudmltU3RhdGUub3BlcmF0aW9uU3RhY2suY2FuY2VsKHRoaXMpXG4gIH1cblxuICBwcm9jZXNzT3BlcmF0aW9uICgpIHtcbiAgICB0aGlzLnZpbVN0YXRlLm9wZXJhdGlvblN0YWNrLnByb2Nlc3MoKVxuICB9XG5cbiAgZm9jdXNJbnB1dCAob3B0aW9ucyA9IHt9KSB7XG4gICAgaWYgKCFvcHRpb25zLm9uQ29uZmlybSkge1xuICAgICAgb3B0aW9ucy5vbkNvbmZpcm0gPSBpbnB1dCA9PiB7XG4gICAgICAgIHRoaXMuaW5wdXQgPSBpbnB1dFxuICAgICAgICB0aGlzLnByb2Nlc3NPcGVyYXRpb24oKVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIW9wdGlvbnMub25DYW5jZWwpIG9wdGlvbnMub25DYW5jZWwgPSAoKSA9PiB0aGlzLmNhbmNlbE9wZXJhdGlvbigpXG4gICAgaWYgKCFvcHRpb25zLm9uQ2hhbmdlKSBvcHRpb25zLm9uQ2hhbmdlID0gaW5wdXQgPT4gdGhpcy52aW1TdGF0ZS5ob3Zlci5zZXQoaW5wdXQpXG5cbiAgICB0aGlzLnZpbVN0YXRlLmZvY3VzSW5wdXQob3B0aW9ucylcbiAgfVxuXG4gIC8vIFJldHVybiBwcm9taXNlIHdoaWNoIHJlc29sdmUgd2l0aCBpbnB1dCBjaGFyIG9yIGB1bmRlZmluZWRgIHdoZW4gY2FuY2VsbGVkLlxuICBmb2N1c0lucHV0UHJvbWlzZWQgKG9wdGlvbnMgPSB7fSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIGNvbnN0IGRlZmF1bHRPcHRpb25zID0ge2hpZGVDdXJzb3I6IHRydWUsIG9uQ2hhbmdlOiBpbnB1dCA9PiB0aGlzLnZpbVN0YXRlLmhvdmVyLnNldChpbnB1dCl9XG4gICAgICB0aGlzLnZpbVN0YXRlLmZvY3VzSW5wdXQoT2JqZWN0LmFzc2lnbihkZWZhdWx0T3B0aW9ucywgb3B0aW9ucywge29uQ29uZmlybTogcmVzb2x2ZSwgb25DYW5jZWw6IHJlc29sdmV9KSlcbiAgICB9KVxuICB9XG5cbiAgcmVhZENoYXIgKCkge1xuICAgIHRoaXMudmltU3RhdGUucmVhZENoYXIoe1xuICAgICAgb25Db25maXJtOiBpbnB1dCA9PiB7XG4gICAgICAgIHRoaXMuaW5wdXQgPSBpbnB1dFxuICAgICAgICB0aGlzLnByb2Nlc3NPcGVyYXRpb24oKVxuICAgICAgfSxcbiAgICAgIG9uQ2FuY2VsOiAoKSA9PiB0aGlzLmNhbmNlbE9wZXJhdGlvbigpXG4gICAgfSlcbiAgfVxuXG4gIC8vIFJldHVybiBwcm9taXNlIHdoaWNoIHJlc29sdmUgd2l0aCByZWFkIGNoYXIgb3IgYHVuZGVmaW5lZGAgd2hlbiBjYW5jZWxsZWQuXG4gIHJlYWRDaGFyUHJvbWlzZWQgKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIHRoaXMudmltU3RhdGUucmVhZENoYXIoe29uQ29uZmlybTogcmVzb2x2ZSwgb25DYW5jZWw6IHJlc29sdmV9KVxuICAgIH0pXG4gIH1cblxuICBpbnN0YW5jZW9mIChrbGFzc05hbWUpIHtcbiAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIEJhc2UuZ2V0Q2xhc3Moa2xhc3NOYW1lKVxuICB9XG5cbiAgaXNPcGVyYXRvciAoKSB7XG4gICAgLy8gRG9uJ3QgdXNlIGBpbnN0YW5jZW9mYCB0byBwb3N0cG9uZSByZXF1aXJlIGZvciBmYXN0ZXIgYWN0aXZhdGlvbi5cbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5vcGVyYXRpb25LaW5kID09PSAnb3BlcmF0b3InXG4gIH1cblxuICBpc01vdGlvbiAoKSB7XG4gICAgLy8gRG9uJ3QgdXNlIGBpbnN0YW5jZW9mYCB0byBwb3N0cG9uZSByZXF1aXJlIGZvciBmYXN0ZXIgYWN0aXZhdGlvbi5cbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5vcGVyYXRpb25LaW5kID09PSAnbW90aW9uJ1xuICB9XG5cbiAgaXNUZXh0T2JqZWN0ICgpIHtcbiAgICAvLyBEb24ndCB1c2UgYGluc3RhbmNlb2ZgIHRvIHBvc3Rwb25lIHJlcXVpcmUgZm9yIGZhc3RlciBhY3RpdmF0aW9uLlxuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLm9wZXJhdGlvbktpbmQgPT09ICd0ZXh0LW9iamVjdCdcbiAgfVxuXG4gIGdldEN1cnNvckJ1ZmZlclBvc2l0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRCdWZmZXJQb3NpdGlvbkZvckN1cnNvcih0aGlzLmVkaXRvci5nZXRMYXN0Q3Vyc29yKCkpXG4gIH1cblxuICBnZXRDdXJzb3JCdWZmZXJQb3NpdGlvbnMgKCkge1xuICAgIHJldHVybiB0aGlzLmVkaXRvci5nZXRDdXJzb3JzKCkubWFwKGN1cnNvciA9PiB0aGlzLmdldEJ1ZmZlclBvc2l0aW9uRm9yQ3Vyc29yKGN1cnNvcikpXG4gIH1cblxuICBnZXRDdXJzb3JCdWZmZXJQb3NpdGlvbnNPcmRlcmVkICgpIHtcbiAgICByZXR1cm4gdGhpcy51dGlscy5zb3J0UG9pbnRzKHRoaXMuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb25zKCkpXG4gIH1cblxuICBnZXRCdWZmZXJQb3NpdGlvbkZvckN1cnNvciAoY3Vyc29yKSB7XG4gICAgcmV0dXJuIHRoaXMubW9kZSA9PT0gJ3Zpc3VhbCcgPyB0aGlzLmdldEN1cnNvclBvc2l0aW9uRm9yU2VsZWN0aW9uKGN1cnNvci5zZWxlY3Rpb24pIDogY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgfVxuXG4gIGdldEN1cnNvclBvc2l0aW9uRm9yU2VsZWN0aW9uIChzZWxlY3Rpb24pIHtcbiAgICByZXR1cm4gdGhpcy5zd3JhcChzZWxlY3Rpb24pLmdldEJ1ZmZlclBvc2l0aW9uRm9yKCdoZWFkJywge2Zyb206IFsncHJvcGVydHknLCAnc2VsZWN0aW9uJ119KVxuICB9XG5cbiAgZ2V0T3BlcmF0aW9uVHlwZUNoYXIgKCkge1xuICAgIHJldHVybiB7b3BlcmF0b3I6ICdPJywgJ3RleHQtb2JqZWN0JzogJ1QnLCBtb3Rpb246ICdNJywgJ21pc2MtY29tbWFuZCc6ICdYJ31bdGhpcy5jb25zdHJ1Y3Rvci5vcGVyYXRpb25LaW5kXVxuICB9XG5cbiAgdG9TdHJpbmcgKCkge1xuICAgIGNvbnN0IGJhc2UgPSBgJHt0aGlzLm5hbWV9PCR7dGhpcy5nZXRPcGVyYXRpb25UeXBlQ2hhcigpfT5gXG4gICAgcmV0dXJuIHRoaXMudGFyZ2V0ID8gYCR7YmFzZX17dGFyZ2V0ID0gJHt0aGlzLnRhcmdldC50b1N0cmluZygpfX1gIDogYmFzZVxuICB9XG5cbiAgZ2V0Q29tbWFuZE5hbWUgKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmdldENvbW1hbmROYW1lKClcbiAgfVxuXG4gIGdldENvbW1hbmROYW1lV2l0aG91dFByZWZpeCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuZ2V0Q29tbWFuZE5hbWVXaXRob3V0UHJlZml4KClcbiAgfVxuXG4gIHN0YXRpYyBpc0NvbW1hbmQgKCkge1xuICAgIHJldHVybiB0aGlzLmhhc093blByb3BlcnR5KCdjb21tYW5kJykgPyB0aGlzLmNvbW1hbmQgOiB0cnVlXG4gIH1cblxuICBzdGF0aWMgZ2V0Q2xhc3MgKG5hbWUpIHtcbiAgICBpZiAoIXRoaXMuY2xhc3NCeU5hbWUuaGFzKG5hbWUpKSB7XG4gICAgICBpZiAoIUZJTEVfVEFCTEUpIHtcbiAgICAgICAgRklMRV9UQUJMRSA9IHt9XG4gICAgICAgIGNvbnN0IG5hbWVzQnlGaWxlID0gcmVxdWlyZSgnLi9qc29uL2ZpbGUtdGFibGUuanNvbicpXG4gICAgICAgIC8vIGNvbnZlcnQgbmFtZXNCeUZpbGUgdG8gZmlsZUJ5TmFtZSg9IEZJTEVfVEFCTEUpXG4gICAgICAgIE9iamVjdC5rZXlzKG5hbWVzQnlGaWxlKS5mb3JFYWNoKGZpbGUgPT4gbmFtZXNCeUZpbGVbZmlsZV0uZm9yRWFjaChuYW1lID0+IChGSUxFX1RBQkxFW25hbWVdID0gZmlsZSkpKVxuICAgICAgfVxuICAgICAgT2JqZWN0LnZhbHVlcyhyZXF1aXJlKEZJTEVfVEFCTEVbbmFtZV0pKS5mb3JFYWNoKGtsYXNzID0+IGtsYXNzLnJlZ2lzdGVyKCkpXG5cbiAgICAgIGlmIChhdG9tLmluRGV2TW9kZSgpICYmIHNldHRpbmdzLmdldCgnZGVidWcnKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgbGF6eS1yZXF1aXJlOiAke0ZJTEVfVEFCTEVbbmFtZV19IGZvciAke25hbWV9YClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBrbGFzcyA9IHRoaXMuY2xhc3NCeU5hbWUuZ2V0KG5hbWUpXG4gICAgaWYgKCFrbGFzcykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBjbGFzcyAnJHtuYW1lfScgbm90IGZvdW5kYClcbiAgICB9XG4gICAgcmV0dXJuIGtsYXNzXG4gIH1cblxuICBzdGF0aWMgZ2V0SW5zdGFuY2UgKHZpbVN0YXRlLCBrbGFzcywgcHJvcGVydGllcykge1xuICAgIGtsYXNzID0gdHlwZW9mIGtsYXNzID09PSAnZnVuY3Rpb24nID8ga2xhc3MgOiBCYXNlLmdldENsYXNzKGtsYXNzKVxuICAgIGNvbnN0IG9iamVjdCA9IG5ldyBrbGFzcyh2aW1TdGF0ZSkgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuZXctY2FwXG4gICAgaWYgKHByb3BlcnRpZXMpIE9iamVjdC5hc3NpZ24ob2JqZWN0LCBwcm9wZXJ0aWVzKVxuICAgIG9iamVjdC5pbml0aWFsaXplKClcbiAgICByZXR1cm4gb2JqZWN0XG4gIH1cblxuICAvLyBEb24ndCByZW1vdmUgdGhpcy4gUHVibGljIEFQSSB0byByZWdpc3RlciBvcGVyYXRpb25zIHRvIGNsYXNzVGFibGVcbiAgLy8gVGhpcyBjYW4gYmUgdXNlZCBmcm9tIHZtcC1wbHVnaW4gc3VjaCBhcyB2bXAtZXgtbW9kZS5cbiAgc3RhdGljIHJlZ2lzdGVyICgpIHtcbiAgICBpZiAodGhpcy5jbGFzc0J5TmFtZS5oYXModGhpcy5uYW1lKSkge1xuICAgICAgY29uc29sZS53YXJuKGBEdXBsaWNhdGUgY29uc3RydWN0b3IgJHt0aGlzLm5hbWV9YClcbiAgICB9XG4gICAgdGhpcy5jbGFzc0J5TmFtZS5zZXQodGhpcy5uYW1lLCB0aGlzKVxuICB9XG5cbiAgc3RhdGljIGdldENvbW1hbmROYW1lICgpIHtcbiAgICByZXR1cm4gdGhpcy5jb21tYW5kUHJlZml4ICsgJzonICsgdGhpcy5nZXRDb21tYW5kTmFtZVdpdGhvdXRQcmVmaXgoKVxuICB9XG5cbiAgc3RhdGljIGdldENvbW1hbmROYW1lV2l0aG91dFByZWZpeCAoKSB7XG4gICAgcmV0dXJuIGRhc2hlcml6ZSh0aGlzLm5hbWUpXG4gIH1cblxuICBzdGF0aWMgcmVnaXN0ZXJDb21tYW5kICgpIHtcbiAgICByZXR1cm4gVmltU3RhdGUucmVnaXN0ZXJDb21tYW5kRnJvbVNwZWModGhpcy5uYW1lLCB7XG4gICAgICBzY29wZTogdGhpcy5jb21tYW5kU2NvcGUsXG4gICAgICBwcmVmaXg6IHRoaXMuY29tbWFuZFByZWZpeCxcbiAgICAgIGdldENsYXNzOiAoKSA9PiB0aGlzXG4gICAgfSlcbiAgfVxuXG4gIHN0YXRpYyBnZXRLaW5kRm9yQ29tbWFuZE5hbWUgKGNvbW1hbmQpIHtcbiAgICBjb25zdCBjb21tYW5kV2l0aG91dFByZWZpeCA9IGNvbW1hbmQucmVwbGFjZSgvXnZpbS1tb2RlLXBsdXM6LywgJycpXG4gICAgY29uc3QgY29tbWFuZENsYXNzTmFtZSA9IGNsYXNzaWZ5KGNvbW1hbmRXaXRob3V0UHJlZml4KVxuICAgIGlmICh0aGlzLmNsYXNzQnlOYW1lLmhhcyhjb21tYW5kQ2xhc3NOYW1lKSkge1xuICAgICAgcmV0dXJuIHRoaXMuY2xhc3NCeU5hbWUuZ2V0KGNvbW1hbmRDbGFzc05hbWUpLm9wZXJhdGlvbktpbmRcbiAgICB9XG4gIH1cblxuICBnZXRTbW9vdGhTY3JvbGxEdWF0aW9uIChraW5kKSB7XG4gICAgY29uc3QgYmFzZSA9ICdzbW9vdGhTY3JvbGxPbicgKyBraW5kXG4gICAgcmV0dXJuIHRoaXMuZ2V0Q29uZmlnKGJhc2UpID8gdGhpcy5nZXRDb25maWcoYmFzZSArICdEdXJhdGlvbicpIDogMFxuICB9XG5cbiAgLy8gUHJveHkgcHJvcHBlcnRpZXMgYW5kIG1ldGhvZHNcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGdldCBtb2RlICgpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUubW9kZSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBnZXQgc3VibW9kZSAoKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLnN1Ym1vZGUgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgZ2V0IHN3cmFwICgpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUuc3dyYXAgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgZ2V0IHV0aWxzICgpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUudXRpbHMgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgZ2V0IGVkaXRvciAoKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLmVkaXRvciB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBnZXQgZWRpdG9yRWxlbWVudCAoKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLmVkaXRvckVsZW1lbnQgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgZ2V0IGdsb2JhbFN0YXRlICgpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUuZ2xvYmFsU3RhdGUgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgZ2V0IG11dGF0aW9uTWFuYWdlciAoKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLm11dGF0aW9uTWFuYWdlciB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBnZXQgb2NjdXJyZW5jZU1hbmFnZXIgKCkgeyByZXR1cm4gdGhpcy52aW1TdGF0ZS5vY2N1cnJlbmNlTWFuYWdlciB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBnZXQgcGVyc2lzdGVudFNlbGVjdGlvbiAoKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLnBlcnNpc3RlbnRTZWxlY3Rpb24gfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgZ2V0IF8gKCkgeyByZXR1cm4gdGhpcy52aW1TdGF0ZS5fIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIHN0YXRpYyBnZXQgXyAoKSB7IHJldHVybiBWaW1TdGF0ZS5fIH0gLy8gcHJldHRpZXItaWdub3JlXG5cbiAgb25EaWRDaGFuZ2VTZWFyY2ggKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUub25EaWRDaGFuZ2VTZWFyY2goLi4uYXJncykgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgb25EaWRDb25maXJtU2VhcmNoICguLi5hcmdzKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLm9uRGlkQ29uZmlybVNlYXJjaCguLi5hcmdzKSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBvbkRpZENhbmNlbFNlYXJjaCAoLi4uYXJncykgeyByZXR1cm4gdGhpcy52aW1TdGF0ZS5vbkRpZENhbmNlbFNlYXJjaCguLi5hcmdzKSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBvbkRpZENvbW1hbmRTZWFyY2ggKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUub25EaWRDb21tYW5kU2VhcmNoKC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIG9uRGlkU2V0VGFyZ2V0ICguLi5hcmdzKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLm9uRGlkU2V0VGFyZ2V0KC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIGVtaXREaWRTZXRUYXJnZXQgKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUuZW1pdERpZFNldFRhcmdldCguLi5hcmdzKSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBvbldpbGxTZWxlY3RUYXJnZXQgKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUub25XaWxsU2VsZWN0VGFyZ2V0KC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIGVtaXRXaWxsU2VsZWN0VGFyZ2V0ICguLi5hcmdzKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLmVtaXRXaWxsU2VsZWN0VGFyZ2V0KC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIG9uRGlkU2VsZWN0VGFyZ2V0ICguLi5hcmdzKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLm9uRGlkU2VsZWN0VGFyZ2V0KC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIGVtaXREaWRTZWxlY3RUYXJnZXQgKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUuZW1pdERpZFNlbGVjdFRhcmdldCguLi5hcmdzKSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBvbkRpZEZhaWxTZWxlY3RUYXJnZXQgKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUub25EaWRGYWlsU2VsZWN0VGFyZ2V0KC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIGVtaXREaWRGYWlsU2VsZWN0VGFyZ2V0ICguLi5hcmdzKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLmVtaXREaWRGYWlsU2VsZWN0VGFyZ2V0KC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIG9uV2lsbEZpbmlzaE11dGF0aW9uICguLi5hcmdzKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLm9uV2lsbEZpbmlzaE11dGF0aW9uKC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIGVtaXRXaWxsRmluaXNoTXV0YXRpb24gKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUuZW1pdFdpbGxGaW5pc2hNdXRhdGlvbiguLi5hcmdzKSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBvbkRpZEZpbmlzaE11dGF0aW9uICguLi5hcmdzKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLm9uRGlkRmluaXNoTXV0YXRpb24oLi4uYXJncykgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgZW1pdERpZEZpbmlzaE11dGF0aW9uICguLi5hcmdzKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLmVtaXREaWRGaW5pc2hNdXRhdGlvbiguLi5hcmdzKSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBvbkRpZEZpbmlzaE9wZXJhdGlvbiAoLi4uYXJncykgeyByZXR1cm4gdGhpcy52aW1TdGF0ZS5vbkRpZEZpbmlzaE9wZXJhdGlvbiguLi5hcmdzKSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBvbkRpZFJlc2V0T3BlcmF0aW9uU3RhY2sgKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUub25EaWRSZXNldE9wZXJhdGlvblN0YWNrKC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIHN1YnNjcmliZSAoLi4uYXJncykgeyByZXR1cm4gdGhpcy52aW1TdGF0ZS5zdWJzY3JpYmUoLi4uYXJncykgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgaXNNb2RlICguLi5hcmdzKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLmlzTW9kZSguLi5hcmdzKSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBnZXRCbG9ja3dpc2VTZWxlY3Rpb25zICguLi5hcmdzKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLmdldEJsb2Nrd2lzZVNlbGVjdGlvbnMoLi4uYXJncykgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgZ2V0TGFzdEJsb2Nrd2lzZVNlbGVjdGlvbiAoLi4uYXJncykgeyByZXR1cm4gdGhpcy52aW1TdGF0ZS5nZXRMYXN0QmxvY2t3aXNlU2VsZWN0aW9uKC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIGFkZFRvQ2xhc3NMaXN0ICguLi5hcmdzKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLmFkZFRvQ2xhc3NMaXN0KC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIGdldENvbmZpZyAoLi4uYXJncykgeyByZXR1cm4gdGhpcy52aW1TdGF0ZS5nZXRDb25maWcoLi4uYXJncykgfSAvLyBwcmV0dGllci1pZ25vcmVcblxuICAvLyBXcmFwcGVyIGZvciB0aGlzLnV0aWxzXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBnZXRWaW1Fb2ZCdWZmZXJQb3NpdGlvbiAoKSB7IHJldHVybiB0aGlzLnV0aWxzLmdldFZpbUVvZkJ1ZmZlclBvc2l0aW9uKHRoaXMuZWRpdG9yKSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBnZXRWaW1MYXN0QnVmZmVyUm93ICgpIHsgcmV0dXJuIHRoaXMudXRpbHMuZ2V0VmltTGFzdEJ1ZmZlclJvdyh0aGlzLmVkaXRvcikgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgZ2V0VmltTGFzdFNjcmVlblJvdyAoKSB7IHJldHVybiB0aGlzLnV0aWxzLmdldFZpbUxhc3RTY3JlZW5Sb3codGhpcy5lZGl0b3IpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIGdldFZhbGlkVmltQnVmZmVyUm93IChyb3cpIHsgcmV0dXJuIHRoaXMudXRpbHMuZ2V0VmFsaWRWaW1CdWZmZXJSb3codGhpcy5lZGl0b3IsIHJvdykgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgZ2V0VmFsaWRWaW1TY3JlZW5Sb3cgKHJvdykgeyByZXR1cm4gdGhpcy51dGlscy5nZXRWYWxpZFZpbVNjcmVlblJvdyh0aGlzLmVkaXRvciwgcm93KSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBnZXRXb3JkQnVmZmVyUmFuZ2VBbmRLaW5kQXRCdWZmZXJQb3NpdGlvbiAoLi4uYXJncykgeyByZXR1cm4gdGhpcy51dGlscy5nZXRXb3JkQnVmZmVyUmFuZ2VBbmRLaW5kQXRCdWZmZXJQb3NpdGlvbih0aGlzLmVkaXRvciwgLi4uYXJncykgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgZ2V0Rmlyc3RDaGFyYWN0ZXJQb3NpdGlvbkZvckJ1ZmZlclJvdyAocm93KSB7IHJldHVybiB0aGlzLnV0aWxzLmdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JCdWZmZXJSb3codGhpcy5lZGl0b3IsIHJvdykgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgZ2V0QnVmZmVyUmFuZ2VGb3JSb3dSYW5nZSAocm93UmFuZ2UpIHsgcmV0dXJuIHRoaXMudXRpbHMuZ2V0QnVmZmVyUmFuZ2VGb3JSb3dSYW5nZSh0aGlzLmVkaXRvciwgcm93UmFuZ2UpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIHNjYW5FZGl0b3IgKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudXRpbHMuc2NhbkVkaXRvcih0aGlzLmVkaXRvciwgLi4uYXJncykgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgZmluZEluRWRpdG9yICguLi5hcmdzKSB7IHJldHVybiB0aGlzLnV0aWxzLmZpbmRJbkVkaXRvcih0aGlzLmVkaXRvciwgLi4uYXJncykgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgZmluZFBvaW50ICguLi5hcmdzKSB7IHJldHVybiB0aGlzLnV0aWxzLmZpbmRQb2ludCh0aGlzLmVkaXRvciwgLi4uYXJncykgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgdHJpbUJ1ZmZlclJhbmdlICguLi5hcmdzKSB7IHJldHVybiB0aGlzLnV0aWxzLnRyaW1CdWZmZXJSYW5nZSh0aGlzLmVkaXRvciwgLi4uYXJncykgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgaXNFbXB0eVJvdyAoLi4uYXJncykgeyByZXR1cm4gdGhpcy51dGlscy5pc0VtcHR5Um93KHRoaXMuZWRpdG9yLCAuLi5hcmdzKSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBnZXRGb2xkU3RhcnRSb3dGb3JSb3cgKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudXRpbHMuZ2V0Rm9sZFN0YXJ0Um93Rm9yUm93KHRoaXMuZWRpdG9yLCAuLi5hcmdzKSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBnZXRGb2xkRW5kUm93Rm9yUm93ICguLi5hcmdzKSB7IHJldHVybiB0aGlzLnV0aWxzLmdldEZvbGRFbmRSb3dGb3JSb3codGhpcy5lZGl0b3IsIC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIGdldEJ1ZmZlclJvd3MgKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudXRpbHMuZ2V0Um93cyh0aGlzLmVkaXRvciwgJ2J1ZmZlcicsIC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIGdldFNjcmVlblJvd3MgKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudXRpbHMuZ2V0Um93cyh0aGlzLmVkaXRvciwgJ3NjcmVlbicsIC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIHJlcGxhY2VUZXh0SW5SYW5nZVZpYURpZmYgKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudXRpbHMucmVwbGFjZVRleHRJblJhbmdlVmlhRGlmZih0aGlzLmVkaXRvciwgLi4uYXJncykgfSAvLyBwcmV0dGllci1pZ25vcmVcbn1cbiJdfQ==