import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Chip,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { expenseAPI, categoriesAPI, utils } from '../../services/api';
import ExpenseForm from './ExpenseForm';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Dialog states
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    startDate: null,
    endDate: null,
    search: '',
  });

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, [page, rowsPerPage, filters]);

  const fetchExpenses = async () => {
  try {
    setLoading(true);
    const params = {
      page: page + 1,
      page_size: rowsPerPage,
      search: filters.search,
      category: filters.category,
      date_after: filters.startDate ? utils.formatDate(filters.startDate) : undefined,
      date_before: filters.endDate ? utils.formatDate(filters.endDate) : undefined,
    };

    console.log('Fetching expenses with params:', params);
    const response = await expenseAPI.getExpenses(params);
    console.log('Expenses response:', response);
    
    // Handle different response formats
    let expenseData = [];
    let count = 0;
    
    if (response.data) {
      // Check if response has results array (paginated)
      if (response.data.results && Array.isArray(response.data.results)) {
        expenseData = response.data.results;
        count = response.data.count || expenseData.length;
      } 
      // Check if response is directly an array
      else if (Array.isArray(response.data)) {
        expenseData = response.data;
        count = expenseData.length;
      }
      // Check if response has expenses property
      else if (response.data.expenses && Array.isArray(response.data.expenses)) {
        expenseData = response.data.expenses;
        count = response.data.count || expenseData.length;
      }
    }
    
    console.log('Processed expense data:', expenseData);
    setExpenses(expenseData);
    setTotalCount(count);
    setError(null);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    setError(utils.handleError(error));
    setExpenses([]);
    setTotalCount(0);
  } finally {
    setLoading(false);
  }
};
  const fetchCategories = async () => {
  try {
    const response = await categoriesAPI.getCategories();
    let categoryData = [];
    
    if (response.data) {
      if (Array.isArray(response.data)) {
        categoryData = response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        categoryData = response.data.results;
      }
    }
    
    setCategories(categoryData);
  } catch (error) {
    console.error('Error fetching categories:', error);
    setCategories([]);
  }
};

  const handleAdd = () => {
    setSelectedExpense(null);
    setOpenForm(true);
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setOpenForm(true);
  };

  const handleDelete = (expense) => {
    setSelectedExpense(expense);
    setOpenDelete(true);
  };

  const handleFormClose = () => {
    setOpenForm(false);
    setSelectedExpense(null);
  };

  const handleFormSubmit = async (data) => {
  console.log('Submitting expense data:', data);
  try {
    if (selectedExpense) {
      const response = await expenseAPI.updateExpense(selectedExpense.id, data);
      console.log('Update response:', response);
    } else {
      const response = await expenseAPI.createExpense(data);
      console.log('Create response:', response);
    }
    handleFormClose();
    fetchExpenses();
  } catch (error) {
    console.error('Error submitting expense:', error);
    console.error('Error response:', error.response);
    throw error;
  }
};
  const handleDeleteConfirm = async () => {
    try {
      await expenseAPI.deleteExpense(selectedExpense.id);
      setOpenDelete(false);
      setSelectedExpense(null);
      fetchExpenses();
    } catch (error) {
      setError(utils.handleError(error));
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExport = async () => {
    try {
      const response = await expenseAPI.exportExpenses({
        format: 'csv',
        ...filters,
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(utils.handleError(error));
    }
  };

  // Calculate total amount safely
  const totalAmount = Array.isArray(expenses) 
    ? expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)
    : 0;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Expenses
          </Typography>
          <Box>
            <Button
              startIcon={<ExportIcon />}
              onClick={handleExport}
              sx={{ mr: 2 }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
            >
              Add Expense
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Summary Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography color="textSecondary" gutterBottom>
                  Total Expenses
                </Typography>
                <Typography variant="h5" color="error">
                  {utils.formatCurrency(totalAmount)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography color="textSecondary" gutterBottom>
                  Number of Transactions
                </Typography>
                <Typography variant="h5">
                  {totalCount}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography color="textSecondary" gutterBottom>
                  Average Transaction
                </Typography>
                <Typography variant="h5">
                  {utils.formatCurrency(totalCount > 0 ? totalAmount / totalCount : 0)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                select
                label="Category"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => setFilters({ ...filters, startDate: date })}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => setFilters({ ...filters, endDate: date })}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Expenses Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(expenses) && expenses.length > 0 ? (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{utils.formatDate(expense.date)}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>
                      <Chip 
                        label={expense.category_name || expense.category || 'Uncategorized'} 
                        size="small" 
                        color="primary"
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'error.main', fontWeight: 500 }}>
                      {utils.formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEdit(expense)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(expense)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No expenses found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {totalCount > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          )}
        </TableContainer>

        {/* Add/Edit Dialog */}
        <ExpenseForm
          open={openForm}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
          expense={selectedExpense}
          categories={categories}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
          <DialogTitle>Delete Expense</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this expense?
            </Typography>
            {selectedExpense && (
              <Box mt={2}>
                <Typography variant="body2" color="textSecondary">
                  {selectedExpense.description} - {utils.formatCurrency(selectedExpense.amount)}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Expenses;