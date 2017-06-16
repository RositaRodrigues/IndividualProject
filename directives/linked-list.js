angular.module("MyApp")
  .directive('linkedList', function() {
    return {
      restrict: 'E',
      scope: false,
      /*{ * = won't need after restructure
          dimensions = {w: 800, h: 500},
          animationDuration = 1000,
          * values = values2.slice(),
          elements,
          edges
        }*/
      link: function(scope, element, attrs) {
        var w = scope.dimensions.w;
        var h = scope.dimensions.h;
        var animationDuration = scope.animationDuration;
        var svg = d3.select(element[0])
                    .append("svg")
                    .attr("width", w)
                    .attr("height", h);
        var indices;
        var nodes;
        var arrows;
        // won't need after restructure
        var square = 50;
        var edgeLength = 50;
        var topY = h/3;
        var bottomY = 2*h/3;
        var xTextOffset = square/2;
        var yTextOffset = square/2 + 7;
        var calcXPosition = scope.calcXPosition;

        scope.$watch("valuesVersion", function(newVersion, oldVersion) {
          constructInitialList();
        });

        function constructInitialList() {
          svg.selectAll("*").remove();

          indices = svg.append("svg:g")
          .attr("id", "indices")
          .selectAll("g")
          .data(d3.range(scope.elements.length));

          nodes = svg.append("svg:g")
          .attr("id", "nodes")
          .selectAll("g")
          .data(scope.elements);

          arrows = svg.selectAll("line")
          .data(scope.edges);

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

          var newNode = nodes.enter()
          .append("g")
          .attr("id", function(d, i) {
            return "node" + i;
          });

          newNode.append("rect")
          .attr("id", function(d, i) {
            return "nodeSquare" + i;
          })
          .attr("x", function(d) {
            return d.x;
          })
          .attr("y", function(d) {
            return d.y;
          })
          .attr("width", square)
          .attr("height", square)
          .attr("fill", function(d) {
            return "rgb(0, 0, " + (d.value * 10) + ")";
          });

          newNode.append("text")
          .text(function(d) {
            return d.value;
          })
          .attr("id", function(d, i) {
            return "nodeText" + i;
          })
          .attr("x", function(d) {
            return d.x + xTextOffset;
          })
          .attr("y", function(d) {
            return d.y + yTextOffset;
          });

          arrows.enter()
          .append("line")
          .attr("id", function(d, i) {
            return "arrow" + i + (i+1);
          })
          .attr("x1", function(d) {
            return d.source.x + square;
          })
          .attr("y1", function(d) {
            return d.source.y + square/2;
          })
          .attr("x2", function(d) {
            return d.target.x;
          })
          .attr("y2", function(d) {
            return d.target.y + square/2;
          });
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
          .attr("x", 0)
          .attr("y", bottomY)
          .attr("width", square)
          .attr("height", square)
          .attr("fill", function(d) {
            return "rgb(0, 0, " + (d.value * 10) + ")";
          });

          newNode.append("text")
          .text(function(d) {
            return d.value;
          })
          .attr("id", "newNodeText")
          .attr("x", xTextOffset)
          .attr("y", bottomY + yTextOffset);
        }

        scope.moveNewNodeAlong = function() {
          svg.select("#newNodeSquare")
          .transition()
          .duration(animationDuration)
          .attr("x", function(d) {
            return d.x;
          });

          svg.select("#newNodeText")
          .transition()
          .duration(animationDuration)
          .attr("x", function(d) {
            return d.x + xTextOffset;
          });
        }

        scope.createNewArrow = function(index) {
          var newNodeRect = svg.select("#newNodeSquare");
          if (index == scope.elements.length) {
            // node inserted at end of list.
            // new arrow created to point from tail to new node.
            var sourceNodeRect = svg.select("#nodeSquare"+(scope.elements.length-1));
            var targetNodeRect = newNodeRect;
          } else {
            // new node inserted at beginning or middle of list.
            // new arrow created to point from new node to next node.
            var sourceNodeRect = newNodeRect;
            var targetNodeRect = svg.select("#nodeSquare"+index);
          }

          var source = {
            x: +sourceNodeRect.attr("x"),
            y: +sourceNodeRect.attr("y")
          }

          var target = {
            x: +targetNodeRect.attr("x"),
            y: +targetNodeRect.attr("y")
          }

          var newEdge = {
            source: source,
            target: target
          }

          svg.select("#newSVGElements")
          .selectAll("line")
          .data([newEdge])
          .enter()
          .append("line")
          .attr("id", "newArrow")
          .attr("x1", function(d) {
            return d.source.x + square;
          })
          .attr("y1", function(d) {
            return d.source.y + square/2;
          })
          .attr("x2", function(d) {
            return d.source.x + square;
          })
          .attr("y2", function(d) {
            return d.source.y + square/2;
          });
        }

        scope.pointFromNewNodeToNextNode = function() {
          svg.select("#newArrow")
          .transition()
          .duration(animationDuration)
          .attr("x2", function(d) {
            return d.target.x + square/2;
          })
          .attr("y2", function(d) {
            return d.target.y + square;
          });
        }

        scope.pointFromPrevNodeToNewNode = function(index) {
          var newNodeRect = svg.select("#newNodeSquare");
          if (index == scope.elements.length) {
            var prevArrow = svg.select("#newArrow");
          } else {
            var prevArrow = svg.select("#arrow"+(index-1)+index);
          }

          prevArrow.transition()
          .duration(animationDuration)
          .attr("x2", +newNodeRect.attr("x") + square/2)
          .attr("y2", +newNodeRect.attr("y"));
        }

        scope.updateDataAndReposition = function(index) {
          // updateData and reposition elements as before final step
          var length = scope.elements.length;

          nodes = nodes.data(scope.elements);
          arrows = arrows.data(scope.edges);

          var newNode = nodes.enter()
          .append("g")
          .attr("id", function(d, i) {
            return "node"+i;
          });

          arrows.enter()
          .append("line")
          .attr("id", function(d, i) {
            return "arrow" + i + (i+1);
          });

          newNode.append("rect")
          .attr("id", function(d, i) {
            return "nodeSquare" + i;
          })
          .attr("width", square)
          .attr("height", square);

          newNode.append("text")
          .attr("id", function(d, i) {
            return "nodeText" + i;
          })
          .text(function(d) {
            return d.value
          });

          nodes.select("rect")
          .attr("x", function(d, i) {
            if (i < index) {
              return calcXPosition(i, length-1);
            } else if (i == index) {
              return calcXPosition(i, length);
            } else {
              return calcXPosition(i-1, length-1);
            }
          })
          .attr("y", function(d, i) {
            if (i == index) {
              return bottomY;
            } else {
              return d.y;
            }
          })
          .attr("fill", function(d) {
            return "rgb(0, 0, " + (d.value * 10) + ")";
          });

          nodes.select("text")
          .text(function(d) {
            return d.value;
          })
          .attr("x", function(d, i) {
            if (i < index) {
              return calcXPosition(i, length-1) + xTextOffset;
            } else if (i == index) {
              return calcXPosition(i, length) + xTextOffset;
            } else {
              return calcXPosition(i-1, length-1) + xTextOffset;
            }
          })
          .attr("y", function(d, i) {
            if (i == index) {
              return bottomY + yTextOffset;
            } else {
              return d.y + yTextOffset;
            }
          });

          arrows.attr("x1", function(d, i) {
            if (i < index) {
              return calcXPosition(i, length-1) + square;
            } else if (i == index) {
              return calcXPosition(i, length) + square;
            } else {
              return calcXPosition(i-1, length-1) + square;
            }
          })
          .attr("y1", function(d, i) {
            if (i == index) {
              return bottomY + square/2;
            } else {
              return d.source.y + square/2;
            }
          })
          .attr("x2", function(d, i) {
            if (i == index-1) { // prevArrow
              return calcXPosition(i+1, length) + square/2;
            } else
            if (i < index) {
              return calcXPosition(i+1, length-1);
            } else if (i == index) {
              return calcXPosition(i, length-1) + square/2;
            } else {
              return calcXPosition(i, length-1);
            }
          })
          .attr("y2", function(d, i) {
            if (i == index-1) { // prevArrow
              return bottomY;
            } else
            if (i == index) {
              return topY + square;
            } else {
              return d.target.y + square/2;
            }
          });

          svg.select("#newSVGElements").data([]).exit().remove();
        }

        scope.updateVisuals = function() {
          nodes.select("rect")
          .transition()
          .duration(animationDuration)
          .attr("x", function(d) {
            return d.x;
          })
          .attr("y", function(d) {
            return d.y;
          });

          nodes.select("text")
          .transition()
          .duration(animationDuration)
          .text(function(d) {
            return d.value;
          })
          .attr("x", function(d) {
            return d.x + xTextOffset;
          })
          .attr("y", function(d) {
            return d.y + yTextOffset;
          });

          arrows.transition()
          .duration(animationDuration)
          .attr("x1", function(d) {
            return d.source.x + square;
          })
          .attr("y1", function(d) {
            return d.source.y + square/2;
          })
          .attr("x2", function(d) {
            return d.target.x;
          })
          .attr("y2", function(d) {
            return d.target.y + square/2;
          });
        }

      }
    };
  });
