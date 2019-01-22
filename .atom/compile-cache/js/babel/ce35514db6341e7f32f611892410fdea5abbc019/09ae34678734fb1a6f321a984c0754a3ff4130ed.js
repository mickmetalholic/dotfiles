Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodash = require('lodash');

var _atom = require('atom');

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _Blamer = require('./Blamer');

var _Blamer2 = _interopRequireDefault(_Blamer);

var _GitCommander = require('./GitCommander');

var _GitCommander2 = _interopRequireDefault(_GitCommander);

var _RemoteRevision = require('./RemoteRevision');

var _RemoteRevision2 = _interopRequireDefault(_RemoteRevision);

var _repositoryForEditorPath = require('./repositoryForEditorPath');

var _repositoryForEditorPath2 = _interopRequireDefault(_repositoryForEditorPath);

var _componentsBlameLine = require('../components/BlameLine');

var _componentsBlameLine2 = _interopRequireDefault(_componentsBlameLine);

var _componentsGutterResize = require('../components/GutterResize');

var _componentsGutterResize2 = _interopRequireDefault(_componentsGutterResize);

'use babel';

var GUTTER_ID = 'com.alexcorre.git-blame';
var GUTTER_STYLE_ID = 'com.alexcorre.git-blame.style';
var RESIZE_DEBOUNCE_MS = 5;

var GIT_CONFIG_REPO_URL = 'atom-git-blame.repositoryUrlTemplate';

