import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finance_tracker.settings')
django.setup()

from django.apps import apps

# List of your apps
app_names = ['expense', 'income', 'transaction', 'goals', 'debt', 'accounts', 'money_transfer', 'projects', 'calendar_app']

for app_name in app_names:
    try:
        app = apps.get_app_config(app_name)
        print(f"\n{app_name.upper()} MODELS:")
        print("="*50)
        
        for model in app.get_models():
            print(f"\nModel: {model.__name__}")
            print("-"*30)
            for field in model._meta.get_fields():
                print(f"  {field.name}")
    except Exception as e:
        print(f"Error with {app_name}: {e}")
