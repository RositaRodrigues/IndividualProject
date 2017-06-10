//Width and height
var w = 800;
var h = 300;
var barPadding = 1;
var defaultEdgeLength = 50;
var edgeLength = defaultEdgeLength;
var square = 50;
var elementLimit = Math.floor((w - 2 * square) / (square + edgeLength)) + 1;
var topY = h / 3;
var bottomY = 2*h/3;
var maxValue = 25;
var values1 = [ 10, 15 ];
var values2 = [ 5, 10, 16, 19, 11 ];
var values3 = [ 5, 2, 25, 10, 18 ];
var values4 = [ 5, 10, 16, 19, 11, 15, 20, 17 ];
var values = values1.slice();
var elements = [];
var edges = [];
var indices;
var indexSquares;
var indexTexts;
var nodes;
var nodeSquares;
var nodeTexts;
var arrows;

var svg = d3.select("body")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

function convertData() {
  elements = [];
  edges = [];
  var index = 0;
  values.forEach(function(val) {
    var element = {
      key: index,
      value: val,
      xPos: frame() + index * (square + edgeLength),
      yPos: topY
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

function restart() {
  convertData();
  svg.selectAll("*").remove();

  indices = svg.append("svg:g").selectAll("g").data(d3.range(values.length));
  indexSquares = indices.selectAll("rect");
  indexTexts = indices.selectAll("text");

  nodes = svg.append("svg:g").selectAll("g").data(elements);
  nodeSquares = nodes.selectAll("rect");
  nodeTexts = nodes.selectAll("text");

  arrows = svg.selectAll("line");

  svg.append('svg:defs').append('svg:marker')
      .attr('id', 'end-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 6)
      .attr('markerWidth', 3)
      .attr('markerHeight', 3)
      .attr('orient', 'auto')
    .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#000');

  var newNode = nodes.enter().append("g");
  newNode.append("rect")
         .attr("x", function(d) {
           return d.xPos;
         })
         .attr("y", function(d) {
           return d.yPos;
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
         .attr("x", function(d) {
           return d.xPos + square/2;
         })
         .attr("y", function(d) {
           return d.yPos + square/ 2 + 7 ;
         })
         .attr("font-family", "sans-serif")
         .attr("font-size", "20px")
         .attr("fill", "white")
         .attr("text-anchor", "middle");
/*
  squares.data(elements)
    .enter()
    .append("rect")
    .attr("x", function(d) {
      return d.xPos;
    })
    .attr("y", function(d) {
      return d.yPos;
    })
    .attr("width", square)
    .attr("height", square)
    .attr("fill", function(d) {
      return "rgb(0, 0, " + (d.value * 10) + ")";
    });

  text.data(elements)
    .enter()
    .append("text")
    .text(function(d) {
      return d.value;
    })
    .attr("x", function(d) {
      return d.xPos + square/2;
    })
    .attr("y", function(d) {
      return d.yPos + square/ 2 + 7 ;
    })
    .attr("font-family", "sans-serif")
    .attr("font-size", "20px")
    .attr("fill", "white")
    .attr("text-anchor", "middle");
*/

  arrows.data(edges)
    .enter()
    .append("line")
    .style("marker-end", "url(#end-arrow)")
    .style("stroke", "black")
    .style("stroke-width", "5px")
    .style("fill", "none")
    .attr("x1", function(d) {
      return d.source.xPos + square;
    })
    .attr("y1", function(d) {
      return d.source.yPos + square/2;
    })
    .attr("x2", function(d) {
      return d.target.xPos;
    })
    .attr("y2", function(d) {
      return d.target.yPos + square/2;
    });
}

function frame() {
    return (w - values.length * square - (values.length - 1) * edgeLength) / 2;
}

function addNode() {
  if (values.length >= elementLimit) {
    console.log("max limit reached");
    // if (duplicate) "no duplicates allowed" ?
  } else {
    var newNumber = document.getElementById("value").value;
    var index = document.getElementById("index").value;
    // values.push(newNumber);
    values.splice(index, 0, +newNumber);
    /*
    "Index: 0   1   2   3 ... n"
    (1) enter new element from bottomY
    (2) move new element to position in between #(index-1) and #index elements
    (3) attach new arrow from new element to #index element
    (4) move #(index-1) element's arrow to point to new element below
    (5) add #(n+1) label to "Index: " level
    (5) move all elements and arrows to correct positions
    */

    convertData();
    // console.log(elements);
    // console.log(edges);
    updateData();
    createNewNode(); // (1)
    moveNewNodeAlong(); // (2)

    // after (5), delete ids of new element's square/text and arrows
/*
    enterElem();
    updateVisuals();
    updateHTML();*/
  }
}
/*
function updateData() {
  squares = squares.data(elements);
  text = text.data(elements);
  arrows = arrows.data(edges);
}

function createNewNode() {
  console.log("creating");
  squares.enter()
         .append("rect")
         .attr("id", "newNodeSquare")
         .attr("x", 0)
         .attr("y", bottomY)
         .attr("width", square)
         .attr("height", square)
         .attr("fill", function(d) {
           return "rgb(0, 0, " + (d.value * 10) + ")";
         });

   text.enter()
       .append("text")
       .text(function(d) {
         return d.value;
       })
       .attr("id", "newNodeText")
       .attr("x", square/2)
       .attr("y", bottomY + square/ 2 + 7)
       .attr("font-family", "sans-serif")
       .attr("font-size", "20px")
       .attr("fill", "white")
       .attr("text-anchor", "middle");
}

function moveNewNodeAlong() {
  svg.select("#newNodeSquare")
     .transition()
     .duration(1000)
     .attr("x", function(d) {
       return d.xPos;
     })
     .attr("y", function(d) {
         return bottomY;
     });

  svg.select("#newNodeText")
     .transition()
     .duration(1000)
     .text(function(d) {
       return d.value;
     })
     .attr("x", function(d) {
       return d.xPos + square/2;
     })
     .attr("y", function(d) {
         return bottomY + square/2 + 7
     });
}
*/
function updateHTML() {
  document.getElementById("index").max = values.length;
  document.getElementById("index").value = 0;
  document.getElementById("value").max = maxValue;
  document.getElementById("value").value = Math.round(Math.random() * maxValue);
}
/*
function enterElem() {
  squares.enter()
         .append("rect")
         .attr("x", 0)
         .attr("y", bottomY)
         .attr("width", square)
         .attr("height", square)
         .attr("fill", function(d) {
           return "rgb(0, 0, " + (d.value * 10) + ")";
         });

   text.enter()
       .append("text")
       .text(function(d) {
         return d.value;
       })
       .attr("x", square/2)
       .attr("y", bottomY + square/ 2 + 7)
       .attr("font-family", "sans-serif")
       .attr("font-size", "20px")
       .attr("fill", "white")
       .attr("text-anchor", "middle");

  arrows.enter()
        .append("line")
        .style("marker-end", "url(#end-arrow)")
        .style("stroke", "black")
        .style("stroke-width", "5px")
        .style("fill", "none")
        .attr("x1", function(d) {
          return d.source.xPos + square;
        })
        .attr("y1", function(d) {
          return d.source.yPos + square/2;
        })
        .attr("x2", function(d) {
          return d.source.xPos + square;
        })
        .attr("y2", function(d) {
          return d.source.yPos + square/2;
        });
}

function updateVisuals() {
  squares.transition()
         .duration(1000)
         .attr("x", function(d) {
           return d.xPos;
         })
         .attr("y", function(d) {
           return d.yPos;
         });

  text.transition()
      .duration(1000)
      .text(function(d) {
        return d.value;
      })
      .attr("x", function(d) {
        return d.xPos + square/2;
      })
      .attr("y", function(d) {
        return d.yPos + square/ 2 + 7 ;
      });

  arrows.transition()
        .duration(1000)
        .attr("x1", function(d) {
          return d.source.xPos + square;
        })
        .attr("y1", function(d) {
          return d.source.yPos + square/2;
        })
        .attr("x2", function(d) {
          return d.target.xPos;
        })
        .attr("y2", function(d) {
          return d.target.yPos + square/2;
        });
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
  updateHTML();
  restart();
}
*/
restart();
