from rest_framework import serializers
from .models import Expense
from categories.models import Category

class ExpenseSerializer(serializers.ModelSerializer):
    category_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = Expense
        fields = ['id', 'description', 'amount', 'category', 'category_fk', 'category_detail', 'date', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_category_detail(self, obj):
        if obj.category_fk:
            return {
                'id': obj.category_fk.id,
                'name': obj.category_fk.name,
                'color': obj.category_fk.color,
                'icon': obj.category_fk.icon
            }
        return None