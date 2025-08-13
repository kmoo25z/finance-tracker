@'
import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finance_tracker.settings')
django.setup()

# Try to import each module and see what's available
modules_to_check = [
    'dashboard.views',
    'income.views',
    'expense.views',
    'transaction.views',
    'goals.views',
    'debt.views',
    'accounts.views',
    'money_transfer.views',
    'projects.views',
    'calendar_app.views',
]

for module_name in modules_to_check:
    print(f"\n{module_name}:")
    print("-" * 40)
    try:
        module = __import__(module_name, fromlist=[''])
        for item in dir(module):
            if not item.startswith('_'):
                print(f"  {item}")
    except Exception as e:
        print(f"  ERROR: {e}")
'@ | Set-Content -Path check_imports.py