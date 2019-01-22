(function() {
  var BufferedProcess, DESCRIPTION, ForkGistIdInputView, GitHubApi, PackageManager, REMOVE_KEYS, SyncSettings, _, fs, ref,
    hasProp = {}.hasOwnProperty;

  BufferedProcess = require('atom').BufferedProcess;

  fs = require('fs');

  _ = require('underscore-plus');

  ref = [], GitHubApi = ref[0], PackageManager = ref[1];

  ForkGistIdInputView = null;

  DESCRIPTION = 'Atom configuration storage operated by http://atom.io/packages/sync-settings';

  REMOVE_KEYS = ['sync-settings.gistId', 'sync-settings.personalAccessToken', 'sync-settings._analyticsUserId', 'sync-settings._lastBackupHash'];

  SyncSettings = {
    config: require('./config.coffee'),
    activate: function() {
      return setImmediate((function(_this) {
        return function() {
          var mandatorySettingsApplied;
          if (GitHubApi == null) {
            GitHubApi = require('github');
          }
          if (PackageManager == null) {
            PackageManager = require('./package-manager');
          }
          atom.commands.add('atom-workspace', "sync-settings:backup", function() {
            return _this.backup();
          });
          atom.commands.add('atom-workspace', "sync-settings:restore", function() {
            return _this.restore();
          });
          atom.commands.add('atom-workspace', "sync-settings:view-backup", function() {
            return _this.viewBackup();
          });
          atom.commands.add('atom-workspace', "sync-settings:check-backup", function() {
            return _this.checkForUpdate();
          });
          atom.commands.add('atom-workspace', "sync-settings:fork", function() {
            return _this.inputForkGistId();
          });
          mandatorySettingsApplied = _this.checkMandatorySettings();
          if (atom.config.get('sync-settings.checkForUpdatedBackup') && mandatorySettingsApplied) {
            return _this.checkForUpdate();
          }
        };
      })(this));
    },
    deactivate: function() {
      var ref1;
      return (ref1 = this.inputView) != null ? ref1.destroy() : void 0;
    },
    serialize: function() {},
    getGistId: function() {
      var gistId;
      gistId = atom.config.get('sync-settings.gistId') || process.env.GIST_ID;
      if (gistId) {
        gistId = gistId.trim();
      }
      return gistId;
    },
    getPersonalAccessToken: function() {
      var token;
      token = atom.config.get('sync-settings.personalAccessToken') || process.env.GITHUB_TOKEN;
      if (token) {
        token = token.trim();
      }
      return token;
    },
    checkMandatorySettings: function() {
      var missingSettings;
      missingSettings = [];
      if (!this.getGistId()) {
        missingSettings.push("Gist ID");
      }
      if (!this.getPersonalAccessToken()) {
        missingSettings.push("GitHub personal access token");
      }
      if (missingSettings.length) {
        this.notifyMissingMandatorySettings(missingSettings);
      }
      return missingSettings.length === 0;
    },
    checkForUpdate: function(cb) {
      if (cb == null) {
        cb = null;
      }
      if (this.getGistId()) {
        console.debug('checking latest backup...');
        return this.createClient().gists.get({
          id: this.getGistId()
        }, (function(_this) {
          return function(err, res) {
            var SyntaxError, message, ref1, ref2;
            if (err) {
              console.error("error while retrieving the gist. does it exists?", err);
              try {
                message = JSON.parse(err.message).message;
                if (message === 'Not Found') {
                  message = 'Gist ID Not Found';
                }
              } catch (error1) {
                SyntaxError = error1;
                message = err.message;
              }
              atom.notifications.addError("sync-settings: Error retrieving your settings. (" + message + ")");
              return typeof cb === "function" ? cb() : void 0;
            }
            if ((res != null ? (ref1 = res.history) != null ? (ref2 = ref1[0]) != null ? ref2.version : void 0 : void 0 : void 0) == null) {
              console.error("could not interpret result:", res);
              atom.notifications.addError("sync-settings: Error retrieving your settings.");
              return typeof cb === "function" ? cb() : void 0;
            }
            console.debug("latest backup version " + res.history[0].version);
            if (res.history[0].version !== atom.config.get('sync-settings._lastBackupHash')) {
              _this.notifyNewerBackup();
            } else if (!atom.config.get('sync-settings.quietUpdateCheck')) {
              _this.notifyBackupUptodate();
            }
            return typeof cb === "function" ? cb() : void 0;
          };
        })(this));
      } else {
        return this.notifyMissingMandatorySettings(["Gist ID"]);
      }
    },
    notifyNewerBackup: function() {
      var notification, workspaceElement;
      workspaceElement = atom.views.getView(atom.workspace);
      return notification = atom.notifications.addWarning("sync-settings: Your settings are out of date.", {
        dismissable: true,
        buttons: [
          {
            text: "Backup",
            onDidClick: function() {
              atom.commands.dispatch(workspaceElement, "sync-settings:backup");
              return notification.dismiss();
            }
          }, {
            text: "View backup",
            onDidClick: function() {
              return atom.commands.dispatch(workspaceElement, "sync-settings:view-backup");
            }
          }, {
            text: "Restore",
            onDidClick: function() {
              atom.commands.dispatch(workspaceElement, "sync-settings:restore");
              return notification.dismiss();
            }
          }, {
            text: "Dismiss",
            onDidClick: function() {
              return notification.dismiss();
            }
          }
        ]
      });
    },
    notifyBackupUptodate: function() {
      return atom.notifications.addSuccess("sync-settings: Latest backup is already applied.");
    },
    notifyMissingMandatorySettings: function(missingSettings) {
      var context, errorMsg, notification;
      context = this;
      errorMsg = "sync-settings: Mandatory settings missing: " + missingSettings.join(', ');
      return notification = atom.notifications.addError(errorMsg, {
        dismissable: true,
        buttons: [
          {
            text: "Package settings",
            onDidClick: function() {
              context.goToPackageSettings();
              return notification.dismiss();
            }
          }
        ]
      });
    },
    backup: function(cb) {
      var cmtend, cmtstart, ext, file, files, initPath, j, len, path, ref1, ref2, ref3, ref4, ref5, ref6, ref7;
      if (cb == null) {
        cb = null;
      }
      files = {};
      if (atom.config.get('sync-settings.syncSettings')) {
        files["settings.json"] = {
          content: this.getFilteredSettings()
        };
      }
      if (atom.config.get('sync-settings.syncPackages')) {
        files["packages.json"] = {
          content: JSON.stringify(this.getPackages(), null, '\t')
        };
      }
      if (atom.config.get('sync-settings.syncKeymap')) {
        files["keymap.cson"] = {
          content: (ref1 = this.fileContent(atom.keymaps.getUserKeymapPath())) != null ? ref1 : "# keymap file (not found)"
        };
      }
      if (atom.config.get('sync-settings.syncStyles')) {
        files["styles.less"] = {
          content: (ref2 = this.fileContent(atom.styles.getUserStyleSheetPath())) != null ? ref2 : "// styles file (not found)"
        };
      }
      if (atom.config.get('sync-settings.syncInit')) {
        initPath = atom.getUserInitScriptPath();
        path = require('path');
        files[path.basename(initPath)] = {
          content: (ref3 = this.fileContent(initPath)) != null ? ref3 : "# initialization file (not found)"
        };
      }
      if (atom.config.get('sync-settings.syncSnippets')) {
        files["snippets.cson"] = {
          content: (ref4 = this.fileContent(atom.getConfigDirPath() + "/snippets.cson")) != null ? ref4 : "# snippets file (not found)"
        };
      }
      ref6 = (ref5 = atom.config.get('sync-settings.extraFiles')) != null ? ref5 : [];
      for (j = 0, len = ref6.length; j < len; j++) {
        file = ref6[j];
        ext = file.slice(file.lastIndexOf(".")).toLowerCase();
        cmtstart = "#";
        if (ext === ".less" || ext === ".scss" || ext === ".js") {
          cmtstart = "//";
        }
        if (ext === ".css") {
          cmtstart = "/*";
        }
        cmtend = "";
        if (ext === ".css") {
          cmtend = "*/";
        }
        files[file] = {
          content: (ref7 = this.fileContent(atom.getConfigDirPath() + ("/" + file))) != null ? ref7 : cmtstart + " " + file + " (not found) " + cmtend
        };
      }
      return this.createClient().gists.edit({
        id: this.getGistId(),
        description: atom.config.get('sync-settings.gistDescription'),
        files: files
      }, function(err, res) {
        var SyntaxError, message;
        if (err) {
          console.error("error backing up data: " + err.message, err);
          try {
            message = JSON.parse(err.message).message;
            if (message === 'Not Found') {
              message = 'Gist ID Not Found';
            }
          } catch (error1) {
            SyntaxError = error1;
            message = err.message;
          }
          atom.notifications.addError("sync-settings: Error backing up your settings. (" + message + ")");
        } else {
          atom.config.set('sync-settings._lastBackupHash', res.history[0].version);
          atom.notifications.addSuccess("sync-settings: Your settings were successfully backed up. <br/><a href='" + res.html_url + "'>Click here to open your Gist.</a>");
        }
        return typeof cb === "function" ? cb(err, res) : void 0;
      });
    },
    viewBackup: function() {
      var Shell, gistId;
      Shell = require('shell');
      gistId = this.getGistId();
      return Shell.openExternal("https://gist.github.com/" + gistId);
    },
    getPackages: function() {
      var apmInstallSource, i, metadata, name, packages, ref1, theme, version;
      packages = [];
      ref1 = this._getAvailablePackageMetadataWithoutDuplicates();
      for (i in ref1) {
        metadata = ref1[i];
        name = metadata.name, version = metadata.version, theme = metadata.theme, apmInstallSource = metadata.apmInstallSource;
        packages.push({
          name: name,
          version: version,
          theme: theme,
          apmInstallSource: apmInstallSource
        });
      }
      return _.sortBy(packages, 'name');
    },
    _getAvailablePackageMetadataWithoutDuplicates: function() {
      var i, j, len, package_metadata, packages, path, path2metadata, pkg_name, pkg_path, ref1, ref2;
      path2metadata = {};
      package_metadata = atom.packages.getAvailablePackageMetadata();
      ref1 = atom.packages.getAvailablePackagePaths();
      for (i = j = 0, len = ref1.length; j < len; i = ++j) {
        path = ref1[i];
        path2metadata[fs.realpathSync(path)] = package_metadata[i];
      }
      packages = [];
      ref2 = atom.packages.getAvailablePackageNames();
      for (i in ref2) {
        pkg_name = ref2[i];
        pkg_path = atom.packages.resolvePackagePath(pkg_name);
        if (path2metadata[pkg_path]) {
          packages.push(path2metadata[pkg_path]);
        } else {
          console.error('could not correlate package name, path, and metadata');
        }
      }
      return packages;
    },
    restore: function(cb) {
      if (cb == null) {
        cb = null;
      }
      return this.createClient().gists.get({
        id: this.getGistId()
      }, (function(_this) {
        return function(err, res) {
          var SyntaxError, callbackAsync, e, file, filename, message, ref1, ref2;
          if (err) {
            console.error("error while retrieving the gist. does it exists?", err);
            try {
              message = JSON.parse(err.message).message;
              if (message === 'Not Found') {
                message = 'Gist ID Not Found';
              }
            } catch (error1) {
              SyntaxError = error1;
              message = err.message;
            }
            atom.notifications.addError("sync-settings: Error retrieving your settings. (" + message + ")");
            return;
          }
          ref1 = res.files;
          for (filename in ref1) {
            if (!hasProp.call(ref1, filename)) continue;
            file = ref1[filename];
            if (filename === 'settings.json' || filename === 'packages.json') {
              try {
                JSON.parse(file.content);
              } catch (error1) {
                e = error1;
                atom.notifications.addError("sync-settings: Error parsing the fetched JSON file '" + filename + "'. (" + e + ")");
                if (typeof cb === "function") {
                  cb();
                }
                return;
              }
            }
          }
          callbackAsync = false;
          ref2 = res.files;
          for (filename in ref2) {
            if (!hasProp.call(ref2, filename)) continue;
            file = ref2[filename];
            switch (filename) {
              case 'settings.json':
                if (atom.config.get('sync-settings.syncSettings')) {
                  _this.applySettings('', JSON.parse(file.content));
                }
                break;
              case 'packages.json':
                if (atom.config.get('sync-settings.syncPackages')) {
                  callbackAsync = true;
                  _this.installMissingPackages(JSON.parse(file.content), cb);
                  if (atom.config.get('sync-settings.removeObsoletePackages')) {
                    _this.removeObsoletePackages(JSON.parse(file.content), cb);
                  }
                }
                break;
              case 'keymap.cson':
                if (atom.config.get('sync-settings.syncKeymap')) {
                  fs.writeFileSync(atom.keymaps.getUserKeymapPath(), file.content);
                }
                break;
              case 'styles.less':
                if (atom.config.get('sync-settings.syncStyles')) {
                  fs.writeFileSync(atom.styles.getUserStyleSheetPath(), file.content);
                }
                break;
              case 'init.coffee':
                if (atom.config.get('sync-settings.syncInit')) {
                  fs.writeFileSync(atom.getConfigDirPath() + "/init.coffee", file.content);
                }
                break;
              case 'init.js':
                if (atom.config.get('sync-settings.syncInit')) {
                  fs.writeFileSync(atom.getConfigDirPath() + "/init.js", file.content);
                }
                break;
              case 'snippets.cson':
                if (atom.config.get('sync-settings.syncSnippets')) {
                  fs.writeFileSync(atom.getConfigDirPath() + "/snippets.cson", file.content);
                }
                break;
              default:
                fs.writeFileSync((atom.getConfigDirPath()) + "/" + filename, file.content);
            }
          }
          atom.config.set('sync-settings._lastBackupHash', res.history[0].version);
          atom.notifications.addSuccess("sync-settings: Your settings were successfully synchronized.");
          if (!callbackAsync) {
            return typeof cb === "function" ? cb() : void 0;
          }
        };
      })(this));
    },
    createClient: function() {
      var github, token;
      token = this.getPersonalAccessToken();
      if (token) {
        console.debug("Creating GitHubApi client with token = " + (token.substr(0, 4)) + "..." + (token.substr(-4, 4)));
      } else {
        console.debug("Creating GitHubApi client without token");
      }
      github = new GitHubApi({
        version: '3.0.0',
        protocol: 'https'
      });
      github.authenticate({
        type: 'oauth',
        token: token
      });
      return github;
    },
    getFilteredSettings: function() {
      var blacklistedKey, blacklistedKeys, j, len, ref1, settings;
      settings = JSON.parse(JSON.stringify(atom.config.settings));
      blacklistedKeys = REMOVE_KEYS.concat((ref1 = atom.config.get('sync-settings.blacklistedKeys')) != null ? ref1 : []);
      for (j = 0, len = blacklistedKeys.length; j < len; j++) {
        blacklistedKey = blacklistedKeys[j];
        blacklistedKey = blacklistedKey.split(".");
        this._removeProperty(settings, blacklistedKey);
      }
      return JSON.stringify(settings, null, '\t');
    },
    _removeProperty: function(obj, key) {
      var currentKey, lastKey;
      lastKey = key.length === 1;
      currentKey = key.shift();
      if (!lastKey && _.isObject(obj[currentKey]) && !_.isArray(obj[currentKey])) {
        return this._removeProperty(obj[currentKey], key);
      } else {
        return delete obj[currentKey];
      }
    },
    goToPackageSettings: function() {
      return atom.workspace.open("atom://config/packages/sync-settings");
    },
    applySettings: function(pref, settings) {
      var colorKeys, isColor, key, keyPath, results, value, valueKeys;
      results = [];
      for (key in settings) {
        value = settings[key];
        key = key.replace(/\./g, "\\.");
        keyPath = pref + "." + key;
        isColor = false;
        if (_.isObject(value)) {
          valueKeys = Object.keys(value);
          colorKeys = ['alpha', 'blue', 'green', 'red'];
          isColor = _.isEqual(_.sortBy(valueKeys), colorKeys);
        }
        if (_.isObject(value) && !_.isArray(value) && !isColor) {
          results.push(this.applySettings(keyPath, value));
        } else {
          console.debug("config.set " + keyPath.slice(1) + "=" + value);
          results.push(atom.config.set(keyPath.slice(1), value));
        }
      }
      return results;
    },
    removeObsoletePackages: function(remaining_packages, cb) {
      var concurrency, failed, i, installed_packages, j, k, keep_installed_package, len, notifications, obsolete_packages, p, pkg, ref1, removeNextPackage, results, succeeded;
      installed_packages = this.getPackages();
      obsolete_packages = [];
      for (j = 0, len = installed_packages.length; j < len; j++) {
        pkg = installed_packages[j];
        keep_installed_package = (function() {
          var k, len1, results;
          results = [];
          for (k = 0, len1 = remaining_packages.length; k < len1; k++) {
            p = remaining_packages[k];
            if (p.name === pkg.name) {
              results.push(p);
            }
          }
          return results;
        })();
        if (keep_installed_package.length === 0) {
          obsolete_packages.push(pkg);
        }
      }
      if (obsolete_packages.length === 0) {
        atom.notifications.addInfo("Sync-settings: no packages to remove");
        return typeof cb === "function" ? cb() : void 0;
      }
      notifications = {};
      succeeded = [];
      failed = [];
      removeNextPackage = (function(_this) {
        return function() {
          var count, failedStr, i;
          if (obsolete_packages.length > 0) {
            pkg = obsolete_packages.shift();
            i = succeeded.length + failed.length + Object.keys(notifications).length + 1;
            count = i + obsolete_packages.length;
            notifications[pkg.name] = atom.notifications.addInfo("Sync-settings: removing " + pkg.name + " (" + i + "/" + count + ")", {
              dismissable: true
            });
            return (function(pkg) {
              return _this.removePackage(pkg, function(error) {
                notifications[pkg.name].dismiss();
                delete notifications[pkg.name];
                if (error != null) {
                  failed.push(pkg.name);
                  atom.notifications.addWarning("Sync-settings: failed to remove " + pkg.name);
                } else {
                  succeeded.push(pkg.name);
                }
                return removeNextPackage();
              });
            })(pkg);
          } else if (Object.keys(notifications).length === 0) {
            if (failed.length === 0) {
              atom.notifications.addSuccess("Sync-settings: finished removing " + succeeded.length + " packages");
            } else {
              failed.sort();
              failedStr = failed.join(', ');
              atom.notifications.addWarning("Sync-settings: finished removing packages (" + failed.length + " failed: " + failedStr + ")", {
                dismissable: true
              });
            }
            return typeof cb === "function" ? cb() : void 0;
          }
        };
      })(this);
      concurrency = Math.min(obsolete_packages.length, 8);
      results = [];
      for (i = k = 0, ref1 = concurrency; 0 <= ref1 ? k < ref1 : k > ref1; i = 0 <= ref1 ? ++k : --k) {
        results.push(removeNextPackage());
      }
      return results;
    },
    removePackage: function(pack, cb) {
      var packageManager, type;
      type = pack.theme ? 'theme' : 'package';
      console.info("Removing " + type + " " + pack.name + "...");
      packageManager = new PackageManager();
      return packageManager.uninstall(pack, function(error) {
        var ref1;
        if (error != null) {
          console.error("Removing " + type + " " + pack.name + " failed", (ref1 = error.stack) != null ? ref1 : error, error.stderr);
        } else {
          console.info("Removing " + type + " " + pack.name);
        }
        return typeof cb === "function" ? cb(error) : void 0;
      });
    },
    installMissingPackages: function(packages, cb) {
      var available_package, available_packages, concurrency, failed, i, installNextPackage, j, k, len, missing_packages, notifications, p, pkg, ref1, results, succeeded;
      available_packages = this.getPackages();
      missing_packages = [];
      for (j = 0, len = packages.length; j < len; j++) {
        pkg = packages[j];
        available_package = (function() {
          var k, len1, results;
          results = [];
          for (k = 0, len1 = available_packages.length; k < len1; k++) {
            p = available_packages[k];
            if (p.name === pkg.name) {
              results.push(p);
            }
          }
          return results;
        })();
        if (available_package.length === 0) {
          missing_packages.push(pkg);
        } else if (!(!!pkg.apmInstallSource === !!available_package[0].apmInstallSource)) {
          missing_packages.push(pkg);
        }
      }
      if (missing_packages.length === 0) {
        atom.notifications.addInfo("Sync-settings: no packages to install");
        return typeof cb === "function" ? cb() : void 0;
      }
      notifications = {};
      succeeded = [];
      failed = [];
      installNextPackage = (function(_this) {
        return function() {
          var count, failedStr, i;
          if (missing_packages.length > 0) {
            pkg = missing_packages.shift();
            i = succeeded.length + failed.length + Object.keys(notifications).length + 1;
            count = i + missing_packages.length;
            notifications[pkg.name] = atom.notifications.addInfo("Sync-settings: installing " + pkg.name + " (" + i + "/" + count + ")", {
              dismissable: true
            });
            return (function(pkg) {
              return _this.installPackage(pkg, function(error) {
                notifications[pkg.name].dismiss();
                delete notifications[pkg.name];
                if (error != null) {
                  failed.push(pkg.name);
                  atom.notifications.addWarning("Sync-settings: failed to install " + pkg.name);
                } else {
                  succeeded.push(pkg.name);
                }
                return installNextPackage();
              });
            })(pkg);
          } else if (Object.keys(notifications).length === 0) {
            if (failed.length === 0) {
              atom.notifications.addSuccess("Sync-settings: finished installing " + succeeded.length + " packages");
            } else {
              failed.sort();
              failedStr = failed.join(', ');
              atom.notifications.addWarning("Sync-settings: finished installing packages (" + failed.length + " failed: " + failedStr + ")", {
                dismissable: true
              });
            }
            return typeof cb === "function" ? cb() : void 0;
          }
        };
      })(this);
      concurrency = Math.min(missing_packages.length, 8);
      results = [];
      for (i = k = 0, ref1 = concurrency; 0 <= ref1 ? k < ref1 : k > ref1; i = 0 <= ref1 ? ++k : --k) {
        results.push(installNextPackage());
      }
      return results;
    },
    installPackage: function(pack, cb) {
      var packageManager, type;
      type = pack.theme ? 'theme' : 'package';
      console.info("Installing " + type + " " + pack.name + "...");
      packageManager = new PackageManager();
      return packageManager.install(pack, function(error) {
        var ref1;
        if (error != null) {
          console.error("Installing " + type + " " + pack.name + " failed", (ref1 = error.stack) != null ? ref1 : error, error.stderr);
        } else {
          console.info("Installed " + type + " " + pack.name);
        }
        return typeof cb === "function" ? cb(error) : void 0;
      });
    },
    fileContent: function(filePath) {
      var e;
      try {
        return fs.readFileSync(filePath, {
          encoding: 'utf8'
        }) || null;
      } catch (error1) {
        e = error1;
        console.error("Error reading file " + filePath + ". Probably doesn't exist.", e);
        return null;
      }
    },
    inputForkGistId: function() {
      if (ForkGistIdInputView == null) {
        ForkGistIdInputView = require('./fork-gistid-input-view');
      }
      this.inputView = new ForkGistIdInputView();
      return this.inputView.setCallbackInstance(this);
    },
    forkGistId: function(forkId) {
      return this.createClient().gists.fork({
        id: forkId
      }, function(err, res) {
        var SyntaxError, message;
        if (err) {
          try {
            message = JSON.parse(err.message).message;
            if (message === "Not Found") {
              message = "Gist ID Not Found";
            }
          } catch (error1) {
            SyntaxError = error1;
            message = err.message;
          }
          atom.notifications.addError("sync-settings: Error forking settings. (" + message + ")");
          return typeof cb === "function" ? cb() : void 0;
        }
        if (res.id) {
          atom.config.set("sync-settings.gistId", res.id);
          atom.notifications.addSuccess("sync-settings: Forked successfully to the new Gist ID " + res.id + " which has been saved to your config.");
        } else {
          atom.notifications.addError("sync-settings: Error forking settings");
        }
        return typeof cb === "function" ? cb() : void 0;
      });
    }
  };

  module.exports = SyncSettings;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvc3luYy1zZXR0aW5ncy9saWIvc3luYy1zZXR0aW5ncy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7QUFBQSxNQUFBLG1IQUFBO0lBQUE7O0VBQUMsa0JBQW1CLE9BQUEsQ0FBUSxNQUFSOztFQUNwQixFQUFBLEdBQUssT0FBQSxDQUFRLElBQVI7O0VBQ0wsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUE4QixFQUE5QixFQUFDLGtCQUFELEVBQVk7O0VBQ1osbUJBQUEsR0FBc0I7O0VBR3RCLFdBQUEsR0FBYzs7RUFDZCxXQUFBLEdBQWMsQ0FDWixzQkFEWSxFQUVaLG1DQUZZLEVBR1osZ0NBSFksRUFJWiwrQkFKWTs7RUFPZCxZQUFBLEdBQ0U7SUFBQSxNQUFBLEVBQVEsT0FBQSxDQUFRLGlCQUFSLENBQVI7SUFFQSxRQUFBLEVBQVUsU0FBQTthQUVSLFlBQUEsQ0FBYSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7QUFFWCxjQUFBOztZQUFBLFlBQWEsT0FBQSxDQUFRLFFBQVI7OztZQUNiLGlCQUFrQixPQUFBLENBQVEsbUJBQVI7O1VBRWxCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0Msc0JBQXBDLEVBQTRELFNBQUE7bUJBQzFELEtBQUMsQ0FBQSxNQUFELENBQUE7VUFEMEQsQ0FBNUQ7VUFFQSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLHVCQUFwQyxFQUE2RCxTQUFBO21CQUMzRCxLQUFDLENBQUEsT0FBRCxDQUFBO1VBRDJELENBQTdEO1VBRUEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQywyQkFBcEMsRUFBaUUsU0FBQTttQkFDL0QsS0FBQyxDQUFBLFVBQUQsQ0FBQTtVQUQrRCxDQUFqRTtVQUVBLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0MsNEJBQXBDLEVBQWtFLFNBQUE7bUJBQ2hFLEtBQUMsQ0FBQSxjQUFELENBQUE7VUFEZ0UsQ0FBbEU7VUFFQSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLG9CQUFwQyxFQUEwRCxTQUFBO21CQUN4RCxLQUFDLENBQUEsZUFBRCxDQUFBO1VBRHdELENBQTFEO1VBR0Esd0JBQUEsR0FBMkIsS0FBQyxDQUFBLHNCQUFELENBQUE7VUFDM0IsSUFBcUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHFDQUFoQixDQUFBLElBQTJELHdCQUFoRjttQkFBQSxLQUFDLENBQUEsY0FBRCxDQUFBLEVBQUE7O1FBakJXO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFiO0lBRlEsQ0FGVjtJQXVCQSxVQUFBLEVBQVksU0FBQTtBQUNWLFVBQUE7bURBQVUsQ0FBRSxPQUFaLENBQUE7SUFEVSxDQXZCWjtJQTBCQSxTQUFBLEVBQVcsU0FBQSxHQUFBLENBMUJYO0lBNEJBLFNBQUEsRUFBVyxTQUFBO0FBQ1QsVUFBQTtNQUFBLE1BQUEsR0FBUyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0Isc0JBQWhCLENBQUEsSUFBMkMsT0FBTyxDQUFDLEdBQUcsQ0FBQztNQUNoRSxJQUFHLE1BQUg7UUFDRSxNQUFBLEdBQVMsTUFBTSxDQUFDLElBQVAsQ0FBQSxFQURYOztBQUVBLGFBQU87SUFKRSxDQTVCWDtJQWtDQSxzQkFBQSxFQUF3QixTQUFBO0FBQ3RCLFVBQUE7TUFBQSxLQUFBLEdBQVEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLG1DQUFoQixDQUFBLElBQXdELE9BQU8sQ0FBQyxHQUFHLENBQUM7TUFDNUUsSUFBRyxLQUFIO1FBQ0UsS0FBQSxHQUFRLEtBQUssQ0FBQyxJQUFOLENBQUEsRUFEVjs7QUFFQSxhQUFPO0lBSmUsQ0FsQ3hCO0lBd0NBLHNCQUFBLEVBQXdCLFNBQUE7QUFDdEIsVUFBQTtNQUFBLGVBQUEsR0FBa0I7TUFDbEIsSUFBRyxDQUFJLElBQUMsQ0FBQSxTQUFELENBQUEsQ0FBUDtRQUNFLGVBQWUsQ0FBQyxJQUFoQixDQUFxQixTQUFyQixFQURGOztNQUVBLElBQUcsQ0FBSSxJQUFDLENBQUEsc0JBQUQsQ0FBQSxDQUFQO1FBQ0UsZUFBZSxDQUFDLElBQWhCLENBQXFCLDhCQUFyQixFQURGOztNQUVBLElBQUcsZUFBZSxDQUFDLE1BQW5CO1FBQ0UsSUFBQyxDQUFBLDhCQUFELENBQWdDLGVBQWhDLEVBREY7O0FBRUEsYUFBTyxlQUFlLENBQUMsTUFBaEIsS0FBMEI7SUFSWCxDQXhDeEI7SUFrREEsY0FBQSxFQUFnQixTQUFDLEVBQUQ7O1FBQUMsS0FBRzs7TUFDbEIsSUFBRyxJQUFDLENBQUEsU0FBRCxDQUFBLENBQUg7UUFDRSxPQUFPLENBQUMsS0FBUixDQUFjLDJCQUFkO2VBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBQSxDQUFlLENBQUMsS0FBSyxDQUFDLEdBQXRCLENBQ0U7VUFBQSxFQUFBLEVBQUksSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFKO1NBREYsRUFFRSxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLEdBQUQsRUFBTSxHQUFOO0FBQ0EsZ0JBQUE7WUFBQSxJQUFHLEdBQUg7Y0FDRSxPQUFPLENBQUMsS0FBUixDQUFjLGtEQUFkLEVBQWtFLEdBQWxFO0FBQ0E7Z0JBQ0UsT0FBQSxHQUFVLElBQUksQ0FBQyxLQUFMLENBQVcsR0FBRyxDQUFDLE9BQWYsQ0FBdUIsQ0FBQztnQkFDbEMsSUFBaUMsT0FBQSxLQUFXLFdBQTVDO2tCQUFBLE9BQUEsR0FBVSxvQkFBVjtpQkFGRjtlQUFBLGNBQUE7Z0JBR007Z0JBQ0osT0FBQSxHQUFVLEdBQUcsQ0FBQyxRQUpoQjs7Y0FLQSxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQW5CLENBQTRCLGtEQUFBLEdBQW1ELE9BQW5ELEdBQTJELEdBQXZGO0FBQ0EsZ0RBQU8sY0FSVDs7WUFVQSxJQUFPLHlIQUFQO2NBQ0UsT0FBTyxDQUFDLEtBQVIsQ0FBYyw2QkFBZCxFQUE2QyxHQUE3QztjQUNBLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBbkIsQ0FBNEIsZ0RBQTVCO0FBQ0EsZ0RBQU8sY0FIVDs7WUFLQSxPQUFPLENBQUMsS0FBUixDQUFjLHdCQUFBLEdBQXlCLEdBQUcsQ0FBQyxPQUFRLENBQUEsQ0FBQSxDQUFFLENBQUMsT0FBdEQ7WUFDQSxJQUFHLEdBQUcsQ0FBQyxPQUFRLENBQUEsQ0FBQSxDQUFFLENBQUMsT0FBZixLQUE0QixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsK0JBQWhCLENBQS9CO2NBQ0UsS0FBQyxDQUFBLGlCQUFELENBQUEsRUFERjthQUFBLE1BRUssSUFBRyxDQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixnQ0FBaEIsQ0FBUDtjQUNILEtBQUMsQ0FBQSxvQkFBRCxDQUFBLEVBREc7OzhDQUdMO1VBdEJBO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUZGLEVBRkY7T0FBQSxNQUFBO2VBNEJFLElBQUMsQ0FBQSw4QkFBRCxDQUFnQyxDQUFDLFNBQUQsQ0FBaEMsRUE1QkY7O0lBRGMsQ0FsRGhCO0lBaUZBLGlCQUFBLEVBQW1CLFNBQUE7QUFFakIsVUFBQTtNQUFBLGdCQUFBLEdBQW1CLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixJQUFJLENBQUMsU0FBeEI7YUFDbkIsWUFBQSxHQUFlLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBbkIsQ0FBOEIsK0NBQTlCLEVBQ2I7UUFBQSxXQUFBLEVBQWEsSUFBYjtRQUNBLE9BQUEsRUFBUztVQUFDO1lBQ1IsSUFBQSxFQUFNLFFBREU7WUFFUixVQUFBLEVBQVksU0FBQTtjQUNWLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBZCxDQUF1QixnQkFBdkIsRUFBeUMsc0JBQXpDO3FCQUNBLFlBQVksQ0FBQyxPQUFiLENBQUE7WUFGVSxDQUZKO1dBQUQsRUFLTjtZQUNELElBQUEsRUFBTSxhQURMO1lBRUQsVUFBQSxFQUFZLFNBQUE7cUJBQ1YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFkLENBQXVCLGdCQUF2QixFQUF5QywyQkFBekM7WUFEVSxDQUZYO1dBTE0sRUFTTjtZQUNELElBQUEsRUFBTSxTQURMO1lBRUQsVUFBQSxFQUFZLFNBQUE7Y0FDVixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQWQsQ0FBdUIsZ0JBQXZCLEVBQXlDLHVCQUF6QztxQkFDQSxZQUFZLENBQUMsT0FBYixDQUFBO1lBRlUsQ0FGWDtXQVRNLEVBY047WUFDRCxJQUFBLEVBQU0sU0FETDtZQUVELFVBQUEsRUFBWSxTQUFBO3FCQUFHLFlBQVksQ0FBQyxPQUFiLENBQUE7WUFBSCxDQUZYO1dBZE07U0FEVDtPQURhO0lBSEUsQ0FqRm5CO0lBeUdBLG9CQUFBLEVBQXNCLFNBQUE7YUFDcEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFuQixDQUE4QixrREFBOUI7SUFEb0IsQ0F6R3RCO0lBNkdBLDhCQUFBLEVBQWdDLFNBQUMsZUFBRDtBQUM5QixVQUFBO01BQUEsT0FBQSxHQUFVO01BQ1YsUUFBQSxHQUFXLDZDQUFBLEdBQWdELGVBQWUsQ0FBQyxJQUFoQixDQUFxQixJQUFyQjthQUUzRCxZQUFBLEdBQWUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFuQixDQUE0QixRQUE1QixFQUNiO1FBQUEsV0FBQSxFQUFhLElBQWI7UUFDQSxPQUFBLEVBQVM7VUFBQztZQUNSLElBQUEsRUFBTSxrQkFERTtZQUVSLFVBQUEsRUFBWSxTQUFBO2NBQ1IsT0FBTyxDQUFDLG1CQUFSLENBQUE7cUJBQ0EsWUFBWSxDQUFDLE9BQWIsQ0FBQTtZQUZRLENBRko7V0FBRDtTQURUO09BRGE7SUFKZSxDQTdHaEM7SUEwSEEsTUFBQSxFQUFRLFNBQUMsRUFBRDtBQUNOLFVBQUE7O1FBRE8sS0FBRzs7TUFDVixLQUFBLEdBQVE7TUFDUixJQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiw0QkFBaEIsQ0FBSDtRQUNFLEtBQU0sQ0FBQSxlQUFBLENBQU4sR0FBeUI7VUFBQSxPQUFBLEVBQVMsSUFBQyxDQUFBLG1CQUFELENBQUEsQ0FBVDtVQUQzQjs7TUFFQSxJQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiw0QkFBaEIsQ0FBSDtRQUNFLEtBQU0sQ0FBQSxlQUFBLENBQU4sR0FBeUI7VUFBQSxPQUFBLEVBQVMsSUFBSSxDQUFDLFNBQUwsQ0FBZSxJQUFDLENBQUEsV0FBRCxDQUFBLENBQWYsRUFBK0IsSUFBL0IsRUFBcUMsSUFBckMsQ0FBVDtVQUQzQjs7TUFFQSxJQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiwwQkFBaEIsQ0FBSDtRQUNFLEtBQU0sQ0FBQSxhQUFBLENBQU4sR0FBdUI7VUFBQSxPQUFBLCtFQUEyRCwyQkFBM0Q7VUFEekI7O01BRUEsSUFBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsMEJBQWhCLENBQUg7UUFDRSxLQUFNLENBQUEsYUFBQSxDQUFOLEdBQXVCO1VBQUEsT0FBQSxrRkFBOEQsNEJBQTlEO1VBRHpCOztNQUVBLElBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHdCQUFoQixDQUFIO1FBQ0UsUUFBQSxHQUFXLElBQUksQ0FBQyxxQkFBTCxDQUFBO1FBQ1gsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSO1FBQ1AsS0FBTSxDQUFBLElBQUksQ0FBQyxRQUFMLENBQWMsUUFBZCxDQUFBLENBQU4sR0FBaUM7VUFBQSxPQUFBLHVEQUFtQyxtQ0FBbkM7VUFIbkM7O01BSUEsSUFBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsNEJBQWhCLENBQUg7UUFDRSxLQUFNLENBQUEsZUFBQSxDQUFOLEdBQXlCO1VBQUEsT0FBQSx5RkFBcUUsNkJBQXJFO1VBRDNCOztBQUdBO0FBQUEsV0FBQSxzQ0FBQTs7UUFDRSxHQUFBLEdBQU0sSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFJLENBQUMsV0FBTCxDQUFpQixHQUFqQixDQUFYLENBQWlDLENBQUMsV0FBbEMsQ0FBQTtRQUNOLFFBQUEsR0FBVztRQUNYLElBQW1CLEdBQUEsS0FBUSxPQUFSLElBQUEsR0FBQSxLQUFpQixPQUFqQixJQUFBLEdBQUEsS0FBMEIsS0FBN0M7VUFBQSxRQUFBLEdBQVcsS0FBWDs7UUFDQSxJQUFtQixHQUFBLEtBQVEsTUFBM0I7VUFBQSxRQUFBLEdBQVcsS0FBWDs7UUFDQSxNQUFBLEdBQVM7UUFDVCxJQUFpQixHQUFBLEtBQVEsTUFBekI7VUFBQSxNQUFBLEdBQVMsS0FBVDs7UUFDQSxLQUFNLENBQUEsSUFBQSxDQUFOLEdBQ0U7VUFBQSxPQUFBLHFGQUFrRSxRQUFELEdBQVUsR0FBVixHQUFhLElBQWIsR0FBa0IsZUFBbEIsR0FBaUMsTUFBbEc7O0FBUko7YUFVQSxJQUFDLENBQUEsWUFBRCxDQUFBLENBQWUsQ0FBQyxLQUFLLENBQUMsSUFBdEIsQ0FDRTtRQUFBLEVBQUEsRUFBSSxJQUFDLENBQUEsU0FBRCxDQUFBLENBQUo7UUFDQSxXQUFBLEVBQWEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLCtCQUFoQixDQURiO1FBRUEsS0FBQSxFQUFPLEtBRlA7T0FERixFQUlFLFNBQUMsR0FBRCxFQUFNLEdBQU47QUFDQSxZQUFBO1FBQUEsSUFBRyxHQUFIO1VBQ0UsT0FBTyxDQUFDLEtBQVIsQ0FBYyx5QkFBQSxHQUEwQixHQUFHLENBQUMsT0FBNUMsRUFBcUQsR0FBckQ7QUFDQTtZQUNFLE9BQUEsR0FBVSxJQUFJLENBQUMsS0FBTCxDQUFXLEdBQUcsQ0FBQyxPQUFmLENBQXVCLENBQUM7WUFDbEMsSUFBaUMsT0FBQSxLQUFXLFdBQTVDO2NBQUEsT0FBQSxHQUFVLG9CQUFWO2FBRkY7V0FBQSxjQUFBO1lBR007WUFDSixPQUFBLEdBQVUsR0FBRyxDQUFDLFFBSmhCOztVQUtBLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBbkIsQ0FBNEIsa0RBQUEsR0FBbUQsT0FBbkQsR0FBMkQsR0FBdkYsRUFQRjtTQUFBLE1BQUE7VUFTRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsK0JBQWhCLEVBQWlELEdBQUcsQ0FBQyxPQUFRLENBQUEsQ0FBQSxDQUFFLENBQUMsT0FBaEU7VUFDQSxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQW5CLENBQThCLDBFQUFBLEdBQTJFLEdBQUcsQ0FBQyxRQUEvRSxHQUF3RixxQ0FBdEgsRUFWRjs7MENBV0EsR0FBSSxLQUFLO01BWlQsQ0FKRjtJQTNCTSxDQTFIUjtJQXVLQSxVQUFBLEVBQVksU0FBQTtBQUNWLFVBQUE7TUFBQSxLQUFBLEdBQVEsT0FBQSxDQUFRLE9BQVI7TUFDUixNQUFBLEdBQVMsSUFBQyxDQUFBLFNBQUQsQ0FBQTthQUNULEtBQUssQ0FBQyxZQUFOLENBQW1CLDBCQUFBLEdBQTJCLE1BQTlDO0lBSFUsQ0F2S1o7SUE0S0EsV0FBQSxFQUFhLFNBQUE7QUFDWCxVQUFBO01BQUEsUUFBQSxHQUFXO0FBQ1g7QUFBQSxXQUFBLFNBQUE7O1FBQ0csb0JBQUQsRUFBTywwQkFBUCxFQUFnQixzQkFBaEIsRUFBdUI7UUFDdkIsUUFBUSxDQUFDLElBQVQsQ0FBYztVQUFDLE1BQUEsSUFBRDtVQUFPLFNBQUEsT0FBUDtVQUFnQixPQUFBLEtBQWhCO1VBQXVCLGtCQUFBLGdCQUF2QjtTQUFkO0FBRkY7YUFHQSxDQUFDLENBQUMsTUFBRixDQUFTLFFBQVQsRUFBbUIsTUFBbkI7SUFMVyxDQTVLYjtJQW1MQSw2Q0FBQSxFQUErQyxTQUFBO0FBQzdDLFVBQUE7TUFBQSxhQUFBLEdBQWdCO01BQ2hCLGdCQUFBLEdBQW1CLElBQUksQ0FBQyxRQUFRLENBQUMsMkJBQWQsQ0FBQTtBQUNuQjtBQUFBLFdBQUEsOENBQUE7O1FBQ0UsYUFBYyxDQUFBLEVBQUUsQ0FBQyxZQUFILENBQWdCLElBQWhCLENBQUEsQ0FBZCxHQUF1QyxnQkFBaUIsQ0FBQSxDQUFBO0FBRDFEO01BR0EsUUFBQSxHQUFXO0FBQ1g7QUFBQSxXQUFBLFNBQUE7O1FBQ0UsUUFBQSxHQUFXLElBQUksQ0FBQyxRQUFRLENBQUMsa0JBQWQsQ0FBaUMsUUFBakM7UUFDWCxJQUFHLGFBQWMsQ0FBQSxRQUFBLENBQWpCO1VBQ0UsUUFBUSxDQUFDLElBQVQsQ0FBYyxhQUFjLENBQUEsUUFBQSxDQUE1QixFQURGO1NBQUEsTUFBQTtVQUdFLE9BQU8sQ0FBQyxLQUFSLENBQWMsc0RBQWQsRUFIRjs7QUFGRjthQU1BO0lBYjZDLENBbkwvQztJQWtNQSxPQUFBLEVBQVMsU0FBQyxFQUFEOztRQUFDLEtBQUc7O2FBQ1gsSUFBQyxDQUFBLFlBQUQsQ0FBQSxDQUFlLENBQUMsS0FBSyxDQUFDLEdBQXRCLENBQ0U7UUFBQSxFQUFBLEVBQUksSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFKO09BREYsRUFFRSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsR0FBRCxFQUFNLEdBQU47QUFDQSxjQUFBO1VBQUEsSUFBRyxHQUFIO1lBQ0UsT0FBTyxDQUFDLEtBQVIsQ0FBYyxrREFBZCxFQUFrRSxHQUFsRTtBQUNBO2NBQ0UsT0FBQSxHQUFVLElBQUksQ0FBQyxLQUFMLENBQVcsR0FBRyxDQUFDLE9BQWYsQ0FBdUIsQ0FBQztjQUNsQyxJQUFpQyxPQUFBLEtBQVcsV0FBNUM7Z0JBQUEsT0FBQSxHQUFVLG9CQUFWO2VBRkY7YUFBQSxjQUFBO2NBR007Y0FDSixPQUFBLEdBQVUsR0FBRyxDQUFDLFFBSmhCOztZQUtBLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBbkIsQ0FBNEIsa0RBQUEsR0FBbUQsT0FBbkQsR0FBMkQsR0FBdkY7QUFDQSxtQkFSRjs7QUFXQTtBQUFBLGVBQUEsZ0JBQUE7OztZQUNFLElBQUcsUUFBQSxLQUFZLGVBQVosSUFBK0IsUUFBQSxLQUFZLGVBQTlDO0FBQ0U7Z0JBQ0UsSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFJLENBQUMsT0FBaEIsRUFERjtlQUFBLGNBQUE7Z0JBRU07Z0JBQ0osSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFuQixDQUE0QixzREFBQSxHQUF1RCxRQUF2RCxHQUFnRSxNQUFoRSxHQUF1RSxDQUF2RSxHQUF5RSxHQUFyRzs7a0JBQ0E7O0FBQ0EsdUJBTEY7ZUFERjs7QUFERjtVQVNBLGFBQUEsR0FBZ0I7QUFFaEI7QUFBQSxlQUFBLGdCQUFBOzs7QUFDRSxvQkFBTyxRQUFQO0FBQUEsbUJBQ08sZUFEUDtnQkFFSSxJQUErQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsNEJBQWhCLENBQS9DO2tCQUFBLEtBQUMsQ0FBQSxhQUFELENBQWUsRUFBZixFQUFtQixJQUFJLENBQUMsS0FBTCxDQUFXLElBQUksQ0FBQyxPQUFoQixDQUFuQixFQUFBOztBQURHO0FBRFAsbUJBSU8sZUFKUDtnQkFLSSxJQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiw0QkFBaEIsQ0FBSDtrQkFDRSxhQUFBLEdBQWdCO2tCQUNoQixLQUFDLENBQUEsc0JBQUQsQ0FBd0IsSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFJLENBQUMsT0FBaEIsQ0FBeEIsRUFBa0QsRUFBbEQ7a0JBQ0EsSUFBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0Isc0NBQWhCLENBQUg7b0JBQ0UsS0FBQyxDQUFBLHNCQUFELENBQXdCLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBSSxDQUFDLE9BQWhCLENBQXhCLEVBQWtELEVBQWxELEVBREY7bUJBSEY7O0FBREc7QUFKUCxtQkFXTyxhQVhQO2dCQVlJLElBQW1FLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiwwQkFBaEIsQ0FBbkU7a0JBQUEsRUFBRSxDQUFDLGFBQUgsQ0FBaUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBYixDQUFBLENBQWpCLEVBQW1ELElBQUksQ0FBQyxPQUF4RCxFQUFBOztBQURHO0FBWFAsbUJBY08sYUFkUDtnQkFlSSxJQUFzRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsMEJBQWhCLENBQXRFO2tCQUFBLEVBQUUsQ0FBQyxhQUFILENBQWlCLElBQUksQ0FBQyxNQUFNLENBQUMscUJBQVosQ0FBQSxDQUFqQixFQUFzRCxJQUFJLENBQUMsT0FBM0QsRUFBQTs7QUFERztBQWRQLG1CQWlCTyxhQWpCUDtnQkFrQkksSUFBMkUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHdCQUFoQixDQUEzRTtrQkFBQSxFQUFFLENBQUMsYUFBSCxDQUFpQixJQUFJLENBQUMsZ0JBQUwsQ0FBQSxDQUFBLEdBQTBCLGNBQTNDLEVBQTJELElBQUksQ0FBQyxPQUFoRSxFQUFBOztBQURHO0FBakJQLG1CQW9CTyxTQXBCUDtnQkFxQkksSUFBdUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHdCQUFoQixDQUF2RTtrQkFBQSxFQUFFLENBQUMsYUFBSCxDQUFpQixJQUFJLENBQUMsZ0JBQUwsQ0FBQSxDQUFBLEdBQTBCLFVBQTNDLEVBQXVELElBQUksQ0FBQyxPQUE1RCxFQUFBOztBQURHO0FBcEJQLG1CQXVCTyxlQXZCUDtnQkF3QkksSUFBNkUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLDRCQUFoQixDQUE3RTtrQkFBQSxFQUFFLENBQUMsYUFBSCxDQUFpQixJQUFJLENBQUMsZ0JBQUwsQ0FBQSxDQUFBLEdBQTBCLGdCQUEzQyxFQUE2RCxJQUFJLENBQUMsT0FBbEUsRUFBQTs7QUFERztBQXZCUDtnQkEwQk8sRUFBRSxDQUFDLGFBQUgsQ0FBbUIsQ0FBQyxJQUFJLENBQUMsZ0JBQUwsQ0FBQSxDQUFELENBQUEsR0FBeUIsR0FBekIsR0FBNEIsUUFBL0MsRUFBMkQsSUFBSSxDQUFDLE9BQWhFO0FBMUJQO0FBREY7VUE2QkEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLCtCQUFoQixFQUFpRCxHQUFHLENBQUMsT0FBUSxDQUFBLENBQUEsQ0FBRSxDQUFDLE9BQWhFO1VBRUEsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFuQixDQUE4Qiw4REFBOUI7VUFFQSxJQUFBLENBQWEsYUFBYjs4Q0FBQSxjQUFBOztRQXhEQTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FGRjtJQURPLENBbE1UO0lBK1BBLFlBQUEsRUFBYyxTQUFBO0FBQ1osVUFBQTtNQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsc0JBQUQsQ0FBQTtNQUVSLElBQUcsS0FBSDtRQUNFLE9BQU8sQ0FBQyxLQUFSLENBQWMseUNBQUEsR0FBeUMsQ0FBQyxLQUFLLENBQUMsTUFBTixDQUFhLENBQWIsRUFBZ0IsQ0FBaEIsQ0FBRCxDQUF6QyxHQUE2RCxLQUE3RCxHQUFpRSxDQUFDLEtBQUssQ0FBQyxNQUFOLENBQWEsQ0FBQyxDQUFkLEVBQWlCLENBQWpCLENBQUQsQ0FBL0UsRUFERjtPQUFBLE1BQUE7UUFHRSxPQUFPLENBQUMsS0FBUixDQUFjLHlDQUFkLEVBSEY7O01BS0EsTUFBQSxHQUFTLElBQUksU0FBSixDQUNQO1FBQUEsT0FBQSxFQUFTLE9BQVQ7UUFFQSxRQUFBLEVBQVUsT0FGVjtPQURPO01BSVQsTUFBTSxDQUFDLFlBQVAsQ0FDRTtRQUFBLElBQUEsRUFBTSxPQUFOO1FBQ0EsS0FBQSxFQUFPLEtBRFA7T0FERjthQUdBO0lBZlksQ0EvUGQ7SUFnUkEsbUJBQUEsRUFBcUIsU0FBQTtBQUVuQixVQUFBO01BQUEsUUFBQSxHQUFXLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBSSxDQUFDLFNBQUwsQ0FBZSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQTNCLENBQVg7TUFDWCxlQUFBLEdBQWtCLFdBQVcsQ0FBQyxNQUFaLDRFQUFzRSxFQUF0RTtBQUNsQixXQUFBLGlEQUFBOztRQUNFLGNBQUEsR0FBaUIsY0FBYyxDQUFDLEtBQWYsQ0FBcUIsR0FBckI7UUFDakIsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsUUFBakIsRUFBMkIsY0FBM0I7QUFGRjtBQUdBLGFBQU8sSUFBSSxDQUFDLFNBQUwsQ0FBZSxRQUFmLEVBQXlCLElBQXpCLEVBQStCLElBQS9CO0lBUFksQ0FoUnJCO0lBeVJBLGVBQUEsRUFBaUIsU0FBQyxHQUFELEVBQU0sR0FBTjtBQUNmLFVBQUE7TUFBQSxPQUFBLEdBQVUsR0FBRyxDQUFDLE1BQUosS0FBYztNQUN4QixVQUFBLEdBQWEsR0FBRyxDQUFDLEtBQUosQ0FBQTtNQUViLElBQUcsQ0FBSSxPQUFKLElBQWdCLENBQUMsQ0FBQyxRQUFGLENBQVcsR0FBSSxDQUFBLFVBQUEsQ0FBZixDQUFoQixJQUFnRCxDQUFJLENBQUMsQ0FBQyxPQUFGLENBQVUsR0FBSSxDQUFBLFVBQUEsQ0FBZCxDQUF2RDtlQUNFLElBQUMsQ0FBQSxlQUFELENBQWlCLEdBQUksQ0FBQSxVQUFBLENBQXJCLEVBQWtDLEdBQWxDLEVBREY7T0FBQSxNQUFBO2VBR0UsT0FBTyxHQUFJLENBQUEsVUFBQSxFQUhiOztJQUplLENBelJqQjtJQWtTQSxtQkFBQSxFQUFxQixTQUFBO2FBQ25CLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBZixDQUFvQixzQ0FBcEI7SUFEbUIsQ0FsU3JCO0lBcVNBLGFBQUEsRUFBZSxTQUFDLElBQUQsRUFBTyxRQUFQO0FBQ2IsVUFBQTtBQUFBO1dBQUEsZUFBQTs7UUFDRSxHQUFBLEdBQU0sR0FBRyxDQUFDLE9BQUosQ0FBWSxLQUFaLEVBQW1CLEtBQW5CO1FBQ04sT0FBQSxHQUFhLElBQUQsR0FBTSxHQUFOLEdBQVM7UUFDckIsT0FBQSxHQUFVO1FBQ1YsSUFBRyxDQUFDLENBQUMsUUFBRixDQUFXLEtBQVgsQ0FBSDtVQUNFLFNBQUEsR0FBWSxNQUFNLENBQUMsSUFBUCxDQUFZLEtBQVo7VUFDWixTQUFBLEdBQVksQ0FBQyxPQUFELEVBQVUsTUFBVixFQUFrQixPQUFsQixFQUEyQixLQUEzQjtVQUNaLE9BQUEsR0FBVSxDQUFDLENBQUMsT0FBRixDQUFVLENBQUMsQ0FBQyxNQUFGLENBQVMsU0FBVCxDQUFWLEVBQStCLFNBQS9CLEVBSFo7O1FBSUEsSUFBRyxDQUFDLENBQUMsUUFBRixDQUFXLEtBQVgsQ0FBQSxJQUFzQixDQUFJLENBQUMsQ0FBQyxPQUFGLENBQVUsS0FBVixDQUExQixJQUErQyxDQUFJLE9BQXREO3VCQUNFLElBQUMsQ0FBQSxhQUFELENBQWUsT0FBZixFQUF3QixLQUF4QixHQURGO1NBQUEsTUFBQTtVQUdFLE9BQU8sQ0FBQyxLQUFSLENBQWMsYUFBQSxHQUFjLE9BQVEsU0FBdEIsR0FBNEIsR0FBNUIsR0FBK0IsS0FBN0M7dUJBQ0EsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLE9BQVEsU0FBeEIsRUFBK0IsS0FBL0IsR0FKRjs7QUFSRjs7SUFEYSxDQXJTZjtJQW9UQSxzQkFBQSxFQUF3QixTQUFDLGtCQUFELEVBQXFCLEVBQXJCO0FBQ3RCLFVBQUE7TUFBQSxrQkFBQSxHQUFxQixJQUFDLENBQUEsV0FBRCxDQUFBO01BQ3JCLGlCQUFBLEdBQW9CO0FBQ3BCLFdBQUEsb0RBQUE7O1FBQ0Usc0JBQUE7O0FBQTBCO2VBQUEsc0RBQUE7O2dCQUFtQyxDQUFDLENBQUMsSUFBRixLQUFVLEdBQUcsQ0FBQzsyQkFBakQ7O0FBQUE7OztRQUMxQixJQUFHLHNCQUFzQixDQUFDLE1BQXZCLEtBQWlDLENBQXBDO1VBQ0UsaUJBQWlCLENBQUMsSUFBbEIsQ0FBdUIsR0FBdkIsRUFERjs7QUFGRjtNQUlBLElBQUcsaUJBQWlCLENBQUMsTUFBbEIsS0FBNEIsQ0FBL0I7UUFDRSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQW5CLENBQTJCLHNDQUEzQjtBQUNBLDBDQUFPLGNBRlQ7O01BSUEsYUFBQSxHQUFnQjtNQUNoQixTQUFBLEdBQVk7TUFDWixNQUFBLEdBQVM7TUFDVCxpQkFBQSxHQUFvQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7QUFDbEIsY0FBQTtVQUFBLElBQUcsaUJBQWlCLENBQUMsTUFBbEIsR0FBMkIsQ0FBOUI7WUFFRSxHQUFBLEdBQU0saUJBQWlCLENBQUMsS0FBbEIsQ0FBQTtZQUNOLENBQUEsR0FBSSxTQUFTLENBQUMsTUFBVixHQUFtQixNQUFNLENBQUMsTUFBMUIsR0FBbUMsTUFBTSxDQUFDLElBQVAsQ0FBWSxhQUFaLENBQTBCLENBQUMsTUFBOUQsR0FBdUU7WUFDM0UsS0FBQSxHQUFRLENBQUEsR0FBSSxpQkFBaUIsQ0FBQztZQUM5QixhQUFjLENBQUEsR0FBRyxDQUFDLElBQUosQ0FBZCxHQUEwQixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQW5CLENBQTJCLDBCQUFBLEdBQTJCLEdBQUcsQ0FBQyxJQUEvQixHQUFvQyxJQUFwQyxHQUF3QyxDQUF4QyxHQUEwQyxHQUExQyxHQUE2QyxLQUE3QyxHQUFtRCxHQUE5RSxFQUFrRjtjQUFDLFdBQUEsRUFBYSxJQUFkO2FBQWxGO21CQUN2QixDQUFBLFNBQUMsR0FBRDtxQkFDRCxLQUFDLENBQUEsYUFBRCxDQUFlLEdBQWYsRUFBb0IsU0FBQyxLQUFEO2dCQUVsQixhQUFjLENBQUEsR0FBRyxDQUFDLElBQUosQ0FBUyxDQUFDLE9BQXhCLENBQUE7Z0JBQ0EsT0FBTyxhQUFjLENBQUEsR0FBRyxDQUFDLElBQUo7Z0JBQ3JCLElBQUcsYUFBSDtrQkFDRSxNQUFNLENBQUMsSUFBUCxDQUFZLEdBQUcsQ0FBQyxJQUFoQjtrQkFDQSxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQW5CLENBQThCLGtDQUFBLEdBQW1DLEdBQUcsQ0FBQyxJQUFyRSxFQUZGO2lCQUFBLE1BQUE7a0JBSUUsU0FBUyxDQUFDLElBQVYsQ0FBZSxHQUFHLENBQUMsSUFBbkIsRUFKRjs7dUJBTUEsaUJBQUEsQ0FBQTtjQVZrQixDQUFwQjtZQURDLENBQUEsQ0FBSCxDQUFJLEdBQUosRUFORjtXQUFBLE1Ba0JLLElBQUcsTUFBTSxDQUFDLElBQVAsQ0FBWSxhQUFaLENBQTBCLENBQUMsTUFBM0IsS0FBcUMsQ0FBeEM7WUFFSCxJQUFHLE1BQU0sQ0FBQyxNQUFQLEtBQWlCLENBQXBCO2NBQ0UsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFuQixDQUE4QixtQ0FBQSxHQUFvQyxTQUFTLENBQUMsTUFBOUMsR0FBcUQsV0FBbkYsRUFERjthQUFBLE1BQUE7Y0FHRSxNQUFNLENBQUMsSUFBUCxDQUFBO2NBQ0EsU0FBQSxHQUFZLE1BQU0sQ0FBQyxJQUFQLENBQVksSUFBWjtjQUNaLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBbkIsQ0FBOEIsNkNBQUEsR0FBOEMsTUFBTSxDQUFDLE1BQXJELEdBQTRELFdBQTVELEdBQXVFLFNBQXZFLEdBQWlGLEdBQS9HLEVBQW1IO2dCQUFDLFdBQUEsRUFBYSxJQUFkO2VBQW5ILEVBTEY7OzhDQU1BLGNBUkc7O1FBbkJhO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtNQTZCcEIsV0FBQSxHQUFjLElBQUksQ0FBQyxHQUFMLENBQVMsaUJBQWlCLENBQUMsTUFBM0IsRUFBbUMsQ0FBbkM7QUFDZDtXQUFTLHlGQUFUO3FCQUNFLGlCQUFBLENBQUE7QUFERjs7SUE1Q3NCLENBcFR4QjtJQW1XQSxhQUFBLEVBQWUsU0FBQyxJQUFELEVBQU8sRUFBUDtBQUNiLFVBQUE7TUFBQSxJQUFBLEdBQVUsSUFBSSxDQUFDLEtBQVIsR0FBbUIsT0FBbkIsR0FBZ0M7TUFDdkMsT0FBTyxDQUFDLElBQVIsQ0FBYSxXQUFBLEdBQVksSUFBWixHQUFpQixHQUFqQixHQUFvQixJQUFJLENBQUMsSUFBekIsR0FBOEIsS0FBM0M7TUFDQSxjQUFBLEdBQWlCLElBQUksY0FBSixDQUFBO2FBQ2pCLGNBQWMsQ0FBQyxTQUFmLENBQXlCLElBQXpCLEVBQStCLFNBQUMsS0FBRDtBQUM3QixZQUFBO1FBQUEsSUFBRyxhQUFIO1VBQ0UsT0FBTyxDQUFDLEtBQVIsQ0FBYyxXQUFBLEdBQVksSUFBWixHQUFpQixHQUFqQixHQUFvQixJQUFJLENBQUMsSUFBekIsR0FBOEIsU0FBNUMsd0NBQW9FLEtBQXBFLEVBQTJFLEtBQUssQ0FBQyxNQUFqRixFQURGO1NBQUEsTUFBQTtVQUdFLE9BQU8sQ0FBQyxJQUFSLENBQWEsV0FBQSxHQUFZLElBQVosR0FBaUIsR0FBakIsR0FBb0IsSUFBSSxDQUFDLElBQXRDLEVBSEY7OzBDQUlBLEdBQUk7TUFMeUIsQ0FBL0I7SUFKYSxDQW5XZjtJQThXQSxzQkFBQSxFQUF3QixTQUFDLFFBQUQsRUFBVyxFQUFYO0FBQ3RCLFVBQUE7TUFBQSxrQkFBQSxHQUFxQixJQUFDLENBQUEsV0FBRCxDQUFBO01BQ3JCLGdCQUFBLEdBQW1CO0FBQ25CLFdBQUEsMENBQUE7O1FBQ0UsaUJBQUE7O0FBQXFCO2VBQUEsc0RBQUE7O2dCQUFtQyxDQUFDLENBQUMsSUFBRixLQUFVLEdBQUcsQ0FBQzsyQkFBakQ7O0FBQUE7OztRQUNyQixJQUFHLGlCQUFpQixDQUFDLE1BQWxCLEtBQTRCLENBQS9CO1VBRUUsZ0JBQWdCLENBQUMsSUFBakIsQ0FBc0IsR0FBdEIsRUFGRjtTQUFBLE1BR0ssSUFBRyxDQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxnQkFBTixLQUEwQixDQUFDLENBQUMsaUJBQWtCLENBQUEsQ0FBQSxDQUFFLENBQUMsZ0JBQWxELENBQU47VUFFSCxnQkFBZ0IsQ0FBQyxJQUFqQixDQUFzQixHQUF0QixFQUZHOztBQUxQO01BUUEsSUFBRyxnQkFBZ0IsQ0FBQyxNQUFqQixLQUEyQixDQUE5QjtRQUNFLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBbkIsQ0FBMkIsdUNBQTNCO0FBQ0EsMENBQU8sY0FGVDs7TUFJQSxhQUFBLEdBQWdCO01BQ2hCLFNBQUEsR0FBWTtNQUNaLE1BQUEsR0FBUztNQUNULGtCQUFBLEdBQXFCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtBQUNuQixjQUFBO1VBQUEsSUFBRyxnQkFBZ0IsQ0FBQyxNQUFqQixHQUEwQixDQUE3QjtZQUVFLEdBQUEsR0FBTSxnQkFBZ0IsQ0FBQyxLQUFqQixDQUFBO1lBQ04sQ0FBQSxHQUFJLFNBQVMsQ0FBQyxNQUFWLEdBQW1CLE1BQU0sQ0FBQyxNQUExQixHQUFtQyxNQUFNLENBQUMsSUFBUCxDQUFZLGFBQVosQ0FBMEIsQ0FBQyxNQUE5RCxHQUF1RTtZQUMzRSxLQUFBLEdBQVEsQ0FBQSxHQUFJLGdCQUFnQixDQUFDO1lBQzdCLGFBQWMsQ0FBQSxHQUFHLENBQUMsSUFBSixDQUFkLEdBQTBCLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBbkIsQ0FBMkIsNEJBQUEsR0FBNkIsR0FBRyxDQUFDLElBQWpDLEdBQXNDLElBQXRDLEdBQTBDLENBQTFDLEdBQTRDLEdBQTVDLEdBQStDLEtBQS9DLEdBQXFELEdBQWhGLEVBQW9GO2NBQUMsV0FBQSxFQUFhLElBQWQ7YUFBcEY7bUJBQ3ZCLENBQUEsU0FBQyxHQUFEO3FCQUNELEtBQUMsQ0FBQSxjQUFELENBQWdCLEdBQWhCLEVBQXFCLFNBQUMsS0FBRDtnQkFFbkIsYUFBYyxDQUFBLEdBQUcsQ0FBQyxJQUFKLENBQVMsQ0FBQyxPQUF4QixDQUFBO2dCQUNBLE9BQU8sYUFBYyxDQUFBLEdBQUcsQ0FBQyxJQUFKO2dCQUNyQixJQUFHLGFBQUg7a0JBQ0UsTUFBTSxDQUFDLElBQVAsQ0FBWSxHQUFHLENBQUMsSUFBaEI7a0JBQ0EsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFuQixDQUE4QixtQ0FBQSxHQUFvQyxHQUFHLENBQUMsSUFBdEUsRUFGRjtpQkFBQSxNQUFBO2tCQUlFLFNBQVMsQ0FBQyxJQUFWLENBQWUsR0FBRyxDQUFDLElBQW5CLEVBSkY7O3VCQU1BLGtCQUFBLENBQUE7Y0FWbUIsQ0FBckI7WUFEQyxDQUFBLENBQUgsQ0FBSSxHQUFKLEVBTkY7V0FBQSxNQWtCSyxJQUFHLE1BQU0sQ0FBQyxJQUFQLENBQVksYUFBWixDQUEwQixDQUFDLE1BQTNCLEtBQXFDLENBQXhDO1lBRUgsSUFBRyxNQUFNLENBQUMsTUFBUCxLQUFpQixDQUFwQjtjQUNFLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBbkIsQ0FBOEIscUNBQUEsR0FBc0MsU0FBUyxDQUFDLE1BQWhELEdBQXVELFdBQXJGLEVBREY7YUFBQSxNQUFBO2NBR0UsTUFBTSxDQUFDLElBQVAsQ0FBQTtjQUNBLFNBQUEsR0FBWSxNQUFNLENBQUMsSUFBUCxDQUFZLElBQVo7Y0FDWixJQUFJLENBQUMsYUFBYSxDQUFDLFVBQW5CLENBQThCLCtDQUFBLEdBQWdELE1BQU0sQ0FBQyxNQUF2RCxHQUE4RCxXQUE5RCxHQUF5RSxTQUF6RSxHQUFtRixHQUFqSCxFQUFxSDtnQkFBQyxXQUFBLEVBQWEsSUFBZDtlQUFySCxFQUxGOzs4Q0FNQSxjQVJHOztRQW5CYztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUE7TUE2QnJCLFdBQUEsR0FBYyxJQUFJLENBQUMsR0FBTCxDQUFTLGdCQUFnQixDQUFDLE1BQTFCLEVBQWtDLENBQWxDO0FBQ2Q7V0FBUyx5RkFBVDtxQkFDRSxrQkFBQSxDQUFBO0FBREY7O0lBaERzQixDQTlXeEI7SUFpYUEsY0FBQSxFQUFnQixTQUFDLElBQUQsRUFBTyxFQUFQO0FBQ2QsVUFBQTtNQUFBLElBQUEsR0FBVSxJQUFJLENBQUMsS0FBUixHQUFtQixPQUFuQixHQUFnQztNQUN2QyxPQUFPLENBQUMsSUFBUixDQUFhLGFBQUEsR0FBYyxJQUFkLEdBQW1CLEdBQW5CLEdBQXNCLElBQUksQ0FBQyxJQUEzQixHQUFnQyxLQUE3QztNQUNBLGNBQUEsR0FBaUIsSUFBSSxjQUFKLENBQUE7YUFDakIsY0FBYyxDQUFDLE9BQWYsQ0FBdUIsSUFBdkIsRUFBNkIsU0FBQyxLQUFEO0FBQzNCLFlBQUE7UUFBQSxJQUFHLGFBQUg7VUFDRSxPQUFPLENBQUMsS0FBUixDQUFjLGFBQUEsR0FBYyxJQUFkLEdBQW1CLEdBQW5CLEdBQXNCLElBQUksQ0FBQyxJQUEzQixHQUFnQyxTQUE5Qyx3Q0FBc0UsS0FBdEUsRUFBNkUsS0FBSyxDQUFDLE1BQW5GLEVBREY7U0FBQSxNQUFBO1VBR0UsT0FBTyxDQUFDLElBQVIsQ0FBYSxZQUFBLEdBQWEsSUFBYixHQUFrQixHQUFsQixHQUFxQixJQUFJLENBQUMsSUFBdkMsRUFIRjs7MENBSUEsR0FBSTtNQUx1QixDQUE3QjtJQUpjLENBamFoQjtJQTRhQSxXQUFBLEVBQWEsU0FBQyxRQUFEO0FBQ1gsVUFBQTtBQUFBO0FBQ0UsZUFBTyxFQUFFLENBQUMsWUFBSCxDQUFnQixRQUFoQixFQUEwQjtVQUFDLFFBQUEsRUFBVSxNQUFYO1NBQTFCLENBQUEsSUFBaUQsS0FEMUQ7T0FBQSxjQUFBO1FBRU07UUFDSixPQUFPLENBQUMsS0FBUixDQUFjLHFCQUFBLEdBQXNCLFFBQXRCLEdBQStCLDJCQUE3QyxFQUF5RSxDQUF6RTtlQUNBLEtBSkY7O0lBRFcsQ0E1YWI7SUFtYkEsZUFBQSxFQUFpQixTQUFBOztRQUNmLHNCQUF1QixPQUFBLENBQVEsMEJBQVI7O01BQ3ZCLElBQUMsQ0FBQSxTQUFELEdBQWEsSUFBSSxtQkFBSixDQUFBO2FBQ2IsSUFBQyxDQUFBLFNBQVMsQ0FBQyxtQkFBWCxDQUErQixJQUEvQjtJQUhlLENBbmJqQjtJQXdiQSxVQUFBLEVBQVksU0FBQyxNQUFEO2FBQ1YsSUFBQyxDQUFBLFlBQUQsQ0FBQSxDQUFlLENBQUMsS0FBSyxDQUFDLElBQXRCLENBQ0U7UUFBQSxFQUFBLEVBQUksTUFBSjtPQURGLEVBRUUsU0FBQyxHQUFELEVBQU0sR0FBTjtBQUNBLFlBQUE7UUFBQSxJQUFHLEdBQUg7QUFDRTtZQUNFLE9BQUEsR0FBVSxJQUFJLENBQUMsS0FBTCxDQUFXLEdBQUcsQ0FBQyxPQUFmLENBQXVCLENBQUM7WUFDbEMsSUFBaUMsT0FBQSxLQUFXLFdBQTVDO2NBQUEsT0FBQSxHQUFVLG9CQUFWO2FBRkY7V0FBQSxjQUFBO1lBR007WUFDSixPQUFBLEdBQVUsR0FBRyxDQUFDLFFBSmhCOztVQUtBLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBbkIsQ0FBNEIsMENBQUEsR0FBMkMsT0FBM0MsR0FBbUQsR0FBL0U7QUFDQSw0Q0FBTyxjQVBUOztRQVNBLElBQUcsR0FBRyxDQUFDLEVBQVA7VUFDRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0Isc0JBQWhCLEVBQXdDLEdBQUcsQ0FBQyxFQUE1QztVQUNBLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBbkIsQ0FBOEIsd0RBQUEsR0FBMkQsR0FBRyxDQUFDLEVBQS9ELEdBQW9FLHVDQUFsRyxFQUZGO1NBQUEsTUFBQTtVQUlFLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBbkIsQ0FBNEIsdUNBQTVCLEVBSkY7OzBDQU1BO01BaEJBLENBRkY7SUFEVSxDQXhiWjs7O0VBNmNGLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBN2RqQiIsInNvdXJjZXNDb250ZW50IjpbIiMgaW1wb3J0c1xue0J1ZmZlcmVkUHJvY2Vzc30gPSByZXF1aXJlICdhdG9tJ1xuZnMgPSByZXF1aXJlICdmcydcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5bR2l0SHViQXBpLCBQYWNrYWdlTWFuYWdlcl0gPSBbXVxuRm9ya0dpc3RJZElucHV0VmlldyA9IG51bGxcblxuIyBjb25zdGFudHNcbkRFU0NSSVBUSU9OID0gJ0F0b20gY29uZmlndXJhdGlvbiBzdG9yYWdlIG9wZXJhdGVkIGJ5IGh0dHA6Ly9hdG9tLmlvL3BhY2thZ2VzL3N5bmMtc2V0dGluZ3MnXG5SRU1PVkVfS0VZUyA9IFtcbiAgJ3N5bmMtc2V0dGluZ3MuZ2lzdElkJyxcbiAgJ3N5bmMtc2V0dGluZ3MucGVyc29uYWxBY2Nlc3NUb2tlbicsXG4gICdzeW5jLXNldHRpbmdzLl9hbmFseXRpY3NVc2VySWQnLCAgIyBrZWVwIGxlZ2FjeSBrZXkgaW4gYmxhY2tsaXN0XG4gICdzeW5jLXNldHRpbmdzLl9sYXN0QmFja3VwSGFzaCcsXG5dXG5cblN5bmNTZXR0aW5ncyA9XG4gIGNvbmZpZzogcmVxdWlyZSgnLi9jb25maWcuY29mZmVlJylcblxuICBhY3RpdmF0ZTogLT5cbiAgICAjIHNwZWVkdXAgYWN0aXZhdGlvbiBieSBhc3luYyBpbml0aWFsaXppbmdcbiAgICBzZXRJbW1lZGlhdGUgPT5cbiAgICAgICMgYWN0dWFsIGluaXRpYWxpemF0aW9uIGFmdGVyIGF0b20gaGFzIGxvYWRlZFxuICAgICAgR2l0SHViQXBpID89IHJlcXVpcmUgJ2dpdGh1YidcbiAgICAgIFBhY2thZ2VNYW5hZ2VyID89IHJlcXVpcmUgJy4vcGFja2FnZS1tYW5hZ2VyJ1xuXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCBcInN5bmMtc2V0dGluZ3M6YmFja3VwXCIsID0+XG4gICAgICAgIEBiYWNrdXAoKVxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgXCJzeW5jLXNldHRpbmdzOnJlc3RvcmVcIiwgPT5cbiAgICAgICAgQHJlc3RvcmUoKVxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgXCJzeW5jLXNldHRpbmdzOnZpZXctYmFja3VwXCIsID0+XG4gICAgICAgIEB2aWV3QmFja3VwKClcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsIFwic3luYy1zZXR0aW5nczpjaGVjay1iYWNrdXBcIiwgPT5cbiAgICAgICAgQGNoZWNrRm9yVXBkYXRlKClcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsIFwic3luYy1zZXR0aW5nczpmb3JrXCIsID0+XG4gICAgICAgIEBpbnB1dEZvcmtHaXN0SWQoKVxuXG4gICAgICBtYW5kYXRvcnlTZXR0aW5nc0FwcGxpZWQgPSBAY2hlY2tNYW5kYXRvcnlTZXR0aW5ncygpXG4gICAgICBAY2hlY2tGb3JVcGRhdGUoKSBpZiBhdG9tLmNvbmZpZy5nZXQoJ3N5bmMtc2V0dGluZ3MuY2hlY2tGb3JVcGRhdGVkQmFja3VwJykgYW5kIG1hbmRhdG9yeVNldHRpbmdzQXBwbGllZFxuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgQGlucHV0Vmlldz8uZGVzdHJveSgpXG5cbiAgc2VyaWFsaXplOiAtPlxuXG4gIGdldEdpc3RJZDogLT5cbiAgICBnaXN0SWQgPSBhdG9tLmNvbmZpZy5nZXQoJ3N5bmMtc2V0dGluZ3MuZ2lzdElkJykgb3IgcHJvY2Vzcy5lbnYuR0lTVF9JRFxuICAgIGlmIGdpc3RJZFxuICAgICAgZ2lzdElkID0gZ2lzdElkLnRyaW0oKVxuICAgIHJldHVybiBnaXN0SWRcblxuICBnZXRQZXJzb25hbEFjY2Vzc1Rva2VuOiAtPlxuICAgIHRva2VuID0gYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLnBlcnNvbmFsQWNjZXNzVG9rZW4nKSBvciBwcm9jZXNzLmVudi5HSVRIVUJfVE9LRU5cbiAgICBpZiB0b2tlblxuICAgICAgdG9rZW4gPSB0b2tlbi50cmltKClcbiAgICByZXR1cm4gdG9rZW5cblxuICBjaGVja01hbmRhdG9yeVNldHRpbmdzOiAtPlxuICAgIG1pc3NpbmdTZXR0aW5ncyA9IFtdXG4gICAgaWYgbm90IEBnZXRHaXN0SWQoKVxuICAgICAgbWlzc2luZ1NldHRpbmdzLnB1c2goXCJHaXN0IElEXCIpXG4gICAgaWYgbm90IEBnZXRQZXJzb25hbEFjY2Vzc1Rva2VuKClcbiAgICAgIG1pc3NpbmdTZXR0aW5ncy5wdXNoKFwiR2l0SHViIHBlcnNvbmFsIGFjY2VzcyB0b2tlblwiKVxuICAgIGlmIG1pc3NpbmdTZXR0aW5ncy5sZW5ndGhcbiAgICAgIEBub3RpZnlNaXNzaW5nTWFuZGF0b3J5U2V0dGluZ3MobWlzc2luZ1NldHRpbmdzKVxuICAgIHJldHVybiBtaXNzaW5nU2V0dGluZ3MubGVuZ3RoIGlzIDBcblxuICBjaGVja0ZvclVwZGF0ZTogKGNiPW51bGwpIC0+XG4gICAgaWYgQGdldEdpc3RJZCgpXG4gICAgICBjb25zb2xlLmRlYnVnKCdjaGVja2luZyBsYXRlc3QgYmFja3VwLi4uJylcbiAgICAgIEBjcmVhdGVDbGllbnQoKS5naXN0cy5nZXRcbiAgICAgICAgaWQ6IEBnZXRHaXN0SWQoKVxuICAgICAgLCAoZXJyLCByZXMpID0+XG4gICAgICAgIGlmIGVyclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IgXCJlcnJvciB3aGlsZSByZXRyaWV2aW5nIHRoZSBnaXN0LiBkb2VzIGl0IGV4aXN0cz9cIiwgZXJyXG4gICAgICAgICAgdHJ5XG4gICAgICAgICAgICBtZXNzYWdlID0gSlNPTi5wYXJzZShlcnIubWVzc2FnZSkubWVzc2FnZVxuICAgICAgICAgICAgbWVzc2FnZSA9ICdHaXN0IElEIE5vdCBGb3VuZCcgaWYgbWVzc2FnZSBpcyAnTm90IEZvdW5kJ1xuICAgICAgICAgIGNhdGNoIFN5bnRheEVycm9yXG4gICAgICAgICAgICBtZXNzYWdlID0gZXJyLm1lc3NhZ2VcbiAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJzeW5jLXNldHRpbmdzOiBFcnJvciByZXRyaWV2aW5nIHlvdXIgc2V0dGluZ3MuIChcIittZXNzYWdlK1wiKVwiXG4gICAgICAgICAgcmV0dXJuIGNiPygpXG5cbiAgICAgICAgaWYgbm90IHJlcz8uaGlzdG9yeT9bMF0/LnZlcnNpb24/XG4gICAgICAgICAgY29uc29sZS5lcnJvciBcImNvdWxkIG5vdCBpbnRlcnByZXQgcmVzdWx0OlwiLCByZXNcbiAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJzeW5jLXNldHRpbmdzOiBFcnJvciByZXRyaWV2aW5nIHlvdXIgc2V0dGluZ3MuXCJcbiAgICAgICAgICByZXR1cm4gY2I/KClcblxuICAgICAgICBjb25zb2xlLmRlYnVnKFwibGF0ZXN0IGJhY2t1cCB2ZXJzaW9uICN7cmVzLmhpc3RvcnlbMF0udmVyc2lvbn1cIilcbiAgICAgICAgaWYgcmVzLmhpc3RvcnlbMF0udmVyc2lvbiBpc250IGF0b20uY29uZmlnLmdldCgnc3luYy1zZXR0aW5ncy5fbGFzdEJhY2t1cEhhc2gnKVxuICAgICAgICAgIEBub3RpZnlOZXdlckJhY2t1cCgpXG4gICAgICAgIGVsc2UgaWYgbm90IGF0b20uY29uZmlnLmdldCgnc3luYy1zZXR0aW5ncy5xdWlldFVwZGF0ZUNoZWNrJylcbiAgICAgICAgICBAbm90aWZ5QmFja3VwVXB0b2RhdGUoKVxuXG4gICAgICAgIGNiPygpXG4gICAgZWxzZVxuICAgICAgQG5vdGlmeU1pc3NpbmdNYW5kYXRvcnlTZXR0aW5ncyhbXCJHaXN0IElEXCJdKVxuXG4gIG5vdGlmeU5ld2VyQmFja3VwOiAtPlxuICAgICMgd2UgbmVlZCB0aGUgYWN0dWFsIGVsZW1lbnQgZm9yIGRpc3BhdGNoaW5nIG9uIGl0XG4gICAgd29ya3NwYWNlRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSlcbiAgICBub3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyBcInN5bmMtc2V0dGluZ3M6IFlvdXIgc2V0dGluZ3MgYXJlIG91dCBvZiBkYXRlLlwiLFxuICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgIGJ1dHRvbnM6IFt7XG4gICAgICAgIHRleHQ6IFwiQmFja3VwXCJcbiAgICAgICAgb25EaWRDbGljazogLT5cbiAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoIHdvcmtzcGFjZUVsZW1lbnQsIFwic3luYy1zZXR0aW5nczpiYWNrdXBcIlxuICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKClcbiAgICAgIH0sIHtcbiAgICAgICAgdGV4dDogXCJWaWV3IGJhY2t1cFwiXG4gICAgICAgIG9uRGlkQ2xpY2s6IC0+XG4gICAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaCB3b3Jrc3BhY2VFbGVtZW50LCBcInN5bmMtc2V0dGluZ3M6dmlldy1iYWNrdXBcIlxuICAgICAgfSwge1xuICAgICAgICB0ZXh0OiBcIlJlc3RvcmVcIlxuICAgICAgICBvbkRpZENsaWNrOiAtPlxuICAgICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2ggd29ya3NwYWNlRWxlbWVudCwgXCJzeW5jLXNldHRpbmdzOnJlc3RvcmVcIlxuICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKClcbiAgICAgIH0sIHtcbiAgICAgICAgdGV4dDogXCJEaXNtaXNzXCJcbiAgICAgICAgb25EaWRDbGljazogLT4gbm90aWZpY2F0aW9uLmRpc21pc3MoKVxuICAgICAgfV1cblxuICBub3RpZnlCYWNrdXBVcHRvZGF0ZTogLT5cbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkU3VjY2VzcyBcInN5bmMtc2V0dGluZ3M6IExhdGVzdCBiYWNrdXAgaXMgYWxyZWFkeSBhcHBsaWVkLlwiXG5cblxuICBub3RpZnlNaXNzaW5nTWFuZGF0b3J5U2V0dGluZ3M6IChtaXNzaW5nU2V0dGluZ3MpIC0+XG4gICAgY29udGV4dCA9IHRoaXNcbiAgICBlcnJvck1zZyA9IFwic3luYy1zZXR0aW5nczogTWFuZGF0b3J5IHNldHRpbmdzIG1pc3Npbmc6IFwiICsgbWlzc2luZ1NldHRpbmdzLmpvaW4oJywgJylcblxuICAgIG5vdGlmaWNhdGlvbiA9IGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciBlcnJvck1zZyxcbiAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICBidXR0b25zOiBbe1xuICAgICAgICB0ZXh0OiBcIlBhY2thZ2Ugc2V0dGluZ3NcIlxuICAgICAgICBvbkRpZENsaWNrOiAtPlxuICAgICAgICAgICAgY29udGV4dC5nb1RvUGFja2FnZVNldHRpbmdzKClcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKClcbiAgICAgIH1dXG5cbiAgYmFja3VwOiAoY2I9bnVsbCkgLT5cbiAgICBmaWxlcyA9IHt9XG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLnN5bmNTZXR0aW5ncycpXG4gICAgICBmaWxlc1tcInNldHRpbmdzLmpzb25cIl0gPSBjb250ZW50OiBAZ2V0RmlsdGVyZWRTZXR0aW5ncygpXG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLnN5bmNQYWNrYWdlcycpXG4gICAgICBmaWxlc1tcInBhY2thZ2VzLmpzb25cIl0gPSBjb250ZW50OiBKU09OLnN0cmluZ2lmeShAZ2V0UGFja2FnZXMoKSwgbnVsbCwgJ1xcdCcpXG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLnN5bmNLZXltYXAnKVxuICAgICAgZmlsZXNbXCJrZXltYXAuY3NvblwiXSA9IGNvbnRlbnQ6IChAZmlsZUNvbnRlbnQgYXRvbS5rZXltYXBzLmdldFVzZXJLZXltYXBQYXRoKCkpID8gXCIjIGtleW1hcCBmaWxlIChub3QgZm91bmQpXCJcbiAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ3N5bmMtc2V0dGluZ3Muc3luY1N0eWxlcycpXG4gICAgICBmaWxlc1tcInN0eWxlcy5sZXNzXCJdID0gY29udGVudDogKEBmaWxlQ29udGVudCBhdG9tLnN0eWxlcy5nZXRVc2VyU3R5bGVTaGVldFBhdGgoKSkgPyBcIi8vIHN0eWxlcyBmaWxlIChub3QgZm91bmQpXCJcbiAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ3N5bmMtc2V0dGluZ3Muc3luY0luaXQnKVxuICAgICAgaW5pdFBhdGggPSBhdG9tLmdldFVzZXJJbml0U2NyaXB0UGF0aCgpXG4gICAgICBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG4gICAgICBmaWxlc1twYXRoLmJhc2VuYW1lKGluaXRQYXRoKV0gPSBjb250ZW50OiAoQGZpbGVDb250ZW50IGluaXRQYXRoKSA/IFwiIyBpbml0aWFsaXphdGlvbiBmaWxlIChub3QgZm91bmQpXCJcbiAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ3N5bmMtc2V0dGluZ3Muc3luY1NuaXBwZXRzJylcbiAgICAgIGZpbGVzW1wic25pcHBldHMuY3NvblwiXSA9IGNvbnRlbnQ6IChAZmlsZUNvbnRlbnQgYXRvbS5nZXRDb25maWdEaXJQYXRoKCkgKyBcIi9zbmlwcGV0cy5jc29uXCIpID8gXCIjIHNuaXBwZXRzIGZpbGUgKG5vdCBmb3VuZClcIlxuXG4gICAgZm9yIGZpbGUgaW4gYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLmV4dHJhRmlsZXMnKSA/IFtdXG4gICAgICBleHQgPSBmaWxlLnNsaWNlKGZpbGUubGFzdEluZGV4T2YoXCIuXCIpKS50b0xvd2VyQ2FzZSgpXG4gICAgICBjbXRzdGFydCA9IFwiI1wiXG4gICAgICBjbXRzdGFydCA9IFwiLy9cIiBpZiBleHQgaW4gW1wiLmxlc3NcIiwgXCIuc2Nzc1wiLCBcIi5qc1wiXVxuICAgICAgY210c3RhcnQgPSBcIi8qXCIgaWYgZXh0IGluIFtcIi5jc3NcIl1cbiAgICAgIGNtdGVuZCA9IFwiXCJcbiAgICAgIGNtdGVuZCA9IFwiKi9cIiBpZiBleHQgaW4gW1wiLmNzc1wiXVxuICAgICAgZmlsZXNbZmlsZV0gPVxuICAgICAgICBjb250ZW50OiAoQGZpbGVDb250ZW50IGF0b20uZ2V0Q29uZmlnRGlyUGF0aCgpICsgXCIvI3tmaWxlfVwiKSA/IFwiI3tjbXRzdGFydH0gI3tmaWxlfSAobm90IGZvdW5kKSAje2NtdGVuZH1cIlxuXG4gICAgQGNyZWF0ZUNsaWVudCgpLmdpc3RzLmVkaXRcbiAgICAgIGlkOiBAZ2V0R2lzdElkKClcbiAgICAgIGRlc2NyaXB0aW9uOiBhdG9tLmNvbmZpZy5nZXQgJ3N5bmMtc2V0dGluZ3MuZ2lzdERlc2NyaXB0aW9uJ1xuICAgICAgZmlsZXM6IGZpbGVzXG4gICAgLCAoZXJyLCByZXMpIC0+XG4gICAgICBpZiBlcnJcbiAgICAgICAgY29uc29sZS5lcnJvciBcImVycm9yIGJhY2tpbmcgdXAgZGF0YTogXCIrZXJyLm1lc3NhZ2UsIGVyclxuICAgICAgICB0cnlcbiAgICAgICAgICBtZXNzYWdlID0gSlNPTi5wYXJzZShlcnIubWVzc2FnZSkubWVzc2FnZVxuICAgICAgICAgIG1lc3NhZ2UgPSAnR2lzdCBJRCBOb3QgRm91bmQnIGlmIG1lc3NhZ2UgaXMgJ05vdCBGb3VuZCdcbiAgICAgICAgY2F0Y2ggU3ludGF4RXJyb3JcbiAgICAgICAgICBtZXNzYWdlID0gZXJyLm1lc3NhZ2VcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yIFwic3luYy1zZXR0aW5nczogRXJyb3IgYmFja2luZyB1cCB5b3VyIHNldHRpbmdzLiAoXCIrbWVzc2FnZStcIilcIlxuICAgICAgZWxzZVxuICAgICAgICBhdG9tLmNvbmZpZy5zZXQoJ3N5bmMtc2V0dGluZ3MuX2xhc3RCYWNrdXBIYXNoJywgcmVzLmhpc3RvcnlbMF0udmVyc2lvbilcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFN1Y2Nlc3MgXCJzeW5jLXNldHRpbmdzOiBZb3VyIHNldHRpbmdzIHdlcmUgc3VjY2Vzc2Z1bGx5IGJhY2tlZCB1cC4gPGJyLz48YSBocmVmPSdcIityZXMuaHRtbF91cmwrXCInPkNsaWNrIGhlcmUgdG8gb3BlbiB5b3VyIEdpc3QuPC9hPlwiXG4gICAgICBjYj8oZXJyLCByZXMpXG5cbiAgdmlld0JhY2t1cDogLT5cbiAgICBTaGVsbCA9IHJlcXVpcmUgJ3NoZWxsJ1xuICAgIGdpc3RJZCA9IEBnZXRHaXN0SWQoKVxuICAgIFNoZWxsLm9wZW5FeHRlcm5hbCBcImh0dHBzOi8vZ2lzdC5naXRodWIuY29tLyN7Z2lzdElkfVwiXG5cbiAgZ2V0UGFja2FnZXM6IC0+XG4gICAgcGFja2FnZXMgPSBbXVxuICAgIGZvciBpLCBtZXRhZGF0YSBvZiBAX2dldEF2YWlsYWJsZVBhY2thZ2VNZXRhZGF0YVdpdGhvdXREdXBsaWNhdGVzKClcbiAgICAgIHtuYW1lLCB2ZXJzaW9uLCB0aGVtZSwgYXBtSW5zdGFsbFNvdXJjZX0gPSBtZXRhZGF0YVxuICAgICAgcGFja2FnZXMucHVzaCh7bmFtZSwgdmVyc2lvbiwgdGhlbWUsIGFwbUluc3RhbGxTb3VyY2V9KVxuICAgIF8uc29ydEJ5KHBhY2thZ2VzLCAnbmFtZScpXG5cbiAgX2dldEF2YWlsYWJsZVBhY2thZ2VNZXRhZGF0YVdpdGhvdXREdXBsaWNhdGVzOiAtPlxuICAgIHBhdGgybWV0YWRhdGEgPSB7fVxuICAgIHBhY2thZ2VfbWV0YWRhdGEgPSBhdG9tLnBhY2thZ2VzLmdldEF2YWlsYWJsZVBhY2thZ2VNZXRhZGF0YSgpXG4gICAgZm9yIHBhdGgsIGkgaW4gYXRvbS5wYWNrYWdlcy5nZXRBdmFpbGFibGVQYWNrYWdlUGF0aHMoKVxuICAgICAgcGF0aDJtZXRhZGF0YVtmcy5yZWFscGF0aFN5bmMocGF0aCldID0gcGFja2FnZV9tZXRhZGF0YVtpXVxuXG4gICAgcGFja2FnZXMgPSBbXVxuICAgIGZvciBpLCBwa2dfbmFtZSBvZiBhdG9tLnBhY2thZ2VzLmdldEF2YWlsYWJsZVBhY2thZ2VOYW1lcygpXG4gICAgICBwa2dfcGF0aCA9IGF0b20ucGFja2FnZXMucmVzb2x2ZVBhY2thZ2VQYXRoKHBrZ19uYW1lKVxuICAgICAgaWYgcGF0aDJtZXRhZGF0YVtwa2dfcGF0aF1cbiAgICAgICAgcGFja2FnZXMucHVzaChwYXRoMm1ldGFkYXRhW3BrZ19wYXRoXSlcbiAgICAgIGVsc2VcbiAgICAgICAgY29uc29sZS5lcnJvcignY291bGQgbm90IGNvcnJlbGF0ZSBwYWNrYWdlIG5hbWUsIHBhdGgsIGFuZCBtZXRhZGF0YScpXG4gICAgcGFja2FnZXNcblxuICByZXN0b3JlOiAoY2I9bnVsbCkgLT5cbiAgICBAY3JlYXRlQ2xpZW50KCkuZ2lzdHMuZ2V0XG4gICAgICBpZDogQGdldEdpc3RJZCgpXG4gICAgLCAoZXJyLCByZXMpID0+XG4gICAgICBpZiBlcnJcbiAgICAgICAgY29uc29sZS5lcnJvciBcImVycm9yIHdoaWxlIHJldHJpZXZpbmcgdGhlIGdpc3QuIGRvZXMgaXQgZXhpc3RzP1wiLCBlcnJcbiAgICAgICAgdHJ5XG4gICAgICAgICAgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXJyLm1lc3NhZ2UpLm1lc3NhZ2VcbiAgICAgICAgICBtZXNzYWdlID0gJ0dpc3QgSUQgTm90IEZvdW5kJyBpZiBtZXNzYWdlIGlzICdOb3QgRm91bmQnXG4gICAgICAgIGNhdGNoIFN5bnRheEVycm9yXG4gICAgICAgICAgbWVzc2FnZSA9IGVyci5tZXNzYWdlXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciBcInN5bmMtc2V0dGluZ3M6IEVycm9yIHJldHJpZXZpbmcgeW91ciBzZXR0aW5ncy4gKFwiK21lc3NhZ2UrXCIpXCJcbiAgICAgICAgcmV0dXJuXG5cbiAgICAgICMgY2hlY2sgaWYgdGhlIEpTT04gZmlsZXMgYXJlIHBhcnNhYmxlXG4gICAgICBmb3Igb3duIGZpbGVuYW1lLCBmaWxlIG9mIHJlcy5maWxlc1xuICAgICAgICBpZiBmaWxlbmFtZSBpcyAnc2V0dGluZ3MuanNvbicgb3IgZmlsZW5hbWUgaXMgJ3BhY2thZ2VzLmpzb24nXG4gICAgICAgICAgdHJ5XG4gICAgICAgICAgICBKU09OLnBhcnNlKGZpbGUuY29udGVudClcbiAgICAgICAgICBjYXRjaCBlXG4gICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJzeW5jLXNldHRpbmdzOiBFcnJvciBwYXJzaW5nIHRoZSBmZXRjaGVkIEpTT04gZmlsZSAnXCIrZmlsZW5hbWUrXCInLiAoXCIrZStcIilcIlxuICAgICAgICAgICAgY2I/KClcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICBjYWxsYmFja0FzeW5jID0gZmFsc2VcblxuICAgICAgZm9yIG93biBmaWxlbmFtZSwgZmlsZSBvZiByZXMuZmlsZXNcbiAgICAgICAgc3dpdGNoIGZpbGVuYW1lXG4gICAgICAgICAgd2hlbiAnc2V0dGluZ3MuanNvbidcbiAgICAgICAgICAgIEBhcHBseVNldHRpbmdzICcnLCBKU09OLnBhcnNlKGZpbGUuY29udGVudCkgaWYgYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLnN5bmNTZXR0aW5ncycpXG5cbiAgICAgICAgICB3aGVuICdwYWNrYWdlcy5qc29uJ1xuICAgICAgICAgICAgaWYgYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLnN5bmNQYWNrYWdlcycpXG4gICAgICAgICAgICAgIGNhbGxiYWNrQXN5bmMgPSB0cnVlXG4gICAgICAgICAgICAgIEBpbnN0YWxsTWlzc2luZ1BhY2thZ2VzIEpTT04ucGFyc2UoZmlsZS5jb250ZW50KSwgY2JcbiAgICAgICAgICAgICAgaWYgYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLnJlbW92ZU9ic29sZXRlUGFja2FnZXMnKVxuICAgICAgICAgICAgICAgIEByZW1vdmVPYnNvbGV0ZVBhY2thZ2VzIEpTT04ucGFyc2UoZmlsZS5jb250ZW50KSwgY2JcblxuICAgICAgICAgIHdoZW4gJ2tleW1hcC5jc29uJ1xuICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyBhdG9tLmtleW1hcHMuZ2V0VXNlcktleW1hcFBhdGgoKSwgZmlsZS5jb250ZW50IGlmIGF0b20uY29uZmlnLmdldCgnc3luYy1zZXR0aW5ncy5zeW5jS2V5bWFwJylcblxuICAgICAgICAgIHdoZW4gJ3N0eWxlcy5sZXNzJ1xuICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyBhdG9tLnN0eWxlcy5nZXRVc2VyU3R5bGVTaGVldFBhdGgoKSwgZmlsZS5jb250ZW50IGlmIGF0b20uY29uZmlnLmdldCgnc3luYy1zZXR0aW5ncy5zeW5jU3R5bGVzJylcblxuICAgICAgICAgIHdoZW4gJ2luaXQuY29mZmVlJ1xuICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyBhdG9tLmdldENvbmZpZ0RpclBhdGgoKSArIFwiL2luaXQuY29mZmVlXCIsIGZpbGUuY29udGVudCBpZiBhdG9tLmNvbmZpZy5nZXQoJ3N5bmMtc2V0dGluZ3Muc3luY0luaXQnKVxuXG4gICAgICAgICAgd2hlbiAnaW5pdC5qcydcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMgYXRvbS5nZXRDb25maWdEaXJQYXRoKCkgKyBcIi9pbml0LmpzXCIsIGZpbGUuY29udGVudCBpZiBhdG9tLmNvbmZpZy5nZXQoJ3N5bmMtc2V0dGluZ3Muc3luY0luaXQnKVxuXG4gICAgICAgICAgd2hlbiAnc25pcHBldHMuY3NvbidcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMgYXRvbS5nZXRDb25maWdEaXJQYXRoKCkgKyBcIi9zbmlwcGV0cy5jc29uXCIsIGZpbGUuY29udGVudCBpZiBhdG9tLmNvbmZpZy5nZXQoJ3N5bmMtc2V0dGluZ3Muc3luY1NuaXBwZXRzJylcblxuICAgICAgICAgIGVsc2UgZnMud3JpdGVGaWxlU3luYyBcIiN7YXRvbS5nZXRDb25maWdEaXJQYXRoKCl9LyN7ZmlsZW5hbWV9XCIsIGZpbGUuY29udGVudFxuXG4gICAgICBhdG9tLmNvbmZpZy5zZXQoJ3N5bmMtc2V0dGluZ3MuX2xhc3RCYWNrdXBIYXNoJywgcmVzLmhpc3RvcnlbMF0udmVyc2lvbilcblxuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFN1Y2Nlc3MgXCJzeW5jLXNldHRpbmdzOiBZb3VyIHNldHRpbmdzIHdlcmUgc3VjY2Vzc2Z1bGx5IHN5bmNocm9uaXplZC5cIlxuXG4gICAgICBjYj8oKSB1bmxlc3MgY2FsbGJhY2tBc3luY1xuXG4gIGNyZWF0ZUNsaWVudDogLT5cbiAgICB0b2tlbiA9IEBnZXRQZXJzb25hbEFjY2Vzc1Rva2VuKClcblxuICAgIGlmIHRva2VuXG4gICAgICBjb25zb2xlLmRlYnVnIFwiQ3JlYXRpbmcgR2l0SHViQXBpIGNsaWVudCB3aXRoIHRva2VuID0gI3t0b2tlbi5zdWJzdHIoMCwgNCl9Li4uI3t0b2tlbi5zdWJzdHIoLTQsIDQpfVwiXG4gICAgZWxzZVxuICAgICAgY29uc29sZS5kZWJ1ZyBcIkNyZWF0aW5nIEdpdEh1YkFwaSBjbGllbnQgd2l0aG91dCB0b2tlblwiXG5cbiAgICBnaXRodWIgPSBuZXcgR2l0SHViQXBpXG4gICAgICB2ZXJzaW9uOiAnMy4wLjAnXG4gICAgICAjIGRlYnVnOiB0cnVlXG4gICAgICBwcm90b2NvbDogJ2h0dHBzJ1xuICAgIGdpdGh1Yi5hdXRoZW50aWNhdGVcbiAgICAgIHR5cGU6ICdvYXV0aCdcbiAgICAgIHRva2VuOiB0b2tlblxuICAgIGdpdGh1YlxuXG4gIGdldEZpbHRlcmVkU2V0dGluZ3M6IC0+XG4gICAgIyBfLmNsb25lKCkgZG9lc24ndCBkZWVwIGNsb25lIHRodXMgd2UgYXJlIHVzaW5nIEpTT04gcGFyc2UgdHJpY2tcbiAgICBzZXR0aW5ncyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoYXRvbS5jb25maWcuc2V0dGluZ3MpKVxuICAgIGJsYWNrbGlzdGVkS2V5cyA9IFJFTU9WRV9LRVlTLmNvbmNhdChhdG9tLmNvbmZpZy5nZXQoJ3N5bmMtc2V0dGluZ3MuYmxhY2tsaXN0ZWRLZXlzJykgPyBbXSlcbiAgICBmb3IgYmxhY2tsaXN0ZWRLZXkgaW4gYmxhY2tsaXN0ZWRLZXlzXG4gICAgICBibGFja2xpc3RlZEtleSA9IGJsYWNrbGlzdGVkS2V5LnNwbGl0KFwiLlwiKVxuICAgICAgQF9yZW1vdmVQcm9wZXJ0eShzZXR0aW5ncywgYmxhY2tsaXN0ZWRLZXkpXG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHNldHRpbmdzLCBudWxsLCAnXFx0JylcblxuICBfcmVtb3ZlUHJvcGVydHk6IChvYmosIGtleSkgLT5cbiAgICBsYXN0S2V5ID0ga2V5Lmxlbmd0aCBpcyAxXG4gICAgY3VycmVudEtleSA9IGtleS5zaGlmdCgpXG5cbiAgICBpZiBub3QgbGFzdEtleSBhbmQgXy5pc09iamVjdChvYmpbY3VycmVudEtleV0pIGFuZCBub3QgXy5pc0FycmF5KG9ialtjdXJyZW50S2V5XSlcbiAgICAgIEBfcmVtb3ZlUHJvcGVydHkob2JqW2N1cnJlbnRLZXldLCBrZXkpXG4gICAgZWxzZVxuICAgICAgZGVsZXRlIG9ialtjdXJyZW50S2V5XVxuXG4gIGdvVG9QYWNrYWdlU2V0dGluZ3M6IC0+XG4gICAgYXRvbS53b3Jrc3BhY2Uub3BlbihcImF0b206Ly9jb25maWcvcGFja2FnZXMvc3luYy1zZXR0aW5nc1wiKVxuXG4gIGFwcGx5U2V0dGluZ3M6IChwcmVmLCBzZXR0aW5ncykgLT5cbiAgICBmb3Iga2V5LCB2YWx1ZSBvZiBzZXR0aW5nc1xuICAgICAga2V5ID0ga2V5LnJlcGxhY2UgL1xcLi9nLCBcIlxcXFwuXCJcbiAgICAgIGtleVBhdGggPSBcIiN7cHJlZn0uI3trZXl9XCJcbiAgICAgIGlzQ29sb3IgPSBmYWxzZVxuICAgICAgaWYgXy5pc09iamVjdCh2YWx1ZSlcbiAgICAgICAgdmFsdWVLZXlzID0gT2JqZWN0LmtleXModmFsdWUpXG4gICAgICAgIGNvbG9yS2V5cyA9IFsnYWxwaGEnLCAnYmx1ZScsICdncmVlbicsICdyZWQnXVxuICAgICAgICBpc0NvbG9yID0gXy5pc0VxdWFsKF8uc29ydEJ5KHZhbHVlS2V5cyksIGNvbG9yS2V5cylcbiAgICAgIGlmIF8uaXNPYmplY3QodmFsdWUpIGFuZCBub3QgXy5pc0FycmF5KHZhbHVlKSBhbmQgbm90IGlzQ29sb3JcbiAgICAgICAgQGFwcGx5U2V0dGluZ3Mga2V5UGF0aCwgdmFsdWVcbiAgICAgIGVsc2VcbiAgICAgICAgY29uc29sZS5kZWJ1ZyBcImNvbmZpZy5zZXQgI3trZXlQYXRoWzEuLi5dfT0je3ZhbHVlfVwiXG4gICAgICAgIGF0b20uY29uZmlnLnNldCBrZXlQYXRoWzEuLi5dLCB2YWx1ZVxuXG4gIHJlbW92ZU9ic29sZXRlUGFja2FnZXM6IChyZW1haW5pbmdfcGFja2FnZXMsIGNiKSAtPlxuICAgIGluc3RhbGxlZF9wYWNrYWdlcyA9IEBnZXRQYWNrYWdlcygpXG4gICAgb2Jzb2xldGVfcGFja2FnZXMgPSBbXVxuICAgIGZvciBwa2cgaW4gaW5zdGFsbGVkX3BhY2thZ2VzXG4gICAgICBrZWVwX2luc3RhbGxlZF9wYWNrYWdlID0gKHAgZm9yIHAgaW4gcmVtYWluaW5nX3BhY2thZ2VzIHdoZW4gcC5uYW1lIGlzIHBrZy5uYW1lKVxuICAgICAgaWYga2VlcF9pbnN0YWxsZWRfcGFja2FnZS5sZW5ndGggaXMgMFxuICAgICAgICBvYnNvbGV0ZV9wYWNrYWdlcy5wdXNoKHBrZylcbiAgICBpZiBvYnNvbGV0ZV9wYWNrYWdlcy5sZW5ndGggaXMgMFxuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8gXCJTeW5jLXNldHRpbmdzOiBubyBwYWNrYWdlcyB0byByZW1vdmVcIlxuICAgICAgcmV0dXJuIGNiPygpXG5cbiAgICBub3RpZmljYXRpb25zID0ge31cbiAgICBzdWNjZWVkZWQgPSBbXVxuICAgIGZhaWxlZCA9IFtdXG4gICAgcmVtb3ZlTmV4dFBhY2thZ2UgPSA9PlxuICAgICAgaWYgb2Jzb2xldGVfcGFja2FnZXMubGVuZ3RoID4gMFxuICAgICAgICAjIHN0YXJ0IHJlbW92aW5nIG5leHQgcGFja2FnZVxuICAgICAgICBwa2cgPSBvYnNvbGV0ZV9wYWNrYWdlcy5zaGlmdCgpXG4gICAgICAgIGkgPSBzdWNjZWVkZWQubGVuZ3RoICsgZmFpbGVkLmxlbmd0aCArIE9iamVjdC5rZXlzKG5vdGlmaWNhdGlvbnMpLmxlbmd0aCArIDFcbiAgICAgICAgY291bnQgPSBpICsgb2Jzb2xldGVfcGFja2FnZXMubGVuZ3RoXG4gICAgICAgIG5vdGlmaWNhdGlvbnNbcGtnLm5hbWVdID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8gXCJTeW5jLXNldHRpbmdzOiByZW1vdmluZyAje3BrZy5uYW1lfSAoI3tpfS8je2NvdW50fSlcIiwge2Rpc21pc3NhYmxlOiB0cnVlfVxuICAgICAgICBkbyAocGtnKSA9PlxuICAgICAgICAgIEByZW1vdmVQYWNrYWdlIHBrZywgKGVycm9yKSAtPlxuICAgICAgICAgICAgIyByZW1vdmFsIG9mIHBhY2thZ2UgZmluaXNoZWRcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbnNbcGtnLm5hbWVdLmRpc21pc3MoKVxuICAgICAgICAgICAgZGVsZXRlIG5vdGlmaWNhdGlvbnNbcGtnLm5hbWVdXG4gICAgICAgICAgICBpZiBlcnJvcj9cbiAgICAgICAgICAgICAgZmFpbGVkLnB1c2gocGtnLm5hbWUpXG4gICAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nIFwiU3luYy1zZXR0aW5nczogZmFpbGVkIHRvIHJlbW92ZSAje3BrZy5uYW1lfVwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIHN1Y2NlZWRlZC5wdXNoKHBrZy5uYW1lKVxuICAgICAgICAgICAgIyB0cmlnZ2VyIG5leHQgcGFja2FnZVxuICAgICAgICAgICAgcmVtb3ZlTmV4dFBhY2thZ2UoKVxuICAgICAgZWxzZSBpZiBPYmplY3Qua2V5cyhub3RpZmljYXRpb25zKS5sZW5ndGggaXMgMFxuICAgICAgICAjIGxhc3QgcGFja2FnZSByZW1vdmFsIGZpbmlzaGVkXG4gICAgICAgIGlmIGZhaWxlZC5sZW5ndGggaXMgMFxuICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRTdWNjZXNzIFwiU3luYy1zZXR0aW5nczogZmluaXNoZWQgcmVtb3ZpbmcgI3tzdWNjZWVkZWQubGVuZ3RofSBwYWNrYWdlc1wiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBmYWlsZWQuc29ydCgpXG4gICAgICAgICAgZmFpbGVkU3RyID0gZmFpbGVkLmpvaW4oJywgJylcbiAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyBcIlN5bmMtc2V0dGluZ3M6IGZpbmlzaGVkIHJlbW92aW5nIHBhY2thZ2VzICgje2ZhaWxlZC5sZW5ndGh9IGZhaWxlZDogI3tmYWlsZWRTdHJ9KVwiLCB7ZGlzbWlzc2FibGU6IHRydWV9XG4gICAgICAgIGNiPygpXG4gICAgIyBzdGFydCBhcyBtYW55IHBhY2thZ2UgcmVtb3ZhbCBpbiBwYXJhbGxlbCBhcyBkZXNpcmVkXG4gICAgY29uY3VycmVuY3kgPSBNYXRoLm1pbiBvYnNvbGV0ZV9wYWNrYWdlcy5sZW5ndGgsIDhcbiAgICBmb3IgaSBpbiBbMC4uLmNvbmN1cnJlbmN5XVxuICAgICAgcmVtb3ZlTmV4dFBhY2thZ2UoKVxuXG4gIHJlbW92ZVBhY2thZ2U6IChwYWNrLCBjYikgLT5cbiAgICB0eXBlID0gaWYgcGFjay50aGVtZSB0aGVuICd0aGVtZScgZWxzZSAncGFja2FnZSdcbiAgICBjb25zb2xlLmluZm8oXCJSZW1vdmluZyAje3R5cGV9ICN7cGFjay5uYW1lfS4uLlwiKVxuICAgIHBhY2thZ2VNYW5hZ2VyID0gbmV3IFBhY2thZ2VNYW5hZ2VyKClcbiAgICBwYWNrYWdlTWFuYWdlci51bmluc3RhbGwgcGFjaywgKGVycm9yKSAtPlxuICAgICAgaWYgZXJyb3I/XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJSZW1vdmluZyAje3R5cGV9ICN7cGFjay5uYW1lfSBmYWlsZWRcIiwgZXJyb3Iuc3RhY2sgPyBlcnJvciwgZXJyb3Iuc3RkZXJyKVxuICAgICAgZWxzZVxuICAgICAgICBjb25zb2xlLmluZm8oXCJSZW1vdmluZyAje3R5cGV9ICN7cGFjay5uYW1lfVwiKVxuICAgICAgY2I/KGVycm9yKVxuXG4gIGluc3RhbGxNaXNzaW5nUGFja2FnZXM6IChwYWNrYWdlcywgY2IpIC0+XG4gICAgYXZhaWxhYmxlX3BhY2thZ2VzID0gQGdldFBhY2thZ2VzKClcbiAgICBtaXNzaW5nX3BhY2thZ2VzID0gW11cbiAgICBmb3IgcGtnIGluIHBhY2thZ2VzXG4gICAgICBhdmFpbGFibGVfcGFja2FnZSA9IChwIGZvciBwIGluIGF2YWlsYWJsZV9wYWNrYWdlcyB3aGVuIHAubmFtZSBpcyBwa2cubmFtZSlcbiAgICAgIGlmIGF2YWlsYWJsZV9wYWNrYWdlLmxlbmd0aCBpcyAwXG4gICAgICAgICMgbWlzc2luZyBpZiBub3QgeWV0IGluc3RhbGxlZFxuICAgICAgICBtaXNzaW5nX3BhY2thZ2VzLnB1c2gocGtnKVxuICAgICAgZWxzZSBpZiBub3QoISFwa2cuYXBtSW5zdGFsbFNvdXJjZSBpcyAhIWF2YWlsYWJsZV9wYWNrYWdlWzBdLmFwbUluc3RhbGxTb3VyY2UpXG4gICAgICAgICMgb3IgaW5zdGFsbGVkIGJ1dCB3aXRoIGRpZmZlcmVudCBhcG0gaW5zdGFsbCBzb3VyY2VcbiAgICAgICAgbWlzc2luZ19wYWNrYWdlcy5wdXNoKHBrZylcbiAgICBpZiBtaXNzaW5nX3BhY2thZ2VzLmxlbmd0aCBpcyAwXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyBcIlN5bmMtc2V0dGluZ3M6IG5vIHBhY2thZ2VzIHRvIGluc3RhbGxcIlxuICAgICAgcmV0dXJuIGNiPygpXG5cbiAgICBub3RpZmljYXRpb25zID0ge31cbiAgICBzdWNjZWVkZWQgPSBbXVxuICAgIGZhaWxlZCA9IFtdXG4gICAgaW5zdGFsbE5leHRQYWNrYWdlID0gPT5cbiAgICAgIGlmIG1pc3NpbmdfcGFja2FnZXMubGVuZ3RoID4gMFxuICAgICAgICAjIHN0YXJ0IGluc3RhbGxpbmcgbmV4dCBwYWNrYWdlXG4gICAgICAgIHBrZyA9IG1pc3NpbmdfcGFja2FnZXMuc2hpZnQoKVxuICAgICAgICBpID0gc3VjY2VlZGVkLmxlbmd0aCArIGZhaWxlZC5sZW5ndGggKyBPYmplY3Qua2V5cyhub3RpZmljYXRpb25zKS5sZW5ndGggKyAxXG4gICAgICAgIGNvdW50ID0gaSArIG1pc3NpbmdfcGFja2FnZXMubGVuZ3RoXG4gICAgICAgIG5vdGlmaWNhdGlvbnNbcGtnLm5hbWVdID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8gXCJTeW5jLXNldHRpbmdzOiBpbnN0YWxsaW5nICN7cGtnLm5hbWV9ICgje2l9LyN7Y291bnR9KVwiLCB7ZGlzbWlzc2FibGU6IHRydWV9XG4gICAgICAgIGRvIChwa2cpID0+XG4gICAgICAgICAgQGluc3RhbGxQYWNrYWdlIHBrZywgKGVycm9yKSAtPlxuICAgICAgICAgICAgIyBpbnN0YWxsYXRpb24gb2YgcGFja2FnZSBmaW5pc2hlZFxuICAgICAgICAgICAgbm90aWZpY2F0aW9uc1twa2cubmFtZV0uZGlzbWlzcygpXG4gICAgICAgICAgICBkZWxldGUgbm90aWZpY2F0aW9uc1twa2cubmFtZV1cbiAgICAgICAgICAgIGlmIGVycm9yP1xuICAgICAgICAgICAgICBmYWlsZWQucHVzaChwa2cubmFtZSlcbiAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcgXCJTeW5jLXNldHRpbmdzOiBmYWlsZWQgdG8gaW5zdGFsbCAje3BrZy5uYW1lfVwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIHN1Y2NlZWRlZC5wdXNoKHBrZy5uYW1lKVxuICAgICAgICAgICAgIyB0cmlnZ2VyIG5leHQgcGFja2FnZVxuICAgICAgICAgICAgaW5zdGFsbE5leHRQYWNrYWdlKClcbiAgICAgIGVsc2UgaWYgT2JqZWN0LmtleXMobm90aWZpY2F0aW9ucykubGVuZ3RoIGlzIDBcbiAgICAgICAgIyBsYXN0IHBhY2thZ2UgaW5zdGFsbGF0aW9uIGZpbmlzaGVkXG4gICAgICAgIGlmIGZhaWxlZC5sZW5ndGggaXMgMFxuICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRTdWNjZXNzIFwiU3luYy1zZXR0aW5nczogZmluaXNoZWQgaW5zdGFsbGluZyAje3N1Y2NlZWRlZC5sZW5ndGh9IHBhY2thZ2VzXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGZhaWxlZC5zb3J0KClcbiAgICAgICAgICBmYWlsZWRTdHIgPSBmYWlsZWQuam9pbignLCAnKVxuICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nIFwiU3luYy1zZXR0aW5nczogZmluaXNoZWQgaW5zdGFsbGluZyBwYWNrYWdlcyAoI3tmYWlsZWQubGVuZ3RofSBmYWlsZWQ6ICN7ZmFpbGVkU3RyfSlcIiwge2Rpc21pc3NhYmxlOiB0cnVlfVxuICAgICAgICBjYj8oKVxuICAgICMgc3RhcnQgYXMgbWFueSBwYWNrYWdlIGluc3RhbGxhdGlvbnMgaW4gcGFyYWxsZWwgYXMgZGVzaXJlZFxuICAgIGNvbmN1cnJlbmN5ID0gTWF0aC5taW4gbWlzc2luZ19wYWNrYWdlcy5sZW5ndGgsIDhcbiAgICBmb3IgaSBpbiBbMC4uLmNvbmN1cnJlbmN5XVxuICAgICAgaW5zdGFsbE5leHRQYWNrYWdlKClcblxuICBpbnN0YWxsUGFja2FnZTogKHBhY2ssIGNiKSAtPlxuICAgIHR5cGUgPSBpZiBwYWNrLnRoZW1lIHRoZW4gJ3RoZW1lJyBlbHNlICdwYWNrYWdlJ1xuICAgIGNvbnNvbGUuaW5mbyhcIkluc3RhbGxpbmcgI3t0eXBlfSAje3BhY2submFtZX0uLi5cIilcbiAgICBwYWNrYWdlTWFuYWdlciA9IG5ldyBQYWNrYWdlTWFuYWdlcigpXG4gICAgcGFja2FnZU1hbmFnZXIuaW5zdGFsbCBwYWNrLCAoZXJyb3IpIC0+XG4gICAgICBpZiBlcnJvcj9cbiAgICAgICAgY29uc29sZS5lcnJvcihcIkluc3RhbGxpbmcgI3t0eXBlfSAje3BhY2submFtZX0gZmFpbGVkXCIsIGVycm9yLnN0YWNrID8gZXJyb3IsIGVycm9yLnN0ZGVycilcbiAgICAgIGVsc2VcbiAgICAgICAgY29uc29sZS5pbmZvKFwiSW5zdGFsbGVkICN7dHlwZX0gI3twYWNrLm5hbWV9XCIpXG4gICAgICBjYj8oZXJyb3IpXG5cbiAgZmlsZUNvbnRlbnQ6IChmaWxlUGF0aCkgLT5cbiAgICB0cnlcbiAgICAgIHJldHVybiBmcy5yZWFkRmlsZVN5bmMoZmlsZVBhdGgsIHtlbmNvZGluZzogJ3V0ZjgnfSkgb3IgbnVsbFxuICAgIGNhdGNoIGVcbiAgICAgIGNvbnNvbGUuZXJyb3IgXCJFcnJvciByZWFkaW5nIGZpbGUgI3tmaWxlUGF0aH0uIFByb2JhYmx5IGRvZXNuJ3QgZXhpc3QuXCIsIGVcbiAgICAgIG51bGxcblxuICBpbnB1dEZvcmtHaXN0SWQ6IC0+XG4gICAgRm9ya0dpc3RJZElucHV0VmlldyA/PSByZXF1aXJlICcuL2ZvcmstZ2lzdGlkLWlucHV0LXZpZXcnXG4gICAgQGlucHV0VmlldyA9IG5ldyBGb3JrR2lzdElkSW5wdXRWaWV3KClcbiAgICBAaW5wdXRWaWV3LnNldENhbGxiYWNrSW5zdGFuY2UodGhpcylcblxuICBmb3JrR2lzdElkOiAoZm9ya0lkKSAtPlxuICAgIEBjcmVhdGVDbGllbnQoKS5naXN0cy5mb3JrXG4gICAgICBpZDogZm9ya0lkXG4gICAgLCAoZXJyLCByZXMpIC0+XG4gICAgICBpZiBlcnJcbiAgICAgICAgdHJ5XG4gICAgICAgICAgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXJyLm1lc3NhZ2UpLm1lc3NhZ2VcbiAgICAgICAgICBtZXNzYWdlID0gXCJHaXN0IElEIE5vdCBGb3VuZFwiIGlmIG1lc3NhZ2UgaXMgXCJOb3QgRm91bmRcIlxuICAgICAgICBjYXRjaCBTeW50YXhFcnJvclxuICAgICAgICAgIG1lc3NhZ2UgPSBlcnIubWVzc2FnZVxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJzeW5jLXNldHRpbmdzOiBFcnJvciBmb3JraW5nIHNldHRpbmdzLiAoXCIrbWVzc2FnZStcIilcIlxuICAgICAgICByZXR1cm4gY2I/KClcblxuICAgICAgaWYgcmVzLmlkXG4gICAgICAgIGF0b20uY29uZmlnLnNldCBcInN5bmMtc2V0dGluZ3MuZ2lzdElkXCIsIHJlcy5pZFxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkU3VjY2VzcyBcInN5bmMtc2V0dGluZ3M6IEZvcmtlZCBzdWNjZXNzZnVsbHkgdG8gdGhlIG5ldyBHaXN0IElEIFwiICsgcmVzLmlkICsgXCIgd2hpY2ggaGFzIGJlZW4gc2F2ZWQgdG8geW91ciBjb25maWcuXCJcbiAgICAgIGVsc2VcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yIFwic3luYy1zZXR0aW5nczogRXJyb3IgZm9ya2luZyBzZXR0aW5nc1wiXG5cbiAgICAgIGNiPygpXG5cbm1vZHVsZS5leHBvcnRzID0gU3luY1NldHRpbmdzXG4iXX0=
