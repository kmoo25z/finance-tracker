from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from datetime import datetime, date
from .models import CalendarEvent
from .serializers import CalendarEventSerializer

class CalendarEventViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarEventSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = CalendarEvent.objects.filter(user=self.request.user)
        
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date and end_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                
                # Get regular events in range
                regular_events = queryset.filter(
                    is_recurring=False,
                    date__gte=start,
                    date__lte=end
                )
                
                # Get recurring events that might have occurrences in range
                recurring_events = queryset.filter(
                    is_recurring=True,
                    date__lte=end  # Started before or during the range
                ).filter(
                    Q(recurrence_end_date__isnull=True) | 
                    Q(recurrence_end_date__gte=start)  # Hasn't ended before the range
                )
                
                # Combine queries
                queryset = regular_events | recurring_events
                
            except ValueError:
                pass
        
        return queryset.distinct()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming events for the next 30 days"""
        today = date.today()
        end_date = today + timedelta(days=30)
        
        events = self.get_queryset().filter(
            Q(is_recurring=False, date__gte=today, date__lte=end_date) |
            Q(is_recurring=True, date__lte=end_date)
        ).filter(
            Q(recurrence_end_date__isnull=True) | 
            Q(recurrence_end_date__gte=today)
        )
        
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def monthly_summary(self, request):
        """Get summary of events for a specific month"""
        month = request.query_params.get('month', None)
        year = request.query_params.get('year', None)
        
        if not month or not year:
            today = date.today()
            month = today.month
            year = today.year
        else:
            month = int(month)
            year = int(year)
        
        # Calculate month boundaries
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)
        
        # Get events for the month
        events = self.get_queryset().filter(
            Q(is_recurring=False, date__gte=start_date, date__lte=end_date) |
            Q(is_recurring=True)
        )
        
        # Calculate summary
        bill_total = sum(
            float(event.amount or 0) 
            for event in events 
            if event.event_type == 'bill'
        )
        
        income_total = sum(
            float(event.amount or 0) 
            for event in events 
            if event.event_type == 'payday'
        )
        
        return Response({
            'month': month,
            'year': year,
            'total_events': events.count(),
            'bill_total': bill_total,
            'income_total': income_total,
            'net_expected': income_total - bill_total,
        })