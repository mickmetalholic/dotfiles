Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodash = require('lodash');

var _GitCommander = require('./GitCommander');

var _GitCommander2 = _interopRequireDefault(_GitCommander);

'use babel';

var Blamer = (function () {
  function Blamer(repo) {
    _classCallCheck(this, Blamer);

    if (!repo) {
      throw new Error('Cannot create a Blamer without a repository.');
    }
    this.repo = repo;
    this.initialize();
  }

  /**
   * Initializes this Blamer instance, by creating git-tools repos for the root
   * repository and submodules.
   */

  _createClass(Blamer, [{
    key: 'initialize',
    value: function initialize() {
      var _this = this;

      this.tools = {};
      this.tools.root = new _GitCommander2['default'](this.repo.getWorkingDirectory());

      var submodules = this.repo.submodules;

      if (submodules) {
        (0, _lodash.each)(submodules, function (submodule, submodulePath) {
          _this.tools[submodulePath] = new _GitCommander2['default'](_this.repo.getWorkingDirectory() + '/' + submodulePath);
        });
      }
    }

    /**
     * Blames the given filePath and calls callback with blame lines or error.
     *
     * @param {string} filePath - filePath to blame
     * @param {function} callback - callback to call back with blame data
     */
  }, {
    key: 'blame',
    value: function blame(filePath, callback) {
      // Ensure file path is relative to root repo
      var cleanedFilePath = this.repo.relativize(filePath);
      var repoUtil = this.repoUtilForPath(cleanedFilePath);

      // Ensure that if this file is in a submodule, we remove the submodule dir
      // from the path
      cleanedFilePath = this.removeSubmodulePrefix(cleanedFilePath);

      if (!(0, _lodash.isFunction)(callback)) {
        throw new Error('Must be called with a callback function');
      }

      // Make the async blame call on the git repo
      repoUtil.blame(cleanedFilePath, function (err, blame) {
        callback(err, blame);
      });
    }

    /**
     * Utility to get the GitCommander repository for the given filePath. Takes into
     * account whether the file is part of a submodule and returns that repository
     * if necessary.
     *
     * @param {string} filePath - the path to the file in question.
     */
  }, {
    key: 'repoUtilForPath',
    value: function repoUtilForPath(filePath) {
      var _this2 = this;

      var submodules = this.repo.submodules;

      // By default, we return the root GitCommander repository.
      var repoUtil = this.tools.root;

      // if we have submodules, loop through them and see if the given file path
      // belongs inside one of the repositories. If so, we return the GitCommander repo
      // for that submodule.
      if (submodules) {
        (0, _lodash.each)(submodules, function (submodule, submodulePath) {
          var submoduleRegex = new RegExp('^' + submodulePath);
          if (submoduleRegex.test(filePath)) {
            repoUtil = _this2.tools[submodulePath];
          }
        });
      }

      return repoUtil;
    }

    /**
     * If the file path given is inside a submodule, removes the submodule
     * directory prefix.
     *
     * @param {string} filePath - path to file to relativize
     * @param {Repo} toolsRepo - git-tools Repo
     */
  }, {
    key: 'removeSubmodulePrefix',
    value: function removeSubmodulePrefix(filePath) {
      var trimmedFilePath = filePath;
      var submodules = this.repo.submodules;

      if (submodules) {
        (0, _lodash.each)(submodules, function (submodule, submodulePath) {
          var submoduleRegex = new RegExp('^' + submodulePath);
          if (submoduleRegex.test(trimmedFilePath)) {
            trimmedFilePath = filePath.replace(submoduleRegex, '');
          }
        });
      }

      // remove leading '/' if there is one before returning
      return trimmedFilePath.replace(/^\//, '');
    }
  }]);

  return Blamer;
})();

exports['default'] = Blamer;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3l1YW5zaGVuLy5hdG9tL3BhY2thZ2VzL2dpdC1ibGFtZS9saWIvdXRpbC9CbGFtZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztzQkFFaUMsUUFBUTs7NEJBQ2hCLGdCQUFnQjs7OztBQUh6QyxXQUFXLENBQUM7O0lBS1MsTUFBTTtBQUVkLFdBRlEsTUFBTSxDQUViLElBQUksRUFBRTswQkFGQyxNQUFNOztBQUd2QixRQUFJLENBQUMsSUFBSSxFQUFFO0FBQ1QsWUFBTSxJQUFJLEtBQUssQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDO0tBQ2pFO0FBQ0QsUUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7QUFDakIsUUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0dBQ25COzs7Ozs7O2VBUmtCLE1BQU07O1dBY2Ysc0JBQUc7OztBQUNYLFVBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ2hCLFVBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLDhCQUFpQixJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQzs7VUFFN0QsVUFBVSxHQUFJLElBQUksQ0FBQyxJQUFJLENBQXZCLFVBQVU7O0FBQ2pCLFVBQUksVUFBVSxFQUFFO0FBQ2QsMEJBQUssVUFBVSxFQUFFLFVBQUMsU0FBUyxFQUFFLGFBQWEsRUFBSztBQUM3QyxnQkFBSyxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsOEJBQW9CLE1BQUssSUFBSSxDQUFDLG1CQUFtQixFQUFFLFNBQUksYUFBYSxDQUFHLENBQUM7U0FDckcsQ0FBQyxDQUFDO09BQ0o7S0FDRjs7Ozs7Ozs7OztXQVFJLGVBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRTs7QUFFeEIsVUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDckQsVUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQzs7OztBQUl2RCxxQkFBZSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsQ0FBQzs7QUFFOUQsVUFBSSxDQUFDLHdCQUFXLFFBQVEsQ0FBQyxFQUFFO0FBQ3pCLGNBQU0sSUFBSSxLQUFLLENBQUMseUNBQXlDLENBQUMsQ0FBQztPQUM1RDs7O0FBR0QsY0FBUSxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsVUFBVSxHQUFHLEVBQUUsS0FBSyxFQUFFO0FBQ3BELGdCQUFRLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO09BQ3RCLENBQUMsQ0FBQztLQUNKOzs7Ozs7Ozs7OztXQVNjLHlCQUFDLFFBQVEsRUFBRTs7O1VBQ2pCLFVBQVUsR0FBSSxJQUFJLENBQUMsSUFBSSxDQUF2QixVQUFVOzs7QUFHakIsVUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7Ozs7O0FBSy9CLFVBQUksVUFBVSxFQUFFO0FBQ2QsMEJBQUssVUFBVSxFQUFFLFVBQUMsU0FBUyxFQUFFLGFBQWEsRUFBSztBQUM3QyxjQUFNLGNBQWMsR0FBRyxJQUFJLE1BQU0sT0FBSyxhQUFhLENBQUcsQ0FBQztBQUN2RCxjQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDakMsb0JBQVEsR0FBRyxPQUFLLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztXQUN0QztTQUNGLENBQUMsQ0FBQztPQUNKOztBQUVELGFBQU8sUUFBUSxDQUFDO0tBQ2pCOzs7Ozs7Ozs7OztXQVNvQiwrQkFBQyxRQUFRLEVBQUU7QUFDOUIsVUFBSSxlQUFlLEdBQUcsUUFBUSxDQUFDO1VBQ3hCLFVBQVUsR0FBSSxJQUFJLENBQUMsSUFBSSxDQUF2QixVQUFVOztBQUNqQixVQUFJLFVBQVUsRUFBRTtBQUNkLDBCQUFLLFVBQVUsRUFBRSxVQUFDLFNBQVMsRUFBRSxhQUFhLEVBQUs7QUFDN0MsY0FBTSxjQUFjLEdBQUcsSUFBSSxNQUFNLE9BQUssYUFBYSxDQUFHLENBQUM7QUFDdkQsY0FBSSxjQUFjLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxFQUFFO0FBQ3hDLDJCQUFlLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLENBQUM7V0FDeEQ7U0FDRixDQUFDLENBQUM7T0FDSjs7O0FBR0QsYUFBTyxlQUFlLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztLQUMzQzs7O1NBcEdrQixNQUFNOzs7cUJBQU4sTUFBTSIsImZpbGUiOiIvaG9tZS95dWFuc2hlbi8uYXRvbS9wYWNrYWdlcy9naXQtYmxhbWUvbGliL3V0aWwvQmxhbWVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG5cbmltcG9ydCB7IGlzRnVuY3Rpb24sIGVhY2ggfSBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IEdpdENvbW1hbmRlciBmcm9tICcuL0dpdENvbW1hbmRlcic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJsYW1lciB7XG5cbiAgY29uc3RydWN0b3IocmVwbykge1xuICAgIGlmICghcmVwbykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIGEgQmxhbWVyIHdpdGhvdXQgYSByZXBvc2l0b3J5LicpO1xuICAgIH1cbiAgICB0aGlzLnJlcG8gPSByZXBvO1xuICAgIHRoaXMuaW5pdGlhbGl6ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoaXMgQmxhbWVyIGluc3RhbmNlLCBieSBjcmVhdGluZyBnaXQtdG9vbHMgcmVwb3MgZm9yIHRoZSByb290XG4gICAqIHJlcG9zaXRvcnkgYW5kIHN1Ym1vZHVsZXMuXG4gICAqL1xuICBpbml0aWFsaXplKCkge1xuICAgIHRoaXMudG9vbHMgPSB7fTtcbiAgICB0aGlzLnRvb2xzLnJvb3QgPSBuZXcgR2l0Q29tbWFuZGVyKHRoaXMucmVwby5nZXRXb3JraW5nRGlyZWN0b3J5KCkpO1xuXG4gICAgY29uc3Qge3N1Ym1vZHVsZXN9ID0gdGhpcy5yZXBvO1xuICAgIGlmIChzdWJtb2R1bGVzKSB7XG4gICAgICBlYWNoKHN1Ym1vZHVsZXMsIChzdWJtb2R1bGUsIHN1Ym1vZHVsZVBhdGgpID0+IHtcbiAgICAgICAgdGhpcy50b29sc1tzdWJtb2R1bGVQYXRoXSA9IG5ldyBHaXRDb21tYW5kZXIoYCR7dGhpcy5yZXBvLmdldFdvcmtpbmdEaXJlY3RvcnkoKX0vJHtzdWJtb2R1bGVQYXRofWApO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEJsYW1lcyB0aGUgZ2l2ZW4gZmlsZVBhdGggYW5kIGNhbGxzIGNhbGxiYWNrIHdpdGggYmxhbWUgbGluZXMgb3IgZXJyb3IuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlUGF0aCAtIGZpbGVQYXRoIHRvIGJsYW1lXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gY2FsbGJhY2sgdG8gY2FsbCBiYWNrIHdpdGggYmxhbWUgZGF0YVxuICAgKi9cbiAgYmxhbWUoZmlsZVBhdGgsIGNhbGxiYWNrKSB7XG4gICAgLy8gRW5zdXJlIGZpbGUgcGF0aCBpcyByZWxhdGl2ZSB0byByb290IHJlcG9cbiAgICBsZXQgY2xlYW5lZEZpbGVQYXRoID0gdGhpcy5yZXBvLnJlbGF0aXZpemUoZmlsZVBhdGgpO1xuICAgIGNvbnN0IHJlcG9VdGlsID0gdGhpcy5yZXBvVXRpbEZvclBhdGgoY2xlYW5lZEZpbGVQYXRoKTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IGlmIHRoaXMgZmlsZSBpcyBpbiBhIHN1Ym1vZHVsZSwgd2UgcmVtb3ZlIHRoZSBzdWJtb2R1bGUgZGlyXG4gICAgLy8gZnJvbSB0aGUgcGF0aFxuICAgIGNsZWFuZWRGaWxlUGF0aCA9IHRoaXMucmVtb3ZlU3VibW9kdWxlUHJlZml4KGNsZWFuZWRGaWxlUGF0aCk7XG5cbiAgICBpZiAoIWlzRnVuY3Rpb24oY2FsbGJhY2spKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ011c3QgYmUgY2FsbGVkIHdpdGggYSBjYWxsYmFjayBmdW5jdGlvbicpO1xuICAgIH1cblxuICAgIC8vIE1ha2UgdGhlIGFzeW5jIGJsYW1lIGNhbGwgb24gdGhlIGdpdCByZXBvXG4gICAgcmVwb1V0aWwuYmxhbWUoY2xlYW5lZEZpbGVQYXRoLCBmdW5jdGlvbiAoZXJyLCBibGFtZSkge1xuICAgICAgY2FsbGJhY2soZXJyLCBibGFtZSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXRpbGl0eSB0byBnZXQgdGhlIEdpdENvbW1hbmRlciByZXBvc2l0b3J5IGZvciB0aGUgZ2l2ZW4gZmlsZVBhdGguIFRha2VzIGludG9cbiAgICogYWNjb3VudCB3aGV0aGVyIHRoZSBmaWxlIGlzIHBhcnQgb2YgYSBzdWJtb2R1bGUgYW5kIHJldHVybnMgdGhhdCByZXBvc2l0b3J5XG4gICAqIGlmIG5lY2Vzc2FyeS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVQYXRoIC0gdGhlIHBhdGggdG8gdGhlIGZpbGUgaW4gcXVlc3Rpb24uXG4gICAqL1xuICByZXBvVXRpbEZvclBhdGgoZmlsZVBhdGgpIHtcbiAgICBjb25zdCB7c3VibW9kdWxlc30gPSB0aGlzLnJlcG87XG5cbiAgICAvLyBCeSBkZWZhdWx0LCB3ZSByZXR1cm4gdGhlIHJvb3QgR2l0Q29tbWFuZGVyIHJlcG9zaXRvcnkuXG4gICAgbGV0IHJlcG9VdGlsID0gdGhpcy50b29scy5yb290O1xuXG4gICAgLy8gaWYgd2UgaGF2ZSBzdWJtb2R1bGVzLCBsb29wIHRocm91Z2ggdGhlbSBhbmQgc2VlIGlmIHRoZSBnaXZlbiBmaWxlIHBhdGhcbiAgICAvLyBiZWxvbmdzIGluc2lkZSBvbmUgb2YgdGhlIHJlcG9zaXRvcmllcy4gSWYgc28sIHdlIHJldHVybiB0aGUgR2l0Q29tbWFuZGVyIHJlcG9cbiAgICAvLyBmb3IgdGhhdCBzdWJtb2R1bGUuXG4gICAgaWYgKHN1Ym1vZHVsZXMpIHtcbiAgICAgIGVhY2goc3VibW9kdWxlcywgKHN1Ym1vZHVsZSwgc3VibW9kdWxlUGF0aCkgPT4ge1xuICAgICAgICBjb25zdCBzdWJtb2R1bGVSZWdleCA9IG5ldyBSZWdFeHAoYF4ke3N1Ym1vZHVsZVBhdGh9YCk7XG4gICAgICAgIGlmIChzdWJtb2R1bGVSZWdleC50ZXN0KGZpbGVQYXRoKSkge1xuICAgICAgICAgIHJlcG9VdGlsID0gdGhpcy50b29sc1tzdWJtb2R1bGVQYXRoXTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcG9VdGlsO1xuICB9XG5cbiAgLyoqXG4gICAqIElmIHRoZSBmaWxlIHBhdGggZ2l2ZW4gaXMgaW5zaWRlIGEgc3VibW9kdWxlLCByZW1vdmVzIHRoZSBzdWJtb2R1bGVcbiAgICogZGlyZWN0b3J5IHByZWZpeC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVQYXRoIC0gcGF0aCB0byBmaWxlIHRvIHJlbGF0aXZpemVcbiAgICogQHBhcmFtIHtSZXBvfSB0b29sc1JlcG8gLSBnaXQtdG9vbHMgUmVwb1xuICAgKi9cbiAgcmVtb3ZlU3VibW9kdWxlUHJlZml4KGZpbGVQYXRoKSB7XG4gICAgbGV0IHRyaW1tZWRGaWxlUGF0aCA9IGZpbGVQYXRoO1xuICAgIGNvbnN0IHtzdWJtb2R1bGVzfSA9IHRoaXMucmVwbztcbiAgICBpZiAoc3VibW9kdWxlcykge1xuICAgICAgZWFjaChzdWJtb2R1bGVzLCAoc3VibW9kdWxlLCBzdWJtb2R1bGVQYXRoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN1Ym1vZHVsZVJlZ2V4ID0gbmV3IFJlZ0V4cChgXiR7c3VibW9kdWxlUGF0aH1gKTtcbiAgICAgICAgaWYgKHN1Ym1vZHVsZVJlZ2V4LnRlc3QodHJpbW1lZEZpbGVQYXRoKSkge1xuICAgICAgICAgIHRyaW1tZWRGaWxlUGF0aCA9IGZpbGVQYXRoLnJlcGxhY2Uoc3VibW9kdWxlUmVnZXgsICcnKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gcmVtb3ZlIGxlYWRpbmcgJy8nIGlmIHRoZXJlIGlzIG9uZSBiZWZvcmUgcmV0dXJuaW5nXG4gICAgcmV0dXJuIHRyaW1tZWRGaWxlUGF0aC5yZXBsYWNlKC9eXFwvLywgJycpO1xuICB9XG5cbn1cbiJdfQ==