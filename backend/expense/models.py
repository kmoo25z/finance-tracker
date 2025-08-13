from django.db import models
from django.contrib.auth.models import User

class Expense(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100, blank=True, null=True)  # Keep old field
    category_fk = models.ForeignKey(  # New field with different name
        'categories.Category', 
        on_delete=models.SET_NULL, 
        null=True,
        blank=True,
        related_name='expenses'
    )
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.description} - ${self.amount}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Check budgets after saving expense
        from categories.models import Budget, BudgetAlert
        
        # Check overall budget
        overall_budgets = Budget.objects.filter(
            user=self.user,
            category__isnull=True,
            is_active=True
        )
        
        # Check category-specific budgets
        if self.category_fk:
            category_budgets = Budget.objects.filter(
                user=self.user,
                category=self.category_fk,
                is_active=True
            )
            overall_budgets = overall_budgets | category_budgets
        
        for budget in overall_budgets:
            if budget.is_near_limit:
                # Check if alert already exists for this period
                start_date, end_date = budget.get_current_period_dates()
                existing_alert = budget.alerts.filter(
                    alert_date__date__gte=start_date,
                    alert_date__date__lte=end_date
                ).exists()
                
                if not existing_alert:
                    BudgetAlert.objects.create(
                        budget=budget,
                        percentage_reached=budget.spent_percentage,
                        amount_spent=budget.spent_amount,
                        message=f"Budget '{budget.name}' has reached {budget.spent_percentage}% of the limit after expense: {self.description}"
                    )