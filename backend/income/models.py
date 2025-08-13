from django.db import models
from django.contrib.auth.models import User
from accounts.models import USAccount, KenyaAccount

class Income(models.Model):
    FREQUENCY_CHOICES = [
        ('once', 'One Time'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('biweekly', 'Bi-Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('annually', 'Annually'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('deposited', 'Deposited'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='incomes')
    source = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, choices=[('USD', 'USD'), ('KES', 'KES')], default='USD')
    date = models.DateField()
    deposit_time = models.TimeField(null=True, blank=True)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='once')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Account relationships
    us_account = models.ForeignKey(USAccount, on_delete=models.SET_NULL, null=True, blank=True)
    kenya_account = models.ForeignKey(KenyaAccount, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f"{self.source} - {self.amount} {self.currency} ({self.status})"