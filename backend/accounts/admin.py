from django.contrib import admin
from .models import USAccount, KenyaAccount

@admin.register(USAccount)
class USAccountAdmin(admin.ModelAdmin):
    list_display = ['account_name', 'balance', 'created_at']
    search_fields = ['account_name', 'account_number']
    ordering = ['account_name']

@admin.register(KenyaAccount)
class KenyaAccountAdmin(admin.ModelAdmin):
    list_display = ['account_name', 'balance_kes', 'created_at']
    search_fields = ['account_name', 'account_number']
    ordering = ['account_name']