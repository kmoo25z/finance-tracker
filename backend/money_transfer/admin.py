from django.contrib import admin
from .models import MoneyTransfer

@admin.register(MoneyTransfer)
class MoneyTransferAdmin(admin.ModelAdmin):
    list_display = ['get_from_account', 'get_to_account', 'amount', 'status', 'scheduled_date']
    list_filter = ['status', 'transfer_type', 'scheduled_date']
    search_fields = ['notes']
    date_hierarchy = 'scheduled_date'
    ordering = ['-scheduled_date', '-created_at']
    
    def get_from_account(self, obj):
        if obj.from_us_account:
            return f"US: {obj.from_us_account.account_name}"
        elif obj.from_kenya_account:
            return f"KE: {obj.from_kenya_account.account_name}"
        return "-"
    get_from_account.short_description = 'From Account'
    
    def get_to_account(self, obj):
        if obj.to_us_account:
            return f"US: {obj.to_us_account.account_name}"
        elif obj.to_kenya_account:
            return f"KE: {obj.to_kenya_account.account_name}"
        return "External"
    get_to_account.short_description = 'To Account'