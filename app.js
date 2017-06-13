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
  // 1. create and append new node with rect and text
  // 2. move new node to bottom position
  // 3. create new arrow (from new node to next node or from prev node to new node)
  // 4. point prev node's arrow to new node if needed
  // 5. insert new value into var values at index #index
  // 6. convertData
  // 7. updateData and reposition elements as before final step
  // 8. updateVisuals
  resetHTML();
  if (values.length >= nodeLimit) {
    document.getElementById("errorMessage").innerHTML = "Node Limit Reached";
  } else {
    var index = document.getElementById("index").value;
    var value = document.getElementById("value").value;

    document.getElementById("addNodeButton").disabled = true;

    var currentStep = 0;
    // 1.
    createNewNode(index, value);
    // 2.
    animateStep(currentStep, function() {
      moveNewNodeAlong()
    });
    currentStep++;

    // 3.
    animateStep(currentStep, function() {
      createNewArrow(index);
      pointNewArrow(index)
    });
    currentStep++;

    // 4.
    if (index > 0 && index < elements.length) {
      animateStep(currentStep, function() {
        pointPrevArrow(index);
      });
      currentStep++;
    }

    animateStep(currentStep, function() {
      // 5.
      values.splice(index, 0, value);

      // 6.
      convertData();

      // 7.
      updateDataAndReposition(index);

      // 8.
      updateVisuals();
      resetHTML();
    });
  }
}

function animateStep(step, func) {
  setTimeout(func, (animationDuration + pauseDuration) * step);
}

function createNewNode(index, value) {
  // create new node with rect and text elements and append to existing list
  // position at bottom left corner

  var newElements = elements.slice();
  var newElem = {
    key: index,
    value: value,
    x: frame(values.length+1) + index * (square + edgeLength),
    y: topY
  }
  newElements.push(newElem);

  var lastIndex = elements.length;

  nodes = nodes.data(newElements);

  var newNode = nodes.enter()
                     .append("g")
                     .attr("id", "node"+lastIndex);

  newNode.append("rect")
         .attr("id", "nodeSquare"+lastIndex)
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
         .attr("id", "nodeText"+lastIndex)
         .attr("x", xTextOffset)
         .attr("y", bottomY + yTextOffset);
}

function moveNewNodeAlong() {
  // animate movement of new node to corresponding position on bottom level
  var lastIndex = elements.length;
  svg.select("#nodeSquare"+lastIndex)
     .transition()
     .duration(animationDuration)
     .attr("x", function(d) {
       return d.x;
     });

  svg.select("#nodeText"+lastIndex)
     .transition()
     .duration(animationDuration)
     .attr("x", function(d) {
       return d.x + xTextOffset;
     });
}

function createNewArrow(index) {
  // animate new node's arrow to point to next node.
  var lastIndex = elements.length;
  var newNodeRect = svg.select("#nodeSquare" + lastIndex);
  if (index < elements.length) {
    // if new node not inserted at end of list,
    // new arrow needed from new node to next node
    var nextNodeRect = svg.select("#nodeSquare" + index);

    var source = {
      x: +newNodeRect.attr("x"),
      y: +newNodeRect.attr("y")
    }

    var target = {
      x: +nextNodeRect.attr("x"),
      y: +nextNodeRect.attr("y")
    }
  } else {
    // if new node inserted at end of list,
    // new arrow needed from prev node to new node
    var prevNodeRect = svg.select("#nodeSquare" + (index-1));

    var source = {
      x: +prevNodeRect.attr("x"),
      y: +prevNodeRect.attr("y")
    }

    var target = {
      x: +newNodeRect.attr("x"),
      y: +newNodeRect.attr("y")
    }
  }


  var newEdge = {
    source: source,
    target: target
  }
  var newEdges = edges.slice();
  newEdges.push(newEdge);
  arrows = arrows.data(newEdges);

  arrows.enter()
        .append("line")
        .attr("id", "arrow"+(lastIndex-1)+lastIndex)
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

function pointNewArrow(index) {
  var lastIndex = elements.length;
  svg.select("#arrow"+(lastIndex-1)+lastIndex)
     .transition()
     .duration(animationDuration)
     .attr("x2", function(d) {
       return d.target.x + square/2;
     })
     .attr("y2", function(d) {
       return d.target.y + (index == elements.length ? 0 : square);
     });
}

function pointPrevArrow(index) {
  // points prev node's arrow to new node
  // function assumes prev arrow already exists i.e. 0 < index < elements.length
  // (does not include newly created prev arrow i.e when index == elements.length)
  var prevArrow = svg.select("#arrow"+(index-1)+index);
  var newNodeRect = svg.select("#nodeSquare"+elements.length);

  prevArrow.transition()
           .duration(animationDuration)
           .attr("x2", +newNodeRect.attr("x") + square/2)
           .attr("y2", newNodeRect.attr("y"));
}

function updateDataAndReposition(index) {
  // updateData and reposition elements as before final step
  nodes = nodes.data(elements);
  arrows = arrows.data(edges);

  nodes.select("g")
       .attr("id", function(d, i) {
         return "node" + i;
       });

  nodes.select("rect")
       .attr("id", function(d, i) {
         return "nodeSquare" + i;
       })
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
       .attr("id", function(d, i) {
         return "nodeText" + i;
       })
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

  arrows.attr("id", function(d, i) {
          return "arrow" + i + (i+1);
        })
        .attr("x1", function(d, i) {
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
