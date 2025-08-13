import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finance_tracker.settings')
django.setup()

from django.apps import apps

for app in apps.get_app_configs():
    if not app.name.startswith('django.'):
        print(f"\n{app.name.upper()}")
        print("="*50)
        
        for model in app.get_models():
            print(f"\nModel: {model.__name__}")
            print("-"*30)
            
            # List all fields
            for field in model._meta.get_fields():
                if hasattr(field, 'get_internal_type'):
                    field_type = field.get_internal_type()
                    print(f"  {field.name} ({field_type})")
                else:
                    print(f"  {field.name} (RelatedField)")