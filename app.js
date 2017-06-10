//Width and height
var w = 800;
var h = 300;
var barPadding = 1;
var defaultEdgeLength = 50;
var edgeLength = defaultEdgeLength;
var square = 50;
var nodeLimit = Math.floor((w - 2 * square) / (square + edgeLength)) + 1;
var topY = h / 3;
var bottomY = 2*h/3;
var maxValue = 25;
var elements1 = [ 10, 15 ];
var elements2 = [ 5, 10, 16, 19, 11 ];
var elements3 = [ 5, 2, 25, 10, 18 ];
var elements4 = [ 5, 10, 16, 19, 11, 15, 20, 17 ];
var elements = elements1.slice();
var nodes = [];
var edges = [];
var squares;
var text;
var arrows;

//Create SVG element
var svg = d3.select("body")
            .append("svg")
            .attr("width", w)
            .attr("height", h);


function convertData() {
  nodes = [];
  edges = [];
  var index = 0;
  elements.forEach(function(elem) {
    var node = {
      key: index,
      value: elem,
      xPos: frame() + index * (square + edgeLength),
      yPos: topY
    }
    nodes.push(node);

    if (index > 0) {
      var edge = {
        source: nodes[index - 1],
        target: nodes[index]
      }
      edges.push(edge);
    }
    index++;
  });
}

function restart() {
  convertData();
  svg.selectAll("*").remove();

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

  svg.selectAll("rect")
    .data(nodes)
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

  svg.selectAll("text")
    .data(nodes)
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

    svg.selectAll("line")
      .data(edges)
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
    return (w - elements.length * square - (elements.length - 1) * edgeLength) / 2;
}

function addNode() {
  if (elements.length >= nodeLimit) {
    console.log("max limit reached");
    // if (duplicate) "no duplicates allowed" ?
  } else {
    var newNumber = document.getElementById("value").value;
    var index = document.getElementById("index").value;
    // elements.push(newNumber);
    elements.splice(index, 0, newNumber);
    /*
    "Index: 0   1   2   3 ... n"
    (1) enter new node from bottomY
    (2) move new node to position in between #(index-1) and #index nodes
    (3) attach new arrow from new node to #index node
    (4) move #(index-1) node's arrow to point to new node below
    (5) add #(n+1) label to "Index: " level
    (5) move all nodes and arrows to correct positions
    */

    convertData();
    updateData();
    // console.log(nodes);
    // console.log(edges);
    createNewNode(); // (1)
    moveNewNodeAlong(); // (2)

    // after (5), delete ids of new node's square/text and arrows
/*
    enterElem();
    updateVisuals();
    updateHTML();*/
  }
}

function createNewNode() {
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

function updateHTML() {
  document.getElementById("index").max = elements.length;
  document.getElementById("index").value = 0;
  document.getElementById("value").max = maxValue;
  document.getElementById("value").value = Math.round(Math.random() * maxValue);
}

function updateData() {
  squares = svg.selectAll("rect").data(nodes);
  text = svg.selectAll("text").data(nodes);
  arrows = svg.selectAll("line").data(edges);
}

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
    elements = elements1.slice();
  } else if (version == 2) {
    elements = elements2.slice();
  } else if (version == 3) {
    elements = elements3.slice();
  } else {
    elements = elements4.slice();
  }
  convertData();
  updateHTML();
  restart();
}

restart();
