import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { categoriesAPI, budgetsAPI, utils } from '../services/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [openBudgetDialog, setOpenBudgetDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBudget, setSelectedBudget] = useState(null);
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'expense',
    description: '',
  });
  
  const [budgetForm, setBudgetForm] = useState({
    category: '',
    amount: '',
    period: 'monthly',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, budgetsRes] = await Promise.all([
        categoriesAPI.getCategories(),
        budgetsAPI.getBudgets(),
      ]);
      
      // Handle different response formats for categories
      let categoriesData = [];
      if (categoriesRes.data) {
        if (Array.isArray(categoriesRes.data)) {
          categoriesData = categoriesRes.data;
        } else if (categoriesRes.data.results && Array.isArray(categoriesRes.data.results)) {
          categoriesData = categoriesRes.data.results;
        } else if (categoriesRes.data.categories && Array.isArray(categoriesRes.data.categories)) {
          categoriesData = categoriesRes.data.categories;
        }
      }
      
      // Handle different response formats for budgets
      let budgetsData = [];
      if (budgetsRes.data) {
        if (Array.isArray(budgetsRes.data)) {
          budgetsData = budgetsRes.data;
        } else if (budgetsRes.data.results && Array.isArray(budgetsRes.data.results)) {
          budgetsData = budgetsRes.data.results;
        } else if (budgetsRes.data.budgets && Array.isArray(budgetsRes.data.budgets)) {
          budgetsData = budgetsRes.data.budgets;
        }
      }
      
      console.log('Categories data:', categoriesData);
      console.log('Budgets data:', budgetsData);
      
      setCategories(categoriesData);
      setBudgets(budgetsData);
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(utils.handleError(error));
      setCategories([]);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async () => {
    try {
      if (selectedCategory) {
        await categoriesAPI.updateCategory(selectedCategory.id, categoryForm);
      } else {
        await categoriesAPI.createCategory(categoryForm);
      }
      setOpenCategoryDialog(false);
      resetCategoryForm();
      fetchData();
    } catch (error) {
      setError(utils.handleError(error));
    }
  };

  const handleBudgetSubmit = async () => {
    try {
      const data = {
        ...budgetForm,
        amount: parseFloat(budgetForm.amount),
      };
      
      if (selectedBudget) {
        await budgetsAPI.updateBudget(selectedBudget.id, data);
      } else {
        await budgetsAPI.createBudget(data);
      }
      setOpenBudgetDialog(false);
      resetBudgetForm();
      fetchData();
    } catch (error) {
      setError(utils.handleError(error));
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoriesAPI.deleteCategory(id);
        fetchData();
      } catch (error) {
        setError(utils.handleError(error));
      }
    }
  };

  const handleDeleteBudget = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await budgetsAPI.deleteBudget(id);
        fetchData();
      } catch (error) {
        setError(utils.handleError(error));
      }
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      type: 'expense',
      description: '',
    });
    setSelectedCategory(null);
  };

  const resetBudgetForm = () => {
    setBudgetForm({
      category: '',
      amount: '',
      period: 'monthly',
    });
    setSelectedBudget(null);
  };

  const getBudgetForCategory = (categoryId) => {
    return Array.isArray(budgets) ? budgets.find(b => b.category === categoryId) : null;
  };

  const calculateBudgetProgress = (budget) => {
    const spent = budget.spent || 0;
    const amount = budget.amount || 0;
    const percentage = amount > 0 ? (spent / amount) * 100 : 0;
    return Math.min(percentage, 100);
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Categories & Budgets</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCategoryDialog(true)}
            sx={{ mr: 2 }}
          >
            Add Category
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenBudgetDialog(true)}
          >
            Set Budget
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!Array.isArray(categories) || categories.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No categories yet
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Create your first category to start organizing your finances
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCategoryDialog(true)}
          >
            Create Category
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {categories.map((category) => {
            const budget = getBudgetForCategory(category.id);
            const progress = budget ? calculateBudgetProgress(budget) : 0;
            
            return (
              <Grid item xs={12} md={6} key={category.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Typography variant="h6" gutterBottom>
                          {category.name}
                        </Typography>
                        <Chip 
                          label={category.type} 
                          size="small" 
                          color={category.type === 'income' ? 'success' : 'error'}
                          sx={{ mb: 1 }}
                        />
                        {category.description && (
                          <Typography variant="body2" color="textSecondary" paragraph>
                            {category.description}
                          </Typography>
                        )}
                        
                        {budget && (
                          <Box mt={2}>
                            <Box display="flex" justifyContent="space-between" mb={1}>
                              <Typography variant="body2">
                                Budget: {utils.formatCurrency(budget.spent || 0)} / {utils.formatCurrency(budget.amount)}
                              </Typography>
                              <Typography variant="body2" color={progress > 90 ? 'error' : 'textSecondary'}>
                                {progress.toFixed(0)}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={progress}
                              color={progress > 90 ? 'error' : progress > 75 ? 'warning' : 'primary'}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="caption" color="textSecondary">
                              {budget.period} budget
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      
                      {/* Fixed button layout with Stack */}
                      <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedCategory(category);
                            setCategoryForm({
                              name: category.name,
                              type: category.type,
                              description: category.description || '',
                            });
                            setOpenCategoryDialog(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        
                        {!budget && category.type === 'expense' && (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setBudgetForm({
                                category: category.id,
                                amount: '',
                                period: 'monthly',
                              });
                              setOpenBudgetDialog(true);
                            }}
                          >
                            <MoneyIcon fontSize="small" />
                          </IconButton>
                        )}
                        
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Active Budgets Section */}
      {Array.isArray(budgets) && budgets.length > 0 && (
        <Box mt={4}>
          <Typography variant="h5" gutterBottom>
            Active Budgets
          </Typography>
          <Paper>
            <List>
              {budgets.map((budget) => {
                const category = Array.isArray(categories) 
                  ? categories.find(c => c.id === budget.category)
                  : null;
                const progress = calculateBudgetProgress(budget);
                
                return (
                  <ListItem key={budget.id} divider>
                    <ListItemText
                      primary={category?.name || 'Unknown Category'}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {utils.formatCurrency(budget.spent || 0)} / {utils.formatCurrency(budget.amount)} ({budget.period})
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={progress}
                            color={progress > 90 ? 'error' : progress > 75 ? 'warning' : 'primary'}
                            sx={{ mt: 1, height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => {
                            setSelectedBudget(budget);
                            setBudgetForm({
                              category: budget.category,
                              amount: budget.amount,
                              period: budget.period,
                            });
                            setOpenBudgetDialog(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          edge="end"
                          size="small"
                          color="error"
                          onClick={() => handleDeleteBudget(budget.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </Box>
      )}

      {/* Category Dialog */}
      <Dialog open={openCategoryDialog} onClose={() => setOpenCategoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedCategory ? 'Edit Category' : 'Add Category'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            select
            label="Type"
            value={categoryForm.type}
            onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })}
            margin="normal"
            SelectProps={{ native: true }}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </TextField>
          <TextField
            fullWidth
            label="Description"
            value={categoryForm.description}
            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenCategoryDialog(false);
            resetCategoryForm();
          }}>
            Cancel
          </Button>
          <Button onClick={handleCategorySubmit} variant="contained">
            {selectedCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Budget Dialog */}
      <Dialog open={openBudgetDialog} onClose={() => setOpenBudgetDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedBudget ? 'Edit Budget' : 'Set Budget'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label="Category"
            value={budgetForm.category}
            onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
            margin="normal"
            required
            SelectProps={{ native: true }}
          >
            <option value="">Select Category</option>
            {Array.isArray(categories) && categories
              .filter(c => c.type === 'expense')
              .map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </TextField>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={budgetForm.amount}
            onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
            margin="normal"
            required
            InputProps={{
              startAdornment: '$',
            }}
          />
          <TextField
            fullWidth
            select
            label="Period"
            value={budgetForm.period}
            onChange={(e) => setBudgetForm({ ...budgetForm, period: e.target.value })}
            margin="normal"
            SelectProps={{ native: true }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenBudgetDialog(false);
            resetBudgetForm();
          }}>
            Cancel
          </Button>
          <Button onClick={handleBudgetSubmit} variant="contained">
            {selectedBudget ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Categories;