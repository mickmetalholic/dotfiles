(function() {
  var CompositeDisposable, Disposable, Path, TabListView, home, isUnder, makeElement, projectRelativePath, ref;

  Path = require('path');

  ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, Disposable = ref.Disposable;

  makeElement = function(name, attributes, children) {
    var child, element, i, len, value;
    element = document.createElement(name);
    for (name in attributes) {
      value = attributes[name];
      element.setAttribute(name, value);
    }
    if (children) {
      for (i = 0, len = children.length; i < len; i++) {
        child = children[i];
        element.appendChild(child);
      }
    }
    return element;
  };

  home = process.platform === 'win32' ? process.env.USERPROFILE : process.env.HOME;

  isUnder = function(dir, path) {
    return Path.relative(path, dir).startsWith('..');
  };

  projectRelativePath = function(path) {
    var ref1, relativePath, root;
    path = Path.dirname(path);
    ref1 = atom.project.relativizePath(path), root = ref1[0], relativePath = ref1[1];
    if (root) {
      if (atom.project.getPaths().length > 1) {
        relativePath = Path.basename(root) + Path.sep + relativePath;
      }
      return relativePath;
    } else if (home && isUnder(home, path)) {
      return '~' + Path.sep + Path.relative(home, path);
    } else {
      return path;
    }
  };

  TabListView = (function() {
    TabListView.addIcon = function(element, path) {};

    function TabListView(tabSwitcher) {
      var bindEventListener, i, len, mouseMove, ref1, tab, vert;
      this.tabSwitcher = tabSwitcher;
      this.disposable = new CompositeDisposable;
      this.items = {};
      this.currentItem = null;
      this.lastMouseCoords = null;
      ref1 = tabSwitcher.tabs;
      for (i = 0, len = ref1.length; i < len; i++) {
        tab = ref1[i];
        this.items[tab.id] = this._makeItem(tab);
      }
      this.ol = makeElement('ol', {
        'class': 'tab-switcher-tab-list',
        'tabindex': '-1'
      });
      vert = makeElement('div', {
        'class': 'vertical-axis'
      }, [this.ol]);
      this._buildList();
      this.modalPanel = atom.workspace.addModalPanel({
        item: vert,
        visible: false,
        className: 'tab-switcher'
      });
      this.panel = vert.parentNode;
      mouseMove = (function(_this) {
        return function(event) {
          var id, li;
          if (!_this.mouseMoved(event)) {
            return;
          }
          if ((li = event.target.closest('li'))) {
            id = parseInt(li.getAttribute('data-id'));
            return tabSwitcher.setCurrentId(id);
          }
        };
      })(this);
      bindEventListener = (function(_this) {
        return function(element, event, listener) {
          element.addEventListener(event, listener);
          return _this.disposable.add(new Disposable(function() {
            return element.removeEventListener(event, listener);
          }));
        };
      })(this);
      bindEventListener(this.ol, 'mouseenter', (function(_this) {
        return function(event) {
          return _this.ol.addEventListener('mousemove', mouseMove);
        };
      })(this));
      bindEventListener(this.ol, 'mouseleave', (function(_this) {
        return function(event) {
          _this.lastMouseCoords = null;
          return _this.ol.removeEventListener('mousemove', mouseMove);
        };
      })(this));
      bindEventListener(this.ol, 'click', (function(_this) {
        return function(event) {
          var id, li;
          if ((li = event.target.closest('li'))) {
            id = parseInt(li.getAttribute('data-id'));
            return tabSwitcher.select(id);
          }
        };
      })(this));
    }

    TabListView.prototype.mouseMoved = function(event) {
      var result;
      result = (this.lastMouseCoords != null) && (this.lastMouseCoords[0] !== event.screenX || this.lastMouseCoords[1] !== event.screenY);
      this.lastMouseCoords = [event.screenX, event.screenY];
      return result;
    };

    TabListView.prototype.updateAnimationDelay = function(delay) {
      if (delay === 0) {
        return this.panel.style.transitionDelay = '';
      } else {
        return this.panel.style.transitionDelay = delay + "s";
      }
    };

    TabListView.prototype.tabAdded = function(tab) {
      this.items[tab.id] = this._makeItem(tab);
      return this._buildList();
    };

    TabListView.prototype.tabRemoved = function(tab) {
      delete this.items[tab.id];
      return this._buildList();
    };

    TabListView.prototype.tabUpdated = function(tab) {
      this.items[tab.id] = this._makeItem(tab);
      return this._buildList();
    };

    TabListView.prototype.tabsReordered = function() {
      return this._buildList();
    };

    TabListView.prototype.currentTabChanged = function(tab) {
      if (this.currentItem) {
        this.currentItem.classList.remove('current');
      }
      if (tab) {
        this.currentItem = this.items[tab.id];
        this.currentItem.classList.add('current');
        return this.scrollToCurrentTab();
      }
    };

    TabListView.prototype.destroy = function() {
      this.modalPanel.destroy();
      return this.disposable.dispose();
    };

    TabListView.prototype.show = function() {
      var invokeCancel, invokeSelect, panel, unbind;
      atom.views.getView(this.modalPanel).closest('atom-panel-container').classList.add('tab-switcher');
      panel = this.ol.closest('atom-panel');
      this.modalPanel.show();
      this.scrollToCurrentTab();
      this.ol.focus();
      setTimeout((function(_this) {
        return function() {
          return _this.panel.classList.add('is-visible');
        };
      })(this));
      invokeSelect = (function(_this) {
        return function(event) {
          if (!(event.ctrlKey || event.altKey || event.shiftKey || event.metaKey)) {
            _this.tabSwitcher.select();
            return unbind();
          }
        };
      })(this);
      invokeCancel = (function(_this) {
        return function(event) {
          _this.tabSwitcher.cancel();
          return unbind();
        };
      })(this);
      document.addEventListener('mouseup', invokeSelect);
      this.ol.addEventListener('blur', invokeCancel);
      return unbind = (function(_this) {
        return function() {
          document.removeEventListener('mouseup', invokeSelect);
          return _this.ol.removeEventListener('blur', invokeCancel);
        };
      })(this);
    };

    TabListView.prototype.scrollToCurrentTab = function() {
      var currentTab, item, itemTop, ref1, targetMax, targetMin;
      if ((currentTab = this.tabSwitcher.tabs[this.tabSwitcher.currentIndex])) {
        item = this.items[currentTab.id];
        itemTop = item.offsetTop;
        targetMin = itemTop - this.ol.clientHeight + 2 * item.offsetHeight;
        targetMax = itemTop - item.offsetHeight;
        if (targetMin > targetMax) {
          ref1 = [targetMax, targetMin], targetMin = ref1[0], targetMax = ref1[1];
        }
        if (targetMin < 0) {
          targetMin = 0;
        }
        if (targetMax < 0) {
          targetMax = 0;
        }
        if (this.ol.scrollTop < targetMin) {
          return this.ol.scrollTop = targetMin;
        } else if (this.ol.scrollTop > targetMax) {
          return this.ol.scrollTop = targetMax;
        }
      }
    };

    TabListView.prototype.hide = function() {
      atom.views.getView(this.modalPanel).closest('atom-panel-container').classList.remove('tab-switcher');
      this.panel.classList.remove('is-visible');
      return this.modalPanel.hide();
    };

    TabListView.prototype._makeItem = function(tab) {
      var dir, icon, label, labels, path, ref1, sublabel, sublabelText, toggleModified;
      tab.isEditor = tab.item.constructor.name === 'TextEditor';
      tab.modifiedIcon = makeElement('span', {
        "class": 'modified-icon'
      });
      label = makeElement('span', {
        "class": 'tab-label'
      }, [document.createTextNode(tab.item.getTitle())]);
      icon = makeElement('span', {
        "class": 'icon'
      });
      TabListView.addIcon(icon, tab.item.getTitle());
      if (tab.isEditor) {
        toggleModified = function() {
          var action;
          action = tab.item.isModified() ? 'add' : 'remove';
          return label.classList[action]('modified');
        };
        this.disposable.add(tab.item.onDidChangeModified(toggleModified));
        toggleModified();
        path = (ref1 = tab.item.getPath()) != null ? ref1 : '';
        dir = path ? projectRelativePath(path) : '';
        sublabelText = document.createTextNode(dir);
        sublabel = makeElement('span', {
          "class": 'tab-sublabel'
        }, [sublabelText]);
        labels = makeElement('span', {
          "class": 'tab-labels'
        }, [tab.modifiedIcon, label, sublabel]);
      } else {
        labels = label;
      }
      return makeElement('li', {
        'data-id': tab.id
      }, [icon, labels]);
    };

    TabListView.prototype._buildList = function() {
      var i, len, ref1, results, tab;
      while (this.ol.children.length > 0) {
        this.ol.removeChild(this.ol.children[0]);
      }
      ref1 = this.tabSwitcher.tabs;
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        tab = ref1[i];
        results.push(this.ol.appendChild(this.items[tab.id]));
      }
      return results;
    };

    return TabListView;

  })();

  module.exports = TabListView;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvdGFiLXN3aXRjaGVyL2xpYi90YWItbGlzdC12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLE1BQW9DLE9BQUEsQ0FBUSxNQUFSLENBQXBDLEVBQUMsNkNBQUQsRUFBc0I7O0VBRXRCLFdBQUEsR0FBYyxTQUFDLElBQUQsRUFBTyxVQUFQLEVBQW1CLFFBQW5CO0FBQ1osUUFBQTtJQUFBLE9BQUEsR0FBVSxRQUFRLENBQUMsYUFBVCxDQUF1QixJQUF2QjtBQUNWLFNBQUEsa0JBQUE7O01BQ0UsT0FBTyxDQUFDLFlBQVIsQ0FBcUIsSUFBckIsRUFBMkIsS0FBM0I7QUFERjtJQUVBLElBQUcsUUFBSDtBQUNFLFdBQUEsMENBQUE7O1FBQ0UsT0FBTyxDQUFDLFdBQVIsQ0FBb0IsS0FBcEI7QUFERixPQURGOztBQUdBLFdBQU87RUFQSzs7RUFTZCxJQUFBLEdBQVUsT0FBTyxDQUFDLFFBQVIsS0FBb0IsT0FBdkIsR0FBb0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFoRCxHQUFpRSxPQUFPLENBQUMsR0FBRyxDQUFDOztFQUVwRixPQUFBLEdBQVUsU0FBQyxHQUFELEVBQU0sSUFBTjtXQUNSLElBQUksQ0FBQyxRQUFMLENBQWMsSUFBZCxFQUFvQixHQUFwQixDQUF3QixDQUFDLFVBQXpCLENBQW9DLElBQXBDO0VBRFE7O0VBR1YsbUJBQUEsR0FBc0IsU0FBQyxJQUFEO0FBQ3BCLFFBQUE7SUFBQSxJQUFBLEdBQU8sSUFBSSxDQUFDLE9BQUwsQ0FBYSxJQUFiO0lBQ1AsT0FBdUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFiLENBQTRCLElBQTVCLENBQXZCLEVBQUMsY0FBRCxFQUFPO0lBQ1AsSUFBRyxJQUFIO01BQ0UsSUFBRyxJQUFJLENBQUMsT0FBTyxD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LENBQW9CLElBQXBCLENBQWIsR0FBNEM7UUFDbEQsWUFBQSxHQUFlLFFBQVEsQ0FBQyxjQUFULENBQXdCLEdBQXhCO1FBQ2YsUUFBQSxHQUFXLFdBQUEsQ0FBWSxNQUFaLEVBQW9CO1VBQUMsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFSO1NBQXBCLEVBQTZDLENBQUMsWUFBRCxDQUE3QztRQUNYLE1BQUEsR0FBUyxXQUFBLENBQVksTUFBWixFQUFvQjtVQUFDLENBQUEsS0FBQSxDQUFBLEVBQU8sWUFBUjtTQUFwQixFQUEyQyxDQUFDLEdBQUcsQ0FBQyxZQUFMLEVBQW1CLEtBQW5CLEVBQTBCLFFBQTFCLENBQTNDLEVBWFg7T0FBQSxNQUFBO1FBYUUsTUFBQSxHQUFTLE1BYlg7O2FBZUEsV0FBQSxDQUFZLElBQVosRUFBa0I7UUFBQyxTQUFBLEVBQVcsR0FBRyxDQUFDLEVBQWhCO09BQWxCLEVBQXVDLENBQUMsSUFBRCxFQUFPLE1BQVAsQ0FBdkM7SUF2QlM7OzBCQXlCWCxVQUFBLEdBQVksU0FBQTtBQUNWLFVBQUE7QUFBQSxhQUFNLElBQUMsQ0FBQSxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQWIsR0FBc0IsQ0FBNUI7UUFDRSxJQUFDLENBQUEsRUFBRSxDQUFDLFdBQUosQ0FBZ0IsSUFBQyxDQUFBLEVBQUUsQ0FBQyxRQUFTLENBQUEsQ0FBQSxDQUE3QjtNQURGO0FBRUE7QUFBQTtXQUFBLHNDQUFBOztxQkFDRSxJQUFDLENBQUEsRUFBRSxDQUFDLFdBQUosQ0FBZ0IsSUFBQyxDQUFBLEtBQU0sQ0FBQSxHQUFHLENBQUMsRUFBSixDQUF2QjtBQURGOztJQUhVOzs7Ozs7RUFNZCxNQUFNLENBQUMsT0FBUCxHQUFpQjtBQWhNakIiLCJzb3VyY2VzQ29udGVudCI6WyJQYXRoID0gcmVxdWlyZSAncGF0aCdcbntDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5cbm1ha2VFbGVtZW50ID0gKG5hbWUsIGF0dHJpYnV0ZXMsIGNoaWxkcmVuKSAtPlxuICBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lKVxuICBmb3IgbmFtZSwgdmFsdWUgb2YgYXR0cmlidXRlc1xuICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKVxuICBpZiBjaGlsZHJlblxuICAgIGZvciBjaGlsZCBpbiBjaGlsZHJlblxuICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChjaGlsZClcbiAgcmV0dXJuIGVsZW1lbnRcblxuaG9tZSA9IGlmIHByb2Nlc3MucGxhdGZvcm0gPT0gJ3dpbjMyJyB0aGVuIHByb2Nlc3MuZW52LlVTRVJQUk9GSUxFIGVsc2UgcHJvY2Vzcy5lbnYuSE9NRVxuXG5pc1VuZGVyID0gKGRpciwgcGF0aCkgLT5cbiAgUGF0aC5yZWxhdGl2ZShwYXRoLCBkaXIpLnN0YXJ0c1dpdGgoJy4uJylcblxucHJvamVjdFJlbGF0aXZlUGF0aCA9IChwYXRoKSAtPlxuICBwYXRoID0gUGF0aC5kaXJuYW1lKHBhdGgpXG4gIFtyb290LCByZWxhdGl2ZVBhdGhdID0gYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKHBhdGgpXG4gIGlmIHJvb3RcbiAgICBpZiBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKS5sZW5ndGggPiAxXG4gICAgICByZWxhdGl2ZVBhdGggPSBQYXRoLmJhc2VuYW1lKHJvb3QpICsgUGF0aC5zZXAgKyByZWxhdGl2ZVBhdGhcbiAgICByZWxhdGl2ZVBhdGhcbiAgZWxzZSBpZiBob21lIGFuZCBpc1VuZGVyKGhvbWUsIHBhdGgpXG4gICAgJ34nICsgUGF0aC5zZXAgKyBQYXRoLnJlbGF0aXZlKGhvbWUsIHBhdGgpXG4gIGVsc2VcbiAgICBwYXRoXG5cbmNsYXNzIFRhYkxpc3RWaWV3XG4gIEBhZGRJY29uOiAoZWxlbWVudCwgcGF0aCkgLT5cbiAgICAjIFRoZSBmaWxlLWljb25zIHNlcnZpY2UgY29uc3VtZXIgb3ZlcnJpZGVzIHRoaXMgaWYgYXZhaWxhYmxlLlxuXG4gIGNvbnN0cnVjdG9yOiAodGFiU3dpdGNoZXIpIC0+XG4gICAgQHRhYlN3aXRjaGVyID0gdGFiU3dpdGNoZXJcbiAgICBAZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQGl0ZW1zID0ge31cbiAgICBAY3VycmVudEl0ZW0gPSBudWxsXG4gICAgQGxhc3RNb3VzZUNvb3JkcyA9IG51bGxcblxuICAgIGZvciB0YWIgaW4gdGFiU3dpdGNoZXIudGFic1xuICAgICAgQGl0ZW1zW3RhYi5pZF0gPSBAX21ha2VJdGVtKHRhYilcblxuICAgIEBvbCA9IG1ha2VFbGVtZW50KCdvbCcsICdjbGFzcyc6ICd0YWItc3dpdGNoZXItdGFiLWxpc3QnLCAndGFiaW5kZXgnOiAnLTEnKVxuICAgIHZlcnQgPSBtYWtlRWxlbWVudCgnZGl2JywgeydjbGFzcyc6ICd2ZXJ0aWNhbC1heGlzJ30sIFtAb2xdKVxuXG4gICAgQF9idWlsZExpc3QoKVxuXG4gICAgQG1vZGFsUGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsXG4gICAgICBpdGVtOiB2ZXJ0XG4gICAgICB2aXNpYmxlOiBmYWxzZVxuICAgICAgY2xhc3NOYW1lOiAndGFiLXN3aXRjaGVyJ1xuXG4gICAgQHBhbmVsID0gdmVydC5wYXJlbnROb2RlXG5cbiAgICBtb3VzZU1vdmUgPSAoZXZlbnQpID0+XG4gICAgICAjIEV2ZW50IG1heSB0cmlnZ2VyIHdpdGhvdXQgYSByZWFsIG1vdXNlIG1vdmUgaWYgdGhlIGxpc3Qgc2Nyb2xscy5cbiAgICAgIHJldHVybiBpZiBub3QgQG1vdXNlTW92ZWQoZXZlbnQpXG4gICAgICBpZiAobGkgPSBldmVudC50YXJnZXQuY2xvc2VzdCgnbGknKSlcbiAgICAgICAgaWQgPSBwYXJzZUludChsaS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSlcbiAgICAgICAgdGFiU3dpdGNoZXIuc2V0Q3VycmVudElkKGlkKVxuXG4gICAgYmluZEV2ZW50TGlzdGVuZXIgPSAoZWxlbWVudCwgZXZlbnQsIGxpc3RlbmVyKSA9PlxuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcilcbiAgICAgIEBkaXNwb3NhYmxlLmFkZCBuZXcgRGlzcG9zYWJsZSg9PiBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyKSlcblxuICAgIGJpbmRFdmVudExpc3RlbmVyIEBvbCwgJ21vdXNlZW50ZXInLCAoZXZlbnQpID0+XG4gICAgICBAb2wuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2Vtb3ZlJywgbW91c2VNb3ZlXG5cbiAgICBiaW5kRXZlbnRMaXN0ZW5lciBAb2wsICdtb3VzZWxlYXZlJywgKGV2ZW50KSA9PlxuICAgICAgQGxhc3RNb3VzZUNvb3JkcyA9IG51bGxcbiAgICAgIEBvbC5yZW1vdmVFdmVudExpc3RlbmVyICdtb3VzZW1vdmUnLCBtb3VzZU1vdmVcblxuICAgIGJpbmRFdmVudExpc3RlbmVyIEBvbCwgJ2NsaWNrJywgKGV2ZW50KSA9PlxuICAgICAgaWYgKGxpID0gZXZlbnQudGFyZ2V0LmNsb3Nlc3QoJ2xpJykpXG4gICAgICAgIGlkID0gcGFyc2VJbnQobGkuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJykpXG4gICAgICAgIHRhYlN3aXRjaGVyLnNlbGVjdChpZClcblxuICBtb3VzZU1vdmVkOiAoZXZlbnQpIC0+XG4gICAgcmVzdWx0ID0gQGxhc3RNb3VzZUNvb3Jkcz8gYW5kIChAbGFzdE1vdXNlQ29vcmRzWzBdICE9IGV2ZW50LnNjcmVlblggb3IgQGxhc3RNb3VzZUNvb3Jkc1sxXSAhPSBldmVudC5zY3JlZW5ZKVxuICAgIEBsYXN0TW91c2VDb29yZHMgPSBbZXZlbnQuc2NyZWVuWCwgZXZlbnQuc2NyZWVuWV1cbiAgICByZXN1bHRcblxuICB1cGRhdGVBbmltYXRpb25EZWxheTogKGRlbGF5KSAtPlxuICAgIGlmIGRlbGF5ID09IDBcbiAgICAgIEBwYW5lbC5zdHlsZS50cmFuc2l0aW9uRGVsYXkgPSAnJ1xuICAgIGVsc2VcbiAgICAgIEBwYW5lbC5zdHlsZS50cmFuc2l0aW9uRGVsYXkgPSBcIiN7ZGVsYXl9c1wiXG5cbiAgdGFiQWRkZWQ6ICh0YWIpIC0+XG4gICAgQGl0ZW1zW3RhYi5pZF0gPSBAX21ha2VJdGVtKHRhYilcbiAgICBAX2J1aWxkTGlzdCgpXG5cbiAgdGFiUmVtb3ZlZDogKHRhYikgLT5cbiAgICBkZWxldGUgQGl0ZW1zW3RhYi5pZF1cbiAgICBAX2J1aWxkTGlzdCgpXG5cbiAgdGFiVXBkYXRlZDogKHRhYikgLT5cbiAgICBAaXRlbXNbdGFiLmlkXSA9IEBfbWFrZUl0ZW0odGFiKVxuICAgIEBfYnVpbGRMaXN0KClcblxuICB0YWJzUmVvcmRlcmVkOiAtPlxuICAgIEBfYnVpbGRMaXN0KClcblxuICBjdXJyZW50VGFiQ2hhbmdlZDogKHRhYikgLT5cbiAgICBpZiBAY3VycmVudEl0ZW1cbiAgICAgIEBjdXJyZW50SXRlbS5jbGFzc0xpc3QucmVtb3ZlKCdjdXJyZW50JylcbiAgICBpZiB0YWJcbiAgICAgIEBjdXJyZW50SXRlbSA9IEBpdGVtc1t0YWIuaWRdXG4gICAgICBAY3VycmVudEl0ZW0uY2xhc3NMaXN0LmFkZCgnY3VycmVudCcpXG4gICAgICBAc2Nyb2xsVG9DdXJyZW50VGFiKClcblxuICBkZXN0cm95OiAtPlxuICAgIEBtb2RhbFBhbmVsLmRlc3Ryb3koKVxuICAgIEBkaXNwb3NhYmxlLmRpc3Bvc2UoKVxuXG4gIHNob3c6IC0+XG4gICAgYXRvbS52aWV3cy5nZXRWaWV3KEBtb2RhbFBhbmVsKS5jbG9zZXN0KCdhdG9tLXBhbmVsLWNvbnRhaW5lcicpLmNsYXNzTGlzdC5hZGQoJ3RhYi1zd2l0Y2hlcicpXG4gICAgcGFuZWwgPSBAb2wuY2xvc2VzdCgnYXRvbS1wYW5lbCcpXG4gICAgQG1vZGFsUGFuZWwuc2hvdygpXG4gICAgQHNjcm9sbFRvQ3VycmVudFRhYigpXG4gICAgQG9sLmZvY3VzKClcbiAgICBzZXRUaW1lb3V0ID0+IEBwYW5lbC5jbGFzc0xpc3QuYWRkKCdpcy12aXNpYmxlJylcblxuICAgIGludm9rZVNlbGVjdCA9IChldmVudCkgPT5cbiAgICAgIGlmIG5vdCAoZXZlbnQuY3RybEtleSBvciBldmVudC5hbHRLZXkgb3IgZXZlbnQuc2hpZnRLZXkgb3IgZXZlbnQubWV0YUtleSlcbiAgICAgICAgQHRhYlN3aXRjaGVyLnNlbGVjdCgpXG4gICAgICAgIHVuYmluZCgpXG5cbiAgICBpbnZva2VDYW5jZWwgPSAoZXZlbnQpID0+XG4gICAgICBAdGFiU3dpdGNoZXIuY2FuY2VsKClcbiAgICAgIHVuYmluZCgpXG5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyICdtb3VzZXVwJywgaW52b2tlU2VsZWN0XG4gICAgQG9sLmFkZEV2ZW50TGlzdGVuZXIgJ2JsdXInLCBpbnZva2VDYW5jZWxcblxuICAgIHVuYmluZCA9ID0+XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyICdtb3VzZXVwJywgaW52b2tlU2VsZWN0XG4gICAgICBAb2wucmVtb3ZlRXZlbnRMaXN0ZW5lciAnYmx1cicsIGludm9rZUNhbmNlbFxuXG4gIHNjcm9sbFRvQ3VycmVudFRhYjogLT5cbiAgICBpZiAoY3VycmVudFRhYiA9IEB0YWJTd2l0Y2hlci50YWJzW0B0YWJTd2l0Y2hlci5jdXJyZW50SW5kZXhdKVxuICAgICAgaXRlbSA9IEBpdGVtc1tjdXJyZW50VGFiLmlkXVxuXG4gICAgICBpdGVtVG9wID0gaXRlbS5vZmZzZXRUb3BcbiAgICAgIHRhcmdldE1pbiA9IGl0ZW1Ub3AgLSBAb2wuY2xpZW50SGVpZ2h0ICsgMippdGVtLm9mZnNldEhlaWdodFxuICAgICAgdGFyZ2V0TWF4ID0gaXRlbVRvcCAtIGl0ZW0ub2Zmc2V0SGVpZ2h0XG4gICAgICBbdGFyZ2V0TWluLCB0YXJnZXRNYXhdID0gW3RhcmdldE1heCwgdGFyZ2V0TWluXSBpZiB0YXJnZXRNaW4gPiB0YXJnZXRNYXhcbiAgICAgIHRhcmdldE1pbiA9IDAgaWYgdGFyZ2V0TWluIDwgMFxuICAgICAgdGFyZ2V0TWF4ID0gMCBpZiB0YXJnZXRNYXggPCAwXG5cbiAgICAgIGlmIEBvbC5zY3JvbGxUb3AgPCB0YXJnZXRNaW5cbiAgICAgICAgQG9sLnNjcm9sbFRvcCA9IHRhcmdldE1pblxuICAgICAgZWxzZSBpZiBAb2wuc2Nyb2xsVG9wID4gdGFyZ2V0TWF4XG4gICAgICAgIEBvbC5zY3JvbGxUb3AgPSB0YXJnZXRNYXhcblxuICBoaWRlOiAtPlxuICAgIGF0b20udmlld3MuZ2V0VmlldyhAbW9kYWxQYW5lbCkuY2xvc2VzdCgnYXRvbS1wYW5lbC1jb250YWluZXInKS5jbGFzc0xpc3QucmVtb3ZlKCd0YWItc3dpdGNoZXInKVxuICAgIEBwYW5lbC5jbGFzc0xpc3QucmVtb3ZlKCdpcy12aXNpYmxlJylcbiAgICBAbW9kYWxQYW5lbC5oaWRlKClcblxuICBfbWFrZUl0ZW06ICh0YWIpIC0+XG4gICAgdGFiLmlzRWRpdG9yID0gdGFiLml0ZW0uY29uc3RydWN0b3IubmFtZSA9PSAnVGV4dEVkaXRvcidcbiAgICB0YWIubW9kaWZpZWRJY29uID0gbWFrZUVsZW1lbnQoJ3NwYW4nLCB7Y2xhc3M6ICdtb2RpZmllZC1pY29uJ30pXG4gICAgbGFiZWwgPSBtYWtlRWxlbWVudCgnc3BhbicsIHtjbGFzczogJ3RhYi1sYWJlbCd9LCBbZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGFiLml0ZW0uZ2V0VGl0bGUoKSldKVxuXG4gICAgaWNvbiA9IG1ha2VFbGVtZW50KCdzcGFuJywge2NsYXNzOiAnaWNvbid9KVxuICAgIFRhYkxpc3RWaWV3LmFkZEljb24oaWNvbiwgdGFiLml0ZW0uZ2V0VGl0bGUoKSlcblxuICAgIGlmIHRhYi5pc0VkaXRvclxuICAgICAgdG9nZ2xlTW9kaWZpZWQgPSAtPlxuICAgICAgICBhY3Rpb24gPSBpZiB0YWIuaXRlbS5pc01vZGlmaWVkKCkgdGhlbiAnYWRkJyBlbHNlICdyZW1vdmUnXG4gICAgICAgIGxhYmVsLmNsYXNzTGlzdFthY3Rpb25dKCdtb2RpZmllZCcpXG4gICAgICBAZGlzcG9zYWJsZS5hZGQgdGFiLml0ZW0ub25EaWRDaGFuZ2VNb2RpZmllZCh0b2dnbGVNb2RpZmllZClcbiAgICAgIHRvZ2dsZU1vZGlmaWVkKClcbiAgICAgIHBhdGggPSB0YWIuaXRlbS5nZXRQYXRoKCkgPyAnJ1xuXG4gICAgICBkaXIgPSBpZiBwYXRoIHRoZW4gcHJvamVjdFJlbGF0aXZlUGF0aChwYXRoKSBlbHNlICcnXG4gICAgICBzdWJsYWJlbFRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkaXIpXG4gICAgICBzdWJsYWJlbCA9IG1ha2VFbGVtZW50KCdzcGFuJywge2NsYXNzOiAndGFiLXN1YmxhYmVsJ30sIFtzdWJsYWJlbFRleHRdKVxuICAgICAgbGFiZWxzID0gbWFrZUVsZW1lbnQoJ3NwYW4nLCB7Y2xhc3M6ICd0YWItbGFiZWxzJ30sIFt0YWIubW9kaWZpZWRJY29uLCBsYWJlbCwgc3VibGFiZWxdKVxuICAgIGVsc2VcbiAgICAgIGxhYmVscyA9IGxhYmVsXG5cbiAgICBtYWtlRWxlbWVudCgnbGknLCB7J2RhdGEtaWQnOiB0YWIuaWR9LCBbaWNvbiwgbGFiZWxzXSlcblxuICBfYnVpbGRMaXN0OiAtPlxuICAgIHdoaWxlIEBvbC5jaGlsZHJlbi5sZW5ndGggPiAwXG4gICAgICBAb2wucmVtb3ZlQ2hpbGQoQG9sLmNoaWxkcmVuWzBdKVxuICAgIGZvciB0YWIgaW4gQHRhYlN3aXRjaGVyLnRhYnNcbiAgICAgIEBvbC5hcHBlbmRDaGlsZChAaXRlbXNbdGFiLmlkXSlcblxubW9kdWxlLmV4cG9ydHMgPSBUYWJMaXN0Vmlld1xuIl19
