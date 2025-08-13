from rest_framework import serializers
from .models import Goal

class GoalSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Goal
        fields = [
            'id', 'name', 'goal_type', 'target_amount', 'current_amount',
            'deadline', 'description', 'progress_percentage',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'progress_percentage']