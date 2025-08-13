from django.contrib import admin
from .models import Category, Budget, BudgetAlert

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'category_type', 'parent_category', 'icon', 'color', 'is_active', 'user']
    list_filter = ['category_type', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['category_type', 'name']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)

@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'amount', 'period', 'spent_percentage', 'is_active', 'user']
    list_filter = ['period', 'is_active', 'created_at']
    search_fields = ['name', 'notes']
    date_hierarchy = 'start_date'
    
    def spent_percentage(self, obj):
        return f"{obj.spent_percentage}%"
    spent_percentage.short_description = 'Spent %'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)

@admin.register(BudgetAlert)
class BudgetAlertAdmin(admin.ModelAdmin):
    list_display = ['budget', 'alert_date', 'percentage_reached', 'amount_spent', 'is_read']
    list_filter = ['is_read', 'alert_date']
    date_hierarchy = 'alert_date'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(budget__user=request.user)