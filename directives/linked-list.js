angular.module("MyApp")
  .directive('linkedList', function($rootScope) {
    return {
      restrict: 'E',
      scope: false,
      link: function(scope, element, attrs) {
        var w = scope.dimensions.w;
        var h = scope.dimensions.h;
        var animationDuration = scope.animationDuration; // TODO: use watch variable if animation panel ever gets created
        var svg = d3.select(element[0])
                    .append("svg")
                    .attr("width", w)
                    .attr("height", h);
        var nodes;
        var arrows;
        var indices;
        var labels;
        var square = 50;
        var xTextOffset = square/2;
        var yTextOffset = square/2 + 7;

        scope.constructInitialList = function(elements, edges, indexData, labelData) {
          svg.selectAll("*").remove();
          if (elements) {
            constructNodes(elements);
          }
          if (edges) {
            constructArrows(edges);
          }
          if (indexData) {
            constructIndices(indexData);
          }
          if (labelData) {
            constructLabels(labelData);
          }
        }

        function constructNodes(elements) {
          nodes = svg.append("svg:g")
                     .attr("id", "nodes")
                     .attr("class", "nodes")
                     .selectAll("g")
                     .data(elements);

          var newNodes = nodes.enter()
                              .append("g")
                              .attr("id", function(d, i) { return "node"+i; });

          newNodes.append("rect")
                  .attr("id", function(d, i) { return "node"+i+"Square"; })
                  .attr("x", function(d) { return d.x; })
                  .attr("y", function(d) { return d.y; })
                  .attr("width", square)
                  .attr("height", square)
                  .attr("fill", function(d) { return "rgb(0, 0, "+(d.value*10)+")"; });

          newNodes.append("text")
                  .text(function(d) { return d.value; })
                  .attr("id", function(d, i) { return "node"+i+"Text"; })
                  .attr("x", function(d) { return d.x + xTextOffset; })
                  .attr("y", function(d) { return d.y + yTextOffset; });
        }

        function constructArrows(edges) {
          arrows = svg.append("svg:g")
                      .attr("id", "arrows")
                      .selectAll("line")
                      .data(edges);

          svg.append("defs").append("svg:marker")
                            .attr("id", "end-arrow")
                            .attr("viewBox", "0 -5 10 10")
                            .attr("refX", 6)
                            .attr("markerWidth", 3)
                            .attr("markerHeight", 3)
                            .attr("orient", "auto")
                            .append("svg:path")
                            .attr("d", "M0,-5L10,0L0,5")
                            .attr("fill", "#000");

          arrows.enter()
                .append("line")
                .attr("id", function(d, i) { return "arrow"+i+(i+1); })
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
        }

        function constructIndices(indexData) {
          indices = svg.append("svg:g")
                       .attr("id", "indices")
                       .attr("class", "indices")
                       .selectAll("text")
                       .data(indexData);

          indices.enter()
                 .append("text")
                 .attr("id", function(d, i) { return "index"+i; })
                 .text(function(d) { return d.value; })
                 .attr("x", function(d) { return d.x + xTextOffset; })
                 .attr("y", function(d) { return d.y + yTextOffset; });
        }

        function constructLabels(labelData) {
          labels = svg.append("svg:g")
                      .attr("id", "labels")
                      .attr("class", "labels")
                      .selectAll("text")
                      .data(labelData);
        }

        scope.createNewNode = function(newElem) {
          var newNode = svg.append("g")
                           .attr("id", "newSVGElements")
                           .selectAll("g")
                           .data([newElem])
                           .enter()
                           .append("g")
                           .attr("id", "newNode");

          newNode.append("rect")
                 .attr("id", "newNodeSquare")
                 .attr("x", function(d) { return d.x; })
                 .attr("y", function(d) { return d.y; })
                 .attr("width", square)
                 .attr("height", square)
                 .attr("fill", function(d) { return "rgb(0, 0, "+(d.value*10)+")"; });

          newNode.append("text")
                 .text(function(d) { return d.value; })
                 .attr("id", "newNodeText")
                 .attr("x", function(d) { return d.x + xTextOffset; })
                 .attr("y", function(d) { return d.y + yTextOffset; })
                 .attr("fill", "white");
        }

        scope.updateNodePosition = function(id, newData) {
          svg.select("#" + id)
             .data(newData);

          svg.select("#" + id + "Square")
             .transition()
             .duration(animationDuration)
             .attr("x", function(d) { return d.x; })
             .attr("y", function(d) { return d.y; });

          svg.select("#" + id + "Text")
             .transition()
             .duration(animationDuration)
             .attr("x", function(d) { return d.x + xTextOffset; })
             .attr("y", function(d) { return d.y + yTextOffset; });
        }

        scope.createNewArrow = function(newEdge) {
          svg.select("#newSVGElements")
             .selectAll("line")
             .data(newEdge)
             .enter()
             .append("line")
             .attr("id", "newArrow")
             .attr("x1", function(d) { return d.source.x; })
             .attr("y1", function(d) { return d.source.y; })
             .attr("x2", function(d) { return d.target.x; })
             .attr("y2", function(d) { return d.target.y; });
        }

        scope.updateArrowPosition = function(id, newData) {
          svg.select("#" + id)
             .data(newData)
             .transition()
             .duration(animationDuration)
             .attr("x1", function(d) { return d.source.x; })
             .attr("y1", function(d) { return d.source.y; })
             .attr("x2", function(d) { return d.target.x; })
             .attr("y2", function(d) { return d.target.y; });
        }

        scope.appendNode = function() {
          var newData = nodes.data();
          newData.push([]);
          nodes = nodes.data(newData);
          var newNode = nodes.enter()
                             .append("g")
                             .attr("id", function(d, i) { return "node"+i; });

          newNode.append("rect")
                 .attr("id", function(d, i) { return "nodeSquare"+i; })
                 .attr("width", square)
                 .attr("height", square);

          newNode.append("text")
                 .attr("id", function(d, i) { return "nodeText"+i; });
        }

        scope.appendArrow = function() {
          var newData = arrows.data();
          newData.push([]);
          arrows = arrows.data(newData);
          arrows.enter()
                .append("line")
                .attr("id", function(d, i) { return "arrow"+i+(i+1); });
        }

        scope.appendIndex = function() {
          var newData = indices.data();
          newData.push([]);
          indices = indices.data(newData);
          indices.enter()
                .append("text")
                .attr("id", function(d, i) { return "index"+i; });
        }

        scope.updateAllNodes = function(elements) {
          nodes = nodes.data(elements);
          nodes.select("rect")
               .attr("x", function(d) { return d.x; })
               .attr("y", function(d) { return d.y; })
               .attr("fill", function(d) { return "rgb(0, 0, "+(d.value*10)+")"; });

          nodes.select("text")
               .text(function(d) { return d.value; })
               .attr("x", function(d) { return d.x + xTextOffset; })
               .attr("y", function(d) { return d.y + yTextOffset; });
        }

        scope.updateAllArrows = function(edges) {
          arrows = arrows.data(edges);
          arrows.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
        }

        scope.deleteNewElements = function() {
          svg.select("#newSVGElements").data([]).exit().remove();
        }

        scope.transitionToNewData = function(elements, edges, indexData) {
          nodes = nodes.data(elements);
          arrows = arrows.data(edges);
          indices = indices.data(indexData);

          nodes.select("rect")
               .transition()
               .duration(animationDuration)
               .attr("x", function(d) { return d.x; })
               .attr("y", function(d) { return d.y; });

          nodes.select("text")
               .transition()
               .duration(animationDuration)
               .text(function(d) { return d.value; })
               .attr("x", function(d) { return d.x + xTextOffset; })
               .attr("y", function(d) { return d.y + yTextOffset; });

          arrows.transition()
                .duration(animationDuration)
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

          indices.transition()
                 .duration(animationDuration)
                 .text(function(d) { return d.value; })
                 .attr("x", function(d) { return d.x + xTextOffset; })
                 .attr("y", function(d) { return d.y + yTextOffset; });
        }

        $rootScope.$emit("Directive loaded", {});
      }
    };
  });
