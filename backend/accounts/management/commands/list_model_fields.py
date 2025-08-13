from django.core.management.base import BaseCommand
from django.apps import apps

class Command(BaseCommand):
    help = 'List all fields for all models'

    def handle(self, *args, **options):
        for app in apps.get_app_configs():
            if app.name.startswith('django.'):
                continue
                
            self.stdout.write(f"\n{app.name.upper()}")
            self.stdout.write("="*50)
            
            for model in app.get_models():
                self.stdout.write(f"\nModel: {model.__name__}")
                self.stdout.write("-"*30)
                
                # List all fields
                for field in model._meta.get_fields():
                    field_type = field.get_internal_type()
                    self.stdout.write(f"  {field.name} ({field_type})")