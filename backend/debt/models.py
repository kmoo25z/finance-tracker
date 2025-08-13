from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal
from dateutil.relativedelta import relativedelta

class Debt(models.Model):
    DEBT_TYPES = [
        ('loan', 'Personal Loan'),
        ('credit_card', 'Credit Card'),
        ('mortgage', 'Mortgage'),
        ('auto', 'Auto Loan'),
        ('student', 'Student Loan'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='debts')
    name = models.CharField(max_length=200)
    debt_type = models.CharField(max_length=20, choices=DEBT_TYPES, default='loan')
    principal_amount = models.DecimalField(max_digits=12, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)  # Annual percentage
    term_months = models.IntegerField()
    start_date = models.DateField()
    current_balance = models.DecimalField(max_digits=12, decimal_places=2)
    monthly_payment = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-current_balance', '-created_at']
    
    def calculate_monthly_payment(self):
        """Calculate monthly payment using amortization formula"""
        if self.interest_rate == 0:
            return self.principal_amount / self.term_months
        
        monthly_rate = self.interest_rate / Decimal('100') / Decimal('12')
        payment = (self.principal_amount * monthly_rate * (1 + monthly_rate) ** self.term_months) / \
                  ((1 + monthly_rate) ** self.term_months - 1)
        return round(payment, 2)
    
    def save(self, *args, **kwargs):
        if not self.monthly_payment:
            self.monthly_payment = self.calculate_monthly_payment()
        if not self.current_balance:
            self.current_balance = self.principal_amount
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} - {self.current_balance}"


class DebtPayment(models.Model):
    debt = models.ForeignKey(Debt, on_delete=models.CASCADE, related_name='payments')
    payment_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    principal_payment = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    interest_payment = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    remaining_balance = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-payment_date', '-created_at']
    
    def save(self, *args, **kwargs):
        if not self.principal_payment or not self.interest_payment:
            # Calculate interest for the period
            monthly_rate = self.debt.interest_rate / Decimal('100') / Decimal('12')
            self.interest_payment = round(self.debt.current_balance * monthly_rate, 2)
            self.principal_payment = self.amount - self.interest_payment
            
        # Update remaining balance
        self.remaining_balance = self.debt.current_balance - self.principal_payment
        
        super().save(*args, **kwargs)
        
        # Update debt's current balance
        self.debt.current_balance = self.remaining_balance
        self.debt.save()
    
    def __str__(self):
        return f"{self.debt.name} - {self.payment_date} - {self.amount}"