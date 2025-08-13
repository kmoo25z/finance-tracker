from rest_framework import serializers
from .models import Debt, DebtPayment

class DebtPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = DebtPayment
        fields = [
            'id', 'debt', 'payment_date', 'amount', 
            'principal_payment', 'interest_payment', 
            'remaining_balance', 'created_at'
        ]
        read_only_fields = ['principal_payment', 'interest_payment', 'remaining_balance', 'created_at']

class DebtSerializer(serializers.ModelSerializer):
    payments = DebtPaymentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Debt
        fields = [
            'id', 'name', 'debt_type', 'principal_amount', 
            'interest_rate', 'term_months', 'start_date', 
            'current_balance', 'monthly_payment', 'payments',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['monthly_payment', 'created_at', 'updated_at']