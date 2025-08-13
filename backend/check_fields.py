import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finance_tracker.settings')
django.setup()

from debt.models import Debt
from income.models import Income

print("DEBT MODEL FIELDS:")
print("-" * 30)
for field in Debt._meta.get_fields():
    print(f"  {field.name}")

print("\nINCOME MODEL FIELDS:")
print("-" * 30)
for field in Income._meta.get_fields():
    print(f"  {field.name}")