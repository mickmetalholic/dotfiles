Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = BlameLine;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _localesStrings = require('../locales/strings');

var _localesStrings2 = _interopRequireDefault(_localesStrings);

'use babel';

var HASH_LENGTH = 7;
var colours = {};

function word(str, index) {
  var words = str.split(' ');
  return words[index < 0 ? words.length + index : index];
}

function stringToColour(str) {
  if (colours[str]) {
    return colours[str];
  }

  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    // eslint-disable-line no-plusplus
    hash = str.charCodeAt(i) + ((hash << 5) - hash); // eslint-disable-line no-bitwise
  }
  var colour = '#';
  for (var i = 0; i < 3; i++) {
    // eslint-disable-line no-plusplus
    var value = hash >> i * 8 & 0xFF; // eslint-disable-line no-bitwise
    colour += ('00' + value.toString(16)).substr(-2);
  }
  colours[str] = colour;
  return colour;
}

function copyText(str) {
  atom.clipboard.write(str);
  var messageString = _localesStrings2['default'].copiedToClipboard;
  var notif = atom.notifications.addSuccess(messageString, {
    dismissable: true
  });
  var timeout = setTimeout(function () {
    notif.dismiss();
  }, 3000);
  notif.onDidDismiss(function () {
    if (timeout) {
      clearTimeout(timeout);
    }
  });
}

