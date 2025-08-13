from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Income
from .serializers import IncomeSerializer
from transaction.models import Transaction

class IncomeViewSet(viewsets.ModelViewSet):
    serializer_class = IncomeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Income.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get income that will be deposited in the next 10 days"""
        today = timezone.now().date()
        ten_days_later = today + timedelta(days=10)
        
        upcoming_income = self.get_queryset().filter(
            status='pending',
            date__gte=today,
            date__lte=ten_days_later
        )
        
        serializer = self.get_serializer(upcoming_income, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_deposited(self, request, pk=None):
        """Mark income as deposited and create a corresponding transaction"""
        income = self.get_object()
        
        if income.status == 'deposited':
            return Response(
                {'error': 'Income already deposited'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update income status
        income.status = 'deposited'
        income.save()
        
        # Create corresponding transaction
        Transaction.objects.create(
            user=income.user,
            transaction_type='income',
            amount=income.amount,
            currency=income.currency,
            date=timezone.now().date(),
            description=f"Income from {income.source}",
            us_account=income.us_account,
            kenya_account=income.kenya_account
        )
        
        serializer = self.get_serializer(income)
        return Response({
            'message': 'Income marked as deposited and transaction created',
            'income': serializer.data
        })