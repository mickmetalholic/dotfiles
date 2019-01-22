Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodash = require('lodash');

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _blameFormatter = require('./blameFormatter');

/**
 * @module GitCommander
 *
 * Utility for executing git commands on a repo in a given working directory.
 */
'use babel';

var GitCommander = (function () {
  function GitCommander(path) {
    _classCallCheck(this, GitCommander);

    this.workingDirectory = path;
  }

  /**
   * Spawns a process to execute a git command in the GitCommander instances
   * working directory.
   *
   * @param {array|string} args - arguments to call `git` with on the command line
   * @param {function} callback - node callback for error and command output
   */

  _createClass(GitCommander, [{
    key: 'exec',
    value: function exec(args, callback) {
      if (!(0, _lodash.isArray)(args) || !(0, _lodash.isFunction)(callback)) {
        return;
      }

      var gitBinary = atom.config.get('git-blame.gitBinaryPath') || 'git';

      var child = _child_process2['default'].spawn(gitBinary, args, { cwd: this.workingDirectory });
      var stdout = '';
      var stderr = '';
      var processError = undefined;

      child.stdout.on('data', function (data) {
        stdout += data;
      });

      child.stderr.on('data', function (data) {
        stderr += data;
      });

      child.on('error', function (error) {
        processError = error;
      });

      child.on('close', function (errorCode) {
        if (processError) {
          return callback(processError);
        }

        if (errorCode) {
          var error = new Error(stderr);
          error.code = errorCode;
          return callback(error);
        }

        return callback(null, stdout.trimRight());
      });
    }

    /**
     * Executes git blame on the input file in the instances working directory
     *
     * @param {string} fileName - name of file to blame, relative to the repos
     *   working directory
     * @param {function} callback - callback funtion to call with results or error
     */
  }, {
    key: 'blame',
    value: function blame(fileName, callback) {
      var args = ['blame', '--line-porcelain'];

      // ignore white space based on config
      if (atom.config.get('git-blame.ignoreWhiteSpaceDiffs')) {
        args.push('-w');
      }

      args.push(fileName);

      // Execute blame command and parse
      this.exec(args, function (err, blameStdOut) {
        if (err) {
          return callback(err, blameStdOut);
        }

        return callback(null, (0, _blameFormatter.parseBlame)(blameStdOut));
      });
    }

    /**
     * Executes git config --get
     *
     * @param {string} name - the name of the variable to look up eg: "group.varName"
     * @param {function} callback - callback funtion to call with results or error
     */
  }, {
    key: 'config',
    value: function config(name, callback) {
      var args = ['config', '--get', name];

      // Execute config command
      this.exec(args, function (err, configStdOut) {
        if (err) {
          // Error code 1 means, this variable is not present in the config
          if (err.code === 1) {
            return callback(null, '');
          }
          return callback(err, configStdOut);
        }

        return callback(null, configStdOut);
      });
    }
  }]);

  return GitCommander;
})();

