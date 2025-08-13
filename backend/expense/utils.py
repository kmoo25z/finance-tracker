from django.db.models import Sum
from decimal import Decimal
from datetime import datetime, timedelta

class BudgetMonitor:
    """Monitor and validate budget status for expenses"""
    
    @staticmethod
    def check_budget_status(expense, user_budget):
        """
        Check if expense is within budget
        Returns: 'within_budget', 'over_budget', or 'unbudgeted'
        """
        if not user_budget:
            return 'unbudgeted'
        
        # Get total expenses for the category this month
        start_date = datetime.now().replace(day=1)
        total_category_expenses = expense.__class__.objects.filter(
            user=expense.user,
            category=expense.category,
            date__gte=start_date,
            date__lt=expense.date
        ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
        
        # Add current expense
        total_with_current = total_category_expenses + expense.amount
        
        # Get budget allocation for this category
        category_budget = user_budget.get_category_budget(expense.category)
        
        if not category_budget:
            return 'unbudgeted'
        elif total_with_current <= category_budget:
            return 'within_budget'
        else:
            return 'over_budget'