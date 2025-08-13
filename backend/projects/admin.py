from django.contrib import admin
from .models import Project, ProjectDocument

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'budget', 'budget_used', 'start_date', 'end_date', 'parent_project']
    list_filter = ['user', 'start_date', 'end_date']
    search_fields = ['name', 'description']
    date_hierarchy = 'start_date'
    ordering = ['-created_at']

@admin.register(ProjectDocument)
class ProjectDocumentAdmin(admin.ModelAdmin):
    list_display = ['name', 'project', 'uploaded_by', 'uploaded_at']
    list_filter = ['uploaded_at', 'project']
    search_fields = ['name', 'project__name']
    date_hierarchy = 'uploaded_at'