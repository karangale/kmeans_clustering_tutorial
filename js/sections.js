
/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
var scrollVis = function() {
  // constants to define the size
  // and margins of the vis area.
  var width = 600;
  var height = 520;
  var margin = {top:20, left:20, bottom:40, right:10};

  //used to set centroids and lines when not 0
  var slide = 0;

  // Var not the first layout - set to false initially, true on the 2nd scroll
  var nfirstLayout = false;

  //sets cluster flags
  var flag = false;
  var centroidflag = false;

  // Initialise visualization area
  var vis = d3.select("#vis");

  // Keep track of which visualization
  // we are on and which was the last
  // index activated. When user scrolls
  // quickly, we want to call all the
  // activate functions that they pass.
  var lastIndex = -1;
  var activeIndex = 0;

  // Sizing for the grid visualization
  var squareSize = 6;
  var squarePad = 2;
  var numPerRow = width / (squareSize + squarePad);

  // main svg used for visualization
  var svg = null;

  // d3 selection that will be used
  // for displaying visualizations
  var g = null;

  // Initialise dots, lines, centroids
  // and pointchange variables
  var dotg = null;
  var lineg = null;
  var centerg = null;
  var ptchange = 1;


  // When scrolling to a new section
  // the activation function for that
  // section is called.
  var activateFunctions = [];
  // If a section has an update function
  // then it is called while scrolling
  // through the section with the current
  // progress through the section.
  var updateFunctions = [];

  d3.selectAll("#kmeans label")
    .style('display', 'inline-block')
    .style('width', '15em');


  /**
   * chart
   *
   * @param selection - the current d3 selection(s)
   *  to draw the visualization in. For this
   *  example, we will be drawing it in #vis
   */
  var chart = function(selection) {
    selection.each(function(d) {
      // create svg and give it a width and height
      svg = d3.select(this).selectAll("svg").data([start]);
      svg.enter().append("svg").append("g");

      svg.attr("width", width + margin.left + margin.right);
      svg.attr("height", height + margin.top + margin.bottom);
      svg.attr("padding-top", "20px");


      // this group element will be used to contain all
      // other elements.
      g = svg.select("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("padding-top", "20px");



      // start the data section
      var start = null;


      setupVis();

      setupSections();

    });
  };

  /**
   * setupVis - creates initial elements for all
   * sections of the visualization.
   */
  setupVis = function() {

    dotg = g.append('g');
    lineg = g.append('g');
    centerg = g.append('g');

  };

  var groups = [];
  var dots = [];


  //Get the initial randomized points and centroids
  function init() {
    nfirstLayout = false;
    slide = 0;
    var N = 25;
    var K = 3;
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

 // Draw the K-MEANS graph
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

    g.selectAll("rect").remove();
    g.call(tip);



    var c = centerg.selectAll('path')
        .data(groups);

    var updateCenters = function(centers) {
        centers
        .attr('transform', function(d) { return "translate(" + d.center.x + "," + (d.center.y - 6) + ") rotate(45)";})
        .attr('fill', function(d,i) { return d.color; })
        .attr('stroke', '#aabbcc');
      };

    //Add centroid after first scroll
    if(slide != 0)
    {
      c.exit().remove();

      //draw the centroids
      updateCenters(c.enter()
      .append('rect')
      .attr("width", ((5*5)/2))
      .attr("height", ((5*5)/2))
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

        //Add the ED to the lines
        lineg.selectAll('line')
          .on('mouseover', tip.show)
          .on('mouseout', tip.hide);

        // Display details about points changing groups
        if (!centroidflag){
        g.append("text")
            .attr("x", (2)) // spacing
            .attr("y", 0)
            .text(ptchange + " points changed clusters in this step.")
            .attr("class", "ptchangelable");
        }
        }
    }

    //Re-evaluate the points for each cluster and calculate the points changing groups
    function updateGroups() {
      g.selectAll(".ptchangelable").remove();
      var dotno = [], i = 0;
      console.log("ptchange");
      console.log(ptchange);
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
          ptchange = ptchange + ((groups[i].dots.length)-dotno[i]);
          console.log("ptchange2");
          console.log(ptchange);
        i++;
      }
    }

    //Step through centroid change or group assignment change depending on the flag
    function step() {
      d3.select("#restart").attr("disabled", null);
      d3.selectAll("div.d3-tip").remove();
      slide++;
      if (flag) {
        moveCenter();
        draw();
      } else {
        centroidflag = false;
        updateGroups();
        draw();
      }
      flag = !flag;
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

      centroidflag = true;

      g.selectAll(".ptchangelable").remove();
      g.append("text")
          .attr("x", (2)) // spacing
          .attr("y", 0)
          .text("Centroids changed")
          .attr("class", "ptchangelable");

    }

    var i = 1;

    function myLoop () {           //  create a loop function
        setTimeout(function () {
            console.log(flag);   //  call a 1.2s setTimeout when the loop is called
            step();
            if (ptchange != 0 ) {            //  if the counter < 100, call the loop function
                myLoop();             //  ..  again which will trigger another
            }
            //i++;                     //  increment the counter
            //if (i < 100) {            //  if the counter < 100, call the loop function
            //   myLoop();             //  ..  again which will trigger another
            //}                        //  ..  setTimeout()
        }, 1200)
    }





  /**
   * setupSections - each section is activated
   * by a separate function. Here we associate
   * these functions to the sections based on
   * the section's index.
   *
   */
  setupSections = function() {
    // activateFunctions are called each
    // time the active section changes
    activateFunctions[0] = showTitle;
    activateFunctions[1] = initGraph;
    activateFunctions[2] = updateCentroid;
    activateFunctions[3] = stepOne;
    activateFunctions[4] = showELines;
    activateFunctions[5] = stepTwo;
    activateFunctions[6] = concl;

    // updateFunctions are called while
    // in a particular section to update
    // the scroll progress in that section.
    // Most sections do not need to be updated
    // for all scrolling and so are set to
    // no-op functions.
    for(var i = 0; i < 9; i++) {
      updateFunctions[i] = function() {};
    }
  };

  /**
   * ACTIVATE FUNCTIONS
   *
   * These will be called their
   * section is scrolled to.
   *
   * General pattern is to ensure
   * all content for the current section
   * is transitioned in, while hiding
   * the content for the previous section
   * as well as the next section (as the
   * user may be scrolling up or down).
   *
   */

   // Show initial scroll information
   function showTitle() {
     vis.style("display", "none");
     g.selectAll('line').remove();
   }

   // Initial points on graph
   function initGraph(){
         init();
         slide=0;
         draw();
         g.selectAll('line').remove();
         vis.style("display", "inline-block");
         g.selectAll(".ptchangelable").remove();
   }

   // Plot the initial centroids on scroll
   function updateCentroid(){
       slide=1;
       nfirstLayout=false;
       updateGroups();
       draw();
       g.selectAll('line').remove();
       vis.style("display", "inline-block");
       g.selectAll(".ptchangelable").remove();
   }

   // Color the points for initial clusters
   function stepOne(){
       nfirstLayout=true;
       //slide=1;
       draw();
       g.selectAll('line').remove();
       g.selectAll(".ptchangelable").remove();
       vis.style("display", "inline-block");

   }

   // Show the Euclidean distance lines
   function showELines(){
       //flag=false;
       step();
       g.selectAll(".ptchangelable").remove();
       vis.style("display", "inline-block");
   }

   // Run the animation till local optimum
   function stepTwo(){
       ptchange=1;
       g.selectAll(".ptchangelable").remove();
       myLoop(); //Clustering stops at maximum iterations when the centroids don't change much
       vis.style("display", "inline-block");
   }

   // Remove vis for the last scroll section
   function concl(){
       vis.style("display", "none");
   }

  /**
   * activate -
   *
   * @param index - index of the activated section
   */
  chart.activate = function(index) {
    activeIndex = index;
    var sign = (activeIndex - lastIndex) < 0 ? -1 : 1;
    var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
    scrolledSections.forEach(function(i) {
      activateFunctions[i]();
    });
    lastIndex = activeIndex;
  };

  /**
   * update
   *
   * @param index
   * @param progress
   */
  chart.update = function(index, progress) {
    updateFunctions[index](progress);
  };

  // return chart function
  return chart;
};


/**
 * display - called once data
 * has been loaded.
 * sets up the scroller and
 * displays the visualization.
 */
function display() {
  // create the new plot and display it
  var plot = scrollVis();

  d3.select("#vis")
    .call(plot);

  // setup scroll functionality
  var scroll = scroller()
    .container(d3.select('#graphic'));

  // pass in .step selection as the steps
  scroll(d3.selectAll('.step'));

  // setup event handling
  scroll.on('active', function(index) {
    // highlight current step text
    d3.selectAll('.step')
      .style('opacity',  function(d,i) { return i == index ? 1 : 0.1; });

    // activate current section
    plot.activate(index);
  });

  scroll.on('progress', function(index, progress){
    plot.update(index, progress);
  });

  var vis = d3.select("#vis");

  var oldScroll = 0;
  $(window).scroll(function (event) {
    var scroll = $(window).scrollTop();
    console.log("scroll", scroll);
    if (scroll >= 3200 && scroll > oldScroll) {
        vis.style("display", "none");
    } //else if (scroll >= 2000 && scroll < oldScroll) {
      //vis.style("display", "inline-block"); // going backwards, turn it on.
     //}
    oldScroll = scroll;
  });
}

//display the graph
display();
