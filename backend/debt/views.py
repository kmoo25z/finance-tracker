from django.shortcuts import render

# Create your views here.

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import datetime
from dateutil.relativedelta import relativedelta
from decimal import Decimal
from .models import Debt, DebtPayment
from .serializers import DebtSerializer, DebtPaymentSerializer

class DebtViewSet(viewsets.ModelViewSet):
    serializer_class = DebtSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Debt.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['get'])
    def amortization_schedule(self, request, pk=None):
        """Generate amortization schedule for a debt"""
        debt = self.get_object()
        
        schedule = []
        balance = debt.principal_amount
        monthly_rate = debt.interest_rate / Decimal('100') / Decimal('12')
        payment_date = debt.start_date
        
        for i in range(1, debt.term_months + 1):
            if monthly_rate > 0:
                interest_payment = round(balance * monthly_rate, 2)
            else:
                interest_payment = 0
            
            principal_payment = debt.monthly_payment - interest_payment
            
            # Adjust last payment if needed
            if principal_payment > balance:
                principal_payment = balance
                
            balance -= principal_payment
            
            schedule.append({
                'payment_number': i,
                'date': payment_date.isoformat(),
                'payment_amount': float(debt.monthly_payment),
                'principal_payment': float(principal_payment),
                'interest_payment': float(interest_payment),
                'remaining_balance': float(max(balance, 0))
            })
            
            payment_date += relativedelta(months=1)
            
            if balance <= 0:
                break
        
        return Response(schedule)

class DebtPaymentViewSet(viewsets.ModelViewSet):
    serializer_class = DebtPaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = DebtPayment.objects.filter(debt__user=self.request.user)
        debt_id = self.request.query_params.get('debt', None)
        if debt_id is not None:
            queryset = queryset.filter(debt_id=debt_id)
        return queryset
    
    def perform_create(self, serializer):
        # Verify the debt belongs to the user
        debt = serializer.validated_data['debt']
        if debt.user != self.request.user:
            raise PermissionDenied("You can only make payments on your own debts")
        serializer.save()