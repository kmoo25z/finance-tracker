from rest_framework import serializers
from .models import MoneyTransfer

class MoneyTransferSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoneyTransfer
        fields = [
            'id', 'transfer_type', 'from_us_account', 'from_kenya_account',
            'to_us_account', 'to_kenya_account', 'amount', 'exchange_rate',
            'fee', 'status', 'scheduled_date', 'completed_at', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['completed_at', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Ensure valid source and destination accounts"""
        # Check that exactly one source account is set
        from_accounts = [data.get('from_us_account'), data.get('from_kenya_account')]
        if sum(1 for acc in from_accounts if acc is not None) != 1:
            raise serializers.ValidationError("Exactly one source account must be specified")
        
        # Check that at most one destination account is set (can be external)
        to_accounts = [data.get('to_us_account'), data.get('to_kenya_account')]
        if sum(1 for acc in to_accounts if acc is not None) > 1:
            raise serializers.ValidationError("At most one destination account can be specified")
        
        # For internal transfers, destination is required
        if data.get('transfer_type') == 'internal' and not any(to_accounts):
            raise serializers.ValidationError("Destination account is required for internal transfers")
        
        # Can't transfer to the same account
        if data.get('from_us_account') == data.get('to_us_account'):
            raise serializers.ValidationError("Cannot transfer to the same account")
        if data.get('from_kenya_account') == data.get('to_kenya_account'):
            raise serializers.ValidationError("Cannot transfer to the same account")
        
        return data