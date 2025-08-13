from django.db import models
from django.contrib.auth.models import User
from accounts.models import USAccount, KenyaAccount

class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
        ('transfer', 'Transfer'),
    ]
    
    CURRENCY_CHOICES = [
        ('USD', 'US Dollar'),
        ('KES', 'Kenya Shilling'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='USD')
    date = models.DateField()
    description = models.TextField()
    budget_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Account relationships
    us_account = models.ForeignKey(USAccount, on_delete=models.SET_NULL, null=True, blank=True)
    kenya_account = models.ForeignKey(KenyaAccount, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.transaction_type} - {self.amount} {self.currency} - {self.date}"