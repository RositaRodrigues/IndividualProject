angular.module("MyApp")
  .directive('visualization', function($rootScope) {
    return {
      restrict: 'E',
      scope: false,
      link: function(scope, element, attrs) {
        var w = scope.dimensions.w;
        var h = scope.dimensions.h;
        var animationDuration = scope.animationDuration; // TODO: use watch variable if animation panel ever gets created
        var colour = scope.colour;
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
                  .attr("fill", colour);

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
                 .text(function(d, i) { return i; })
                 .attr("x", function(d) { return d.x; })
                 .attr("y", function(d) { return d.y; });
        }

        function constructLabels(labelData) {
          labels = svg.append("svg:g")
                      .attr("id", "labels")
                      .attr("class", "labels")
                      .selectAll("text")
                      .data(labelData);

          labels.enter()
                .append("text")
                .attr("id", function(d) { return d.text + "Label"; })
                .text(function(d) { return d.text; })
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; });
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
                 .attr("fill", colour);

          newNode.append("text")
                 .attr("id", "newNodeText")
                 .text(function(d) { return d.value; })
                 .attr("x", function(d) { return d.x + xTextOffset; })
                 .attr("y", function(d) { return d.y + yTextOffset; })
                 .attr("fill", "white");
        }

        scope.createNewArrow = function(newEdge) {
          svg.select("#newSVGElements")
             .append("g")
             .attr("id", "newArrow")
             .selectAll("line")
             .data([newEdge])
             .enter()
             .append("line")
             .attr("id", "newArrowLine")
             .attr("x1", function(d) { return d.source.x; })
             .attr("y1", function(d) { return d.source.y; })
             .attr("x2", function(d) { return d.target.x; })
             .attr("y2", function(d) { return d.target.y; });
        }

        scope.createNewIndex = function(newIndex) {
          svg.select("#newSVGElements")
             .append("g")
             .attr("id", "newIndex")
             .selectAll("text")
             .data([newIndex])
             .enter()
             .append("text")
             .attr("id", "newIndexText")
             .text(function(d) { return d.value; })
             .attr("x", function(d) { return d.x; })
             .attr("y", function(d) { return d.y; })
        }

        scope.updateNodePositionAndTransition = function(id, newData) {
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

        scope.updateArrowPositionAndTransition = function(id, newData) {
          svg.select("#" + id)
             .data(newData)
             .transition()
             .duration(animationDuration)
             .attr("x1", function(d) { return d.source.x; })
             .attr("y1", function(d) { return d.source.y; })
             .attr("x2", function(d) { return d.target.x; })
             .attr("y2", function(d) { return d.target.y; });
        }

        scope.updateIndexPositionAndTransition = function(id, newData) {
          svg.select("#" + id)
             .data(newData)
             .transition()
             .duration(animationDuration)
            //  .text(function(d) { return d.value; })
             .attr("x", function(d) { return d.x; })
             .attr("y", function(d) { return d.y; });
        }

        scope.updateLabelPositionAndTransition = function(id, newData) {
          if (newData) {
            labels = labels.data(newData);
          }
          svg.select("#"+id)
             .transition()
             .duration(animationDuration)
             .text(function(d) { return d.text })
             .attr("x", function(d) { return d.x; })
             .attr("y", function(d) { return d.y; });
        }

        scope.updateNodePosition = function(id, newData) {
          svg.select("#" + id)
             .data(newData);

          svg.select("#" + id + "Square")
             .attr("x", function(d) { return d.x; })
             .attr("y", function(d) { return d.y; });

          svg.select("#" + id + "Text")
             .attr("x", function(d) { return d.x + xTextOffset; })
             .attr("y", function(d) { return d.y + yTextOffset; });
        }

        scope.updateArrowPosition = function(id, newData) {
          svg.select("#" + id)
             .data(newData)
             .attr("x1", function(d) { return d.source.x; })
             .attr("y1", function(d) { return d.source.y; })
             .attr("x2", function(d) { return d.target.x; })
             .attr("y2", function(d) { return d.target.y; });
        }

        scope.updateIndexPosition = function(id, newData) {
          svg.select("#" + id)
             .data(newData)
            //  .text(function(d) { return d.value; })
             .attr("x", function(d) { return d.x; })
             .attr("y", function(d) { return d.y; });
        }

        scope.updateLabelPosition = function(id, newData) {
          if (newData) {
            labels = labels.data(newData);
          }
          svg.select("#"+id)
             .text(function(d) { return d.text })
             .attr("x", function(d) { return d.x; })
             .attr("y", function(d) { return d.y; });
        }

        scope.appendNode = function() {
          var newData = nodes.data();
          newData.push([]);
          nodes = nodes.data(newData);
          var newNode = nodes.enter()
                             .append("g")
                             .attr("id", function(d, i) { return "node"+i; });

          newNode.append("rect")
                 .attr("id", function(d, i) { return "node"+i+"Square"; })
                 .attr("width", square)
                 .attr("height", square);

          newNode.append("text")
                 .attr("id", function(d, i) { return "node"+i+"Text"; });
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
               .attr("fill", colour);

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

        scope.updateAllIndices = function(indexData) {
          indices = indices.data(indexData);
          indices.text(function(d, i) { return i; })
                 .attr("x", function(d) { return d.x; })
                 .attr("y", function(d) { return d.y; });
        }

        scope.updateAllLabels = function(labelData) {
          labels = labels.data(labelData);
          labels.text(function(d) { return d.text; })
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; });
        }

        scope.updateAll = function(elements, edges, indexData, labelData) {
          scope.updateAllNodes(elements);
          scope.updateAllArrows(edges);
          scope.updateAllIndices(indexData);
          scope.updateAllLabels(labelData);
        }

        scope.setNodeInvisible = function(index) {
          svg.select("#node" + index)
             .attr("display", "none");
        }

        scope.setNodeVisible = function(index) {
          svg.select("#node" + index)
             .attr("display", "inline");
        }

        scope.setArrowInvisible = function(index) {
          svg.select("#arrow" + index + (index+1))
             .attr("display", "none");
        }

        scope.setArrowVisible = function(index) {
          svg.select("#arrow" + index + (index+1))
             .attr("display", "inline");
        }

        scope.setIndexInvisible = function(index) {
          svg.select("#index" + index)
             .attr("display", "none");
        }

        scope.setIndexVisible = function(index) {
          svg.select("#index" + index)
             .attr("display", "inline");
        }

        scope.deleteNewElements = function() {
          svg.select("#newSVGElements").data([]).exit().remove();
        }

        scope.updateAllNodesAndTransition = function(elements) {
          nodes = nodes.data(elements);

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
        }

        scope.updateAllArrowsAndTransition = function(edges) {
          arrows = arrows.data(edges);

          arrows.transition()
                .duration(animationDuration)
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
        }

        scope.updateAllIndicesAndTransition = function(indexData) {
          indices = indices.data(indexData);

          indices.transition()
                 .duration(animationDuration)
                 .text(function(d, i) { return i; })
                 .attr("x", function(d) { return d.x; })
                 .attr("y", function(d) { return d.y; });
        }

        scope.updateAllLabelsAndTransition = function(labelData) {
          labels = labels.data(labelData);

          labels.transition()
                .duration(animationDuration)
                .text(function(d) { return d.text; })
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; });
        }

        scope.updateAllAndTransition = function(elements, edges, indexData, labelData) {
          scope.updateAllNodesAndTransition(elements);
          scope.updateAllArrowsAndTransition(edges);
          scope.updateAllIndicesAndTransition(indexData);
          scope.updateAllLabelsAndTransition(labelData);
        }

        scope.deleteNode = function(index) {
          var newData = nodes.data();
          newData.splice(index, 1);
          nodes = nodes.data(newData);
          nodes.exit().remove();
          scope.updateAllNodes(newData);
        }

        scope.deleteArrow = function(index) {
          var newData = arrows.data();
          newData.splice(index, 1);
          arrows = arrows.data(newData);
          arrows.exit().remove();
          scope.updateAllArrows(newData);
        }

        scope.deleteIndex = function() {
          var newData = indices.data();
          newData.splice(newData.length-1, 1);
          indices = indices.data(newData);
          indices.exit().remove();
          scope.updateAllIndices(newData);
        }

        $rootScope.$emit("Visualization loaded", {});
      }
    };
  });
