Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _atom = require('atom');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _utilBlameGutter = require('./util/BlameGutter');

var _utilBlameGutter2 = _interopRequireDefault(_utilBlameGutter);

/**
 * Main Package Module
 */
'use babel';

exports['default'] = {

  config: _config2['default'],

  disposables: null,
  gutters: null,

  activate: function activate() {
    this.gutters = new Map();
    this.disposables = new _atom.CompositeDisposable();
    this.disposables.add(atom.commands.add('atom-workspace', {
      'git-blame:toggle': this.toggle.bind(this)
    }));
  },

  deactivate: function deactivate() {
    this.disposables.dispose();
    this.gutters.clear();
  },

  toggle: function toggle() {
    var editor = atom.workspace.getActiveTextEditor();

    // if there is no active text editor, git-blame can do nothing
    if (!editor) {
      return;
    }

    // get a BlameGutter from the cache or create a new one and add
    // it to the cache.
    var gutter = this.gutters.get(editor);
    if (!gutter) {
      gutter = new _utilBlameGutter2['default'](editor);
      this.disposables.add(gutter);
      this.gutters.set(editor, gutter);
    }

    // toggle visiblity of the active gutter
    gutter.toggleVisibility()['catch'](function (e) {
      console.error(e); // eslint-disable-line no-console
    });
  }

};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3l1YW5zaGVuLy5hdG9tL3BhY2thZ2VzL2dpdC1ibGFtZS9saWIvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O29CQUVvQyxNQUFNOztzQkFFdkIsVUFBVTs7OzsrQkFDTCxvQkFBb0I7Ozs7Ozs7QUFMNUMsV0FBVyxDQUFDOztxQkFVRzs7QUFFYixRQUFNLHFCQUFBOztBQUVOLGFBQVcsRUFBRSxJQUFJO0FBQ2pCLFNBQU8sRUFBRSxJQUFJOztBQUViLFVBQVEsRUFBQSxvQkFBRztBQUNULFFBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUN6QixRQUFJLENBQUMsV0FBVyxHQUFHLCtCQUF5QixDQUFDO0FBQzdDLFFBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFO0FBQ3ZELHdCQUFrQixFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztLQUMzQyxDQUFDLENBQUMsQ0FBQztHQUNMOztBQUVELFlBQVUsRUFBQSxzQkFBRztBQUNYLFFBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDM0IsUUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztHQUN0Qjs7QUFFRCxRQUFNLEVBQUEsa0JBQUc7QUFDUCxRQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7OztBQUdwRCxRQUFJLENBQUMsTUFBTSxFQUFFO0FBQ1gsYUFBTztLQUNSOzs7O0FBSUQsUUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDdEMsUUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNYLFlBQU0sR0FBRyxpQ0FBZ0IsTUFBTSxDQUFDLENBQUM7QUFDakMsVUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDN0IsVUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0tBQ2xDOzs7QUFHRCxVQUFNLENBQUMsZ0JBQWdCLEVBQUUsU0FDakIsQ0FBQyxVQUFDLENBQUMsRUFBSztBQUNaLGFBQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDbEIsQ0FBQyxDQUFDO0dBQ047O0NBRUYiLCJmaWxlIjoiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvZ2l0LWJsYW1lL2xpYi9pbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSc7XG5cbmltcG9ydCBjb25maWcgZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IEJsYW1lR3V0dGVyIGZyb20gJy4vdXRpbC9CbGFtZUd1dHRlcic7XG5cbi8qKlxuICogTWFpbiBQYWNrYWdlIE1vZHVsZVxuICovXG5leHBvcnQgZGVmYXVsdCB7XG5cbiAgY29uZmlnLFxuXG4gIGRpc3Bvc2FibGVzOiBudWxsLFxuICBndXR0ZXJzOiBudWxsLFxuXG4gIGFjdGl2YXRlKCkge1xuICAgIHRoaXMuZ3V0dGVycyA9IG5ldyBNYXAoKTtcbiAgICB0aGlzLmRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCB7XG4gICAgICAnZ2l0LWJsYW1lOnRvZ2dsZSc6IHRoaXMudG9nZ2xlLmJpbmQodGhpcyksXG4gICAgfSkpO1xuICB9LFxuXG4gIGRlYWN0aXZhdGUoKSB7XG4gICAgdGhpcy5kaXNwb3NhYmxlcy5kaXNwb3NlKCk7XG4gICAgdGhpcy5ndXR0ZXJzLmNsZWFyKCk7XG4gIH0sXG5cbiAgdG9nZ2xlKCkge1xuICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcblxuICAgIC8vIGlmIHRoZXJlIGlzIG5vIGFjdGl2ZSB0ZXh0IGVkaXRvciwgZ2l0LWJsYW1lIGNhbiBkbyBub3RoaW5nXG4gICAgaWYgKCFlZGl0b3IpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBnZXQgYSBCbGFtZUd1dHRlciBmcm9tIHRoZSBjYWNoZSBvciBjcmVhdGUgYSBuZXcgb25lIGFuZCBhZGRcbiAgICAvLyBpdCB0byB0aGUgY2FjaGUuXG4gICAgbGV0IGd1dHRlciA9IHRoaXMuZ3V0dGVycy5nZXQoZWRpdG9yKTtcbiAgICBpZiAoIWd1dHRlcikge1xuICAgICAgZ3V0dGVyID0gbmV3IEJsYW1lR3V0dGVyKGVkaXRvcik7XG4gICAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZChndXR0ZXIpO1xuICAgICAgdGhpcy5ndXR0ZXJzLnNldChlZGl0b3IsIGd1dHRlcik7XG4gICAgfVxuXG4gICAgLy8gdG9nZ2xlIHZpc2libGl0eSBvZiB0aGUgYWN0aXZlIGd1dHRlclxuICAgIGd1dHRlci50b2dnbGVWaXNpYmlsaXR5KClcbiAgICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGUpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgIH0pO1xuICB9LFxuXG59O1xuIl19