function BlameLine(props) {
  var className = props.className;
  var hash = props.hash;
  var date = props.date;
  var author = props.author;
  var showFirstNames = props.showFirstNames;
  var showLastNames = props.showLastNames;
  var showHash = props.showHash;
  var viewCommitUrl = props.viewCommitUrl;
  var colorCommitAuthors = props.colorCommitAuthors;
  var copyHashOnClick = props.copyHashOnClick;

  var onClick = copyHashOnClick ? function () {
    return copyText(hash);
  } : null;
  var displayName = '';
  if (showFirstNames && showLastNames) {
    displayName = author;
  } else if (showFirstNames) {
    displayName = word(author, 0);
  } else {
    displayName = word(author, -1);
  }

  return _react2['default'].createElement(
    'div',
    { className: 'blame-line ' + className, style: { borderRight: colorCommitAuthors ? '2px solid ' + stringToColour(author) : 'none' } },
    _react2['default'].createElement(
      'a',
      { href: viewCommitUrl, onClick: onClick },
      showHash ? _react2['default'].createElement(
        'span',
        { className: 'hash' },
        hash.substring(0, HASH_LENGTH)
      ) : null,
      _react2['default'].createElement(
        'span',
        { className: 'date' },
        date
      ),
      _react2['default'].createElement(
        'span',
        { className: 'committer text-highlight' },
        displayName
      )
    )
  );
}

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3l1YW5zaGVuLy5hdG9tL3BhY2thZ2VzL2dpdC1ibGFtZS9saWIvY29tcG9uZW50cy9CbGFtZUxpbmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O3FCQTZDd0IsU0FBUzs7OztxQkEzQ2YsT0FBTzs7Ozs4QkFDTCxvQkFBb0I7Ozs7QUFIeEMsV0FBVyxDQUFDOztBQUtaLElBQU0sV0FBVyxHQUFHLENBQUMsQ0FBQztBQUN0QixJQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7O0FBRW5CLFNBQVMsSUFBSSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUU7QUFDeEIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM3QixTQUFPLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDO0NBQ3hEOztBQUVELFNBQVMsY0FBYyxDQUFDLEdBQUcsRUFBRTtBQUMzQixNQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtBQUNoQixXQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztHQUNyQjs7QUFFRCxNQUFJLElBQUksR0FBRyxDQUFDLENBQUM7QUFDYixPQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTs7QUFDbkMsUUFBSSxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFBLEdBQUksSUFBSSxDQUFBLEFBQUMsQ0FBQztHQUNqRDtBQUNELE1BQUksTUFBTSxHQUFHLEdBQUcsQ0FBQztBQUNqQixPQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFOztBQUMxQixRQUFJLEtBQUssR0FBRyxBQUFDLElBQUksSUFBSyxDQUFDLEdBQUcsQ0FBQyxBQUFDLEdBQUksSUFBSSxDQUFDO0FBQ3JDLFVBQU0sSUFBSSxRQUFNLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEVBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7R0FDbEQ7QUFDRCxTQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDO0FBQ3RCLFNBQU8sTUFBTSxDQUFDO0NBQ2Y7O0FBRUQsU0FBUyxRQUFRLENBQUMsR0FBRyxFQUFFO0FBQ3JCLE1BQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzFCLE1BQU0sYUFBYSxHQUFHLDRCQUFRLGlCQUFpQixDQUFDO0FBQ2hELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLGFBQWEsRUFBRTtBQUN6RCxlQUFXLEVBQUUsSUFBSTtHQUNsQixDQUFDLENBQUM7QUFDSCxNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsWUFBTTtBQUFFLFNBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztHQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDN0QsT0FBSyxDQUFDLFlBQVksQ0FBQyxZQUFNO0FBQ3ZCLFFBQUksT0FBTyxFQUFFO0FBQ1gsa0JBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUN2QjtHQUNGLENBQUMsQ0FBQztDQUNKOztBQUVjLFNBQVMsU0FBUyxDQUFDLEtBQUssRUFBRTtNQUVyQyxTQUFTLEdBVVAsS0FBSyxDQVZQLFNBQVM7TUFDVCxJQUFJLEdBU0YsS0FBSyxDQVRQLElBQUk7TUFDSixJQUFJLEdBUUYsS0FBSyxDQVJQLElBQUk7TUFDSixNQUFNLEdBT0osS0FBSyxDQVBQLE1BQU07TUFDTixjQUFjLEdBTVosS0FBSyxDQU5QLGNBQWM7TUFDZCxhQUFhLEdBS1gsS0FBSyxDQUxQLGFBQWE7TUFDYixRQUFRLEdBSU4sS0FBSyxDQUpQLFFBQVE7TUFDUixhQUFhLEdBR1gsS0FBSyxDQUhQLGFBQWE7TUFDYixrQkFBa0IsR0FFaEIsS0FBSyxDQUZQLGtCQUFrQjtNQUNsQixlQUFlLEdBQ2IsS0FBSyxDQURQLGVBQWU7O0FBRWpCLE1BQU0sT0FBTyxHQUFHLGVBQWUsR0FDN0IsWUFBTTtBQUFFLFdBQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0dBQUUsR0FDaEMsSUFBSSxDQUFDO0FBQ1AsTUFBSSxXQUFXLEdBQUcsRUFBRSxDQUFDO0FBQ3JCLE1BQUksY0FBYyxJQUFJLGFBQWEsRUFBRTtBQUNuQyxlQUFXLEdBQUcsTUFBTSxDQUFDO0dBQ3RCLE1BQU0sSUFBSSxjQUFjLEVBQUU7QUFDekIsZUFBVyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7R0FDL0IsTUFBTTtBQUNMLGVBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7R0FDaEM7O0FBRUQsU0FDRTs7TUFBSyxTQUFTLGtCQUFnQixTQUFTLEFBQUcsRUFBQyxLQUFLLEVBQUUsRUFBRSxXQUFXLEVBQUUsa0JBQWtCLGtCQUFnQixjQUFjLENBQUMsTUFBTSxDQUFDLEdBQUssTUFBTSxFQUFFLEFBQUM7SUFDckk7O1FBQUcsSUFBSSxFQUFFLGFBQWEsQUFBQyxFQUFDLE9BQU8sRUFBRSxPQUFPLEFBQUM7TUFDdEMsUUFBUSxHQUFHOztVQUFNLFNBQVMsRUFBQyxNQUFNO1FBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDO09BQVEsR0FBRyxJQUFJO01BQ2pGOztVQUFNLFNBQVMsRUFBQyxNQUFNO1FBQUUsSUFBSTtPQUFRO01BQ3BDOztVQUFNLFNBQVMsRUFBQywwQkFBMEI7UUFBRSxXQUFXO09BQVE7S0FDN0Q7R0FDQSxDQUNOO0NBQ0giLCJmaWxlIjoiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvZ2l0LWJsYW1lL2xpYi9jb21wb25lbnRzL0JsYW1lTGluZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHN0cmluZ3MgZnJvbSAnLi4vbG9jYWxlcy9zdHJpbmdzJztcblxuY29uc3QgSEFTSF9MRU5HVEggPSA3O1xuY29uc3QgY29sb3VycyA9IHt9O1xuXG5mdW5jdGlvbiB3b3JkKHN0ciwgaW5kZXgpIHtcbiAgY29uc3Qgd29yZHMgPSBzdHIuc3BsaXQoJyAnKTtcbiAgcmV0dXJuIHdvcmRzW2luZGV4IDwgMCA/IHdvcmRzLmxlbmd0aCArIGluZGV4IDogaW5kZXhdO1xufVxuXG5mdW5jdGlvbiBzdHJpbmdUb0NvbG91cihzdHIpIHtcbiAgaWYgKGNvbG91cnNbc3RyXSkge1xuICAgIHJldHVybiBjb2xvdXJzW3N0cl07XG4gIH1cblxuICBsZXQgaGFzaCA9IDA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7ICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXBsdXNwbHVzXG4gICAgaGFzaCA9IHN0ci5jaGFyQ29kZUF0KGkpICsgKChoYXNoIDw8IDUpIC0gaGFzaCk7ICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWJpdHdpc2VcbiAgfVxuICBsZXQgY29sb3VyID0gJyMnO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykgeyAgICAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wbHVzcGx1c1xuICAgIHZhciB2YWx1ZSA9IChoYXNoID4+IChpICogOCkpICYgMHhGRjsgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1iaXR3aXNlXG4gICAgY29sb3VyICs9IChgMDAke3ZhbHVlLnRvU3RyaW5nKDE2KX1gKS5zdWJzdHIoLTIpO1xuICB9XG4gIGNvbG91cnNbc3RyXSA9IGNvbG91cjtcbiAgcmV0dXJuIGNvbG91cjtcbn1cblxuZnVuY3Rpb24gY29weVRleHQoc3RyKSB7XG4gIGF0b20uY2xpcGJvYXJkLndyaXRlKHN0cik7XG4gIGNvbnN0IG1lc3NhZ2VTdHJpbmcgPSBzdHJpbmdzLmNvcGllZFRvQ2xpcGJvYXJkO1xuICBjb25zdCBub3RpZiA9IGF0b20ubm90aWZpY2F0aW9ucy5hZGRTdWNjZXNzKG1lc3NhZ2VTdHJpbmcsIHtcbiAgICBkaXNtaXNzYWJsZTogdHJ1ZSxcbiAgfSk7XG4gIGNvbnN0IHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHsgbm90aWYuZGlzbWlzcygpOyB9LCAzMDAwKTtcbiAgbm90aWYub25EaWREaXNtaXNzKCgpID0+IHtcbiAgICBpZiAodGltZW91dCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgIH1cbiAgfSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEJsYW1lTGluZShwcm9wcykge1xuICBjb25zdCB7XG4gICAgY2xhc3NOYW1lLFxuICAgIGhhc2gsXG4gICAgZGF0ZSxcbiAgICBhdXRob3IsXG4gICAgc2hvd0ZpcnN0TmFtZXMsXG4gICAgc2hvd0xhc3ROYW1lcyxcbiAgICBzaG93SGFzaCxcbiAgICB2aWV3Q29tbWl0VXJsLFxuICAgIGNvbG9yQ29tbWl0QXV0aG9ycyxcbiAgICBjb3B5SGFzaE9uQ2xpY2ssXG4gIH0gPSBwcm9wcztcbiAgY29uc3Qgb25DbGljayA9IGNvcHlIYXNoT25DbGljayA/XG4gICAgKCkgPT4geyByZXR1cm4gY29weVRleHQoaGFzaCk7IH0gOlxuICAgIG51bGw7XG4gIGxldCBkaXNwbGF5TmFtZSA9ICcnO1xuICBpZiAoc2hvd0ZpcnN0TmFtZXMgJiYgc2hvd0xhc3ROYW1lcykge1xuICAgIGRpc3BsYXlOYW1lID0gYXV0aG9yO1xuICB9IGVsc2UgaWYgKHNob3dGaXJzdE5hbWVzKSB7XG4gICAgZGlzcGxheU5hbWUgPSB3b3JkKGF1dGhvciwgMCk7XG4gIH0gZWxzZSB7XG4gICAgZGlzcGxheU5hbWUgPSB3b3JkKGF1dGhvciwgLTEpO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT17YGJsYW1lLWxpbmUgJHtjbGFzc05hbWV9YH0gc3R5bGU9e3sgYm9yZGVyUmlnaHQ6IGNvbG9yQ29tbWl0QXV0aG9ycyA/IGAycHggc29saWQgJHtzdHJpbmdUb0NvbG91cihhdXRob3IpfWAgOiAnbm9uZScgfX0+XG4gICAgICA8YSBocmVmPXt2aWV3Q29tbWl0VXJsfSBvbkNsaWNrPXtvbkNsaWNrfT5cbiAgICAgICAge3Nob3dIYXNoID8gPHNwYW4gY2xhc3NOYW1lPVwiaGFzaFwiPntoYXNoLnN1YnN0cmluZygwLCBIQVNIX0xFTkdUSCl9PC9zcGFuPiA6IG51bGx9XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImRhdGVcIj57ZGF0ZX08L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImNvbW1pdHRlciB0ZXh0LWhpZ2hsaWdodFwiPntkaXNwbGF5TmFtZX08L3NwYW4+XG4gICAgICA8L2E+XG4gICAgPC9kaXY+XG4gICk7XG59XG4iXX0=