Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _loophole = require('loophole');

var _loophole2 = _interopRequireDefault(_loophole);

var _controllersErrorController = require('../controllers/errorController');

'use babel';

var GITHUB_TEMPLATE = 'https://github.com/<%- project %>/<%- repo %>/commit/<%- revision %>';
var BITBUCKET_TEMPLATE = 'https://bitbucket.org/<%- project %>/<%- repo %>/commits/<%- revision %>';
var GITLAB_TEMPLATE = 'https://gitlab.com/<%- project %>/<%- repo %>/commit/<%- revision %>';

function safeTemplate(templateString) {
  return _loophole2['default'].allowUnsafeNewFunction(function () {
    return _lodash2['default'].template(templateString);
  });
}

var RemoteRevision = (function () {
  function RemoteRevision(remote, gitConfigRepositoryUrl) {
    _classCallCheck(this, RemoteRevision);

    this.remote = remote || '';
    this.gitConfigRepositoryUrl = gitConfigRepositoryUrl;
    this.initialize();
  }

  _createClass(RemoteRevision, [{
    key: 'initialize',
    value: function initialize() {
      var data = this.parseProjectAndRepo();
      if (data.project && data.repo) {
        this.project = data.project;
        this.repo = data.repo;
      } else if (this.remote !== '') {
        // we were unable to parse data from the remote...
        (0, _controllersErrorController.showError)('error-problem-parsing-data-from-remote');
      }
    }

    /**
     * Generates a URL for the given revision/commit identifier based on the parsed
     * remote data and the template.
     */
  }, {
    key: 'url',
    value: function url(revision) {
      var template = this.getTemplate();
      if (!template) {
        // this should be impossible, so throw
        throw new Error('No template present in RemoteRevision');
      }

      // we were unable to parse upon initialization...so return empty url
      if (!this.project || !this.repo || !revision) {
        return '';
      }

      // create data object used to render template string
      var data = {
        revision: revision,
        project: this.project,
        repo: this.repo
      };

      // return a rendered url
      return template(data);
    }

    /**
     * Parses project and repo from this.remote.
     *
     * @returns Object containing the project and repo.
     */
  }, {
    key: 'parseProjectAndRepo',
    value: function parseProjectAndRepo() {
      // strip off .git if its there
      var strippedRemoteUrl = this.remote.replace(/(\.git)$/, '');

      var pattern = /[:/]([.\w-]*)?\/?([.\w-]*)$/;
      var matches = strippedRemoteUrl.match(pattern);

      // if we have no matches just return empty object. caller should validate
      // data before using it.
      if (!matches) {
        return {};
      }

      // if no project is matched, project and repo are the same.
      return {
        project: matches[1],
        repo: matches[2] || matches[1]
      };
    }

    /**
     * Creates a template function using default GitHub / Bitbucket / GitLab
     * url templates or a custom url template strings specified in the configs.
     */
  }, {
    key: 'getTemplate',
    value: function getTemplate() {
      if (this.isGitHub()) {
        return safeTemplate(GITHUB_TEMPLATE);
      }

      if (this.isBitbucket()) {
        return safeTemplate(BITBUCKET_TEMPLATE);
      }

      if (this.isGitLab()) {
        return safeTemplate(GITLAB_TEMPLATE);
      }

      if (atom.config.get('git-blame.useCustomUrlTemplateIfStandardRemotesFail')) {
        if (this.gitConfigRepositoryUrl) {
          return safeTemplate(this.gitConfigRepositoryUrl);
        }

        var customUrlTemplate = atom.config.get('git-blame.customCommitUrlTemplateString');

        // if the user hasnt entered a template string, return nothing
        if (/^Example/.test(customUrlTemplate)) {
          return;
        }

        return safeTemplate(customUrlTemplate);
      }
    }

    /**
     * Returns true if this RemoteRevision represents a GitHub repository.
     */
  }, {
    key: 'isGitHub',
    value: function isGitHub() {
      return (/github.com/.test(this.remote)
      );
    }

    /**
     * Returns true if this RemoteRevision represents a Bitbucket repository.
     */
  }, {
    key: 'isBitbucket',
    value: function isBitbucket() {
      return (/bitbucket.org/.test(this.remote)
      );
    }

    /**
     * Returns true if this RemoteRevision represents a GitLab repository.
     */
  }, {
    key: 'isGitLab',
    value: function isGitLab() {
      return (/gitlab.com/.test(this.remote)
      );
    }
  }], [{
    key: 'create',
    value: function create(remoteUrl) {
      var rr = new RemoteRevision(remoteUrl);
      if (!rr.getTemplate()) {
        throw new Error('Cannot create RemoteRevision with invalid template');
      }
      return rr;
    }
  }]);

  return RemoteRevision;
})();

