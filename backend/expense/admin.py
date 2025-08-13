from django.contrib import admin
from .models import Expense

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['description', 'amount', 'category', 'date', 'user', 'created_at']
    list_filter = ['category', 'date', 'created_at']
    search_fields = ['description', 'category']
    date_hierarchy = 'date'
    ordering = ['-date', '-created_at']
    list_per_page = 20
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)