import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Typography,
  Grid,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  InputAdornment,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';
import { budgetsAPI, categoriesAPI, utils } from '../services/api';
import { format } from 'date-fns';

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    amount: '',
    period: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    is_active: true,
    alert_threshold: 80,
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [budgetsRes, categoriesRes, summaryRes] = await Promise.all([
        budgetsAPI.getBudgets({ is_active: true }),
        categoriesAPI.getExpenseCategories(),
        budgetsAPI.getBudgetSummary(),
      ]);
      
      setBudgets(budgetsRes.data);
      setCategories(categoriesRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(utils.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const dataToSubmit = {
        ...formData,
        amount: parseFloat(formData.amount),
        category: formData.category || null,
        alert_threshold: parseInt(formData.alert_threshold),
      };

      if (editingBudget) {
        await budgetsAPI.updateBudget(editingBudget.id, dataToSubmit);
      } else {
        await budgetsAPI.createBudget(dataToSubmit);
      }

      setOpenDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving budget:', error);
      setError(utils.handleError(error));
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      name: budget.name,
      category: budget.category || '',
      amount: budget.amount,
      period: budget.period,
      start_date: budget.start_date,
      end_date: budget.end_date || '',
      is_active: budget.is_active,
      alert_threshold: budget.alert_threshold,
      notes: budget.notes,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await budgetsAPI.deleteBudget(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting budget:', error);
        setError(utils.handleError(error));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      amount: '',
      period: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      is_active: true,
      alert_threshold: 80,
      notes: '',
    });
    setEditingBudget(null);
  };

  const getBudgetStatus = (budget) => {
    if (budget.is_over_budget) {
      return { label: 'Over Budget', color: 'error', icon: <WarningIcon /> };
    } else if (budget.is_near_limit) {
      return { label: 'Near Limit', color: 'warning', icon: <WarningIcon /> };
    } else {
      return { label: 'On Track', color: 'success', icon: <TrendingUpIcon /> };
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Budget Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm();
            setOpenDialog(true);
          }}
        >
          Create Budget
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Budget
                </Typography>
                <Typography variant="h5">
                  {utils.formatCurrency(summary.total_budget)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Spent
                </Typography>
                <Typography variant="h5" color={summary.total_spent > summary.total_budget ? 'error' : 'inherit'}>
                  {utils.formatCurrency(summary.total_spent)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(summary.overall_percentage, 100)}
                  color={summary.overall_percentage > 100 ? 'error' : 'primary'}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Remaining
                </Typography>
                <Typography variant="h5" color={summary.total_remaining < 0 ? 'error' : 'success'}>
                  {utils.formatCurrency(summary.total_remaining)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Alerts
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip
                    label={`${summary.over_budget_count} Over`}
                    color="error"
                    size="small"
                  />
                  <Chip
                    label={`${summary.near_limit_count} Near`}
                    color="warning"
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Budget List */}
      <Grid container spacing={3}>
        {Array.isArray(budgets) && budgets.map((budget) => {
          const status = getBudgetStatus(budget);
          
          return (
            <Grid item xs={12} md={6} key={budget.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6">{budget.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {budget.category_name || 'Overall Budget'} • {budget.period}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        size="small"
                        label={status.label}
                        color={status.color}
                        icon={status.icon}
                      />
                      <IconButton size="small" onClick={() => handleEdit(budget)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(budget.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        Budget Used
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {budget.spent_percentage}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(budget.spent_percentage, 100)}
                      color={budget.is_over_budget ? 'error' : budget.is_near_limit ? 'warning' : 'primary'}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="body2">
                        {utils.formatCurrency(budget.spent_amount)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        of {utils.formatCurrency(budget.amount)}
                      </Typography>
                    </Box>
                  </Box>

                  {budget.notes && (
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      {budget.notes}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="textSecondary">
                      Started {format(new Date(budget.start_date), 'MMM dd, yyyy')}
                    </Typography>
                    {budget.alert_threshold < 100 && (
                      <Chip
                        size="small"
                        icon={<NotificationIcon />}
                        label={`Alert at ${budget.alert_threshold}%`}
                        variant="outlined"
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBudget ? 'Edit Budget' : 'Create New Budget'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Budget Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              fullWidth
              helperText="Leave empty for overall budget"
            >
              <MenuItem value="">Overall Budget</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.full_path}
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              label="Budget Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              fullWidth
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            
            <TextField
              select
              label="Period"
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              fullWidth
              required
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="quarterly">Quarterly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </TextField>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="End Date (Optional)"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            
            <TextField
              label="Alert Threshold (%)"
              type="number"
              value={formData.alert_threshold}
              onChange={(e) => setFormData({ ...formData, alert_threshold: e.target.value })}
              fullWidth
              helperText="Get notified when spending reaches this percentage"
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              inputProps={{ min: 0, max: 100 }}
            />
            
            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingBudget ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Budgets;