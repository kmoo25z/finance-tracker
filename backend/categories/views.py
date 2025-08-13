from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum
from django.utils import timezone
from .models import Category, Budget, BudgetAlert
from .serializers import CategorySerializer, BudgetSerializer, BudgetAlertSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Category.objects.filter(user=self.request.user)
        
        # Filter by type if provided
        category_type = self.request.query_params.get('type', None)
        if category_type:
            queryset = queryset.filter(category_type__in=[category_type, 'both'])
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter to only parent categories if requested
        parents_only = self.request.query_params.get('parents_only', None)
        if parents_only and parents_only.lower() == 'true':
            queryset = queryset.filter(parent_category__isnull=True)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get categories in tree structure"""
        categories = self.get_queryset().filter(parent_category__isnull=True)
        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def expense_categories(self, request):
        """Get only expense categories"""
        categories = self.get_queryset().filter(
            Q(category_type='expense') | Q(category_type='both')
        )
        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def income_categories(self, request):
        """Get only income categories"""
        categories = self.get_queryset().filter(
            Q(category_type='income') | Q(category_type='both')
        )
        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def create_defaults(self, request):
        """Create default categories for new users"""
        default_categories = [
            # Expense categories
            {'name': 'Food & Dining', 'category_type': 'expense', 'icon': 'Restaurant', 'color': '#FF5722'},
            {'name': 'Transportation', 'category_type': 'expense', 'icon': 'DirectionsCar', 'color': '#795548'},
            {'name': 'Shopping', 'category_type': 'expense', 'icon': 'ShoppingCart', 'color': '#E91E63'},
            {'name': 'Entertainment', 'category_type': 'expense', 'icon': 'Movie', 'color': '#9C27B0'},
            {'name': 'Bills & Utilities', 'category_type': 'expense', 'icon': 'Receipt', 'color': '#3F51B5'},
            {'name': 'Healthcare', 'category_type': 'expense', 'icon': 'LocalHospital', 'color': '#00BCD4'},
            {'name': 'Education', 'category_type': 'expense', 'icon': 'School', 'color': '#009688'},
            {'name': 'Personal Care', 'category_type': 'expense', 'icon': 'Spa', 'color': '#4CAF50'},
            {'name': 'Rent/Mortgage', 'category_type': 'expense', 'icon': 'Home', 'color': '#FF9800'},
            {'name': 'Insurance', 'category_type': 'expense', 'icon': 'Security', 'color': '#607D8B'},
            
            # Income categories
            {'name': 'Salary', 'category_type': 'income', 'icon': 'Work', 'color': '#4CAF50'},
            {'name': 'Freelance', 'category_type': 'income', 'icon': 'Computer', 'color': '#2196F3'},
            {'name': 'Investment', 'category_type': 'income', 'icon': 'TrendingUp', 'color': '#FF9800'},
            {'name': 'Business', 'category_type': 'income', 'icon': 'Business', 'color': '#9C27B0'},
            {'name': 'Other Income', 'category_type': 'income', 'icon': 'AttachMoney', 'color': '#607D8B'},
        ]
        
        created_categories = []
        for cat_data in default_categories:
            category, created = Category.objects.get_or_create(
                user=request.user,
                name=cat_data['name'],
                defaults=cat_data
            )
            if created:
                created_categories.append(category)
        
        serializer = self.get_serializer(created_categories, many=True)
        return Response({
            'message': f'Created {len(created_categories)} default categories',
            'categories': serializer.data
        })


class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Budget.objects.filter(user=self.request.user)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter by period
        period = self.request.query_params.get('period', None)
        if period:
            queryset = queryset.filter(period=period)
        
        # Filter by category
        category_id = self.request.query_params.get('category', None)
        if category_id:
            if category_id == 'overall':
                queryset = queryset.filter(category__isnull=True)
            else:
                queryset = queryset.filter(category_id=category_id)
        
        return queryset
    
    def perform_create(self, serializer):
        budget = serializer.save(user=self.request.user)
        # Check if budget is already over threshold
        if budget.is_near_limit:
            BudgetAlert.objects.create(
                budget=budget,
                percentage_reached=budget.spent_percentage,
                amount_spent=budget.spent_amount,
                message=f"Budget '{budget.name}' has reached {budget.spent_percentage}% of the limit!"
            )
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get budget summary for dashboard"""
        budgets = self.get_queryset().filter(is_active=True)
        
        total_budget = sum(float(budget.amount) for budget in budgets)
        total_spent = sum(float(budget.spent_amount) for budget in budgets)
        total_remaining = total_budget - total_spent
        
        over_budget = [budget for budget in budgets if budget.is_over_budget]
        near_limit = [budget for budget in budgets if budget.is_near_limit and not budget.is_over_budget]
        
        return Response({
            'total_budget': total_budget,
            'total_spent': total_spent,
            'total_remaining': total_remaining,
            'overall_percentage': round((total_spent / total_budget * 100), 2) if total_budget > 0 else 0,
            'budgets_count': len(budgets),
            'over_budget_count': len(over_budget),
            'near_limit_count': len(near_limit),
            'over_budget': BudgetSerializer(over_budget, many=True).data,
            'near_limit': BudgetSerializer(near_limit, many=True).data,
        })
    
    @action(detail=False, methods=['post'])
    def check_alerts(self, request):
        """Check all budgets and create alerts if needed"""
        budgets = self.get_queryset().filter(is_active=True)
        alerts_created = []
        
        for budget in budgets:
            if budget.is_near_limit:
                # Check if alert already exists for this period
                start_date, end_date = budget.get_current_period_dates()
                existing_alert = budget.alerts.filter(
                    alert_date__date__gte=start_date,
                    alert_date__date__lte=end_date
                ).exists()
                
                if not existing_alert:
                    alert = BudgetAlert.objects.create(
                        budget=budget,
                        percentage_reached=budget.spent_percentage,
                        amount_spent=budget.spent_amount,
                        message=f"Budget '{budget.name}' has reached {budget.spent_percentage}% of the limit!"
                    )
                    alerts_created.append(alert)
        
        return Response({
            'alerts_created': len(alerts_created),
            'alerts': BudgetAlertSerializer(alerts_created, many=True).data
        })
    
    @action(detail=True, methods=['get'])
    def expenses(self, request, pk=None):
        """Get expenses for this budget in current period"""
        budget = self.get_object()
        from expense.models import Expense
        
        start_date, end_date = budget.get_current_period_dates()
        
        expenses = Expense.objects.filter(
            user=request.user,
            date__gte=start_date,
            date__lte=end_date
        )
        
        if budget.category:
            expenses = expenses.filter(
                Q(category=budget.category.name) | 
                Q(category_fk=budget.category)
            )
        
        # Simple serialization
        expense_data = []
        for expense in expenses:
            expense_data.append({
                'id': expense.id,
                'description': expense.description,
                'amount': str(expense.amount),
                'date': expense.date,
                'category': getattr(expense.category_fk, 'name', expense.category) if expense.category_fk else expense.category or 'Uncategorized'
            })
        
        return Response({
            'period_start': start_date,
            'period_end': end_date,
            'total': sum(float(e['amount']) for e in expense_data),
            'count': len(expense_data),
            'expenses': expense_data
        })


class BudgetAlertViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetAlertSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return BudgetAlert.objects.filter(budget__user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all alerts as read"""
        alerts = self.get_queryset().filter(is_read=False)
        count = alerts.update(is_read=True)
        return Response({'marked_read': count})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark single alert as read"""
        alert = self.get_object()
        alert.is_read = True
        alert.save()
        return Response({'status': 'marked as read'})