import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,  // Using standard Grid from MUI
  Typography,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  LinearProgress,
  Button,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Flag as FlagIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { dashboardAPI, budgetAlertsAPI, utils } from '../services/api';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchAlerts();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getDashboard();
      setData(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Don't show error for 500s, just use default data
      if (error.response?.status === 500) {
        console.log('Dashboard API error, using default data');
        setData(null);
      } else {
        setError(utils.handleError(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await budgetAlertsAPI.getAlerts({ is_read: false });
      
      // More robust handling of response format
      let alertsData = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          alertsData = response.data;
        } else if (Array.isArray(response.data.results)) {
          alertsData = response.data.results;
        } else if (response.data.alerts && Array.isArray(response.data.alerts)) {
          alertsData = response.data.alerts;
        }
      }
      
      setAlerts(alertsData.slice(0, 5));
    } catch (error) {
      console.error('Error fetching alerts:', error);
      // Don't show error for alerts, they're optional
      setAlerts([]);
    }
  };

  const markAlertAsRead = async (alertId) => {
    try {
      await budgetAlertsAPI.markRead(alertId);
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  // Provide default data structure if data is null
  const overview = data?.overview || {
    total_income: 0,
    total_expenses: 0,
    net_balance: 0,
    monthly_income: 0,
    monthly_expenses: 0,
    monthly_balance: 0,
  };

  const recent_transactions = data?.recent_transactions || {
    expenses: [],
    income: []
  };

  const summary = data?.summary || {
    active_goals: 0,
    unread_alerts: 0,
    budgets: {
      total: 0,
      over_budget: 0,
      near_limit: 0
    }
  };

  // Prepare data for pie chart
  const pieChartData = [
    { name: 'Income', value: overview.total_income || 0, color: '#4caf50' },
    { name: 'Expenses', value: overview.total_expenses || 0, color: '#f44336' },
  ];

  const savingsRate = overview.total_income > 0 
    ? ((overview.net_balance / overview.total_income) * 100).toFixed(1)
    : 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Financial Overview
      </Typography>

      {/* Show a notice if using default data */}
      {!data && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Dashboard is loading with sample data. Add some transactions to see your real financial overview.
        </Alert>
      )}

      {/* Budget Alerts */}
      {alerts.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'warning.light' }}>
          <Box display="flex" alignItems="center" mb={1}>
            <WarningIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Budget Alerts</Typography>
          </Box>
          <List dense>
            {alerts.map((alert) => (
              <ListItem
                key={alert.id}
                secondaryAction={
                  <Button size="small" onClick={() => markAlertAsRead(alert.id)}>
                    Dismiss
                  </Button>
                }
              >
                <ListItemText
                  primary={alert.message}
                  secondary={`${utils.formatDate(alert.alert_date)}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Income
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ color: 'success.main' }}>
                    {utils.formatCurrency(overview.total_income)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    This Month: {utils.formatCurrency(overview.monthly_income)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.light', color: 'success.main' }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Expenses
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ color: 'error.main' }}>
                    {utils.formatCurrency(overview.total_expenses)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    This Month: {utils.formatCurrency(overview.monthly_expenses)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.light', color: 'error.main' }}>
                  <TrendingDownIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Net Balance
                  </Typography>
                  <Typography 
                    variant="h5" 
                    component="div" 
                    sx={{ 
                      color: overview.net_balance >= 0 ? 'primary.main' : 'error.main' 
                    }}
                  >
                    {utils.formatCurrency(overview.net_balance)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Savings Rate: {savingsRate}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                  <AccountBalanceIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Active Goals
                  </Typography>
                  <Typography variant="h5" component="div">
                    {summary.active_goals}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    {summary.budgets.total} Active Budgets
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main' }}>
                  <FlagIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Income vs Expenses Chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Income vs Expenses
            </Typography>
            {(overview.total_income > 0 || overview.total_expenses > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => utils.formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box 
                height={300} 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
              >
                <Typography color="textSecondary">No data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Budget Status */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Budget Status
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Budgets on Track</Typography>
                  <Typography variant="body2" color="success.main">
                    {Math.max(0, summary.budgets.total - 
                     summary.budgets.over_budget - 
                     summary.budgets.near_limit)}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={
                    summary.budgets.total > 0
                      ? (((summary.budgets.total - summary.budgets.over_budget - summary.budgets.near_limit) / 
                         summary.budgets.total) * 100)
                      : 0
                  }
                  sx={{ height: 8, borderRadius: 4 }}
                  color="success"
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Near Limit</Typography>
                  <Typography variant="body2" color="warning.main">
                    {summary.budgets.near_limit}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={
                    summary.budgets.total > 0
                      ? ((summary.budgets.near_limit / summary.budgets.total) * 100)
                      : 0
                  }
                  sx={{ height: 8, borderRadius: 4 }}
                  color="warning"
                />
              </Box>
              
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Over Budget</Typography>
                  <Typography variant="body2" color="error.main">
                    {summary.budgets.over_budget}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={
                    summary.budgets.total > 0
                      ? ((summary.budgets.over_budget / summary.budgets.total) * 100)
                      : 0
                  }
                  sx={{ height: 8, borderRadius: 4 }}
                  color="error"
                />
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="textSecondary">
                Total Active Budgets
              </Typography>
              <Chip 
                label={summary.budgets.total} 
                color="primary" 
                size="small"
              />
            </Box>
          </Paper>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Transactions
            </Typography>
            <List>
              {recent_transactions.expenses?.slice(0, 3).map((expense, index) => (
                <ListItem key={`expense-${expense.id || index}`} disablePadding sx={{ mb: 1 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'error.light', width: 36, height: 36 }}>
                      <TrendingDownIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={expense.description}
                    secondary={utils.formatDate(expense.date)}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  <Typography variant="body2" color="error.main">
                    -{utils.formatCurrency(expense.amount)}
                  </Typography>
                </ListItem>
              ))}
              
              {recent_transactions.income?.slice(0, 2).map((income, index) => (
                <ListItem key={`income-${income.id || index}`} disablePadding sx={{ mb: 1 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.light', width: 36, height: 36 }}>
                      <TrendingUpIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={income.source}
                    secondary={utils.formatDate(income.date)}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  <Typography variant="body2" color="success.main">
                    +{utils.formatCurrency(income.amount)}
                  </Typography>
                </ListItem>
              ))}

              {recent_transactions.expenses?.length === 0 && 
               recent_transactions.income?.length === 0 && (
                <ListItem>
                  <ListItemText 
                    primary="No recent transactions" 
                    primaryTypographyProps={{ 
                      color: 'textSecondary',
                      align: 'center' 
                    }}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;