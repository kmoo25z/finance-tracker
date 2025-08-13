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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { incomeAPI, accountsAPI, utils } from '../services/api';

const Income = () => {
  const [incomes, setIncomes] = useState([]);
  const [accounts, setAccounts] = useState({ us: [], kenya: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    deposit_time: '',
    frequency: 'once',
    status: 'pending',
    us_account: '',
    kenya_account: '',
  });

  const frequencyOptions = [
    { value: 'once', label: 'One Time' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annually', label: 'Annually' },
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'warning' },
    { value: 'deposited', label: 'Deposited', color: 'success' },
    { value: 'cancelled', label: 'Cancelled', color: 'error' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [incomeRes, usAccRes, kenAccRes] = await Promise.all([
        incomeAPI.getIncomes(),
        accountsAPI.getUSAccounts(),
        accountsAPI.getKenyaAccounts(),
      ]);
      
      setIncomes(Array.isArray(incomeRes.data) ? incomeRes.data : []);
      setAccounts({
        us: Array.isArray(usAccRes.data) ? usAccRes.data : [],
        kenya: Array.isArray(kenAccRes.data) ? kenAccRes.data : [],
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(utils.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (income) => {
    setEditingIncome(income);
    setFormData({
      source: income.source,
      amount: income.amount,
      currency: income.currency,
      date: income.date,
      deposit_time: income.deposit_time || '',
      frequency: income.frequency,
      status: income.status,
      us_account: income.us_account || '',
      kenya_account: income.kenya_account || '',
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this income?')) {
      try {
        await incomeAPI.deleteIncome(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting income:', error);
        setError(utils.handleError(error));
      }
    }
  };

  const handleMarkDeposited = async (id) => {
    try {
      await incomeAPI.markDeposited(id);
      fetchData();
    } catch (error) {
      console.error('Error marking income as deposited:', error);
      setError(utils.handleError(error));
    }
  };

  const handleSubmit = async () => {
    try {
      const dataToSubmit = {
        ...formData,
        amount: parseFloat(formData.amount),
        us_account: formData.us_account || null,
        kenya_account: formData.kenya_account || null,
      };

      if (editingIncome) {
        await incomeAPI.updateIncome(editingIncome.id, dataToSubmit);
      } else {
        await incomeAPI.createIncome(dataToSubmit);
      }

      setOpenDialog(false);
      setEditingIncome(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving income:', error);
      setError(utils.handleError(error));
    }
  };

  const resetForm = () => {
    setFormData({
      source: '',
      amount: '',
      currency: 'USD',
      date: new Date().toISOString().split('T')[0],
      deposit_time: '',
      frequency: 'once',
      status: 'pending',
      us_account: '',
      kenya_account: '',
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'deposited':
        return <CheckCircleIcon fontSize="small" />;
      case 'pending':
        return <ScheduleIcon fontSize="small" />;
      case 'cancelled':
        return <CancelIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const getTotalIncome = (status = null) => {
    const filtered = status ? incomes.filter(inc => inc.status === status) : incomes;
    const usdTotal = filtered
      .filter(inc => inc.currency === 'USD')
      .reduce((sum, inc) => sum + parseFloat(inc.amount), 0);
    const kesTotal = filtered
      .filter(inc => inc.currency === 'KES')
      .reduce((sum, inc) => sum + parseFloat(inc.amount), 0);
    
    return { usd: usdTotal, kes: kesTotal };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const totals = getTotalIncome();
  const pendingTotals = getTotalIncome('pending');
  const depositedTotals = getTotalIncome('deposited');

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Income Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingIncome(null);
            resetForm();
            setOpenDialog(true);
          }}
        >
          Add Income
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
                Total Income
              </Typography>
              <Typography variant="h5" component="h2">
                {totals.usd > 0 && utils.formatCurrency(totals.usd, 'USD')}
                {totals.usd > 0 && totals.kes > 0 && ' / '}
                {totals.kes > 0 && utils.formatCurrency(totals.kes, 'KES')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Income
              </Typography>
              <Typography variant="h5" component="h2" color="warning.main">
                {pendingTotals.usd > 0 && utils.formatCurrency(pendingTotals.usd, 'USD')}
                {pendingTotals.usd > 0 && pendingTotals.kes > 0 && ' / '}
                {pendingTotals.kes > 0 && utils.formatCurrency(pendingTotals.kes, 'KES')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Deposited Income
              </Typography>
              <Typography variant="h5" component="h2" color="success.main">
                {depositedTotals.usd > 0 && utils.formatCurrency(depositedTotals.usd, 'USD')}
                {depositedTotals.usd > 0 && depositedTotals.kes > 0 && ' / '}
                {depositedTotals.kes > 0 && utils.formatCurrency(depositedTotals.kes, 'KES')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Sources
              </Typography>
              <Typography variant="h5" component="h2">
                {incomes.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Income Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Source</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Frequency</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Account</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {incomes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No income records found. Add your first income source!
                </TableCell>
              </TableRow>
            ) : (
              incomes.map((income) => (
                <TableRow key={income.id}>
                  <TableCell component="th" scope="row">
                    {income.source}
                  </TableCell>
                  <TableCell align="right">
                    {utils.formatCurrency(income.amount, income.currency)}
                  </TableCell>
                  <TableCell>
                    {new Date(income.date).toLocaleDateString()}
                    {income.deposit_time && (
                      <Typography variant="caption" display="block">
                        {income.deposit_time}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {frequencyOptions.find(f => f.value === income.frequency)?.label}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(income.status)}
                      label={statusOptions.find(s => s.value === income.status)?.label}
                      color={statusOptions.find(s => s.value === income.status)?.color}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {income.us_account && accounts.us.find(a => a.id === income.us_account)?.account_name}
                    {income.kenya_account && accounts.kenya.find(a => a.id === income.kenya_account)?.account_name}
                    {!income.us_account && !income.kenya_account && '-'}
                  </TableCell>
                  <TableCell align="center">
                    {income.status === 'pending' && (
                      <Tooltip title="Mark as Deposited">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleMarkDeposited(income.id)}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(income)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(income.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIncome ? 'Edit Income' : 'Add New Income'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Income Source"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              fullWidth
              required
              placeholder="e.g., Salary, Freelance, Investment"
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  fullWidth
                  required
                  inputProps={{ step: "0.01", min: "0" }}
                />
              </Grid>
              <Grid item xs={6}>
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
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Deposit Time"
                  type="time"
                  value={formData.deposit_time}
                  onChange={(e) => setFormData({ ...formData, deposit_time: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <TextField
              select
              label="Frequency"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              fullWidth
            >
              {frequencyOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              fullWidth
            >
              {statusOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

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
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={!formData.source || !formData.amount}
          >
            {editingIncome ? 'Update' : 'Add'} Income
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Income;