from rest_framework import serializers
from .models import USAccount, KenyaAccount

class USAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = USAccount
        fields = ['id', 'account_name', 'account_number', 'balance', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class KenyaAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = KenyaAccount
        fields = ['id', 'account_name', 'account_number', 'balance_kes', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']