exports['default'] = RemoteRevision;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3l1YW5zaGVuLy5hdG9tL3BhY2thZ2VzL2dpdC1ibGFtZS9saWIvdXRpbC9SZW1vdGVSZXZpc2lvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O3NCQUVjLFFBQVE7Ozs7d0JBQ0QsVUFBVTs7OzswQ0FDTCxnQ0FBZ0M7O0FBSjFELFdBQVcsQ0FBQzs7QUFNWixJQUFNLGVBQWUsR0FBRyxzRUFBc0UsQ0FBQztBQUMvRixJQUFNLGtCQUFrQixHQUFHLDBFQUEwRSxDQUFDO0FBQ3RHLElBQU0sZUFBZSxHQUFHLHNFQUFzRSxDQUFDOztBQUUvRixTQUFTLFlBQVksQ0FBQyxjQUFjLEVBQUU7QUFDcEMsU0FBTyxzQkFBUyxzQkFBc0IsQ0FBQyxZQUFZO0FBQ2pELFdBQU8sb0JBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0dBQ25DLENBQUMsQ0FBQztDQUNKOztJQUVvQixjQUFjO0FBRXRCLFdBRlEsY0FBYyxDQUVyQixNQUFNLEVBQUUsc0JBQXNCLEVBQUU7MEJBRnpCLGNBQWM7O0FBRy9CLFFBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxJQUFJLEVBQUUsQ0FBQztBQUMzQixRQUFJLENBQUMsc0JBQXNCLEdBQUcsc0JBQXNCLENBQUM7QUFDckQsUUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0dBQ25COztlQU5rQixjQUFjOztXQWdCdkIsc0JBQUc7QUFDWCxVQUFNLElBQUksR0FBRyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztBQUN4QyxVQUFJLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLElBQUksRUFBRTtBQUM3QixZQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7QUFDNUIsWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO09BQ3ZCLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLEVBQUUsRUFBRTs7QUFFN0IsbURBQVUsd0NBQXdDLENBQUMsQ0FBQztP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U0Fka0IsY0FBYzs7O3FCQUFkLGNBQWMiLCJmaWxlIjoiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvZ2l0LWJsYW1lL2xpYi91dGlsL1JlbW90ZVJldmlzaW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG5cbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgbG9vcGhvbGUgZnJvbSAnbG9vcGhvbGUnO1xuaW1wb3J0IHsgc2hvd0Vycm9yIH0gZnJvbSAnLi4vY29udHJvbGxlcnMvZXJyb3JDb250cm9sbGVyJztcblxuY29uc3QgR0lUSFVCX1RFTVBMQVRFID0gJ2h0dHBzOi8vZ2l0aHViLmNvbS88JS0gcHJvamVjdCAlPi88JS0gcmVwbyAlPi9jb21taXQvPCUtIHJldmlzaW9uICU+JztcbmNvbnN0IEJJVEJVQ0tFVF9URU1QTEFURSA9ICdodHRwczovL2JpdGJ1Y2tldC5vcmcvPCUtIHByb2plY3QgJT4vPCUtIHJlcG8gJT4vY29tbWl0cy88JS0gcmV2aXNpb24gJT4nO1xuY29uc3QgR0lUTEFCX1RFTVBMQVRFID0gJ2h0dHBzOi8vZ2l0bGFiLmNvbS88JS0gcHJvamVjdCAlPi88JS0gcmVwbyAlPi9jb21taXQvPCUtIHJldmlzaW9uICU+JztcblxuZnVuY3Rpb24gc2FmZVRlbXBsYXRlKHRlbXBsYXRlU3RyaW5nKSB7XG4gIHJldHVybiBsb29waG9sZS5hbGxvd1Vuc2FmZU5ld0Z1bmN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gXy50ZW1wbGF0ZSh0ZW1wbGF0ZVN0cmluZyk7XG4gIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZW1vdGVSZXZpc2lvbiB7XG5cbiAgY29uc3RydWN0b3IocmVtb3RlLCBnaXRDb25maWdSZXBvc2l0b3J5VXJsKSB7XG4gICAgdGhpcy5yZW1vdGUgPSByZW1vdGUgfHwgJyc7XG4gICAgdGhpcy5naXRDb25maWdSZXBvc2l0b3J5VXJsID0gZ2l0Q29uZmlnUmVwb3NpdG9yeVVybDtcbiAgICB0aGlzLmluaXRpYWxpemUoKTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGUocmVtb3RlVXJsKSB7XG4gICAgY29uc3QgcnIgPSBuZXcgUmVtb3RlUmV2aXNpb24ocmVtb3RlVXJsKTtcbiAgICBpZiAoIXJyLmdldFRlbXBsYXRlKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSBSZW1vdGVSZXZpc2lvbiB3aXRoIGludmFsaWQgdGVtcGxhdGUnKTtcbiAgICB9XG4gICAgcmV0dXJuIHJyO1xuICB9XG5cbiAgaW5pdGlhbGl6ZSgpIHtcbiAgICBjb25zdCBkYXRhID0gdGhpcy5wYXJzZVByb2plY3RBbmRSZXBvKCk7XG4gICAgaWYgKGRhdGEucHJvamVjdCAmJiBkYXRhLnJlcG8pIHtcbiAgICAgIHRoaXMucHJvamVjdCA9IGRhdGEucHJvamVjdDtcbiAgICAgIHRoaXMucmVwbyA9IGRhdGEucmVwbztcbiAgICB9IGVsc2UgaWYgKHRoaXMucmVtb3RlICE9PSAnJykge1xuICAgICAgLy8gd2Ugd2VyZSB1bmFibGUgdG8gcGFyc2UgZGF0YSBmcm9tIHRoZSByZW1vdGUuLi5cbiAgICAgIHNob3dFcnJvcignZXJyb3ItcHJvYmxlbS1wYXJzaW5nLWRhdGEtZnJvbS1yZW1vdGUnKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGEgVVJMIGZvciB0aGUgZ2l2ZW4gcmV2aXNpb24vY29tbWl0IGlkZW50aWZpZXIgYmFzZWQgb24gdGhlIHBhcnNlZFxuICAgKiByZW1vdGUgZGF0YSBhbmQgdGhlIHRlbXBsYXRlLlxuICAgKi9cbiAgdXJsKHJldmlzaW9uKSB7XG4gICAgY29uc3QgdGVtcGxhdGUgPSB0aGlzLmdldFRlbXBsYXRlKCk7XG4gICAgaWYgKCF0ZW1wbGF0ZSkge1xuICAgICAgLy8gdGhpcyBzaG91bGQgYmUgaW1wb3NzaWJsZSwgc28gdGhyb3dcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gdGVtcGxhdGUgcHJlc2VudCBpbiBSZW1vdGVSZXZpc2lvbicpO1xuICAgIH1cblxuICAgIC8vIHdlIHdlcmUgdW5hYmxlIHRvIHBhcnNlIHVwb24gaW5pdGlhbGl6YXRpb24uLi5zbyByZXR1cm4gZW1wdHkgdXJsXG4gICAgaWYgKCF0aGlzLnByb2plY3QgfHwgIXRoaXMucmVwbyB8fCAhcmV2aXNpb24pIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICAvLyBjcmVhdGUgZGF0YSBvYmplY3QgdXNlZCB0byByZW5kZXIgdGVtcGxhdGUgc3RyaW5nXG4gICAgY29uc3QgZGF0YSA9IHtcbiAgICAgIHJldmlzaW9uOiByZXZpc2lvbixcbiAgICAgIHByb2plY3Q6IHRoaXMucHJvamVjdCxcbiAgICAgIHJlcG86IHRoaXMucmVwbyxcbiAgICB9O1xuXG4gICAgLy8gcmV0dXJuIGEgcmVuZGVyZWQgdXJsXG4gICAgcmV0dXJuIHRlbXBsYXRlKGRhdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlcyBwcm9qZWN0IGFuZCByZXBvIGZyb20gdGhpcy5yZW1vdGUuXG4gICAqXG4gICAqIEByZXR1cm5zIE9iamVjdCBjb250YWluaW5nIHRoZSBwcm9qZWN0IGFuZCByZXBvLlxuICAgKi9cbiAgcGFyc2VQcm9qZWN0QW5kUmVwbygpIHtcbiAgICAvLyBzdHJpcCBvZmYgLmdpdCBpZiBpdHMgdGhlcmVcbiAgICBjb25zdCBzdHJpcHBlZFJlbW90ZVVybCA9IHRoaXMucmVtb3RlLnJlcGxhY2UoLyhcXC5naXQpJC8sICcnKTtcblxuICAgIGNvbnN0IHBhdHRlcm4gPSAvWzovXShbLlxcdy1dKik/XFwvPyhbLlxcdy1dKikkLztcbiAgICBjb25zdCBtYXRjaGVzID0gc3RyaXBwZWRSZW1vdGVVcmwubWF0Y2gocGF0dGVybik7XG5cbiAgICAvLyBpZiB3ZSBoYXZlIG5vIG1hdGNoZXMganVzdCByZXR1cm4gZW1wdHkgb2JqZWN0LiBjYWxsZXIgc2hvdWxkIHZhbGlkYXRlXG4gICAgLy8gZGF0YSBiZWZvcmUgdXNpbmcgaXQuXG4gICAgaWYgKCFtYXRjaGVzKSB7XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuXG4gICAgLy8gaWYgbm8gcHJvamVjdCBpcyBtYXRjaGVkLCBwcm9qZWN0IGFuZCByZXBvIGFyZSB0aGUgc2FtZS5cbiAgICByZXR1cm4ge1xuICAgICAgcHJvamVjdDogbWF0Y2hlc1sxXSxcbiAgICAgIHJlcG86IG1hdGNoZXNbMl0gfHwgbWF0Y2hlc1sxXSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB0ZW1wbGF0ZSBmdW5jdGlvbiB1c2luZyBkZWZhdWx0IEdpdEh1YiAvIEJpdGJ1Y2tldCAvIEdpdExhYlxuICAgKiB1cmwgdGVtcGxhdGVzIG9yIGEgY3VzdG9tIHVybCB0ZW1wbGF0ZSBzdHJpbmdzIHNwZWNpZmllZCBpbiB0aGUgY29uZmlncy5cbiAgICovXG4gIGdldFRlbXBsYXRlKCkge1xuICAgIGlmICh0aGlzLmlzR2l0SHViKCkpIHtcbiAgICAgIHJldHVybiBzYWZlVGVtcGxhdGUoR0lUSFVCX1RFTVBMQVRFKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc0JpdGJ1Y2tldCgpKSB7XG4gICAgICByZXR1cm4gc2FmZVRlbXBsYXRlKEJJVEJVQ0tFVF9URU1QTEFURSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaXNHaXRMYWIoKSkge1xuICAgICAgcmV0dXJuIHNhZmVUZW1wbGF0ZShHSVRMQUJfVEVNUExBVEUpO1xuICAgIH1cblxuICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoJ2dpdC1ibGFtZS51c2VDdXN0b21VcmxUZW1wbGF0ZUlmU3RhbmRhcmRSZW1vdGVzRmFpbCcpKSB7XG4gICAgICBpZiAodGhpcy5naXRDb25maWdSZXBvc2l0b3J5VXJsKSB7XG4gICAgICAgIHJldHVybiBzYWZlVGVtcGxhdGUodGhpcy5naXRDb25maWdSZXBvc2l0b3J5VXJsKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY3VzdG9tVXJsVGVtcGxhdGUgPSBhdG9tLmNvbmZpZy5nZXQoJ2dpdC1ibGFtZS5jdXN0b21Db21taXRVcmxUZW1wbGF0ZVN0cmluZycpO1xuXG4gICAgICAvLyBpZiB0aGUgdXNlciBoYXNudCBlbnRlcmVkIGEgdGVtcGxhdGUgc3RyaW5nLCByZXR1cm4gbm90aGluZ1xuICAgICAgaWYgKC9eRXhhbXBsZS8udGVzdChjdXN0b21VcmxUZW1wbGF0ZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2FmZVRlbXBsYXRlKGN1c3RvbVVybFRlbXBsYXRlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0cnVlIGlmIHRoaXMgUmVtb3RlUmV2aXNpb24gcmVwcmVzZW50cyBhIEdpdEh1YiByZXBvc2l0b3J5LlxuICAgKi9cbiAgaXNHaXRIdWIoKSB7XG4gICAgcmV0dXJuIC9naXRodWIuY29tLy50ZXN0KHRoaXMucmVtb3RlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRydWUgaWYgdGhpcyBSZW1vdGVSZXZpc2lvbiByZXByZXNlbnRzIGEgQml0YnVja2V0IHJlcG9zaXRvcnkuXG4gICAqL1xuICBpc0JpdGJ1Y2tldCgpIHtcbiAgICByZXR1cm4gL2JpdGJ1Y2tldC5vcmcvLnRlc3QodGhpcy5yZW1vdGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0aGlzIFJlbW90ZVJldmlzaW9uIHJlcHJlc2VudHMgYSBHaXRMYWIgcmVwb3NpdG9yeS5cbiAgICovXG4gIGlzR2l0TGFiKCkge1xuICAgIHJldHVybiAvZ2l0bGFiLmNvbS8udGVzdCh0aGlzLnJlbW90ZSk7XG4gIH1cblxufVxuIl19