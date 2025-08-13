from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Project, ProjectDocument
from .serializers import ProjectSerializer, ProjectDocumentSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ProjectSerializer
    parser_classes = (MultiPartParser, FormParser)
    
    def get_queryset(self):
        return Project.objects.filter(user=self.request.user, parent_project__isnull=True)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def upload_document(self, request, pk=None):
        project = self.get_object()
        file = request.FILES.get('file')
        
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not file.name.endswith('.pdf'):
            return Response({'error': 'Only PDF files are allowed'}, status=status.HTTP_400_BAD_REQUEST)
        
        document = ProjectDocument.objects.create(
            project=project,
            name=request.data.get('name', file.name),
            file=file,
            uploaded_by=request.user
        )
        
        serializer = ProjectDocumentSerializer(document)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'])
    def delete_document(self, request, pk=None):
        project = self.get_object()
        document_id = request.data.get('document_id')
        
        try:
            document = project.documents.get(id=document_id)
            document.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProjectDocument.DoesNotExist:
            return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)