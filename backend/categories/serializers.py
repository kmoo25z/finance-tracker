from rest_framework import serializers
from .models import Category, Budget, BudgetAlert

class CategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()
    full_path = serializers.ReadOnlyField()
    has_subcategories = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'category_type', 'icon', 'color', 
            'description', 'is_active', 'parent_category', 
            'subcategories', 'full_path', 'has_subcategories',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_subcategories(self, obj):
        if obj.subcategories.exists():
            return CategorySerializer(obj.subcategories.all(), many=True).data
        return []
    
    def get_has_subcategories(self, obj):
        return obj.subcategories.exists()


class BudgetAlertSerializer(serializers.ModelSerializer):
    budget_name = serializers.CharField(source='budget.name', read_only=True)
    
    class Meta:
        model = BudgetAlert
        fields = [
            'id', 'budget', 'budget_name', 'alert_date', 
            'percentage_reached', 'amount_spent', 'message', 'is_read'
        ]
        read_only_fields = ['alert_date']


class BudgetSerializer(serializers.ModelSerializer):
    spent_amount = serializers.ReadOnlyField()
    remaining_amount = serializers.ReadOnlyField()
    spent_percentage = serializers.ReadOnlyField()
    is_over_budget = serializers.ReadOnlyField()
    is_near_limit = serializers.ReadOnlyField()
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    recent_alerts = serializers.SerializerMethodField()
    
    class Meta:
        model = Budget
        fields = [
            'id', 'name', 'category', 'category_name', 'amount', 
            'period', 'start_date', 'end_date', 'is_active',
            'alert_threshold', 'notes', 'spent_amount', 'remaining_amount',
            'spent_percentage', 'is_over_budget', 'is_near_limit',
            'recent_alerts', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_recent_alerts(self, obj):
        recent_alerts = obj.alerts.filter(is_read=False)[:3]
        return BudgetAlertSerializer(recent_alerts, many=True).data