Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _recompose = require('recompose');

'use babel';

function GutterResize(_ref) {
  var children = _ref.children;
  var onMouseDown = _ref.onMouseDown;

  return _react2['default'].createElement(
    'div',
    { className: 'resize-container' },
    children,
    _react2['default'].createElement('div', {
      className: 'resize',
      onMouseDown: onMouseDown,
      role: 'presentation'
    })
  );
}

exports['default'] = (0, _recompose.compose)((0, _recompose.withHandlers)({
  onMouseDown: function onMouseDown(_ref2) {
    var onResizeStart = _ref2.onResizeStart;

    return function (e) {
      return (0, _lodash.isFunction)(onResizeStart) && onResizeStart(e.nativeEvent);
    };
  }
}))(GutterResize);
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3l1YW5zaGVuLy5hdG9tL3BhY2thZ2VzL2dpdC1ibGFtZS9saWIvY29tcG9uZW50cy9HdXR0ZXJSZXNpemUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O3NCQUUyQixRQUFROztxQkFDakIsT0FBTzs7Ozt5QkFDYSxXQUFXOztBQUpqRCxXQUFXLENBQUM7O0FBTVosU0FBUyxZQUFZLENBQUMsSUFBdUIsRUFBRTtNQUF4QixRQUFRLEdBQVQsSUFBdUIsQ0FBdEIsUUFBUTtNQUFFLFdBQVcsR0FBdEIsSUFBdUIsQ0FBWixXQUFXOztBQUMxQyxTQUNFOztNQUFLLFNBQVMsRUFBQyxrQkFBa0I7SUFDOUIsUUFBUTtJQUNUO0FBQ0UsZUFBUyxFQUFDLFFBQVE7QUFDbEIsaUJBQVcsRUFBRSxXQUFXLEFBQUM7QUFDekIsVUFBSSxFQUFDLGNBQWM7TUFDbkI7R0FDRSxDQUNOO0NBQ0g7O3FCQUVjLHdCQUNiLDZCQUFhO0FBQ1gsYUFBVyxFQUFBLHFCQUFDLEtBQWlCLEVBQUU7UUFBakIsYUFBYSxHQUFmLEtBQWlCLENBQWYsYUFBYTs7QUFDekIsV0FBTyxVQUFVLENBQUMsRUFBRTtBQUNsQixhQUFPLHdCQUFXLGFBQWEsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUM7S0FDbEUsQ0FBQztHQUNIO0NBQ0YsQ0FBQyxDQUNILENBQUMsWUFBWSxDQUFDIiwiZmlsZSI6Ii9ob21lL3l1YW5zaGVuLy5hdG9tL3BhY2thZ2VzL2dpdC1ibGFtZS9saWIvY29tcG9uZW50cy9HdXR0ZXJSZXNpemUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcblxuaW1wb3J0IHsgaXNGdW5jdGlvbiB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgY29tcG9zZSwgd2l0aEhhbmRsZXJzIH0gZnJvbSAncmVjb21wb3NlJztcblxuZnVuY3Rpb24gR3V0dGVyUmVzaXplKHtjaGlsZHJlbiwgb25Nb3VzZURvd259KSB7XG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJyZXNpemUtY29udGFpbmVyXCI+XG4gICAgICB7Y2hpbGRyZW59XG4gICAgICA8ZGl2XG4gICAgICAgIGNsYXNzTmFtZT1cInJlc2l6ZVwiXG4gICAgICAgIG9uTW91c2VEb3duPXtvbk1vdXNlRG93bn1cbiAgICAgICAgcm9sZT1cInByZXNlbnRhdGlvblwiXG4gICAgICAvPlxuICAgIDwvZGl2PlxuICApO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjb21wb3NlKFxuICB3aXRoSGFuZGxlcnMoe1xuICAgIG9uTW91c2VEb3duKHsgb25SZXNpemVTdGFydCB9KSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgcmV0dXJuIGlzRnVuY3Rpb24ob25SZXNpemVTdGFydCkgJiYgb25SZXNpemVTdGFydChlLm5hdGl2ZUV2ZW50KTtcbiAgICAgIH07XG4gICAgfSxcbiAgfSlcbikoR3V0dGVyUmVzaXplKTtcbiJdfQ==