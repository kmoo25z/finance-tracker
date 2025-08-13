import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Typography,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
// Remove the CSS imports - they're causing the conflict
// import 'ag-grid-community/styles/ag-grid.css';
// import 'ag-grid-community/styles/ag-theme-material.css';

// Import API services
import { transactionsAPI, accountsAPI, utils } from '../services/api';

// Register AG-Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState({ us: [], kenya: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState({
    transaction_type: 'expense',
    amount: '',
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    description: '',
    budget_percentage: '',
    us_account: '',
    kenya_account: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [transRes, usAccRes, kenAccRes] = await Promise.all([
        transactionsAPI.getTransactions(),
        accountsAPI.getUSAccounts(),
        accountsAPI.getKenyaAccounts(),
      ]);
      
      // Handle paginated response
      const transactionData = transRes.data.results || transRes.data;
      setTransactions(Array.isArray(transactionData) ? transactionData : []);
      
      // Ensure accounts are arrays
      setAccounts({
        us: Array.isArray(usAccRes.data) ? usAccRes.data : [],
        kenya: Array.isArray(kenAccRes.data) ? kenAccRes.data : [],
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(utils.handleError(error));
      // Set empty arrays on error
      setTransactions([]);
      setAccounts({ us: [], kenya: [] });
    } finally {
      setLoading(false);
    }
  };

  const columnDefs = useMemo(() => [
    {
      field: 'date',
      headerName: 'Date',
      sortable: true,
      filter: 'agDateColumnFilter',
      valueFormatter: params => params.value ? new Date(params.value).toLocaleDateString() : '',
    },
    {
      field: 'transaction_type',
      headerName: 'Type',
      sortable: true,
      filter: true,
      cellRenderer: params => {
        if (!params.value) return '';
        const color = params.value === 'income' ? 'success' : 
                     params.value === 'expense' ? 'error' : 'info';
        return (
          <Chip 
            label={params.value} 
            color={color} 
            size="small" 
            style={{ textTransform: 'capitalize' }}
          />
        );
      },
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      filter: true,
    },
    {
      field: 'amount',
      headerName: 'Amount',
      sortable: true,
      filter: 'agNumberColumnFilter',
      valueFormatter: params => {
        if (params.value && params.data) {
          const sign = params.data.transaction_type === 'income' ? '+' : '-';
          return `${sign}${utils.formatCurrency(params.value, params.data.currency)}`;
        }
        return '';
      },
      cellStyle: params => ({
        color: params.data?.transaction_type === 'income' ? 'green' : 'red',
      }),
    },
    {
      field: 'budget_percentage',
      headerName: 'Budget %',
      sortable: true,
      filter: 'agNumberColumnFilter',
      valueFormatter: params => params.value ? `${params.value}%` : '-',
    },
    {
      field: 'account',
      headerName: 'Account',
      valueGetter: params => {
        if (params.data?.us_account_detail) {
          return params.data.us_account_detail.account_name;
        }
        if (params.data?.kenya_account_detail) {
          return params.data.kenya_account_detail.account_name;
        }
        return '-';
      },
    },
    {
      headerName: 'Actions',
      cellRenderer: (params) => {
        return (
          <Box>
            <Button 
              size="small" 
              onClick={() => handleEdit(params.data)}
              style={{ marginRight: 4 }}
            >
              Edit
            </Button>
            <Button 
              size="small" 
              color="error" 
              onClick={() => handleDelete(params.data.id)}
            >
              Delete
            </Button>
          </Box>
        );
      },
    },
  ], []);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), []);

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      transaction_type: transaction.transaction_type,
      amount: transaction.amount,
      currency: transaction.currency,
      date: transaction.date,
      description: transaction.description,
      budget_percentage: transaction.budget_percentage || '',
      us_account: transaction.us_account || '',
      kenya_account: transaction.kenya_account || '',
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await transactionsAPI.deleteTransaction(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        setError(utils.handleError(error));
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const dataToSubmit = {
        ...formData,
        amount: parseFloat(formData.amount),
        budget_percentage: formData.budget_percentage ? parseFloat(formData.budget_percentage) : null,
        us_account: formData.us_account || null,
        kenya_account: formData.kenya_account || null,
      };

      if (editingTransaction) {
        await transactionsAPI.updateTransaction(editingTransaction.id, dataToSubmit);
      } else {
        await transactionsAPI.createTransaction(dataToSubmit);
      }

      setOpenDialog(false);
      setEditingTransaction(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving transaction:', error);
      setError(utils.handleError(error));
    }
  };

  const resetForm = () => {
    setFormData({
      transaction_type: 'expense',
      amount: '',
      currency: 'USD',
      date: new Date().toISOString().split('T')[0],
      description: '',
      budget_percentage: '',
      us_account: '',
      kenya_account: '',
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Transactions</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingTransaction(null);
            resetForm();
            setOpenDialog(true);
          }}
        >
          Add Transaction
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ height: 600, width: '100%' }}>
        <AgGridReact
          rowData={transactions}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={20}
          theme="legacy"  // Use legacy theme to avoid conflicts
          domLayout='normal'
        />
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              select
              label="Type"
              value={formData.transaction_type}
              onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
              fullWidth
            >
              <MenuItem value="income">Income</MenuItem>
              <MenuItem value="expense">Expense</MenuItem>
              <MenuItem value="transfer">Transfer</MenuItem>
            </TextField>

            <TextField
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              fullWidth
              required
              inputProps={{ step: "0.01", min: "0" }}
            />

            <TextField
              select
              label="Currency"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              fullWidth
            >
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="KES">KES</MenuItem>
            </TextField>

            <TextField
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />

            <TextField
              label="Budget %"
              type="number"
              value={formData.budget_percentage}
              onChange={(e) => setFormData({ ...formData, budget_percentage: e.target.value })}
              fullWidth
              inputProps={{ step: "0.01", min: "0", max: "100" }}
            />

            {formData.currency === 'USD' ? (
              <TextField
                select
                label="US Account"
                value={formData.us_account}
                onChange={(e) => setFormData({ ...formData, us_account: e.target.value })}
                fullWidth
              >
                <MenuItem value="">None</MenuItem>
                {accounts.us.map(account => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.account_name}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                select
                label="Kenya Account"
                value={formData.kenya_account}
                onChange={(e) => setFormData({ ...formData, kenya_account: e.target.value })}
                fullWidth
              >
                <MenuItem value="">None</MenuItem>
                {accounts.kenya.map(account => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.account_name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!formData.amount}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Transactions;