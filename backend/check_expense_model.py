import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finance_tracker.settings')
django.setup()

from expense.models import Expense

print("Expense model fields:")
for field in Expense._meta.get_fields():
    print(f"  {field.name}")