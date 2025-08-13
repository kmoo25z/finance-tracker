from django.contrib import admin
from .models import Goal

@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ['name', 'target_amount', 'current_amount', 'deadline', 'get_progress', 'user']
    list_filter = ['deadline', 'created_at']
    search_fields = ['name', 'description']
    date_hierarchy = 'deadline'
    ordering = ['deadline']
    list_per_page = 20
    
    def get_progress(self, obj):
        return f"{obj.achievement_percentage:.1f}%"
    get_progress.short_description = 'Progress'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)