from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import USAccount, KenyaAccount
from .serializers import USAccountSerializer, KenyaAccountSerializer

class USAccountViewSet(viewsets.ModelViewSet):
    serializer_class = USAccountSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return USAccount.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class KenyaAccountViewSet(viewsets.ModelViewSet):
    serializer_class = KenyaAccountSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return KenyaAccount.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
