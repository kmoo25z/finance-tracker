from django.db import models
from django.contrib.auth.models import User

class USAccount(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='us_accounts')
    account_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=50, blank=True)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.account_name} - ${self.balance}"

class KenyaAccount(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='kenya_accounts')
    account_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=50, blank=True)
    balance_kes = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.account_name} - KES {self.balance_kes}"