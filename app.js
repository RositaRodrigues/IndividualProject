var w = 800;
var h = 300;
var barPadding = 1;
var defaultEdgeLength = 50;
var edgeLength = defaultEdgeLength;
var square = 50;
var nodeLimit = Math.floor((w - 2 * square) / (square + edgeLength)) + 1;
var topY = h / 3;
var bottomY = 2*h/3;
var xTextOffset = square/2;
var yTextOffset = square/2 + 7;
var maxValue = 25;
var animationDuration = 1000; // ms
var pauseDuration = 50; // ms
var values1 = [ 10, 15 ];
var values2 = [ 25, 10, 16, 19, 11 ];
var values3 = [ 5, 2, 25, 10, 18 ];
var values4 = [ 5, 10, 16, 19, 11, 15, 20, 17 ];
var values = values2.slice();
var elements = [];
var edges = [];
var indices;
// var indexSquares;
// var indexTexts;
var nodes;
// var nodeSquares;
// var nodeTexts;
var arrows;

var svg = d3.select("body")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

function calcXPosition(index, numberOfNodes) {
  return frame(numberOfNodes) + index * (square + edgeLength);
}

function frame(newNumberOfNodes) {
    var numberOfNodes = newNumberOfNodes || values.length;
    return (w - numberOfNodes * square - (numberOfNodes - 1) * edgeLength) / 2;
}

function convertData() {
  elements = [];
  edges = [];
  var index = 0;
  values.forEach(function(val) {
    var element = {
      key: index,
      value: val,
      x: calcXPosition(index),
      y: topY
    }
    elements.push(element);

    if (index > 0) {
      var edge = {
        source: elements[index - 1],
        target: elements[index]
      }
      edges.push(edge);
    }
    index++;
  });
}

function start() {
  convertData();
  svg.selectAll("*").remove();

  indices = svg.append("svg:g")
               .attr("id", "indices")
               .selectAll("g")
               .data(d3.range(values.length));
  // indexSquares = indices.selectAll("rect");
  // indexTexts = indices.selectAll("text");

  nodes = svg.append("svg:g")
             .attr("id", "nodes")
             .selectAll("g")
             .data(elements);
  // nodeSquares = nodes.selectAll("rect");
  // nodeTexts = nodes.selectAll("text");

  arrows = svg.selectAll("line")
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

function addNode() {
  if (values.length >= nodeLimit) {
    document.getElementById("errorMessage").innerHTML = "Node Limit Reached";
  } else {
    document.getElementById("errorMessage").innerHTML = "";

    var index = document.getElementById("index").value;
    var value = document.getElementById("value").value;

    document.getElementById("addNodeButton").disabled = true;

    var newElem = {
      key: index,
      value: value,
      x: calcXPosition(index, values.length+1),
      y: topY
    }

    var currentStep = 0;
    // 1. create new node with rect and text
    createNewNode(newElem);
    // 2. move new node to bottom position
    animateStep(currentStep, function() {
      moveNewNodeAlong()
    });
    currentStep++;

    // 3. create new arrow (from new node to next node or from prev node to new node)
    animateStep(currentStep, function() {
      createNewArrow(index);
    });

    if (index < values.length) {
      // next node exists
      animateStep(currentStep, function() {
        // 4. point new node's arrow to next node
        pointFromNewNodeToNextNode();
      });
      currentStep++;
    }

    if (index > 0) {
      // prev node exists
      animateStep(currentStep, function() {
        // 5. point prev node's arrow to new node
        pointFromPrevNodeToNewNode(index);
      });
      currentStep++;
    }

    animateStep(currentStep, function() {
      // 6. insert value into values and convert into new data
      values.splice(index, 0, value);
      convertData();
      // 7. update data, create space for new data, reposition elements as before final step
      updateDataAndReposition(index);
      // 8. reposition as new list
      updateVisuals();
      resetHTML();
    });
  }
}

function animateStep(step, func) {
  setTimeout(func, (animationDuration + pauseDuration) * step);
}

function createNewNode(newElem) {
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

function moveNewNodeAlong() {
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

function createNewArrow(index) {
  var newNodeRect = svg.select("#newNodeSquare");
  if (index == values.length) {
    // node inserted at end of list.
    // new arrow created to point from tail to new node.
    var sourceNodeRect = svg.select("#nodeSquare"+(values.length-1));
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

function pointFromNewNodeToNextNode() {
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

function pointFromPrevNodeToNewNode(index) {
  var newNodeRect = svg.select("#newNodeSquare");
  if (index == values.length) {
    var prevArrow = svg.select("#newArrow");
  } else {
    var prevArrow = svg.select("#arrow"+(index-1)+index);
  }

  prevArrow.transition()
           .duration(animationDuration)
           .attr("x2", +newNodeRect.attr("x") + square/2)
           .attr("y2", +newNodeRect.attr("y"));
}

function updateDataAndReposition(index) {
  // updateData and reposition elements as before final step
  nodes = nodes.data(elements);
  arrows = arrows.data(edges);

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
           return calcXPosition(i, values.length-1);
         } else if (i == index) {
           return calcXPosition(i, values.length);
         } else {
           return calcXPosition(i-1, values.length-1);
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
           return calcXPosition(i, values.length-1) + xTextOffset;
         } else if (i == index) {
           return calcXPosition(i, values.length) + xTextOffset;
         } else {
           return calcXPosition(i-1, values.length-1) + xTextOffset;
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
            return calcXPosition(i, values.length-1) + square;
          } else if (i == index) {
            return calcXPosition(i, values.length) + square;
          } else {
            return calcXPosition(i-1, values.length-1) + square;
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
            return calcXPosition(i+1, values.length) + square/2;
          } else
          if (i < index) {
            return calcXPosition(i+1, values.length-1);
          } else if (i == index) {
            return calcXPosition(i, values.length-1) + square/2;
          } else {
            return calcXPosition(i, values.length-1);
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

function updateVisuals() {
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

function resetHTML() {
  document.getElementById("index").max = values.length;
  document.getElementById("index").value = 0;
  document.getElementById("value").max = maxValue;
  document.getElementById("value").value = Math.round(Math.random() * maxValue);
  document.getElementById("addNodeButton").disabled = false;
  document.getElementById("errorMessage").innerHTML = "";
}

function loadElements(version) {
  if (version == 1) {
    values = values1.slice();
  } else if (version == 2) {
    values = values2.slice();
  } else if (version == 3) {
    values = values3.slice();
  } else {
    values = values4.slice();
  }
  convertData();
  resetHTML();
  start();
}

start();
