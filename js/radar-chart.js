if (jQuery) {
  var RadarChart = (function() {
    var defaultConfig;

    defaultConfig = {
      containerClass: 'radar-chart',
      width: 600,
      height: 600,
      factor: 0.95,
      levels: 3,
      sublevels: 1,
      maxValue: 0,
      radians: 2 * Math.PI,
      color: d3.scale.category10(),
      circles: true,
      radius: 5,
      backgroundTooltipColor: "#555",
      backgroundTooltipOpacity: "0.7",
      tooltipColor: "white",
      axisJoin: function(d, i) {
        return d.className || i;
      },
      transitionDuration: 300
    }

    function RadarChart(svg, data, config) {
      this.svg = svg;
      this.axes = data.axes;
      this.data = data.data;
      this.config = $.extend({}, defaultConfig, config);

      // Brief initialization.
      this.gc = {}; // Graphical constants.

      this.gc.maxValue = Math.max(this.config.maxValue, d3.max(this.data, function(d) {
        return d3.max(d.values);
      }));

      this.gc.radius = Math.min(this.config.width / 2, this.config.height / 2);
      this.gc.scaledRadius = this.config.factor * this.gc.radius;

      // Transform data.
      this.data = this.transformData(this.data);
      this.maxValuesByDimension = this.getMaxValuesByDimension(this.data);

      // Go into the chart.
      this.svg.append('g')
      .classed('focus', true)
      .classed(this.config.containerClass, true)
      .datum(this.data)
      .call(initializeChart.bind(this));

      function initializeChart(selection) { // Local to RadarChart->constructor
        var thisChart = this;

        selection.each(function(data) {
          var context = {
            chart: thisChart,
            selection: this
          }

          // Build chart grid, axes, and labels.
          drawChartFeatures.bind(context)();

          // Create (and draw) the content selections.
          thisChart.updateContentSelections.bind(context)();
        });

        function drawChartFeatures() { // Local to initializeChart
          var chart = this.chart,
              selection = this.selection,
              container, gridlineGroups, gridlines, axisGroups, axisLines, // selections
              gridlinePositions; // data

          // Get the container object.
          container = d3.select(selection);

          // Gridlines
          gridlinePositions = d3.range(0, chart.config.levels).map(function(level) {
            return d3.range(0, chart.config.sublevels + 1).map(function(sublevel) {
              return (level + ((sublevel + 1) / (chart.config.sublevels + 1))) * chart.gc.scaledRadius / chart.config.levels;
            });
          });

          gridlineGroups = container.selectAll('g.gridline-group').data(gridlinePositions);

          gridlineGroups.enter().append('g');
          gridlineGroups.exit().remove();

          gridlineGroups.attr('class', function(d, i) {
            return 'gridline-group gridline-group-' + i;
          });

          gridlines = gridlineGroups.selectAll('.gridline').data(function(gridlinePosition) {
            return gridlinePosition;
          });

          gridlines.enter().append('circle');
          gridlines.exit().remove();

          gridlines
          .attr('class', 'gridline')
          .classed('minor', function(gridlinePosition, i) {
            if (i === chart.config.sublevels) {
              return false;
            }

            return true;
          })
          .attr('cx', chart.config.width / 2)
          .attr('cy', chart.config.height / 2)
          .attr('r', function(gridlinePosition, i) {
            return gridlinePosition;
          });

          // Axes
          axisGroups = container.selectAll('.axis').data(chart.axes);

          axisLines = axisGroups.enter().append('g');
          axisGroups.exit().remove();

          axisGroups.attr('class', 'axis');

          axisLines
          .append('line')
          .attr('x1', chart.config.width / 2)
          .attr('y1', chart.config.height / 2)
          .attr('x2', function(d, i) {
            return (chart.config.width / 2) - chart.gc.radius + chart.getHorizontalPosition(i, chart.gc.radius, chart.config.factor);
          })
          .attr('y2', function(d, i) {
            return (chart.config.height / 2) - chart.gc.radius + chart.getVerticalPosition(i, chart.gc.radius, chart.config.factor);
          });

          axisLines
          .append('text')
          .attr('class', function(d, i) {
            var horizontalPosition, placement;

            horizontalPosition = chart.getHorizontalPosition(i, 0.5, 1);

            if (horizontalPosition < 0.4) {
              placement = 'left';
            } else if (horizontalPosition > 0.6) {
              placement = 'right';
            } else {
              placement = 'middle';
            }

            return 'legend ' + placement;
          })
          .attr('dy', function(d, i) {
            var verticalPosition;

            verticalPosition = chart.getVerticalPosition(i, 0.5, 1);

            if (verticalPosition < 0.1) {
              return '1em';
            } else if (verticalPosition > 0.9) {
              return '0';
            } else {
              return '0.5em';
            }
          })
          .text(function(d) { return d; })
          .attr('x', function(d, i) {
            return (chart.config.width / 2) - chart.gc.radius + chart.getHorizontalPosition(i, chart.gc.radius, 1);
          })
          .attr('y', function(d, i) {
            return (chart.config.height / 2) - chart.gc.radius + chart.getVerticalPosition(i, chart.gc.radius, 1);
          });
        };
      };
    };

    RadarChart.prototype.update = function(data) {
      this.data = this.transformData(data);
      this.maxValuesByDimension = this.getMaxValuesByDimension(this.data);

      this.svg.select('.radar-chart')
      .call(function(selection) {
        var thisChart = this;

        selection.each(function(data) {
          var context = {
            chart: thisChart,
            selection: this
          }

          // Create (and draw) the content selections.
          thisChart.updateContentSelections.bind(context)();
        });
      }.bind(this))
    };

    RadarChart.prototype.transformData = function(data) {
      return data.map(function(dataset) {
        var transformedDataset = {
          className: dataset.className,
          values: []
        }

        transformedDataset.values = dataset.values.map(function(value, i) {
          return {
            value: value,
            x: (this.config.width / 2) - this.gc.radius + this.getHorizontalPosition(i, this.gc.radius, (parseFloat(Math.max(value, 0)) / this.gc.maxValue) * this.config.factor),
            y: (this.config.height / 2) - this.gc.radius + this.getVerticalPosition(i, this.gc.radius, (parseFloat(Math.max(value, 0)) / this.gc.maxValue) * this.config.factor)
          }
        }.bind(this));

        return transformedDataset;
      }.bind(this));
    };

    RadarChart.prototype.getMaxValuesByDimension = function(data) {
      var maxValuesByDimension = d3.range(this.axes.length).map(function() {
        return { value: 0, x: 0, y: 0 };
      });

      data.forEach(function(d, i) {
        d.values.forEach(function(value, dimension) {
          if (maxValuesByDimension[dimension].value < value.value) {
            maxValuesByDimension[dimension] = value;
          }
        });
      });

      return maxValuesByDimension;
    };

    RadarChart.prototype.updateContentSelections = function() {
      var chart = this.chart,
          selection = this.selection,
          polygon, circleGroups, circles; // selections

      // Get the container object.
      container = d3.select(selection);

      // Draw the maximum area.
      polygon = container.selectAll(".area").data([chart.maxValuesByDimension]);

      polygon.enter().append('polygon')
      .classed({ area: 1, 'd3-enter': 1 });

      polygon.exit()
      .classed('d3-exit', 1) // trigger css transition
      .transition().duration(chart.config.transitionDuration)
      .remove();

      polygon
      .each(function(d, i) {
        var classed = { 'd3-exit': 0 }; // if exiting element is being reused

        if (d.className) {
          classed[d.className] = 1;
        }

        d3.select(this).classed(classed);
      })
      .transition().duration(chart.config.transitionDuration)
      // svg attrs with js
      .attr('points', function(d) {
        return d.map(function(p) {
          return [p.x, p.y].join(',');
        }).join(' ');
      })
      .each('start', function() {
        d3.select(this).classed('d3-enter', 0); // trigger css transition
      });

      // Draw the scatter circles.
      if (chart.config.circles && chart.config.radius) {
        circleGroups = container.selectAll('g.circle-group').data(chart.data, chart.config.axisJoin);

        circleGroups.enter().append('g').classed({ 'circle-group': 1, 'd3-enter': 1 });

        circleGroups.exit()
        .classed('d3-exit', 1) // trigger css transition
        .transition().duration(chart.config.transitionDuration)
        .remove();

        circleGroups
        .each(function(d) {
          var classed = { 'd3-exit': 0 }; // if exiting element is being reused

          if (d.className) {
            classed[d.className] = 1;
          }

          d3.select(this).classed(classed);
        })
        .transition().duration(chart.config.transitionDuration)
        .each('start', function() {
          d3.select(this).classed('d3-enter', 0); // trigger css transition
        });

        circles = circleGroups.selectAll('.circle').data(function(datum, i) {
          return datum.values.map(function(d) { return [d, i]; });
        });

        circles.enter().append('path')
        .classed({circle: 1, 'd3-enter': 1})

        circles.exit()
        .classed('d3-exit', 1) // trigger css transition
        .transition().duration(chart.config.transitionDuration)
        .remove();

        circles
        .each(function(d) {
          var classed = { 'd3-exit': 0 }; // if exit element reused
          classed['radar-chart-series'] = 1;
          classed['radar-chart-series-' + d[1]] = 1;
          d3.select(this).classed(classed);
        })
        .transition().duration(chart.config.transitionDuration)
        .attr('d', d3.svg.symbol().type(function(d, i) {
          var a = d3.svg.symbolTypes[d[1] % d3.svg.symbolTypes.length];

          return a;
        }))
        .attr('transform', function(d) {
          return 'translate(' + d[0].x + ',' + d[0].y + ')';
        })
        .each('start', function() {
          d3.select(this).classed('d3-enter', 0); // trigger css transition
        });
      }
    };

    RadarChart.prototype.getPosition = function(i, range, factor, func) {
      factor = typeof factor !== 'undefined' ? factor : 1;
      return range * (1 - factor * func(i * this.config.radians / this.axes.length));
    };

    RadarChart.prototype.getHorizontalPosition = function(i, range, factor) {
      return this.getPosition(i, range, factor, Math.sin);
    };

    RadarChart.prototype.getVerticalPosition = function(i, range, factor) {
      return this.getPosition(i, range, factor, Math.cos);
    };

    return RadarChart;
  })();
}
