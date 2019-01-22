(function() {
  var AtomGitDiffDetailsView;

  AtomGitDiffDetailsView = require("./git-diff-details-view");

  module.exports = {
    config: {
      closeAfterCopy: {
        type: "boolean",
        "default": false,
        title: "Close diff view after copy"
      },
      keepViewToggled: {
        type: "boolean",
        "default": true,
        title: "Keep view toggled when leaving a diff"
      },
      enableSyntaxHighlighting: {
        type: "boolean",
        "default": false,
        title: "Enable syntax highlighting in diff view"
      },
      showWordDiffs: {
        type: "boolean",
        "default": true,
        title: "Show word diffs"
      }
    },
    activate: function() {
      return atom.workspace.observeTextEditors(function(editor) {
        return new AtomGitDiffDetailsView(editor);
      });
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUveXVhbnNoZW4vLmF0b20vcGFja2FnZXMvZ2l0LWRpZmYtZGV0YWlscy9saWIvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLHNCQUFBLEdBQXlCLE9BQUEsQ0FBUSx5QkFBUjs7RUFFekIsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLE1BQUEsRUFDRTtNQUFBLGNBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxTQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQURUO1FBRUEsS0FBQSxFQUFPLDRCQUZQO09BREY7TUFLQSxlQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsSUFEVDtRQUVBLEtBQUEsRUFBTyx1Q0FGUDtPQU5GO01BVUEsd0JBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxTQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQURUO1FBRUEsS0FBQSxFQUFPLHlDQUZQO09BWEY7TUFlQSxhQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsSUFEVDtRQUVBLEtBQUEsRUFBTyxpQkFGUDtPQWhCRjtLQURGO0lBcUJBLFFBQUEsRUFBVSxTQUFBO2FBQ1IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBZixDQUFrQyxTQUFDLE1BQUQ7ZUFDaEMsSUFBSSxzQkFBSixDQUEyQixNQUEzQjtNQURnQyxDQUFsQztJQURRLENBckJWOztBQUhGIiwic291cmNlc0NvbnRlbnQiOlsiQXRvbUdpdERpZmZEZXRhaWxzVmlldyA9IHJlcXVpcmUgXCIuL2dpdC1kaWZmLWRldGFpbHMtdmlld1wiXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgY29uZmlnOlxuICAgIGNsb3NlQWZ0ZXJDb3B5OlxuICAgICAgdHlwZTogXCJib29sZWFuXCJcbiAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICB0aXRsZTogXCJDbG9zZSBkaWZmIHZpZXcgYWZ0ZXIgY29weVwiXG5cbiAgICBrZWVwVmlld1RvZ2dsZWQ6XG4gICAgICB0eXBlOiBcImJvb2xlYW5cIlxuICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgdGl0bGU6IFwiS2VlcCB2aWV3IHRvZ2dsZWQgd2hlbiBsZWF2aW5nIGEgZGlmZlwiXG5cbiAgICBlbmFibGVTeW50YXhIaWdobGlnaHRpbmc6XG4gICAgICB0eXBlOiBcImJvb2xlYW5cIlxuICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgIHRpdGxlOiBcIkVuYWJsZSBzeW50YXggaGlnaGxpZ2h0aW5nIGluIGRpZmYgdmlld1wiXG5cbiAgICBzaG93V29yZERpZmZzOlxuICAgICAgdHlwZTogXCJib29sZWFuXCJcbiAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgIHRpdGxlOiBcIlNob3cgd29yZCBkaWZmc1wiXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzIChlZGl0b3IpIC0+XG4gICAgICBuZXcgQXRvbUdpdERpZmZEZXRhaWxzVmlldyhlZGl0b3IpXG4iXX0=
