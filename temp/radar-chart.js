var RadarChart = {
  defaultConfig: {
    containerClass: 'radar-chart',
    w: 600,
    h: 600,
    factor: 0.95,
    factorLegend: 1,
    levels: 3,
    sublevels: 1,
    maxValue: 0,
    radians: 2 * Math.PI,
    color: d3.scale.category10(),
    axisLine: true,
    axisText: true,
    circles: true,
    radius: 5,
    backgroundTooltipColor: "#555",
    backgroundTooltipOpacity: "0.7",
    tooltipColor: "white",
    axisJoin: function(d, i) {
      return d.className || i;
    },
    transitionDuration: 300
  },
  chart: function() {
    // default config
    var cfg = Object.create(RadarChart.defaultConfig);
    var toolip;
    function setTooltip(msg){
      if(msg == false){
        tooltip.classed("visible", 0);
        tooltip.select("rect").classed("visible", 0);
      }else{
        tooltip.classed("visible", 1);

            var x = d3.event.x;
                y = d3.event.y;

        tooltip.select("text").classed('visible', 1).style("fill", cfg.tooltipColor);
        var padding=5;
        var bbox = tooltip.select("text").text(msg).node().getBBox();

        tooltip.select("rect")
        .classed('visible', 1).attr("x", 0)
        .attr("x", bbox.x - padding)
        .attr("y", bbox.y - padding)
        .attr("width", bbox.width + (padding*2))
        .attr("height", bbox.height + (padding*2))
        .attr("rx","5").attr("ry","5")
        .style("fill", cfg.backgroundTooltipColor).style("opacity", cfg.backgroundTooltipOpacity);
        tooltip.attr("transform", "translate(" + x + "," + y + ")")
      }
    }
    function radar(selection) {
      selection.each(function(data) {
        var container = d3.select(this);
        tooltip = container.append("g");
        tooltip.append('rect').classed("tooltip", true);
        tooltip.append('text').classed("tooltip", true);

        var maxValue = Math.max(cfg.maxValue, d3.max(data.data, function(d) {
          return d3.max(d.values);
        }));

        var allAxis = data.axes.map(function(i, j){ return {name: i, xOffset: 0, yOffset: 0}; });
        var total = allAxis.length;
        var radius = cfg.factor * Math.min(cfg.w / 2, cfg.h / 2);
        var radius2 = Math.min(cfg.w / 2, cfg.h / 2);

        container.classed(cfg.containerClass, 1);

        function getPosition(i, range, factor, func){
          factor = typeof factor !== 'undefined' ? factor : 1;
          return range * (1 - factor * func(i * cfg.radians / total));
        }
        function getHorizontalPosition(i, range, factor){
          return getPosition(i, range, factor, Math.sin);
        }
        function getVerticalPosition(i, range, factor){
          return getPosition(i, range, factor, Math.cos);
        }

        // levels && axises
        var levelFactors = d3.range(0, cfg.levels).map(function(level) {
          return d3.range(0, cfg.sublevels + 1).map(function(sublevel) {
            return (level + ((sublevel +1 ) / (cfg.sublevels + 1))) * radius / cfg.levels;
          });
          return [radius * ((level + 1) / cfg.levels)];
        });

        var levelGroups = container.selectAll('g.level-group').data(levelFactors);

        levelGroups.enter().append('g');
        levelGroups.exit().remove();

        levelGroups.attr('class', function(d, i) {
          return 'level-group level-group-' + i;
        });

        var levelLine = levelGroups.selectAll('.level').data(function(levelFactor) {
          return levelFactor;
        });

        levelLine.enter().append('circle');
        levelLine.exit().remove();

        levelLine
        .attr('class', 'level')
        .classed('sublevel', function(levelFactor, i) {
          if (i === cfg.sublevels) {
            return false;
          }

          return true;
        })
        .attr('cx', cfg.w/2)
        .attr('cy', cfg.h/2)
        .attr('r', function(levelFactor, i) {
          return levelFactor;
        });

        if(cfg.axisLine || cfg.axisText) {
          var axis = container.selectAll('.axis').data(allAxis);

          var newAxis = axis.enter().append('g');
          if(cfg.axisLine) {
            newAxis.append('line');
          }
          if(cfg.axisText) {
            newAxis.append('text');
          }

          axis.exit().remove();

          axis.attr('class', 'axis');

          if(cfg.axisLine) {
            axis.select('line')
              .attr('x1', cfg.w/2)
              .attr('y1', cfg.h/2)
              .attr('x2', function(d, i) { return (cfg.w/2-radius2)+getHorizontalPosition(i, radius2, cfg.factor); })
              .attr('y2', function(d, i) { return (cfg.h/2-radius2)+getVerticalPosition(i, radius2, cfg.factor); });
          }

          if(cfg.axisText) {
            axis.select('text')
              .attr('class', function(d, i){
                var p = getHorizontalPosition(i, 0.5);

                return 'legend ' +
                  ((p < 0.4) ? 'left' : ((p > 0.6) ? 'right' : 'middle'));
              })
              .attr('dy', function(d, i) {
                var p = getVerticalPosition(i, 0.5);
                return ((p < 0.1) ? '1em' : ((p > 0.9) ? '0' : '0.5em'));
              })
              .text(function(d) { return d.name; })
              .attr('x', function(d, i){ return d.xOffset+ (cfg.w/2-radius2)+getHorizontalPosition(i, radius2, cfg.factorLegend); })
              .attr('y', function(d, i){ return d.yOffset+ (cfg.h/2-radius2)+getVerticalPosition(i, radius2, cfg.factorLegend); });
          }
        }

        // content
        data.data.map(function(d){
          d.values = d.values.map(function(value, i) {
            datum = {
              value: value,
              x: (cfg.w/2-radius2)+getHorizontalPosition(i, radius2, (parseFloat(Math.max(value, 0))/maxValue)*cfg.factor),
              y: (cfg.h/2-radius2)+getVerticalPosition(i, radius2, (parseFloat(Math.max(value, 0))/maxValue)*cfg.factor)
            };

            return datum;
          });

          return d;
        });
        /*
        var polygon = container.selectAll(".area").data(data.data, cfg.axisJoin);

        polygon.enter().append('polygon')
          .classed({area: 1, 'd3-enter': 1})
          // .on('mouseover', function (dd){
          //   d3.event.stopPropagation();
          //   container.classed('focus', 1);
          //   d3.select(this).classed('focused', 1);
          //   setTooltip(dd.className);
          // })
          // .on('mouseout', function(){
          //   d3.event.stopPropagation();
          //   container.classed('focus', 0);
          //   d3.select(this).classed('focused', 0);
          //   setTooltip(false);
          // });

        polygon.exit()
          .classed('d3-exit', 1) // trigger css transition
          .transition().duration(cfg.transitionDuration)
            .remove();

        polygon
          .each(function(d, i) {
            var classed = {'d3-exit': 0}; // if exiting element is being reused
            classed['radar-chart-serie' + i] = 1;
            if(d.className) {
              classed[d.className] = 1;
            }
            d3.select(this).classed(classed);
          })
          // styles should only be transitioned with css
          .style('stroke', function(d, i) { return cfg.color(i); })
          .style('fill', function(d, i) { return cfg.color(i); })
          .transition().duration(cfg.transitionDuration)
            // svg attrs with js
            .attr('points',function(d) {
              return d.values.map(function(p) {
                return [p.x, p.y].join(',');
              }).join(' ');
            })
            .each('start', function() {
              d3.select(this).classed('d3-enter', 0); // trigger css transition
            });
        */

        var maxValuesByDimension = d3.range(allAxis.length).map(function() {
          return { value: 0, x: 0, y: 0 };
        });

        data.data.forEach(function(d, i) {
          d.values.forEach(function(value, dimension) {
            if (maxValuesByDimension[dimension].value < value.value) {
              maxValuesByDimension[dimension] = value;
            }
          });
        });

        var polygon = container.selectAll(".area").data([maxValuesByDimension]);

        polygon.enter().append('polygon')
          .classed({area: 1, 'd3-enter': 1});

        polygon.exit()
          .classed('d3-exit', 1) // trigger css transition
          .transition().duration(cfg.transitionDuration)
            .remove();

        polygon
          .each(function(d, i) {
            var classed = {'d3-exit': 0}; // if exiting element is being reused
            classed['radar-chart-serie' + i] = 1;
            if(d.className) {
              classed[d.className] = 1;
            }
            d3.select(this).classed(classed);
          })
          // styles should only be transitioned with css
          .style('stroke', function(d, i) { return 'green'; })
          .style('fill', function(d, i) { return 'green'; })
          .style('fill-opacity', function(d, i) { return 0.5; })
          .transition().duration(cfg.transitionDuration)
            // svg attrs with js
            .attr('points',function(d) {
              return d.map(function(p) {
                return [p.x, p.y].join(',');
              }).join(' ');
            })
            .each('start', function() {
              d3.select(this).classed('d3-enter', 0); // trigger css transition
            });

        if(cfg.circles && cfg.radius) {

          var circleGroups = container.selectAll('g.circle-group').data(data.data, cfg.axisJoin);

          circleGroups.enter().append('g').classed({'circle-group': 1, 'd3-enter': 1});
          circleGroups.exit()
            .classed('d3-exit', 1) // trigger css transition
            .transition().duration(cfg.transitionDuration).remove();

          circleGroups
            .each(function(d) {
              var classed = {'d3-exit': 0}; // if exiting element is being reused
              if(d.className) {
                classed[d.className] = 1;
              }
              d3.select(this).classed(classed);
            })
            .transition().duration(cfg.transitionDuration)
              .each('start', function() {
                d3.select(this).classed('d3-enter', 0); // trigger css transition
              });

          var circle = circleGroups.selectAll('.circle').data(function(datum, i) {
            return datum.values.map(function(d) { return [d, i]; });
          });

          circle.enter().append('circle')
            .classed({circle: 1, 'd3-enter': 1})
            // .on('mouseover', function(dd){
            //   d3.event.stopPropagation();
            //   setTooltip(dd[0].value);
            //   //container.classed('focus', 1);
            //   //container.select('.area.radar-chart-serie'+dd[1]).classed('focused', 1);
            // })
            // .on('mouseout', function(dd){
            //   d3.event.stopPropagation();
            //   setTooltip(false);
            //   container.classed('focus', 0);
            //   //container.select('.area.radar-chart-serie'+dd[1]).classed('focused', 0);
            //   //No idea why previous line breaks tooltip hovering area after hoverin point.
            // });

          circle.exit()
            .classed('d3-exit', 1) // trigger css transition
            .transition().duration(cfg.transitionDuration).remove();

          circle
            .each(function(d) {
              var classed = {'d3-exit': 0}; // if exit element reused
              classed['radar-chart-serie'+d[1]] = 1;
              d3.select(this).classed(classed);
            })
            // styles should only be transitioned with css
            .style('fill', function(d) { return cfg.color(d[1]); })
            .transition().duration(cfg.transitionDuration)
              // svg attrs with js
              .attr('r', cfg.radius)
              .attr('cx', function(d) {
                return d[0].x;
              })
              .attr('cy', function(d) {
                return d[0].y;
              })
              .each('start', function() {
                d3.select(this).classed('d3-enter', 0); // trigger css transition
              });

          // ensure tooltip is upmost layer
          var tooltipEl = tooltip.node();
          tooltipEl.parentNode.appendChild(tooltipEl);
        }
      });
    }

    radar.config = function(value) {
      if(!arguments.length) {
        return cfg;
      }
      if(arguments.length > 1) {
        cfg[arguments[0]] = arguments[1];
      }
      else {
        d3.entries(value || {}).forEach(function(option) {
          cfg[option.key] = option.value;
        });
      }
      return radar;
    };

    return radar;
  },
  draw: function(id, d, options) {
    var chart = RadarChart.chart().config(options);
    var cfg = chart.config();

    d3.select(id).select('svg').remove();
    d3.select(id)
      .append("svg")
      .attr("width", cfg.w)
      .attr("height", cfg.h)
      .datum(d)
      .call(chart);
  }
};
