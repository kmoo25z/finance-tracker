from django.db import models
from django.contrib.auth.models import User
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from dateutil.rrule import rrule, DAILY, WEEKLY, MONTHLY, YEARLY

class CalendarEvent(models.Model):
    EVENT_TYPES = [
        ('general', 'General'),
        ('bill', 'Bill Payment'),
        ('payday', 'Payday'),
        ('investment', 'Investment'),
        ('transfer', 'Transfer'),
        ('celebration', 'Celebration'),
        ('reminder', 'Reminder'),
    ]
    
    RECURRENCE_PATTERNS = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('biweekly', 'Bi-weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='calendar_events')
    title = models.CharField(max_length=200)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES, default='general')
    date = models.DateField()
    time = models.TimeField(null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    description = models.TextField(blank=True)
    
    # Recurrence fields
    is_recurring = models.BooleanField(default=False)
    recurrence_pattern = models.CharField(max_length=20, choices=RECURRENCE_PATTERNS, null=True, blank=True)
    recurrence_end_date = models.DateField(null=True, blank=True)
    
    # Reminder fields
    reminder = models.BooleanField(default=True)
    reminder_days_before = models.IntegerField(default=1)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['date', 'time']
    
    def get_occurrences(self, start_date, end_date):
        """Get all occurrences of this event between start_date and end_date"""
        if not self.is_recurring:
            if start_date <= self.date <= end_date:
                return [self.date]
            return []
        
        # Map recurrence patterns to rrule frequencies
        freq_map = {
            'daily': DAILY,
            'weekly': WEEKLY,
            'monthly': MONTHLY,
            'yearly': YEARLY,
        }
        
        if self.recurrence_pattern == 'biweekly':
            freq = WEEKLY
            interval = 2
        elif self.recurrence_pattern == 'quarterly':
            freq = MONTHLY
            interval = 3
        else:
            freq = freq_map.get(self.recurrence_pattern, MONTHLY)
            interval = 1
        
        # Generate occurrences
        until = self.recurrence_end_date or end_date
        occurrences = list(rrule(
            freq=freq,
            interval=interval,
            dtstart=self.date,
            until=min(until, end_date)
        ))
        
        # Filter to only include dates within the requested range
        return [occ.date() for occ in occurrences if start_date <= occ.date() <= end_date]
    
    def __str__(self):
        return f"{self.title} - {self.date}"


class EventReminder(models.Model):
    """Track sent reminders to avoid duplicates"""
    event = models.ForeignKey(CalendarEvent, on_delete=models.CASCADE, related_name='sent_reminders')
    reminder_date = models.DateField()
    sent_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['event', 'reminder_date']