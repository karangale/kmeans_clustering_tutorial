//used to set centroids and lines when not 0
var slide = 0;
//Var not the first layout - set to false initially, true on the 2nd scroll
var nfirstLayout = false;
//sets cluster flags
var flag = false;
var margin = {top: 50, right: 10, bottom: 50, left: 100},
    width = 900 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

var svg = d3.select("#kmeans svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", margin.top + margin.bottom + height)
  .style("padding", "5px")
  //sets the svg on click function - need this to be the animated part
  .on('click', function() {
    nfirstLayout = true;
    d3.event.preventDefault();
    step();
  });

d3.selectAll("#kmeans button")
  .style('padding', '.5em .8em');

d3.selectAll("#kmeans label")
  .style('display', 'inline-block')
  .style('width', '15em');

//define functions for every step
d3.select("#step")
  .on('click', function() { step(); draw(); });
d3.select("#restart")
  .on('click', function() { nfirstLayout = false; restart(); draw(); });
d3.select("#reset")
  .on('click', function() { nfirstLayout = false; init(); draw(); });


var lineg = svg.append('g');
var dotg = svg.append('g');
var centerg = svg.append('g');
var groups = [];
var dots = [];
var ptchange = 0;

//triggered on click of the Step Button.
//Re-evaluates the centers and redraws the graph.
function step() {
  d3.select("#restart").attr("disabled", null);
  d3.selectAll("div.d3-tip").remove();
  slide++;
  if (flag) {
    moveCenter();
    draw();
  } else {
    updateGroups();
    draw();
  }
  flag = !flag;
}

function init() {
  d3.select("#restart").attr("disabled", "disabled");
  slide = 0;
  var N = parseInt(d3.select('#N')[0][0].value, 10);
  var K = parseInt(d3.select('#K')[0][0].value, 10);
  groups = [];
  for (var i = 0; i < K; i++) {
    var g = {
      dots: [],
      color: 'hsl(' + (i * 360 / K) + ',100%,50%)',
      center: {
        x: Math.random() * width,
        y: Math.random() * height
      },
      init: {
        center: {}
      }
    };
    g.init.center = {
      x: g.center.x,
      y: g.center.y
    };
    groups.push(g);
  }

  dots = [];
  flag = false;
  for (i = 0; i < N; i++) {
    var dot ={
      x: Math.random() * width,
      y: Math.random() * height,
      group: undefined,
      dist: undefined
    };
    dot.init = {
      x: dot.x,
      y: dot.y,
      group: dot.group,
      dist: dot.dist
    };
    dots.push(dot);
  }
}

function restart() {
  flag = false;
  slide = 0;
  d3.select("#restart").attr("disabled", "disabled");

  groups.forEach(function(g) {
    g.dots = [];
    g.center.x = g.init.center.x;
    g.center.y = g.init.center.y;
  });

  for (var i = 0; i < dots.length; i++) {
    var dot = dots[i];
    dots[i] = {
      x: dot.init.x,
      y: dot.init.y,
      group: undefined,
      dist: undefined,
      init: dot.init
    };
  }
}


function draw() {
  var circles = dotg.selectAll('circle')
    .data(dots);
  circles.enter()
    .append('circle');
  circles.exit().remove();
  circles
    .transition()
    .duration(500)
    .attr('cx', function(d) { return d.x; })
    .attr('cy', function(d) { return d.y; })
    .attr('fill', function(d) { return nfirstLayout ? d.group.color : '#000000'; })
    .attr('r', 5);


  var tip = d3.tip()
  .attr('class', 'd3-tip')
  .direction('n')
  .offset([-10, 0])
  .html(function(d) {
    return "<strong>ED</strong> <span style='color:white'>" + d.dist + "</span>";
  })

  svg.call(tip);


    var c = centerg.selectAll('path')
      .data(groups);
    var updateCenters = function(centers) {
      centers
      .attr('transform', function(d) { return "translate(" + d.center.x + "," + d.center.y + ") rotate(45)";})
      .attr('fill', function(d,i) { return d.color; })
      .attr('stroke', '#aabbcc');
    };

    
  //Add centroid after first scroll
  if(slide != 0)
  {
    c.exit().remove();

    // draw the centroids
    updateCenters(c.enter()
    .append('path')
    .attr('d', d3.svg.symbol().type('square').size(function(d) {
        return (25 * 25) / 2;}))
    .attr('stroke', '#aabbcc'));

    updateCenters(c
    .transition()
    .duration(500));
    if(slide != 0 && slide != 1)
    {
      //draw the centroid lines
      if (dots[0].group) {
      var l = lineg.selectAll('line')
      .data(dots);
      var updateLine = function(lines) {
        lines
        .attr('x1', function(d) { return d.x; })
        .attr('y1', function(d) { return d.y; })
        .attr('x2', function(d) { return d.group.center.x; })
        .attr('y2', function(d) { return d.group.center.y; })
        .attr('stroke', function(d) { return d.group.color; });
        };
        updateLine(l.enter().append('line'));
        updateLine(l.transition().duration(500));
        l.exit().remove();
      } 
      else {
        lineg.selectAll('line').remove();
      }
    }

      //Add the ED to the dots
      dotg.selectAll('circle')
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);
      

      //Add the ED to the lines
      lineg.selectAll('line')
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

      svg.append("text")
        .attr("x", (2)) // spacing
        .attr("y", margin.top - 30)
        .text(ptchange + " points changed clusters in this step.")
        .attr("class", "ptchangelable");
      }
  }

//Changes the centroids
function moveCenter() {
  groups.forEach(function(group, i) {
    if (group.dots.length == 0) return;

    // get center of the clusters
    var x = 0, y = 0;
    group.dots.forEach(function(dot) {
      x += dot.x;
      y += dot.y;
    });

    group.center = {
      x: x / group.dots.length,
      y: y / group.dots.length
    };
  });
  
}

//Re-evaluate the points for each cluster
function updateGroups() {
  svg.selectAll(".ptchangelable").remove();
  var dotno = [], i = 0;
  ptchange = 0;
  while(i<groups.length){
    dotno[i] = groups[i].dots.length;
    i++;
  } 
  groups.forEach(function(g) { g.dots = []; });
  dots.forEach(function(dot) {
    // find the nearest group
    var min = Infinity;
    var group;
    var dist;
    groups.forEach(function(g) {
      var d = Math.pow(g.center.x - dot.x, 2) + Math.pow(g.center.y - dot.y, 2);
      if (d < min) {
        min = d;
        //assigning updated groups to the points
        group = g;
        //assigning updated Euclidean Distance to every point
        dot.dist = (Math.sqrt(d)).toFixed(4);
      }
    });

    // update group
    group.dots.push(dot);
    dot.group = group;
  });
  i = 0;
  while(i<groups.length){
    if(dotno[i]< groups[i].dots.length)
      ptchange = ptchange + ((groups[i].dots.length)-dotno[i])
    i++;
  } 
}

init(); draw();
