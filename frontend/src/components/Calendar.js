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
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Badge,
  Tooltip,
  Avatar,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  AttachMoney as MoneyIcon,
  AccountBalance as BankIcon,
  Receipt as BillIcon,
  TrendingUp as InvestmentIcon,
  Celebration as CelebrationIcon,
  Notifications as ReminderIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  CalendarMonth as CalendarIcon,
  Schedule as ScheduleIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { calendarAPI, utils } from '../services/api';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  isPast,
  isFuture,
  parseISO,
} from 'date-fns';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openEventDialog, setOpenEventDialog] = useState(false);
  const [openDayDialog, setOpenDayDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'list'
  
  const [eventFormData, setEventFormData] = useState({
    title: '',
    event_type: 'general',
    date: new Date().toISOString().split('T')[0],
    time: '',
    amount: '',
    description: '',
    is_recurring: false,
    recurrence_pattern: 'monthly',
    reminder: true,
    reminder_days_before: 1,
  });

  const eventTypes = [
    { value: 'general', label: 'General', color: '#2196F3', icon: <EventIcon /> },
    { value: 'bill', label: 'Bill Payment', color: '#F44336', icon: <BillIcon /> },
    { value: 'payday', label: 'Payday', color: '#4CAF50', icon: <MoneyIcon /> },
    { value: 'investment', label: 'Investment', color: '#FF9800', icon: <InvestmentIcon /> },
    { value: 'transfer', label: 'Transfer', color: '#9C27B0', icon: <BankIcon /> },
    { value: 'celebration', label: 'Celebration', color: '#E91E63', icon: <CelebrationIcon /> },
    { value: 'reminder', label: 'Reminder', color: '#00BCD4', icon: <ReminderIcon /> },
  ];

  const recurrencePatterns = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch events for the current month view
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      
      const response = await calendarAPI.getEvents({
        start_date: format(start, 'yyyy-MM-dd'),
        end_date: format(end, 'yyyy-MM-dd'),
      });
      
      setEvents(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError(utils.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setOpenDayDialog(true);
  };

  const handleAddEvent = (date = null) => {
    setEditingEvent(null);
    setEventFormData({
      title: '',
      event_type: 'general',
      date: date ? format(date, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
      time: '',
      amount: '',
      description: '',
      is_recurring: false,
      recurrence_pattern: 'monthly',
      reminder: true,
      reminder_days_before: 1,
    });
    setOpenEventDialog(true);
    if (date) setOpenDayDialog(false);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setEventFormData({
      title: event.title,
      event_type: event.event_type,
      date: event.date,
      time: event.time || '',
      amount: event.amount || '',
      description: event.description || '',
      is_recurring: event.is_recurring,
      recurrence_pattern: event.recurrence_pattern || 'monthly',
      reminder: event.reminder,
      reminder_days_before: event.reminder_days_before || 1,
    });
    setOpenEventDialog(true);
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await calendarAPI.deleteEvent(id);
        fetchEvents();
        setOpenDayDialog(false);
      } catch (error) {
        console.error('Error deleting event:', error);
        setError(utils.handleError(error));
      }
    }
  };

  const handleSubmitEvent = async () => {
    try {
      const dataToSubmit = {
        ...eventFormData,
        amount: eventFormData.amount ? parseFloat(eventFormData.amount) : null,
        reminder_days_before: parseInt(eventFormData.reminder_days_before),
      };

      if (editingEvent) {
        await calendarAPI.updateEvent(editingEvent.id, dataToSubmit);
      } else {
        await calendarAPI.createEvent(dataToSubmit);
      }

      setOpenEventDialog(false);
      setEditingEvent(null);
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      setError(utils.handleError(error));
    }
  };

  const renderCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const days = [];
    let day = startDate;
    
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    
    return days;
  };

  const getDayEvents = (date) => {
    return events.filter(event => isSameDay(parseISO(event.date), date));
  };

  const getEventTypeConfig = (type) => {
    return eventTypes.find(t => t.value === type) || eventTypes[0];
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    return events
      .filter(event => !isPast(parseISO(event.date)) || isSameDay(parseISO(event.date), today))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 10);
  };

  const getMonthlyStats = () => {
    const monthEvents = events.filter(event => 
      isSameMonth(parseISO(event.date), currentDate)
    );
    
    const billsTotal = monthEvents
      .filter(e => e.event_type === 'bill' && e.amount)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    const incomeTotal = monthEvents
      .filter(e => e.event_type === 'payday' && e.amount)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    return {
      totalEvents: monthEvents.length,
      bills: billsTotal,
      income: incomeTotal,
      net: incomeTotal - billsTotal,
    };
  };

  if (loading && events.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const calendarDays = renderCalendarDays();
  const upcomingEvents = getUpcomingEvents();
  const monthStats = getMonthlyStats();

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Calendar</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={viewMode === 'month' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('month')}
            startIcon={<CalendarIcon />}
          >
            Month
          </Button>
          <Button
            variant={viewMode === 'list' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('list')}
            startIcon={<ScheduleIcon />}
          >
            List
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleAddEvent()}
          >
            Add Event
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Monthly Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Events This Month
              </Typography>
              <Typography variant="h5" component="h2">
                {monthStats.totalEvents}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Expected Income
              </Typography>
              <Typography variant="h5" component="h2" color="success.main">
                {utils.formatCurrency(monthStats.income)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Upcoming Bills
              </Typography>
              <Typography variant="h5" component="h2" color="error.main">
                {utils.formatCurrency(monthStats.bills)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Net Expected
              </Typography>
              <Typography 
                variant="h5" 
                component="h2" 
                color={monthStats.net >= 0 ? 'success.main' : 'error.main'}
              >
                {utils.formatCurrency(monthStats.net)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Calendar View */}
        <Grid item xs={12} md={viewMode === 'month' ? 8 : 12}>
          {viewMode === 'month' ? (
            <Paper sx={{ p: 2 }}>
              {/* Calendar Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <IconButton onClick={handlePreviousMonth}>
                  <ChevronLeftIcon />
                </IconButton>
                <Typography variant="h5">
                  {format(currentDate, 'MMMM yyyy')}
                </Typography>
                <IconButton onClick={handleNextMonth}>
                  <ChevronRightIcon />
                </IconButton>
              </Box>
              
              <Button 
                size="small" 
                startIcon={<TodayIcon />} 
                onClick={handleToday}
                sx={{ mb: 2 }}
              >
                Today
              </Button>

              {/* Day Headers */}
              <Grid container>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <Grid item xs key={day} sx={{ textAlign: 'center', py: 1 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      {day}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ mb: 1 }} />

              {/* Calendar Days */}
              <Grid container>
                {calendarDays.map((day, index) => {
                  const dayEvents = getDayEvents(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isTodays = isToday(day);
                  
                  return (
                    <Grid 
                      item 
                      xs={12/7} 
                      key={index}
                      sx={{ 
                        aspectRatio: '1',
                        border: '1px solid #e0e0e0',
                        p: 0.5,
                        cursor: 'pointer',
                        bgcolor: !isCurrentMonth ? 'grey.50' : isTodays ? 'primary.50' : 'transparent',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                      onClick={() => handleDateClick(day)}
                    >
                      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: isTodays ? 'bold' : 'normal',
                            color: !isCurrentMonth ? 'text.disabled' : 'text.primary',
                          }}
                        >
                          {format(day, 'd')}
                        </Typography>
                        
                        {/* Event Dots */}
                        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                          {dayEvents.slice(0, 3).map((event, i) => {
                            const eventType = getEventTypeConfig(event.event_type);
                            return (
                              <Box
                                key={i}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  mb: 0.25,
                                }}
                              >
                                <CircleIcon 
                                  sx={{ 
                                    fontSize: 8, 
                                    color: eventType.color 
                                  }} 
                                />
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    fontSize: '0.65rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {event.title}
                                </Typography>
                              </Box>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                              +{dayEvents.length - 3} more
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          ) : (
            /* List View */
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                All Events - {format(currentDate, 'MMMM yyyy')}
              </Typography>
              <List>
                {events.length === 0 ? (
                  <ListItem>
                    <ListItemText 
                      primary="No events this month"
                      secondary="Click the Add Event button to create one"
                    />
                  </ListItem>
                ) : (
                  events.map((event) => {
                    const eventType = getEventTypeConfig(event.event_type);
                    const eventDate = parseISO(event.date);
                    
                    return (
                      <React.Fragment key={event.id}>
                        <ListItem>
                          <ListItemIcon>
                            <Avatar sx={{ bgcolor: eventType.color }}>
                              {eventType.icon}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1">{event.title}</Typography>
                                {event.is_recurring && (
                                  <Chip size="small" label="Recurring" />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="textSecondary">
                                  {format(eventDate, 'EEEE, MMMM d')}
                                  {event.time && ` at ${event.time}`}
                                </Typography>
                                {event.amount && (
                                  <Typography variant="body2" color="textSecondary">
                                    Amount: {utils.formatCurrency(event.amount)}
                                  </Typography>
                                )}
                                {event.description && (
                                  <Typography variant="body2" color="textSecondary">
                                    {event.description}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton edge="end" onClick={() => handleEditEvent(event)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton edge="end" onClick={() => handleDeleteEvent(event.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </React.Fragment>
                    );
                  })
                )}
              </List>
            </Paper>
          )}
        </Grid>

        {/* Upcoming Events Sidebar */}
        {viewMode === 'month' && (
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Upcoming Events
              </Typography>
              <List dense>
                {upcomingEvents.length === 0 ? (
                  <ListItem>
                    <ListItemText 
                      primary="No upcoming events"
                      secondary="Your schedule is clear!"
                    />
                  </ListItem>
                ) : (
                  upcomingEvents.map((event) => {
                    const eventType = getEventTypeConfig(event.event_type);
                    const eventDate = parseISO(event.date);
                    const isOverdue = isPast(eventDate) && !isToday(eventDate);
                    
                    return (
                      <ListItem key={event.id} button onClick={() => handleEditEvent(event)}>
                        <ListItemIcon>
                          <Badge 
                            color={isOverdue ? 'error' : 'default'}
                            variant="dot"
                            invisible={!isOverdue}
                          >
                            <Avatar sx={{ bgcolor: eventType.color, width: 32, height: 32 }}>
                              {eventType.icon}
                            </Avatar>
                          </Badge>
                        </ListItemIcon>
                        <ListItemText
                          primary={event.title}
                          secondary={
                            <Typography variant="caption" color={isOverdue ? 'error' : 'textSecondary'}>
                              {isToday(eventDate) 
                                ? 'Today' 
                                : format(eventDate, 'MMM d')}
                              {event.time && ` at ${event.time}`}
                              {event.amount && ` • ${utils.formatCurrency(event.amount)}`}
                            </Typography>
                          }
                        />
                      </ListItem>
                    );
                  })
                )}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Add/Edit Event Dialog */}
      <Dialog open={openEventDialog} onClose={() => setOpenEventDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingEvent ? 'Edit Event' : 'Add New Event'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Event Title"
              value={eventFormData.title}
              onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              select
              label="Event Type"
              value={eventFormData.event_type}
              onChange={(e) => setEventFormData({ ...eventFormData, event_type: e.target.value })}
              fullWidth
            >
              {eventTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {type.icon}
                    {type.label}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
            
            <Grid container spacing={2}>
              <Grid item xs={8}>
                <TextField
                  label="Date"
                  type="date"
                  value={eventFormData.date}
                  onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Time"
                  type="time"
                  value={eventFormData.time}
                  onChange={(e) => setEventFormData({ ...eventFormData, time: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            
            {(eventFormData.event_type === 'bill' || 
              eventFormData.event_type === 'payday' || 
              eventFormData.event_type === 'investment') && (
              <TextField
                label="Amount"
                type="number"
                value={eventFormData.amount}
                onChange={(e) => setEventFormData({ ...eventFormData, amount: e.target.value })}
                fullWidth
                InputProps={{
                  startAdornment: <Chip label="$" size="small" />,
                }}
                inputProps={{ step: "0.01", min: "0" }}
              />
            )}
            
            <TextField
              label="Description"
              value={eventFormData.description}
              onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={eventFormData.is_recurring}
                  onChange={(e) => setEventFormData({ ...eventFormData, is_recurring: e.target.checked })}
                />
              }
              label="Recurring Event"
            />
            
            {eventFormData.is_recurring && (
              <TextField
                select
                label="Recurrence Pattern"
                value={eventFormData.recurrence_pattern}
                onChange={(e) => setEventFormData({ ...eventFormData, recurrence_pattern: e.target.value })}
                fullWidth
              >
                {recurrencePatterns.map((pattern) => (
                  <MenuItem key={pattern.value} value={pattern.value}>
                    {pattern.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
            
            <FormControlLabel
              control={
                <Switch
                  checked={eventFormData.reminder}
                  onChange={(e) => setEventFormData({ ...eventFormData, reminder: e.target.checked })}
                />
              }
              label="Set Reminder"
            />
            
            {eventFormData.reminder && (
              <TextField
                label="Remind me (days before)"
                type="number"
                value={eventFormData.reminder_days_before}
                onChange={(e) => setEventFormData({ ...eventFormData, reminder_days_before: e.target.value })}
                fullWidth
                inputProps={{ min: "0", max: "30" }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEventDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitEvent} 
            variant="contained" 
            disabled={!eventFormData.title || !eventFormData.date}
          >
            {editingEvent ? 'Update' : 'Create'} Event
          </Button>
        </DialogActions>
      </Dialog>

      {/* Day Events Dialog */}
      <Dialog open={openDayDialog} onClose={() => setOpenDayDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => handleAddEvent(selectedDate)}
              fullWidth
              sx={{ mb: 2 }}
            >
              Add Event on This Day
            </Button>
            
            <List>
              {selectedDate && getDayEvents(selectedDate).length === 0 ? (
                <ListItem>
                  <ListItemText 
                    primary="No events scheduled"
                    secondary="Click above to add an event"
                  />
                </ListItem>
              ) : (
                selectedDate && getDayEvents(selectedDate).map((event) => {
                  const eventType = getEventTypeConfig(event.event_type);
                  
                  return (
                    <React.Fragment key={event.id}>
                      <ListItem>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: eventType.color }}>
                            {eventType.icon}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={event.title}
                          secondary={
                            <Box>
                              {event.time && (
                                <Typography variant="body2" color="textSecondary">
                                  Time: {event.time}
                                </Typography>
                              )}
                              {event.amount && (
                                <Typography variant="body2" color="textSecondary">
                                  Amount: {utils.formatCurrency(event.amount)}
                                </Typography>
                              )}
                              {event.description && (
                                <Typography variant="body2" color="textSecondary">
                                  {event.description}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => handleEditEvent(event)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton edge="end" onClick={() => handleDeleteEvent(event.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  );
                })
              )}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDayDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Calendar;
    