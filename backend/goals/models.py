from django.db import models
from django.contrib.auth.models import User

class Goal(models.Model):
    GOAL_TYPES = [
        ('savings', 'Savings'),
        ('investment', 'Investment'),
        ('purchase', 'Purchase'),
        ('emergency', 'Emergency Fund'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    name = models.CharField(max_length=200)
    goal_type = models.CharField(max_length=20, choices=GOAL_TYPES, default='savings')
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    current_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deadline = models.DateField()
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['deadline', '-created_at']
    
    @property
    def progress_percentage(self):
        if self.target_amount == 0:
            return 0
        return min(round((self.current_amount / self.target_amount) * 100, 2), 100)
    
    def __str__(self):
        return f"{self.name} - {self.progress_percentage}%"