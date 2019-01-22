(function() {
  var StatusBarView,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  module.exports = StatusBarView = (function() {
    function StatusBarView() {
      this.removeElement = bind(this.removeElement, this);
      this.getElement = bind(this.getElement, this);
      this.element = document.createElement('div');
      this.element.classList.add("highlight-selected-status", "inline-block");
    }

    StatusBarView.prototype.updateCount = function(count) {
      var statusBarString;
      statusBarString = atom.config.get("highlight-selected.statusBarString");
      this.element.textContent = statusBarString.replace("%c", count);
      if (count === 0) {
        return this.element.classList.add("highlight-selected-hidden");
      } else {
        return this.element.classList.remove("highlight-selected-hidden");
      }
    };

    StatusBarView.prototype.getElement = function() {
      return this.element;
    };

    StatusBarView.prototype.removeElement = function() {
      this.element.parentNode.removeChild(this.element);
      return this.element = null;
    };

    return StatusBarView;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvaGlnaGxpZ2h0LXNlbGVjdGVkL2xpYi9zdGF0dXMtYmFyLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxhQUFBO0lBQUE7O0VBQUEsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLHVCQUFBOzs7TUFDWCxJQUFDLENBQUEsT0FBRCxHQUFXLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCO01BQ1gsSUFBQyxDQUFBLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBbkIsQ0FBdUIsMkJBQXZCLEVBQW1ELGNBQW5EO0lBRlc7OzRCQUliLFdBQUEsR0FBYSxTQUFDLEtBQUQ7QUFDWCxVQUFBO01BQUEsZUFBQSxHQUFrQixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0Isb0NBQWhCO01BQ2xCLElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVCxHQUF1QixlQUFlLENBQUMsT0FBaEIsQ0FBd0IsSUFBeEIsRUFBOEIsS0FBOUI7TUFDdkIsSUFBRyxLQUFBLEtBQVMsQ0FBWjtlQUNFLElBQUMsQ0FBQSxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQW5CLENBQXVCLDJCQUF2QixFQURGO09BQUEsTUFBQTtlQUdFLElBQUMsQ0FBQSxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQW5CLENBQTBCLDJCQUExQixFQUhGOztJQUhXOzs0QkFRYixVQUFBLEdBQVksU0FBQTthQUNWLElBQUMsQ0FBQTtJQURTOzs0QkFHWixhQUFBLEdBQWUsU0FBQTtNQUNiLElBQUMsQ0FBQSxPQUFPLENBQUMsVUFBVSxDQUFDLFdBQXBCLENBQWdDLElBQUMsQ0FBQSxPQUFqQzthQUNBLElBQUMsQ0FBQSxPQUFELEdBQVc7SUFGRTs7Ozs7QUFqQmpCIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgU3RhdHVzQmFyVmlld1xuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2RpdidcbiAgICBAZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiaGlnaGxpZ2h0LXNlbGVjdGVkLXN0YXR1c1wiLFwiaW5saW5lLWJsb2NrXCIpXG5cbiAgdXBkYXRlQ291bnQ6IChjb3VudCkgLT5cbiAgICBzdGF0dXNCYXJTdHJpbmcgPSBhdG9tLmNvbmZpZy5nZXQoXCJoaWdobGlnaHQtc2VsZWN0ZWQuc3RhdHVzQmFyU3RyaW5nXCIpXG4gICAgQGVsZW1lbnQudGV4dENvbnRlbnQgPSBzdGF0dXNCYXJTdHJpbmcucmVwbGFjZShcIiVjXCIsIGNvdW50KVxuICAgIGlmIGNvdW50ID09IDBcbiAgICAgIEBlbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJoaWdobGlnaHQtc2VsZWN0ZWQtaGlkZGVuXCIpXG4gICAgZWxzZVxuICAgICAgQGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcImhpZ2hsaWdodC1zZWxlY3RlZC1oaWRkZW5cIilcblxuICBnZXRFbGVtZW50OiA9PlxuICAgIEBlbGVtZW50XG5cbiAgcmVtb3ZlRWxlbWVudDogPT5cbiAgICBAZWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKEBlbGVtZW50KVxuICAgIEBlbGVtZW50ID0gbnVsbFxuIl19