var BlameGutter = (function () {
  function BlameGutter(editor) {
    _classCallCheck(this, BlameGutter);

    (0, _lodash.bindAll)(this, ['onResizeStart']);

    this.editor = editor;
    this.isShown = false;
    this.lineDecorations = [];
    this.disposables = new _atom.CompositeDisposable();

    // resize
    var width = atom.config.get('git-blame.columnWidth');
    this.updateGutterWidth(width);

    this.resizeStartWidth = null;
    this.resizeStartX = null;
    this.isResizing = false;
    this.eventListeners = {};
  }

  /**
   * Top level API for toggling gutter visiblity + blaming the currently
   * open file, if any.
   */

  _createClass(BlameGutter, [{
    key: 'toggleVisibility',
    value: function toggleVisibility() {
      return this.setVisibility(!this.isShown);
    }

    /**
     * Set the visibility of the gutter. Bootstraps a new gutter if need be.
     *
     * @returns {Promise<boolean>}
     */
  }, {
    key: 'setVisibility',
    value: function setVisibility(visible) {
      // if we're trying to set the visiblity to the value it already has
      // just resolve and do nothing.
      if (this.isShown === visible) {
        return Promise.resolve(visible);
      }

      // grab filePath from editor
      var editor = this.editor;

      var filePath = editor.isEmpty() ? null : editor.getPath();
      if (!filePath) {
        return Promise.reject(new Error('No filePath could be determined for editor.'));
      }

      if (visible) {
        // we are showing the gutter
        this.gutter().show();
        this.updateLineMarkers(filePath);
      } else {
        this.removeLineMarkers();
        this.gutter().hide();
        this.gutter().destroy();
      }

      this.isShown = visible;
      return Promise.resolve(this.isShown);
    }

    /**
     * Lazily generate a Gutter instance for the current editor, the first time
     * we need it. Any other accesses will grab the same gutter reference until
     * the Gutter is explicitly disposed.
     */
  }, {
    key: 'gutter',
    value: function gutter() {
      var editor = this.editor;

      var gutter = editor.gutterWithName(GUTTER_ID);
      return gutter || editor.addGutter({
        name: GUTTER_ID,
        visible: false,
        priority: 100
      });
    }
  }, {
    key: 'updateLineMarkers',
    value: function updateLineMarkers(filePath) {
      var _this = this;

      var showFirstNames = atom.config.get('git-blame.showFirstNames');
      var showLastNames = atom.config.get('git-blame.showLastNames');
      var showHash = atom.config.get('git-blame.showHash');
      var colorCommitAuthors = atom.config.get('git-blame.colorCommitAuthors');
      return (0, _repositoryForEditorPath2['default'])(filePath).then(function (repo) {
        var blamer = new _Blamer2['default'](repo);
        var gitCmd = new _GitCommander2['default'](repo.getWorkingDirectory());
        var blamePromise = new Promise(function (resolve, reject) {
          blamer.blame(filePath, function (err, data) {
            return err ? reject(err) : resolve([repo, data]);
          });
        });
        var gitConfigPromise = new Promise(function (resolve, reject) {
          gitCmd.config(GIT_CONFIG_REPO_URL, function (err, data) {
            return err ? reject(err) : resolve(data);
          });
        });
        return Promise.all([blamePromise, gitConfigPromise]);
      }).then(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2);

        var _ref2$0 = _slicedToArray(_ref2[0], 2);

        var repo = _ref2$0[0];
        var blameData = _ref2$0[1];
        var gitConfigData = _ref2[1];

        var remoteRevision = new _RemoteRevision2['default'](repo.getOriginURL(filePath), gitConfigData);
        var hasUrlTemplate = !!remoteRevision.getTemplate();
        var lastHash = null;
        var className = null;

        blameData.forEach(function (lineData) {
          var lineNumber = lineData.lineNumber;
          var hash = lineData.hash;
          var noCommit = lineData.noCommit;

          if (noCommit) {
            return;
          }

          // set alternating background className
          if (hash !== lastHash) {
            className = className === 'lighter' ? 'darker' : 'lighter';
          }
          lastHash = hash;

          // generate a link to the commit
          var viewCommitUrl = hasUrlTemplate ? remoteRevision.url(lineData.hash) : '#';
          var copyHashOnClick = !hasUrlTemplate;

          // construct props for BlameLine component
          var lineProps = _extends({}, lineData, {
            className: className,
            viewCommitUrl: viewCommitUrl,
            showFirstNames: showFirstNames,
            showLastNames: showLastNames,
            showHash: showHash,
            colorCommitAuthors: colorCommitAuthors,
            copyHashOnClick: copyHashOnClick
          });

          // adding one marker to the first line
          var lineRange = new _atom.Range([lineNumber - 1, 0], [lineNumber - 1, 0]);
          var lineMarker = _this.editor.markBufferRange(lineRange);

          var node = _this.generateLineElement(lineProps);
          var decoration = _this.gutter().decorateMarker(lineMarker, {
            'class': 'blame-line-marker',
            item: node
          });

          _this.lineDecorations.push(decoration);
        });
      });
    }
  }, {
    key: 'removeLineMarkers',
    value: function removeLineMarkers() {
      this.disposables.dispose();
      this.disposables = new _atom.CompositeDisposable();
      this.lineDecorations.forEach(function (decoration) {
        decoration.destroy();
      });
    }
  }, {
    key: 'generateLineElement',
    value: function generateLineElement(lineProps) {
      var div = document.createElement('div');

      // Use React to render the BlameLine component
      _reactDom2['default'].render(_react2['default'].createElement(
        _componentsGutterResize2['default'],
        { onResizeStart: this.onResizeStart },
        _react2['default'].createElement(_componentsBlameLine2['default'], lineProps)
      ), div);

      var tip = atom.tooltips.add(div, {
        title: lineProps.summary,
        placement: 'right'
      });
      this.disposables.add(tip);

      return div;
    }
  }, {
    key: 'onResizeStart',
    value: function onResizeStart(e) {
      this.isResizing = true;
      this.resizeStartX = e.pageX;
      this.resizeStartWidth = this.width;
      this.bindResizeEvents();
    }
  }, {
    key: 'onResizeEnd',
    value: function onResizeEnd() {
      this.unbindResizeEvents();
      this.isResizing = false;
      this.resizeStartX = null;
    }
  }, {
    key: 'onResizeMove',
    value: function onResizeMove(e) {
      if (!this.resizeStartX) {
        return;
      }
      var delta = e.pageX - this.resizeStartX;
      this.updateGutterWidth(this.resizeStartWidth + delta);
    }
  }, {
    key: 'bindResizeEvents',
    value: function bindResizeEvents() {
      if (!this.eventListeners.mouseup) {
        var mouseupHandler = this.onResizeEnd.bind(this);
        this.eventListeners.mouseup = mouseupHandler;
        document.addEventListener('mouseup', mouseupHandler);
      }
      if (!this.eventListeners.mousemove) {
        var mouseMoveHandler = (0, _lodash.debounce)(this.onResizeMove.bind(this), RESIZE_DEBOUNCE_MS);
        this.eventListeners.mousemove = mouseMoveHandler;
        document.addEventListener('mousemove', mouseMoveHandler);
      }
    }
  }, {
    key: 'unbindResizeEvents',
    value: function unbindResizeEvents() {
      var _eventListeners = this.eventListeners;
      var mousemove = _eventListeners.mousemove;
      var mouseup = _eventListeners.mouseup;

      document.removeEventListener('mousemove', mousemove);
      delete this.eventListeners.mousemove;
      document.removeEventListener('mouseup', mouseup);
      delete this.eventListeners.mouseup;
    }
  }, {
    key: 'updateGutterWidth',
    value: function updateGutterWidth(newWidth) {
      this.width = newWidth;
      atom.config.set('git-blame.columnWidth', newWidth);

      var tag = document.getElementById(GUTTER_STYLE_ID);
      if (!tag) {
        tag = document.createElement('style');
        tag.id = GUTTER_STYLE_ID;
        tag.type = 'text/css';
        document.head.appendChild(tag);
      }

      var styles = '\n      atom-text-editor .gutter[gutter-name="' + GUTTER_ID + '"] {\n        width: ' + newWidth + 'px;\n      }\n    ';
      tag.textContent = styles;
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.gutter().destroy();
    }
  }]);

  return BlameGutter;
})();

