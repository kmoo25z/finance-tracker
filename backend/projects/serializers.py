from rest_framework import serializers
from .models import Project, ProjectDocument

class ProjectDocumentSerializer(serializers.ModelSerializer):
    file_size = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectDocument
        fields = ['id', 'name', 'file', 'file_size', 'uploaded_at', 'uploaded_by']
        read_only_fields = ['uploaded_at', 'uploaded_by', 'file_size']
    
    def get_file_size(self, obj):
        if obj.file:
            return obj.file.size
        return 0

class ProjectSerializer(serializers.ModelSerializer):
    documents = ProjectDocumentSerializer(many=True, read_only=True)
    sub_projects = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    budget_used = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'budget', 'budget_used', 'start_date', 
                  'end_date', 'parent_project', 'sub_projects', 'documents', 'progress']
    
    def get_sub_projects(self, obj):
        sub_projects = obj.sub_projects.all()
        return ProjectSerializer(sub_projects, many=True).data
    
    def get_progress(self, obj):
        # Calculate progress based on date or task completion
        if obj.start_date and obj.end_date:
            from datetime import date
            today = date.today()
            if today < obj.start_date:
                return 0
            elif today > obj.end_date:
                return 100
            else:
                total_days = (obj.end_date - obj.start_date).days
                elapsed_days = (today - obj.start_date).days
                return int((elapsed_days / total_days) * 100)
        return 0