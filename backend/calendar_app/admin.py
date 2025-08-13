
from django.contrib import admin
from .models import CalendarEvent

@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ['title', 'event_type', 'date', 'time', 'amount', 'is_recurring']
    list_filter = ['event_type', 'is_recurring', 'date']
    search_fields = ['title', 'description']
    date_hierarchy = 'date'
    ordering = ['date', 'time']
    fieldsets = (
        (None, {
            'fields': ('title', 'event_type', 'description', 'date', 'time', 'amount')
        }),
        ('Recurrence', {
            'fields': ('is_recurring', 'recurrence_pattern', 'recurrence_end_date'),
            'classes': ('collapse',)
        }),
        ('Reminder', {
            'fields': ('reminder', 'reminder_days_before'),
            'classes': ('collapse',)
        }),
    )