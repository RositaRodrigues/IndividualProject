//Width and height
var w = 800;
var h = 300;
var barPadding = 1;
var defaultEdgeLength = 50;
var edgeLength = defaultEdgeLength;
var square = 50;
var nodeLimit = Math.floor((w - 2 * square) / (square + edgeLength)) + 1; // use for insert check
var topY = h / 3;
var bottomY = 2*h/3;
var maxValue = 25;
var elements1 = [ 10, 15 ];
var elements2 = [ 5, 10, 16, 19, 11 ];
var elements3 = [ 5, 2, 25, 10, 18 ];
// var elements3 = [ 5, 10, 16, 19, 11, 15, 20, 17 ];
var elements = elements2;
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
    console.log("converting data");
    index++;
  });
}

function restart() {
  //svg.selectAll("*").remove();
  convertData();

  svg.selectAll("rect")
    .data(nodes)
    .enter()
    .append("rect")
    .attr("x", function(d) {
      return d.xPos;
    })
    .attr("y", function(d) {
      return d.yPos; // topY
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
      return d.yPos + square/ 2 + 7 ; // d.yPos = topY
    })
    .attr("font-family", "sans-serif")
    .attr("font-size", "20px")
    .attr("fill", "white")
    .attr("text-anchor", "middle");

  console.log(edges);
/*
  svg.append('svg:g').selectAll('path')
  // svg.selectAll('path')
    .data(edges)
    .enter()
    .append("path")
    .style("marker-start", "")
    .style("marker-end", "url(#end-arrow)")
    .style("stroke", "black")
    .style("stroke-width", "5px")
    .style("fill", "none")
    .attr("d", function(d, i) {
      console.log(i);
      console.log(d);
      var sourceX = d.source.xPos + square;
      var sourceY = d.source.yPos + square / 2;
      var targetX = d.target.xPos;
      var targetY = d.target.yPos + square / 2;
      return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
    });*/
    svg.selectAll("line")
      .data(edges)
      .enter()
      .append("line")
      // .style("marker-start", "")
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
  console.log("addNode clicked");
  if (elements.length >= nodeLimit) {
    console.log("max limit reached");
    // if (duplicate) "no duplicates allowed" ?
  } else {
    var newNumber = Math.round(Math.random() * maxValue);
    elements.push(newNumber);
    convertData();
    updateData();
    enterElem();
    updateVisuals();
    // restart();
    // console.log(edges);
    // console.log(nodes);
  }
}

function updateData() {
  squares = svg.selectAll("rect").data(nodes);
  text = svg.selectAll("text").data(nodes);
  // arrows = svg.append('svg:g').selectAll("path").data(edges);
  arrows = svg.selectAll("line").data(edges);
}

function enterElem() {
  squares.enter()
         .append("rect")
         .attr("x", w)
         .attr("y", function(d) {
           return d.yPos; // topY
         })
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
       .attr("x", w + square/2)
       .attr("y", function(d) {
         return d.yPos + square/ 2 + 7 ; // d.yPos = topY
       })
       .attr("font-family", "sans-serif")
       .attr("font-size", "20px")
       .attr("fill", "white")
       .attr("text-anchor", "middle");
/*
  arrows.enter()
        .append("path")
        .style("marker-start", "")
        .style("marker-end", "url(#end-arrow)")
        .style("stroke", "black")
        .style("stroke-width", "5px")
        .style("fill", "none")
        .attr("d", function(d) {
          var sourceX = d.source.xPos + square;
          var sourceY = d.source.yPos + square / 2;
          // var targetX = d.target.xPos;
          // var targetY = d.target.yPos + square / 2;
          return 'M' + sourceX + ',' + sourceY + 'L' + sourceX + ',' + sourceY;
        });*/
  arrows.enter()
        .append("line")
        // .style("marker-start", "")
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
           return d.yPos; // topY
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
        return d.yPos + square/ 2 + 7 ; // d.yPos = topY
      });

/*
  arrows.transition()
        .duration(1000)
        .attr("d", function(d) {
          var sourceX = d.source.xPos + square;
          var sourceY = d.source.yPos + square / 2;
          var targetX = d.target.xPos;
          var targetY = d.target.yPos + square / 2;
          return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
        });
        */
  arrows.transition()
        .duration(1000)
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

function loadElements1() {
  elements = elements1;
  // restart();
  convertData();
  redraw();
  console.log(elements);
}

function loadElements2() {
  elements = elements2;
  // restart();
  convertData();
  redraw();
  console.log(elements);
}

function loadElements3() {
  elements = elements3;
  // restart();
  convertData();
  redraw();
  console.log(elements);
}

function redraw() {
  svg.selectAll("rect")
    .data(nodes)
    .transition()
    .duration(1000)
    .attr("x", function(d) {
      return d.xPos;
    })
    .attr("y", function(d) {
      return d.yPos; // topY
    })
    .attr("width", square)
    .attr("height", square)
    .attr("fill", function(d) {
      return "rgb(0, 0, " + (d.value * 10) + ")";
    });

  svg.selectAll("text")
    .data(nodes)
    .transition()
    .duration(1000)
    .text(function(d) {
      return d.value;
    })
    .attr("x", function(d) {
      return d.xPos + square/2;
    })
    .attr("y", function(d) {
      return d.yPos + square/ 2 + 7 ; // d.yPos = topY
    })
    .attr("font-family", "sans-serif")
    .attr("font-size", "20px")
    .attr("fill", "white")
    .attr("text-anchor", "middle");

  svg.selectAll("lines")
    .data(edges)
    .transition()
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

restart();
