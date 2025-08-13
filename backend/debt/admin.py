from django.contrib import admin
from .models import Debt, DebtPayment

@admin.register(Debt)
class DebtAdmin(admin.ModelAdmin):
    list_display = ['name', 'debt_type', 'principal_amount', 'current_balance', 'interest_rate', 'monthly_payment', 'user', 'created_at']
    list_filter = ['debt_type', 'start_date', 'created_at']
    search_fields = ['name']
    date_hierarchy = 'start_date'
    ordering = ['-created_at']
    list_per_page = 20
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)

@admin.register(DebtPayment)
class DebtPaymentAdmin(admin.ModelAdmin):
    list_display = ['debt', 'amount', 'payment_date', 'created_at']
    list_filter = ['payment_date', 'created_at']
    search_fields = ['debt__name', 'notes']
    date_hierarchy = 'payment_date'
    ordering = ['-payment_date']
    list_per_page = 20
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(debt__user=request.user)