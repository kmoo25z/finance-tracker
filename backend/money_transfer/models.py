from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from accounts.models import USAccount, KenyaAccount
from decimal import Decimal

class MoneyTransfer(models.Model):
    TRANSFER_TYPES = [
        ('internal', 'Internal Transfer'),
        ('external', 'External Transfer'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='money_transfers')
    transfer_type = models.CharField(max_length=20, choices=TRANSFER_TYPES, default='internal')
    
    # Source accounts (one of these will be set)
    from_us_account = models.ForeignKey(USAccount, on_delete=models.SET_NULL, null=True, blank=True, related_name='transfers_from')
    from_kenya_account = models.ForeignKey(KenyaAccount, on_delete=models.SET_NULL, null=True, blank=True, related_name='transfers_from')
    
    # Destination accounts (one of these will be set)
    to_us_account = models.ForeignKey(USAccount, on_delete=models.SET_NULL, null=True, blank=True, related_name='transfers_to')
    to_kenya_account = models.ForeignKey(KenyaAccount, on_delete=models.SET_NULL, null=True, blank=True, related_name='transfers_to')
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    exchange_rate = models.DecimalField(max_digits=10, decimal_places=4, default=1.0)
    fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    scheduled_date = models.DateField()
    completed_at = models.DateTimeField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-scheduled_date', '-created_at']
    
    def complete_transfer(self):
        """Execute the transfer and update account balances"""
        if self.status != 'pending':
            raise ValueError("Only pending transfers can be completed")
        
        try:
            # Deduct from source account
            if self.from_us_account:
                self.from_us_account.balance -= self.amount
                self.from_us_account.save()
            elif self.from_kenya_account:
                self.from_kenya_account.balance_kes -= self.amount
                self.from_kenya_account.save()
            
            # Add to destination account (considering exchange rate)
            net_amount = self.amount - self.fee
            
            if self.to_us_account:
                if self.from_kenya_account:  # KES to USD
                    converted_amount = net_amount / self.exchange_rate
                else:  # USD to USD
                    converted_amount = net_amount
                self.to_us_account.balance += converted_amount
                self.to_us_account.save()
            elif self.to_kenya_account:
                if self.from_us_account:  # USD to KES
                    converted_amount = net_amount * self.exchange_rate
                else:  # KES to KES
                    converted_amount = net_amount
                self.to_kenya_account.balance_kes += converted_amount
                self.to_kenya_account.save()
            
            self.status = 'completed'
            self.completed_at = timezone.now()
            self.save()
            
        except Exception as e:
            self.status = 'failed'
            self.save()
            raise e
    
    def __str__(self):
        from_acc = self.from_us_account or self.from_kenya_account
        to_acc = self.to_us_account or self.to_kenya_account or "External"
        return f"{from_acc} → {to_acc} - {self.amount}"