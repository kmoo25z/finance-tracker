from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import MoneyTransfer
from .serializers import MoneyTransferSerializer

class MoneyTransferViewSet(viewsets.ModelViewSet):
    serializer_class = MoneyTransferSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return MoneyTransfer.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete a pending transfer"""
        transfer = self.get_object()
        
        try:
            transfer.complete_transfer()
            serializer = self.get_serializer(transfer)
            return Response({
                'message': 'Transfer completed successfully',
                'transfer': serializer.data
            })
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': 'Failed to complete transfer'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        """Only allow updates to pending transfers"""
        instance = self.get_object()
        if instance.status != 'pending':
            return Response(
                {'error': 'Only pending transfers can be modified'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Only allow deletion of pending transfers"""
        instance = self.get_object()
        if instance.status != 'pending':
            return Response(
                {'error': 'Only pending transfers can be deleted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)