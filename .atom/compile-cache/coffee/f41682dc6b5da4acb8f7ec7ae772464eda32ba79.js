(function() {
  var CompositeDisposable, TabList, TabListView, find;

  CompositeDisposable = require('atom').CompositeDisposable;

  TabListView = require('./tab-list-view');

  find = function(list, predicate) {
    var element, i, len;
    for (i = 0, len = list.length; i < len; i++) {
      element = list[i];
      if (predicate(element)) {
        return element;
      }
    }
    return null;
  };

  module.exports = TabList = (function() {
    function TabList(pane, data, version) {
      this.pane = pane;
      this.lastId = 0;
      this.tabs = this._buildTabs(pane.getItems(), data, version);
      this.currentIndex = null;
      this.view = new TabListView(this);
      this.disposable = new CompositeDisposable;
      this.disposable.add(this.pane.onDidDestroy((function(_this) {
        return function() {
          return _this.destroy;
        };
      })(this)));
      this.disposable.add(this.pane.onDidAddItem((function(_this) {
        return function(item) {
          var tab;
          tab = {
            id: _this.lastId += 1,
            item: item.item
          };
          _this.tabs.push(tab);
          return _this.view.tabAdded(tab);
        };
      })(this)));
      this.disposable.add(this.pane.onWillRemoveItem((function(_this) {
        return function(event) {
          var tab;
          if (_this.pane.getActiveItem() === event.item) {
            tab = find(_this.tabs, function(tab) {
              return tab.item !== event.item;
            });
            if (tab) {
              return _this.pane.activateItem(tab.item);
            }
          }
        };
      })(this)));
      this.disposable.add(this.pane.onDidRemoveItem((function(_this) {
        return function(item) {
          var index;
          index = _this._findItemIndex(item.item);
          if (index === null) {
            return;
          }
          return _this._removeTabAtIndex(index);
        };
      })(this)));
      this.disposable.add(this.pane.observeActiveItem((function(_this) {
        return function(item) {
          var moveTab;
          _this._moveItemToFront(item);
          moveTab = function() {
            if (atom.config.get('tab-switcher.reorderTabs')) {
              return _this.pane.moveItem(item, 0);
            }
          };
          return setTimeout(moveTab, 0);
        };
      })(this)));
      this.disposable.add(this.pane.observeItems((function(_this) {
        return function(item) {
          if (!item.onDidChangeTitle) {
            return;
          }
          return _this.disposable.add(item.onDidChangeTitle(function() {
            var tab;
            tab = find(_this.tabs, function(tab) {
              return tab.item === item;
            });
            return _this.view.tabUpdated(tab);
          }));
        };
      })(this)));
    }

    TabList.prototype.updateAnimationDelay = function(delay) {
      return this.view.updateAnimationDelay(delay);
    };

    TabList.prototype._buildTabs = function(items, data, version) {
      var newTabs, ordering, tabs, titleOrder;
      tabs = items.map((function(_this) {
        return function(item) {
          return {
            id: _this.lastId += 1,
            item: item
          };
        };
      })(this));
      if (data) {
        titleOrder = data.tabs.map(function(item) {
          return item.title;
        });
        newTabs = 0;
        ordering = tabs.map(function(tab, index) {
          var base, key;
          key = titleOrder.indexOf((typeof (base = tab.item).getTitle === "function" ? base.getTitle() : void 0) || null);
          if (key === -1) {
            key = titleOrder.length + newTabs;
            newTabs += 1;
          }
          return {
            tab: tab,
            key: key
          };
        });
        tabs = ordering.sort(function(a, b) {
          return a.key - b.key;
        }).map(function(o) {
          return o.tab;
        });
      }
      return tabs;
    };

    TabList.prototype.destroy = function() {
      this.pane = null;
      this.tabs = [];
      this.disposable.dispose();
      return this.view.destroy();
    };

    TabList.prototype.serialize = function() {
      return {
        tabs: this.tabs.map(function(tab) {
          var base;
          return {
            title: (typeof (base = tab.item).getTitle === "function" ? base.getTitle() : void 0) || null
          };
        })
      };
    };

    TabList.prototype.next = function() {
      var index, ref;
      if (this.tabs.length === 0) {
        this._setCurrentIndex(null);
      } else {
        index = ((ref = this.currentIndex) != null ? ref : 0) + 1;
        if (index >= this.tabs.length) {
          index -= this.tabs.length;
        }
        this._setCurrentIndex(index);
      }
      return this._start();
    };

    TabList.prototype.previous = function() {
      var index, ref;
      if (this.tabs.length === 0) {
        this._setCurrentIndex(null);
      } else {
        index = ((ref = this.currentIndex) != null ? ref : 0) - 1;
        if (index < 0) {
          index += this.tabs.length;
        }
        this._setCurrentIndex(index);
      }
      return this._start();
    };

    TabList.prototype.setCurrentId = function(id) {
      var index;
      index = this.tabs.map(function(tab) {
        return tab.id;
      }).indexOf(id);
      if (index === -1) {
        return;
      }
      return this._setCurrentIndex(index);
    };

    TabList.prototype.saveCurrent = function() {
      var base, tab;
      tab = this.tabs[this.currentIndex];
      if (tab === void 0) {
        return;
      }
      return typeof (base = tab.item).save === "function" ? base.save() : void 0;
    };

    TabList.prototype.closeCurrent = function() {
      var tab;
      tab = this.tabs[this.currentIndex];
      if (tab === void 0) {
        return;
      }
      return this.pane.removeItem(tab.item);
    };

    TabList.prototype._moveItemToFront = function(item) {
      var index, tabs;
      index = this._findItemIndex(item);
      if (index !== null) {
        tabs = this.tabs.splice(index, 1);
        this.tabs.unshift(tabs[0]);
        return this.view.tabsReordered();
      }
    };

    TabList.prototype._findItemIndex = function(item) {
      var i, index, len, ref, tab;
      ref = this.tabs;
      for (index = i = 0, len = ref.length; i < len; index = ++i) {
        tab = ref[index];
        if (tab.item === item) {
          return index;
        }
      }
      return null;
    };

    TabList.prototype._removeTabAtIndex = function(index) {
      var newCurrentIndex, removed;
      if (index === this.currentIndex) {
        if (index === this.tabs.length - 1) {
          newCurrentIndex = index === 0 ? null : this.currentIndex - 1;
        } else {
          newCurrentIndex = this.currentIndex;
        }
      } else if (index < this.currentIndex) {
        newCurrentIndex = this.currentIndex - 1;
      }
      removed = this.tabs.splice(index, 1);
      this.view.tabRemoved(removed[0]);
      if (newCurrentIndex !== null) {
        return this._setCurrentIndex(newCurrentIndex);
      }
    };

    TabList.prototype._start = function(item) {
      if (!this.switching) {
        this.switching = true;
        return this.view.show();
      }
    };

    TabList.prototype._setCurrentIndex = function(index) {
      if (index === null) {
        this.currentIndex = null;
        return this.view.currentTabChanged(null);
      } else {
        this.currentIndex = index;
        return this.view.currentTabChanged(this.tabs[index]);
      }
    };

    TabList.prototype.select = function() {
      var ref;
      if (this.switching) {
        this.switching = false;
        if (this.currentIndex !== null) {
          if ((0 <= (ref = this.currentIndex) && ref < this.tabs.length)) {
            this.pane.activateItem(this.tabs[this.currentIndex].item);
            this.pane.activate();
          }
          this.currentIndex = null;
          this.view.currentTabChanged(null);
        }
        return this.view.hide();
      }
    };

    TabList.prototype.cancel = function() {
      if (this.switching) {
        this.switching = false;
        if (this.currentIndex !== null) {
          this.currentIndex = null;
          this.view.currentTabChanged(null);
        }
      }
      this.pane.activate();
      return this.view.hide();
    };

    TabList.assignPanes = function(panes, data) {
      var assignedLists, assignedPanes, entry, i, index, item, j, jaccard, k, len, len1, len2, listData, listTitles, pane, paneTitles, score, scores, sortedScores, tab;
      paneTitles = new Map;
      for (i = 0, len = panes.length; i < len; i++) {
        pane = panes[i];
        paneTitles.set(pane, new Set((function() {
          var j, len1, ref, results;
          ref = pane.getItems();
          results = [];
          for (j = 0, len1 = ref.length; j < len1; j++) {
            item = ref[j];
            results.push(item.getTitle());
          }
          return results;
        })()));
      }
      listTitles = new Map;
      for (index = j = 0, len1 = data.length; j < len1; index = ++j) {
        listData = data[index];
        listTitles.set(listData, new Set((function() {
          var k, len2, ref, results;
          ref = listData.tabs;
          results = [];
          for (k = 0, len2 = ref.length; k < len2; k++) {
            tab = ref[k];
            results.push(tab.title);
          }
          return results;
        })()));
      }
      jaccard = function(set1, set2) {
        var in_both, in_one;
        if (set1.size === 0 || set2.size === 0) {
          return 0;
        }
        in_one = 0;
        in_both = 0;
        set1.forEach(function(element) {
          if (set2.has(element)) {
            return in_both += 1;
          } else {
            return in_one += 1;
          }
        });
        set2.forEach(function(element) {
          if (!set1.has(element)) {
            return in_one += 1;
          }
        });
        return in_both / (in_both + in_one);
      };
      scores = data.map(function(listData, listIndex) {
        return panes.map(function(pane) {
          return [jaccard(paneTitles.get(pane), listTitles.get(listData)), listData, pane];
        });
      });
      sortedScores = scores.reduce(((function(_this) {
        return function(a, b) {
          return a.concat(b);
        };
      })(this)), []).sort(function(a, b) {
        return b[0] - a[0];
      });
      assignedPanes = new Map;
      assignedLists = new Set;
      for (k = 0, len2 = sortedScores.length; k < len2; k++) {
        entry = sortedScores[k];
        score = entry[0], listData = entry[1], pane = entry[2];
        if (!(score < 0.5 || assignedPanes.has(pane.id) || assignedLists.has(listData))) {
          assignedPanes.set(pane.id, listData);
          assignedLists.add(listData);
        }
      }
      return assignedPanes;
    };

    return TabList;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvdGFiLXN3aXRjaGVyL2xpYi90YWItbGlzdC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFDLHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFDeEIsV0FBQSxHQUFjLE9BQUEsQ0FBUSxpQkFBUjs7RUFFZCxJQUFBLEdBQU8sU0FBQyxJQUFELEVBQU8sU0FBUDtBQUNMLFFBQUE7QUFBQSxTQUFBLHNDQUFBOztNQUNFLElBQWtCLFNBQUEsQ0FBVSxPQUFWLENBQWxCO0FBQUEsZUFBTyxRQUFQOztBQURGO1dBRUE7RUFISzs7RUFLUCxNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ1MsaUJBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxPQUFiO01BQ1gsSUFBQyxDQUFBLElBQUQsR0FBUTtNQUNSLElBQUMsQ0FBQSxNQUFELEdBQVU7TUFDVixJQUFDLENBQUEsSUFBRCxHQUFRLElBQUMsQ0FBQSxVQUFELENBQVksSUFBSSxDQUFDLFFBQUwsQ0FBQSxDQUFaLEVBQTZCLElBQTdCLEVBQW1DLE9BQW5DO01BQ1IsSUFBQyxDQUFBLFlBQUQsR0FBZ0I7TUFDaEIsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFJLFdBQUosQ0FBZ0IsSUFBaEI7TUFDUixJQUFDLENBQUEsVUFBRCxHQUFjLElBQUk7TUFFbEIsSUFBQyxDQUFBLFVBQVUsQ0FBQyxHQUFaLENBQWdCLElBQUMsQ0FBQSxJQUFJLENBQUMsWUFBTixDQUFtQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQ2pDLEtBQUMsQ0FBQTtRQURnQztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBbkIsQ0FBaEI7TUFHQSxJQUFDLENBQUEsVUFBVSxDQUFDLEdBQVosQ0FBZ0IsSUFBQyxDQUFBLElBQUksQ0FBQyxZQUFOLENBQW1CLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxJQUFE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O01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFELENBQWQsRUFBdUMsRUFBdkMsQ0FBMEMsQ0FBQyxJQUEzQyxDQUFnRCxTQUFDLENBQUQsRUFBSSxDQUFKO2VBQVUsQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFPLENBQUUsQ0FBQSxDQUFBO01BQW5CLENBQWhEO01BRWYsYUFBQSxHQUFnQixJQUFJO01BQ3BCLGFBQUEsR0FBZ0IsSUFBSTtBQUNwQixXQUFBLGdEQUFBOztRQUNHLGdCQUFELEVBQVEsbUJBQVIsRUFBa0I7UUFDbEIsSUFBQSxDQUFBLENBQU8sS0FBQSxHQUFRLEdBQVIsSUFBZSxhQUFhLENBQUMsR0FBZCxDQUFrQixJQUFJLENBQUMsRUFBdkIsQ0FBZixJQUE2QyxhQUFhLENBQUMsR0FBZCxDQUFrQixRQUFsQixDQUFwRCxDQUFBO1VBQ0UsYUFBYSxDQUFDLEdBQWQsQ0FBa0IsSUFBSSxDQUFDLEVBQXZCLEVBQTJCLFFBQTNCO1VBQ0EsYUFBYSxDQUFDLEdBQWQsQ0FBa0IsUUFBbEIsRUFGRjs7QUFGRjthQU1BO0lBaENZOzs7OztBQTdLaEIiLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuVGFiTGlzdFZpZXcgPSByZXF1aXJlICcuL3RhYi1saXN0LXZpZXcnXG5cbmZpbmQgPSAobGlzdCwgcHJlZGljYXRlKSAtPlxuICBmb3IgZWxlbWVudCBpbiBsaXN0XG4gICAgcmV0dXJuIGVsZW1lbnQgaWYgcHJlZGljYXRlKGVsZW1lbnQpXG4gIG51bGxcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgVGFiTGlzdFxuICBjb25zdHJ1Y3RvcjogKHBhbmUsIGRhdGEsIHZlcnNpb24pIC0+XG4gICAgQHBhbmUgPSBwYW5lXG4gICAgQGxhc3RJZCA9IDBcbiAgICBAdGFicyA9IEBfYnVpbGRUYWJzKHBhbmUuZ2V0SXRlbXMoKSwgZGF0YSwgdmVyc2lvbilcbiAgICBAY3VycmVudEluZGV4ID0gbnVsbFxuICAgIEB2aWV3ID0gbmV3IFRhYkxpc3RWaWV3KEApXG4gICAgQGRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gICAgQGRpc3Bvc2FibGUuYWRkIEBwYW5lLm9uRGlkRGVzdHJveSA9PlxuICAgICAgQGRlc3Ryb3lcblxuICAgIEBkaXNwb3NhYmxlLmFkZCBAcGFuZS5vbkRpZEFkZEl0ZW0gKGl0ZW0pID0+XG4gICAgICB0YWIgPSB7aWQ6IEBsYXN0SWQgKz0gMSwgaXRlbTogaXRlbS5pdGVtfVxuICAgICAgQHRhYnMucHVzaCh0YWIpXG4gICAgICBAdmlldy50YWJBZGRlZCh0YWIpXG5cbiAgICBAZGlzcG9zYWJsZS5hZGQgQHBhbmUub25XaWxsUmVtb3ZlSXRlbSAoZXZlbnQpID0+XG4gICAgICBpZiBAcGFuZS5nZXRBY3RpdmVJdGVtKCkgaXMgZXZlbnQuaXRlbVxuICAgICAgICB0YWIgPSBmaW5kIEB0YWJzLCAodGFiKSAtPiB0YWIuaXRlbSBpc250IGV2ZW50Lml0ZW1cbiAgICAgICAgaWYgdGFiXG4gICAgICAgICAgQHBhbmUuYWN0aXZhdGVJdGVtKHRhYi5pdGVtKVxuXG4gICAgQGRpc3Bvc2FibGUuYWRkIEBwYW5lLm9uRGlkUmVtb3ZlSXRlbSAoaXRlbSkgPT5cbiAgICAgIGluZGV4ID0gQF9maW5kSXRlbUluZGV4KGl0ZW0uaXRlbSlcbiAgICAgIHJldHVybiBpZiBpbmRleCBpcyBudWxsXG4gICAgICBAX3JlbW92ZVRhYkF0SW5kZXgoaW5kZXgpXG5cbiAgICBAZGlzcG9zYWJsZS5hZGQgQHBhbmUub2JzZXJ2ZUFjdGl2ZUl0ZW0gKGl0ZW0pID0+XG4gICAgICBAX21vdmVJdGVtVG9Gcm9udChpdGVtKVxuICAgICAgIyBBdG9tIHJlbGllcyBvbiB0YWIgaW5kaWNlcyBub3QgY2hhbmdpbmcgZHVyaW5nIHRoaXMgaG9vaywgc28gd2UgbmVlZCB0b1xuICAgICAgIyBkZWxheSB0aGlzLiAoIzM5KVxuICAgICAgbW92ZVRhYiA9ID0+XG4gICAgICAgIGlmIGF0b20uY29uZmlnLmdldCAndGFiLXN3aXRjaGVyLnJlb3JkZXJUYWJzJ1xuICAgICAgICAgIEBwYW5lLm1vdmVJdGVtKGl0ZW0sIDApXG4gICAgICBzZXRUaW1lb3V0KG1vdmVUYWIsIDApXG5cbiAgICBAZGlzcG9zYWJsZS5hZGQgQHBhbmUub2JzZXJ2ZUl0ZW1zIChpdGVtKSA9PlxuICAgICAgcmV0dXJuIGlmICFpdGVtLm9uRGlkQ2hhbmdlVGl0bGVcbiAgICAgIEBkaXNwb3NhYmxlLmFkZCBpdGVtLm9uRGlkQ2hhbmdlVGl0bGUgPT5cbiAgICAgICAgdGFiID0gZmluZCBAdGFicywgKHRhYikgLT4gdGFiLml0ZW0gaXMgaXRlbVxuICAgICAgICBAdmlldy50YWJVcGRhdGVkKHRhYilcblxuICB1cGRhdGVBbmltYXRpb25EZWxheTogKGRlbGF5KSAtPlxuICAgIEB2aWV3LnVwZGF0ZUFuaW1hdGlvbkRlbGF5KGRlbGF5KVxuXG4gIF9idWlsZFRhYnM6IChpdGVtcywgZGF0YSwgdmVyc2lvbikgLT5cbiAgICB0YWJzID0gaXRlbXMubWFwIChpdGVtKSA9PiB7aWQ6IEBsYXN0SWQgKz0gMSwgaXRlbTogaXRlbX1cbiAgICBpZiBkYXRhXG4gICAgICB0aXRsZU9yZGVyID0gZGF0YS50YWJzLm1hcCAoaXRlbSkgLT4gaXRlbS50aXRsZVxuICAgICAgbmV3VGFicyA9IDBcbiAgICAgIG9yZGVyaW5nID0gdGFicy5tYXAgKHRhYiwgaW5kZXgpIC0+XG4gICAgICAgIGtleSA9IHRpdGxlT3JkZXIuaW5kZXhPZih0YWIuaXRlbS5nZXRUaXRsZT8oKSBvciBudWxsKVxuICAgICAgICBpZiBrZXkgPT0gLTFcbiAgICAgICAgICBrZXkgPSB0aXRsZU9yZGVyLmxlbmd0aCArIG5ld1RhYnNcbiAgICAgICAgICBuZXdUYWJzICs9IDFcbiAgICAgICAge3RhYjogdGFiLCBrZXk6IGtleX1cblxuICAgICAgdGFicyA9IG9yZGVyaW5nLnNvcnQoKGEsIGIpIC0+IGEua2V5IC0gYi5rZXkpLm1hcCgobykgLT4gby50YWIpXG4gICAgdGFic1xuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQHBhbmUgPSBudWxsXG4gICAgQHRhYnMgPSBbXVxuICAgIEBkaXNwb3NhYmxlLmRpc3Bvc2UoKVxuICAgIEB2aWV3LmRlc3Ryb3koKVxuXG4gIHNlcmlhbGl6ZTogLT5cbiAgICB7dGFiczogQHRhYnMubWFwICh0YWIpIC0+IHt0aXRsZTogdGFiLml0ZW0uZ2V0VGl0bGU/KCkgb3IgbnVsbH19XG5cbiAgbmV4dDogLT5cbiAgICBpZiBAdGFicy5sZW5ndGggPT0gMFxuICAgICAgQF9zZXRDdXJyZW50SW5kZXgobnVsbClcbiAgICBlbHNlXG4gICAgICBpbmRleCA9IChAY3VycmVudEluZGV4ID8gMCkgKyAxXG4gICAgICBpbmRleCAtPSBAdGFicy5sZW5ndGggaWYgaW5kZXggPj0gQHRhYnMubGVuZ3RoXG4gICAgICBAX3NldEN1cnJlbnRJbmRleChpbmRleClcbiAgICBAX3N0YXJ0KClcblxuICBwcmV2aW91czogLT5cbiAgICBpZiBAdGFicy5sZW5ndGggPT0gMFxuICAgICAgQF9zZXRDdXJyZW50SW5kZXgobnVsbClcbiAgICBlbHNlXG4gICAgICBpbmRleCA9IChAY3VycmVudEluZGV4ID8gMCkgLSAxXG4gICAgICBpbmRleCArPSBAdGFicy5sZW5ndGggaWYgaW5kZXggPCAwXG4gICAgICBAX3NldEN1cnJlbnRJbmRleChpbmRleClcbiAgICBAX3N0YXJ0KClcblxuICBzZXRDdXJyZW50SWQ6IChpZCkgLT5cbiAgICBpbmRleCA9IEB0YWJzLm1hcCgodGFiKSAtPiB0YWIuaWQpLmluZGV4T2YoaWQpXG4gICAgcmV0dXJuIGlmIGluZGV4ID09IC0xXG4gICAgQF9zZXRDdXJyZW50SW5kZXgoaW5kZXgpXG5cbiAgc2F2ZUN1cnJlbnQ6IC0+XG4gICAgdGFiID0gQHRhYnNbQGN1cnJlbnRJbmRleF1cbiAgICByZXR1cm4gaWYgdGFiIGlzIHVuZGVmaW5lZFxuICAgIHRhYi5pdGVtLnNhdmU/KClcblxuICBjbG9zZUN1cnJlbnQ6IC0+XG4gICAgdGFiID0gQHRhYnNbQGN1cnJlbnRJbmRleF1cbiAgICByZXR1cm4gaWYgdGFiIGlzIHVuZGVmaW5lZFxuICAgIEBwYW5lLnJlbW92ZUl0ZW0odGFiLml0ZW0pXG5cbiAgX21vdmVJdGVtVG9Gcm9udDogKGl0ZW0pIC0+XG4gICAgaW5kZXggPSBAX2ZpbmRJdGVtSW5kZXgoaXRlbSlcbiAgICB1bmxlc3MgaW5kZXggaXMgbnVsbFxuICAgICAgdGFicyA9IEB0YWJzLnNwbGljZShpbmRleCwgMSlcbiAgICAgIEB0YWJzLnVuc2hpZnQodGFic1swXSlcbiAgICAgIEB2aWV3LnRhYnNSZW9yZGVyZWQoKVxuXG4gIF9maW5kSXRlbUluZGV4OiAoaXRlbSkgLT5cbiAgICBmb3IgdGFiLCBpbmRleCBpbiBAdGFic1xuICAgICAgaWYgdGFiLml0ZW0gPT0gaXRlbVxuICAgICAgICByZXR1cm4gaW5kZXhcbiAgICByZXR1cm4gbnVsbFxuXG4gIF9yZW1vdmVUYWJBdEluZGV4OiAoaW5kZXgpIC0+XG4gICAgaWYgaW5kZXggPT0gQGN1cnJlbnRJbmRleFxuICAgICAgaWYgaW5kZXggPT0gQHRhYnMubGVuZ3RoIC0gMVxuICAgICAgICBuZXdDdXJyZW50SW5kZXggPSBpZiBpbmRleCA9PSAwIHRoZW4gbnVsbCBlbHNlIEBjdXJyZW50SW5kZXggLSAxXG4gICAgICBlbHNlXG4gICAgICAgIG5ld0N1cnJlbnRJbmRleCA9IEBjdXJyZW50SW5kZXhcbiAgICBlbHNlIGlmIGluZGV4IDwgQGN1cnJlbnRJbmRleFxuICAgICAgbmV3Q3VycmVudEluZGV4ID0gQGN1cnJlbnRJbmRleCAtIDFcblxuICAgIHJlbW92ZWQgPSBAdGFicy5zcGxpY2UoaW5kZXgsIDEpXG4gICAgQHZpZXcudGFiUmVtb3ZlZChyZW1vdmVkWzBdKVxuXG4gICAgaWYgbmV3Q3VycmVudEluZGV4IGlzbnQgbnVsbFxuICAgICAgICBAX3NldEN1cnJlbnRJbmRleChuZXdDdXJyZW50SW5kZXgpXG5cbiAgX3N0YXJ0OiAoaXRlbSkgLT5cbiAgICBpZiBub3QgQHN3aXRjaGluZ1xuICAgICAgQHN3aXRjaGluZyA9IHRydWVcbiAgICAgIEB2aWV3LnNob3coKVxuXG4gIF9zZXRDdXJyZW50SW5kZXg6IChpbmRleCkgLT5cbiAgICBpZiBpbmRleCA9PSBudWxsXG4gICAgICBAY3VycmVudEluZGV4ID0gbnVsbFxuICAgICAgQHZpZXcuY3VycmVudFRhYkNoYW5nZWQobnVsbClcbiAgICBlbHNlXG4gICAgICBAY3VycmVudEluZGV4ID0gaW5kZXhcbiAgICAgIEB2aWV3LmN1cnJlbnRUYWJDaGFuZ2VkKEB0YWJzW2luZGV4XSlcblxuICBzZWxlY3Q6IC0+XG4gICAgaWYgQHN3aXRjaGluZ1xuICAgICAgQHN3aXRjaGluZyA9IGZhbHNlXG4gICAgICB1bmxlc3MgQGN1cnJlbnRJbmRleCBpcyBudWxsXG4gICAgICAgIGlmIDAgPD0gQGN1cnJlbnRJbmRleCA8IEB0YWJzLmxlbmd0aFxuICAgICAgICAgIEBwYW5lLmFjdGl2YXRlSXRlbShAdGFic1tAY3VycmVudEluZGV4XS5pdGVtKVxuICAgICAgICAgIEBwYW5lLmFjdGl2YXRlKClcbiAgICAgICAgQGN1cnJlbnRJbmRleCA9IG51bGxcbiAgICAgICAgQHZpZXcuY3VycmVudFRhYkNoYW5nZWQobnVsbClcbiAgICAgIEB2aWV3LmhpZGUoKVxuXG4gIGNhbmNlbDogLT5cbiAgICBpZiBAc3dpdGNoaW5nXG4gICAgICBAc3dpdGNoaW5nID0gZmFsc2VcbiAgICAgIHVubGVzcyBAY3VycmVudEluZGV4IGlzIG51bGxcbiAgICAgICAgQGN1cnJlbnRJbmRleCA9IG51bGxcbiAgICAgICAgQHZpZXcuY3VycmVudFRhYkNoYW5nZWQobnVsbClcbiAgICBAcGFuZS5hY3RpdmF0ZSgpXG4gICAgQHZpZXcuaGlkZSgpXG5cbiAgQGFzc2lnblBhbmVzOiAocGFuZXMsIGRhdGEpIC0+XG4gICAgcGFuZVRpdGxlcyA9IG5ldyBNYXBcbiAgICBmb3IgcGFuZSBpbiBwYW5lc1xuICAgICAgcGFuZVRpdGxlcy5zZXQocGFuZSwgbmV3IFNldChpdGVtLmdldFRpdGxlKCkgZm9yIGl0ZW0gaW4gcGFuZS5nZXRJdGVtcygpKSlcblxuICAgIGxpc3RUaXRsZXMgPSBuZXcgTWFwXG4gICAgZm9yIGxpc3REYXRhLCBpbmRleCBpbiBkYXRhXG4gICAgICBsaXN0VGl0bGVzLnNldChsaXN0RGF0YSwgbmV3IFNldCh0YWIudGl0bGUgZm9yIHRhYiBpbiBsaXN0RGF0YS50YWJzKSlcblxuICAgIGphY2NhcmQgPSAoc2V0MSwgc2V0MikgLT5cbiAgICAgIHJldHVybiAwIGlmIHNldDEuc2l6ZSA9PSAwIG9yIHNldDIuc2l6ZSA9PSAwXG4gICAgICBpbl9vbmUgPSAwXG4gICAgICBpbl9ib3RoID0gMFxuICAgICAgc2V0MS5mb3JFYWNoIChlbGVtZW50KSAtPlxuICAgICAgICBpZiBzZXQyLmhhcyhlbGVtZW50KSB0aGVuIGluX2JvdGggKz0gMSBlbHNlIGluX29uZSArPSAxXG4gICAgICBzZXQyLmZvckVhY2ggKGVsZW1lbnQpIC0+XG4gICAgICAgIGlmICFzZXQxLmhhcyhlbGVtZW50KSB0aGVuIGluX29uZSArPSAxXG4gICAgICBpbl9ib3RoIC8gKGluX2JvdGggKyBpbl9vbmUpXG5cbiAgICBzY29yZXMgPSBkYXRhLm1hcCAobGlzdERhdGEsIGxpc3RJbmRleCkgLT5cbiAgICAgIHBhbmVzLm1hcCAocGFuZSkgLT5cbiAgICAgICAgW2phY2NhcmQocGFuZVRpdGxlcy5nZXQocGFuZSksIGxpc3RUaXRsZXMuZ2V0KGxpc3REYXRhKSksIGxpc3REYXRhLCBwYW5lXVxuICAgIHNvcnRlZFNjb3JlcyA9IHNjb3Jlcy5yZWR1Y2UoKChhLCBiKSA9PiBhLmNvbmNhdChiKSksIFtdKS5zb3J0KChhLCBiKSAtPiBiWzBdIC0gYVswXSlcblxuICAgIGFzc2lnbmVkUGFuZXMgPSBuZXcgTWFwXG4gICAgYXNzaWduZWRMaXN0cyA9IG5ldyBTZXRcbiAgICBmb3IgZW50cnkgaW4gc29ydGVkU2NvcmVzXG4gICAgICBbc2NvcmUsIGxpc3REYXRhLCBwYW5lXSA9IGVudHJ5XG4gICAgICB1bmxlc3Mgc2NvcmUgPCAwLjUgb3IgYXNzaWduZWRQYW5lcy5oYXMocGFuZS5pZCkgb3IgYXNzaWduZWRMaXN0cy5oYXMobGlzdERhdGEpXG4gICAgICAgIGFzc2lnbmVkUGFuZXMuc2V0KHBhbmUuaWQsIGxpc3REYXRhKVxuICAgICAgICBhc3NpZ25lZExpc3RzLmFkZChsaXN0RGF0YSlcblxuICAgIGFzc2lnbmVkUGFuZXNcbiJdfQ==
