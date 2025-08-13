from django.contrib import admin
from .models import Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['description', 'transaction_type', 'amount', 'date', 'user', 'created_at']
    list_filter = ['transaction_type', 'date', 'created_at']
    search_fields = ['description']
    date_hierarchy = 'date'
    ordering = ['-date', '-created_at']
    list_per_page = 20
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)