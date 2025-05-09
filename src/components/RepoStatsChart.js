import React, { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Typography, Box, CircularProgress, Alert } from '@mui/material';

// chart colors for the chart 
const CHART_COLORS = ['#2196f3', '#4CAF50', '#F44336', '#FF9800', '#9C27B0', '#E91E63', '#607D8B'];

const RepoStatsChart = ({ 
  data, 
  seriesData = [],
  title = '', 
  type = 'line', 
  colorIndex = 0, 
  loading = false,
  lineColor = null,
  showLegend = false,
  multiSeries = false,
  error = null,
  isContributorsChart = false
}) => {
  // Handle different data formats 
  const processedData = useMemo(() => {
    try {
      // If seriesData is provided, use it directly for multi-series charts
      if (multiSeries && seriesData && seriesData.length > 0) {
        return seriesData;
      }
      
      if (!data) return [];
      
      // Data validation
      if (Array.isArray(data) && data.some(item => item === null || item === undefined)) {
        console.warn('Invalid data items detected in chart data');
        return [];
      }
      
      // If multiSeries is true and using the old format
      if (multiSeries && !seriesData.length) {
        
        const groupedData = data.reduce((acc, item) => {
          if (!item || !item.name) return acc;
          if (!acc[item.name]) {
            acc[item.name] = [];
          }
          acc[item.name].push({ x: item.x, y: item.y });
          return acc;
        }, {});
        
        // Convert to series array
        return Object.keys(groupedData).map((name, index) => ({
          name: name,
          data: groupedData[name],
          color: CHART_COLORS[index % CHART_COLORS.length]
        }));
      }
      
      // Check if data is already in the format we need (array of {x, y} objects)
      if (data.length > 0 && typeof data[0] === 'object' && 'x' in data[0] && 'y' in data[0]) {
        return data;
      }
      
      // If it's an array of numbers, convert to {x, y} format
      if (data.length > 0 && typeof data[0] === 'number') {
        return data.map((value, index) => ({ x: index, y: value }));
      }
      
      return [];
    } catch (err) {
      console.error('Error processing chart data:', err);
      return [];
    }
  }, [data, seriesData, multiSeries]);
  
  const options = useMemo(() => {
    const baseOptions = {
      title: {
        text: title,
        style: {
          fontSize: '16px'
        }
      },
      chart: {
        type: isContributorsChart ? 'column' : type,
        backgroundColor: 'transparent',
        style: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
        },
        zooming: {
          type: 'xy',
          pinchType: 'xy'
        },
        height: isContributorsChart ? 350 : 280
      },
      credits: {
        enabled: false
      },
      xAxis: {
        title: {
          text: isContributorsChart ? 'Contributors' : 'Weeks'
        },
        labels: {
          formatter: function() {
            if (isContributorsChart) {
              return this.value;
            }
            return `Week ${this.value + 1}`;
          },
          style: {
            fontSize: '11px'
          }
        },
        allowDecimals: false,
        lineColor: '#dddddd',
        tickColor: '#dddddd'
      },
      yAxis: {
        title: {
          text: isContributorsChart ? 'Number of Commits' : ''
        },
        min: 0,
        minRange: 5,
        gridLineColor: '#eeeeee'
      },
      tooltip: {
        formatter: function() {
          if (isContributorsChart) {
            return `<b>${this.point.name}</b><br/>Commits: ${this.y}`;
          }
          return `<b>Week ${this.point.x + 1}</b><br/>${this.series.name}: ${this.point.y}`;
        },
        borderWidth: 1,
        borderRadius: 8,
        shadow: false,
        padding: 10
      },
      legend: {
        enabled: showLegend || isContributorsChart,
        itemStyle: {
          fontWeight: 'normal',
          fontSize: '11px'
        },
        layout: 'horizontal',
        align: 'center',
        verticalAlign: 'bottom',
        itemDistance: 20
      },
      plotOptions: {
        series: {
          animation: true,
          marker: {
            enabled: false,
            states: {
              hover: {
                enabled: true,
                radius: 4
              }
            }
          },
          states: {
            hover: {
              lineWidthPlus: 2
            }
          }
        },
        line: {
          lineWidth: 2,
          states: {
            hover: {
              lineWidth: 3
            }
          }
        },
        column: {
          borderWidth: 0,
          borderRadius: 2,
          groupPadding: 0.05,
          pointPadding: 0.05,
          colorByPoint: isContributorsChart
        }
      },
      responsive: {
        rules: [
          {
            condition: {
              maxWidth: 500
            },
            chartOptions: {
              chart: {
                height: isContributorsChart ? 300 : 220
              },
              subtitle: {
                text: null
              },
              navigator: {
                enabled: false
              }
            }
          }
        ]
      }
    };
    
    // For multi-series charts
    if (multiSeries) {
      baseOptions.series = Array.isArray(processedData) ? processedData : [];
      
      if (showLegend || isContributorsChart) {
        baseOptions.legend.enabled = true;
        baseOptions.legend.layout = 'horizontal';
        baseOptions.legend.align = 'center';
        baseOptions.legend.verticalAlign = 'bottom';
      }
    } else if (isContributorsChart) {
      // For contributors chart formate
      baseOptions.series = [{
        name: 'Commits',
        data: processedData.map(item => ({
          name: item.name || 'Unknown',
          y: item.y,
          color: CHART_COLORS[colorIndex % CHART_COLORS.length]
        }))
      }];
    } else {
      // For single series charts
      baseOptions.series = [{
        name: title || 'Value',
        data: processedData,
        color: lineColor || CHART_COLORS[colorIndex % CHART_COLORS.length],
        pointStart: 0
      }];
    }
    
    return baseOptions;
  }, [title, type, colorIndex, processedData, lineColor, showLegend, multiSeries, isContributorsChart]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error" sx={{ width: '100%' }}>
          {error.includes('422') 
            ? 'Unable to load repository statistics. Please ensure the repository exists and is not empty.'
            : error}
        </Alert>
      </Box>
    );
  }

  // Handle empty data
  const hasData = multiSeries 
    ? (Array.isArray(processedData) && processedData.length > 0)
    : (data && data.length > 0 && !data.every(item => typeof item === 'object' && item.y === 0));
    
  if (!hasData) {
    return (
      <Box sx={{ minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <HighchartsReact 
        highcharts={Highcharts} 
        options={options}
        containerProps={{ style: { height: '100%', width: '100%' } }}
      />
    </Box>
  );
};

export default React.memo(RepoStatsChart); 