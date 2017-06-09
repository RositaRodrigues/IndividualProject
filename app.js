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
var elements1 = [ 10, 15 ];
var elements2 = [ 5, 10, 16, 19, 11];
var elements3 = [ 5, 10, 16, 19, 11, 15, 20, 17];
var elements = elements2;
var dataset = [];
var links = [];

//Create SVG element
var svg = d3.select("body")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

function restart() {
  svg.selectAll("*").remove();
  dataset = [];
  links = [];
  var index = 0;
  elements.forEach(function(elem) {
    var data = {
      key: index,
      value: elem,
      xPos: frame() + index * (square + edgeLength),
      yPos: topY
    }
    dataset.push(data);

    if (index > 0) {
      var link = {
        source: dataset[index - 1],
        target: dataset[index]
      }
      links.push(link);
    }

    index++;
  });

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
  .data(dataset)
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

svg.append('svg:g').selectAll('path')
  .data(links)
  .enter()
  .append("path")
  .style("marker-start", "")
  .style("marker-end", "url(#end-arrow)")
  .style("stroke", "black")
  .style("stroke-width", "5px")
  .style("fill", "none")
  .attr("d", function(d, i) {
    var sourceX = d.source.xPos + square;
    var sourceY = d.source.yPos + square / 2;
    var targetX = d.target.xPos;
    var targetY = d.target.yPos + square / 2;
    return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
  });

svg.selectAll("text")
  .data(dataset)
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

}

function frame() {
    return (w - elements.length * square - (elements.length - 1) * edgeLength) / 2;
}

function addNode() {
  restart();
  console.log("addNode clicked");
  // console.log(links);
  // console.log(dataset);
}

function loadElements1() {
  console.log("loadElements1 clicked");
  elements = elements1;
  restart();
}

function loadElements2() {
  console.log("loadElements2 clicked");
  elements = elements2;
  restart();
}

function loadElements3() {
  console.log("loadElements3 clicked");
  elements = elements3;
  restart();
}

restart();
