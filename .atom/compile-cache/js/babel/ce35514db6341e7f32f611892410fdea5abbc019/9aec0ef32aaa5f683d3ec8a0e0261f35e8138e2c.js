'use babel';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('atom');

var Range = _require.Range;

var Base = require('./base');

var Operator = (function (_Base) {
  _inherits(Operator, _Base);

  function Operator() {
    _classCallCheck(this, Operator);

    _get(Object.getPrototypeOf(Operator.prototype), 'constructor', this).apply(this, arguments);

    this.recordable = true;
    this.wise = null;
    this.target = null;
    this.occurrence = false;
    this.occurrenceType = 'base';
    this.flashTarget = true;
    this.flashCheckpoint = 'did-finish';
    this.flashType = 'operator';
    this.flashTypeForOccurrence = 'operator-occurrence';
    this.trackChange = false;
    this.patternForOccurrence = null;
    this.stayAtSamePosition = null;
    this.stayOptionName = null;
    this.stayByMarker = false;
    this.restorePositions = true;
    this.setToFirstCharacterOnLinewise = false;
    this.acceptPresetOccurrence = true;
    this.acceptPersistentSelection = true;
    this.bufferCheckpointByPurpose = null;
    this.targetSelected = null;
    this.input = null;
    this.readInputAfterSelect = false;
    this.bufferCheckpointByPurpose = {};
  }

  _createClass(Operator, [{
    key: 'isReady',
    value: function isReady() {
      return this.target && this.target.isReady();
    }

    // Called when operation finished
    // This is essentially to reset state for `.` repeat.
  }, {
    key: 'resetState',
    value: function resetState() {
      this.targetSelected = null;
      this.occurrenceSelected = false;
    }

    // Two checkpoint for different purpose
    // - one for undo
    // - one for preserve last inserted text
  }, {
    key: 'createBufferCheckpoint',
    value: function createBufferCheckpoint(purpose) {
      this.bufferCheckpointByPurpose[purpose] = this.editor.createCheckpoint();
    }
  }, {
    key: 'getBufferCheckpoint',
    value: function getBufferCheckpoint(purpose) {
      return this.bufferCheckpointByPurpose[purpose];
    }
  }, {
    key: 'groupChangesSinceBufferCheckpoint',
    value: function groupChangesSinceBufferCheckpoint(purpose) {
      var checkpoint = this.getBufferCheckpoint(purpose);
      if (checkpoint) {
        this.editor.groupChangesSinceCheckpoint(checkpoint);
        delete this.bufferCheckpointByPurpose[purpose];
      }
    }
  }, {
    key: 'setMarkForChange',
    value: function setMarkForChange(range) {
      this.vimState.mark.set('[', range.start);
      this.vimState.mark.set(']', range.end);
    }
  }, {
    key: 'needFlash',
    value: function needFlash() {
      return this.flashTarget && this.getConfig('flashOnOperate') && !this.getConfig('flashOnOperateBlacklist').includes(this.name) && (this.mode !== 'visual' || this.submode !== this.target.wise) // e.g. Y in vC
      ;
    }
  }, {
    key: 'flashIfNecessary',
    value: function flashIfNecessary(ranges) {
      if (this.needFlash()) {
        this.vimState.flash(ranges, { type: this.getFlashType() });
      }
    }
  }, {
    key: 'flashChangeIfNecessary',
    value: function flashChangeIfNecessary() {
      var _this = this;

      if (this.needFlash()) {
        this.onDidFinishOperation(function () {
          var ranges = _this.mutationManager.getSelectedBufferRangesForCheckpoint(_this.flashCheckpoint);
          _this.vimState.flash(ranges, { type: _this.getFlashType() });
        });
      }
    }
  }, {
    key: 'getFlashType',
    value: function getFlashType() {
      return this.occurrenceSelected ? this.flashTypeForOccurrence : this.flashType;
    }
  }, {
    key: 'trackChangeIfNecessary',
    value: function trackChangeIfNecessary() {
      var _this2 = this;

      if (!this.trackChange) return;
      this.onDidFinishOperation(function () {
        var range = _this2.mutationManager.getMutatedBufferRangeForSelection(_this2.editor.getLastSelection());
        if (range) _this2.setMarkForChange(range);
      });
    }
  }, {
    key: 'initialize',
    value: function initialize() {
      this.subscribeResetOccurrencePatternIfNeeded();

      // When preset-occurrence was exists, operate on occurrence-wise
      if (this.acceptPresetOccurrence && this.occurrenceManager.hasMarkers()) {
        this.occurrence = true;
      }

      // [FIXME] ORDER-MATTER
      // To pick cursor-word to find occurrence base pattern.
      // This has to be done BEFORE converting persistent-selection into real-selection.
      // Since when persistent-selection is actually selected, it change cursor position.
      if (this.occurrence && !this.occurrenceManager.hasMarkers()) {
        var regex = this.patternForOccurrence || this.getPatternForOccurrenceType(this.occurrenceType);
        this.occurrenceManager.addPattern(regex);
      }

      // This change cursor position.
      if (this.selectPersistentSelectionIfNecessary()) {
        // [FIXME] selection-wise is not synched if it already visual-mode
        if (this.mode !== 'visual') {
          this.vimState.activate('visual', this.swrap.detectWise(this.editor));
        }
      }

      if (this.mode === 'visual') {
        this.target = 'CurrentSelection';
      }
      if (typeof this.target === 'string') {
        this.setTarget(this.getInstance(this.target));
      }

      _get(Object.getPrototypeOf(Operator.prototype), 'initialize', this).call(this);
    }
  }, {
    key: 'subscribeResetOccurrencePatternIfNeeded',
    value: function subscribeResetOccurrencePatternIfNeeded() {
      var _this3 = this;

      // [CAUTION]
      // This method has to be called in PROPER timing.
      // If occurrence is true but no preset-occurrence
      // Treat that `occurrence` is BOUNDED to operator itself, so cleanp at finished.
      if (this.occurrence && !this.occurrenceManager.hasMarkers()) {
        this.onDidResetOperationStack(function () {
          return _this3.occurrenceManager.resetPatterns();
        });
      }
    }
  }, {
    key: 'setModifier',
    value: function setModifier(_ref) {
      var _this4 = this;

      var wise = _ref.wise;
      var occurrence = _ref.occurrence;
      var occurrenceType = _ref.occurrenceType;

      if (wise) {
        this.wise = wise;
      } else if (occurrence) {
        this.occurrence = occurrence;
        this.occurrenceType = occurrenceType;
        // This is o modifier case(e.g. `c o p`, `d O f`)
        // We RESET existing occurence-marker when `o` or `O` modifier is typed by user.
        var regex = this.getPatternForOccurrenceType(occurrenceType);
        this.occurrenceManager.addPattern(regex, { reset: true, occurrenceType: occurrenceType });
        this.onDidResetOperationStack(function () {
          return _this4.occurrenceManager.resetPatterns();
        });
      }
    }

    // return true/false to indicate success
  }, {
    key: 'selectPersistentSelectionIfNecessary',
    value: function selectPersistentSelectionIfNecessary() {
      var canSelect = this.acceptPersistentSelection && this.getConfig('autoSelectPersistentSelectionOnOperate') && !this.persistentSelection.isEmpty();

      if (canSelect) {
        this.persistentSelection.select();
        this.editor.mergeIntersectingSelections();
        this.swrap.saveProperties(this.editor);
        return true;
      } else {
        return false;
      }
    }
  }, {
    key: 'getPatternForOccurrenceType',
    value: function getPatternForOccurrenceType(occurrenceType) {
      if (occurrenceType === 'base') {
        return this.utils.getWordPatternAtBufferPosition(this.editor, this.getCursorBufferPosition());
      } else if (occurrenceType === 'subword') {
        return this.utils.getSubwordPatternAtBufferPosition(this.editor, this.getCursorBufferPosition());
      }
    }

    // target is TextObject or Motion to operate on.
  }, {
    key: 'setTarget',
    value: function setTarget(target) {
      this.target = target;
      this.target.operator = this;
      this.emitDidSetTarget(this);
    }
  }, {
    key: 'setTextToRegister',
    value: function setTextToRegister(text, selection) {
      if (this.vimState.register.isUnnamed() && this.isBlackholeRegisteredOperator()) {
        return;
      }

      var wise = this.occurrenceSelected ? this.occurrenceWise : this.target.wise;
      if (wise === 'linewise' && !text.endsWith('\n')) {
        text += '\n';
      }

      if (text) {
        this.vimState.register.set(null, { text: text, selection: selection });

        if (this.vimState.register.isUnnamed()) {
          if (this['instanceof']('Delete') || this['instanceof']('Change')) {
            if (!this.needSaveToNumberedRegister(this.target) && this.utils.isSingleLineText(text)) {
              this.vimState.register.set('-', { text: text, selection: selection }); // small-change
            } else {
                this.vimState.register.set('1', { text: text, selection: selection });
              }
          } else if (this['instanceof']('Yank')) {
            this.vimState.register.set('0', { text: text, selection: selection });
          }
        }
      }
    }
  }, {
    key: 'isBlackholeRegisteredOperator',
    value: function isBlackholeRegisteredOperator() {
      var operators = this.getConfig('blackholeRegisteredOperators');
      var wildCardOperators = operators.filter(function (name) {
        return name.endsWith('*');
      });
      var commandName = this.getCommandNameWithoutPrefix();
      return wildCardOperators.some(function (name) {
        return new RegExp('^' + name.replace('*', '.*')).test(commandName);
      }) || operators.includes(commandName);
    }
  }, {
    key: 'needSaveToNumberedRegister',
    value: function needSaveToNumberedRegister(target) {
      // Used to determine what register to use on change and delete operation.
      // Following motion should save to 1-9 register regerdless of content is small or big.
      var goesToNumberedRegisterMotionNames = ['MoveToPair', // %
      'MoveToNextSentence', // (, )
      'Search', // /, ?, n, N
      'MoveToNextParagraph' // {, }
      ];
      return goesToNumberedRegisterMotionNames.some(function (name) {
        return target['instanceof'](name);
      });
    }
  }, {
    key: 'normalizeSelectionsIfNecessary',
    value: function normalizeSelectionsIfNecessary() {
      if (this.mode === 'visual' && this.target && this.target.isMotion()) {
        this.swrap.normalize(this.editor);
      }
    }
  }, {
    key: 'mutateSelections',
    value: function mutateSelections() {
      for (var selection of this.editor.getSelectionsOrderedByBufferPosition()) {
        this.mutateSelection(selection);
      }
      this.mutationManager.setCheckpoint('did-finish');
      this.restoreCursorPositionsIfNecessary();
    }
  }, {
    key: 'preSelect',
    value: function preSelect() {
      this.normalizeSelectionsIfNecessary();
      this.createBufferCheckpoint('undo');
    }
  }, {
    key: 'postMutate',
    value: function postMutate() {
      this.groupChangesSinceBufferCheckpoint('undo');
      this.emitDidFinishMutation();

      // Even though we fail to select target and fail to mutate,
      // we have to return to normal-mode from operator-pending or visual
      this.activateMode('normal');
    }

    // Main
  }, {
    key: 'execute',
    value: function execute() {
      this.preSelect();

      if (this.readInputAfterSelect && !this.repeated) {
        return this.executeAsyncToReadInputAfterSelect();
      }

      if (this.selectTarget()) this.mutateSelections();
      this.postMutate();
    }
  }, {
    key: 'executeAsyncToReadInputAfterSelect',
    value: _asyncToGenerator(function* () {
      if (this.selectTarget()) {
        this.input = yield this.focusInputPromised(this.focusInputOptions);
        if (this.input == null) {
          if (this.mode !== 'visual') {
            this.editor.revertToCheckpoint(this.getBufferCheckpoint('undo'));
            this.activateMode('normal');
          }
          return;
        }
        this.mutateSelections();
      }
      this.postMutate();
    })

    // Return true unless all selection is empty.
  }, {
    key: 'selectTarget',
    value: function selectTarget() {
      if (this.targetSelected != null) {
        return this.targetSelected;
      }
      this.mutationManager.init({ stayByMarker: this.stayByMarker });

      if (this.target.isMotion() && this.mode === 'visual') this.target.wise = this.submode;
      if (this.wise != null) this.target.forceWise(this.wise);

      this.emitWillSelectTarget();

      // Allow cursor position adjustment 'on-will-select-target' hook.
      // so checkpoint comes AFTER @emitWillSelectTarget()
      this.mutationManager.setCheckpoint('will-select');

      // NOTE: When repeated, set occurrence-marker from pattern stored as state.
      if (this.repeated && this.occurrence && !this.occurrenceManager.hasMarkers()) {
        this.occurrenceManager.addPattern(this.patternForOccurrence, { occurrenceType: this.occurrenceType });
      }

      this.target.execute();

      this.mutationManager.setCheckpoint('did-select');
      if (this.occurrence) {
        if (!this.patternForOccurrence) {
          // Preserve occurrencePattern for . repeat.
          this.patternForOccurrence = this.occurrenceManager.buildPattern();
        }

        this.occurrenceWise = this.wise || 'characterwise';
        if (this.occurrenceManager.select(this.occurrenceWise)) {
          this.occurrenceSelected = true;
          this.mutationManager.setCheckpoint('did-select-occurrence');
        }
      }

      this.targetSelected = this.vimState.haveSomeNonEmptySelection() || this.target.name === 'Empty';
      if (this.targetSelected) {
        this.emitDidSelectTarget();
        this.flashChangeIfNecessary();
        this.trackChangeIfNecessary();
      } else {
        this.emitDidFailSelectTarget();
      }

      return this.targetSelected;
    }
  }, {
    key: 'restoreCursorPositionsIfNecessary',
    value: function restoreCursorPositionsIfNecessary() {
      if (!this.restorePositions) return;

      var stay = this.stayAtSamePosition != null ? this.stayAtSamePosition : this.getConfig(this.stayOptionName) || this.occurrenceSelected && this.getConfig('stayOnOccurrence');
      var wise = this.occurrenceSelected ? this.occurrenceWise : this.target.wise;
      var setToFirstCharacterOnLinewise = this.setToFirstCharacterOnLinewise;

      this.mutationManager.restoreCursorPositions({ stay: stay, wise: wise, setToFirstCharacterOnLinewise: setToFirstCharacterOnLinewise });
    }
  }], [{
    key: 'operationKind',
    value: 'operator',
    enumerable: true
  }, {
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return Operator;
})(Base);

var SelectBase = (function (_Operator) {
  _inherits(SelectBase, _Operator);

  function SelectBase() {
    _classCallCheck(this, SelectBase);

    _get(Object.getPrototypeOf(SelectBase.prototype), 'constructor', this).apply(this, arguments);

    this.flashTarget = false;
    this.recordable = false;
  }

  _createClass(SelectBase, [{
    key: 'execute',
    value: function execute() {
      this.normalizeSelectionsIfNecessary();
      this.selectTarget();

      if (this.target.selectSucceeded) {
        if (this.target.isTextObject()) {
          this.editor.scrollToCursorPosition();
        }
        var wise = this.occurrenceSelected ? this.occurrenceWise : this.target.wise;
        this.activateModeIfNecessary('visual', wise);
      } else {
        this.cancelOperation();
      }
    }
  }], [{
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return SelectBase;
})(Operator);

var Select = (function (_SelectBase) {
  _inherits(Select, _SelectBase);

  function Select() {
    _classCallCheck(this, Select);

    _get(Object.getPrototypeOf(Select.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(Select, [{
    key: 'execute',
    value: function execute() {
      this.swrap.saveProperties(this.editor);
      _get(Object.getPrototypeOf(Select.prototype), 'execute', this).call(this);
    }
  }]);

  return Select;
})(SelectBase);

var SelectLatestChange = (function (_SelectBase2) {
  _inherits(SelectLatestChange, _SelectBase2);

  function SelectLatestChange() {
    _classCallCheck(this, SelectLatestChange);

    _get(Object.getPrototypeOf(SelectLatestChange.prototype), 'constructor', this).apply(this, arguments);

    this.target = 'ALatestChange';
  }

  return SelectLatestChange;
})(SelectBase);

var SelectPreviousSelection = (function (_SelectBase3) {
  _inherits(SelectPreviousSelection, _SelectBase3);

  function SelectPreviousSelection() {
    _classCallCheck(this, SelectPreviousSelection);

    _get(Object.getPrototypeOf(SelectPreviousSelection.prototype), 'constructor', this).apply(this, arguments);

    this.target = 'PreviousSelection';
  }

  return SelectPreviousSelection;
})(SelectBase);

var SelectPersistentSelection = (function (_SelectBase4) {
  _inherits(SelectPersistentSelection, _SelectBase4);

  function SelectPersistentSelection() {
    _classCallCheck(this, SelectPersistentSelection);

    _get(Object.getPrototypeOf(SelectPersistentSelection.prototype), 'constructor', this).apply(this, arguments);

    this.target = 'APersistentSelection';
    this.acceptPersistentSelection = false;
  }

  return SelectPersistentSelection;
})(SelectBase);

var SelectOccurrence = (function (_SelectBase5) {
  _inherits(SelectOccurrence, _SelectBase5);

  function SelectOccurrence() {
    _classCallCheck(this, SelectOccurrence);

    _get(Object.getPrototypeOf(SelectOccurrence.prototype), 'constructor', this).apply(this, arguments);

    this.occurrence = true;
  }

  // VisualModeSelect: used in visual-mode
  // When text-object is invoked from normal or viusal-mode, operation would be
  //  => VisualModeSelect operator with target=text-object
  // When motion is invoked from visual-mode, operation would be
  //  => VisualModeSelect operator with target=motion)
  // ================================
  // VisualModeSelect is used in TWO situation.
  // - visual-mode operation
  //   - e.g: `v l`, `V j`, `v i p`...
  // - Directly invoke text-object from normal-mode
  //   - e.g: Invoke `Inner Paragraph` from command-palette.
  return SelectOccurrence;
})(SelectBase);

var VisualModeSelect = (function (_SelectBase6) {
  _inherits(VisualModeSelect, _SelectBase6);

  function VisualModeSelect() {
    _classCallCheck(this, VisualModeSelect);

    _get(Object.getPrototypeOf(VisualModeSelect.prototype), 'constructor', this).apply(this, arguments);

    this.acceptPresetOccurrence = false;
    this.acceptPersistentSelection = false;
  }

  // Persistent Selection
  // =========================

  _createClass(VisualModeSelect, null, [{
    key: 'command',
    value: false,
    enumerable: true
  }]);

  return VisualModeSelect;
})(SelectBase);

var CreatePersistentSelection = (function (_Operator2) {
  _inherits(CreatePersistentSelection, _Operator2);

  function CreatePersistentSelection() {
    _classCallCheck(this, CreatePersistentSelection);

    _get(Object.getPrototypeOf(CreatePersistentSelection.prototype), 'constructor', this).apply(this, arguments);

    this.flashTarget = false;
    this.stayAtSamePosition = true;
    this.acceptPresetOccurrence = false;
    this.acceptPersistentSelection = false;
  }

  _createClass(CreatePersistentSelection, [{
    key: 'mutateSelection',
    value: function mutateSelection(selection) {
      this.persistentSelection.markBufferRange(selection.getBufferRange());
    }
  }]);

  return CreatePersistentSelection;
})(Operator);

var TogglePersistentSelection = (function (_CreatePersistentSelection) {
  _inherits(TogglePersistentSelection, _CreatePersistentSelection);

  function TogglePersistentSelection() {
    _classCallCheck(this, TogglePersistentSelection);

    _get(Object.getPrototypeOf(TogglePersistentSelection.prototype), 'constructor', this).apply(this, arguments);
  }

  // Preset Occurrence
  // =========================

  _createClass(TogglePersistentSelection, [{
    key: 'initialize',
    value: function initialize() {
      if (this.mode === 'normal') {
        var point = this.editor.getCursorBufferPosition();
        var marker = this.persistentSelection.getMarkerAtPoint(point);
        if (marker) this.target = 'Empty';
      }
      _get(Object.getPrototypeOf(TogglePersistentSelection.prototype), 'initialize', this).call(this);
    }
  }, {
    key: 'mutateSelection',
    value: function mutateSelection(selection) {
      var point = this.getCursorPositionForSelection(selection);
      var marker = this.persistentSelection.getMarkerAtPoint(point);
      if (marker) {
        marker.destroy();
      } else {
        _get(Object.getPrototypeOf(TogglePersistentSelection.prototype), 'mutateSelection', this).call(this, selection);
      }
    }
  }]);

  return TogglePersistentSelection;
})(CreatePersistentSelection);

var TogglePresetOccurrence = (function (_Operator3) {
  _inherits(TogglePresetOccurrence, _Operator3);

  function TogglePresetOccurrence() {
    _classCallCheck(this, TogglePresetOccurrence);

    _get(Object.getPrototypeOf(TogglePresetOccurrence.prototype), 'constructor', this).apply(this, arguments);

    this.target = 'Empty';
    this.flashTarget = false;
    this.acceptPresetOccurrence = false;
    this.acceptPersistentSelection = false;
    this.occurrenceType = 'base';
  }

  _createClass(TogglePresetOccurrence, [{
    key: 'execute',
    value: function execute() {
      var marker = this.occurrenceManager.getMarkerAtPoint(this.getCursorBufferPosition());
      if (marker) {
        this.occurrenceManager.destroyMarkers([marker]);
      } else {
        var isNarrowed = this.vimState.isNarrowed();

        var regex = undefined;
        if (this.mode === 'visual' && !isNarrowed) {
          this.occurrenceType = 'base';
          regex = new RegExp(this._.escapeRegExp(this.editor.getSelectedText()), 'g');
        } else {
          regex = this.getPatternForOccurrenceType(this.occurrenceType);
        }

        this.occurrenceManager.addPattern(regex, { occurrenceType: this.occurrenceType });
        this.occurrenceManager.saveLastPattern(this.occurrenceType);

        if (!isNarrowed) this.activateMode('normal');
      }
    }
  }]);

  return TogglePresetOccurrence;
})(Operator);

var TogglePresetSubwordOccurrence = (function (_TogglePresetOccurrence) {
  _inherits(TogglePresetSubwordOccurrence, _TogglePresetOccurrence);

  function TogglePresetSubwordOccurrence() {
    _classCallCheck(this, TogglePresetSubwordOccurrence);

    _get(Object.getPrototypeOf(TogglePresetSubwordOccurrence.prototype), 'constructor', this).apply(this, arguments);

    this.occurrenceType = 'subword';
  }

  // Want to rename RestoreOccurrenceMarker
  return TogglePresetSubwordOccurrence;
})(TogglePresetOccurrence);

var AddPresetOccurrenceFromLastOccurrencePattern = (function (_TogglePresetOccurrence2) {
  _inherits(AddPresetOccurrenceFromLastOccurrencePattern, _TogglePresetOccurrence2);

  function AddPresetOccurrenceFromLastOccurrencePattern() {
    _classCallCheck(this, AddPresetOccurrenceFromLastOccurrencePattern);

    _get(Object.getPrototypeOf(AddPresetOccurrenceFromLastOccurrencePattern.prototype), 'constructor', this).apply(this, arguments);
  }

  // Delete
  // ================================

  _createClass(AddPresetOccurrenceFromLastOccurrencePattern, [{
    key: 'execute',
    value: function execute() {
      this.occurrenceManager.resetPatterns();
      var regex = this.globalState.get('lastOccurrencePattern');
      if (regex) {
        var occurrenceType = this.globalState.get('lastOccurrenceType');
        this.occurrenceManager.addPattern(regex, { occurrenceType: occurrenceType });
        this.activateMode('normal');
      }
    }
  }]);

  return AddPresetOccurrenceFromLastOccurrencePattern;
})(TogglePresetOccurrence);

var Delete = (function (_Operator4) {
  _inherits(Delete, _Operator4);

  function Delete() {
    _classCallCheck(this, Delete);

    _get(Object.getPrototypeOf(Delete.prototype), 'constructor', this).apply(this, arguments);

    this.trackChange = true;
    this.flashCheckpoint = 'did-select-occurrence';
    this.flashTypeForOccurrence = 'operator-remove-occurrence';
    this.stayOptionName = 'stayOnDelete';
    this.setToFirstCharacterOnLinewise = true;
  }

  _createClass(Delete, [{
    key: 'execute',
    value: function execute() {
      var _this5 = this;

      this.onDidSelectTarget(function () {
        if (_this5.occurrenceSelected && _this5.occurrenceWise === 'linewise') {
          _this5.flashTarget = false;
        }
      });

      if (this.target.wise === 'blockwise') {
        this.restorePositions = false;
      }
      _get(Object.getPrototypeOf(Delete.prototype), 'execute', this).call(this);
    }
  }, {
    key: 'mutateSelection',
    value: function mutateSelection(selection) {
      this.setTextToRegister(selection.getText(), selection);
      selection.deleteSelectedText();
    }
  }]);

  return Delete;
})(Operator);

var DeleteRight = (function (_Delete) {
  _inherits(DeleteRight, _Delete);

  function DeleteRight() {
    _classCallCheck(this, DeleteRight);

    _get(Object.getPrototypeOf(DeleteRight.prototype), 'constructor', this).apply(this, arguments);

    this.target = 'MoveRight';
  }

  return DeleteRight;
})(Delete);

var DeleteLeft = (function (_Delete2) {
  _inherits(DeleteLeft, _Delete2);

  function DeleteLeft() {
    _classCallCheck(this, DeleteLeft);

    _get(Object.getPrototypeOf(DeleteLeft.prototype), 'constructor', this).apply(this, arguments);

    this.target = 'MoveLeft';
  }

  return DeleteLeft;
})(Delete);

var DeleteToLastCharacterOfLine = (function (_Delete3) {
  _inherits(DeleteToLastCharacterOfLine, _Delete3);

  function DeleteToLastCharacterOfLine() {
    _classCallCheck(this, DeleteToLastCharacterOfLine);

    _get(Object.getPrototypeOf(DeleteToLastCharacterOfLine.prototype), 'constructor', this).apply(this, arguments);

    this.target = 'MoveToLastCharacterOfLine';
  }

  _createClass(DeleteToLastCharacterOfLine, [{
    key: 'execute',
    value: function execute() {
      var _this6 = this;

      this.onDidSelectTarget(function () {
        if (_this6.target.wise === 'blockwise') {
          for (var blockwiseSelection of _this6.getBlockwiseSelections()) {
            blockwiseSelection.extendMemberSelectionsToEndOfLine();
          }
        }
      });
      _get(Object.getPrototypeOf(DeleteToLastCharacterOfLine.prototype), 'execute', this).call(this);
    }
  }]);

  return DeleteToLastCharacterOfLine;
})(Delete);

var DeleteLine = (function (_Delete4) {
  _inherits(DeleteLine, _Delete4);

  function DeleteLine() {
    _classCallCheck(this, DeleteLine);

    _get(Object.getPrototypeOf(DeleteLine.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'linewise';
    this.target = 'MoveToRelativeLine';
    this.flashTarget = false;
  }

  // Yank
  // =========================
  return DeleteLine;
})(Delete);

var Yank = (function (_Operator5) {
  _inherits(Yank, _Operator5);

  function Yank() {
    _classCallCheck(this, Yank);

    _get(Object.getPrototypeOf(Yank.prototype), 'constructor', this).apply(this, arguments);

    this.trackChange = true;
    this.stayOptionName = 'stayOnYank';
  }

  _createClass(Yank, [{
    key: 'mutateSelection',
    value: function mutateSelection(selection) {
      this.setTextToRegister(selection.getText(), selection);
    }
  }]);

  return Yank;
})(Operator);

var YankLine = (function (_Yank) {
  _inherits(YankLine, _Yank);

  function YankLine() {
    _classCallCheck(this, YankLine);

    _get(Object.getPrototypeOf(YankLine.prototype), 'constructor', this).apply(this, arguments);

    this.wise = 'linewise';
    this.target = 'MoveToRelativeLine';
  }

  return YankLine;
})(Yank);

var YankToLastCharacterOfLine = (function (_Yank2) {
  _inherits(YankToLastCharacterOfLine, _Yank2);

  function YankToLastCharacterOfLine() {
    _classCallCheck(this, YankToLastCharacterOfLine);

    _get(Object.getPrototypeOf(YankToLastCharacterOfLine.prototype), 'constructor', this).apply(this, arguments);

    this.target = 'MoveToLastCharacterOfLine';
  }

  // Yank diff hunk at cursor by removing leading "+" or "-" from each line
  return YankToLastCharacterOfLine;
})(Yank);

var YankDiffHunk = (function (_Yank3) {
  _inherits(YankDiffHunk, _Yank3);

  function YankDiffHunk() {
    _classCallCheck(this, YankDiffHunk);

    _get(Object.getPrototypeOf(YankDiffHunk.prototype), 'constructor', this).apply(this, arguments);

    this.target = 'InnerDiffHunk';
  }

  // -------------------------
  // [ctrl-a]

  _createClass(YankDiffHunk, [{
    key: 'mutateSelection',
    value: function mutateSelection(selection) {
      // Remove leading "+" or "-" in diff hunk
      var textToYank = selection.getText().replace(/^./gm, '');
      this.setTextToRegister(textToYank, selection);
    }
  }]);

  return YankDiffHunk;
})(Yank);

var Increase = (function (_Operator6) {
  _inherits(Increase, _Operator6);

  function Increase() {
    _classCallCheck(this, Increase);

    _get(Object.getPrototypeOf(Increase.prototype), 'constructor', this).apply(this, arguments);

    this.target = 'Empty';
    this.flashTarget = false;
    this.restorePositions = false;
    this.step = 1;
  }

  // [ctrl-x]

  _createClass(Increase, [{
    key: 'execute',
    value: function execute() {
      this.newRanges = [];
      if (!this.regex) this.regex = new RegExp('' + this.getConfig('numberRegex'), 'g');

      _get(Object.getPrototypeOf(Increase.prototype), 'execute', this).call(this);

      if (this.newRanges.length) {
        if (this.getConfig('flashOnOperate') && !this.getConfig('flashOnOperateBlacklist').includes(this.name)) {
          this.vimState.flash(this.newRanges, { type: this.flashTypeForOccurrence });
        }
      }
    }
  }, {
    key: 'replaceNumberInBufferRange',
    value: function replaceNumberInBufferRange(scanRange, fn) {
      var _this7 = this;

      var newRanges = [];
      this.scanEditor('forward', this.regex, { scanRange: scanRange }, function (event) {
        if (fn) {
          if (fn(event)) event.stop();else return;
        }
        var nextNumber = _this7.getNextNumber(event.matchText);
        newRanges.push(event.replace(String(nextNumber)));
      });
      return newRanges;
    }
  }, {
    key: 'mutateSelection',
    value: function mutateSelection(selection) {
      var _this8 = this;

      var cursor = selection.cursor;

      if (this.target.name === 'Empty') {
        (function () {
          // ctrl-a, ctrl-x in `normal-mode`
          var cursorPosition = cursor.getBufferPosition();
          var scanRange = _this8.editor.bufferRangeForBufferRow(cursorPosition.row);
          var newRanges = _this8.replaceNumberInBufferRange(scanRange, function (event) {
            return event.range.end.isGreaterThan(cursorPosition);
          });
          var point = newRanges.length && newRanges[0].end.translate([0, -1]) || cursorPosition;
          cursor.setBufferPosition(point);
        })();
      } else {
        var _newRanges;

        var scanRange = selection.getBufferRange();
        (_newRanges = this.newRanges).push.apply(_newRanges, _toConsumableArray(this.replaceNumberInBufferRange(scanRange)));
        cursor.setBufferPosition(scanRange.start);
      }
    }
  }, {
    key: 'getNextNumber',
    value: function getNextNumber(numberString) {
      return Number.parseInt(numberString, 10) + this.step * this.getCount();
    }
  }]);

  return Increase;
})(Operator);

var Decrease = (function (_Increase) {
  _inherits(Decrease, _Increase);

  function Decrease() {
    _classCallCheck(this, Decrease);

    _get(Object.getPrototypeOf(Decrease.prototype), 'constructor', this).apply(this, arguments);

    this.step = -1;
  }

  // -------------------------
  // [g ctrl-a]
  return Decrease;
})(Increase);

var IncrementNumber = (function (_Increase2) {
  _inherits(IncrementNumber, _Increase2);

  function IncrementNumber() {
    _classCallCheck(this, IncrementNumber);

    _get(Object.getPrototypeOf(IncrementNumber.prototype), 'constructor', this).apply(this, arguments);

    this.baseNumber = null;
    this.target = null;
  }

  // [g ctrl-x]

  _createClass(IncrementNumber, [{
    key: 'getNextNumber',
    value: function getNextNumber(numberString) {
      if (this.baseNumber != null) {
        this.baseNumber += this.step * this.getCount();
      } else {
        this.baseNumber = Number.parseInt(numberString, 10);
      }
      return this.baseNumber;
    }
  }]);

  return IncrementNumber;
})(Increase);

var DecrementNumber = (function (_IncrementNumber) {
  _inherits(DecrementNumber, _IncrementNumber);

  function DecrementNumber() {
    _classCallCheck(this, DecrementNumber);

    _get(Object.getPrototypeOf(DecrementNumber.prototype), 'constructor', this).apply(this, arguments);

    this.step = -1;
  }

  // Put
  // -------------------------
  // Cursor placement:
  // - place at end of mutation: paste non-multiline characterwise text
  // - place at start of mutation: non-multiline characterwise text(characterwise, linewise)
  return DecrementNumber;
})(IncrementNumber);

var PutBefore = (function (_Operator7) {
  _inherits(PutBefore, _Operator7);

  function PutBefore() {
    _classCallCheck(this, PutBefore);

    _get(Object.getPrototypeOf(PutBefore.prototype), 'constructor', this).apply(this, arguments);

    this.location = 'before';
    this.target = 'Empty';
    this.flashType = 'operator-long';
    this.restorePositions = false;
    this.flashTarget = false;
    this.trackChange = false;
  }

  _createClass(PutBefore, [{
    key: 'initialize',
    // manage manually

    value: function initialize() {
      this.vimState.sequentialPasteManager.onInitialize(this);
      _get(Object.getPrototypeOf(PutBefore.prototype), 'initialize', this).call(this);
    }
  }, {
    key: 'execute',
    value: function execute() {
      var _this9 = this;

      this.mutationsBySelection = new Map();
      this.sequentialPaste = this.vimState.sequentialPasteManager.onExecute(this);

      this.onDidFinishMutation(function () {
        if (!_this9.cancelled) _this9.adjustCursorPosition();
      });

      _get(Object.getPrototypeOf(PutBefore.prototype), 'execute', this).call(this);

      if (this.cancelled) return;

      this.onDidFinishOperation(function () {
        // TrackChange
        var newRange = _this9.mutationsBySelection.get(_this9.editor.getLastSelection());
        if (newRange) _this9.setMarkForChange(newRange);

        // Flash
        if (_this9.getConfig('flashOnOperate') && !_this9.getConfig('flashOnOperateBlacklist').includes(_this9.name)) {
          var ranges = _this9.editor.getSelections().map(function (selection) {
            return _this9.mutationsBySelection.get(selection);
          });
          _this9.vimState.flash(ranges, { type: _this9.getFlashType() });
        }
      });
    }
  }, {
    key: 'adjustCursorPosition',
    value: function adjustCursorPosition() {
      for (var selection of this.editor.getSelections()) {
        if (!this.mutationsBySelection.has(selection)) continue;

        var cursor = selection.cursor;

        var newRange = this.mutationsBySelection.get(selection);
        if (this.linewisePaste) {
          this.utils.moveCursorToFirstCharacterAtRow(cursor, newRange.start.row);
        } else {
          if (newRange.isSingleLine()) {
            cursor.setBufferPosition(newRange.end.translate([0, -1]));
          } else {
            cursor.setBufferPosition(newRange.start);
          }
        }
      }
    }
  }, {
    key: 'mutateSelection',
    value: function mutateSelection(selection) {
      var value = this.vimState.register.get(null, selection, this.sequentialPaste);
      if (!value.text) {
        this.cancelled = true;
        return;
      }

      var textToPaste = value.text.repeat(this.getCount());
      this.linewisePaste = value.type === 'linewise' || this.isMode('visual', 'linewise');
      var newRange = this.paste(selection, textToPaste, { linewisePaste: this.linewisePaste });
      this.mutationsBySelection.set(selection, newRange);
      this.vimState.sequentialPasteManager.savePastedRangeForSelection(selection, newRange);
    }

    // Return pasted range
  }, {
    key: 'paste',
    value: function paste(selection, text, _ref2) {
      var linewisePaste = _ref2.linewisePaste;

      if (this.sequentialPaste) {
        return this.pasteCharacterwise(selection, text);
      } else if (linewisePaste) {
        return this.pasteLinewise(selection, text);
      } else {
        return this.pasteCharacterwise(selection, text);
      }
    }
  }, {
    key: 'pasteCharacterwise',
    value: function pasteCharacterwise(selection, text) {
      var cursor = selection.cursor;

      if (selection.isEmpty() && this.location === 'after' && !this.isEmptyRow(cursor.getBufferRow())) {
        cursor.moveRight();
      }
      return selection.insertText(text);
    }

    // Return newRange
  }, {
    key: 'pasteLinewise',
    value: function pasteLinewise(selection, text) {
      var cursor = selection.cursor;

      var cursorRow = cursor.getBufferRow();
      if (!text.endsWith('\n')) {
        text += '\n';
      }
      if (selection.isEmpty()) {
        if (this.location === 'before') {
          return this.utils.insertTextAtBufferPosition(this.editor, [cursorRow, 0], text);
        } else if (this.location === 'after') {
          var targetRow = this.getFoldEndRowForRow(cursorRow);
          this.utils.ensureEndsWithNewLineForBufferRow(this.editor, targetRow);
          return this.utils.insertTextAtBufferPosition(this.editor, [targetRow + 1, 0], text);
        }
      } else {
        if (!this.isMode('visual', 'linewise')) {
          selection.insertText('\n');
        }
        return selection.insertText(text);
      }
    }
  }]);

  return PutBefore;
})(Operator);

var PutAfter = (function (_PutBefore) {
  _inherits(PutAfter, _PutBefore);

  function PutAfter() {
    _classCallCheck(this, PutAfter);

    _get(Object.getPrototypeOf(PutAfter.prototype), 'constructor', this).apply(this, arguments);

    this.location = 'after';
  }

  return PutAfter;
})(PutBefore);

var PutBeforeWithAutoIndent = (function (_PutBefore2) {
  _inherits(PutBeforeWithAutoIndent, _PutBefore2);

  function PutBeforeWithAutoIndent() {
    _classCallCheck(this, PutBeforeWithAutoIndent);

    _get(Object.getPrototypeOf(PutBeforeWithAutoIndent.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(PutBeforeWithAutoIndent, [{
    key: 'pasteLinewise',
    value: function pasteLinewise(selection, text) {
      var newRange = _get(Object.getPrototypeOf(PutBeforeWithAutoIndent.prototype), 'pasteLinewise', this).call(this, selection, text);
      this.utils.adjustIndentWithKeepingLayout(this.editor, newRange);
      return newRange;
    }
  }]);

  return PutBeforeWithAutoIndent;
})(PutBefore);

var PutAfterWithAutoIndent = (function (_PutBeforeWithAutoIndent) {
  _inherits(PutAfterWithAutoIndent, _PutBeforeWithAutoIndent);

  function PutAfterWithAutoIndent() {
    _classCallCheck(this, PutAfterWithAutoIndent);

    _get(Object.getPrototypeOf(PutAfterWithAutoIndent.prototype), 'constructor', this).apply(this, arguments);

    this.location = 'after';
  }

  return PutAfterWithAutoIndent;
})(PutBeforeWithAutoIndent);

var AddBlankLineBelow = (function (_Operator8) {
  _inherits(AddBlankLineBelow, _Operator8);

  function AddBlankLineBelow() {
    _classCallCheck(this, AddBlankLineBelow);

    _get(Object.getPrototypeOf(AddBlankLineBelow.prototype), 'constructor', this).apply(this, arguments);

    this.flashTarget = false;
    this.target = 'Empty';
    this.stayAtSamePosition = true;
    this.stayByMarker = true;
    this.where = 'below';
  }

  _createClass(AddBlankLineBelow, [{
    key: 'mutateSelection',
    value: function mutateSelection(selection) {
      var point = selection.getHeadBufferPosition();
      if (this.where === 'below') point.row++;
      point.column = 0;
      this.editor.setTextInBufferRange([point, point], '\n'.repeat(this.getCount()));
    }
  }]);

  return AddBlankLineBelow;
})(Operator);

var AddBlankLineAbove = (function (_AddBlankLineBelow) {
  _inherits(AddBlankLineAbove, _AddBlankLineBelow);

  function AddBlankLineAbove() {
    _classCallCheck(this, AddBlankLineAbove);

    _get(Object.getPrototypeOf(AddBlankLineAbove.prototype), 'constructor', this).apply(this, arguments);

    this.where = 'above';
  }

  return AddBlankLineAbove;
})(AddBlankLineBelow);

var ResolveGitConflict = (function (_Operator9) {
  _inherits(ResolveGitConflict, _Operator9);

  function ResolveGitConflict() {
    _classCallCheck(this, ResolveGitConflict);

    _get(Object.getPrototypeOf(ResolveGitConflict.prototype), 'constructor', this).apply(this, arguments);

    this.target = 'Empty';
    this.restorePositions = false;
  }

  _createClass(ResolveGitConflict, [{
    key: 'mutateSelection',
    // do manually

    value: function mutateSelection(selection) {
      var _this10 = this;

      var point = this.getCursorPositionForSelection(selection);
      var rangeInfo = this.getConflictingRangeInfo(point.row);

      if (rangeInfo) {
        (function () {
          var whole = rangeInfo.whole;
          var sectionOurs = rangeInfo.sectionOurs;
          var sectionTheirs = rangeInfo.sectionTheirs;
          var bodyOurs = rangeInfo.bodyOurs;
          var bodyTheirs = rangeInfo.bodyTheirs;

          var resolveConflict = function resolveConflict(range) {
            var text = _this10.editor.getTextInBufferRange(range);
            var dstRange = _this10.getBufferRangeForRowRange([whole.start.row, whole.end.row]);
            var newRange = _this10.editor.setTextInBufferRange(dstRange, text ? text + '\n' : '');
            selection.cursor.setBufferPosition(newRange.start);
          };
          // NOTE: When cursor is at separator row '=======', no replace happens because it's ambiguous.
          if (sectionOurs.containsPoint(point)) {
            resolveConflict(bodyOurs);
          } else if (sectionTheirs.containsPoint(point)) {
            resolveConflict(bodyTheirs);
          }
        })();
      }
    }
  }, {
    key: 'getConflictingRangeInfo',
    value: function getConflictingRangeInfo(row) {
      var from = [row, Infinity];
      var conflictStart = this.findInEditor('backward', /^<<<<<<< .+$/, { from: from }, function (event) {
        return event.range.start;
      });

      if (conflictStart) {
        var startRow = conflictStart.row;
        var separatorRow = undefined,
            endRow = undefined;
        var _from = [startRow + 1, 0];
        var regex = /(^<<<<<<< .+$)|(^=======$)|(^>>>>>>> .+$)/g;
        this.scanEditor('forward', regex, { from: _from }, function (_ref3) {
          var match = _ref3.match;
          var range = _ref3.range;
          var stop = _ref3.stop;

          if (match[1]) {
            // incomplete conflict hunk, we saw next conflict startRow wihout seeing endRow
            stop();
          } else if (match[2]) {
            separatorRow = range.start.row;
          } else if (match[3]) {
            endRow = range.start.row;
            stop();
          }
        });
        if (!endRow) return;
        var whole = new Range([startRow, 0], [endRow, Infinity]);
        var sectionOurs = new Range(whole.start, [(separatorRow || endRow) - 1, Infinity]);
        var sectionTheirs = new Range([(separatorRow || startRow) + 1, 0], whole.end);

        var bodyOursStart = sectionOurs.start.translate([1, 0]);
        var bodyOurs = sectionOurs.getRowCount() === 1 ? new Range(bodyOursStart, bodyOursStart) : new Range(bodyOursStart, sectionOurs.end);

        var bodyTheirs = sectionTheirs.getRowCount() === 1 ? new Range(sectionTheirs.start, sectionTheirs.start) : sectionTheirs.translate([0, 0], [-1, 0]);
        return { whole: whole, sectionOurs: sectionOurs, sectionTheirs: sectionTheirs, bodyOurs: bodyOurs, bodyTheirs: bodyTheirs };
      }
    }
  }]);

  return ResolveGitConflict;
})(Operator);

module.exports = {
  Operator: Operator,
  SelectBase: SelectBase,
  Select: Select,
  SelectLatestChange: SelectLatestChange,
  SelectPreviousSelection: SelectPreviousSelection,
  SelectPersistentSelection: SelectPersistentSelection,
  SelectOccurrence: SelectOccurrence,
  VisualModeSelect: VisualModeSelect,
  CreatePersistentSelection: CreatePersistentSelection,
  TogglePersistentSelection: TogglePersistentSelection,
  TogglePresetOccurrence: TogglePresetOccurrence,
  TogglePresetSubwordOccurrence: TogglePresetSubwordOccurrence,
  AddPresetOccurrenceFromLastOccurrencePattern: AddPresetOccurrenceFromLastOccurrencePattern,
  Delete: Delete,
  DeleteRight: DeleteRight,
  DeleteLeft: DeleteLeft,
  DeleteToLastCharacterOfLine: DeleteToLastCharacterOfLine,
  DeleteLine: DeleteLine,
  Yank: Yank,
  YankLine: YankLine,
  YankToLastCharacterOfLine: YankToLastCharacterOfLine,
  YankDiffHunk: YankDiffHunk,
  Increase: Increase,
  Decrease: Decrease,
  IncrementNumber: IncrementNumber,
  DecrementNumber: DecrementNumber,
  PutBefore: PutBefore,
  PutAfter: PutAfter,
  PutBeforeWithAutoIndent: PutBeforeWithAutoIndent,
  PutAfterWithAutoIndent: PutAfterWithAutoIndent,
  AddBlankLineBelow: AddBlankLineBelow,
  AddBlankLineAbove: AddBlankLineAbove,
  ResolveGitConflict: ResolveGitConflict
};
// ctrl-a in normal-mode find target number in current line manually
// do manually
// do manually
// manage manually
// manage manually
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3l1YW5zaGVuLy5hdG9tL3BhY2thZ2VzL3ZpbS1tb2RlLXBsdXMvbGliL29wZXJhdG9yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQTs7Ozs7Ozs7Ozs7Ozs7ZUFFSyxPQUFPLENBQUMsTUFBTSxDQUFDOztJQUF4QixLQUFLLFlBQUwsS0FBSzs7QUFDWixJQUFNLElBQUksR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7O0lBRXhCLFFBQVE7WUFBUixRQUFROztXQUFSLFFBQVE7MEJBQVIsUUFBUTs7K0JBQVIsUUFBUTs7U0FHWixVQUFVLEdBQUcsSUFBSTtTQUVqQixJQUFJLEdBQUcsSUFBSTtTQUNYLE1BQU0sR0FBRyxJQUFJO1NBQ2IsVUFBVSxHQUFHLEtBQUs7U0FDbEIsY0FBYyxHQUFHLE1BQU07U0FFdkIsV0FBVyxHQUFHLElBQUk7U0FDbEIsZUFBZSxHQUFHLFlBQVk7U0FDOUIsU0FBUyxHQUFHLFVBQVU7U0FDdEIsc0JBQXNCLEdBQUcscUJBQXFCO1NBQzlDLFdBQVcsR0FBRyxLQUFLO1NBRW5CLG9CQUFvQixHQUFHLElBQUk7U0FDM0Isa0JBQWtCLEdBQUcsSUFBSTtTQUN6QixjQUFjLEdBQUcsSUFBSTtTQUNyQixZQUFZLEdBQUcsS0FBSztTQUNwQixnQkFBZ0IsR0FBRyxJQUFJO1NBQ3ZCLDZCQUE2QixHQUFHLEtBQUs7U0FFckMsc0JBQXNCLEdBQUcsSUFBSTtTQUM3Qix5QkFBeUIsR0FBRyxJQUFJO1NBRWhDLHlCQUF5QixHQUFHLElBQUk7U0FFaEMsY0FBYyxHQUFHLElBQUk7U0FDckIsS0FBSyxHQUFHLElBQUk7U0FDWixvQkFBb0IsR0FBRyxLQUFLO1NBQzVCLHlCQUF5QixHQUFHLEVBQUU7OztlQS9CMUIsUUFBUTs7V0FpQ0osbUJBQUc7QUFDVCxhQUFPLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQTtLQUM1Qzs7Ozs7O1dBSVUsc0JBQUc7QUFDWixVQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQTtBQUMxQixVQUFJLENBQUMsa0JBQWtCLEdBQUcsS0FBSyxDQUFBO0tBQ2hDOzs7Ozs7O1dBS3NCLGdDQUFDLE9BQU8sRUFBRTtBQUMvQixVQUFJLENBQUMseUJBQXlCLENBQUMsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFBO0tBQ3pFOzs7V0FFbUIsNkJBQUMsT0FBTyxFQUFFO0FBQzVCLGFBQU8sSUFBSSxDQUFDLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxDQUFBO0tBQy9DOzs7V0FFaUMsMkNBQUMsT0FBTyxFQUFFO0FBQzFDLFVBQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQTtBQUNwRCxVQUFJLFVBQVUsRUFBRTtBQUNkLFlBQUksQ0FBQyxNQUFNLENBQUMsMkJBQTJCLENBQUMsVUFBVSxDQUFDLENBQUE7QUFDbkQsZUFBTyxJQUFJLENBQUMseUJBQXlCLENBQUMsT0FBTyxDQUFDLENBQUE7T0FDL0M7S0FDRjs7O1dBRWdCLDBCQUFDLEtBQUssRUFBRTtBQUN2QixVQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUN4QyxVQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtLQUN2Qzs7O1dBRVMscUJBQUc7QUFDWCxhQUNFLElBQUksQ0FBQyxXQUFXLElBQ2hCLElBQUksQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsSUFDaEMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLHlCQUF5QixDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FDN0QsSUFBSSxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQSxBQUFDO09BQzlEO0tBQ0Y7OztXQUVnQiwwQkFBQyxNQUFNLEVBQUU7QUFDeEIsVUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUU7QUFDcEIsWUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsRUFBQyxDQUFDLENBQUE7T0FDekQ7S0FDRjs7O1dBRXNCLGtDQUFHOzs7QUFDeEIsVUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUU7QUFDcEIsWUFBSSxDQUFDLG9CQUFvQixDQUFDLFlBQU07QUFDOUIsY0FBTSxNQUFNLEdBQUcsTUFBSyxlQUFlLENBQUMsb0NBQW9DLENBQUMsTUFBSyxlQUFlLENBQUMsQ0FBQTtBQUM5RixnQkFBSyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFDLElBQUksRUFBRSxNQUFLLFlBQVksRUFBRSxFQUFDLENBQUMsQ0FBQTtTQUN6RCxDQUFDLENBQUE7T0FDSDtLQUNGOzs7V0FFWSx3QkFBRztBQUNkLGFBQU8sSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFBO0tBQzlFOzs7V0FFc0Isa0NBQUc7OztBQUN4QixVQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxPQUFNO0FBQzdCLFVBQUksQ0FBQyxvQkFBb0IsQ0FBQyxZQUFNO0FBQzlCLFlBQU0sS0FBSyxHQUFHLE9BQUssZUFBZSxDQUFDLGlDQUFpQyxDQUFDLE9BQUssTUFBTSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQTtBQUNwRyxZQUFJLEtBQUssRUFBRSxPQUFLLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFBO09BQ3hDLENBQUMsQ0FBQTtLQUNIOzs7V0FFVSxzQkFBRztBQUNaLFVBQUksQ0FBQyx1Q0FBdUMsRUFBRSxDQUFBOzs7QUFHOUMsVUFBSSxJQUFJLENBQUMsc0JBQXNCLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxFQUFFO0FBQ3RFLFlBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFBO09BQ3ZCOzs7Ozs7QUFNRCxVQUFJLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLEVBQUU7QUFDM0QsWUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixJQUFJLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUE7QUFDaEcsWUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQTtPQUN6Qzs7O0FBR0QsVUFBSSxJQUFJLENBQUMsb0NBQW9DLEVBQUUsRUFBRTs7QUFFL0MsWUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRTtBQUMxQixjQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUE7U0FDckU7T0FDRjs7QUFFRCxVQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO0FBQzFCLFlBQUksQ0FBQyxNQUFNLEdBQUcsa0JBQWtCLENBQUE7T0FDakM7QUFDRCxVQUFJLE9BQU8sSUFBSSxDQUFDLE1BQU0sS0FBSyxRQUFRLEVBQUU7QUFDbkMsWUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO09BQzlDOztBQUVELGlDQXhJRSxRQUFRLDRDQXdJUTtLQUNuQjs7O1dBRXVDLG1EQUFHOzs7Ozs7O0FBS3pDLFVBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsRUFBRTtBQUMzRCxZQUFJLENBQUMsd0JBQXdCLENBQUM7aUJBQU0sT0FBSyxpQkFBaUIsQ0FBQyxhQUFhLEVBQUU7U0FBQSxDQUFDLENBQUE7T0FDNUU7S0FDRjs7O1dBRVcscUJBQUMsSUFBa0MsRUFBRTs7O1VBQW5DLElBQUksR0FBTCxJQUFrQyxDQUFqQyxJQUFJO1VBQUUsVUFBVSxHQUFqQixJQUFrQyxDQUEzQixVQUFVO1VBQUUsY0FBYyxHQUFqQyxJQUFrQyxDQUFmLGNBQWM7O0FBQzVDLFVBQUksSUFBSSxFQUFFO0FBQ1IsWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUE7T0FDakIsTUFBTSxJQUFJLFVBQVUsRUFBRTtBQUNyQixZQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQTtBQUM1QixZQUFJLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQTs7O0FBR3BDLFlBQU0sS0FBSyxHQUFHLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxjQUFjLENBQUMsQ0FBQTtBQUM5RCxZQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxFQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFkLGNBQWMsRUFBQyxDQUFDLENBQUE7QUFDdkUsWUFBSSxDQUFDLHdCQUF3QixDQUFDO2lCQUFNLE9BQUssaUJBQWlCLENBQUMsYUFBYSxFQUFFO1NBQUEsQ0FBQyxDQUFBO09BQzVFO0tBQ0Y7Ozs7O1dBR29DLGdEQUFHO0FBQ3RDLFVBQU0sU0FBUyxHQUNiLElBQUksQ0FBQyx5QkFBeUIsSUFDOUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyx3Q0FBd0MsQ0FBQyxJQUN4RCxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQTs7QUFFckMsVUFBSSxTQUFTLEVBQUU7QUFDYixZQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxFQUFFLENBQUE7QUFDakMsWUFBSSxDQUFDLE1BQU0sQ0FBQywyQkFBMkIsRUFBRSxDQUFBO0FBQ3pDLFlBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUN0QyxlQUFPLElBQUksQ0FBQTtPQUNaLE1BQU07QUFDTCxlQUFPLEtBQUssQ0FBQTtPQUNiO0tBQ0Y7OztXQUUyQixxQ0FBQyxjQUFjLEVBQUU7QUFDM0MsVUFBSSxjQUFjLEtBQUssTUFBTSxFQUFFO0FBQzdCLGVBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDLENBQUE7T0FDOUYsTUFBTSxJQUFJLGNBQWMsS0FBSyxTQUFTLEVBQUU7QUFDdkMsZUFBTyxJQUFJLENBQUMsS0FBSyxDQUFDLGlDQUFpQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUMsQ0FBQTtPQUNqRztLQUNGOzs7OztXQUdTLG1CQUFDLE1BQU0sRUFBRTtBQUNqQixVQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQTtBQUNwQixVQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUE7QUFDM0IsVUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFBO0tBQzVCOzs7V0FFaUIsMkJBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRTtBQUNsQyxVQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxJQUFJLElBQUksQ0FBQyw2QkFBNkIsRUFBRSxFQUFFO0FBQzlFLGVBQU07T0FDUDs7QUFFRCxVQUFNLElBQUksR0FBRyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQTtBQUM3RSxVQUFJLElBQUksS0FBSyxVQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQy9DLFlBQUksSUFBSSxJQUFJLENBQUE7T0FDYjs7QUFFRCxVQUFJLElBQUksRUFBRTtBQUNSLFlBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBQyxJQUFJLEVBQUosSUFBSSxFQUFFLFNBQVMsRUFBVCxTQUFTLEVBQUMsQ0FBQyxDQUFBOztBQUVuRCxZQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxFQUFFO0FBQ3RDLGNBQUksSUFBSSxjQUFXLENBQUMsUUFBUSxDQUFDLElBQUksSUFBSSxjQUFXLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDMUQsZ0JBQUksQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDdEYsa0JBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBQyxJQUFJLEVBQUosSUFBSSxFQUFFLFNBQVMsRUFBVCxTQUFTLEVBQUMsQ0FBQyxDQUFBO2FBQ25ELE1BQU07QUFDTCxvQkFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFDLElBQUksRUFBSixJQUFJLEVBQUUsU0FBUyxFQUFULFNBQVMsRUFBQyxDQUFDLENBQUE7ZUFDbkQ7V0FDRixNQUFNLElBQUksSUFBSSxjQUFXLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDbEMsZ0JBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBQyxJQUFJLEVBQUosSUFBSSxFQUFFLFNBQVMsRUFBVCxTQUFTLEVBQUMsQ0FBQyxDQUFBO1dBQ25EO1NBQ0Y7T0FDRjtLQUNGOzs7V0FFNkIseUNBQUc7QUFDL0IsVUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFBO0FBQ2hFLFVBQU0saUJBQWlCLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxVQUFBLElBQUk7ZUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQztPQUFBLENBQUMsQ0FBQTtBQUN0RSxVQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQTtBQUN0RCxhQUNFLGlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFBLElBQUk7ZUFBSSxJQUFJLE1BQU0sQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO09BQUEsQ0FBQyxJQUMzRixTQUFTLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUNoQztLQUNGOzs7V0FFMEIsb0NBQUMsTUFBTSxFQUFFOzs7QUFHbEMsVUFBTSxpQ0FBaUMsR0FBRyxDQUN4QyxZQUFZO0FBQ1osMEJBQW9CO0FBQ3BCLGNBQVE7QUFDUiwyQkFBcUI7T0FDdEIsQ0FBQTtBQUNELGFBQU8saUNBQWlDLENBQUMsSUFBSSxDQUFDLFVBQUEsSUFBSTtlQUFJLE1BQU0sY0FBVyxDQUFDLElBQUksQ0FBQztPQUFBLENBQUMsQ0FBQTtLQUMvRTs7O1dBRThCLDBDQUFHO0FBQ2hDLFVBQUksSUFBSSxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFO0FBQ25FLFlBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtPQUNsQztLQUNGOzs7V0FFZ0IsNEJBQUc7QUFDbEIsV0FBSyxJQUFNLFNBQVMsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLG9DQUFvQyxFQUFFLEVBQUU7QUFDMUUsWUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQTtPQUNoQztBQUNELFVBQUksQ0FBQyxlQUFlLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFBO0FBQ2hELFVBQUksQ0FBQyxpQ0FBaUMsRUFBRSxDQUFBO0tBQ3pDOzs7V0FFUyxxQkFBRztBQUNYLFVBQUksQ0FBQyw4QkFBOEIsRUFBRSxDQUFBO0FBQ3JDLFVBQUksQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsQ0FBQTtLQUNwQzs7O1dBRVUsc0JBQUc7QUFDWixVQUFJLENBQUMsaUNBQWlDLENBQUMsTUFBTSxDQUFDLENBQUE7QUFDOUMsVUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUE7Ozs7QUFJNUIsVUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQTtLQUM1Qjs7Ozs7V0FHTyxtQkFBRztBQUNULFVBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTs7QUFFaEIsVUFBSSxJQUFJLENBQUMsb0JBQW9CLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO0FBQy9DLGVBQU8sSUFBSSxDQUFDLGtDQUFrQyxFQUFFLENBQUE7T0FDakQ7O0FBRUQsVUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUE7QUFDaEQsVUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO0tBQ2xCOzs7NkJBRXdDLGFBQUc7QUFDMUMsVUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUU7QUFDdkIsWUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtBQUNsRSxZQUFJLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxFQUFFO0FBQ3RCLGNBQUksSUFBSSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7QUFDMUIsZ0JBQUksQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUE7QUFDaEUsZ0JBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUE7V0FDNUI7QUFDRCxpQkFBTTtTQUNQO0FBQ0QsWUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUE7T0FDeEI7QUFDRCxVQUFJLENBQUMsVUFBVSxFQUFFLENBQUE7S0FDbEI7Ozs7O1dBR1ksd0JBQUc7QUFDZCxVQUFJLElBQUksQ0FBQyxjQUFjLElBQUksSUFBSSxFQUFFO0FBQy9CLGVBQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQTtPQUMzQjtBQUNELFVBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUMsQ0FBQyxDQUFBOztBQUU1RCxVQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQTtBQUNyRixVQUFJLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTs7QUFFdkQsVUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUE7Ozs7QUFJM0IsVUFBSSxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUE7OztBQUdqRCxVQUFJLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsRUFBRTtBQUM1RSxZQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxFQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsY0FBYyxFQUFDLENBQUMsQ0FBQTtPQUNwRzs7QUFFRCxVQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFBOztBQUVyQixVQUFJLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQTtBQUNoRCxVQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7QUFDbkIsWUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRTs7QUFFOUIsY0FBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLEVBQUUsQ0FBQTtTQUNsRTs7QUFFRCxZQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksZUFBZSxDQUFBO0FBQ2xELFlBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUU7QUFDdEQsY0FBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQTtBQUM5QixjQUFJLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFBO1NBQzVEO09BQ0Y7O0FBRUQsVUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLHlCQUF5QixFQUFFLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssT0FBTyxDQUFBO0FBQy9GLFVBQUksSUFBSSxDQUFDLGNBQWMsRUFBRTtBQUN2QixZQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQTtBQUMxQixZQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQTtBQUM3QixZQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQTtPQUM5QixNQUFNO0FBQ0wsWUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUE7T0FDL0I7O0FBRUQsYUFBTyxJQUFJLENBQUMsY0FBYyxDQUFBO0tBQzNCOzs7V0FFaUMsNkNBQUc7QUFDbkMsVUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxPQUFNOztBQUVsQyxVQUFNLElBQUksR0FDUixJQUFJLENBQUMsa0JBQWtCLElBQUksSUFBSSxHQUMzQixJQUFJLENBQUMsa0JBQWtCLEdBQ3ZCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFLLElBQUksQ0FBQyxrQkFBa0IsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLEFBQUMsQ0FBQTtBQUM1RyxVQUFNLElBQUksR0FBRyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQTtVQUN0RSw2QkFBNkIsR0FBSSxJQUFJLENBQXJDLDZCQUE2Qjs7QUFDcEMsVUFBSSxDQUFDLGVBQWUsQ0FBQyxzQkFBc0IsQ0FBQyxFQUFDLElBQUksRUFBSixJQUFJLEVBQUUsSUFBSSxFQUFKLElBQUksRUFBRSw2QkFBNkIsRUFBN0IsNkJBQTZCLEVBQUMsQ0FBQyxDQUFBO0tBQ3pGOzs7V0FyV3NCLFVBQVU7Ozs7V0FDaEIsS0FBSzs7OztTQUZsQixRQUFRO0dBQVMsSUFBSTs7SUF5V3JCLFVBQVU7WUFBVixVQUFVOztXQUFWLFVBQVU7MEJBQVYsVUFBVTs7K0JBQVYsVUFBVTs7U0FFZCxXQUFXLEdBQUcsS0FBSztTQUNuQixVQUFVLEdBQUcsS0FBSzs7O2VBSGQsVUFBVTs7V0FLTixtQkFBRztBQUNULFVBQUksQ0FBQyw4QkFBOEIsRUFBRSxDQUFBO0FBQ3JDLFVBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQTs7QUFFbkIsVUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRTtBQUMvQixZQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLEVBQUU7QUFDOUIsY0FBSSxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRSxDQUFBO1NBQ3JDO0FBQ0QsWUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUE7QUFDN0UsWUFBSSxDQUFDLHVCQUF1QixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQTtPQUM3QyxNQUFNO0FBQ0wsWUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFBO09BQ3ZCO0tBQ0Y7OztXQWpCZ0IsS0FBSzs7OztTQURsQixVQUFVO0dBQVMsUUFBUTs7SUFxQjNCLE1BQU07WUFBTixNQUFNOztXQUFOLE1BQU07MEJBQU4sTUFBTTs7K0JBQU4sTUFBTTs7O2VBQU4sTUFBTTs7V0FDRixtQkFBRztBQUNULFVBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUN0QyxpQ0FIRSxNQUFNLHlDQUdPO0tBQ2hCOzs7U0FKRyxNQUFNO0dBQVMsVUFBVTs7SUFPekIsa0JBQWtCO1lBQWxCLGtCQUFrQjs7V0FBbEIsa0JBQWtCOzBCQUFsQixrQkFBa0I7OytCQUFsQixrQkFBa0I7O1NBQ3RCLE1BQU0sR0FBRyxlQUFlOzs7U0FEcEIsa0JBQWtCO0dBQVMsVUFBVTs7SUFJckMsdUJBQXVCO1lBQXZCLHVCQUF1Qjs7V0FBdkIsdUJBQXVCOzBCQUF2Qix1QkFBdUI7OytCQUF2Qix1QkFBdUI7O1NBQzNCLE1BQU0sR0FBRyxtQkFBbUI7OztTQUR4Qix1QkFBdUI7R0FBUyxVQUFVOztJQUkxQyx5QkFBeUI7WUFBekIseUJBQXlCOztXQUF6Qix5QkFBeUI7MEJBQXpCLHlCQUF5Qjs7K0JBQXpCLHlCQUF5Qjs7U0FDN0IsTUFBTSxHQUFHLHNCQUFzQjtTQUMvQix5QkFBeUIsR0FBRyxLQUFLOzs7U0FGN0IseUJBQXlCO0dBQVMsVUFBVTs7SUFLNUMsZ0JBQWdCO1lBQWhCLGdCQUFnQjs7V0FBaEIsZ0JBQWdCOzBCQUFoQixnQkFBZ0I7OytCQUFoQixnQkFBZ0I7O1NBQ3BCLFVBQVUsR0FBRyxJQUFJOzs7Ozs7Ozs7Ozs7OztTQURiLGdCQUFnQjtHQUFTLFVBQVU7O0lBZW5DLGdCQUFnQjtZQUFoQixnQkFBZ0I7O1dBQWhCLGdCQUFnQjswQkFBaEIsZ0JBQWdCOzsrQkFBaEIsZ0JBQWdCOztTQUVwQixzQkFBc0IsR0FBRyxLQUFLO1NBQzlCLHlCQUF5QixHQUFHLEtBQUs7Ozs7OztlQUg3QixnQkFBZ0I7O1dBQ0gsS0FBSzs7OztTQURsQixnQkFBZ0I7R0FBUyxVQUFVOztJQVFuQyx5QkFBeUI7WUFBekIseUJBQXlCOztXQUF6Qix5QkFBeUI7MEJBQXpCLHlCQUF5Qjs7K0JBQXpCLHlCQUF5Qjs7U0FDN0IsV0FBVyxHQUFHLEtBQUs7U0FDbkIsa0JBQWtCLEdBQUcsSUFBSTtTQUN6QixzQkFBc0IsR0FBRyxLQUFLO1NBQzlCLHlCQUF5QixHQUFHLEtBQUs7OztlQUo3Qix5QkFBeUI7O1dBTWIseUJBQUMsU0FBUyxFQUFFO0FBQzFCLFVBQUksQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUE7S0FDckU7OztTQVJHLHlCQUF5QjtHQUFTLFFBQVE7O0lBVzFDLHlCQUF5QjtZQUF6Qix5QkFBeUI7O1dBQXpCLHlCQUF5QjswQkFBekIseUJBQXlCOzsrQkFBekIseUJBQXlCOzs7Ozs7ZUFBekIseUJBQXlCOztXQUNsQixzQkFBRztBQUNaLFVBQUksSUFBSSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7QUFDMUIsWUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRSxDQUFBO0FBQ25ELFlBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUMvRCxZQUFJLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQTtPQUNsQztBQUNELGlDQVBFLHlCQUF5Qiw0Q0FPVDtLQUNuQjs7O1dBRWUseUJBQUMsU0FBUyxFQUFFO0FBQzFCLFVBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxTQUFTLENBQUMsQ0FBQTtBQUMzRCxVQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDL0QsVUFBSSxNQUFNLEVBQUU7QUFDVixjQUFNLENBQUMsT0FBTyxFQUFFLENBQUE7T0FDakIsTUFBTTtBQUNMLG1DQWhCQSx5QkFBeUIsaURBZ0JILFNBQVMsRUFBQztPQUNqQztLQUNGOzs7U0FsQkcseUJBQXlCO0dBQVMseUJBQXlCOztJQXVCM0Qsc0JBQXNCO1lBQXRCLHNCQUFzQjs7V0FBdEIsc0JBQXNCOzBCQUF0QixzQkFBc0I7OytCQUF0QixzQkFBc0I7O1NBQzFCLE1BQU0sR0FBRyxPQUFPO1NBQ2hCLFdBQVcsR0FBRyxLQUFLO1NBQ25CLHNCQUFzQixHQUFHLEtBQUs7U0FDOUIseUJBQXlCLEdBQUcsS0FBSztTQUNqQyxjQUFjLEdBQUcsTUFBTTs7O2VBTG5CLHNCQUFzQjs7V0FPbEIsbUJBQUc7QUFDVCxVQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUMsQ0FBQTtBQUN0RixVQUFJLE1BQU0sRUFBRTtBQUNWLFlBQUksQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO09BQ2hELE1BQU07QUFDTCxZQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFBOztBQUU3QyxZQUFJLEtBQUssWUFBQSxDQUFBO0FBQ1QsWUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFFBQVEsSUFBSSxDQUFDLFVBQVUsRUFBRTtBQUN6QyxjQUFJLENBQUMsY0FBYyxHQUFHLE1BQU0sQ0FBQTtBQUM1QixlQUFLLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1NBQzVFLE1BQU07QUFDTCxlQUFLLEdBQUcsSUFBSSxDQUFDLDJCQUEyQixDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQTtTQUM5RDs7QUFFRCxZQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxFQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsY0FBYyxFQUFDLENBQUMsQ0FBQTtBQUMvRSxZQUFJLENBQUMsaUJBQWlCLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQTs7QUFFM0QsWUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFBO09BQzdDO0tBQ0Y7OztTQTNCRyxzQkFBc0I7R0FBUyxRQUFROztJQThCdkMsNkJBQTZCO1lBQTdCLDZCQUE2Qjs7V0FBN0IsNkJBQTZCOzBCQUE3Qiw2QkFBNkI7OytCQUE3Qiw2QkFBNkI7O1NBQ2pDLGNBQWMsR0FBRyxTQUFTOzs7O1NBRHRCLDZCQUE2QjtHQUFTLHNCQUFzQjs7SUFLNUQsNENBQTRDO1lBQTVDLDRDQUE0Qzs7V0FBNUMsNENBQTRDOzBCQUE1Qyw0Q0FBNEM7OytCQUE1Qyw0Q0FBNEM7Ozs7OztlQUE1Qyw0Q0FBNEM7O1dBQ3hDLG1CQUFHO0FBQ1QsVUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsRUFBRSxDQUFBO0FBQ3RDLFVBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLENBQUE7QUFDM0QsVUFBSSxLQUFLLEVBQUU7QUFDVCxZQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFBO0FBQ2pFLFlBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLEVBQUMsY0FBYyxFQUFkLGNBQWMsRUFBQyxDQUFDLENBQUE7QUFDMUQsWUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQTtPQUM1QjtLQUNGOzs7U0FURyw0Q0FBNEM7R0FBUyxzQkFBc0I7O0lBYzNFLE1BQU07WUFBTixNQUFNOztXQUFOLE1BQU07MEJBQU4sTUFBTTs7K0JBQU4sTUFBTTs7U0FDVixXQUFXLEdBQUcsSUFBSTtTQUNsQixlQUFlLEdBQUcsdUJBQXVCO1NBQ3pDLHNCQUFzQixHQUFHLDRCQUE0QjtTQUNyRCxjQUFjLEdBQUcsY0FBYztTQUMvQiw2QkFBNkIsR0FBRyxJQUFJOzs7ZUFMaEMsTUFBTTs7V0FPRixtQkFBRzs7O0FBQ1QsVUFBSSxDQUFDLGlCQUFpQixDQUFDLFlBQU07QUFDM0IsWUFBSSxPQUFLLGtCQUFrQixJQUFJLE9BQUssY0FBYyxLQUFLLFVBQVUsRUFBRTtBQUNqRSxpQkFBSyxXQUFXLEdBQUcsS0FBSyxDQUFBO1NBQ3pCO09BQ0YsQ0FBQyxDQUFBOztBQUVGLFVBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssV0FBVyxFQUFFO0FBQ3BDLFlBQUksQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUE7T0FDOUI7QUFDRCxpQ0FqQkUsTUFBTSx5Q0FpQk87S0FDaEI7OztXQUVlLHlCQUFDLFNBQVMsRUFBRTtBQUMxQixVQUFJLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0FBQ3RELGVBQVMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFBO0tBQy9COzs7U0F2QkcsTUFBTTtHQUFTLFFBQVE7O0lBMEJ2QixXQUFXO1lBQVgsV0FBVzs7V0FBWCxXQUFXOzBCQUFYLFdBQVc7OytCQUFYLFdBQVc7O1NBQ2YsTUFBTSxHQUFHLFdBQVc7OztTQURoQixXQUFXO0dBQVMsTUFBTTs7SUFJMUIsVUFBVTtZQUFWLFVBQVU7O1dBQVYsVUFBVTswQkFBVixVQUFVOzsrQkFBVixVQUFVOztTQUNkLE1BQU0sR0FBRyxVQUFVOzs7U0FEZixVQUFVO0dBQVMsTUFBTTs7SUFJekIsMkJBQTJCO1lBQTNCLDJCQUEyQjs7V0FBM0IsMkJBQTJCOzBCQUEzQiwyQkFBMkI7OytCQUEzQiwyQkFBMkI7O1NBQy9CLE1BQU0sR0FBRywyQkFBMkI7OztlQURoQywyQkFBMkI7O1dBR3ZCLG1CQUFHOzs7QUFDVCxVQUFJLENBQUMsaUJBQWlCLENBQUMsWUFBTTtBQUMzQixZQUFJLE9BQUssTUFBTSxDQUFDLElBQUksS0FBSyxXQUFXLEVBQUU7QUFDcEMsZUFBSyxJQUFNLGtCQUFrQixJQUFJLE9BQUssc0JBQXNCLEVBQUUsRUFBRTtBQUM5RCw4QkFBa0IsQ0FBQyxpQ0FBaUMsRUFBRSxDQUFBO1dBQ3ZEO1NBQ0Y7T0FDRixDQUFDLENBQUE7QUFDRixpQ0FYRSwyQkFBMkIseUNBV2Q7S0FDaEI7OztTQVpHLDJCQUEyQjtHQUFTLE1BQU07O0lBZTFDLFVBQVU7WUFBVixVQUFVOztXQUFWLFVBQVU7MEJBQVYsVUFBVTs7K0JBQVYsVUFBVTs7U0FDZCxJQUFJLEdBQUcsVUFBVTtTQUNqQixNQUFNLEdBQUcsb0JBQW9CO1NBQzdCLFdBQVcsR0FBRyxLQUFLOzs7OztTQUhmLFVBQVU7R0FBUyxNQUFNOztJQVF6QixJQUFJO1lBQUosSUFBSTs7V0FBSixJQUFJOzBCQUFKLElBQUk7OytCQUFKLElBQUk7O1NBQ1IsV0FBVyxHQUFHLElBQUk7U0FDbEIsY0FBYyxHQUFHLFlBQVk7OztlQUZ6QixJQUFJOztXQUlRLHlCQUFDLFNBQVMsRUFBRTtBQUMxQixVQUFJLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0tBQ3ZEOzs7U0FORyxJQUFJO0dBQVMsUUFBUTs7SUFTckIsUUFBUTtZQUFSLFFBQVE7O1dBQVIsUUFBUTswQkFBUixRQUFROzsrQkFBUixRQUFROztTQUNaLElBQUksR0FBRyxVQUFVO1NBQ2pCLE1BQU0sR0FBRyxvQkFBb0I7OztTQUZ6QixRQUFRO0dBQVMsSUFBSTs7SUFLckIseUJBQXlCO1lBQXpCLHlCQUF5Qjs7V0FBekIseUJBQXlCOzBCQUF6Qix5QkFBeUI7OytCQUF6Qix5QkFBeUI7O1NBQzdCLE1BQU0sR0FBRywyQkFBMkI7Ozs7U0FEaEMseUJBQXlCO0dBQVMsSUFBSTs7SUFLdEMsWUFBWTtZQUFaLFlBQVk7O1dBQVosWUFBWTswQkFBWixZQUFZOzsrQkFBWixZQUFZOztTQUNoQixNQUFNLEdBQUcsZUFBZTs7Ozs7O2VBRHBCLFlBQVk7O1dBRUEseUJBQUMsU0FBUyxFQUFFOztBQUUxQixVQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQTtBQUMxRCxVQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0tBQzlDOzs7U0FORyxZQUFZO0dBQVMsSUFBSTs7SUFXekIsUUFBUTtZQUFSLFFBQVE7O1dBQVIsUUFBUTswQkFBUixRQUFROzsrQkFBUixRQUFROztTQUNaLE1BQU0sR0FBRyxPQUFPO1NBQ2hCLFdBQVcsR0FBRyxLQUFLO1NBQ25CLGdCQUFnQixHQUFHLEtBQUs7U0FDeEIsSUFBSSxHQUFHLENBQUM7Ozs7O2VBSkosUUFBUTs7V0FNSixtQkFBRztBQUNULFVBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFBO0FBQ25CLFVBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxNQUFNLE1BQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsRUFBSSxHQUFHLENBQUMsQ0FBQTs7QUFFakYsaUNBVkUsUUFBUSx5Q0FVSzs7QUFFZixVQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO0FBQ3pCLFlBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDdEcsY0FBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFDLElBQUksRUFBRSxJQUFJLENBQUMsc0JBQXNCLEVBQUMsQ0FBQyxDQUFBO1NBQ3pFO09BQ0Y7S0FDRjs7O1dBRTBCLG9DQUFDLFNBQVMsRUFBRSxFQUFFLEVBQUU7OztBQUN6QyxVQUFNLFNBQVMsR0FBRyxFQUFFLENBQUE7QUFDcEIsVUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFDLFNBQVMsRUFBVCxTQUFTLEVBQUMsRUFBRSxVQUFBLEtBQUssRUFBSTtBQUMzRCxZQUFJLEVBQUUsRUFBRTtBQUNOLGNBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQSxLQUN0QixPQUFNO1NBQ1o7QUFDRCxZQUFNLFVBQVUsR0FBRyxPQUFLLGFBQWEsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDdEQsaUJBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFBO09BQ2xELENBQUMsQ0FBQTtBQUNGLGFBQU8sU0FBUyxDQUFBO0tBQ2pCOzs7V0FFZSx5QkFBQyxTQUFTLEVBQUU7OztVQUNuQixNQUFNLEdBQUksU0FBUyxDQUFuQixNQUFNOztBQUNiLFVBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssT0FBTyxFQUFFOzs7QUFFaEMsY0FBTSxjQUFjLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixFQUFFLENBQUE7QUFDakQsY0FBTSxTQUFTLEdBQUcsT0FBSyxNQUFNLENBQUMsdUJBQXVCLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ3pFLGNBQU0sU0FBUyxHQUFHLE9BQUssMEJBQTBCLENBQUMsU0FBUyxFQUFFLFVBQUEsS0FBSzttQkFDaEUsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQztXQUFBLENBQzlDLENBQUE7QUFDRCxjQUFNLEtBQUssR0FBRyxBQUFDLFNBQVMsQ0FBQyxNQUFNLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFLLGNBQWMsQ0FBQTtBQUN6RixnQkFBTSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFBOztPQUNoQyxNQUFNOzs7QUFDTCxZQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsY0FBYyxFQUFFLENBQUE7QUFDNUMsc0JBQUEsSUFBSSxDQUFDLFNBQVMsRUFBQyxJQUFJLE1BQUEsZ0NBQUksSUFBSSxDQUFDLDBCQUEwQixDQUFDLFNBQVMsQ0FBQyxFQUFDLENBQUE7QUFDbEUsY0FBTSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtPQUMxQztLQUNGOzs7V0FFYSx1QkFBQyxZQUFZLEVBQUU7QUFDM0IsYUFBTyxNQUFNLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtLQUN2RTs7O1NBcERHLFFBQVE7R0FBUyxRQUFROztJQXdEekIsUUFBUTtZQUFSLFFBQVE7O1dBQVIsUUFBUTswQkFBUixRQUFROzsrQkFBUixRQUFROztTQUNaLElBQUksR0FBRyxDQUFDLENBQUM7Ozs7O1NBREwsUUFBUTtHQUFTLFFBQVE7O0lBTXpCLGVBQWU7WUFBZixlQUFlOztXQUFmLGVBQWU7MEJBQWYsZUFBZTs7K0JBQWYsZUFBZTs7U0FDbkIsVUFBVSxHQUFHLElBQUk7U0FDakIsTUFBTSxHQUFHLElBQUk7Ozs7O2VBRlQsZUFBZTs7V0FJTCx1QkFBQyxZQUFZLEVBQUU7QUFDM0IsVUFBSSxJQUFJLENBQUMsVUFBVSxJQUFJLElBQUksRUFBRTtBQUMzQixZQUFJLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFBO09BQy9DLE1BQU07QUFDTCxZQUFJLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxDQUFBO09BQ3BEO0FBQ0QsYUFBTyxJQUFJLENBQUMsVUFBVSxDQUFBO0tBQ3ZCOzs7U0FYRyxlQUFlO0dBQVMsUUFBUTs7SUFlaEMsZUFBZTtZQUFmLGVBQWU7O1dBQWYsZUFBZTswQkFBZixlQUFlOzsrQkFBZixlQUFlOztTQUNuQixJQUFJLEdBQUcsQ0FBQyxDQUFDOzs7Ozs7OztTQURMLGVBQWU7R0FBUyxlQUFlOztJQVN2QyxTQUFTO1lBQVQsU0FBUzs7V0FBVCxTQUFTOzBCQUFULFNBQVM7OytCQUFULFNBQVM7O1NBQ2IsUUFBUSxHQUFHLFFBQVE7U0FDbkIsTUFBTSxHQUFHLE9BQU87U0FDaEIsU0FBUyxHQUFHLGVBQWU7U0FDM0IsZ0JBQWdCLEdBQUcsS0FBSztTQUN4QixXQUFXLEdBQUcsS0FBSztTQUNuQixXQUFXLEdBQUcsS0FBSzs7O2VBTmYsU0FBUzs7OztXQVFGLHNCQUFHO0FBQ1osVUFBSSxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDdkQsaUNBVkUsU0FBUyw0Q0FVTztLQUNuQjs7O1dBRU8sbUJBQUc7OztBQUNULFVBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFBO0FBQ3JDLFVBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUE7O0FBRTNFLFVBQUksQ0FBQyxtQkFBbUIsQ0FBQyxZQUFNO0FBQzdCLFlBQUksQ0FBQyxPQUFLLFNBQVMsRUFBRSxPQUFLLG9CQUFvQixFQUFFLENBQUE7T0FDakQsQ0FBQyxDQUFBOztBQUVGLGlDQXJCRSxTQUFTLHlDQXFCSTs7QUFFZixVQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsT0FBTTs7QUFFMUIsVUFBSSxDQUFDLG9CQUFvQixDQUFDLFlBQU07O0FBRTlCLFlBQU0sUUFBUSxHQUFHLE9BQUssb0JBQW9CLENBQUMsR0FBRyxDQUFDLE9BQUssTUFBTSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQTtBQUM5RSxZQUFJLFFBQVEsRUFBRSxPQUFLLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFBOzs7QUFHN0MsWUFBSSxPQUFLLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsT0FBSyxTQUFTLENBQUMseUJBQXlCLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBSyxJQUFJLENBQUMsRUFBRTtBQUN0RyxjQUFNLE1BQU0sR0FBRyxPQUFLLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBQSxTQUFTO21CQUFJLE9BQUssb0JBQW9CLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQztXQUFBLENBQUMsQ0FBQTtBQUNyRyxpQkFBSyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFDLElBQUksRUFBRSxPQUFLLFlBQVksRUFBRSxFQUFDLENBQUMsQ0FBQTtTQUN6RDtPQUNGLENBQUMsQ0FBQTtLQUNIOzs7V0FFb0IsZ0NBQUc7QUFDdEIsV0FBSyxJQUFNLFNBQVMsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxFQUFFO0FBQ25ELFlBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLFNBQVE7O1lBRWhELE1BQU0sR0FBSSxTQUFTLENBQW5CLE1BQU07O0FBQ2IsWUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQTtBQUN6RCxZQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7QUFDdEIsY0FBSSxDQUFDLEtBQUssQ0FBQywrQkFBK0IsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtTQUN2RSxNQUFNO0FBQ0wsY0FBSSxRQUFRLENBQUMsWUFBWSxFQUFFLEVBQUU7QUFDM0Isa0JBQU0sQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtXQUMxRCxNQUFNO0FBQ0wsa0JBQU0sQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUE7V0FDekM7U0FDRjtPQUNGO0tBQ0Y7OztXQUVlLHlCQUFDLFNBQVMsRUFBRTtBQUMxQixVQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUE7QUFDL0UsVUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUU7QUFDZixZQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQTtBQUNyQixlQUFNO09BQ1A7O0FBRUQsVUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7QUFDdEQsVUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUMsSUFBSSxLQUFLLFVBQVUsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQTtBQUNuRixVQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsRUFBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBQyxDQUFDLENBQUE7QUFDeEYsVUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUE7QUFDbEQsVUFBSSxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQywyQkFBMkIsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUE7S0FDdEY7Ozs7O1dBR0ssZUFBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLEtBQWUsRUFBRTtVQUFoQixhQUFhLEdBQWQsS0FBZSxDQUFkLGFBQWE7O0FBQ3BDLFVBQUksSUFBSSxDQUFDLGVBQWUsRUFBRTtBQUN4QixlQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUE7T0FDaEQsTUFBTSxJQUFJLGFBQWEsRUFBRTtBQUN4QixlQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFBO09BQzNDLE1BQU07QUFDTCxlQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUE7T0FDaEQ7S0FDRjs7O1dBRWtCLDRCQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUU7VUFDNUIsTUFBTSxHQUFJLFNBQVMsQ0FBbkIsTUFBTTs7QUFDYixVQUFJLFNBQVMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDLEVBQUU7QUFDL0YsY0FBTSxDQUFDLFNBQVMsRUFBRSxDQUFBO09BQ25CO0FBQ0QsYUFBTyxTQUFTLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFBO0tBQ2xDOzs7OztXQUdhLHVCQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUU7VUFDdkIsTUFBTSxHQUFJLFNBQVMsQ0FBbkIsTUFBTTs7QUFDYixVQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUE7QUFDdkMsVUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDeEIsWUFBSSxJQUFJLElBQUksQ0FBQTtPQUNiO0FBQ0QsVUFBSSxTQUFTLENBQUMsT0FBTyxFQUFFLEVBQUU7QUFDdkIsWUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLFFBQVEsRUFBRTtBQUM5QixpQkFBTyxJQUFJLENBQUMsS0FBSyxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUE7U0FDaEYsTUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssT0FBTyxFQUFFO0FBQ3BDLGNBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsQ0FBQTtBQUNyRCxjQUFJLENBQUMsS0FBSyxDQUFDLGlDQUFpQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUE7QUFDcEUsaUJBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsU0FBUyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQTtTQUNwRjtPQUNGLE1BQU07QUFDTCxZQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLEVBQUU7QUFDdEMsbUJBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7U0FDM0I7QUFDRCxlQUFPLFNBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7T0FDbEM7S0FDRjs7O1NBOUdHLFNBQVM7R0FBUyxRQUFROztJQWlIMUIsUUFBUTtZQUFSLFFBQVE7O1dBQVIsUUFBUTswQkFBUixRQUFROzsrQkFBUixRQUFROztTQUNaLFFBQVEsR0FBRyxPQUFPOzs7U0FEZCxRQUFRO0dBQVMsU0FBUzs7SUFJMUIsdUJBQXVCO1lBQXZCLHVCQUF1Qjs7V0FBdkIsdUJBQXVCOzBCQUF2Qix1QkFBdUI7OytCQUF2Qix1QkFBdUI7OztlQUF2Qix1QkFBdUI7O1dBQ2IsdUJBQUMsU0FBUyxFQUFFLElBQUksRUFBRTtBQUM5QixVQUFNLFFBQVEsOEJBRlosdUJBQXVCLCtDQUVZLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUNyRCxVQUFJLENBQUMsS0FBSyxDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7QUFDL0QsYUFBTyxRQUFRLENBQUE7S0FDaEI7OztTQUxHLHVCQUF1QjtHQUFTLFNBQVM7O0lBUXpDLHNCQUFzQjtZQUF0QixzQkFBc0I7O1dBQXRCLHNCQUFzQjswQkFBdEIsc0JBQXNCOzsrQkFBdEIsc0JBQXNCOztTQUMxQixRQUFRLEdBQUcsT0FBTzs7O1NBRGQsc0JBQXNCO0dBQVMsdUJBQXVCOztJQUl0RCxpQkFBaUI7WUFBakIsaUJBQWlCOztXQUFqQixpQkFBaUI7MEJBQWpCLGlCQUFpQjs7K0JBQWpCLGlCQUFpQjs7U0FDckIsV0FBVyxHQUFHLEtBQUs7U0FDbkIsTUFBTSxHQUFHLE9BQU87U0FDaEIsa0JBQWtCLEdBQUcsSUFBSTtTQUN6QixZQUFZLEdBQUcsSUFBSTtTQUNuQixLQUFLLEdBQUcsT0FBTzs7O2VBTFgsaUJBQWlCOztXQU9MLHlCQUFDLFNBQVMsRUFBRTtBQUMxQixVQUFNLEtBQUssR0FBRyxTQUFTLENBQUMscUJBQXFCLEVBQUUsQ0FBQTtBQUMvQyxVQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssT0FBTyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQTtBQUN2QyxXQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQTtBQUNoQixVQUFJLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQTtLQUMvRTs7O1NBWkcsaUJBQWlCO0dBQVMsUUFBUTs7SUFlbEMsaUJBQWlCO1lBQWpCLGlCQUFpQjs7V0FBakIsaUJBQWlCOzBCQUFqQixpQkFBaUI7OytCQUFqQixpQkFBaUI7O1NBQ3JCLEtBQUssR0FBRyxPQUFPOzs7U0FEWCxpQkFBaUI7R0FBUyxpQkFBaUI7O0lBSTNDLGtCQUFrQjtZQUFsQixrQkFBa0I7O1dBQWxCLGtCQUFrQjswQkFBbEIsa0JBQWtCOzsrQkFBbEIsa0JBQWtCOztTQUN0QixNQUFNLEdBQUcsT0FBTztTQUNoQixnQkFBZ0IsR0FBRyxLQUFLOzs7ZUFGcEIsa0JBQWtCOzs7O1dBSU4seUJBQUMsU0FBUyxFQUFFOzs7QUFDMUIsVUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLDZCQUE2QixDQUFDLFNBQVMsQ0FBQyxDQUFBO0FBQzNELFVBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7O0FBRXpELFVBQUksU0FBUyxFQUFFOztjQUNOLEtBQUssR0FBc0QsU0FBUyxDQUFwRSxLQUFLO2NBQUUsV0FBVyxHQUF5QyxTQUFTLENBQTdELFdBQVc7Y0FBRSxhQUFhLEdBQTBCLFNBQVMsQ0FBaEQsYUFBYTtjQUFFLFFBQVEsR0FBZ0IsU0FBUyxDQUFqQyxRQUFRO2NBQUUsVUFBVSxHQUFJLFNBQVMsQ0FBdkIsVUFBVTs7QUFDOUQsY0FBTSxlQUFlLEdBQUcsU0FBbEIsZUFBZSxDQUFHLEtBQUssRUFBSTtBQUMvQixnQkFBTSxJQUFJLEdBQUcsUUFBSyxNQUFNLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDcEQsZ0JBQU0sUUFBUSxHQUFHLFFBQUsseUJBQXlCLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7QUFDakYsZ0JBQU0sUUFBUSxHQUFHLFFBQUssTUFBTSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQTtBQUNwRixxQkFBUyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUE7V0FDbkQsQ0FBQTs7QUFFRCxjQUFJLFdBQVcsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDcEMsMkJBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQTtXQUMxQixNQUFNLElBQUksYUFBYSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUM3QywyQkFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1dBQzVCOztPQUNGO0tBQ0Y7OztXQUV1QixpQ0FBQyxHQUFHLEVBQUU7QUFDNUIsVUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUE7QUFDNUIsVUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsY0FBYyxFQUFFLEVBQUMsSUFBSSxFQUFKLElBQUksRUFBQyxFQUFFLFVBQUEsS0FBSztlQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSztPQUFBLENBQUMsQ0FBQTs7QUFFdkcsVUFBSSxhQUFhLEVBQUU7QUFDakIsWUFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLEdBQUcsQ0FBQTtBQUNsQyxZQUFJLFlBQVksWUFBQTtZQUFFLE1BQU0sWUFBQSxDQUFBO0FBQ3hCLFlBQU0sS0FBSSxHQUFHLENBQUMsUUFBUSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtBQUM5QixZQUFNLEtBQUssR0FBRyw0Q0FBNEMsQ0FBQTtBQUMxRCxZQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsRUFBQyxJQUFJLEVBQUosS0FBSSxFQUFDLEVBQUUsVUFBQyxLQUFvQixFQUFLO2NBQXhCLEtBQUssR0FBTixLQUFvQixDQUFuQixLQUFLO2NBQUUsS0FBSyxHQUFiLEtBQW9CLENBQVosS0FBSztjQUFFLElBQUksR0FBbkIsS0FBb0IsQ0FBTCxJQUFJOztBQUM1RCxjQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTs7QUFFWixnQkFBSSxFQUFFLENBQUE7V0FDUCxNQUFNLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQ25CLHdCQUFZLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUE7V0FDL0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUNuQixrQkFBTSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFBO0FBQ3hCLGdCQUFJLEVBQUUsQ0FBQTtXQUNQO1NBQ0YsQ0FBQyxDQUFBO0FBQ0YsWUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFNO0FBQ25CLFlBQU0sS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUE7QUFDMUQsWUFBTSxXQUFXLEdBQUcsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsWUFBWSxJQUFJLE1BQU0sQ0FBQSxHQUFJLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFBO0FBQ3BGLFlBQU0sYUFBYSxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxZQUFZLElBQUksUUFBUSxDQUFBLEdBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTs7QUFFL0UsWUFBTSxhQUFhLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUN6RCxZQUFNLFFBQVEsR0FDWixXQUFXLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxHQUMzQixJQUFJLEtBQUssQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLEdBQ3ZDLElBQUksS0FBSyxDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUE7O0FBRS9DLFlBQU0sVUFBVSxHQUNkLGFBQWEsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLEdBQzdCLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLEtBQUssQ0FBQyxHQUNuRCxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUM5QyxlQUFPLEVBQUMsS0FBSyxFQUFMLEtBQUssRUFBRSxXQUFXLEVBQVgsV0FBVyxFQUFFLGFBQWEsRUFBYixhQUFhLEVBQUUsUUFBUSxFQUFSLFFBQVEsRUFBRSxVQUFVLEVBQVYsVUFBVSxFQUFDLENBQUE7T0FDakU7S0FDRjs7O1NBOURHLGtCQUFrQjtHQUFTLFFBQVE7O0FBaUV6QyxNQUFNLENBQUMsT0FBTyxHQUFHO0FBQ2YsVUFBUSxFQUFSLFFBQVE7QUFDUixZQUFVLEVBQVYsVUFBVTtBQUNWLFFBQU0sRUFBTixNQUFNO0FBQ04sb0JBQWtCLEVBQWxCLGtCQUFrQjtBQUNsQix5QkFBdUIsRUFBdkIsdUJBQXVCO0FBQ3ZCLDJCQUF5QixFQUF6Qix5QkFBeUI7QUFDekIsa0JBQWdCLEVBQWhCLGdCQUFnQjtBQUNoQixrQkFBZ0IsRUFBaEIsZ0JBQWdCO0FBQ2hCLDJCQUF5QixFQUF6Qix5QkFBeUI7QUFDekIsMkJBQXlCLEVBQXpCLHlCQUF5QjtBQUN6Qix3QkFBc0IsRUFBdEIsc0JBQXNCO0FBQ3RCLCtCQUE2QixFQUE3Qiw2QkFBNkI7QUFDN0IsOENBQTRDLEVBQTVDLDRDQUE0QztBQUM1QyxRQUFNLEVBQU4sTUFBTTtBQUNOLGFBQVcsRUFBWCxXQUFXO0FBQ1gsWUFBVSxFQUFWLFVBQVU7QUFDViw2QkFBMkIsRUFBM0IsMkJBQTJCO0FBQzNCLFlBQVUsRUFBVixVQUFVO0FBQ1YsTUFBSSxFQUFKLElBQUk7QUFDSixVQUFRLEVBQVIsUUFBUTtBQUNSLDJCQUF5QixFQUF6Qix5QkFBeUI7QUFDekIsY0FBWSxFQUFaLFlBQVk7QUFDWixVQUFRLEVBQVIsUUFBUTtBQUNSLFVBQVEsRUFBUixRQUFRO0FBQ1IsaUJBQWUsRUFBZixlQUFlO0FBQ2YsaUJBQWUsRUFBZixlQUFlO0FBQ2YsV0FBUyxFQUFULFNBQVM7QUFDVCxVQUFRLEVBQVIsUUFBUTtBQUNSLHlCQUF1QixFQUF2Qix1QkFBdUI7QUFDdkIsd0JBQXNCLEVBQXRCLHNCQUFzQjtBQUN0QixtQkFBaUIsRUFBakIsaUJBQWlCO0FBQ2pCLG1CQUFpQixFQUFqQixpQkFBaUI7QUFDakIsb0JBQWtCLEVBQWxCLGtCQUFrQjtDQUNuQixDQUFBIiwiZmlsZSI6Ii9ob21lL3l1YW5zaGVuLy5hdG9tL3BhY2thZ2VzL3ZpbS1tb2RlLXBsdXMvbGliL29wZXJhdG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCdcblxuY29uc3Qge1JhbmdlfSA9IHJlcXVpcmUoJ2F0b20nKVxuY29uc3QgQmFzZSA9IHJlcXVpcmUoJy4vYmFzZScpXG5cbmNsYXNzIE9wZXJhdG9yIGV4dGVuZHMgQmFzZSB7XG4gIHN0YXRpYyBvcGVyYXRpb25LaW5kID0gJ29wZXJhdG9yJ1xuICBzdGF0aWMgY29tbWFuZCA9IGZhbHNlXG4gIHJlY29yZGFibGUgPSB0cnVlXG5cbiAgd2lzZSA9IG51bGxcbiAgdGFyZ2V0ID0gbnVsbFxuICBvY2N1cnJlbmNlID0gZmFsc2VcbiAgb2NjdXJyZW5jZVR5cGUgPSAnYmFzZSdcblxuICBmbGFzaFRhcmdldCA9IHRydWVcbiAgZmxhc2hDaGVja3BvaW50ID0gJ2RpZC1maW5pc2gnXG4gIGZsYXNoVHlwZSA9ICdvcGVyYXRvcidcbiAgZmxhc2hUeXBlRm9yT2NjdXJyZW5jZSA9ICdvcGVyYXRvci1vY2N1cnJlbmNlJ1xuICB0cmFja0NoYW5nZSA9IGZhbHNlXG5cbiAgcGF0dGVybkZvck9jY3VycmVuY2UgPSBudWxsXG4gIHN0YXlBdFNhbWVQb3NpdGlvbiA9IG51bGxcbiAgc3RheU9wdGlvbk5hbWUgPSBudWxsXG4gIHN0YXlCeU1hcmtlciA9IGZhbHNlXG4gIHJlc3RvcmVQb3NpdGlvbnMgPSB0cnVlXG4gIHNldFRvRmlyc3RDaGFyYWN0ZXJPbkxpbmV3aXNlID0gZmFsc2VcblxuICBhY2NlcHRQcmVzZXRPY2N1cnJlbmNlID0gdHJ1ZVxuICBhY2NlcHRQZXJzaXN0ZW50U2VsZWN0aW9uID0gdHJ1ZVxuXG4gIGJ1ZmZlckNoZWNrcG9pbnRCeVB1cnBvc2UgPSBudWxsXG5cbiAgdGFyZ2V0U2VsZWN0ZWQgPSBudWxsXG4gIGlucHV0ID0gbnVsbFxuICByZWFkSW5wdXRBZnRlclNlbGVjdCA9IGZhbHNlXG4gIGJ1ZmZlckNoZWNrcG9pbnRCeVB1cnBvc2UgPSB7fVxuXG4gIGlzUmVhZHkgKCkge1xuICAgIHJldHVybiB0aGlzLnRhcmdldCAmJiB0aGlzLnRhcmdldC5pc1JlYWR5KClcbiAgfVxuXG4gIC8vIENhbGxlZCB3aGVuIG9wZXJhdGlvbiBmaW5pc2hlZFxuICAvLyBUaGlzIGlzIGVzc2VudGlhbGx5IHRvIHJlc2V0IHN0YXRlIGZvciBgLmAgcmVwZWF0LlxuICByZXNldFN0YXRlICgpIHtcbiAgICB0aGlzLnRhcmdldFNlbGVjdGVkID0gbnVsbFxuICAgIHRoaXMub2NjdXJyZW5jZVNlbGVjdGVkID0gZmFsc2VcbiAgfVxuXG4gIC8vIFR3byBjaGVja3BvaW50IGZvciBkaWZmZXJlbnQgcHVycG9zZVxuICAvLyAtIG9uZSBmb3IgdW5kb1xuICAvLyAtIG9uZSBmb3IgcHJlc2VydmUgbGFzdCBpbnNlcnRlZCB0ZXh0XG4gIGNyZWF0ZUJ1ZmZlckNoZWNrcG9pbnQgKHB1cnBvc2UpIHtcbiAgICB0aGlzLmJ1ZmZlckNoZWNrcG9pbnRCeVB1cnBvc2VbcHVycG9zZV0gPSB0aGlzLmVkaXRvci5jcmVhdGVDaGVja3BvaW50KClcbiAgfVxuXG4gIGdldEJ1ZmZlckNoZWNrcG9pbnQgKHB1cnBvc2UpIHtcbiAgICByZXR1cm4gdGhpcy5idWZmZXJDaGVja3BvaW50QnlQdXJwb3NlW3B1cnBvc2VdXG4gIH1cblxuICBncm91cENoYW5nZXNTaW5jZUJ1ZmZlckNoZWNrcG9pbnQgKHB1cnBvc2UpIHtcbiAgICBjb25zdCBjaGVja3BvaW50ID0gdGhpcy5nZXRCdWZmZXJDaGVja3BvaW50KHB1cnBvc2UpXG4gICAgaWYgKGNoZWNrcG9pbnQpIHtcbiAgICAgIHRoaXMuZWRpdG9yLmdyb3VwQ2hhbmdlc1NpbmNlQ2hlY2twb2ludChjaGVja3BvaW50KVxuICAgICAgZGVsZXRlIHRoaXMuYnVmZmVyQ2hlY2twb2ludEJ5UHVycG9zZVtwdXJwb3NlXVxuICAgIH1cbiAgfVxuXG4gIHNldE1hcmtGb3JDaGFuZ2UgKHJhbmdlKSB7XG4gICAgdGhpcy52aW1TdGF0ZS5tYXJrLnNldCgnWycsIHJhbmdlLnN0YXJ0KVxuICAgIHRoaXMudmltU3RhdGUubWFyay5zZXQoJ10nLCByYW5nZS5lbmQpXG4gIH1cblxuICBuZWVkRmxhc2ggKCkge1xuICAgIHJldHVybiAoXG4gICAgICB0aGlzLmZsYXNoVGFyZ2V0ICYmXG4gICAgICB0aGlzLmdldENvbmZpZygnZmxhc2hPbk9wZXJhdGUnKSAmJlxuICAgICAgIXRoaXMuZ2V0Q29uZmlnKCdmbGFzaE9uT3BlcmF0ZUJsYWNrbGlzdCcpLmluY2x1ZGVzKHRoaXMubmFtZSkgJiZcbiAgICAgICh0aGlzLm1vZGUgIT09ICd2aXN1YWwnIHx8IHRoaXMuc3VibW9kZSAhPT0gdGhpcy50YXJnZXQud2lzZSkgLy8gZS5nLiBZIGluIHZDXG4gICAgKVxuICB9XG5cbiAgZmxhc2hJZk5lY2Vzc2FyeSAocmFuZ2VzKSB7XG4gICAgaWYgKHRoaXMubmVlZEZsYXNoKCkpIHtcbiAgICAgIHRoaXMudmltU3RhdGUuZmxhc2gocmFuZ2VzLCB7dHlwZTogdGhpcy5nZXRGbGFzaFR5cGUoKX0pXG4gICAgfVxuICB9XG5cbiAgZmxhc2hDaGFuZ2VJZk5lY2Vzc2FyeSAoKSB7XG4gICAgaWYgKHRoaXMubmVlZEZsYXNoKCkpIHtcbiAgICAgIHRoaXMub25EaWRGaW5pc2hPcGVyYXRpb24oKCkgPT4ge1xuICAgICAgICBjb25zdCByYW5nZXMgPSB0aGlzLm11dGF0aW9uTWFuYWdlci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlc0ZvckNoZWNrcG9pbnQodGhpcy5mbGFzaENoZWNrcG9pbnQpXG4gICAgICAgIHRoaXMudmltU3RhdGUuZmxhc2gocmFuZ2VzLCB7dHlwZTogdGhpcy5nZXRGbGFzaFR5cGUoKX0pXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIGdldEZsYXNoVHlwZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMub2NjdXJyZW5jZVNlbGVjdGVkID8gdGhpcy5mbGFzaFR5cGVGb3JPY2N1cnJlbmNlIDogdGhpcy5mbGFzaFR5cGVcbiAgfVxuXG4gIHRyYWNrQ2hhbmdlSWZOZWNlc3NhcnkgKCkge1xuICAgIGlmICghdGhpcy50cmFja0NoYW5nZSkgcmV0dXJuXG4gICAgdGhpcy5vbkRpZEZpbmlzaE9wZXJhdGlvbigoKSA9PiB7XG4gICAgICBjb25zdCByYW5nZSA9IHRoaXMubXV0YXRpb25NYW5hZ2VyLmdldE11dGF0ZWRCdWZmZXJSYW5nZUZvclNlbGVjdGlvbih0aGlzLmVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkpXG4gICAgICBpZiAocmFuZ2UpIHRoaXMuc2V0TWFya0ZvckNoYW5nZShyYW5nZSlcbiAgICB9KVxuICB9XG5cbiAgaW5pdGlhbGl6ZSAoKSB7XG4gICAgdGhpcy5zdWJzY3JpYmVSZXNldE9jY3VycmVuY2VQYXR0ZXJuSWZOZWVkZWQoKVxuXG4gICAgLy8gV2hlbiBwcmVzZXQtb2NjdXJyZW5jZSB3YXMgZXhpc3RzLCBvcGVyYXRlIG9uIG9jY3VycmVuY2Utd2lzZVxuICAgIGlmICh0aGlzLmFjY2VwdFByZXNldE9jY3VycmVuY2UgJiYgdGhpcy5vY2N1cnJlbmNlTWFuYWdlci5oYXNNYXJrZXJzKCkpIHtcbiAgICAgIHRoaXMub2NjdXJyZW5jZSA9IHRydWVcbiAgICB9XG5cbiAgICAvLyBbRklYTUVdIE9SREVSLU1BVFRFUlxuICAgIC8vIFRvIHBpY2sgY3Vyc29yLXdvcmQgdG8gZmluZCBvY2N1cnJlbmNlIGJhc2UgcGF0dGVybi5cbiAgICAvLyBUaGlzIGhhcyB0byBiZSBkb25lIEJFRk9SRSBjb252ZXJ0aW5nIHBlcnNpc3RlbnQtc2VsZWN0aW9uIGludG8gcmVhbC1zZWxlY3Rpb24uXG4gICAgLy8gU2luY2Ugd2hlbiBwZXJzaXN0ZW50LXNlbGVjdGlvbiBpcyBhY3R1YWxseSBzZWxlY3RlZCwgaXQgY2hhbmdlIGN1cnNvciBwb3NpdGlvbi5cbiAgICBpZiAodGhpcy5vY2N1cnJlbmNlICYmICF0aGlzLm9jY3VycmVuY2VNYW5hZ2VyLmhhc01hcmtlcnMoKSkge1xuICAgICAgY29uc3QgcmVnZXggPSB0aGlzLnBhdHRlcm5Gb3JPY2N1cnJlbmNlIHx8IHRoaXMuZ2V0UGF0dGVybkZvck9jY3VycmVuY2VUeXBlKHRoaXMub2NjdXJyZW5jZVR5cGUpXG4gICAgICB0aGlzLm9jY3VycmVuY2VNYW5hZ2VyLmFkZFBhdHRlcm4ocmVnZXgpXG4gICAgfVxuXG4gICAgLy8gVGhpcyBjaGFuZ2UgY3Vyc29yIHBvc2l0aW9uLlxuICAgIGlmICh0aGlzLnNlbGVjdFBlcnNpc3RlbnRTZWxlY3Rpb25JZk5lY2Vzc2FyeSgpKSB7XG4gICAgICAvLyBbRklYTUVdIHNlbGVjdGlvbi13aXNlIGlzIG5vdCBzeW5jaGVkIGlmIGl0IGFscmVhZHkgdmlzdWFsLW1vZGVcbiAgICAgIGlmICh0aGlzLm1vZGUgIT09ICd2aXN1YWwnKSB7XG4gICAgICAgIHRoaXMudmltU3RhdGUuYWN0aXZhdGUoJ3Zpc3VhbCcsIHRoaXMuc3dyYXAuZGV0ZWN0V2lzZSh0aGlzLmVkaXRvcikpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubW9kZSA9PT0gJ3Zpc3VhbCcpIHtcbiAgICAgIHRoaXMudGFyZ2V0ID0gJ0N1cnJlbnRTZWxlY3Rpb24nXG4gICAgfVxuICAgIGlmICh0eXBlb2YgdGhpcy50YXJnZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLnNldFRhcmdldCh0aGlzLmdldEluc3RhbmNlKHRoaXMudGFyZ2V0KSlcbiAgICB9XG5cbiAgICBzdXBlci5pbml0aWFsaXplKClcbiAgfVxuXG4gIHN1YnNjcmliZVJlc2V0T2NjdXJyZW5jZVBhdHRlcm5JZk5lZWRlZCAoKSB7XG4gICAgLy8gW0NBVVRJT05dXG4gICAgLy8gVGhpcyBtZXRob2QgaGFzIHRvIGJlIGNhbGxlZCBpbiBQUk9QRVIgdGltaW5nLlxuICAgIC8vIElmIG9jY3VycmVuY2UgaXMgdHJ1ZSBidXQgbm8gcHJlc2V0LW9jY3VycmVuY2VcbiAgICAvLyBUcmVhdCB0aGF0IGBvY2N1cnJlbmNlYCBpcyBCT1VOREVEIHRvIG9wZXJhdG9yIGl0c2VsZiwgc28gY2xlYW5wIGF0IGZpbmlzaGVkLlxuICAgIGlmICh0aGlzLm9jY3VycmVuY2UgJiYgIXRoaXMub2NjdXJyZW5jZU1hbmFnZXIuaGFzTWFya2VycygpKSB7XG4gICAgICB0aGlzLm9uRGlkUmVzZXRPcGVyYXRpb25TdGFjaygoKSA9PiB0aGlzLm9jY3VycmVuY2VNYW5hZ2VyLnJlc2V0UGF0dGVybnMoKSlcbiAgICB9XG4gIH1cblxuICBzZXRNb2RpZmllciAoe3dpc2UsIG9jY3VycmVuY2UsIG9jY3VycmVuY2VUeXBlfSkge1xuICAgIGlmICh3aXNlKSB7XG4gICAgICB0aGlzLndpc2UgPSB3aXNlXG4gICAgfSBlbHNlIGlmIChvY2N1cnJlbmNlKSB7XG4gICAgICB0aGlzLm9jY3VycmVuY2UgPSBvY2N1cnJlbmNlXG4gICAgICB0aGlzLm9jY3VycmVuY2VUeXBlID0gb2NjdXJyZW5jZVR5cGVcbiAgICAgIC8vIFRoaXMgaXMgbyBtb2RpZmllciBjYXNlKGUuZy4gYGMgbyBwYCwgYGQgTyBmYClcbiAgICAgIC8vIFdlIFJFU0VUIGV4aXN0aW5nIG9jY3VyZW5jZS1tYXJrZXIgd2hlbiBgb2Agb3IgYE9gIG1vZGlmaWVyIGlzIHR5cGVkIGJ5IHVzZXIuXG4gICAgICBjb25zdCByZWdleCA9IHRoaXMuZ2V0UGF0dGVybkZvck9jY3VycmVuY2VUeXBlKG9jY3VycmVuY2VUeXBlKVxuICAgICAgdGhpcy5vY2N1cnJlbmNlTWFuYWdlci5hZGRQYXR0ZXJuKHJlZ2V4LCB7cmVzZXQ6IHRydWUsIG9jY3VycmVuY2VUeXBlfSlcbiAgICAgIHRoaXMub25EaWRSZXNldE9wZXJhdGlvblN0YWNrKCgpID0+IHRoaXMub2NjdXJyZW5jZU1hbmFnZXIucmVzZXRQYXR0ZXJucygpKVxuICAgIH1cbiAgfVxuXG4gIC8vIHJldHVybiB0cnVlL2ZhbHNlIHRvIGluZGljYXRlIHN1Y2Nlc3NcbiAgc2VsZWN0UGVyc2lzdGVudFNlbGVjdGlvbklmTmVjZXNzYXJ5ICgpIHtcbiAgICBjb25zdCBjYW5TZWxlY3QgPVxuICAgICAgdGhpcy5hY2NlcHRQZXJzaXN0ZW50U2VsZWN0aW9uICYmXG4gICAgICB0aGlzLmdldENvbmZpZygnYXV0b1NlbGVjdFBlcnNpc3RlbnRTZWxlY3Rpb25Pbk9wZXJhdGUnKSAmJlxuICAgICAgIXRoaXMucGVyc2lzdGVudFNlbGVjdGlvbi5pc0VtcHR5KClcblxuICAgIGlmIChjYW5TZWxlY3QpIHtcbiAgICAgIHRoaXMucGVyc2lzdGVudFNlbGVjdGlvbi5zZWxlY3QoKVxuICAgICAgdGhpcy5lZGl0b3IubWVyZ2VJbnRlcnNlY3RpbmdTZWxlY3Rpb25zKClcbiAgICAgIHRoaXMuc3dyYXAuc2F2ZVByb3BlcnRpZXModGhpcy5lZGl0b3IpXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cblxuICBnZXRQYXR0ZXJuRm9yT2NjdXJyZW5jZVR5cGUgKG9jY3VycmVuY2VUeXBlKSB7XG4gICAgaWYgKG9jY3VycmVuY2VUeXBlID09PSAnYmFzZScpIHtcbiAgICAgIHJldHVybiB0aGlzLnV0aWxzLmdldFdvcmRQYXR0ZXJuQXRCdWZmZXJQb3NpdGlvbih0aGlzLmVkaXRvciwgdGhpcy5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpKVxuICAgIH0gZWxzZSBpZiAob2NjdXJyZW5jZVR5cGUgPT09ICdzdWJ3b3JkJykge1xuICAgICAgcmV0dXJuIHRoaXMudXRpbHMuZ2V0U3Vid29yZFBhdHRlcm5BdEJ1ZmZlclBvc2l0aW9uKHRoaXMuZWRpdG9yLCB0aGlzLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgfVxuICB9XG5cbiAgLy8gdGFyZ2V0IGlzIFRleHRPYmplY3Qgb3IgTW90aW9uIHRvIG9wZXJhdGUgb24uXG4gIHNldFRhcmdldCAodGFyZ2V0KSB7XG4gICAgdGhpcy50YXJnZXQgPSB0YXJnZXRcbiAgICB0aGlzLnRhcmdldC5vcGVyYXRvciA9IHRoaXNcbiAgICB0aGlzLmVtaXREaWRTZXRUYXJnZXQodGhpcylcbiAgfVxuXG4gIHNldFRleHRUb1JlZ2lzdGVyICh0ZXh0LCBzZWxlY3Rpb24pIHtcbiAgICBpZiAodGhpcy52aW1TdGF0ZS5yZWdpc3Rlci5pc1VubmFtZWQoKSAmJiB0aGlzLmlzQmxhY2tob2xlUmVnaXN0ZXJlZE9wZXJhdG9yKCkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHdpc2UgPSB0aGlzLm9jY3VycmVuY2VTZWxlY3RlZCA/IHRoaXMub2NjdXJyZW5jZVdpc2UgOiB0aGlzLnRhcmdldC53aXNlXG4gICAgaWYgKHdpc2UgPT09ICdsaW5ld2lzZScgJiYgIXRleHQuZW5kc1dpdGgoJ1xcbicpKSB7XG4gICAgICB0ZXh0ICs9ICdcXG4nXG4gICAgfVxuXG4gICAgaWYgKHRleHQpIHtcbiAgICAgIHRoaXMudmltU3RhdGUucmVnaXN0ZXIuc2V0KG51bGwsIHt0ZXh0LCBzZWxlY3Rpb259KVxuXG4gICAgICBpZiAodGhpcy52aW1TdGF0ZS5yZWdpc3Rlci5pc1VubmFtZWQoKSkge1xuICAgICAgICBpZiAodGhpcy5pbnN0YW5jZW9mKCdEZWxldGUnKSB8fCB0aGlzLmluc3RhbmNlb2YoJ0NoYW5nZScpKSB7XG4gICAgICAgICAgaWYgKCF0aGlzLm5lZWRTYXZlVG9OdW1iZXJlZFJlZ2lzdGVyKHRoaXMudGFyZ2V0KSAmJiB0aGlzLnV0aWxzLmlzU2luZ2xlTGluZVRleHQodGV4dCkpIHtcbiAgICAgICAgICAgIHRoaXMudmltU3RhdGUucmVnaXN0ZXIuc2V0KCctJywge3RleHQsIHNlbGVjdGlvbn0pIC8vIHNtYWxsLWNoYW5nZVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnZpbVN0YXRlLnJlZ2lzdGVyLnNldCgnMScsIHt0ZXh0LCBzZWxlY3Rpb259KVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmluc3RhbmNlb2YoJ1lhbmsnKSkge1xuICAgICAgICAgIHRoaXMudmltU3RhdGUucmVnaXN0ZXIuc2V0KCcwJywge3RleHQsIHNlbGVjdGlvbn0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpc0JsYWNraG9sZVJlZ2lzdGVyZWRPcGVyYXRvciAoKSB7XG4gICAgY29uc3Qgb3BlcmF0b3JzID0gdGhpcy5nZXRDb25maWcoJ2JsYWNraG9sZVJlZ2lzdGVyZWRPcGVyYXRvcnMnKVxuICAgIGNvbnN0IHdpbGRDYXJkT3BlcmF0b3JzID0gb3BlcmF0b3JzLmZpbHRlcihuYW1lID0+IG5hbWUuZW5kc1dpdGgoJyonKSlcbiAgICBjb25zdCBjb21tYW5kTmFtZSA9IHRoaXMuZ2V0Q29tbWFuZE5hbWVXaXRob3V0UHJlZml4KClcbiAgICByZXR1cm4gKFxuICAgICAgd2lsZENhcmRPcGVyYXRvcnMuc29tZShuYW1lID0+IG5ldyBSZWdFeHAoJ14nICsgbmFtZS5yZXBsYWNlKCcqJywgJy4qJykpLnRlc3QoY29tbWFuZE5hbWUpKSB8fFxuICAgICAgb3BlcmF0b3JzLmluY2x1ZGVzKGNvbW1hbmROYW1lKVxuICAgIClcbiAgfVxuXG4gIG5lZWRTYXZlVG9OdW1iZXJlZFJlZ2lzdGVyICh0YXJnZXQpIHtcbiAgICAvLyBVc2VkIHRvIGRldGVybWluZSB3aGF0IHJlZ2lzdGVyIHRvIHVzZSBvbiBjaGFuZ2UgYW5kIGRlbGV0ZSBvcGVyYXRpb24uXG4gICAgLy8gRm9sbG93aW5nIG1vdGlvbiBzaG91bGQgc2F2ZSB0byAxLTkgcmVnaXN0ZXIgcmVnZXJkbGVzcyBvZiBjb250ZW50IGlzIHNtYWxsIG9yIGJpZy5cbiAgICBjb25zdCBnb2VzVG9OdW1iZXJlZFJlZ2lzdGVyTW90aW9uTmFtZXMgPSBbXG4gICAgICAnTW92ZVRvUGFpcicsIC8vICVcbiAgICAgICdNb3ZlVG9OZXh0U2VudGVuY2UnLCAvLyAoLCApXG4gICAgICAnU2VhcmNoJywgLy8gLywgPywgbiwgTlxuICAgICAgJ01vdmVUb05leHRQYXJhZ3JhcGgnIC8vIHssIH1cbiAgICBdXG4gICAgcmV0dXJuIGdvZXNUb051bWJlcmVkUmVnaXN0ZXJNb3Rpb25OYW1lcy5zb21lKG5hbWUgPT4gdGFyZ2V0Lmluc3RhbmNlb2YobmFtZSkpXG4gIH1cblxuICBub3JtYWxpemVTZWxlY3Rpb25zSWZOZWNlc3NhcnkgKCkge1xuICAgIGlmICh0aGlzLm1vZGUgPT09ICd2aXN1YWwnICYmIHRoaXMudGFyZ2V0ICYmIHRoaXMudGFyZ2V0LmlzTW90aW9uKCkpIHtcbiAgICAgIHRoaXMuc3dyYXAubm9ybWFsaXplKHRoaXMuZWRpdG9yKVxuICAgIH1cbiAgfVxuXG4gIG11dGF0ZVNlbGVjdGlvbnMgKCkge1xuICAgIGZvciAoY29uc3Qgc2VsZWN0aW9uIG9mIHRoaXMuZWRpdG9yLmdldFNlbGVjdGlvbnNPcmRlcmVkQnlCdWZmZXJQb3NpdGlvbigpKSB7XG4gICAgICB0aGlzLm11dGF0ZVNlbGVjdGlvbihzZWxlY3Rpb24pXG4gICAgfVxuICAgIHRoaXMubXV0YXRpb25NYW5hZ2VyLnNldENoZWNrcG9pbnQoJ2RpZC1maW5pc2gnKVxuICAgIHRoaXMucmVzdG9yZUN1cnNvclBvc2l0aW9uc0lmTmVjZXNzYXJ5KClcbiAgfVxuXG4gIHByZVNlbGVjdCAoKSB7XG4gICAgdGhpcy5ub3JtYWxpemVTZWxlY3Rpb25zSWZOZWNlc3NhcnkoKVxuICAgIHRoaXMuY3JlYXRlQnVmZmVyQ2hlY2twb2ludCgndW5kbycpXG4gIH1cblxuICBwb3N0TXV0YXRlICgpIHtcbiAgICB0aGlzLmdyb3VwQ2hhbmdlc1NpbmNlQnVmZmVyQ2hlY2twb2ludCgndW5kbycpXG4gICAgdGhpcy5lbWl0RGlkRmluaXNoTXV0YXRpb24oKVxuXG4gICAgLy8gRXZlbiB0aG91Z2ggd2UgZmFpbCB0byBzZWxlY3QgdGFyZ2V0IGFuZCBmYWlsIHRvIG11dGF0ZSxcbiAgICAvLyB3ZSBoYXZlIHRvIHJldHVybiB0byBub3JtYWwtbW9kZSBmcm9tIG9wZXJhdG9yLXBlbmRpbmcgb3IgdmlzdWFsXG4gICAgdGhpcy5hY3RpdmF0ZU1vZGUoJ25vcm1hbCcpXG4gIH1cblxuICAvLyBNYWluXG4gIGV4ZWN1dGUgKCkge1xuICAgIHRoaXMucHJlU2VsZWN0KClcblxuICAgIGlmICh0aGlzLnJlYWRJbnB1dEFmdGVyU2VsZWN0ICYmICF0aGlzLnJlcGVhdGVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5leGVjdXRlQXN5bmNUb1JlYWRJbnB1dEFmdGVyU2VsZWN0KClcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zZWxlY3RUYXJnZXQoKSkgdGhpcy5tdXRhdGVTZWxlY3Rpb25zKClcbiAgICB0aGlzLnBvc3RNdXRhdGUoKVxuICB9XG5cbiAgYXN5bmMgZXhlY3V0ZUFzeW5jVG9SZWFkSW5wdXRBZnRlclNlbGVjdCAoKSB7XG4gICAgaWYgKHRoaXMuc2VsZWN0VGFyZ2V0KCkpIHtcbiAgICAgIHRoaXMuaW5wdXQgPSBhd2FpdCB0aGlzLmZvY3VzSW5wdXRQcm9taXNlZCh0aGlzLmZvY3VzSW5wdXRPcHRpb25zKVxuICAgICAgaWYgKHRoaXMuaW5wdXQgPT0gbnVsbCkge1xuICAgICAgICBpZiAodGhpcy5tb2RlICE9PSAndmlzdWFsJykge1xuICAgICAgICAgIHRoaXMuZWRpdG9yLnJldmVydFRvQ2hlY2twb2ludCh0aGlzLmdldEJ1ZmZlckNoZWNrcG9pbnQoJ3VuZG8nKSlcbiAgICAgICAgICB0aGlzLmFjdGl2YXRlTW9kZSgnbm9ybWFsJylcbiAgICAgICAgfVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHRoaXMubXV0YXRlU2VsZWN0aW9ucygpXG4gICAgfVxuICAgIHRoaXMucG9zdE11dGF0ZSgpXG4gIH1cblxuICAvLyBSZXR1cm4gdHJ1ZSB1bmxlc3MgYWxsIHNlbGVjdGlvbiBpcyBlbXB0eS5cbiAgc2VsZWN0VGFyZ2V0ICgpIHtcbiAgICBpZiAodGhpcy50YXJnZXRTZWxlY3RlZCAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy50YXJnZXRTZWxlY3RlZFxuICAgIH1cbiAgICB0aGlzLm11dGF0aW9uTWFuYWdlci5pbml0KHtzdGF5QnlNYXJrZXI6IHRoaXMuc3RheUJ5TWFya2VyfSlcblxuICAgIGlmICh0aGlzLnRhcmdldC5pc01vdGlvbigpICYmIHRoaXMubW9kZSA9PT0gJ3Zpc3VhbCcpIHRoaXMudGFyZ2V0Lndpc2UgPSB0aGlzLnN1Ym1vZGVcbiAgICBpZiAodGhpcy53aXNlICE9IG51bGwpIHRoaXMudGFyZ2V0LmZvcmNlV2lzZSh0aGlzLndpc2UpXG5cbiAgICB0aGlzLmVtaXRXaWxsU2VsZWN0VGFyZ2V0KClcblxuICAgIC8vIEFsbG93IGN1cnNvciBwb3NpdGlvbiBhZGp1c3RtZW50ICdvbi13aWxsLXNlbGVjdC10YXJnZXQnIGhvb2suXG4gICAgLy8gc28gY2hlY2twb2ludCBjb21lcyBBRlRFUiBAZW1pdFdpbGxTZWxlY3RUYXJnZXQoKVxuICAgIHRoaXMubXV0YXRpb25NYW5hZ2VyLnNldENoZWNrcG9pbnQoJ3dpbGwtc2VsZWN0JylcblxuICAgIC8vIE5PVEU6IFdoZW4gcmVwZWF0ZWQsIHNldCBvY2N1cnJlbmNlLW1hcmtlciBmcm9tIHBhdHRlcm4gc3RvcmVkIGFzIHN0YXRlLlxuICAgIGlmICh0aGlzLnJlcGVhdGVkICYmIHRoaXMub2NjdXJyZW5jZSAmJiAhdGhpcy5vY2N1cnJlbmNlTWFuYWdlci5oYXNNYXJrZXJzKCkpIHtcbiAgICAgIHRoaXMub2NjdXJyZW5jZU1hbmFnZXIuYWRkUGF0dGVybih0aGlzLnBhdHRlcm5Gb3JPY2N1cnJlbmNlLCB7b2NjdXJyZW5jZVR5cGU6IHRoaXMub2NjdXJyZW5jZVR5cGV9KVxuICAgIH1cblxuICAgIHRoaXMudGFyZ2V0LmV4ZWN1dGUoKVxuXG4gICAgdGhpcy5tdXRhdGlvbk1hbmFnZXIuc2V0Q2hlY2twb2ludCgnZGlkLXNlbGVjdCcpXG4gICAgaWYgKHRoaXMub2NjdXJyZW5jZSkge1xuICAgICAgaWYgKCF0aGlzLnBhdHRlcm5Gb3JPY2N1cnJlbmNlKSB7XG4gICAgICAgIC8vIFByZXNlcnZlIG9jY3VycmVuY2VQYXR0ZXJuIGZvciAuIHJlcGVhdC5cbiAgICAgICAgdGhpcy5wYXR0ZXJuRm9yT2NjdXJyZW5jZSA9IHRoaXMub2NjdXJyZW5jZU1hbmFnZXIuYnVpbGRQYXR0ZXJuKClcbiAgICAgIH1cblxuICAgICAgdGhpcy5vY2N1cnJlbmNlV2lzZSA9IHRoaXMud2lzZSB8fCAnY2hhcmFjdGVyd2lzZSdcbiAgICAgIGlmICh0aGlzLm9jY3VycmVuY2VNYW5hZ2VyLnNlbGVjdCh0aGlzLm9jY3VycmVuY2VXaXNlKSkge1xuICAgICAgICB0aGlzLm9jY3VycmVuY2VTZWxlY3RlZCA9IHRydWVcbiAgICAgICAgdGhpcy5tdXRhdGlvbk1hbmFnZXIuc2V0Q2hlY2twb2ludCgnZGlkLXNlbGVjdC1vY2N1cnJlbmNlJylcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnRhcmdldFNlbGVjdGVkID0gdGhpcy52aW1TdGF0ZS5oYXZlU29tZU5vbkVtcHR5U2VsZWN0aW9uKCkgfHwgdGhpcy50YXJnZXQubmFtZSA9PT0gJ0VtcHR5J1xuICAgIGlmICh0aGlzLnRhcmdldFNlbGVjdGVkKSB7XG4gICAgICB0aGlzLmVtaXREaWRTZWxlY3RUYXJnZXQoKVxuICAgICAgdGhpcy5mbGFzaENoYW5nZUlmTmVjZXNzYXJ5KClcbiAgICAgIHRoaXMudHJhY2tDaGFuZ2VJZk5lY2Vzc2FyeSgpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZW1pdERpZEZhaWxTZWxlY3RUYXJnZXQoKVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnRhcmdldFNlbGVjdGVkXG4gIH1cblxuICByZXN0b3JlQ3Vyc29yUG9zaXRpb25zSWZOZWNlc3NhcnkgKCkge1xuICAgIGlmICghdGhpcy5yZXN0b3JlUG9zaXRpb25zKSByZXR1cm5cblxuICAgIGNvbnN0IHN0YXkgPVxuICAgICAgdGhpcy5zdGF5QXRTYW1lUG9zaXRpb24gIT0gbnVsbFxuICAgICAgICA/IHRoaXMuc3RheUF0U2FtZVBvc2l0aW9uXG4gICAgICAgIDogdGhpcy5nZXRDb25maWcodGhpcy5zdGF5T3B0aW9uTmFtZSkgfHwgKHRoaXMub2NjdXJyZW5jZVNlbGVjdGVkICYmIHRoaXMuZ2V0Q29uZmlnKCdzdGF5T25PY2N1cnJlbmNlJykpXG4gICAgY29uc3Qgd2lzZSA9IHRoaXMub2NjdXJyZW5jZVNlbGVjdGVkID8gdGhpcy5vY2N1cnJlbmNlV2lzZSA6IHRoaXMudGFyZ2V0Lndpc2VcbiAgICBjb25zdCB7c2V0VG9GaXJzdENoYXJhY3Rlck9uTGluZXdpc2V9ID0gdGhpc1xuICAgIHRoaXMubXV0YXRpb25NYW5hZ2VyLnJlc3RvcmVDdXJzb3JQb3NpdGlvbnMoe3N0YXksIHdpc2UsIHNldFRvRmlyc3RDaGFyYWN0ZXJPbkxpbmV3aXNlfSlcbiAgfVxufVxuXG5jbGFzcyBTZWxlY3RCYXNlIGV4dGVuZHMgT3BlcmF0b3Ige1xuICBzdGF0aWMgY29tbWFuZCA9IGZhbHNlXG4gIGZsYXNoVGFyZ2V0ID0gZmFsc2VcbiAgcmVjb3JkYWJsZSA9IGZhbHNlXG5cbiAgZXhlY3V0ZSAoKSB7XG4gICAgdGhpcy5ub3JtYWxpemVTZWxlY3Rpb25zSWZOZWNlc3NhcnkoKVxuICAgIHRoaXMuc2VsZWN0VGFyZ2V0KClcblxuICAgIGlmICh0aGlzLnRhcmdldC5zZWxlY3RTdWNjZWVkZWQpIHtcbiAgICAgIGlmICh0aGlzLnRhcmdldC5pc1RleHRPYmplY3QoKSkge1xuICAgICAgICB0aGlzLmVkaXRvci5zY3JvbGxUb0N1cnNvclBvc2l0aW9uKClcbiAgICAgIH1cbiAgICAgIGNvbnN0IHdpc2UgPSB0aGlzLm9jY3VycmVuY2VTZWxlY3RlZCA/IHRoaXMub2NjdXJyZW5jZVdpc2UgOiB0aGlzLnRhcmdldC53aXNlXG4gICAgICB0aGlzLmFjdGl2YXRlTW9kZUlmTmVjZXNzYXJ5KCd2aXN1YWwnLCB3aXNlKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNhbmNlbE9wZXJhdGlvbigpXG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFNlbGVjdCBleHRlbmRzIFNlbGVjdEJhc2Uge1xuICBleGVjdXRlICgpIHtcbiAgICB0aGlzLnN3cmFwLnNhdmVQcm9wZXJ0aWVzKHRoaXMuZWRpdG9yKVxuICAgIHN1cGVyLmV4ZWN1dGUoKVxuICB9XG59XG5cbmNsYXNzIFNlbGVjdExhdGVzdENoYW5nZSBleHRlbmRzIFNlbGVjdEJhc2Uge1xuICB0YXJnZXQgPSAnQUxhdGVzdENoYW5nZSdcbn1cblxuY2xhc3MgU2VsZWN0UHJldmlvdXNTZWxlY3Rpb24gZXh0ZW5kcyBTZWxlY3RCYXNlIHtcbiAgdGFyZ2V0ID0gJ1ByZXZpb3VzU2VsZWN0aW9uJ1xufVxuXG5jbGFzcyBTZWxlY3RQZXJzaXN0ZW50U2VsZWN0aW9uIGV4dGVuZHMgU2VsZWN0QmFzZSB7XG4gIHRhcmdldCA9ICdBUGVyc2lzdGVudFNlbGVjdGlvbidcbiAgYWNjZXB0UGVyc2lzdGVudFNlbGVjdGlvbiA9IGZhbHNlXG59XG5cbmNsYXNzIFNlbGVjdE9jY3VycmVuY2UgZXh0ZW5kcyBTZWxlY3RCYXNlIHtcbiAgb2NjdXJyZW5jZSA9IHRydWVcbn1cblxuLy8gVmlzdWFsTW9kZVNlbGVjdDogdXNlZCBpbiB2aXN1YWwtbW9kZVxuLy8gV2hlbiB0ZXh0LW9iamVjdCBpcyBpbnZva2VkIGZyb20gbm9ybWFsIG9yIHZpdXNhbC1tb2RlLCBvcGVyYXRpb24gd291bGQgYmVcbi8vICA9PiBWaXN1YWxNb2RlU2VsZWN0IG9wZXJhdG9yIHdpdGggdGFyZ2V0PXRleHQtb2JqZWN0XG4vLyBXaGVuIG1vdGlvbiBpcyBpbnZva2VkIGZyb20gdmlzdWFsLW1vZGUsIG9wZXJhdGlvbiB3b3VsZCBiZVxuLy8gID0+IFZpc3VhbE1vZGVTZWxlY3Qgb3BlcmF0b3Igd2l0aCB0YXJnZXQ9bW90aW9uKVxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIFZpc3VhbE1vZGVTZWxlY3QgaXMgdXNlZCBpbiBUV08gc2l0dWF0aW9uLlxuLy8gLSB2aXN1YWwtbW9kZSBvcGVyYXRpb25cbi8vICAgLSBlLmc6IGB2IGxgLCBgViBqYCwgYHYgaSBwYC4uLlxuLy8gLSBEaXJlY3RseSBpbnZva2UgdGV4dC1vYmplY3QgZnJvbSBub3JtYWwtbW9kZVxuLy8gICAtIGUuZzogSW52b2tlIGBJbm5lciBQYXJhZ3JhcGhgIGZyb20gY29tbWFuZC1wYWxldHRlLlxuY2xhc3MgVmlzdWFsTW9kZVNlbGVjdCBleHRlbmRzIFNlbGVjdEJhc2Uge1xuICBzdGF0aWMgY29tbWFuZCA9IGZhbHNlXG4gIGFjY2VwdFByZXNldE9jY3VycmVuY2UgPSBmYWxzZVxuICBhY2NlcHRQZXJzaXN0ZW50U2VsZWN0aW9uID0gZmFsc2Vcbn1cblxuLy8gUGVyc2lzdGVudCBTZWxlY3Rpb25cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIENyZWF0ZVBlcnNpc3RlbnRTZWxlY3Rpb24gZXh0ZW5kcyBPcGVyYXRvciB7XG4gIGZsYXNoVGFyZ2V0ID0gZmFsc2VcbiAgc3RheUF0U2FtZVBvc2l0aW9uID0gdHJ1ZVxuICBhY2NlcHRQcmVzZXRPY2N1cnJlbmNlID0gZmFsc2VcbiAgYWNjZXB0UGVyc2lzdGVudFNlbGVjdGlvbiA9IGZhbHNlXG5cbiAgbXV0YXRlU2VsZWN0aW9uIChzZWxlY3Rpb24pIHtcbiAgICB0aGlzLnBlcnNpc3RlbnRTZWxlY3Rpb24ubWFya0J1ZmZlclJhbmdlKHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpKVxuICB9XG59XG5cbmNsYXNzIFRvZ2dsZVBlcnNpc3RlbnRTZWxlY3Rpb24gZXh0ZW5kcyBDcmVhdGVQZXJzaXN0ZW50U2VsZWN0aW9uIHtcbiAgaW5pdGlhbGl6ZSAoKSB7XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gJ25vcm1hbCcpIHtcbiAgICAgIGNvbnN0IHBvaW50ID0gdGhpcy5lZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKVxuICAgICAgY29uc3QgbWFya2VyID0gdGhpcy5wZXJzaXN0ZW50U2VsZWN0aW9uLmdldE1hcmtlckF0UG9pbnQocG9pbnQpXG4gICAgICBpZiAobWFya2VyKSB0aGlzLnRhcmdldCA9ICdFbXB0eSdcbiAgICB9XG4gICAgc3VwZXIuaW5pdGlhbGl6ZSgpXG4gIH1cblxuICBtdXRhdGVTZWxlY3Rpb24gKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IHBvaW50ID0gdGhpcy5nZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbihzZWxlY3Rpb24pXG4gICAgY29uc3QgbWFya2VyID0gdGhpcy5wZXJzaXN0ZW50U2VsZWN0aW9uLmdldE1hcmtlckF0UG9pbnQocG9pbnQpXG4gICAgaWYgKG1hcmtlcikge1xuICAgICAgbWFya2VyLmRlc3Ryb3koKVxuICAgIH0gZWxzZSB7XG4gICAgICBzdXBlci5tdXRhdGVTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgIH1cbiAgfVxufVxuXG4vLyBQcmVzZXQgT2NjdXJyZW5jZVxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgVG9nZ2xlUHJlc2V0T2NjdXJyZW5jZSBleHRlbmRzIE9wZXJhdG9yIHtcbiAgdGFyZ2V0ID0gJ0VtcHR5J1xuICBmbGFzaFRhcmdldCA9IGZhbHNlXG4gIGFjY2VwdFByZXNldE9jY3VycmVuY2UgPSBmYWxzZVxuICBhY2NlcHRQZXJzaXN0ZW50U2VsZWN0aW9uID0gZmFsc2VcbiAgb2NjdXJyZW5jZVR5cGUgPSAnYmFzZSdcblxuICBleGVjdXRlICgpIHtcbiAgICBjb25zdCBtYXJrZXIgPSB0aGlzLm9jY3VycmVuY2VNYW5hZ2VyLmdldE1hcmtlckF0UG9pbnQodGhpcy5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpKVxuICAgIGlmIChtYXJrZXIpIHtcbiAgICAgIHRoaXMub2NjdXJyZW5jZU1hbmFnZXIuZGVzdHJveU1hcmtlcnMoW21hcmtlcl0pXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGlzTmFycm93ZWQgPSB0aGlzLnZpbVN0YXRlLmlzTmFycm93ZWQoKVxuXG4gICAgICBsZXQgcmVnZXhcbiAgICAgIGlmICh0aGlzLm1vZGUgPT09ICd2aXN1YWwnICYmICFpc05hcnJvd2VkKSB7XG4gICAgICAgIHRoaXMub2NjdXJyZW5jZVR5cGUgPSAnYmFzZSdcbiAgICAgICAgcmVnZXggPSBuZXcgUmVnRXhwKHRoaXMuXy5lc2NhcGVSZWdFeHAodGhpcy5lZGl0b3IuZ2V0U2VsZWN0ZWRUZXh0KCkpLCAnZycpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWdleCA9IHRoaXMuZ2V0UGF0dGVybkZvck9jY3VycmVuY2VUeXBlKHRoaXMub2NjdXJyZW5jZVR5cGUpXG4gICAgICB9XG5cbiAgICAgIHRoaXMub2NjdXJyZW5jZU1hbmFnZXIuYWRkUGF0dGVybihyZWdleCwge29jY3VycmVuY2VUeXBlOiB0aGlzLm9jY3VycmVuY2VUeXBlfSlcbiAgICAgIHRoaXMub2NjdXJyZW5jZU1hbmFnZXIuc2F2ZUxhc3RQYXR0ZXJuKHRoaXMub2NjdXJyZW5jZVR5cGUpXG5cbiAgICAgIGlmICghaXNOYXJyb3dlZCkgdGhpcy5hY3RpdmF0ZU1vZGUoJ25vcm1hbCcpXG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFRvZ2dsZVByZXNldFN1YndvcmRPY2N1cnJlbmNlIGV4dGVuZHMgVG9nZ2xlUHJlc2V0T2NjdXJyZW5jZSB7XG4gIG9jY3VycmVuY2VUeXBlID0gJ3N1YndvcmQnXG59XG5cbi8vIFdhbnQgdG8gcmVuYW1lIFJlc3RvcmVPY2N1cnJlbmNlTWFya2VyXG5jbGFzcyBBZGRQcmVzZXRPY2N1cnJlbmNlRnJvbUxhc3RPY2N1cnJlbmNlUGF0dGVybiBleHRlbmRzIFRvZ2dsZVByZXNldE9jY3VycmVuY2Uge1xuICBleGVjdXRlICgpIHtcbiAgICB0aGlzLm9jY3VycmVuY2VNYW5hZ2VyLnJlc2V0UGF0dGVybnMoKVxuICAgIGNvbnN0IHJlZ2V4ID0gdGhpcy5nbG9iYWxTdGF0ZS5nZXQoJ2xhc3RPY2N1cnJlbmNlUGF0dGVybicpXG4gICAgaWYgKHJlZ2V4KSB7XG4gICAgICBjb25zdCBvY2N1cnJlbmNlVHlwZSA9IHRoaXMuZ2xvYmFsU3RhdGUuZ2V0KCdsYXN0T2NjdXJyZW5jZVR5cGUnKVxuICAgICAgdGhpcy5vY2N1cnJlbmNlTWFuYWdlci5hZGRQYXR0ZXJuKHJlZ2V4LCB7b2NjdXJyZW5jZVR5cGV9KVxuICAgICAgdGhpcy5hY3RpdmF0ZU1vZGUoJ25vcm1hbCcpXG4gICAgfVxuICB9XG59XG5cbi8vIERlbGV0ZVxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIERlbGV0ZSBleHRlbmRzIE9wZXJhdG9yIHtcbiAgdHJhY2tDaGFuZ2UgPSB0cnVlXG4gIGZsYXNoQ2hlY2twb2ludCA9ICdkaWQtc2VsZWN0LW9jY3VycmVuY2UnXG4gIGZsYXNoVHlwZUZvck9jY3VycmVuY2UgPSAnb3BlcmF0b3ItcmVtb3ZlLW9jY3VycmVuY2UnXG4gIHN0YXlPcHRpb25OYW1lID0gJ3N0YXlPbkRlbGV0ZSdcbiAgc2V0VG9GaXJzdENoYXJhY3Rlck9uTGluZXdpc2UgPSB0cnVlXG5cbiAgZXhlY3V0ZSAoKSB7XG4gICAgdGhpcy5vbkRpZFNlbGVjdFRhcmdldCgoKSA9PiB7XG4gICAgICBpZiAodGhpcy5vY2N1cnJlbmNlU2VsZWN0ZWQgJiYgdGhpcy5vY2N1cnJlbmNlV2lzZSA9PT0gJ2xpbmV3aXNlJykge1xuICAgICAgICB0aGlzLmZsYXNoVGFyZ2V0ID0gZmFsc2VcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgaWYgKHRoaXMudGFyZ2V0Lndpc2UgPT09ICdibG9ja3dpc2UnKSB7XG4gICAgICB0aGlzLnJlc3RvcmVQb3NpdGlvbnMgPSBmYWxzZVxuICAgIH1cbiAgICBzdXBlci5leGVjdXRlKClcbiAgfVxuXG4gIG11dGF0ZVNlbGVjdGlvbiAoc2VsZWN0aW9uKSB7XG4gICAgdGhpcy5zZXRUZXh0VG9SZWdpc3RlcihzZWxlY3Rpb24uZ2V0VGV4dCgpLCBzZWxlY3Rpb24pXG4gICAgc2VsZWN0aW9uLmRlbGV0ZVNlbGVjdGVkVGV4dCgpXG4gIH1cbn1cblxuY2xhc3MgRGVsZXRlUmlnaHQgZXh0ZW5kcyBEZWxldGUge1xuICB0YXJnZXQgPSAnTW92ZVJpZ2h0J1xufVxuXG5jbGFzcyBEZWxldGVMZWZ0IGV4dGVuZHMgRGVsZXRlIHtcbiAgdGFyZ2V0ID0gJ01vdmVMZWZ0J1xufVxuXG5jbGFzcyBEZWxldGVUb0xhc3RDaGFyYWN0ZXJPZkxpbmUgZXh0ZW5kcyBEZWxldGUge1xuICB0YXJnZXQgPSAnTW92ZVRvTGFzdENoYXJhY3Rlck9mTGluZSdcblxuICBleGVjdXRlICgpIHtcbiAgICB0aGlzLm9uRGlkU2VsZWN0VGFyZ2V0KCgpID0+IHtcbiAgICAgIGlmICh0aGlzLnRhcmdldC53aXNlID09PSAnYmxvY2t3aXNlJykge1xuICAgICAgICBmb3IgKGNvbnN0IGJsb2Nrd2lzZVNlbGVjdGlvbiBvZiB0aGlzLmdldEJsb2Nrd2lzZVNlbGVjdGlvbnMoKSkge1xuICAgICAgICAgIGJsb2Nrd2lzZVNlbGVjdGlvbi5leHRlbmRNZW1iZXJTZWxlY3Rpb25zVG9FbmRPZkxpbmUoKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgICBzdXBlci5leGVjdXRlKClcbiAgfVxufVxuXG5jbGFzcyBEZWxldGVMaW5lIGV4dGVuZHMgRGVsZXRlIHtcbiAgd2lzZSA9ICdsaW5ld2lzZSdcbiAgdGFyZ2V0ID0gJ01vdmVUb1JlbGF0aXZlTGluZSdcbiAgZmxhc2hUYXJnZXQgPSBmYWxzZVxufVxuXG4vLyBZYW5rXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBZYW5rIGV4dGVuZHMgT3BlcmF0b3Ige1xuICB0cmFja0NoYW5nZSA9IHRydWVcbiAgc3RheU9wdGlvbk5hbWUgPSAnc3RheU9uWWFuaydcblxuICBtdXRhdGVTZWxlY3Rpb24gKHNlbGVjdGlvbikge1xuICAgIHRoaXMuc2V0VGV4dFRvUmVnaXN0ZXIoc2VsZWN0aW9uLmdldFRleHQoKSwgc2VsZWN0aW9uKVxuICB9XG59XG5cbmNsYXNzIFlhbmtMaW5lIGV4dGVuZHMgWWFuayB7XG4gIHdpc2UgPSAnbGluZXdpc2UnXG4gIHRhcmdldCA9ICdNb3ZlVG9SZWxhdGl2ZUxpbmUnXG59XG5cbmNsYXNzIFlhbmtUb0xhc3RDaGFyYWN0ZXJPZkxpbmUgZXh0ZW5kcyBZYW5rIHtcbiAgdGFyZ2V0ID0gJ01vdmVUb0xhc3RDaGFyYWN0ZXJPZkxpbmUnXG59XG5cbi8vIFlhbmsgZGlmZiBodW5rIGF0IGN1cnNvciBieSByZW1vdmluZyBsZWFkaW5nIFwiK1wiIG9yIFwiLVwiIGZyb20gZWFjaCBsaW5lXG5jbGFzcyBZYW5rRGlmZkh1bmsgZXh0ZW5kcyBZYW5rIHtcbiAgdGFyZ2V0ID0gJ0lubmVyRGlmZkh1bmsnXG4gIG11dGF0ZVNlbGVjdGlvbiAoc2VsZWN0aW9uKSB7XG4gICAgLy8gUmVtb3ZlIGxlYWRpbmcgXCIrXCIgb3IgXCItXCIgaW4gZGlmZiBodW5rXG4gICAgY29uc3QgdGV4dFRvWWFuayA9IHNlbGVjdGlvbi5nZXRUZXh0KCkucmVwbGFjZSgvXi4vZ20sICcnKVxuICAgIHRoaXMuc2V0VGV4dFRvUmVnaXN0ZXIodGV4dFRvWWFuaywgc2VsZWN0aW9uKVxuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFtjdHJsLWFdXG5jbGFzcyBJbmNyZWFzZSBleHRlbmRzIE9wZXJhdG9yIHtcbiAgdGFyZ2V0ID0gJ0VtcHR5JyAvLyBjdHJsLWEgaW4gbm9ybWFsLW1vZGUgZmluZCB0YXJnZXQgbnVtYmVyIGluIGN1cnJlbnQgbGluZSBtYW51YWxseVxuICBmbGFzaFRhcmdldCA9IGZhbHNlIC8vIGRvIG1hbnVhbGx5XG4gIHJlc3RvcmVQb3NpdGlvbnMgPSBmYWxzZSAvLyBkbyBtYW51YWxseVxuICBzdGVwID0gMVxuXG4gIGV4ZWN1dGUgKCkge1xuICAgIHRoaXMubmV3UmFuZ2VzID0gW11cbiAgICBpZiAoIXRoaXMucmVnZXgpIHRoaXMucmVnZXggPSBuZXcgUmVnRXhwKGAke3RoaXMuZ2V0Q29uZmlnKCdudW1iZXJSZWdleCcpfWAsICdnJylcblxuICAgIHN1cGVyLmV4ZWN1dGUoKVxuXG4gICAgaWYgKHRoaXMubmV3UmFuZ2VzLmxlbmd0aCkge1xuICAgICAgaWYgKHRoaXMuZ2V0Q29uZmlnKCdmbGFzaE9uT3BlcmF0ZScpICYmICF0aGlzLmdldENvbmZpZygnZmxhc2hPbk9wZXJhdGVCbGFja2xpc3QnKS5pbmNsdWRlcyh0aGlzLm5hbWUpKSB7XG4gICAgICAgIHRoaXMudmltU3RhdGUuZmxhc2godGhpcy5uZXdSYW5nZXMsIHt0eXBlOiB0aGlzLmZsYXNoVHlwZUZvck9jY3VycmVuY2V9KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJlcGxhY2VOdW1iZXJJbkJ1ZmZlclJhbmdlIChzY2FuUmFuZ2UsIGZuKSB7XG4gICAgY29uc3QgbmV3UmFuZ2VzID0gW11cbiAgICB0aGlzLnNjYW5FZGl0b3IoJ2ZvcndhcmQnLCB0aGlzLnJlZ2V4LCB7c2NhblJhbmdlfSwgZXZlbnQgPT4ge1xuICAgICAgaWYgKGZuKSB7XG4gICAgICAgIGlmIChmbihldmVudCkpIGV2ZW50LnN0b3AoKVxuICAgICAgICBlbHNlIHJldHVyblxuICAgICAgfVxuICAgICAgY29uc3QgbmV4dE51bWJlciA9IHRoaXMuZ2V0TmV4dE51bWJlcihldmVudC5tYXRjaFRleHQpXG4gICAgICBuZXdSYW5nZXMucHVzaChldmVudC5yZXBsYWNlKFN0cmluZyhuZXh0TnVtYmVyKSkpXG4gICAgfSlcbiAgICByZXR1cm4gbmV3UmFuZ2VzXG4gIH1cblxuICBtdXRhdGVTZWxlY3Rpb24gKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IHtjdXJzb3J9ID0gc2VsZWN0aW9uXG4gICAgaWYgKHRoaXMudGFyZ2V0Lm5hbWUgPT09ICdFbXB0eScpIHtcbiAgICAgIC8vIGN0cmwtYSwgY3RybC14IGluIGBub3JtYWwtbW9kZWBcbiAgICAgIGNvbnN0IGN1cnNvclBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIGNvbnN0IHNjYW5SYW5nZSA9IHRoaXMuZWRpdG9yLmJ1ZmZlclJhbmdlRm9yQnVmZmVyUm93KGN1cnNvclBvc2l0aW9uLnJvdylcbiAgICAgIGNvbnN0IG5ld1JhbmdlcyA9IHRoaXMucmVwbGFjZU51bWJlckluQnVmZmVyUmFuZ2Uoc2NhblJhbmdlLCBldmVudCA9PlxuICAgICAgICBldmVudC5yYW5nZS5lbmQuaXNHcmVhdGVyVGhhbihjdXJzb3JQb3NpdGlvbilcbiAgICAgIClcbiAgICAgIGNvbnN0IHBvaW50ID0gKG5ld1Jhbmdlcy5sZW5ndGggJiYgbmV3UmFuZ2VzWzBdLmVuZC50cmFuc2xhdGUoWzAsIC0xXSkpIHx8IGN1cnNvclBvc2l0aW9uXG4gICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHNjYW5SYW5nZSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgICB0aGlzLm5ld1Jhbmdlcy5wdXNoKC4uLnRoaXMucmVwbGFjZU51bWJlckluQnVmZmVyUmFuZ2Uoc2NhblJhbmdlKSlcbiAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihzY2FuUmFuZ2Uuc3RhcnQpXG4gICAgfVxuICB9XG5cbiAgZ2V0TmV4dE51bWJlciAobnVtYmVyU3RyaW5nKSB7XG4gICAgcmV0dXJuIE51bWJlci5wYXJzZUludChudW1iZXJTdHJpbmcsIDEwKSArIHRoaXMuc3RlcCAqIHRoaXMuZ2V0Q291bnQoKVxuICB9XG59XG5cbi8vIFtjdHJsLXhdXG5jbGFzcyBEZWNyZWFzZSBleHRlbmRzIEluY3JlYXNlIHtcbiAgc3RlcCA9IC0xXG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFtnIGN0cmwtYV1cbmNsYXNzIEluY3JlbWVudE51bWJlciBleHRlbmRzIEluY3JlYXNlIHtcbiAgYmFzZU51bWJlciA9IG51bGxcbiAgdGFyZ2V0ID0gbnVsbFxuXG4gIGdldE5leHROdW1iZXIgKG51bWJlclN0cmluZykge1xuICAgIGlmICh0aGlzLmJhc2VOdW1iZXIgIT0gbnVsbCkge1xuICAgICAgdGhpcy5iYXNlTnVtYmVyICs9IHRoaXMuc3RlcCAqIHRoaXMuZ2V0Q291bnQoKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmJhc2VOdW1iZXIgPSBOdW1iZXIucGFyc2VJbnQobnVtYmVyU3RyaW5nLCAxMClcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYmFzZU51bWJlclxuICB9XG59XG5cbi8vIFtnIGN0cmwteF1cbmNsYXNzIERlY3JlbWVudE51bWJlciBleHRlbmRzIEluY3JlbWVudE51bWJlciB7XG4gIHN0ZXAgPSAtMVxufVxuXG4vLyBQdXRcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIEN1cnNvciBwbGFjZW1lbnQ6XG4vLyAtIHBsYWNlIGF0IGVuZCBvZiBtdXRhdGlvbjogcGFzdGUgbm9uLW11bHRpbGluZSBjaGFyYWN0ZXJ3aXNlIHRleHRcbi8vIC0gcGxhY2UgYXQgc3RhcnQgb2YgbXV0YXRpb246IG5vbi1tdWx0aWxpbmUgY2hhcmFjdGVyd2lzZSB0ZXh0KGNoYXJhY3Rlcndpc2UsIGxpbmV3aXNlKVxuY2xhc3MgUHV0QmVmb3JlIGV4dGVuZHMgT3BlcmF0b3Ige1xuICBsb2NhdGlvbiA9ICdiZWZvcmUnXG4gIHRhcmdldCA9ICdFbXB0eSdcbiAgZmxhc2hUeXBlID0gJ29wZXJhdG9yLWxvbmcnXG4gIHJlc3RvcmVQb3NpdGlvbnMgPSBmYWxzZSAvLyBtYW5hZ2UgbWFudWFsbHlcbiAgZmxhc2hUYXJnZXQgPSBmYWxzZSAvLyBtYW5hZ2UgbWFudWFsbHlcbiAgdHJhY2tDaGFuZ2UgPSBmYWxzZSAvLyBtYW5hZ2UgbWFudWFsbHlcblxuICBpbml0aWFsaXplICgpIHtcbiAgICB0aGlzLnZpbVN0YXRlLnNlcXVlbnRpYWxQYXN0ZU1hbmFnZXIub25Jbml0aWFsaXplKHRoaXMpXG4gICAgc3VwZXIuaW5pdGlhbGl6ZSgpXG4gIH1cblxuICBleGVjdXRlICgpIHtcbiAgICB0aGlzLm11dGF0aW9uc0J5U2VsZWN0aW9uID0gbmV3IE1hcCgpXG4gICAgdGhpcy5zZXF1ZW50aWFsUGFzdGUgPSB0aGlzLnZpbVN0YXRlLnNlcXVlbnRpYWxQYXN0ZU1hbmFnZXIub25FeGVjdXRlKHRoaXMpXG5cbiAgICB0aGlzLm9uRGlkRmluaXNoTXV0YXRpb24oKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLmNhbmNlbGxlZCkgdGhpcy5hZGp1c3RDdXJzb3JQb3NpdGlvbigpXG4gICAgfSlcblxuICAgIHN1cGVyLmV4ZWN1dGUoKVxuXG4gICAgaWYgKHRoaXMuY2FuY2VsbGVkKSByZXR1cm5cblxuICAgIHRoaXMub25EaWRGaW5pc2hPcGVyYXRpb24oKCkgPT4ge1xuICAgICAgLy8gVHJhY2tDaGFuZ2VcbiAgICAgIGNvbnN0IG5ld1JhbmdlID0gdGhpcy5tdXRhdGlvbnNCeVNlbGVjdGlvbi5nZXQodGhpcy5lZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpKVxuICAgICAgaWYgKG5ld1JhbmdlKSB0aGlzLnNldE1hcmtGb3JDaGFuZ2UobmV3UmFuZ2UpXG5cbiAgICAgIC8vIEZsYXNoXG4gICAgICBpZiAodGhpcy5nZXRDb25maWcoJ2ZsYXNoT25PcGVyYXRlJykgJiYgIXRoaXMuZ2V0Q29uZmlnKCdmbGFzaE9uT3BlcmF0ZUJsYWNrbGlzdCcpLmluY2x1ZGVzKHRoaXMubmFtZSkpIHtcbiAgICAgICAgY29uc3QgcmFuZ2VzID0gdGhpcy5lZGl0b3IuZ2V0U2VsZWN0aW9ucygpLm1hcChzZWxlY3Rpb24gPT4gdGhpcy5tdXRhdGlvbnNCeVNlbGVjdGlvbi5nZXQoc2VsZWN0aW9uKSlcbiAgICAgICAgdGhpcy52aW1TdGF0ZS5mbGFzaChyYW5nZXMsIHt0eXBlOiB0aGlzLmdldEZsYXNoVHlwZSgpfSlcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgYWRqdXN0Q3Vyc29yUG9zaXRpb24gKCkge1xuICAgIGZvciAoY29uc3Qgc2VsZWN0aW9uIG9mIHRoaXMuZWRpdG9yLmdldFNlbGVjdGlvbnMoKSkge1xuICAgICAgaWYgKCF0aGlzLm11dGF0aW9uc0J5U2VsZWN0aW9uLmhhcyhzZWxlY3Rpb24pKSBjb250aW51ZVxuXG4gICAgICBjb25zdCB7Y3Vyc29yfSA9IHNlbGVjdGlvblxuICAgICAgY29uc3QgbmV3UmFuZ2UgPSB0aGlzLm11dGF0aW9uc0J5U2VsZWN0aW9uLmdldChzZWxlY3Rpb24pXG4gICAgICBpZiAodGhpcy5saW5ld2lzZVBhc3RlKSB7XG4gICAgICAgIHRoaXMudXRpbHMubW92ZUN1cnNvclRvRmlyc3RDaGFyYWN0ZXJBdFJvdyhjdXJzb3IsIG5ld1JhbmdlLnN0YXJ0LnJvdylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChuZXdSYW5nZS5pc1NpbmdsZUxpbmUoKSkge1xuICAgICAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihuZXdSYW5nZS5lbmQudHJhbnNsYXRlKFswLCAtMV0pKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihuZXdSYW5nZS5zdGFydClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG11dGF0ZVNlbGVjdGlvbiAoc2VsZWN0aW9uKSB7XG4gICAgY29uc3QgdmFsdWUgPSB0aGlzLnZpbVN0YXRlLnJlZ2lzdGVyLmdldChudWxsLCBzZWxlY3Rpb24sIHRoaXMuc2VxdWVudGlhbFBhc3RlKVxuICAgIGlmICghdmFsdWUudGV4dCkge1xuICAgICAgdGhpcy5jYW5jZWxsZWQgPSB0cnVlXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCB0ZXh0VG9QYXN0ZSA9IHZhbHVlLnRleHQucmVwZWF0KHRoaXMuZ2V0Q291bnQoKSlcbiAgICB0aGlzLmxpbmV3aXNlUGFzdGUgPSB2YWx1ZS50eXBlID09PSAnbGluZXdpc2UnIHx8IHRoaXMuaXNNb2RlKCd2aXN1YWwnLCAnbGluZXdpc2UnKVxuICAgIGNvbnN0IG5ld1JhbmdlID0gdGhpcy5wYXN0ZShzZWxlY3Rpb24sIHRleHRUb1Bhc3RlLCB7bGluZXdpc2VQYXN0ZTogdGhpcy5saW5ld2lzZVBhc3RlfSlcbiAgICB0aGlzLm11dGF0aW9uc0J5U2VsZWN0aW9uLnNldChzZWxlY3Rpb24sIG5ld1JhbmdlKVxuICAgIHRoaXMudmltU3RhdGUuc2VxdWVudGlhbFBhc3RlTWFuYWdlci5zYXZlUGFzdGVkUmFuZ2VGb3JTZWxlY3Rpb24oc2VsZWN0aW9uLCBuZXdSYW5nZSlcbiAgfVxuXG4gIC8vIFJldHVybiBwYXN0ZWQgcmFuZ2VcbiAgcGFzdGUgKHNlbGVjdGlvbiwgdGV4dCwge2xpbmV3aXNlUGFzdGV9KSB7XG4gICAgaWYgKHRoaXMuc2VxdWVudGlhbFBhc3RlKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXN0ZUNoYXJhY3Rlcndpc2Uoc2VsZWN0aW9uLCB0ZXh0KVxuICAgIH0gZWxzZSBpZiAobGluZXdpc2VQYXN0ZSkge1xuICAgICAgcmV0dXJuIHRoaXMucGFzdGVMaW5ld2lzZShzZWxlY3Rpb24sIHRleHQpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnBhc3RlQ2hhcmFjdGVyd2lzZShzZWxlY3Rpb24sIHRleHQpXG4gICAgfVxuICB9XG5cbiAgcGFzdGVDaGFyYWN0ZXJ3aXNlIChzZWxlY3Rpb24sIHRleHQpIHtcbiAgICBjb25zdCB7Y3Vyc29yfSA9IHNlbGVjdGlvblxuICAgIGlmIChzZWxlY3Rpb24uaXNFbXB0eSgpICYmIHRoaXMubG9jYXRpb24gPT09ICdhZnRlcicgJiYgIXRoaXMuaXNFbXB0eVJvdyhjdXJzb3IuZ2V0QnVmZmVyUm93KCkpKSB7XG4gICAgICBjdXJzb3IubW92ZVJpZ2h0KClcbiAgICB9XG4gICAgcmV0dXJuIHNlbGVjdGlvbi5pbnNlcnRUZXh0KHRleHQpXG4gIH1cblxuICAvLyBSZXR1cm4gbmV3UmFuZ2VcbiAgcGFzdGVMaW5ld2lzZSAoc2VsZWN0aW9uLCB0ZXh0KSB7XG4gICAgY29uc3Qge2N1cnNvcn0gPSBzZWxlY3Rpb25cbiAgICBjb25zdCBjdXJzb3JSb3cgPSBjdXJzb3IuZ2V0QnVmZmVyUm93KClcbiAgICBpZiAoIXRleHQuZW5kc1dpdGgoJ1xcbicpKSB7XG4gICAgICB0ZXh0ICs9ICdcXG4nXG4gICAgfVxuICAgIGlmIChzZWxlY3Rpb24uaXNFbXB0eSgpKSB7XG4gICAgICBpZiAodGhpcy5sb2NhdGlvbiA9PT0gJ2JlZm9yZScpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudXRpbHMuaW5zZXJ0VGV4dEF0QnVmZmVyUG9zaXRpb24odGhpcy5lZGl0b3IsIFtjdXJzb3JSb3csIDBdLCB0ZXh0KVxuICAgICAgfSBlbHNlIGlmICh0aGlzLmxvY2F0aW9uID09PSAnYWZ0ZXInKSB7XG4gICAgICAgIGNvbnN0IHRhcmdldFJvdyA9IHRoaXMuZ2V0Rm9sZEVuZFJvd0ZvclJvdyhjdXJzb3JSb3cpXG4gICAgICAgIHRoaXMudXRpbHMuZW5zdXJlRW5kc1dpdGhOZXdMaW5lRm9yQnVmZmVyUm93KHRoaXMuZWRpdG9yLCB0YXJnZXRSb3cpXG4gICAgICAgIHJldHVybiB0aGlzLnV0aWxzLmluc2VydFRleHRBdEJ1ZmZlclBvc2l0aW9uKHRoaXMuZWRpdG9yLCBbdGFyZ2V0Um93ICsgMSwgMF0sIHRleHQpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghdGhpcy5pc01vZGUoJ3Zpc3VhbCcsICdsaW5ld2lzZScpKSB7XG4gICAgICAgIHNlbGVjdGlvbi5pbnNlcnRUZXh0KCdcXG4nKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHNlbGVjdGlvbi5pbnNlcnRUZXh0KHRleHQpXG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFB1dEFmdGVyIGV4dGVuZHMgUHV0QmVmb3JlIHtcbiAgbG9jYXRpb24gPSAnYWZ0ZXInXG59XG5cbmNsYXNzIFB1dEJlZm9yZVdpdGhBdXRvSW5kZW50IGV4dGVuZHMgUHV0QmVmb3JlIHtcbiAgcGFzdGVMaW5ld2lzZSAoc2VsZWN0aW9uLCB0ZXh0KSB7XG4gICAgY29uc3QgbmV3UmFuZ2UgPSBzdXBlci5wYXN0ZUxpbmV3aXNlKHNlbGVjdGlvbiwgdGV4dClcbiAgICB0aGlzLnV0aWxzLmFkanVzdEluZGVudFdpdGhLZWVwaW5nTGF5b3V0KHRoaXMuZWRpdG9yLCBuZXdSYW5nZSlcbiAgICByZXR1cm4gbmV3UmFuZ2VcbiAgfVxufVxuXG5jbGFzcyBQdXRBZnRlcldpdGhBdXRvSW5kZW50IGV4dGVuZHMgUHV0QmVmb3JlV2l0aEF1dG9JbmRlbnQge1xuICBsb2NhdGlvbiA9ICdhZnRlcidcbn1cblxuY2xhc3MgQWRkQmxhbmtMaW5lQmVsb3cgZXh0ZW5kcyBPcGVyYXRvciB7XG4gIGZsYXNoVGFyZ2V0ID0gZmFsc2VcbiAgdGFyZ2V0ID0gJ0VtcHR5J1xuICBzdGF5QXRTYW1lUG9zaXRpb24gPSB0cnVlXG4gIHN0YXlCeU1hcmtlciA9IHRydWVcbiAgd2hlcmUgPSAnYmVsb3cnXG5cbiAgbXV0YXRlU2VsZWN0aW9uIChzZWxlY3Rpb24pIHtcbiAgICBjb25zdCBwb2ludCA9IHNlbGVjdGlvbi5nZXRIZWFkQnVmZmVyUG9zaXRpb24oKVxuICAgIGlmICh0aGlzLndoZXJlID09PSAnYmVsb3cnKSBwb2ludC5yb3crK1xuICAgIHBvaW50LmNvbHVtbiA9IDBcbiAgICB0aGlzLmVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShbcG9pbnQsIHBvaW50XSwgJ1xcbicucmVwZWF0KHRoaXMuZ2V0Q291bnQoKSkpXG4gIH1cbn1cblxuY2xhc3MgQWRkQmxhbmtMaW5lQWJvdmUgZXh0ZW5kcyBBZGRCbGFua0xpbmVCZWxvdyB7XG4gIHdoZXJlID0gJ2Fib3ZlJ1xufVxuXG5jbGFzcyBSZXNvbHZlR2l0Q29uZmxpY3QgZXh0ZW5kcyBPcGVyYXRvciB7XG4gIHRhcmdldCA9ICdFbXB0eSdcbiAgcmVzdG9yZVBvc2l0aW9ucyA9IGZhbHNlIC8vIGRvIG1hbnVhbGx5XG5cbiAgbXV0YXRlU2VsZWN0aW9uIChzZWxlY3Rpb24pIHtcbiAgICBjb25zdCBwb2ludCA9IHRoaXMuZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgIGNvbnN0IHJhbmdlSW5mbyA9IHRoaXMuZ2V0Q29uZmxpY3RpbmdSYW5nZUluZm8ocG9pbnQucm93KVxuXG4gICAgaWYgKHJhbmdlSW5mbykge1xuICAgICAgY29uc3Qge3dob2xlLCBzZWN0aW9uT3Vycywgc2VjdGlvblRoZWlycywgYm9keU91cnMsIGJvZHlUaGVpcnN9ID0gcmFuZ2VJbmZvXG4gICAgICBjb25zdCByZXNvbHZlQ29uZmxpY3QgPSByYW5nZSA9PiB7XG4gICAgICAgIGNvbnN0IHRleHQgPSB0aGlzLmVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZSlcbiAgICAgICAgY29uc3QgZHN0UmFuZ2UgPSB0aGlzLmdldEJ1ZmZlclJhbmdlRm9yUm93UmFuZ2UoW3dob2xlLnN0YXJ0LnJvdywgd2hvbGUuZW5kLnJvd10pXG4gICAgICAgIGNvbnN0IG5ld1JhbmdlID0gdGhpcy5lZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UoZHN0UmFuZ2UsIHRleHQgPyB0ZXh0ICsgJ1xcbicgOiAnJylcbiAgICAgICAgc2VsZWN0aW9uLmN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihuZXdSYW5nZS5zdGFydClcbiAgICAgIH1cbiAgICAgIC8vIE5PVEU6IFdoZW4gY3Vyc29yIGlzIGF0IHNlcGFyYXRvciByb3cgJz09PT09PT0nLCBubyByZXBsYWNlIGhhcHBlbnMgYmVjYXVzZSBpdCdzIGFtYmlndW91cy5cbiAgICAgIGlmIChzZWN0aW9uT3Vycy5jb250YWluc1BvaW50KHBvaW50KSkge1xuICAgICAgICByZXNvbHZlQ29uZmxpY3QoYm9keU91cnMpXG4gICAgICB9IGVsc2UgaWYgKHNlY3Rpb25UaGVpcnMuY29udGFpbnNQb2ludChwb2ludCkpIHtcbiAgICAgICAgcmVzb2x2ZUNvbmZsaWN0KGJvZHlUaGVpcnMpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0Q29uZmxpY3RpbmdSYW5nZUluZm8gKHJvdykge1xuICAgIGNvbnN0IGZyb20gPSBbcm93LCBJbmZpbml0eV1cbiAgICBjb25zdCBjb25mbGljdFN0YXJ0ID0gdGhpcy5maW5kSW5FZGl0b3IoJ2JhY2t3YXJkJywgL148PDw8PDw8IC4rJC8sIHtmcm9tfSwgZXZlbnQgPT4gZXZlbnQucmFuZ2Uuc3RhcnQpXG5cbiAgICBpZiAoY29uZmxpY3RTdGFydCkge1xuICAgICAgY29uc3Qgc3RhcnRSb3cgPSBjb25mbGljdFN0YXJ0LnJvd1xuICAgICAgbGV0IHNlcGFyYXRvclJvdywgZW5kUm93XG4gICAgICBjb25zdCBmcm9tID0gW3N0YXJ0Um93ICsgMSwgMF1cbiAgICAgIGNvbnN0IHJlZ2V4ID0gLyhePDw8PDw8PCAuKyQpfChePT09PT09PSQpfChePj4+Pj4+PiAuKyQpL2dcbiAgICAgIHRoaXMuc2NhbkVkaXRvcignZm9yd2FyZCcsIHJlZ2V4LCB7ZnJvbX0sICh7bWF0Y2gsIHJhbmdlLCBzdG9wfSkgPT4ge1xuICAgICAgICBpZiAobWF0Y2hbMV0pIHtcbiAgICAgICAgICAvLyBpbmNvbXBsZXRlIGNvbmZsaWN0IGh1bmssIHdlIHNhdyBuZXh0IGNvbmZsaWN0IHN0YXJ0Um93IHdpaG91dCBzZWVpbmcgZW5kUm93XG4gICAgICAgICAgc3RvcCgpXG4gICAgICAgIH0gZWxzZSBpZiAobWF0Y2hbMl0pIHtcbiAgICAgICAgICBzZXBhcmF0b3JSb3cgPSByYW5nZS5zdGFydC5yb3dcbiAgICAgICAgfSBlbHNlIGlmIChtYXRjaFszXSkge1xuICAgICAgICAgIGVuZFJvdyA9IHJhbmdlLnN0YXJ0LnJvd1xuICAgICAgICAgIHN0b3AoKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgaWYgKCFlbmRSb3cpIHJldHVyblxuICAgICAgY29uc3Qgd2hvbGUgPSBuZXcgUmFuZ2UoW3N0YXJ0Um93LCAwXSwgW2VuZFJvdywgSW5maW5pdHldKVxuICAgICAgY29uc3Qgc2VjdGlvbk91cnMgPSBuZXcgUmFuZ2Uod2hvbGUuc3RhcnQsIFsoc2VwYXJhdG9yUm93IHx8IGVuZFJvdykgLSAxLCBJbmZpbml0eV0pXG4gICAgICBjb25zdCBzZWN0aW9uVGhlaXJzID0gbmV3IFJhbmdlKFsoc2VwYXJhdG9yUm93IHx8IHN0YXJ0Um93KSArIDEsIDBdLCB3aG9sZS5lbmQpXG5cbiAgICAgIGNvbnN0IGJvZHlPdXJzU3RhcnQgPSBzZWN0aW9uT3Vycy5zdGFydC50cmFuc2xhdGUoWzEsIDBdKVxuICAgICAgY29uc3QgYm9keU91cnMgPVxuICAgICAgICBzZWN0aW9uT3Vycy5nZXRSb3dDb3VudCgpID09PSAxXG4gICAgICAgICAgPyBuZXcgUmFuZ2UoYm9keU91cnNTdGFydCwgYm9keU91cnNTdGFydClcbiAgICAgICAgICA6IG5ldyBSYW5nZShib2R5T3Vyc1N0YXJ0LCBzZWN0aW9uT3Vycy5lbmQpXG5cbiAgICAgIGNvbnN0IGJvZHlUaGVpcnMgPVxuICAgICAgICBzZWN0aW9uVGhlaXJzLmdldFJvd0NvdW50KCkgPT09IDFcbiAgICAgICAgICA/IG5ldyBSYW5nZShzZWN0aW9uVGhlaXJzLnN0YXJ0LCBzZWN0aW9uVGhlaXJzLnN0YXJ0KVxuICAgICAgICAgIDogc2VjdGlvblRoZWlycy50cmFuc2xhdGUoWzAsIDBdLCBbLTEsIDBdKVxuICAgICAgcmV0dXJuIHt3aG9sZSwgc2VjdGlvbk91cnMsIHNlY3Rpb25UaGVpcnMsIGJvZHlPdXJzLCBib2R5VGhlaXJzfVxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgT3BlcmF0b3IsXG4gIFNlbGVjdEJhc2UsXG4gIFNlbGVjdCxcbiAgU2VsZWN0TGF0ZXN0Q2hhbmdlLFxuICBTZWxlY3RQcmV2aW91c1NlbGVjdGlvbixcbiAgU2VsZWN0UGVyc2lzdGVudFNlbGVjdGlvbixcbiAgU2VsZWN0T2NjdXJyZW5jZSxcbiAgVmlzdWFsTW9kZVNlbGVjdCxcbiAgQ3JlYXRlUGVyc2lzdGVudFNlbGVjdGlvbixcbiAgVG9nZ2xlUGVyc2lzdGVudFNlbGVjdGlvbixcbiAgVG9nZ2xlUHJlc2V0T2NjdXJyZW5jZSxcbiAgVG9nZ2xlUHJlc2V0U3Vid29yZE9jY3VycmVuY2UsXG4gIEFkZFByZXNldE9jY3VycmVuY2VGcm9tTGFzdE9jY3VycmVuY2VQYXR0ZXJuLFxuICBEZWxldGUsXG4gIERlbGV0ZVJpZ2h0LFxuICBEZWxldGVMZWZ0LFxuICBEZWxldGVUb0xhc3RDaGFyYWN0ZXJPZkxpbmUsXG4gIERlbGV0ZUxpbmUsXG4gIFlhbmssXG4gIFlhbmtMaW5lLFxuICBZYW5rVG9MYXN0Q2hhcmFjdGVyT2ZMaW5lLFxuICBZYW5rRGlmZkh1bmssXG4gIEluY3JlYXNlLFxuICBEZWNyZWFzZSxcbiAgSW5jcmVtZW50TnVtYmVyLFxuICBEZWNyZW1lbnROdW1iZXIsXG4gIFB1dEJlZm9yZSxcbiAgUHV0QWZ0ZXIsXG4gIFB1dEJlZm9yZVdpdGhBdXRvSW5kZW50LFxuICBQdXRBZnRlcldpdGhBdXRvSW5kZW50LFxuICBBZGRCbGFua0xpbmVCZWxvdyxcbiAgQWRkQmxhbmtMaW5lQWJvdmUsXG4gIFJlc29sdmVHaXRDb25mbGljdFxufVxuIl19