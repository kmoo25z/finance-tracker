from rest_framework import serializers
from .models import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_type', 'amount', 'currency', 'date', 
            'description', 'budget_percentage', 'us_account', 'kenya_account',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']