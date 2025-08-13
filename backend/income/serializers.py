from rest_framework import serializers
from .models import Income
from accounts.models import USAccount, KenyaAccount

class IncomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Income
        fields = [
            'id', 'source', 'amount', 'currency', 'date', 'deposit_time',
            'frequency', 'status', 'us_account', 'kenya_account',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, data):
        # Ensure only one account is selected based on currency
        if data.get('currency') == 'USD' and data.get('kenya_account'):
            raise serializers.ValidationError(
                "USD income should be linked to a US account, not a Kenya account."
            )
        if data.get('currency') == 'KES' and data.get('us_account'):
            raise serializers.ValidationError(
                "KES income should be linked to a Kenya account, not a US account."
            )
        return data