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
  Tooltip,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  SwapHoriz as TransferIcon,
  AccountBalance as BankIcon,
  AttachMoney as MoneyIcon,
  History as HistoryIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Schedule as PendingIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { moneyTransferAPI, accountsAPI, utils } from '../services/api';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`transfer-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const MoneyTransfer = () => {
  const [tabValue, setTabValue] = useState(0);
  const [transfers, setTransfers] = useState([]);
  const [accounts, setAccounts] = useState({ us: [], kenya: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  
  const [transferFormData, setTransferFormData] = useState({
    transfer_type: 'internal',
    from_account_type: '',
    from_account_id: '',
    to_account_type: '',
    to_account_id: '',
    amount: '',
    exchange_rate: '150',
    fee: '0',
    notes: '',
    scheduled_date: new Date().toISOString().split('T')[0],
  });

  const transferTypes = [
    { value: 'internal', label: 'Between My Accounts' },
    { value: 'external', label: 'To External Account' },
  ];

  const transferStatuses = {
    pending: { label: 'Pending', color: 'warning', icon: <PendingIcon /> },
    completed: { label: 'Completed', color: 'success', icon: <CheckIcon /> },
    failed: { label: 'Failed', color: 'error', icon: <ErrorIcon /> },
    cancelled: { label: 'Cancelled', color: 'default', icon: <CancelIcon /> },
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [transferRes, usAccRes, kenAccRes] = await Promise.all([
        moneyTransferAPI.getTransfers(),
        accountsAPI.getUSAccounts(),
        accountsAPI.getKenyaAccounts(),
      ]);
      
      setTransfers(Array.isArray(transferRes.data) ? transferRes.data : []);
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

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setTransferFormData({
      transfer_type: 'internal',
      from_account_type: '',
      from_account_id: '',
      to_account_type: '',
      to_account_id: '',
      amount: '',
      exchange_rate: '150',
      fee: '0',
      notes: '',
      scheduled_date: new Date().toISOString().split('T')[0],
    });
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        return transferFormData.from_account_type && transferFormData.from_account_id;
      case 1:
        return transferFormData.to_account_type && transferFormData.to_account_id;
      case 2:
        return transferFormData.amount && parseFloat(transferFormData.amount) > 0;
      default:
        return true;
    }
  };

  const handleSubmitTransfer = async () => {
    try {
      setError(null);
      
      // Prepare data based on account types
      const dataToSubmit = {
        transfer_type: transferFormData.transfer_type,
        amount: parseFloat(transferFormData.amount),
        exchange_rate: parseFloat(transferFormData.exchange_rate),
        fee: parseFloat(transferFormData.fee || 0),
        notes: transferFormData.notes,
        scheduled_date: transferFormData.scheduled_date,
        status: 'pending',
      };

      // Set source account
      if (transferFormData.from_account_type === 'us') {
        dataToSubmit.from_us_account = transferFormData.from_account_id;
      } else {
        dataToSubmit.from_kenya_account = transferFormData.from_account_id;
      }

      // Set destination account
      if (transferFormData.to_account_type === 'us') {
        dataToSubmit.to_us_account = transferFormData.to_account_id;
      } else {
        dataToSubmit.to_kenya_account = transferFormData.to_account_id;
      }

      await moneyTransferAPI.createTransfer(dataToSubmit);
      
      setSuccess('Transfer initiated successfully!');
      setOpenTransferDialog(false);
      handleReset();
      fetchData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error creating transfer:', error);
      setError(utils.handleError(error));
    }
  };

  const handleCancelTransfer = async (id) => {
    if (window.confirm('Are you sure you want to cancel this transfer?')) {
      try {
        await moneyTransferAPI.updateTransfer(id, { status: 'cancelled' });
        fetchData();
        setSuccess('Transfer cancelled successfully');
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        console.error('Error cancelling transfer:', error);
        setError(utils.handleError(error));
      }
    }
  };

  const handleCompleteTransfer = async (id) => {
    if (window.confirm('Mark this transfer as completed? This will update account balances.')) {
      try {
        await moneyTransferAPI.completeTransfer(id);
        fetchData();
        setSuccess('Transfer completed successfully');
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        console.error('Error completing transfer:', error);
        setError(utils.handleError(error));
      }
    }
  };

  const getAccountName = (transfer) => {
    const fromAccount = transfer.from_us_account 
      ? accounts.us.find(a => a.id === transfer.from_us_account)
      : accounts.kenya.find(a => a.id === transfer.from_kenya_account);
    
    const toAccount = transfer.to_us_account 
      ? accounts.us.find(a => a.id === transfer.to_us_account)
      : accounts.kenya.find(a => a.id === transfer.to_kenya_account);
    
    return {
      from: fromAccount?.account_name || 'Unknown Account',
      to: toAccount?.account_name || 'External Account',
      fromCurrency: transfer.from_us_account ? 'USD' : 'KES',
      toCurrency: transfer.to_us_account ? 'USD' : 'KES',
    };
  };

  const getTransferAmount = (transfer) => {
    const isCrossCountry = (transfer.from_us_account && transfer.to_kenya_account) || 
                          (transfer.from_kenya_account && transfer.to_us_account);
    
    if (!isCrossCountry) {
      return {
        from: transfer.amount,
        to: transfer.amount - transfer.fee,
      };
    }
    
    // Calculate converted amount for cross-country transfers
    if (transfer.from_us_account && transfer.to_kenya_account) {
      return {
        from: transfer.amount,
        to: (transfer.amount - transfer.fee) * transfer.exchange_rate,
      };
    } else {
      return {
        from: transfer.amount,
        to: (transfer.amount - transfer.fee) / transfer.exchange_rate,
      };
    }
  };

  const getTransferStats = () => {
    const completed = transfers.filter(t => t.status === 'completed').length;
    const pending = transfers.filter(t => t.status === 'pending').length;
    const totalTransferred = transfers
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalFees = transfers
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + parseFloat(t.fee || 0), 0);
    
    return { completed, pending, totalTransferred, totalFees };
  };

  const formatTransferDate = (date) => {
    const transferDate = new Date(date);
    if (isToday(transferDate)) return 'Today';
    if (isYesterday(transferDate)) return 'Yesterday';
    return format(transferDate, 'MMM dd, yyyy');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const stats = getTransferStats();
  const pendingTransfers = transfers.filter(t => t.status === 'pending');
  const completedTransfers = transfers.filter(t => t.status === 'completed');

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Money Transfers</Typography>
        <Button
          variant="contained"
          startIcon={<TransferIcon />}
          onClick={() => setOpenTransferDialog(true)}
        >
          New Transfer
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed Transfers
              </Typography>
              <Typography variant="h5" component="h2">
                {stats.completed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Transfers
              </Typography>
              <Typography variant="h5" component="h2" color="warning.main">
                {stats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Transferred
              </Typography>
              <Typography variant="h5" component="h2">
                {utils.formatCurrency(stats.totalTransferred)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Fees
              </Typography>
              <Typography variant="h5" component="h2">
                {utils.formatCurrency(stats.totalFees)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`Pending (${pendingTransfers.length})`} />
          <Tab label={`History (${completedTransfers.length})`} />
          <Tab label="All Transfers" />
        </Tabs>

        {/* Pending Transfers Tab */}
        <TabPanel value={tabValue} index={0}>
          {pendingTransfers.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No pending transfers
              </Typography>
            </Paper>
          ) : (
            <List>
              {pendingTransfers.map((transfer) => {
                const accountNames = getAccountName(transfer);
                const amounts = getTransferAmount(transfer);
                
                return (
                  <React.Fragment key={transfer.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          <TransferIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">{accountNames.from}</Typography>
                            <ArrowForwardIcon fontSize="small" />
                            <Typography variant="body1">{accountNames.to}</Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {utils.formatCurrency(amounts.from, accountNames.fromCurrency)} → 
                              {utils.formatCurrency(amounts.to, accountNames.toCurrency)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Scheduled: {formatTransferDate(transfer.scheduled_date)}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Complete Transfer">
                          <IconButton 
                            edge="end" 
                            color="success"
                            onClick={() => handleCompleteTransfer(transfer.id)}
                            sx={{ mr: 1 }}
                          >
                            <CheckIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel Transfer">
                          <IconButton 
                            edge="end" 
                            color="error"
                            onClick={() => handleCancelTransfer(transfer.id)}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </TabPanel>

        {/* History Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Fee</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {completedTransfers.map((transfer) => {
                  const accountNames = getAccountName(transfer);
                  const amounts = getTransferAmount(transfer);
                  const status = transferStatuses[transfer.status];
                  
                  return (
                    <TableRow key={transfer.id}>
                      <TableCell>{formatTransferDate(transfer.scheduled_date)}</TableCell>
                      <TableCell>{accountNames.from}</TableCell>
                      <TableCell>{accountNames.to}</TableCell>
                      <TableCell align="right">
                        {utils.formatCurrency(amounts.from, accountNames.fromCurrency)}
                      </TableCell>
                      <TableCell align="right">
                        {utils.formatCurrency(transfer.fee || 0, accountNames.fromCurrency)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={status.label}
                          color={status.color}
                          icon={status.icon}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small"
                          onClick={() => {
                            setSelectedTransfer(transfer);
                            setOpenDetailsDialog(true);
                          }}
                        >
                          <HistoryIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* All Transfers Tab */}
        <TabPanel value={tabValue} index={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>From → To</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transfers.map((transfer) => {
                  const accountNames = getAccountName(transfer);
                  const amounts = getTransferAmount(transfer);
                  const status = transferStatuses[transfer.status];
                  
                  return (
                    <TableRow key={transfer.id}>
                      <TableCell>{formatTransferDate(transfer.scheduled_date)}</TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={transfer.transfer_type === 'internal' ? 'Internal' : 'External'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {accountNames.from} → {accountNames.to}
                      </TableCell>
                      <TableCell align="right">
                        {utils.formatCurrency(transfer.amount, accountNames.fromCurrency)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={status.label}
                          color={status.color}
                          icon={status.icon}
                        />
                      </TableCell>
                      <TableCell>{transfer.notes || '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* New Transfer Dialog */}
      <Dialog 
        open={openTransferDialog} 
        onClose={() => setOpenTransferDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Create New Transfer
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {/* Step 1: Source Account */}
            <Step>
              <StepLabel>Select Source Account</StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        select
                        label="Account Type"
                        value={transferFormData.from_account_type}
                        onChange={(e) => setTransferFormData({ 
                          ...transferFormData, 
                          from_account_type: e.target.value,
                          from_account_id: '',
                        })}
                        fullWidth
                      >
                        <MenuItem value="us">US Account</MenuItem>
                        <MenuItem value="kenya">Kenya Account</MenuItem>
                      </TextField>
                    </Grid>
                    {transferFormData.from_account_type && (
                      <Grid item xs={12}>
                        <TextField
                          select
                          label="Select Account"
                          value={transferFormData.from_account_id}
                          onChange={(e) => setTransferFormData({ 
                            ...transferFormData, 
                            from_account_id: e.target.value 
                          })}
                          fullWidth
                        >
                          {accounts[transferFormData.from_account_type].map((account) => (
                            <MenuItem key={account.id} value={account.id}>
                              {account.account_name} - {
                                transferFormData.from_account_type === 'us' 
                                  ? utils.formatCurrency(account.balance, 'USD')
                                  : utils.formatCurrency(account.balance_kes, 'KES')
                              }
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                    )}
                  </Grid>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!validateStep(0)}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Continue
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 2: Destination Account */}
            <Step>
              <StepLabel>Select Destination</StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        select
                        label="Transfer Type"
                        value={transferFormData.transfer_type}
                        onChange={(e) => setTransferFormData({ 
                          ...transferFormData, 
                          transfer_type: e.target.value 
                        })}
                        fullWidth
                      >
                        {transferTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    {transferFormData.transfer_type === 'internal' && (
                      <>
                        <Grid item xs={12}>
                          <TextField
                            select
                            label="Destination Account Type"
                            value={transferFormData.to_account_type}
                            onChange={(e) => setTransferFormData({ 
                              ...transferFormData, 
                              to_account_type: e.target.value,
                              to_account_id: '',
                            })}
                            fullWidth
                          >
                            <MenuItem value="us">US Account</MenuItem>
                            <MenuItem value="kenya">Kenya Account</MenuItem>
                          </TextField>
                        </Grid>
                        {transferFormData.to_account_type && (
                          <Grid item xs={12}>
                            <TextField
                              select
                              label="Select Account"
                              value={transferFormData.to_account_id}
                              onChange={(e) => setTransferFormData({ 
                                ...transferFormData, 
                                to_account_id: e.target.value 
                              })}
                              fullWidth
                            >
                              {accounts[transferFormData.to_account_type]
                                .filter(acc => {
                                  // Don't show the source account as destination
                                  if (transferFormData.from_account_type === transferFormData.to_account_type) {
                                    return acc.id !== parseInt(transferFormData.from_account_id);
                                  }
                                  return true;
                                })
                                .map((account) => (
                                  <MenuItem key={account.id} value={account.id}>
                                    {account.account_name}
                                  </MenuItem>
                                ))}
                            </TextField>
                          </Grid>
                        )}
                      </>
                    )}
                  </Grid>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!validateStep(1)}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Continue
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 3: Transfer Details */}
            <Step>
              <StepLabel>Enter Transfer Details</StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Amount"
                        type="number"
                        value={transferFormData.amount}
                        onChange={(e) => setTransferFormData({ 
                          ...transferFormData, 
                          amount: e.target.value 
                        })}
                        fullWidth
                        InputProps={{
                          startAdornment: <InputAdornment position="start">
                            {transferFormData.from_account_type === 'us' ? '$' : 'KES'}
                          </InputAdornment>,
                        }}
                        inputProps={{ step: "0.01", min: "0" }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Transfer Fee"
                        type="number"
                        value={transferFormData.fee}
                        onChange={(e) => setTransferFormData({ 
                          ...transferFormData, 
                          fee: e.target.value 
                        })}
                        fullWidth
                        InputProps={{
                          startAdornment: <InputAdornment position="start">
                            {transferFormData.from_account_type === 'us' ? '$' : 'KES'}
                          </InputAdornment>,
                        }}
                        inputProps={{ step: "0.01", min: "0" }}
                      />
                    </Grid>
                    {transferFormData.from_account_type !== transferFormData.to_account_type && (
                      <Grid item xs={12}>
                        <TextField
                          label="Exchange Rate (1 USD = ? KES)"
                          type="number"
                          value={transferFormData.exchange_rate}
                          onChange={(e) => setTransferFormData({ 
                            ...transferFormData, 
                            exchange_rate: e.target.value 
                          })}
                          fullWidth
                          InputProps={{
                            startAdornment: <InputAdornment position="start">1 USD =</InputAdornment>,
                            endAdornment: <InputAdornment position="end">KES</InputAdornment>,
                          }}
                          inputProps={{ step: "0.01", min: "0" }}
                        />
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <TextField
                        label="Scheduled Date"
                        type="date"
                        value={transferFormData.scheduled_date}
                        onChange={(e) => setTransferFormData({ 
                          ...transferFormData, 
                          scheduled_date: e.target.value 
                        })}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Notes (Optional)"
                        value={transferFormData.notes}
                        onChange={(e) => setTransferFormData({ 
                          ...transferFormData, 
                          notes: e.target.value 
                        })}
                        fullWidth
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </Grid>

                  {/* Transfer Summary */}
                  {transferFormData.amount && (
                    <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.100' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Transfer Summary
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">Amount to Send:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            {utils.formatCurrency(
                              transferFormData.amount, 
                              transferFormData.from_account_type === 'us' ? 'USD' : 'KES'
                            )}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">Transfer Fee:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            {utils.formatCurrency(
                              transferFormData.fee || 0, 
                              transferFormData.from_account_type === 'us' ? 'USD' : 'KES'
                            )}
                          </Typography>
                        </Grid>
                        {transferFormData.from_account_type !== transferFormData.to_account_type && (
                          <>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary">Exchange Rate:</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                1 USD = {transferFormData.exchange_rate} KES
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary">Amount to Receive:</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" fontWeight="bold">
                                {(() => {
                                  const amounts = {
                                    amount: parseFloat(transferFormData.amount) || 0,
                                    fee: parseFloat(transferFormData.fee) || 0,
                                    rate: parseFloat(transferFormData.exchange_rate) || 1,
                                  };
                                  const netAmount = amounts.amount - amounts.fee;
                                  
                                  if (transferFormData.from_account_type === 'us') {
                                    return utils.formatCurrency(netAmount * amounts.rate, 'KES');
                                  } else {
                                    return utils.formatCurrency(netAmount / amounts.rate, 'USD');
                                  }
                                })()}
                              </Typography>
                            </Grid>
                          </>
                        )}
                      </Grid>
                    </Paper>
                  )}
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!validateStep(2)}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Review
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 4: Confirm */}
            <Step>
              <StepLabel>Review and Confirm</StepLabel>
              <StepContent>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Transfer Details
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="From Account"
                        secondary={
                          accounts[transferFormData.from_account_type]?.find(
                            a => a.id === parseInt(transferFormData.from_account_id)
                          )?.account_name || 'Unknown'
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="To Account"
                        secondary={
                          transferFormData.transfer_type === 'internal'
                            ? accounts[transferFormData.to_account_type]?.find(
                                a => a.id === parseInt(transferFormData.to_account_id)
                              )?.account_name || 'Unknown'
                            : 'External Account'
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Amount"
                        secondary={utils.formatCurrency(
                          transferFormData.amount,
                          transferFormData.from_account_type === 'us' ? 'USD' : 'KES'
                        )}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Scheduled Date"
                        secondary={formatTransferDate(transferFormData.scheduled_date)}
                      />
                    </ListItem>
                  </List>
                </Paper>
                <Box sx={{ mb: 2 }}>
                  <Button
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmitTransfer}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Confirm Transfer
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>
      </Dialog>

      {/* Transfer Details Dialog */}
      <Dialog 
        open={openDetailsDialog} 
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Transfer Details
        </DialogTitle>
        <DialogContent>
          {selectedTransfer && (
            <Box sx={{ mt: 2 }}>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Transfer ID"
                    secondary={`#${selectedTransfer.id}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Status"
                    secondary={
                      <Chip
                        size="small"
                        label={transferStatuses[selectedTransfer.status].label}
                        color={transferStatuses[selectedTransfer.status].color}
                        icon={transferStatuses[selectedTransfer.status].icon}
                      />
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Created"
                    secondary={format(new Date(selectedTransfer.created_at), 'PPpp')}
                  />
                </ListItem>
                {selectedTransfer.completed_at && (
                  <ListItem>
                    <ListItemText 
                      primary="Completed"
                      secondary={format(new Date(selectedTransfer.completed_at), 'PPpp')}
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemText 
                    primary="Exchange Rate"
                    secondary={`1 USD = ${selectedTransfer.exchange_rate} KES`}
                  />
                </ListItem>
                {selectedTransfer.notes && (
                  <ListItem>
                    <ListItemText 
                      primary="Notes"
                      secondary={selectedTransfer.notes}
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MoneyTransfer;