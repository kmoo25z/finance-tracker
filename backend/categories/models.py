from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import datetime
from django.db.models import Sum

class Category(models.Model):
    CATEGORY_TYPES = [
        ('expense', 'Expense'),
        ('income', 'Income'),
        ('both', 'Both'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    category_type = models.CharField(max_length=10, choices=CATEGORY_TYPES, default='expense')
    icon = models.CharField(max_length=50, blank=True, help_text="Icon name from Material-UI")
    color = models.CharField(max_length=7, default='#2196F3', help_text="Hex color code")
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    parent_category = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='subcategories'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        unique_together = ['user', 'name', 'category_type']
        verbose_name_plural = 'Categories'
    
    def __str__(self):
        if self.parent_category:
            return f"{self.parent_category.name} > {self.name}"
        return self.name
    
    @property
    def full_path(self):
        if self.parent_category:
            return f"{self.parent_category.name} > {self.name}"
        return self.name


class Budget(models.Model):
    BUDGET_PERIODS = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    name = models.CharField(max_length=200)
    category = models.ForeignKey(
        Category, 
        on_delete=models.CASCADE, 
        related_name='budgets',
        null=True,
        blank=True,
        help_text="Leave blank for overall budget"
    )
    amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    period = models.CharField(max_length=20, choices=BUDGET_PERIODS, default='monthly')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True, help_text="Leave blank for ongoing budget")
    is_active = models.BooleanField(default=True)
    alert_threshold = models.IntegerField(
        default=80,
        help_text="Alert when spending reaches this percentage",
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_active', '-start_date']
        unique_together = ['user', 'category', 'period', 'start_date']
    
    def __str__(self):
        if self.category:
            return f"{self.name} - {self.category.name} ({self.get_period_display()})"
        return f"{self.name} - Overall ({self.get_period_display()})"
    
    def get_current_period_dates(self):
        """Get start and end dates for the current budget period"""
        today = timezone.now().date()
        
        if self.period == 'daily':
            return today, today
        elif self.period == 'weekly':
            start = today - timezone.timedelta(days=today.weekday())
            end = start + timezone.timedelta(days=6)
            return start, end
        elif self.period == 'monthly':
            start = today.replace(day=1)
            if today.month == 12:
                end = today.replace(year=today.year + 1, month=1, day=1) - timezone.timedelta(days=1)
            else:
                end = today.replace(month=today.month + 1, day=1) - timezone.timedelta(days=1)
            return start, end
        elif self.period == 'quarterly':
            quarter = (today.month - 1) // 3
            start = today.replace(month=quarter * 3 + 1, day=1)
            end_month = quarter * 3 + 3
            if end_month > 12:
                end = today.replace(year=today.year + 1, month=1, day=1) - timezone.timedelta(days=1)
            else:
                end = today.replace(month=end_month + 1, day=1) - timezone.timedelta(days=1)
            return start, end
        elif self.period == 'yearly':
            start = today.replace(month=1, day=1)
            end = today.replace(month=12, day=31)
            return start, end
    
    def get_spent_amount(self):
        """Calculate amount spent in current period"""
        from expense.models import Expense
        
        start_date, end_date = self.get_current_period_dates()
        
        query = Expense.objects.filter(
            user=self.user,
            date__gte=start_date,
            date__lte=end_date
        )
        
        if self.category:
            # Check both old text field and new FK field
            query = query.filter(
                models.Q(category=self.category.name) | 
                models.Q(category_fk=self.category)
            )
        
        return query.aggregate(total=Sum('amount'))['total'] or 0
    
    @property
    def spent_amount(self):
        return self.get_spent_amount()
    
    @property
    def remaining_amount(self):
        return float(self.amount) - float(self.spent_amount)
    
    @property
    def spent_percentage(self):
        if self.amount == 0:
            return 0
        return round((float(self.spent_amount) / float(self.amount)) * 100, 2)
    
    @property
    def is_over_budget(self):
        return self.spent_amount > float(self.amount)
    
    @property
    def is_near_limit(self):
        return self.spent_percentage >= self.alert_threshold


class BudgetAlert(models.Model):
    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='alerts')
    alert_date = models.DateTimeField(auto_now_add=True)
    percentage_reached = models.DecimalField(max_digits=5, decimal_places=2)
    amount_spent = models.DecimalField(max_digits=12, decimal_places=2)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-alert_date']
    
    def __str__(self):
        return f"Alert for {self.budget.name} - {self.percentage_reached}%"