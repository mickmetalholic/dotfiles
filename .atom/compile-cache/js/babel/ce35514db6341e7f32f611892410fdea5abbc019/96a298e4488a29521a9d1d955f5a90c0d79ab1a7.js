'use babel';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = {
  useCustomUrlTemplateIfStandardRemotesFail: {
    type: 'boolean',
    'default': false
  },
  customCommitUrlTemplateString: {
    type: 'string',
    'default': 'Example -> https://github.com/<%- project %>/<%- repo %>/commit/<%- revision %>'
  },
  columnWidth: {
    type: 'integer',
    'default': 210
  },
  dateFormatString: {
    type: 'string',
    'default': 'YYYY-MM-DD'
  },
  gitBinaryPath: {
    type: 'string',
    'default': 'git'
  },
  ignoreWhiteSpaceDiffs: {
    type: 'boolean',
    'default': false
  },
  showFirstNames: {
    type: 'boolean',
    'default': true
  },
  showLastNames: {
    type: 'boolean',
    'default': true
  },
  showHash: {
    type: 'boolean',
    'default': true
  },
  colorCommitAuthors: {
    type: 'boolean',
    'default': false
  }
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3l1YW5zaGVuLy5hdG9tL3BhY2thZ2VzL2dpdC1ibGFtZS9saWIvY29uZmlnLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7cUJBRUc7QUFDYiwyQ0FBeUMsRUFBRTtBQUN6QyxRQUFJLEVBQUUsU0FBUztBQUNmLGVBQVMsS0FBSztHQUNmO0FBQ0QsK0JBQTZCLEVBQUU7QUFDN0IsUUFBSSxFQUFFLFFBQVE7QUFDZCxlQUFTLGlGQUFpRjtHQUMzRjtBQUNELGFBQVcsRUFBRTtBQUNYLFFBQUksRUFBRSxTQUFTO0FBQ2YsZUFBUyxHQUFHO0dBQ2I7QUFDRCxrQkFBZ0IsRUFBRTtBQUNoQixRQUFJLEVBQUUsUUFBUTtBQUNkLGVBQVMsWUFBWTtHQUN0QjtBQUNELGVBQWEsRUFBRTtBQUNiLFFBQUksRUFBRSxRQUFRO0FBQ2QsZUFBUyxLQUFLO0dBQ2Y7QUFDRCx1QkFBcUIsRUFBRTtBQUNyQixRQUFJLEVBQUUsU0FBUztBQUNmLGVBQVMsS0FBSztHQUNmO0FBQ0QsZ0JBQWMsRUFBRTtBQUNkLFFBQUksRUFBRSxTQUFTO0FBQ2YsZUFBUyxJQUFJO0dBQ2Q7QUFDRCxlQUFhLEVBQUU7QUFDYixRQUFJLEVBQUUsU0FBUztBQUNmLGVBQVMsSUFBSTtHQUNkO0FBQ0QsVUFBUSxFQUFFO0FBQ1IsUUFBSSxFQUFFLFNBQVM7QUFDZixlQUFTLElBQUk7R0FDZDtBQUNELG9CQUFrQixFQUFFO0FBQ2xCLFFBQUksRUFBRSxTQUFTO0FBQ2YsZUFBUyxLQUFLO0dBQ2Y7Q0FDRiIsImZpbGUiOiIvaG9tZS95dWFuc2hlbi8uYXRvbS9wYWNrYWdlcy9naXQtYmxhbWUvbGliL2NvbmZpZy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIHVzZUN1c3RvbVVybFRlbXBsYXRlSWZTdGFuZGFyZFJlbW90ZXNGYWlsOiB7XG4gICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgIGRlZmF1bHQ6IGZhbHNlLFxuICB9LFxuICBjdXN0b21Db21taXRVcmxUZW1wbGF0ZVN0cmluZzoge1xuICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgIGRlZmF1bHQ6ICdFeGFtcGxlIC0+IGh0dHBzOi8vZ2l0aHViLmNvbS88JS0gcHJvamVjdCAlPi88JS0gcmVwbyAlPi9jb21taXQvPCUtIHJldmlzaW9uICU+JyxcbiAgfSxcbiAgY29sdW1uV2lkdGg6IHtcbiAgICB0eXBlOiAnaW50ZWdlcicsXG4gICAgZGVmYXVsdDogMjEwLFxuICB9LFxuICBkYXRlRm9ybWF0U3RyaW5nOiB7XG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgZGVmYXVsdDogJ1lZWVktTU0tREQnLFxuICB9LFxuICBnaXRCaW5hcnlQYXRoOiB7XG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgZGVmYXVsdDogJ2dpdCcsXG4gIH0sXG4gIGlnbm9yZVdoaXRlU3BhY2VEaWZmczoge1xuICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICBkZWZhdWx0OiBmYWxzZSxcbiAgfSxcbiAgc2hvd0ZpcnN0TmFtZXM6IHtcbiAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgZGVmYXVsdDogdHJ1ZSxcbiAgfSxcbiAgc2hvd0xhc3ROYW1lczoge1xuICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICBkZWZhdWx0OiB0cnVlLFxuICB9LFxuICBzaG93SGFzaDoge1xuICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICBkZWZhdWx0OiB0cnVlLFxuICB9LFxuICBjb2xvckNvbW1pdEF1dGhvcnM6IHtcbiAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgZGVmYXVsdDogZmFsc2UsXG4gIH0sXG59O1xuIl19