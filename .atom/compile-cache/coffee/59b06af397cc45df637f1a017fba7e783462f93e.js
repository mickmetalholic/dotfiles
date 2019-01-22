(function() {
  var CompositeDisposable, HighlightedAreaView;

  CompositeDisposable = require("atom").CompositeDisposable;

  HighlightedAreaView = require('./highlighted-area-view');

  module.exports = {
    config: {
      onlyHighlightWholeWords: {
        type: 'boolean',
        "default": true
      },
      hideHighlightOnSelectedWord: {
        type: 'boolean',
        "default": false
      },
      ignoreCase: {
        type: 'boolean',
        "default": false
      },
      lightTheme: {
        type: 'boolean',
        "default": false
      },
      highlightBackground: {
        type: 'boolean',
        "default": false
      },
      minimumLength: {
        type: 'integer',
        "default": 2
      },
      timeout: {
        type: 'integer',
        "default": 20,
        description: 'Defers searching for matching strings for X ms'
      },
      showInStatusBar: {
        type: 'boolean',
        "default": true,
        description: 'Show how many matches there are'
      },
      highlightInPanes: {
        type: 'boolean',
        "default": true,
        description: 'Highlight selection in another panes'
      },
      statusBarString: {
        type: 'string',
        "default": 'Highlighted: %c',
        description: 'The text to show in the status bar. %c = number of occurrences'
      },
      allowedCharactersToSelect: {
        type: 'string',
        "default": '$@%-',
        description: 'Non Word Characters that are allowed to be selected'
      },
      showResultsOnScrollBar: {
        type: 'boolean',
        "default": false,
        description: 'Show highlight on the scroll bar'
      }
    },
    areaView: null,
    activate: function(state) {
      this.areaView = new HighlightedAreaView();
      this.subscriptions = new CompositeDisposable;
      return this.subscriptions.add(atom.commands.add("atom-workspace", {
        'highlight-selected:toggle': (function(_this) {
          return function() {
            return _this.toggle();
          };
        })(this),
        'highlight-selected:select-all': (function(_this) {
          return function() {
            return _this.selectAll();
          };
        })(this)
      }));
    },
    deactivate: function() {
      var ref, ref1;
      if ((ref = this.areaView) != null) {
        ref.destroy();
      }
      this.areaView = null;
      if ((ref1 = this.subscriptions) != null) {
        ref1.dispose();
      }
      return this.subscriptions = null;
    },
    provideHighlightSelectedV1Deprecated: function() {
      return this.areaView;
    },
    provideHighlightSelectedV2: function() {
      return this.areaView;
    },
    consumeStatusBar: function(statusBar) {
      return this.areaView.setStatusBar(statusBar);
    },
    toggle: function() {
      if (this.areaView.disabled) {
        return this.areaView.enable();
      } else {
        return this.areaView.disable();
      }
    },
    selectAll: function() {
      return this.areaView.selectAll();
    },
    consumeScrollMarker: function(scrollMarkerAPI) {
      return this.areaView.setScrollMarker(scrollMarkerAPI);
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvaGlnaGxpZ2h0LXNlbGVjdGVkL2xpYi9oaWdobGlnaHQtc2VsZWN0ZWQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBQ3hCLG1CQUFBLEdBQXNCLE9BQUEsQ0FBUSx5QkFBUjs7RUFFdEIsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLE1BQUEsRUFDRTtNQUFBLHVCQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsSUFEVDtPQURGO01BR0EsMkJBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxTQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQURUO09BSkY7TUFNQSxVQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsS0FEVDtPQVBGO01BU0EsVUFBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFNBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEtBRFQ7T0FWRjtNQVlBLG1CQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsS0FEVDtPQWJGO01BZUEsYUFBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFNBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLENBRFQ7T0FoQkY7TUFrQkEsT0FBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFNBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEVBRFQ7UUFFQSxXQUFBLEVBQWEsZ0RBRmI7T0FuQkY7TUFzQkEsZUFBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFNBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLElBRFQ7UUFFQSxXQUFBLEVBQWEsaUNBRmI7T0F2QkY7TUEwQkEsZ0JBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxTQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxJQURUO1FBRUEsV0FBQSxFQUFhLHNDQUZiO09BM0JGO01BOEJBLGVBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxRQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxpQkFEVDtRQUVBLFdBQUEsRUFBYSxnRUFGYjtPQS9CRjtNQWtDQSx5QkFBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFFBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLE1BRFQ7UUFFQSxXQUFBLEVBQWEscURBRmI7T0FuQ0Y7TUFzQ0Esc0JBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxTQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQURUO1FBRUEsV0FBQSxFQUFhLGtDQUZiO09BdkNGO0tBREY7SUE0Q0EsUUFBQSxFQUFVLElBNUNWO0lBOENBLFFBQUEsRUFBVSxTQUFDLEtBQUQ7TUFDUixJQUFDLENBQUEsUUFBRCxHQUFZLElBQUksbUJBQUosQ0FBQTtNQUNaLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUk7YUFFckIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFDZjtRQUFBLDJCQUFBLEVBQTZCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLE1BQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE3QjtRQUNBLCtCQUFBLEVBQWlDLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLFNBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQURqQztPQURlLENBQW5CO0lBSlEsQ0E5Q1Y7SUFzREEsVUFBQSxFQUFZLFNBQUE7QUFDVixVQUFBOztXQUFTLENBQUUsT0FBWCxDQUFBOztNQUNBLElBQUMsQ0FBQSxRQUFELEdBQVk7O1lBQ0UsQ0FBRSxPQUFoQixDQUFBOzthQUNBLElBQUMsQ0FBQSxhQUFELEdBQWlCO0lBSlAsQ0F0RFo7SUE0REEsb0NBQUEsRUFBc0MsU0FBQTthQUFHLElBQUMsQ0FBQTtJQUFKLENBNUR0QztJQThEQSwwQkFBQSxFQUE0QixTQUFBO2FBQUcsSUFBQyxDQUFBO0lBQUosQ0E5RDVCO0lBZ0VBLGdCQUFBLEVBQWtCLFNBQUMsU0FBRDthQUNoQixJQUFDLENBQUEsUUFBUSxDQUFDLFlBQVYsQ0FBdUIsU0FBdkI7SUFEZ0IsQ0FoRWxCO0lBbUVBLE1BQUEsRUFBUSxTQUFBO01BQ04sSUFBRyxJQUFDLENBQUEsUUFBUSxDQUFDLFFBQWI7ZUFDRSxJQUFDLENBQUEsUUFBUSxDQUFDLE1BQVYsQ0FBQSxFQURGO09BQUEsTUFBQTtlQUdFLElBQUMsQ0FBQSxRQUFRLENBQUMsT0FBVixDQUFBLEVBSEY7O0lBRE0sQ0FuRVI7SUF5RUEsU0FBQSxFQUFXLFNBQUE7YUFDVCxJQUFDLENBQUEsUUFBUSxDQUFDLFNBQVYsQ0FBQTtJQURTLENBekVYO0lBNEVBLG1CQUFBLEVBQXFCLFNBQUMsZUFBRDthQUNuQixJQUFDLENBQUEsUUFBUSxDQUFDLGVBQVYsQ0FBMEIsZUFBMUI7SUFEbUIsQ0E1RXJCOztBQUpGIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSBcImF0b21cIlxuSGlnaGxpZ2h0ZWRBcmVhVmlldyA9IHJlcXVpcmUgJy4vaGlnaGxpZ2h0ZWQtYXJlYS12aWV3J1xuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGNvbmZpZzpcbiAgICBvbmx5SGlnaGxpZ2h0V2hvbGVXb3JkczpcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgIGhpZGVIaWdobGlnaHRPblNlbGVjdGVkV29yZDpcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICBpZ25vcmVDYXNlOlxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICBkZWZhdWx0OiBmYWxzZVxuICAgIGxpZ2h0VGhlbWU6XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgaGlnaGxpZ2h0QmFja2dyb3VuZDpcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICBtaW5pbXVtTGVuZ3RoOlxuICAgICAgdHlwZTogJ2ludGVnZXInXG4gICAgICBkZWZhdWx0OiAyXG4gICAgdGltZW91dDpcbiAgICAgIHR5cGU6ICdpbnRlZ2VyJ1xuICAgICAgZGVmYXVsdDogMjBcbiAgICAgIGRlc2NyaXB0aW9uOiAnRGVmZXJzIHNlYXJjaGluZyBmb3IgbWF0Y2hpbmcgc3RyaW5ncyBmb3IgWCBtcydcbiAgICBzaG93SW5TdGF0dXNCYXI6XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2hvdyBob3cgbWFueSBtYXRjaGVzIHRoZXJlIGFyZSdcbiAgICBoaWdobGlnaHRJblBhbmVzOlxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICBkZXNjcmlwdGlvbjogJ0hpZ2hsaWdodCBzZWxlY3Rpb24gaW4gYW5vdGhlciBwYW5lcydcbiAgICBzdGF0dXNCYXJTdHJpbmc6XG4gICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgZGVmYXVsdDogJ0hpZ2hsaWdodGVkOiAlYydcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIHRleHQgdG8gc2hvdyBpbiB0aGUgc3RhdHVzIGJhci4gJWMgPSBudW1iZXIgb2Ygb2NjdXJyZW5jZXMnXG4gICAgYWxsb3dlZENoYXJhY3RlcnNUb1NlbGVjdDpcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICBkZWZhdWx0OiAnJEAlLSdcbiAgICAgIGRlc2NyaXB0aW9uOiAnTm9uIFdvcmQgQ2hhcmFjdGVycyB0aGF0IGFyZSBhbGxvd2VkIHRvIGJlIHNlbGVjdGVkJ1xuICAgIHNob3dSZXN1bHRzT25TY3JvbGxCYXI6XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICBkZXNjcmlwdGlvbjogJ1Nob3cgaGlnaGxpZ2h0IG9uIHRoZSBzY3JvbGwgYmFyJ1xuXG4gIGFyZWFWaWV3OiBudWxsXG5cbiAgYWN0aXZhdGU6IChzdGF0ZSkgLT5cbiAgICBAYXJlYVZpZXcgPSBuZXcgSGlnaGxpZ2h0ZWRBcmVhVmlldygpXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkIFwiYXRvbS13b3Jrc3BhY2VcIixcbiAgICAgICAgJ2hpZ2hsaWdodC1zZWxlY3RlZDp0b2dnbGUnOiA9PiBAdG9nZ2xlKClcbiAgICAgICAgJ2hpZ2hsaWdodC1zZWxlY3RlZDpzZWxlY3QtYWxsJzogPT4gQHNlbGVjdEFsbCgpXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBAYXJlYVZpZXc/LmRlc3Ryb3koKVxuICAgIEBhcmVhVmlldyA9IG51bGxcbiAgICBAc3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBudWxsXG5cbiAgcHJvdmlkZUhpZ2hsaWdodFNlbGVjdGVkVjFEZXByZWNhdGVkOiAtPiBAYXJlYVZpZXdcblxuICBwcm92aWRlSGlnaGxpZ2h0U2VsZWN0ZWRWMjogLT4gQGFyZWFWaWV3XG5cbiAgY29uc3VtZVN0YXR1c0JhcjogKHN0YXR1c0JhcikgLT5cbiAgICBAYXJlYVZpZXcuc2V0U3RhdHVzQmFyIHN0YXR1c0JhclxuXG4gIHRvZ2dsZTogLT5cbiAgICBpZiBAYXJlYVZpZXcuZGlzYWJsZWRcbiAgICAgIEBhcmVhVmlldy5lbmFibGUoKVxuICAgIGVsc2VcbiAgICAgIEBhcmVhVmlldy5kaXNhYmxlKClcblxuICBzZWxlY3RBbGw6IC0+XG4gICAgQGFyZWFWaWV3LnNlbGVjdEFsbCgpXG5cbiAgY29uc3VtZVNjcm9sbE1hcmtlcjogKHNjcm9sbE1hcmtlckFQSSkgLT5cbiAgICBAYXJlYVZpZXcuc2V0U2Nyb2xsTWFya2VyIHNjcm9sbE1hcmtlckFQSVxuIl19
