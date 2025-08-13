from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from .models import Transaction
from .serializers import TransactionSerializer

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get transaction summary statistics"""
        transactions = self.get_queryset()
        
        summary = {
            'total_income': transactions.filter(transaction_type='income').aggregate(Sum('amount'))['amount__sum'] or 0,
            'total_expenses': transactions.filter(transaction_type='expense').aggregate(Sum('amount'))['amount__sum'] or 0,
            'total_transfers': transactions.filter(transaction_type='transfer').aggregate(Sum('amount'))['amount__sum'] or 0,
            'net_amount': 0
        }
        
        summary['net_amount'] = summary['total_income'] - summary['total_expenses']
        
        return Response(summary)