exports['default'] = BlameGutter;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3l1YW5zaGVuLy5hdG9tL3BhY2thZ2VzL2dpdC1ibGFtZS9saWIvdXRpbC9CbGFtZUd1dHRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztzQkFFa0MsUUFBUTs7b0JBQ0MsTUFBTTs7cUJBQy9CLE9BQU87Ozs7d0JBQ0osV0FBVzs7OztzQkFFYixVQUFVOzs7OzRCQUNKLGdCQUFnQjs7Ozs4QkFDZCxrQkFBa0I7Ozs7dUNBQ1QsMkJBQTJCOzs7O21DQUN6Qyx5QkFBeUI7Ozs7c0NBQ3RCLDRCQUE0Qjs7OztBQVpyRCxXQUFXLENBQUM7O0FBY1osSUFBTSxTQUFTLEdBQUcseUJBQXlCLENBQUM7QUFDNUMsSUFBTSxlQUFlLEdBQUcsK0JBQStCLENBQUM7QUFDeEQsSUFBTSxrQkFBa0IsR0FBRyxDQUFDLENBQUM7O0FBRTdCLElBQU0sbUJBQW1CLEdBQUcsc0NBQXNDLENBQUM7O0lBRTlDLFdBQVc7QUFFbkIsV0FGUSxXQUFXLENBRWxCLE1BQU0sRUFBRTswQkFGRCxXQUFXOztBQUc1Qix5QkFBUSxJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDOztBQUVqQyxRQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztBQUNyQixRQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUNyQixRQUFJLENBQUMsZUFBZSxHQUFHLEVBQUUsQ0FBQztBQUMxQixRQUFJLENBQUMsV0FBVyxHQUFHLCtCQUF5QixDQUFDOzs7QUFHN0MsUUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsQ0FBQztBQUN2RCxRQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7O0FBRTlCLFFBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7QUFDN0IsUUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7QUFDekIsUUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENB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UUFBUSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUNuRCxVQUFJLENBQUMsR0FBRyxFQUFFO0FBQ1IsV0FBRyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDdEMsV0FBRyxDQUFDLEVBQUUsR0FBRyxlQUFlLENBQUM7QUFDekIsV0FBRyxDQUFDLElBQUksR0FBRyxVQUFVLENBQUM7QUFDdEIsZ0JBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO09BQ2hDOztBQUVELFVBQU0sTUFBTSxzREFDOEIsU0FBUyw2QkFDdEMsUUFBUSx1QkFFcEIsQ0FBQztBQUNGLFNBQUcsQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDO0tBQzFCOzs7V0FFTSxtQkFBRztBQUNSLFVBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztLQUN6Qjs7O1NBL09rQixXQUFXOzs7cUJBQVgsV0FBVyIsImZpbGUiOiIvaG9tZS95dWFuc2hlbi8uYXRvbS9wYWNrYWdlcy9naXQtYmxhbWUvbGliL3V0aWwvQmxhbWVHdXR0ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcblxuaW1wb3J0IHsgZGVib3VuY2UsIGJpbmRBbGwgfSBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHsgUmFuZ2UsIENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tICdhdG9tJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUmVhY3RET00gZnJvbSAncmVhY3QtZG9tJztcblxuaW1wb3J0IEJsYW1lciBmcm9tICcuL0JsYW1lcic7XG5pbXBvcnQgR2l0Q29tbWFuZGVyIGZyb20gJy4vR2l0Q29tbWFuZGVyJztcbmltcG9ydCBSZW1vdGVSZXZpc2lvbiBmcm9tICcuL1JlbW90ZVJldmlzaW9uJztcbmltcG9ydCByZXBvc2l0b3J5Rm9yRWRpdG9yUGF0aCBmcm9tICcuL3JlcG9zaXRvcnlGb3JFZGl0b3JQYXRoJztcbmltcG9ydCBCbGFtZUxpbmUgZnJvbSAnLi4vY29tcG9uZW50cy9CbGFtZUxpbmUnO1xuaW1wb3J0IEd1dHRlclJlc2l6ZSBmcm9tICcuLi9jb21wb25lbnRzL0d1dHRlclJlc2l6ZSc7XG5cbmNvbnN0IEdVVFRFUl9JRCA9ICdjb20uYWxleGNvcnJlLmdpdC1ibGFtZSc7XG5jb25zdCBHVVRURVJfU1RZTEVfSUQgPSAnY29tLmFsZXhjb3JyZS5naXQtYmxhbWUuc3R5bGUnO1xuY29uc3QgUkVTSVpFX0RFQk9VTkNFX01TID0gNTtcblxuY29uc3QgR0lUX0NPTkZJR19SRVBPX1VSTCA9ICdhdG9tLWdpdC1ibGFtZS5yZXBvc2l0b3J5VXJsVGVtcGxhdGUnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCbGFtZUd1dHRlciB7XG5cbiAgY29uc3RydWN0b3IoZWRpdG9yKSB7XG4gICAgYmluZEFsbCh0aGlzLCBbJ29uUmVzaXplU3RhcnQnXSk7XG5cbiAgICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcbiAgICB0aGlzLmlzU2hvd24gPSBmYWxzZTtcbiAgICB0aGlzLmxpbmVEZWNvcmF0aW9ucyA9IFtdO1xuICAgIHRoaXMuZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuXG4gICAgLy8gcmVzaXplXG4gICAgY29uc3Qgd2lkdGggPSBhdG9tLmNvbmZpZy5nZXQoJ2dpdC1ibGFtZS5jb2x1bW5XaWR0aCcpO1xuICAgIHRoaXMudXBkYXRlR3V0dGVyV2lkdGgod2lkdGgpO1xuXG4gICAgdGhpcy5yZXNpemVTdGFydFdpZHRoID0gbnVsbDtcbiAgICB0aGlzLnJlc2l6ZVN0YXJ0WCA9IG51bGw7XG4gICAgdGhpcy5pc1Jlc2l6aW5nID0gZmFsc2U7XG4gICAgdGhpcy5ldmVudExpc3RlbmVycyA9IHt9O1xuICB9XG5cbiAgLyoqXG4gICAqIFRvcCBsZXZlbCBBUEkgZm9yIHRvZ2dsaW5nIGd1dHRlciB2aXNpYmxpdHkgKyBibGFtaW5nIHRoZSBjdXJyZW50bHlcbiAgICogb3BlbiBmaWxlLCBpZiBhbnkuXG4gICAqL1xuICB0b2dnbGVWaXNpYmlsaXR5KCkge1xuICAgIHJldHVybiB0aGlzLnNldFZpc2liaWxpdHkoIXRoaXMuaXNTaG93bik7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSB2aXNpYmlsaXR5IG9mIHRoZSBndXR0ZXIuIEJvb3RzdHJhcHMgYSBuZXcgZ3V0dGVyIGlmIG5lZWQgYmUuXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPGJvb2xlYW4+fVxuICAgKi9cbiAgc2V0VmlzaWJpbGl0eSh2aXNpYmxlKSB7XG4gICAgLy8gaWYgd2UncmUgdHJ5aW5nIHRvIHNldCB0aGUgdmlzaWJsaXR5IHRvIHRoZSB2YWx1ZSBpdCBhbHJlYWR5IGhhc1xuICAgIC8vIGp1c3QgcmVzb2x2ZSBhbmQgZG8gbm90aGluZy5cbiAgICBpZiAodGhpcy5pc1Nob3duID09PSB2aXNpYmxlKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHZpc2libGUpO1xuICAgIH1cblxuICAgIC8vIGdyYWIgZmlsZVBhdGggZnJvbSBlZGl0b3JcbiAgICBjb25zdCB7IGVkaXRvciB9ID0gdGhpcztcbiAgICBjb25zdCBmaWxlUGF0aCA9IGVkaXRvci5pc0VtcHR5KCkgPyBudWxsIDogZWRpdG9yLmdldFBhdGgoKTtcbiAgICBpZiAoIWZpbGVQYXRoKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdObyBmaWxlUGF0aCBjb3VsZCBiZSBkZXRlcm1pbmVkIGZvciBlZGl0b3IuJykpO1xuICAgIH1cblxuICAgIGlmICh2aXNpYmxlKSB7XG4gICAgICAvLyB3ZSBhcmUgc2hvd2luZyB0aGUgZ3V0dGVyXG4gICAgICB0aGlzLmd1dHRlcigpLnNob3coKTtcbiAgICAgIHRoaXMudXBkYXRlTGluZU1hcmtlcnMoZmlsZVBhdGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJlbW92ZUxpbmVNYXJrZXJzKCk7XG4gICAgICB0aGlzLmd1dHRlcigpLmhpZGUoKTtcbiAgICAgIHRoaXMuZ3V0dGVyKCkuZGVzdHJveSgpO1xuICAgIH1cblxuICAgIHRoaXMuaXNTaG93biA9IHZpc2libGU7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLmlzU2hvd24pO1xuICB9XG5cbiAgLyoqXG4gICAqIExhemlseSBnZW5lcmF0ZSBhIEd1dHRlciBpbnN0YW5jZSBmb3IgdGhlIGN1cnJlbnQgZWRpdG9yLCB0aGUgZmlyc3QgdGltZVxuICAgKiB3ZSBuZWVkIGl0LiBBbnkgb3RoZXIgYWNjZXNzZXMgd2lsbCBncmFiIHRoZSBzYW1lIGd1dHRlciByZWZlcmVuY2UgdW50aWxcbiAgICogdGhlIEd1dHRlciBpcyBleHBsaWNpdGx5IGRpc3Bvc2VkLlxuICAgKi9cbiAgZ3V0dGVyKCkge1xuICAgIGNvbnN0IHsgZWRpdG9yIH0gPSB0aGlzO1xuICAgIGNvbnN0IGd1dHRlciA9IGVkaXRvci5ndXR0ZXJXaXRoTmFtZShHVVRURVJfSUQpO1xuICAgIHJldHVybiBndXR0ZXIgfHwgZWRpdG9yLmFkZEd1dHRlcih7XG4gICAgICBuYW1lOiBHVVRURVJfSUQsXG4gICAgICB2aXNpYmxlOiBmYWxzZSxcbiAgICAgIHByaW9yaXR5OiAxMDAsXG4gICAgfSk7XG4gIH1cblxuICB1cGRhdGVMaW5lTWFya2VycyhmaWxlUGF0aCkge1xuICAgIGNvbnN0IHNob3dGaXJzdE5hbWVzID0gYXRvbS5jb25maWcuZ2V0KCdnaXQtYmxhbWUuc2hvd0ZpcnN0TmFtZXMnKTtcbiAgICBjb25zdCBzaG93TGFzdE5hbWVzID0gYXRvbS5jb25maWcuZ2V0KCdnaXQtYmxhbWUuc2hvd0xhc3ROYW1lcycpO1xuICAgIGNvbnN0IHNob3dIYXNoID0gYXRvbS5jb25maWcuZ2V0KCdnaXQtYmxhbWUuc2hvd0hhc2gnKTtcbiAgICBjb25zdCBjb2xvckNvbW1pdEF1dGhvcnMgPSBhdG9tLmNvbmZpZy5nZXQoJ2dpdC1ibGFtZS5jb2xvckNvbW1pdEF1dGhvcnMnKTtcbiAgICByZXR1cm4gcmVwb3NpdG9yeUZvckVkaXRvclBhdGgoZmlsZVBhdGgpXG4gICAgICAudGhlbigocmVwbykgPT4ge1xuICAgICAgICBjb25zdCBibGFtZXIgPSBuZXcgQmxhbWVyKHJlcG8pO1xuICAgICAgICBjb25zdCBnaXRDbWQgPSBuZXcgR2l0Q29tbWFuZGVyKHJlcG8uZ2V0V29ya2luZ0RpcmVjdG9yeSgpKTtcbiAgICAgICAgY29uc3QgYmxhbWVQcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIGJsYW1lci5ibGFtZShmaWxlUGF0aCwgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIGVyciA/IHJlamVjdChlcnIpIDogcmVzb2x2ZShbcmVwbywgZGF0YV0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZ2l0Q29uZmlnUHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBnaXRDbWQuY29uZmlnKEdJVF9DT05GSUdfUkVQT19VUkwsIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiBlcnIgPyByZWplY3QoZXJyKSA6IHJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW2JsYW1lUHJvbWlzZSwgZ2l0Q29uZmlnUHJvbWlzZV0pO1xuICAgICAgfSlcbiAgICAgIC50aGVuKChbW3JlcG8sIGJsYW1lRGF0YV0sIGdpdENvbmZpZ0RhdGFdKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlbW90ZVJldmlzaW9uID0gbmV3IFJlbW90ZVJldmlzaW9uKHJlcG8uZ2V0T3JpZ2luVVJMKGZpbGVQYXRoKSwgZ2l0Q29uZmlnRGF0YSk7XG4gICAgICAgIGNvbnN0IGhhc1VybFRlbXBsYXRlID0gISFyZW1vdGVSZXZpc2lvbi5nZXRUZW1wbGF0ZSgpO1xuICAgICAgICBsZXQgbGFzdEhhc2ggPSBudWxsO1xuICAgICAgICBsZXQgY2xhc3NOYW1lID0gbnVsbDtcblxuICAgICAgICBibGFtZURhdGEuZm9yRWFjaCgobGluZURhdGEpID0+IHtcbiAgICAgICAgICBjb25zdCB7IGxpbmVOdW1iZXIsIGhhc2gsIG5vQ29tbWl0IH0gPSBsaW5lRGF0YTtcbiAgICAgICAgICBpZiAobm9Db21taXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBzZXQgYWx0ZXJuYXRpbmcgYmFja2dyb3VuZCBjbGFzc05hbWVcbiAgICAgICAgICBpZiAoaGFzaCAhPT0gbGFzdEhhc2gpIHtcbiAgICAgICAgICAgIGNsYXNzTmFtZSA9IChjbGFzc05hbWUgPT09ICdsaWdodGVyJykgPyAnZGFya2VyJyA6ICdsaWdodGVyJztcbiAgICAgICAgICB9XG4gICAgICAgICAgbGFzdEhhc2ggPSBoYXNoO1xuXG4gICAgICAgICAgLy8gZ2VuZXJhdGUgYSBsaW5rIHRvIHRoZSBjb21taXRcbiAgICAgICAgICBjb25zdCB2aWV3Q29tbWl0VXJsID0gaGFzVXJsVGVtcGxhdGUgPyByZW1vdGVSZXZpc2lvbi51cmwobGluZURhdGEuaGFzaCkgOiAnIyc7XG4gICAgICAgICAgY29uc3QgY29weUhhc2hPbkNsaWNrID0gIWhhc1VybFRlbXBsYXRlO1xuXG4gICAgICAgICAgLy8gY29uc3RydWN0IHByb3BzIGZvciBCbGFtZUxpbmUgY29tcG9uZW50XG4gICAgICAgICAgY29uc3QgbGluZVByb3BzID0ge1xuICAgICAgICAgICAgLi4ubGluZURhdGEsXG4gICAgICAgICAgICBjbGFzc05hbWUsXG4gICAgICAgICAgICB2aWV3Q29tbWl0VXJsLFxuICAgICAgICAgICAgc2hvd0ZpcnN0TmFtZXMsXG4gICAgICAgICAgICBzaG93TGFzdE5hbWVzLFxuICAgICAgICAgICAgc2hvd0hhc2gsXG4gICAgICAgICAgICBjb2xvckNvbW1pdEF1dGhvcnMsXG4gICAgICAgICAgICBjb3B5SGFzaE9uQ2xpY2ssXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIC8vIGFkZGluZyBvbmUgbWFya2VyIHRvIHRoZSBmaXJzdCBsaW5lXG4gICAgICAgICAgY29uc3QgbGluZVJhbmdlID0gbmV3IFJhbmdlKFtsaW5lTnVtYmVyIC0gMSwgMF0sIFtsaW5lTnVtYmVyIC0gMSwgMF0pO1xuICAgICAgICAgIGNvbnN0IGxpbmVNYXJrZXIgPSB0aGlzLmVkaXRvci5tYXJrQnVmZmVyUmFuZ2UobGluZVJhbmdlKTtcblxuICAgICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLmdlbmVyYXRlTGluZUVsZW1lbnQobGluZVByb3BzKTtcbiAgICAgICAgICBjb25zdCBkZWNvcmF0aW9uID0gdGhpcy5ndXR0ZXIoKS5kZWNvcmF0ZU1hcmtlcihsaW5lTWFya2VyLCB7XG4gICAgICAgICAgICBjbGFzczogJ2JsYW1lLWxpbmUtbWFya2VyJyxcbiAgICAgICAgICAgIGl0ZW06IG5vZGUsXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICB0aGlzLmxpbmVEZWNvcmF0aW9ucy5wdXNoKGRlY29yYXRpb24pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gIH1cblxuICByZW1vdmVMaW5lTWFya2VycygpIHtcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmRpc3Bvc2UoKTtcbiAgICB0aGlzLmRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICB0aGlzLmxpbmVEZWNvcmF0aW9ucy5mb3JFYWNoKChkZWNvcmF0aW9uKSA9PiB7XG4gICAgICBkZWNvcmF0aW9uLmRlc3Ryb3koKTtcbiAgICB9KTtcbiAgfVxuXG4gIGdlbmVyYXRlTGluZUVsZW1lbnQobGluZVByb3BzKSB7XG4gICAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICAvLyBVc2UgUmVhY3QgdG8gcmVuZGVyIHRoZSBCbGFtZUxpbmUgY29tcG9uZW50XG4gICAgUmVhY3RET00ucmVuZGVyKFxuICAgICAgPEd1dHRlclJlc2l6ZSBvblJlc2l6ZVN0YXJ0PXt0aGlzLm9uUmVzaXplU3RhcnR9PlxuICAgICAgICA8QmxhbWVMaW5lIHsuLi5saW5lUHJvcHN9IC8+XG4gICAgICA8L0d1dHRlclJlc2l6ZT4sXG4gICAgICBkaXZcbiAgICApO1xuXG4gICAgY29uc3QgdGlwID0gYXRvbS50b29sdGlwcy5hZGQoZGl2LCB7XG4gICAgICB0aXRsZTogbGluZVByb3BzLnN1bW1hcnksXG4gICAgICBwbGFjZW1lbnQ6ICdyaWdodCcsXG4gICAgfSk7XG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQodGlwKTtcblxuICAgIHJldHVybiBkaXY7XG4gIH1cblxuICBvblJlc2l6ZVN0YXJ0KGUpIHtcbiAgICB0aGlzLmlzUmVzaXppbmcgPSB0cnVlO1xuICAgIHRoaXMucmVzaXplU3RhcnRYID0gZS5wYWdlWDtcbiAgICB0aGlzLnJlc2l6ZVN0YXJ0V2lkdGggPSB0aGlzLndpZHRoO1xuICAgIHRoaXMuYmluZFJlc2l6ZUV2ZW50cygpO1xuICB9XG5cbiAgb25SZXNpemVFbmQoKSB7XG4gICAgdGhpcy51bmJpbmRSZXNpemVFdmVudHMoKTtcbiAgICB0aGlzLmlzUmVzaXppbmcgPSBmYWxzZTtcbiAgICB0aGlzLnJlc2l6ZVN0YXJ0WCA9IG51bGw7XG4gIH1cblxuICBvblJlc2l6ZU1vdmUoZSkge1xuICAgIGlmICghdGhpcy5yZXNpemVTdGFydFgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgZGVsdGEgPSBlLnBhZ2VYIC0gdGhpcy5yZXNpemVTdGFydFg7XG4gICAgdGhpcy51cGRhdGVHdXR0ZXJXaWR0aCh0aGlzLnJlc2l6ZVN0YXJ0V2lkdGggKyBkZWx0YSk7XG4gIH1cblxuICBiaW5kUmVzaXplRXZlbnRzKCkge1xuICAgIGlmICghdGhpcy5ldmVudExpc3RlbmVycy5tb3VzZXVwKSB7XG4gICAgICBjb25zdCBtb3VzZXVwSGFuZGxlciA9IHRoaXMub25SZXNpemVFbmQuYmluZCh0aGlzKTtcbiAgICAgIHRoaXMuZXZlbnRMaXN0ZW5lcnMubW91c2V1cCA9IG1vdXNldXBIYW5kbGVyO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIG1vdXNldXBIYW5kbGVyKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLmV2ZW50TGlzdGVuZXJzLm1vdXNlbW92ZSkge1xuICAgICAgY29uc3QgbW91c2VNb3ZlSGFuZGxlciA9IGRlYm91bmNlKHRoaXMub25SZXNpemVNb3ZlLmJpbmQodGhpcyksIFJFU0laRV9ERUJPVU5DRV9NUyk7XG4gICAgICB0aGlzLmV2ZW50TGlzdGVuZXJzLm1vdXNlbW92ZSA9IG1vdXNlTW92ZUhhbmRsZXI7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBtb3VzZU1vdmVIYW5kbGVyKTtcbiAgICB9XG4gIH1cblxuICB1bmJpbmRSZXNpemVFdmVudHMoKSB7XG4gICAgY29uc3QgeyBtb3VzZW1vdmUsIG1vdXNldXAgfSA9IHRoaXMuZXZlbnRMaXN0ZW5lcnM7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgbW91c2Vtb3ZlKTtcbiAgICBkZWxldGUgdGhpcy5ldmVudExpc3RlbmVycy5tb3VzZW1vdmU7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIG1vdXNldXApO1xuICAgIGRlbGV0ZSB0aGlzLmV2ZW50TGlzdGVuZXJzLm1vdXNldXA7XG4gIH1cblxuICB1cGRhdGVHdXR0ZXJXaWR0aChuZXdXaWR0aCkge1xuICAgIHRoaXMud2lkdGggPSBuZXdXaWR0aDtcbiAgICBhdG9tLmNvbmZpZy5zZXQoJ2dpdC1ibGFtZS5jb2x1bW5XaWR0aCcsIG5ld1dpZHRoKTtcblxuICAgIGxldCB0YWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChHVVRURVJfU1RZTEVfSUQpO1xuICAgIGlmICghdGFnKSB7XG4gICAgICB0YWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgICAgdGFnLmlkID0gR1VUVEVSX1NUWUxFX0lEO1xuICAgICAgdGFnLnR5cGUgPSAndGV4dC9jc3MnO1xuICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZCh0YWcpO1xuICAgIH1cblxuICAgIGNvbnN0IHN0eWxlcyA9IGBcbiAgICAgIGF0b20tdGV4dC1lZGl0b3IgLmd1dHRlcltndXR0ZXItbmFtZT1cIiR7R1VUVEVSX0lEfVwiXSB7XG4gICAgICAgIHdpZHRoOiAke25ld1dpZHRofXB4O1xuICAgICAgfVxuICAgIGA7XG4gICAgdGFnLnRleHRDb250ZW50ID0gc3R5bGVzO1xuICB9XG5cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLmd1dHRlcigpLmRlc3Ryb3koKTtcbiAgfVxuXG59XG4iXX0=