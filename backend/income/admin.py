from django.contrib import admin
from .models import Income

@admin.register(Income)
class IncomeAdmin(admin.ModelAdmin):
    list_display = ['source', 'amount', 'currency', 'frequency', 'status', 'date', 'deposit_time', 'user', 'created_at']
    list_filter = ['currency', 'frequency', 'status', 'date', 'created_at']
    search_fields = ['source']
    date_hierarchy = 'date'
    ordering = ['-date', '-created_at']
    list_per_page = 20
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)