exports['default'] = GitCommander;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3l1YW5zaGVuLy5hdG9tL3BhY2thZ2VzL2dpdC1ibGFtZS9saWIvdXRpbC9HaXRDb21tYW5kZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztzQkFFb0MsUUFBUTs7NkJBQ25CLGVBQWU7Ozs7OEJBRWIsa0JBQWtCOzs7Ozs7O0FBTDdDLFdBQVcsQ0FBQzs7SUFZUyxZQUFZO0FBRXBCLFdBRlEsWUFBWSxDQUVuQixJQUFJLEVBQUU7MEJBRkMsWUFBWTs7QUFHN0IsUUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztHQUM5Qjs7Ozs7Ozs7OztlQUprQixZQUFZOztXQWEzQixjQUFDLElBQUksRUFBRSxRQUFRLEVBQUU7QUFDbkIsVUFBSSxDQUFDLHFCQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQVcsUUFBUSxDQUFDLEVBQUU7QUFDM0MsZUFBTztPQUNSOztBQUVELFVBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHlCQUF5QixDQUFDLElBQUksS0FBSyxDQUFDOztBQUV0RSxVQUFNLEtBQUssR0FBRywyQkFBYSxLQUFLLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxFQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUMsQ0FBQyxDQUFDO0FBQ2hGLFVBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUNoQixVQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDaEIsVUFBSSxZQUFZLFlBQUEsQ0FBQzs7QUFFakIsV0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLFVBQVUsSUFBSSxFQUFFO0FBQ3RDLGNBQU0sSUFBSSxJQUFJLENBQUM7T0FDaEIsQ0FBQyxDQUFDOztBQUVILFdBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxVQUFVLElBQUksRUFBRTtBQUN0QyxjQUFNLElBQUksSUFBSSxDQUFDO09BQ2hCLENBQUMsQ0FBQzs7QUFFSCxXQUFLLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFVLEtBQUssRUFBRTtBQUNqQyxvQkFBWSxHQUFHLEtBQUssQ0FBQztPQUN0QixDQUFDLENBQUM7O0FBRUgsV0FBSyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBVSxTQUFTLEVBQUU7QUFDckMsWUFBSSxZQUFZLEVBQUU7QUFDaEIsaUJBQU8sUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQy9COztBQUVELFlBQUksU0FBUyxFQUFFO0FBQ2IsY0FBTSxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDaEMsZUFBSyxDQUFDLElBQUksR0FBRyxTQUFTLENBQUM7QUFDdkIsaUJBQU8sUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3hCOztBQUVELGVBQU8sUUFBUSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztPQUMzQyxDQUFDLENBQUM7S0FDSjs7Ozs7Ozs7Ozs7V0FTSSxlQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUU7QUFDeEIsVUFBTSxJQUFJLEdBQUcsQ0FBQyxPQUFPLEVBQUUsa0JBQWtCLENBQUMsQ0FBQzs7O0FBRzNDLFVBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsaUNBQWlDLENBQUMsRUFBRTtBQUN0RCxZQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO09BQ2pCOztBQUVELFVBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7OztBQUdwQixVQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLEdBQUcsRUFBRSxXQUFXLEVBQUU7QUFDMUMsWUFBSSxHQUFHLEVBQUU7QUFDUCxpQkFBTyxRQUFRLENBQUMsR0FBRyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1NBQ25DOztBQUVELGVBQU8sUUFBUSxDQUFDLElBQUksRUFBRSxnQ0FBVyxXQUFXLENBQUMsQ0FBQyxDQUFDO09BQ2hELENBQUMsQ0FBQztLQUNKOzs7Ozs7Ozs7O1dBUUssZ0JBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtBQUNyQixVQUFNLElBQUksR0FBRyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7OztBQUd2QyxVQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLEdBQUcsRUFBRSxZQUFZLEVBQUU7QUFDM0MsWUFBSSxHQUFHLEVBQUU7O0FBRVAsY0FBSSxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRTtBQUNsQixtQkFBTyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1dBQzNCO0FBQ0QsaUJBQU8sUUFBUSxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQztTQUNwQzs7QUFFRCxlQUFPLFFBQVEsQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7T0FDckMsQ0FBQyxDQUFDO0tBQ0o7OztTQXBHa0IsWUFBWTs7O3FCQUFaLFlBQVkiLCJmaWxlIjoiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvZ2l0LWJsYW1lL2xpYi91dGlsL0dpdENvbW1hbmRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5pbXBvcnQgeyBpc0FycmF5LCBpc0Z1bmN0aW9uIH0gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBjaGlsZFByb2Nlc3MgZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5cbmltcG9ydCB7IHBhcnNlQmxhbWUgfSBmcm9tICcuL2JsYW1lRm9ybWF0dGVyJztcblxuLyoqXG4gKiBAbW9kdWxlIEdpdENvbW1hbmRlclxuICpcbiAqIFV0aWxpdHkgZm9yIGV4ZWN1dGluZyBnaXQgY29tbWFuZHMgb24gYSByZXBvIGluIGEgZ2l2ZW4gd29ya2luZyBkaXJlY3RvcnkuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdpdENvbW1hbmRlciB7XG5cbiAgY29uc3RydWN0b3IocGF0aCkge1xuICAgIHRoaXMud29ya2luZ0RpcmVjdG9yeSA9IHBhdGg7XG4gIH1cblxuICAvKipcbiAgICogU3Bhd25zIGEgcHJvY2VzcyB0byBleGVjdXRlIGEgZ2l0IGNvbW1hbmQgaW4gdGhlIEdpdENvbW1hbmRlciBpbnN0YW5jZXNcbiAgICogd29ya2luZyBkaXJlY3RvcnkuXG4gICAqXG4gICAqIEBwYXJhbSB7YXJyYXl8c3RyaW5nfSBhcmdzIC0gYXJndW1lbnRzIHRvIGNhbGwgYGdpdGAgd2l0aCBvbiB0aGUgY29tbWFuZCBsaW5lXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gbm9kZSBjYWxsYmFjayBmb3IgZXJyb3IgYW5kIGNvbW1hbmQgb3V0cHV0XG4gICAqL1xuICBleGVjKGFyZ3MsIGNhbGxiYWNrKSB7XG4gICAgaWYgKCFpc0FycmF5KGFyZ3MpIHx8ICFpc0Z1bmN0aW9uKGNhbGxiYWNrKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGdpdEJpbmFyeSA9IGF0b20uY29uZmlnLmdldCgnZ2l0LWJsYW1lLmdpdEJpbmFyeVBhdGgnKSB8fCAnZ2l0JztcblxuICAgIGNvbnN0IGNoaWxkID0gY2hpbGRQcm9jZXNzLnNwYXduKGdpdEJpbmFyeSwgYXJncywge2N3ZDogdGhpcy53b3JraW5nRGlyZWN0b3J5fSk7XG4gICAgbGV0IHN0ZG91dCA9ICcnO1xuICAgIGxldCBzdGRlcnIgPSAnJztcbiAgICBsZXQgcHJvY2Vzc0Vycm9yO1xuXG4gICAgY2hpbGQuc3Rkb3V0Lm9uKCdkYXRhJywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIHN0ZG91dCArPSBkYXRhO1xuICAgIH0pO1xuXG4gICAgY2hpbGQuc3RkZXJyLm9uKCdkYXRhJywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIHN0ZGVyciArPSBkYXRhO1xuICAgIH0pO1xuXG4gICAgY2hpbGQub24oJ2Vycm9yJywgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICBwcm9jZXNzRXJyb3IgPSBlcnJvcjtcbiAgICB9KTtcblxuICAgIGNoaWxkLm9uKCdjbG9zZScsIGZ1bmN0aW9uIChlcnJvckNvZGUpIHtcbiAgICAgIGlmIChwcm9jZXNzRXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHByb2Nlc3NFcnJvcik7XG4gICAgICB9XG5cbiAgICAgIGlmIChlcnJvckNvZGUpIHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3Ioc3RkZXJyKTtcbiAgICAgICAgZXJyb3IuY29kZSA9IGVycm9yQ29kZTtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIHN0ZG91dC50cmltUmlnaHQoKSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZXMgZ2l0IGJsYW1lIG9uIHRoZSBpbnB1dCBmaWxlIGluIHRoZSBpbnN0YW5jZXMgd29ya2luZyBkaXJlY3RvcnlcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVOYW1lIC0gbmFtZSBvZiBmaWxlIHRvIGJsYW1lLCByZWxhdGl2ZSB0byB0aGUgcmVwb3NcbiAgICogICB3b3JraW5nIGRpcmVjdG9yeVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAtIGNhbGxiYWNrIGZ1bnRpb24gdG8gY2FsbCB3aXRoIHJlc3VsdHMgb3IgZXJyb3JcbiAgICovXG4gIGJsYW1lKGZpbGVOYW1lLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGFyZ3MgPSBbJ2JsYW1lJywgJy0tbGluZS1wb3JjZWxhaW4nXTtcblxuICAgIC8vIGlnbm9yZSB3aGl0ZSBzcGFjZSBiYXNlZCBvbiBjb25maWdcbiAgICBpZiAoYXRvbS5jb25maWcuZ2V0KCdnaXQtYmxhbWUuaWdub3JlV2hpdGVTcGFjZURpZmZzJykpIHtcbiAgICAgIGFyZ3MucHVzaCgnLXcnKTtcbiAgICB9XG5cbiAgICBhcmdzLnB1c2goZmlsZU5hbWUpO1xuXG4gICAgLy8gRXhlY3V0ZSBibGFtZSBjb21tYW5kIGFuZCBwYXJzZVxuICAgIHRoaXMuZXhlYyhhcmdzLCBmdW5jdGlvbiAoZXJyLCBibGFtZVN0ZE91dCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCBibGFtZVN0ZE91dCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjYWxsYmFjayhudWxsLCBwYXJzZUJsYW1lKGJsYW1lU3RkT3V0KSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZXMgZ2l0IGNvbmZpZyAtLWdldFxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIHRoZSBuYW1lIG9mIHRoZSB2YXJpYWJsZSB0byBsb29rIHVwIGVnOiBcImdyb3VwLnZhck5hbWVcIlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAtIGNhbGxiYWNrIGZ1bnRpb24gdG8gY2FsbCB3aXRoIHJlc3VsdHMgb3IgZXJyb3JcbiAgICovXG4gIGNvbmZpZyhuYW1lLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGFyZ3MgPSBbJ2NvbmZpZycsICctLWdldCcsIG5hbWVdO1xuXG4gICAgLy8gRXhlY3V0ZSBjb25maWcgY29tbWFuZFxuICAgIHRoaXMuZXhlYyhhcmdzLCBmdW5jdGlvbiAoZXJyLCBjb25maWdTdGRPdXQpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgLy8gRXJyb3IgY29kZSAxIG1lYW5zLCB0aGlzIHZhcmlhYmxlIGlzIG5vdCBwcmVzZW50IGluIHRoZSBjb25maWdcbiAgICAgICAgaWYgKGVyci5jb2RlID09PSAxKSB7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsICcnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCBjb25maWdTdGRPdXQpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgY29uZmlnU3RkT3V0KTtcbiAgICB9KTtcbiAgfVxufVxuIl19