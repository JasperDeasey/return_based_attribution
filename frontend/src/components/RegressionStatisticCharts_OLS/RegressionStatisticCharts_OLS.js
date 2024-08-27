import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const RegressionStatisticCharts_OLS = ({ chartData }) => {
  const heatmapRef = useRef();

  useEffect(() => {
    if (!chartData || Object.keys(chartData).length === 0) return;

    const dates = Object.keys(chartData);
    const coefficients = dates.map((date) => chartData[date]?.coefficients || []);
    const pValues = dates.map((date) => chartData[date]?.p_values || []);

    const xLabels = dates.map((date) => date.slice(0, 7)); // Compact date format
    const yLabels = pValues[0]?.map((_, index) => `Factor ${index + 1}`) || [];
    const heatmapData = pValues.map((row) => row);

    // Debugging: Log data to verify structure
    console.log("xLabels:", xLabels);
    console.log("yLabels:", yLabels);
    console.log("heatmapData:", heatmapData);

    // Define dimensions and margins for the chart
    const margin = { top: 60, right: 30, bottom: 100, left: 120 };
    const width = Math.max(800, xLabels.length * 30) - margin.left - margin.right;
    const height = Math.max(400, yLabels.length * 30) - margin.top - margin.bottom;

    // Clear previous chart if it exists
    d3.select(heatmapRef.current).selectAll('*').remove();

    // Append the SVG element to the heatmap container
    const svg = d3.select(heatmapRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales for the axes
    const xScale = d3.scaleBand()
      .range([0, width])
      .domain(xLabels)
      .padding(0.05);

    const yScale = d3.scaleBand()
      .range([height, 0])
      .domain(yLabels)
      .padding(0.05);

    // Define color scales
    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateRgb("darkgreen", "white"))
      .domain([0, 0.1])
      .clamp(true);

    const colorScale2 = d3.scaleSequential()
      .interpolator(d3.interpolateRgb("white", "darkred"))
      .domain([0.1, 1])
      .clamp(true);

    // Add the x-axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickSize(0))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    // Add the y-axis
    svg.append('g')
      .call(d3.axisLeft(yScale).tickSize(0));

    // Draw the heatmap cells
    svg.selectAll()
      .data(heatmapData.flatMap((row, rowIndex) =>
        row.map((value, colIndex) => ({
          value,
          rowIndex,
          colIndex,
        }))
      ))
      .enter()
      .append('rect')
      .attr('x', d => xScale(xLabels[d.colIndex]))
      .attr('y', d => yScale(yLabels[d.rowIndex]))
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => d.value <= 0.1 ? colorScale(d.value) : colorScale2(d.value))
      .attr('stroke', 'black')
      .attr('stroke-width', 0)
      .on('mouseover', function (event, d) {
        d3.select(this)
          .attr('stroke-width', 2)
          .attr('stroke', 'black');
        // Optionally, show the value on hover
      })
      .on('mouseout', function () {
        d3.select(this)
          .attr('stroke-width', 0);
      });

  }, [chartData]);

  return (
    <div ref={heatmapRef}></div>
  );
};

export default RegressionStatisticCharts_OLS;
