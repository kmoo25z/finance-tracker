import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
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
  Tooltip,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  Timer as TimerIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { goalsAPI, utils } from '../services/api';
import { format, differenceInDays, isPast } from 'date-fns';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openProgressDialog, setOpenProgressDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [progressAmount, setProgressAmount] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    goal_type: 'savings',
    target_amount: '',
    current_amount: '0',
    deadline: '',
    description: '',
  });

  const goalTypes = [
    { value: 'savings', label: 'Savings', icon: <MoneyIcon /> },
    { value: 'investment', label: 'Investment', icon: <TrendingUpIcon /> },
    { value: 'purchase', label: 'Purchase', icon: <FlagIcon /> },
    { value: 'emergency', label: 'Emergency Fund', icon: <TimerIcon /> },
    { value: 'other', label: 'Other', icon: <FlagIcon /> },
  ];

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await goalsAPI.getGoals();
      setGoals(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      setError(utils.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      goal_type: goal.goal_type,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      deadline: goal.deadline,
      description: goal.description || '',
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await goalsAPI.deleteGoal(id);
        fetchGoals();
      } catch (error) {
        console.error('Error deleting goal:', error);
        setError(utils.handleError(error));
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const dataToSubmit = {
        ...formData,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount || 0),
      };

      if (editingGoal) {
        await goalsAPI.updateGoal(editingGoal.id, dataToSubmit);
      } else {
        await goalsAPI.createGoal(dataToSubmit);
      }

      setOpenDialog(false);
      setEditingGoal(null);
      resetForm();
      fetchGoals();
    } catch (error) {
      console.error('Error saving goal:', error);
      setError(utils.handleError(error));
    }
  };

  const handleUpdateProgress = async () => {
    if (!selectedGoal || !progressAmount) return;

    try {
      const newAmount = parseFloat(selectedGoal.current_amount) + parseFloat(progressAmount);
      await goalsAPI.updateGoal(selectedGoal.id, {
        ...selectedGoal,
        current_amount: newAmount,
      });
      
      setOpenProgressDialog(false);
      setSelectedGoal(null);
      setProgressAmount('');
      fetchGoals();
    } catch (error) {
      console.error('Error updating progress:', error);
      setError(utils.handleError(error));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      goal_type: 'savings',
      target_amount: '',
      current_amount: '0',
      deadline: '',
      description: '',
    });
  };

  const getGoalProgress = (goal) => {
    if (!goal.target_amount || goal.target_amount === 0) return 0;
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const getDaysRemaining = (deadline) => {
    const days = differenceInDays(new Date(deadline), new Date());
    return days;
  };

  const getGoalStatus = (goal) => {
    const progress = getGoalProgress(goal);
    const daysRemaining = getDaysRemaining(goal.deadline);
    
    if (progress >= 100) {
      return { label: 'Completed', color: 'success', icon: <CheckCircleIcon /> };
    } else if (daysRemaining < 0) {
      return { label: 'Overdue', color: 'error', icon: <TimerIcon /> };
    } else if (daysRemaining <= 30) {
      return { label: 'Due Soon', color: 'warning', icon: <TimerIcon /> };
    } else {
      return { label: 'In Progress', color: 'info', icon: <TrendingUpIcon /> };
    }
  };

  const getTotalStats = () => {
    const totalTarget = goals.reduce((sum, goal) => sum + parseFloat(goal.target_amount || 0), 0);
    const totalCurrent = goals.reduce((sum, goal) => sum + parseFloat(goal.current_amount || 0), 0);
    const completedGoals = goals.filter(goal => getGoalProgress(goal) >= 100).length;
    const activeGoals = goals.filter(goal => getGoalProgress(goal) < 100).length;
    
    return {
      totalTarget,
      totalCurrent,
      totalProgress: totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0,
      completedGoals,
      activeGoals,
    };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const stats = getTotalStats();

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Financial Goals</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingGoal(null);
            resetForm();
            setOpenDialog(true);
          }}
        >
          Add Goal
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Target
              </Typography>
              <Typography variant="h5" component="h2">
                {utils.formatCurrency(stats.totalTarget)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Saved
              </Typography>
              <Typography variant="h5" component="h2" color="primary">
                {utils.formatCurrency(stats.totalCurrent)}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={stats.totalProgress} 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed Goals
              </Typography>
              <Typography variant="h5" component="h2" color="success.main">
                {stats.completedGoals}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Goals
              </Typography>
              <Typography variant="h5" component="h2" color="info.main">
                {stats.activeGoals}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Goals Grid */}
      <Grid container spacing={3}>
        {goals.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <FlagIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No goals yet
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Start by setting your first financial goal
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingGoal(null);
                  resetForm();
                  setOpenDialog(true);
                }}
              >
                Create Your First Goal
              </Button>
            </Paper>
          </Grid>
        ) : (
          goals.map((goal) => {
            const progress = getGoalProgress(goal);
            const status = getGoalStatus(goal);
            const daysRemaining = getDaysRemaining(goal.deadline);
            const goalType = goalTypes.find(t => t.value === goal.goal_type);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={goal.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {goalType?.icon}
                        <Typography variant="h6" component="h2">
                          {goal.name}
                        </Typography>
                      </Box>
                      <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                        icon={status.icon}
                      />
                    </Box>
                    
                    {goal.description && (
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        {goal.description}
                      </Typography>
                    )}
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          Progress
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {progress.toFixed(0)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={progress} 
                        sx={{ height: 8, borderRadius: 4 }}
                        color={progress >= 100 ? 'success' : 'primary'}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2">
                          {utils.formatCurrency(goal.current_amount)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          of {utils.formatCurrency(goal.target_amount)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Deadline
                        </Typography>
                        <Typography variant="body2">
                          {format(new Date(goal.deadline), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="textSecondary">
                          Time Remaining
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color={daysRemaining < 0 ? 'error.main' : daysRemaining <= 30 ? 'warning.main' : 'text.primary'}
                        >
                          {daysRemaining < 0 
                            ? `${Math.abs(daysRemaining)} days overdue`
                            : daysRemaining === 0 
                            ? 'Due today'
                            : `${daysRemaining} days`
                          }
                        </Typography>
                      </Box>
                    </Box>
                    
                    {progress >= 100 && (
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrophyIcon color="warning" />
                        <Typography variant="body2" color="success.main" fontWeight="bold">
                          Goal Achieved!
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => {
                        setSelectedGoal(goal);
                        setProgressAmount('');
                        setOpenProgressDialog(true);
                      }}
                      disabled={progress >= 100}
                    >
                      Add Progress
                    </Button>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(goal)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(goal.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>

      {/* Add/Edit Goal Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingGoal ? 'Edit Goal' : 'Create New Goal'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Goal Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              placeholder="e.g., Emergency Fund, New Car, Vacation"
            />
            
            <TextField
              select
              label="Goal Type"
              value={formData.goal_type}
              onChange={(e) => setFormData({ ...formData, goal_type: e.target.value })}
              fullWidth
            >
              {goalTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {type.icon}
                    {type.label}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Target Amount"
                  type="number"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  inputProps={{ step: "0.01", min: "0" }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Current Amount"
                  type="number"
                  value={formData.current_amount}
                  onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  inputProps={{ step: "0.01", min: "0" }}
                />
              </Grid>
            </Grid>
            
            <TextField
              label="Target Date"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              helperText="When do you want to achieve this goal?"
            />
            
            <TextField
              label="Description (Optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Add any notes or details about this goal..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={!formData.name || !formData.target_amount || !formData.deadline}
          >
            {editingGoal ? 'Update' : 'Create'} Goal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Progress Dialog */}
      <Dialog open={openProgressDialog} onClose={() => setOpenProgressDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Update Progress
        </DialogTitle>
        <DialogContent>
          {selectedGoal && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {selectedGoal.name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Current: {utils.formatCurrency(selectedGoal.current_amount)} / Target: {utils.formatCurrency(selectedGoal.target_amount)}
              </Typography>
              <TextField
                label="Add Amount"
                type="number"
                value={progressAmount}
                onChange={(e) => setProgressAmount(e.target.value)}
                fullWidth
                sx={{ mt: 2 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{ step: "0.01", min: "0" }}
                helperText="Enter the amount to add to your current progress"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProgressDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateProgress} 
            variant="contained" 
            disabled={!progressAmount || parseFloat(progressAmount) <= 0}
          >
            Update Progress
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Goals;