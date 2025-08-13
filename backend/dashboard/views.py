from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from income.models import Income
from expense.models import Expense
from goals.models import Goal
from categories.models import Budget, BudgetAlert

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        today = timezone.now().date()
        month_start = today.replace(day=1)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        # Income statistics
        total_income = Income.objects.filter(
            user=user
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        monthly_income = Income.objects.filter(
            user=user,
            date__gte=month_start,
            date__lte=month_end
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Expense statistics
        total_expenses = Expense.objects.filter(
            user=user
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        monthly_expenses = Expense.objects.filter(
            user=user,
            date__gte=month_start,
            date__lte=month_end
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Recent transactions
        recent_expenses = Expense.objects.filter(user=user).order_by('-date', '-created_at')[:5]
        recent_income = Income.objects.filter(user=user).order_by('-date', '-created_at')[:5]
        
        # Goals summary
        active_goals = Goal.objects.filter(user=user, deadline__gte=today).count()
        
        # Budget alerts
        unread_alerts = BudgetAlert.objects.filter(
            budget__user=user,
            is_read=False
        ).count()
        
        # Active budgets
        active_budgets = Budget.objects.filter(user=user, is_active=True)
        budgets_summary = {
            'total': active_budgets.count(),
            'over_budget': sum(1 for b in active_budgets if b.is_over_budget),
            'near_limit': sum(1 for b in active_budgets if b.is_near_limit and not b.is_over_budget)
        }
        
        data = {
            'overview': {
                'total_income': float(total_income),
                'total_expenses': float(total_expenses),
                'net_balance': float(total_income - total_expenses),
                'monthly_income': float(monthly_income),
                'monthly_expenses': float(monthly_expenses),
                'monthly_balance': float(monthly_income - monthly_expenses),
            },
            'recent_transactions': {
                'expenses': [
                    {
                        'id': e.id,
                        'description': e.description,
                        'amount': float(e.amount),
                        'date': e.date,
                        'category': getattr(e.category_fk, 'name', e.category) if e.category_fk else e.category
                    } for e in recent_expenses
                ],
                'income': [
                    {
                        'id': i.id,
                        'source': i.source,
                        'amount': float(i.amount),
                        'date': i.date
                    } for i in recent_income
                ]
            },
            'summary': {
                'active_goals': active_goals,
                'unread_alerts': unread_alerts,
                'budgets': budgets_summary
            }
        }
        
        return Response(data)