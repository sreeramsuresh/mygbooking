import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  CircularProgress,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack
} from '@mui/material';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

// This component is a placeholder for a real chart library like recharts
// In a real implementation, you would import and use a proper chart library
const ChartPlaceholder = ({ data, type }) => {
  const colors = {
    office: '#1976d2',
    wfh: '#2e7d32',
    sick: '#d32f2f',
    vacation: '#ed6c02',
    absent: '#9e9e9e',
  };

  // Calculate percentage for display
  const calculatePercentage = (key) => {
    if (!data.length) return 0;
    const count = data.filter(item => item.status === key).length;
    return Math.round((count / data.length) * 100);
  };

  if (type === 'bar') {
    return (
      <Box sx={{ height: 200, mt: 2, display: 'flex', alignItems: 'flex-end' }}>
        {Object.keys(colors).map(key => (
          <Box 
            key={key}
            sx={{
              height: `${calculatePercentage(key) * 2}px`,
              width: '18%',
              bgcolor: colors[key],
              mx: 1,
              position: 'relative',
              borderRadius: '4px 4px 0 0',
              minHeight: '20px',
              transition: 'height 0.5s ease'
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                position: 'absolute', 
                top: -20, 
                width: '100%', 
                textAlign: 'center',
                color: 'text.secondary'
              }}
            >
              {key}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                position: 'absolute', 
                bottom: -20, 
                width: '100%', 
                textAlign: 'center' 
              }}
            >
              {calculatePercentage(key)}%
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }

  // Pie chart placeholder
  return (
    <Box sx={{ height: 200, mt: 2, position: 'relative' }}>
      <Box sx={{ 
        height: 150, 
        width: 150, 
        borderRadius: '50%', 
        margin: '0 auto',
        background: `conic-gradient(
          ${colors.office} 0% ${calculatePercentage('office')}%, 
          ${colors.wfh} ${calculatePercentage('office')}% ${calculatePercentage('office') + calculatePercentage('wfh')}%, 
          ${colors.sick} ${calculatePercentage('office') + calculatePercentage('wfh')}% ${calculatePercentage('office') + calculatePercentage('wfh') + calculatePercentage('sick')}%,
          ${colors.vacation} ${calculatePercentage('office') + calculatePercentage('wfh') + calculatePercentage('sick')}% ${calculatePercentage('office') + calculatePercentage('wfh') + calculatePercentage('sick') + calculatePercentage('vacation')}%,
          ${colors.absent} ${calculatePercentage('office') + calculatePercentage('wfh') + calculatePercentage('sick') + calculatePercentage('vacation')}% 100%
        )`
      }} />

      <Stack 
        direction="row" 
        spacing={2} 
        justifyContent="center" 
        mt={2} 
        flexWrap="wrap"
      >
        {Object.entries(colors).map(([key, color]) => (
          <Box key={key} sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                height: 12, 
                width: 12, 
                bgcolor: color,
                mr: 0.5,
                borderRadius: 0.5
              }} 
            />
            <Typography variant="caption">
              {key}: {calculatePercentage(key)}%
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

const AttendanceChart = ({ userId, teamId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });
  const [period, setPeriod] = useState('current');
  const [chartType, setChartType] = useState('pie');

  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      try {
        // In a real app, you would fetch data from an API with parameters
        // const response = await api.get('/attendance/stats', {
        //   params: {
        //     userId,
        //     teamId,
        //     startDate: format(dateRange.start, 'yyyy-MM-dd'),
        //     endDate: format(dateRange.end, 'yyyy-MM-dd')
        //   }
        // });
        
        // Simulate API response
        const mockData = [
          { date: '2025-04-01', status: 'office' },
          { date: '2025-04-02', status: 'office' },
          { date: '2025-04-03', status: 'wfh' },
          { date: '2025-04-04', status: 'wfh' },
          { date: '2025-04-07', status: 'office' },
          { date: '2025-04-08', status: 'sick' },
          { date: '2025-04-09', status: 'sick' },
          { date: '2025-04-10', status: 'office' },
          { date: '2025-04-11', status: 'office' },
          { date: '2025-04-14', status: 'wfh' },
          { date: '2025-04-15', status: 'office' },
          { date: '2025-04-16', status: 'office' },
          { date: '2025-04-17', status: 'vacation' },
          { date: '2025-04-18', status: 'vacation' },
          { date: '2025-04-21', status: 'vacation' },
          { date: '2025-04-22', status: 'office' },
          { date: '2025-04-23', status: 'office' },
          { date: '2025-04-24', status: 'wfh' },
          { date: '2025-04-25', status: 'wfh' },
          { date: '2025-04-28', status: 'office' },
          { date: '2025-04-29', status: 'office' },
          { date: '2025-04-30', status: 'office' }
        ];
        
        // Simulate a delay for loading state
        setTimeout(() => {
          setData(mockData);
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError('Failed to load attendance data');
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [userId, teamId, dateRange]);

  const handlePeriodChange = (event) => {
    const value = event.target.value;
    setPeriod(value);
    
    const today = new Date();
    let start, end;
    
    switch (value) {
      case 'previous':
        start = startOfMonth(subMonths(today, 1));
        end = endOfMonth(subMonths(today, 1));
        break;
      case 'last3':
        start = startOfMonth(subMonths(today, 3));
        end = endOfMonth(today);
        break;
      case 'current':
      default:
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
    }
    
    setDateRange({ start, end });
  };

  const handleChartTypeChange = (event, newValue) => {
    setChartType(newValue);
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Attendance Overview
      </Typography>
      
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={period}
            label="Time Period"
            onChange={handlePeriodChange}
          >
            <MenuItem value="current">Current Month</MenuItem>
            <MenuItem value="previous">Previous Month</MenuItem>
            <MenuItem value="last3">Last 3 Months</MenuItem>
          </Select>
        </FormControl>
        
        <Tabs 
          value={chartType} 
          onChange={handleChartTypeChange}
          aria-label="chart type"
          size="small"
        >
          <Tab value="pie" label="Pie Chart" />
          <Tab value="bar" label="Bar Chart" />
        </Tabs>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 200 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ textAlign: 'center', py: 3 }}>
            {error}
          </Typography>
        ) : (
          <>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
              {format(dateRange.start, 'MMMM yyyy')} 
              {period === 'last3' && ` - ${format(dateRange.end, 'MMMM yyyy')}`}
            </Typography>
            
            <ChartPlaceholder data={data} type={chartType} />
            
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="subtitle2">
                Office Attendance Rate: {Math.round((data.filter(d => d.status === 'office').length / data.length) * 100)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Based on {data.length} working days
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
};

export default AttendanceChart;