(function() {
  var CompositeDisposable, TabList, TabListView, TabSwitcher;

  CompositeDisposable = require('atom').CompositeDisposable;

  TabList = require('./tab-list');

  TabListView = require('./tab-list-view');

  TabSwitcher = {
    tabLists: new Map,
    currentList: function() {
      var pane;
      pane = atom.workspace.getActivePane();
      if (!pane) {
        return null;
      }
      if (!this.tabLists.has(pane)) {
        this.tabLists.set(pane, new TabList(pane));
        pane.onDidDestroy((function(_this) {
          return function() {
            return _this.tabLists["delete"](pane);
          };
        })(this));
      }
      return this.tabLists.get(pane);
    },
    destroyLists: function() {
      return this.tabLists.forEach(function(tabList, pane) {
        return tabList.destroy();
      });
    },
    serialize: function() {
      var panesState;
      panesState = atom.workspace.getPanes().map((function(_this) {
        return function(pane) {
          var tabList;
          tabList = _this.tabLists.get(pane);
          if (tabList) {
            return tabList.serialize();
          } else {
            return null;
          }
        };
      })(this));
      return {
        version: 1,
        panes: panesState
      };
    },
    deserialize: function(state) {
      this.deserializer = function() {
        var assignments, panes, panesState;
        if (state.version !== 1) {
          return;
        }
        panes = atom.workspace.getPanes();
        if (state.panes) {
          panesState = state.panes.filter((function(_this) {
            return function(x) {
              return x;
            };
          })(this));
          assignments = TabList.assignPanes(panes, panesState);
          return assignments.forEach((function(_this) {
            return function(data, paneId) {
              var pane;
              pane = panes.find(function(pane) {
                return pane.id === paneId;
              });
              return _this.tabLists.set(pane, new TabList(pane, data, state.version));
            };
          })(this));
        }
      };
      return this.deserializeWhenReady('deserialized');
    },
    deserializerEvents: new Set,
    deserializeWhenReady: function(event) {
      this.deserializerEvents.add(event);
      if (this.deserializerEvents.size === 2) {
        this.deserializerEvents["delete"]('deserialized');
        this.deserializer();
        return delete this.deserializer;
      }
    },
    updateAnimationDelay: function(delay) {
      return this.tabLists.forEach(function(tabList, id) {
        return tabList.updateAnimationDelay(delay);
      });
    }
  };

  module.exports = {
    config: {
      fadeInDelay: {
        type: 'number',
        "default": 0.1,
        title: 'Pause before displaying tab switcher, in seconds',
        description: 'Increasing this can reduce flicker when switching quickly.'
      },
      reorderTabs: {
        type: 'boolean',
        "default": false,
        title: 'Reorder tabs to match the list'
      }
    },
    activate: function(state) {
      this.disposable = new CompositeDisposable;
      this.disposable.add(atom.commands.add('atom-workspace', {
        'tab-switcher:next': function() {
          var ref;
          return (ref = TabSwitcher.currentList()) != null ? ref.next() : void 0;
        },
        'tab-switcher:previous': function() {
          var ref;
          return (ref = TabSwitcher.currentList()) != null ? ref.previous() : void 0;
        },
        'tab-switcher:select': function() {
          var ref;
          return (ref = TabSwitcher.currentList()) != null ? ref.select() : void 0;
        },
        'tab-switcher:cancel': function() {
          var ref;
          return (ref = TabSwitcher.currentList()) != null ? ref.cancel() : void 0;
        },
        'tab-switcher:save': function() {
          var ref;
          return (ref = TabSwitcher.currentList()) != null ? ref.saveCurrent() : void 0;
        },
        'tab-switcher:close': function() {
          var ref;
          return (ref = TabSwitcher.currentList()) != null ? ref.closeCurrent() : void 0;
        }
      }));
      if (state != null ? state.version : void 0) {
        TabSwitcher.deserialize(state);
      }
      return this.disposable.add(atom.config.observe('tab-switcher.fadeInDelay', function(value) {
        return TabSwitcher.updateAnimationDelay(value);
      }));
    },
    deactivate: function() {
      this.disposable.dispose();
      return TabSwitcher.destroyLists();
    },
    serialize: function() {
      return TabSwitcher.serialize();
    },
    currentList: function() {
      return TabSwitcher.currentList();
    },
    consumeElementIcons: function(f) {
      TabListView.addIcon = f;
      return TabSwitcher.deserializeWhenReady('servicesConsumed');
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvdGFiLXN3aXRjaGVyL2xpYi90YWItc3dpdGNoZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBQ3hCLE9BQUEsR0FBVSxPQUFBLENBQVEsWUFBUjs7RUFDVixXQUFBLEdBQWMsT0FBQSxDQUFRLGlCQUFSOztFQUVkLFdBQUEsR0FDRTtJQUFBLFFBQUEsRUFBVSxJQUFJLEdBQWQ7SUFFQSxXQUFBLEVBQWEsU0FBQTtBQUNYLFVBQUE7TUFBQSxJQUFBLEdBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFmLENBQUE7TUFDUCxJQUFlLENBQUksSUFBbkI7QUFBQSxlQUFPLEtBQVA7O01BRUEsSUFBRyxDQUFDLElBQUMsQ0FBQSxRQUFRLENBQUMsR0FBVixDQUFjLElBQWQsQ0FBSjtRQUNFLElBQUMsQ0FBQSxRQUFRLENBQUMsR0FBVixDQUFjLElBQWQsRUFBb0IsSUFBSSxPQUFKLENBQVksSUFBWixDQUFwQjtRQUNBLElBQUksQ0FBQyxZQUFMLENBQWtCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQ2hCLEtBQUMsQ0FBQSxRQUFRLEVBQUMsTUFBRCxFQUFULENBQWlCLElBQWpCO1VBRGdCO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFsQixFQUZGOztBQUtBLGFBQU8sSUFBQyxDQUFBLFFBQVEsQ0FBQyxHQUFWLENBQWMsSUFBZDtJQVRJLENBRmI7SUFhQSxZQUFBLEVBQWMsU0FBQTthQUNaLElBQUMsQ0FBQSxRQUFRLENBQUMsT0FBVixDQUFrQixTQUFDLE9BQUQsRUFBVSxJQUFWO2VBQ2hCLE9BQU8sQ0FBQyxPQUFSLENBQUE7TUFEZ0IsQ0FBbEI7SUFEWSxDQWJkO0lBaUJBLFNBQUEsRUFBVyxTQUFBO0FBQ1QsVUFBQTtNQUFBLFVBQUEsR0FBYSxJ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Q0FBQyxPQUFaLEdBQXNCO2FBQ3RCLFdBQVcsQ0FBQyxvQkFBWixDQUFpQyxrQkFBakM7SUFGbUIsQ0F0Q3JCOztBQTFERiIsInNvdXJjZXNDb250ZW50IjpbIntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5UYWJMaXN0ID0gcmVxdWlyZSAnLi90YWItbGlzdCdcblRhYkxpc3RWaWV3ID0gcmVxdWlyZSAnLi90YWItbGlzdC12aWV3J1xuXG5UYWJTd2l0Y2hlciA9XG4gIHRhYkxpc3RzOiBuZXcgTWFwXG5cbiAgY3VycmVudExpc3Q6IC0+XG4gICAgcGFuZSA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKVxuICAgIHJldHVybiBudWxsIGlmIG5vdCBwYW5lXG5cbiAgICBpZiAhQHRhYkxpc3RzLmhhcyhwYW5lKVxuICAgICAgQHRhYkxpc3RzLnNldChwYW5lLCBuZXcgVGFiTGlzdChwYW5lKSlcbiAgICAgIHBhbmUub25EaWREZXN0cm95ID0+XG4gICAgICAgIEB0YWJMaXN0cy5kZWxldGUocGFuZSlcblxuICAgIHJldHVybiBAdGFiTGlzdHMuZ2V0KHBhbmUpXG5cbiAgZGVzdHJveUxpc3RzOiAtPlxuICAgIEB0YWJMaXN0cy5mb3JFYWNoICh0YWJMaXN0LCBwYW5lKSAtPlxuICAgICAgdGFiTGlzdC5kZXN0cm95KClcblxuICBzZXJpYWxpemU6IC0+XG4gICAgcGFuZXNTdGF0ZSA9IGF0b20ud29ya3NwYWNlLmdldFBhbmVzKCkubWFwIChwYW5lKSA9PlxuICAgICAgdGFiTGlzdCA9IEB0YWJMaXN0cy5nZXQocGFuZSlcbiAgICAgIGlmIHRhYkxpc3QgdGhlbiB0YWJMaXN0LnNlcmlhbGl6ZSgpIGVsc2UgbnVsbFxuICAgIHt2ZXJzaW9uOiAxLCBwYW5lczogcGFuZXNTdGF0ZX1cblxuICBkZXNlcmlhbGl6ZTogKHN0YXRlKSAtPlxuICAgIHRoaXMuZGVzZXJpYWxpemVyID0gLT5cbiAgICAgIHJldHVybiBpZiBzdGF0ZS52ZXJzaW9uICE9IDFcbiAgICAgIHBhbmVzID0gYXRvbS53b3Jrc3BhY2UuZ2V0UGFuZXMoKVxuXG4gICAgICBpZiBzdGF0ZS5wYW5lc1xuICAgICAgICBwYW5lc1N0YXRlID0gc3RhdGUucGFuZXMuZmlsdGVyKCh4KSA9PiB4KVxuICAgICAgICBhc3NpZ25tZW50cyA9IFRhYkxpc3QuYXNzaWduUGFuZXMocGFuZXMsIHBhbmVzU3RhdGUpXG4gICAgICAgIGFzc2lnbm1lbnRzLmZvckVhY2ggKGRhdGEsIHBhbmVJZCkgPT5cbiAgICAgICAgICBwYW5lID0gcGFuZXMuZmluZCAocGFuZSkgLT4gcGFuZS5pZCA9PSBwYW5lSWRcbiAgICAgICAgICBAdGFiTGlzdHMuc2V0KHBhbmUsIG5ldyBUYWJMaXN0KHBhbmUsIGRhdGEsIHN0YXRlLnZlcnNpb24pKVxuXG4gICAgQGRlc2VyaWFsaXplV2hlblJlYWR5KCdkZXNlcmlhbGl6ZWQnKVxuXG4gIGRlc2VyaWFsaXplckV2ZW50czogbmV3IFNldFxuXG4gICMgV2UgbmVlZCB0byB3YWl0IHVudGlsIGJvdGggdGhlIGRlc2VyaWFsaXphdGlvbiBob29rIGlzIGNhbGxlZCBhbmQgdGhlXG4gICMgY29uc3VtZWQgc2VydmljZXMgYXJlIHJlYWR5LlxuICBkZXNlcmlhbGl6ZVdoZW5SZWFkeTogKGV2ZW50KSAtPlxuICAgIEBkZXNlcmlhbGl6ZXJFdmVudHMuYWRkKGV2ZW50KVxuICAgIGlmIEBkZXNlcmlhbGl6ZXJFdmVudHMuc2l6ZSA9PSAyXG4gICAgICBAZGVzZXJpYWxpemVyRXZlbnRzLmRlbGV0ZSgnZGVzZXJpYWxpemVkJylcbiAgICAgIEBkZXNlcmlhbGl6ZXIoKVxuICAgICAgZGVsZXRlIEBkZXNlcmlhbGl6ZXJcblxuICB1cGRhdGVBbmltYXRpb25EZWxheTogKGRlbGF5KSAtPlxuICAgIEB0YWJMaXN0cy5mb3JFYWNoICh0YWJMaXN0LCBpZCkgLT5cbiAgICAgIHRhYkxpc3QudXBkYXRlQW5pbWF0aW9uRGVsYXkoZGVsYXkpXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgY29uZmlnOlxuICAgIGZhZGVJbkRlbGF5OlxuICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICBkZWZhdWx0OiAwLjEsXG4gICAgICB0aXRsZTogJ1BhdXNlIGJlZm9yZSBkaXNwbGF5aW5nIHRhYiBzd2l0Y2hlciwgaW4gc2Vjb25kcydcbiAgICAgIGRlc2NyaXB0aW9uOiAnSW5jcmVhc2luZyB0aGlzIGNhbiByZWR1Y2UgZmxpY2tlciB3aGVuIHN3aXRjaGluZyBxdWlja2x5LidcbiAgICByZW9yZGVyVGFiczpcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgIHRpdGxlOiAnUmVvcmRlciB0YWJzIHRvIG1hdGNoIHRoZSBsaXN0J1xuXG4gIGFjdGl2YXRlOiAoc3RhdGUpIC0+XG4gICAgQGRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gICAgQGRpc3Bvc2FibGUuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsXG4gICAgICAndGFiLXN3aXRjaGVyOm5leHQnOiAtPiBUYWJTd2l0Y2hlci5jdXJyZW50TGlzdCgpPy5uZXh0KClcbiAgICAgICd0YWItc3dpdGNoZXI6cHJldmlvdXMnOiAtPiBUYWJTd2l0Y2hlci5jdXJyZW50TGlzdCgpPy5wcmV2aW91cygpXG4gICAgICAndGFiLXN3aXRjaGVyOnNlbGVjdCc6IC0+IFRhYlN3aXRjaGVyLmN1cnJlbnRMaXN0KCk/LnNlbGVjdCgpXG4gICAgICAndGFiLXN3aXRjaGVyOmNhbmNlbCc6IC0+IFRhYlN3aXRjaGVyLmN1cnJlbnRMaXN0KCk/LmNhbmNlbCgpXG4gICAgICAndGFiLXN3aXRjaGVyOnNhdmUnOiAtPiBUYWJTd2l0Y2hlci5jdXJyZW50TGlzdCgpPy5zYXZlQ3VycmVudCgpXG4gICAgICAndGFiLXN3aXRjaGVyOmNsb3NlJzogLT4gVGFiU3dpdGNoZXIuY3VycmVudExpc3QoKT8uY2xvc2VDdXJyZW50KClcblxuICAgIGlmIHN0YXRlPy52ZXJzaW9uXG4gICAgICBUYWJTd2l0Y2hlci5kZXNlcmlhbGl6ZShzdGF0ZSlcblxuICAgIEBkaXNwb3NhYmxlLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICd0YWItc3dpdGNoZXIuZmFkZUluRGVsYXknLCAodmFsdWUpIC0+XG4gICAgICBUYWJTd2l0Y2hlci51cGRhdGVBbmltYXRpb25EZWxheSh2YWx1ZSlcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBkaXNwb3NhYmxlLmRpc3Bvc2UoKVxuICAgIFRhYlN3aXRjaGVyLmRlc3Ryb3lMaXN0cygpXG5cbiAgc2VyaWFsaXplOiAtPlxuICAgIFRhYlN3aXRjaGVyLnNlcmlhbGl6ZSgpXG5cbiAgY3VycmVudExpc3Q6IC0+XG4gICAgVGFiU3dpdGNoZXIuY3VycmVudExpc3QoKVxuXG4gIGNvbnN1bWVFbGVtZW50SWNvbnM6IChmKSAtPlxuICAgIFRhYkxpc3RWaWV3LmFkZEljb24gPSBmXG4gICAgVGFiU3dpdGNoZXIuZGVzZXJpYWxpemVXaGVuUmVhZHkoJ3NlcnZpY2VzQ29uc3VtZWQnKVxuIl19
