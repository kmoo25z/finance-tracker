from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Import views
from dashboard.views import DashboardView
from income.views import IncomeViewSet
from expense.views import ExpenseViewSet
from transaction.views import TransactionViewSet
from goals.views import GoalViewSet
from debt.views import DebtViewSet, DebtPaymentViewSet
from accounts.views import USAccountViewSet, KenyaAccountViewSet
from money_transfer.views import MoneyTransferViewSet
from projects.views import ProjectViewSet
from calendar_app.views import CalendarEventViewSet
from categories.views import CategoryViewSet, BudgetViewSet, BudgetAlertViewSet

router = DefaultRouter()
router.register(r'incomes', IncomeViewSet, basename='income')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'goals', GoalViewSet, basename='goal')
router.register(r'debts', DebtViewSet, basename='debt')
router.register(r'debt-payments', DebtPaymentViewSet, basename='debt-payment')
router.register(r'us-accounts', USAccountViewSet, basename='us-account')
router.register(r'kenya-accounts', KenyaAccountViewSet, basename='kenya-account')
router.register(r'money-transfers', MoneyTransferViewSet, basename='money-transfer')
router.register(r'projects', ProjectViewSet, basename='project')
# router.register(r'project-expenses', ProjectExpenseViewSet, basename='project-expense')
router.register(r'calendar-events', CalendarEventViewSet, basename='calendar-event')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'budgets', BudgetViewSet, basename='budget')
router.register(r'budget-alerts', BudgetAlertViewSet, basename='budget-alert')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
