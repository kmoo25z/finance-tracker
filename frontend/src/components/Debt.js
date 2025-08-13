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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Collapse,
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
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Payment as PaymentIcon,
  Calculate as CalculateIcon,
  CreditCard as CreditCardIcon,
  Home as HomeIcon,
  DirectionsCar as CarIcon,
  School as SchoolIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { debtAPI, utils } from '../services/api';
import { format, addMonths, differenceInMonths } from 'date-fns';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`debt-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Debt = () => {
  const [tabValue, setTabValue] = useState(0);
  const [debts, setDebts] = useState([]);
  const [payments, setPayments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDebtDialog, setOpenDebtDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [expandedDebt, setExpandedDebt] = useState(null);
  const [amortizationSchedules, setAmortizationSchedules] = useState({});
  
  const [debtFormData, setDebtFormData] = useState({
    name: '',
    debt_type: 'loan',
    principal_amount: '',
    interest_rate: '',
    term_months: '',
    start_date: new Date().toISOString().split('T')[0],
    current_balance: '',
  });

  const [paymentFormData, setPaymentFormData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
  });

  const debtTypes = [
    { value: 'loan', label: 'Personal Loan', icon: <MoneyIcon /> },
    { value: 'credit_card', label: 'Credit Card', icon: <CreditCardIcon /> },
    { value: 'mortgage', label: 'Mortgage', icon: <HomeIcon /> },
    { value: 'auto', label: 'Auto Loan', icon: <CarIcon /> },
    { value: 'student', label: 'Student Loan', icon: <SchoolIcon /> },
    { value: 'other', label: 'Other', icon: <MoneyIcon /> },
  ];

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await debtAPI.getDebts();
      const debtsData = Array.isArray(response.data) ? response.data : [];
      setDebts(debtsData);
      
      // Fetch payments for each debt
      const paymentsData = {};
      for (const debt of debtsData) {
        try {
          const paymentRes = await debtAPI.getPayments(debt.id);
          paymentsData[debt.id] = Array.isArray(paymentRes.data) ? paymentRes.data : [];
        } catch (error) {
          console.error(`Error fetching payments for debt ${debt.id}:`, error);
          paymentsData[debt.id] = [];
        }
      }
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching debts:', error);
      setError(utils.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchAmortizationSchedule = async (debtId) => {
    try {
      const response = await debtAPI.getAmortizationSchedule(debtId);
      setAmortizationSchedules(prev => ({
        ...prev,
        [debtId]: response.data
      }));
    } catch (error) {
      console.error('Error fetching amortization schedule:', error);
    }
  };

  const handleEditDebt = (debt) => {
    setEditingDebt(debt);
    setDebtFormData({
      name: debt.name,
      debt_type: debt.debt_type,
      principal_amount: debt.principal_amount,
      interest_rate: debt.interest_rate,
      term_months: debt.term_months,
      start_date: debt.start_date,
      current_balance: debt.current_balance,
    });
    setOpenDebtDialog(true);
  };

  const handleDeleteDebt = async (id) => {
    if (window.confirm('Are you sure you want to delete this debt? All payment history will be lost.')) {
      try {
        await debtAPI.deleteDebt(id);
        fetchDebts();
      } catch (error) {
        console.error('Error deleting debt:', error);
        setError(utils.handleError(error));
      }
    }
  };

  const handleSubmitDebt = async () => {
    try {
      const dataToSubmit = {
        ...debtFormData,
        principal_amount: parseFloat(debtFormData.principal_amount),
        interest_rate: parseFloat(debtFormData.interest_rate),
        term_months: parseInt(debtFormData.term_months),
        current_balance: parseFloat(debtFormData.current_balance || debtFormData.principal_amount),
      };

      if (editingDebt) {
        await debtAPI.updateDebt(editingDebt.id, dataToSubmit);
      } else {
        await debtAPI.createDebt(dataToSubmit);
      }

      setOpenDebtDialog(false);
      setEditingDebt(null);
      resetDebtForm();
      fetchDebts();
    } catch (error) {
      console.error('Error saving debt:', error);
      setError(utils.handleError(error));
    }
  };

  const handleMakePayment = (debt) => {
    setSelectedDebt(debt);
    setPaymentFormData({
      payment_date: new Date().toISOString().split('T')[0],
      amount: debt.monthly_payment || '',
    });
    setOpenPaymentDialog(true);
  };

  const handleSubmitPayment = async () => {
    try {
      const paymentData = {
        debt: selectedDebt.id,
        payment_date: paymentFormData.payment_date,
        amount: parseFloat(paymentFormData.amount),
      };

      await debtAPI.createPayment(paymentData);
      
      setOpenPaymentDialog(false);
      setSelectedDebt(null);
      setPaymentFormData({
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
      });
      
      fetchDebts();
    } catch (error) {
      console.error('Error making payment:', error);
      setError(utils.handleError(error));
    }
  };

  const resetDebtForm = () => {
    setDebtFormData({
      name: '',
      debt_type: 'loan',
      principal_amount: '',
      interest_rate: '',
      term_months: '',
      start_date: new Date().toISOString().split('T')[0],
      current_balance: '',
    });
  };

  const calculateMonthlyPayment = (principal, rate, months) => {
    if (!principal || !rate || !months) return 0;
    
    const monthlyRate = rate / 100 / 12;
    if (monthlyRate === 0) return principal / months;
    
    const payment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
      (Math.pow(1 + monthlyRate, months) - 1);
    
    return payment;
  };

  const getDebtProgress = (debt) => {
    const totalPaid = debt.principal_amount - debt.current_balance;
    return (totalPaid / debt.principal_amount) * 100;
  };

  const getDebtStats = () => {
    const totalDebt = debts.reduce((sum, debt) => sum + parseFloat(debt.current_balance || 0), 0);
    const totalOriginal = debts.reduce((sum, debt) => sum + parseFloat(debt.principal_amount || 0), 0);
    const totalPaid = totalOriginal - totalDebt;
    const monthlyPayments = debts.reduce((sum, debt) => sum + parseFloat(debt.monthly_payment || 0), 0);
    const activeDebts = debts.filter(debt => debt.current_balance > 0).length;
    const paidOffDebts = debts.filter(debt => debt.current_balance <= 0).length;
    
    return {
      totalDebt,
      totalOriginal,
      totalPaid,
      monthlyPayments,
      activeDebts,
      paidOffDebts,
    };
  };

  const toggleExpanded = async (debtId) => {
    if (expandedDebt === debtId) {
      setExpandedDebt(null);
    } else {
      setExpandedDebt(debtId);
      if (!amortizationSchedules[debtId]) {
        await fetchAmortizationSchedule(debtId);
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const stats = getDebtStats();

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Debt Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingDebt(null);
            resetDebtForm();
            setOpenDebtDialog(true);
          }}
        >
          Add Debt
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Debt
              </Typography>
              <Typography variant="h5" component="h2" color="error.main">
                {utils.formatCurrency(stats.totalDebt)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Paid
              </Typography>
              <Typography variant="h5" component="h2" color="success.main">
                {utils.formatCurrency(stats.totalPaid)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Monthly Payments
              </Typography>
              <Typography variant="h5" component="h2">
                {utils.formatCurrency(stats.monthlyPayments)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Active Debts
              </Typography>
              <Typography variant="h5" component="h2">
                {stats.activeDebts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Paid Off
              </Typography>
              <Typography variant="h5" component="h2" color="success.main">
                {stats.paidOffDebts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Progress
              </Typography>
              <Typography variant="h5" component="h2">
                {stats.totalOriginal > 0 ? 
                  `${((stats.totalPaid / stats.totalOriginal) * 100).toFixed(0)}%` : 
                  '0%'
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Active Debts" />
          <Tab label="Payment History" />
          <Tab label="All Debts" />
        </Tabs>

        {/* Active Debts Tab */}
        <TabPanel value={tabValue} index={0}>
          {debts.filter(debt => debt.current_balance > 0).length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No active debts. Great job!
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {debts.filter(debt => debt.current_balance > 0).map((debt) => {
                const progress = getDebtProgress(debt);
                const debtType = debtTypes.find(t => t.value === debt.debt_type);
                const monthsRemaining = Math.ceil(debt.current_balance / debt.monthly_payment);
                
                return (
                  <Grid item xs={12} key={debt.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {debtType?.icon}
                            <Box>
                              <Typography variant="h6">{debt.name}</Typography>
                              <Typography variant="body2" color="textSecondary">
                                {debtType?.label} • {debt.interest_rate}% APR
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h5" color="error.main">
                              {utils.formatCurrency(debt.current_balance)}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              of {utils.formatCurrency(debt.principal_amount)}
                            </Typography>
                          </Box>
                        </Box>

                        <LinearProgress 
                          variant="determinate" 
                          value={progress} 
                          sx={{ height: 10, borderRadius: 5, mb: 2 }}
                          color={progress >= 75 ? 'success' : 'primary'}
                        />

                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="textSecondary">Monthly Payment</Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {utils.formatCurrency(debt.monthly_payment)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="textSecondary">Start Date</Typography>
                            <Typography variant="body1">
                              {format(new Date(debt.start_date), 'MMM yyyy')}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="textSecondary">Term</Typography>
                            <Typography variant="body1">
                              {debt.term_months} months
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="textSecondary">Est. Payoff</Typography>
                            <Typography variant="body1">
                              ~{monthsRemaining} months
                            </Typography>
                          </Grid>
                        </Grid>

                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Button
                            size="small"
                            onClick={() => toggleExpanded(debt.id)}
                            endIcon={expandedDebt === debt.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          >
                            {expandedDebt === debt.id ? 'Hide' : 'Show'} Amortization
                          </Button>
                          <Box>
                            <Tooltip title="Make Payment">
                              <IconButton color="primary" onClick={() => handleMakePayment(debt)}>
                                <PaymentIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton onClick={() => handleEditDebt(debt)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton color="error" onClick={() => handleDeleteDebt(debt.id)}>
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>

                        {/* Amortization Schedule */}
                        <Collapse in={expandedDebt === debt.id}>
                          <Box sx={{ mt: 2 }}>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="subtitle2" gutterBottom>
                              Amortization Schedule
                            </Typography>
                            {amortizationSchedules[debt.id] ? (
                              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                                <Table size="small" stickyHeader>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Payment #</TableCell>
                                      <TableCell>Date</TableCell>
                                      <TableCell align="right">Payment</TableCell>
                                      <TableCell align="right">Principal</TableCell>
                                      <TableCell align="right">Interest</TableCell>
                                      <TableCell align="right">Balance</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {amortizationSchedules[debt.id].map((payment, index) => (
                                      <TableRow key={index}>
                                        <TableCell>{payment.payment_number}</TableCell>
                                        <TableCell>{format(new Date(payment.date), 'MMM yyyy')}</TableCell>
                                        <TableCell align="right">
                                          {utils.formatCurrency(payment.payment_amount)}
                                        </TableCell>
                                        <TableCell align="right">
                                          {utils.formatCurrency(payment.principal_payment)}
                                        </TableCell>
                                        <TableCell align="right">
                                          {utils.formatCurrency(payment.interest_payment)}
                                        </TableCell>
                                        <TableCell align="right">
                                          {utils.formatCurrency(payment.remaining_balance)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            ) : (
                              <CircularProgress size={24} />
                            )}
                          </Box>
                        </Collapse>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </TabPanel>

        {/* Payment History Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Debt</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Principal</TableCell>
                  <TableCell align="right">Interest</TableCell>
                  <TableCell align="right">Remaining Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(payments).flatMap(([debtId, debtPayments]) => {
                  const debt = debts.find(d => d.id === parseInt(debtId));
                  return debtPayments.map(payment => ({
                    ...payment,
                    debtName: debt?.name || 'Unknown',
                  }));
                })
                .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
                .map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{format(new Date(payment.payment_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{payment.debtName}</TableCell>
                    <TableCell align="right">{utils.formatCurrency(payment.amount)}</TableCell>
                    <TableCell align="right">{utils.formatCurrency(payment.principal_payment)}</TableCell>
                    <TableCell align="right">{utils.formatCurrency(payment.interest_payment)}</TableCell>
                    <TableCell align="right">{utils.formatCurrency(payment.remaining_balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* All Debts Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {debts.map((debt) => {
              const progress = getDebtProgress(debt);
              const debtType = debtTypes.find(t => t.value === debt.debt_type);
              const isPaidOff = debt.current_balance <= 0;
              
              return (
                <Grid item xs={12} sm={6} md={4} key={debt.id}>
                  <Card sx={{ opacity: isPaidOff ? 0.7 : 1 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {debtType?.icon}
                          <Typography variant="h6">{debt.name}</Typography>
                        </Box>
                        {isPaidOff && (
                          <Chip 
                            icon={<CheckCircleIcon />} 
                            label="Paid Off" 
                            color="success" 
                            size="small" 
                          />
                        )}
                      </Box>
                      
                      <Typography variant="h4" color={isPaidOff ? 'success.main' : 'error.main'}>
                        {utils.formatCurrency(debt.current_balance)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        of {utils.formatCurrency(debt.principal_amount)}
                      </Typography>
                      
                      <LinearProgress 
                        variant="determinate" 
                        value={progress} 
                        sx={{ mb: 2 }}
                        color={isPaidOff ? 'success' : 'primary'}
                      />
                      
                      <Typography variant="body2" color="textSecondary">
                        {debt.interest_rate}% APR • {debt.term_months} months
                      </Typography>
                    </CardContent>
                    <CardActions>
                      {!isPaidOff && (
                        <Button size="small" onClick={() => handleMakePayment(debt)}>
                          Make Payment
                        </Button>
                      )}
                      <IconButton size="small" onClick={() => handleEditDebt(debt)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteDebt(debt.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </TabPanel>
      </Paper>

      {/* Add/Edit Debt Dialog */}
      <Dialog open={openDebtDialog} onClose={() => setOpenDebtDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDebt ? 'Edit Debt' : 'Add New Debt'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Debt Name"
              value={debtFormData.name}
              onChange={(e) => setDebtFormData({ ...debtFormData, name: e.target.value })}
              fullWidth
              required
              placeholder="e.g., Chase Credit Card, Car Loan"
            />
            
            <TextField
              select
              label="Debt Type"
              value={debtFormData.debt_type}
              onChange={(e) => setDebtFormData({ ...debtFormData, debt_type: e.target.value })}
              fullWidth
            >
              {debtTypes.map((type) => (
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
                  label="Principal Amount"
                  type="number"
                  value={debtFormData.principal_amount}
                  onChange={(e) => setDebtFormData({ ...debtFormData, principal_amount: e.target.value })}
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
                  label="Current Balance"
                  type="number"
                  value={debtFormData.current_balance}
                  onChange={(e) => setDebtFormData({ ...debtFormData, current_balance: e.target.value })}
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  inputProps={{ step: "0.01", min: "0" }}
                  helperText="Leave blank if same as principal"
                />
              </Grid>
            </Grid>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Interest Rate (%)"
                  type="number"
                  value={debtFormData.interest_rate}
                  onChange={(e) => setDebtFormData({ ...debtFormData, interest_rate: e.target.value })}
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{ step: "0.01", min: "0", max: "100" }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Term (Months)"
                  type="number"
                  value={debtFormData.term_months}
                  onChange={(e) => setDebtFormData({ ...debtFormData, term_months: e.target.value })}
                  fullWidth
                  required
                  inputProps={{ min: "1" }}
                />
              </Grid>
            </Grid>
            
            <TextField
              label="Start Date"
              type="date"
              value={debtFormData.start_date}
              onChange={(e) => setDebtFormData({ ...debtFormData, start_date: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            
            {debtFormData.principal_amount && debtFormData.interest_rate && debtFormData.term_months && (
              <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CalculateIcon color="primary" />
                  <Typography variant="subtitle2">Calculated Monthly Payment</Typography>
                </Box>
                <Typography variant="h5" color="primary">
                  {utils.formatCurrency(
                    calculateMonthlyPayment(
                      parseFloat(debtFormData.principal_amount),
                      parseFloat(debtFormData.interest_rate),
                      parseInt(debtFormData.term_months)
                    )
                  )}
                </Typography>
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDebtDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitDebt} 
            variant="contained" 
            disabled={!debtFormData.name || !debtFormData.principal_amount || !debtFormData.interest_rate || !debtFormData.term_months}
          >
            {editingDebt ? 'Update' : 'Add'} Debt
          </Button>
        </DialogActions>
      </Dialog>

      {/* Make Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Make Payment
        </DialogTitle>
        <DialogContent>
          {selectedDebt && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {selectedDebt.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Current Balance: {utils.formatCurrency(selectedDebt.current_balance)}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Monthly Payment: {utils.formatCurrency(selectedDebt.monthly_payment)}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
                <TextField
                  label="Payment Date"
                  type="date"
                  value={paymentFormData.payment_date}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_date: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                
                <TextField
                  label="Payment Amount"
                  type="number"
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  inputProps={{ step: "0.01", min: "0" }}
                  helperText="You can pay more than the minimum to pay off faster"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitPayment} 
            variant="contained" 
            disabled={!paymentFormData.amount || parseFloat(paymentFormData.amount) <= 0}
            startIcon={<PaymentIcon />}
          >
            Make Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Debt;