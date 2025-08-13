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
  Typography,
  Grid,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as AccountBalanceIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { accountsAPI, transactionsAPI, utils } from '../services/api';

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`account-tabpanel-${index}`}
      aria-labelledby={`account-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Accounts = () => {
  console.log('=== ACCOUNTS COMPONENT RENDERING ===');
  
  const [tabValue, setTabValue] = useState(0);
  const [usAccounts, setUsAccounts] = useState([]);
  const [kenyaAccounts, setKenyaAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountType, setAccountType] = useState('us'); // 'us' or 'kenya'
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh
  
  // Form data
  const [formData, setFormData] = useState({
    account_name: '',
    account_number: '',
    balance: '',
    balance_kes: '',
  });

  // Debug state changes
  useEffect(() => {
    console.log('=== STATE UPDATE ===');
    console.log('Current US Accounts in state:', usAccounts);
    console.log('Current Kenya Accounts in state:', kenyaAccounts);
    console.log('Current tab value:', tabValue);
    console.log('Loading state:', loading);
  }, [usAccounts, kenyaAccounts, tabValue, loading]);

  // Fetch data on mount and when refreshKey changes
  useEffect(() => {
    console.log('=== useEffect triggered - refreshKey:', refreshKey);
    fetchData();
  }, [refreshKey]);

  const fetchData = async () => {
    console.log('=== STARTING FETCH DATA ===');
    try {
      setLoading(true);
      setError(null);
      
      console.log('Making API calls...');
      
      // Make individual calls for better debugging
      console.log('Fetching US accounts...');
      const usRes = await accountsAPI.getUSAccounts();
      console.log('Raw US Accounts response:', usRes);
      console.log('US Accounts data:', usRes.data);
      console.log('Type of usRes.data:', typeof usRes.data);
      console.log('Is array?', Array.isArray(usRes.data));
      
      console.log('Fetching Kenya accounts...');
      const kenRes = await accountsAPI.getKenyaAccounts();
      console.log('Raw Kenya Accounts response:', kenRes);
      console.log('Kenya Accounts data:', kenRes.data);
      
      console.log('Fetching transactions...');
      const transRes = await transactionsAPI.getTransactions({ limit: 100 });
      console.log('Raw Transactions response:', transRes);
      
      // Handle different response formats (paginated vs non-paginated)
      let usAccountsData = [];
      let kenAccountsData = [];
      let transactionsData = [];
      
      // Check if response is paginated
      if (usRes.data && typeof usRes.data === 'object' && 'results' in usRes.data) {
        console.log('US Accounts response is paginated');
        usAccountsData = usRes.data.results || [];
      } else if (Array.isArray(usRes.data)) {
        console.log('US Accounts response is direct array');
        usAccountsData = usRes.data;
      } else {
        console.log('Unexpected US Accounts response format');
      }
      
      if (kenRes.data && typeof kenRes.data === 'object' && 'results' in kenRes.data) {
        console.log('Kenya Accounts response is paginated');
        kenAccountsData = kenRes.data.results || [];
      } else if (Array.isArray(kenRes.data)) {
        console.log('Kenya Accounts response is direct array');
        kenAccountsData = kenRes.data;
      } else {
        console.log('Unexpected Kenya Accounts response format');
      }
      
      if (transRes.data && typeof transRes.data === 'object' && 'results' in transRes.data) {
        transactionsData = transRes.data.results || [];
      } else if (Array.isArray(transRes.data)) {
        transactionsData = transRes.data;
      }
      
      console.log('Setting US accounts to:', usAccountsData);
      setUsAccounts(usAccountsData);
      
      console.log('Setting Kenya accounts to:', kenAccountsData);
      setKenyaAccounts(kenAccountsData);
      
      console.log('Setting transactions to:', transactionsData);
      setTransactions(transactionsData);
      
      console.log('=== FETCH DATA COMPLETE ===');
    } catch (error) {
      console.error('Error in fetchData:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      setError(utils.handleError(error));
      
      // Set empty arrays on error
      setUsAccounts([]);
      setKenyaAccounts([]);
      setTransactions([]);
    } finally {
      setLoading(false);
      console.log('Loading set to false');
    }
  };

  const handleTabChange = (event, newValue) => {
    console.log('Tab changed to:', newValue);
    setTabValue(newValue);
  };

  const handleAddAccount = (type) => {
    console.log('Add account clicked, type:', type);
    setAccountType(type);
    setEditingAccount(null);
    setFormData({
      account_name: '',
      account_number: '',
      balance: '',
      balance_kes: '',
    });
    setOpenDialog(true);
  };

  const handleEditAccount = (account, type) => {
    console.log('Edit account clicked:', account, 'type:', type);
    setAccountType(type);
    setEditingAccount(account);
    setFormData({
      account_name: account.account_name,
      account_number: account.account_number || '',
      balance: account.balance || '',
      balance_kes: account.balance_kes || '',
    });
    setOpenDialog(true);
  };

  const handleDeleteAccount = async (id, type) => {
    console.log('Delete account clicked, id:', id, 'type:', type);
    if (window.confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      try {
        if (type === 'us') {
          await accountsAPI.deleteUSAccount(id);
        } else {
          await accountsAPI.deleteKenyaAccount(id);
        }
        
        // Force refresh
        console.log('Account deleted, refreshing data...');
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error('Error deleting account:', error);
        setError(utils.handleError(error));
      }
    }
  };

  const handleSubmit = async () => {
    console.log('=== HANDLE SUBMIT CALLED ===');
    console.log('Form data:', formData);
    console.log('Account type:', accountType);
    console.log('Editing account:', editingAccount);
    
    try {
      const dataToSubmit = {
        account_name: formData.account_name,
        account_number: formData.account_number,
      };

      let response;

      if (accountType === 'us') {
        dataToSubmit.balance = parseFloat(formData.balance) || 0;
        console.log('Submitting US account data:', dataToSubmit);
        
        if (editingAccount) {
          response = await accountsAPI.updateUSAccount(editingAccount.id, dataToSubmit);
          console.log('Update response:', response);
        } else {
          response = await accountsAPI.createUSAccount(dataToSubmit);
          console.log('Create response:', response);
        }
      } else {
        dataToSubmit.balance_kes = parseFloat(formData.balance_kes) || 0;
        console.log('Submitting Kenya account data:', dataToSubmit);
        
        if (editingAccount) {
          response = await accountsAPI.updateKenyaAccount(editingAccount.id, dataToSubmit);
          console.log('Update response:', response);
        } else {
          response = await accountsAPI.createKenyaAccount(dataToSubmit);
          console.log('Create response:', response);
        }
      }

      console.log('Closing dialog and resetting form...');
      setOpenDialog(false);
      setEditingAccount(null);
      setFormData({
        account_name: '',
        account_number: '',
        balance: '',
        balance_kes: '',
      });
      
      // Force refresh
      console.log('Forcing data refresh...');
      setRefreshKey(prev => prev + 1);
      
    } catch (error) {
      console.error('Error saving account:', error);
      console.error('Error response:', error.response);
      setError(utils.handleError(error));
    }
  };

  const handleManualRefresh = () => {
    console.log('Manual refresh clicked');
    setRefreshKey(prev => prev + 1);
  };

  const getAccountTransactions = (accountId, type) => {
    return transactions.filter(trans => {
      if (type === 'us') {
        return trans.us_account === accountId;
      } else {
        return trans.kenya_account === accountId;
      }
    });
  };

  const getAccountStats = (accountId, type) => {
    const accountTransactions = getAccountTransactions(accountId, type);
    
    const income = accountTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const expenses = accountTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const transfers = accountTransactions
      .filter(t => t.transaction_type === 'transfer')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return { income, expenses, transfers, transactionCount: accountTransactions.length };
  };

  const getTotalBalance = (accounts, currency) => {
    return accounts.reduce((sum, account) => {
      const balance = currency === 'USD' ? account.balance : account.balance_kes;
      return sum + parseFloat(balance || 0);
    }, 0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading accounts...</Typography>
      </Box>
    );
  }

  const totalUSD = getTotalBalance(usAccounts, 'USD');
  const totalKES = getTotalBalance(kenyaAccounts, 'KES');

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Account Management</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleManualRefresh}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Debug Info Box - Remove this in production */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.100' }}>
        <Typography variant="caption" display="block">
          Debug Info: US Accounts: {usAccounts.length}, Kenya Accounts: {kenyaAccounts.length}, 
          Transactions: {transactions.length}, Refresh Key: {refreshKey}
        </Typography>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total US Balance
              </Typography>
              <Typography variant="h5" component="h2">
                {utils.formatCurrency(totalUSD, 'USD')}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {usAccounts.length} account{usAccounts.length !== 1 ? 's' : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Kenya Balance
              </Typography>
              <Typography variant="h5" component="h2">
                {utils.formatCurrency(totalKES, 'KES')}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {kenyaAccounts.length} account{kenyaAccounts.length !== 1 ? 's' : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Accounts
              </Typography>
              <Typography variant="h5" component="h2">
                {usAccounts.length + kenyaAccounts.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Transactions
              </Typography>
              <Typography variant="h5" component="h2">
                {transactions.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for US and Kenya Accounts */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="account tabs">
          <Tab 
            label={`US Accounts (${usAccounts.length})`} 
            icon={<AttachMoneyIcon />} 
            iconPosition="start"
          />
          <Tab 
            label={`Kenya Accounts (${kenyaAccounts.length})`} 
            icon={<AccountBalanceIcon />} 
            iconPosition="start"
          />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleAddAccount('us')}
            >
              Add US Account
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {usAccounts.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="textSecondary">
                    No US accounts found. Add your first account!
                  </Typography>
                </Paper>
              </Grid>
            ) : (
              usAccounts.map((account) => {
                const stats = getAccountStats(account.id, 'us');
                return (
                  <Grid item xs={12} sm={6} md={4} key={account.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {account.account_name}
                        </Typography>
                        {account.account_number && (
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Account #: ***{account.account_number.slice(-4)}
                          </Typography>
                        )}
                        <Typography variant="h4" color="primary" gutterBottom>
                          {utils.formatCurrency(account.balance, 'USD')}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Box display="flex" alignItems="center">
                              <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                              <Typography variant="body2">
                                Income: {utils.formatCurrency(stats.income, 'USD')}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box display="flex" alignItems="center">
                              <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                              <Typography variant="body2">
                                Expenses: {utils.formatCurrency(stats.expenses, 'USD')}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          {stats.transactionCount} transaction{stats.transactionCount !== 1 ? 's' : ''}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                          ID: {account.id} | Created: {new Date(account.created_at).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditAccount(account, 'us')}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteAccount(account.id, 'us')}
                          >
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
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleAddAccount('kenya')}
            >
              Add Kenya Account
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {kenyaAccounts.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="textSecondary">
                    No Kenya accounts found. Add your first account!
                  </Typography>
                </Paper>
              </Grid>
            ) : (
              kenyaAccounts.map((account) => {
                const stats = getAccountStats(account.id, 'kenya');
                return (
                  <Grid item xs={12} sm={6} md={4} key={account.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {account.account_name}
                        </Typography>
                        {account.account_number && (
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Account #: ***{account.account_number.slice(-4)}
                          </Typography>
                        )}
                        <Typography variant="h4" color="primary" gutterBottom>
                          {utils.formatCurrency(account.balance_kes, 'KES')}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Box display="flex" alignItems="center">
                              <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                              <Typography variant="body2">
                                Income: {utils.formatCurrency(stats.income, 'KES')}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box display="flex" alignItems="center">
                              <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                              <Typography variant="body2">
                                Expenses: {utils.formatCurrency(stats.expenses, 'KES')}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          {stats.transactionCount} transaction{stats.transactionCount !== 1 ? 's' : ''}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                          ID: {account.id} | Created: {new Date(account.created_at).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditAccount(account, 'kenya')}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteAccount(account.id, 'kenya')}
                          >
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
        </TabPanel>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAccount ? 'Edit' : 'Add'} {accountType === 'us' ? 'US' : 'Kenya'} Account
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Account Name"
              value={formData.account_name}
              onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
              fullWidth
              required
              placeholder="e.g., Chase Checking, Equity Bank"
            />
            
            <TextField
              label="Account Number (Optional)"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              fullWidth
              placeholder="Last 4 digits for reference"
            />
            
            <TextField
              label={`Current Balance (${accountType === 'us' ? 'USD' : 'KES'})`}
              type="number"
              value={accountType === 'us' ? formData.balance : formData.balance_kes}
              onChange={(e) => setFormData({ 
                ...formData, 
                [accountType === 'us' ? 'balance' : 'balance_kes']: e.target.value 
              })}
              fullWidth
              required
              inputProps={{ step: "0.01", min: "0" }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={!formData.account_name}
          >
            {editingAccount ? 'Update' : 'Create'} Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Accounts;