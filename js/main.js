if (jQuery) {
  var initializeTable, updateTable;

  (function() {
    var updateSeriesMarkers;

    initializeTable = function(table, data) {
      // Build table.
      updateTable(table, [], data, 0);
    };

    updateTable = function(table, rows, data, offset) {
      if (!rows.length && data.length) { // We have an empty array, so build rows for our data.
        rows = data.map(function(datum, index) {
          var row = $(document.createElement('tr')),
              seriesCell, loCell, loInput, removeRowButton;

          seriesCell = $(document.createElement('td')).addClass('series');

          d3.select(seriesCell[0])
          .append('svg')
            .attr('width', 20)
            .attr('height', 20)
          .append('path')
            .classed('circle', 1)
            .attr('transform', 'translate(10, 10)');

          row.append(seriesCell);

          loCell = $(document.createElement('td')).addClass('learning-objective');
          loInput = $(document.createElement('input')).addClass('form-control');

          loCell.append(loInput);
          row.append(loCell);

          removeRowButton = $(document.createElement('button')).addClass('btn btn-default remove-row-button').attr('aria-label', 'Remove row').attr('title', 'Remove row');
          removeRowButton.append($(document.createElement('span')).addClass('glyphicon glyphicon-minus-sign').attr('aria-hidden', 'true'));

          row.append($(document.createElement('td')).append(removeRowButton));

          datum.values.forEach(function() {
            var cell = $(document.createElement('td')),
                input = $(document.createElement('input')).addClass('form-control');

            cell.append(input);
            row.append(cell);
          });

          table.append(row);

          return row;
        });

        updateTable(table, rows, data, offset);
      } else { // We have existing rows which need to be updated.
        $(rows).each(function(index, row) {
          if (!data[index]) {
            $(row).remove();

            return; // No data for this row.
          }

          // Update the objective input.
          $(row).find('.learning-objective input').val(data[index].className).data({ type: 'objective', value: { learningObjective: index + offset } });

          // Update the remove row button.
          $(row).find('.remove-row-button').data({ type: 'remove', value: { learningObjective: index + offset } });

          // Update the value inputs.
          $(row).find('td:not(.learning-objective) input').each(function(valueIndex, input) {
            $(input).val(data[index].values[valueIndex]);
            $(input).data({ type: 'value', value: { learningObjective: index + offset, frame: valueIndex } });
          })
        });

        updateSeriesMarkers(table);
      }
    };

    updateSeriesMarkers = function(table) {
      var seriesMarkers = $(table).find('.series .circle');

      seriesMarkers.each(function(index, marker) {
        var markerClasses = { 'circle': 1, 'radar-chart-series': 1 };

        markerClasses['radar-chart-series-' + index] = 1;

        d3.select(marker)
        .attr('class', '')
        .classed(markerClasses)
        .attr('d', d3.svg.symbol().type(d3.svg.symbolTypes[index % d3.svg.symbolTypes.length]));
      });
    };
  })();
}
