from rest_framework import serializers
from .models import CalendarEvent

class CalendarEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarEvent
        fields = [
            'id', 'title', 'event_type', 'date', 'time', 'amount',
            'description', 'is_recurring', 'recurrence_pattern',
            'recurrence_end_date', 'reminder', 'reminder_days_before',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']