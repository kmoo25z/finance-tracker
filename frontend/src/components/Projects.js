import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  LinearProgress,
  Alert,
  Paper,
  Divider,
  CircularProgress,
  Tooltip,
  Input,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  CloudUpload as UploadIcon,
  PictureAsPdf as PdfIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { projectsAPI, utils } from '../services/api';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [openSubProjectDialog, setOpenSubProjectDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedParentProject, setSelectedParentProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [uploadProject, setUploadProject] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState({});
  
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    budget: '',
    start_date: new Date(),
    end_date: null,
  });

  const [subProjectFormData, setSubProjectFormData] = useState({
    name: '',
    description: '',
    budget: '',
    start_date: new Date(),
    end_date: null,
  });

  const [uploadFormData, setUploadFormData] = useState({
    name: '',
    file: null,
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getProjects();
      console.log('Projects response:', response);
      
      let projectsData = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          projectsData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          projectsData = response.data.results;
        } else if (response.data.projects && Array.isArray(response.data.projects)) {
          projectsData = response.data.projects;
        }
      }
      
      setProjects(projectsData);
      setError(null);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError(utils.handleError(error));
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProjectDialog = (project = null) => {
    if (project) {
      setSelectedProject(project);
      setProjectFormData({
        name: project.name,
        description: project.description || '',
        budget: project.budget,
        start_date: new Date(project.start_date),
        end_date: project.end_date ? new Date(project.end_date) : null,
      });
    } else {
      setSelectedProject(null);
      setProjectFormData({
        name: '',
        description: '',
        budget: '',
        start_date: new Date(),
        end_date: null,
      });
    }
    setOpenProjectDialog(true);
  };

  const handleOpenUploadDialog = (project) => {
    setUploadProject(project);
    setUploadFormData({ name: '', file: null });
    setOpenUploadDialog(true);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadFormData({
        ...uploadFormData,
        file: file,
        name: uploadFormData.name || file.name.replace('.pdf', '')
      });
    } else {
      setError('Please select a PDF file');
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadFormData.file) {
      setError('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFormData.file);
    formData.append('name', uploadFormData.name || uploadFormData.file.name);

    try {
      setUploading({ ...uploading, [uploadProject.id]: true });
      await projectsAPI.uploadDocument(uploadProject.id, formData);
      setSuccess('Document uploaded successfully');
      setOpenUploadDialog(false);
      fetchProjects();
    } catch (error) {
      console.error('Upload error:', error);
      setError(utils.handleError(error));
    } finally {
      setUploading({ ...uploading, [uploadProject.id]: false });
    }
  };

  const handleDeleteDocument = async (project, documentId) => {
    try {
      await projectsAPI.deleteDocument(project.id, documentId);
      setSuccess('Document deleted successfully');
      fetchProjects();
    } catch (error) {
      console.error('Delete document error:', error);
      setError(utils.handleError(error));
    }
  };

  const calculateProgress = (project) => {
    // Use backend-calculated progress if available
    if (project.progress !== undefined) {
      return project.progress;
    }
    
    // Otherwise calculate based on dates
    if (!project.start_date || !project.end_date) return 0;
    
    const start = new Date(project.start_date);
    const end = new Date(project.end_date);
    const now = new Date();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end - start;
    const elapsed = now - start;
    
    return Math.round((elapsed / total) * 100);
  };

  const getProjectStatus = (project) => {
    const progress = calculateProgress(project);
    const budgetUsed = project.budget_used || 0;
    const budgetPercentage = project.budget > 0 ? (budgetUsed / project.budget) * 100 : 0;
    
    if (progress === 100) return { status: 'Completed', color: 'success' };
    if (budgetPercentage > 90) return { status: 'Over Budget', color: 'error' };
    if (progress > 75) return { status: 'Near Completion', color: 'warning' };
    return { status: 'Active', color: 'primary' };
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderProgressBar = (project) => {
    const progress = calculateProgress(project);
    const status = getProjectStatus(project);
    
    return (
      <Box sx={{ width: '100%' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" color="textSecondary">
            Project Progress
          </Typography>
          <Typography variant="body2" color={status.color + '.main'}>
            {progress}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          color={status.color}
          sx={{ 
            height: 10, 
            borderRadius: 5,
            backgroundColor: status.color + '.lighter',
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
            }
          }}
        />
      </Box>
    );
  };

  const renderProjectCard = (project, isSubProject = false) => {
    const progress = calculateProgress(project);
    const status = getProjectStatus(project);
    const hasSubProjects = project.sub_projects && project.sub_projects.length > 0;
    const isExpanded = expandedProjects[project.id];
    const documents = project.documents || [];

    return (
      <Card key={project.id} sx={{ mb: 2, ml: isSubProject ? 4 : 0 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant={isSubProject ? "h6" : "h5"}>
                  {project.name}
                </Typography>
                <Chip 
                  label={status.status} 
                  color={status.color} 
                  size="small"
                />
              </Box>
              
              {project.description && (
                <Typography variant="body2" color="textSecondary" paragraph>
                  {project.description}
                </Typography>
              )}
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <MoneyIcon color="action" fontSize="small" />
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Budget
                      </Typography>
                      <Typography variant="body2">
                        {utils.formatCurrency(project.budget_used || 0)} / {utils.formatCurrency(project.budget)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CalendarIcon color="action" fontSize="small" />
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Timeline
                      </Typography>
                      <Typography variant="body2">
                        {utils.formatDate(project.start_date)} - {project.end_date ? utils.formatDate(project.end_date) : 'Ongoing'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PdfIcon color="action" fontSize="small" />
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Documents
                      </Typography>
                      <Typography variant="body2">
                        {documents.length} PDF{documents.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
              
              {/* Progress Bar */}
              <Box sx={{ mb: 2 }}>
                {renderProgressBar(project)}
              </Box>
              
              {/* Documents Section */}
              {documents.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Documents
                  </Typography>
                  <List dense>
                    {documents.map((doc) => (
                      <ListItem key={doc.id} sx={{ pl: 0 }}>
                        <PdfIcon color="error" sx={{ mr: 1 }} />
                        <ListItemText
                          primary={doc.name}
                          secondary={`${formatFileSize(doc.file_size)} • ${utils.formatDate(doc.uploaded_at)}`}
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Download">
                            <IconButton
                              edge="end"
                              size="small"
                              href={doc.file}
                              target="_blank"
                              sx={{ mr: 1 }}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => handleDeleteDocument(project, doc.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
              
              {hasSubProjects && (
                <Button
                  startIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onClick={() => toggleProjectExpanded(project.id)}
                  size="small"
                >
                  {project.sub_projects.length} Sub-projects
                </Button>
              )}
            </Box>
            
            <Box>
              <Tooltip title="Upload PDF">
                <IconButton
                  size="small"
                  onClick={() => handleOpenUploadDialog(project)}
                  sx={{ mr: 1 }}
                  disabled={uploading[project.id]}
                >
                  {uploading[project.id] ? <CircularProgress size={20} /> : <UploadIcon />}
                </IconButton>
              </Tooltip>
              {!isSubProject && (
                <Tooltip title="Add Sub-project">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenSubProjectDialog(project)}
                    sx={{ mr: 1 }}
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Edit Project">
                <IconButton
                  size="small"
                  onClick={() => handleOpenProjectDialog(project)}
                  sx={{ mr: 1 }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Project">
                <IconButton
                  size="small"
                  onClick={() => {
                    setProjectToDelete(project);
                    setOpenDeleteDialog(true);
                  }}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
        
        {hasSubProjects && isExpanded && (
          <Box sx={{ pl: 2, pr: 2, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            {project.sub_projects.map(subProject => renderProjectCard(subProject, true))}
          </Box>
        )}
      </Card>
    );
  };

  const toggleProjectExpanded = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const handleCloseProjectDialog = () => {
    setOpenProjectDialog(false);
    setSelectedProject(null);
    setProjectFormData({
      name: '',
      description: '',
      budget: '',
      start_date: new Date(),
      end_date: null,
    });
    setError(null);
  };

  const handleProjectFormChange = (field, value) => {
    setProjectFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitProject = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!projectFormData.name.trim()) {
        setError('Project name is required');
        return;
      }
      if (!projectFormData.budget || parseFloat(projectFormData.budget) <= 0) {
        setError('Valid budget amount is required');
        return;
      }

      const dataToSubmit = {
        name: projectFormData.name.trim(),
        description: projectFormData.description.trim(),
        budget: parseFloat(projectFormData.budget),
        start_date: projectFormData.start_date.toISOString().split('T')[0],
        end_date: projectFormData.end_date ? projectFormData.end_date.toISOString().split('T')[0] : null,
      };

      if (selectedProject) {
        await projectsAPI.updateProject(selectedProject.id, dataToSubmit);
        setSuccess('Project updated successfully');
      } else {
        await projectsAPI.createProject(dataToSubmit);
        setSuccess('Project created successfully');
      }
      
      handleCloseProjectDialog();
      fetchProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      setError(utils.handleError(error));
    }
  };

  const handleOpenSubProjectDialog = (parentProject) => {
    setSelectedParentProject(parentProject);
    setSubProjectFormData({
      name: '',
      description: '',
      budget: '',
      start_date: new Date(),
      end_date: null,
    });
    setOpenSubProjectDialog(true);
  };

  const handleCloseSubProjectDialog = () => {
    setOpenSubProjectDialog(false);
    setSelectedParentProject(null);
    setSubProjectFormData({
      name: '',
      description: '',
      budget: '',
      start_date: new Date(),
      end_date: null,
    });
    setError(null);
  };

  const handleSubProjectFormChange = (field, value) => {
    setSubProjectFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitSubProject = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!subProjectFormData.name.trim()) {
        setError('Sub-project name is required');
        return;
      }
      if (!subProjectFormData.budget || parseFloat(subProjectFormData.budget) <= 0) {
        setError('Valid budget amount is required');
        return;
      }

      const dataToSubmit = {
        name: subProjectFormData.name.trim(),
        description: subProjectFormData.description.trim(),
        budget: parseFloat(subProjectFormData.budget),
        start_date: subProjectFormData.start_date.toISOString().split('T')[0],
        end_date: subProjectFormData.end_date ? subProjectFormData.end_date.toISOString().split('T')[0] : null,
        parent_project: selectedParentProject.id,
      };

      await projectsAPI.createProject(dataToSubmit);
      setSuccess('Sub-project created successfully');
      handleCloseSubProjectDialog();
      fetchProjects();
    } catch (error) {
      console.error('Error creating sub-project:', error);
      setError(utils.handleError(error));
    }
  };

  const handleDeleteProject = async () => {
    try {
      await projectsAPI.deleteProject(projectToDelete.id);
      setSuccess('Project deleted successfully');
      setOpenDeleteDialog(false);
      setProjectToDelete(null);
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      setError(utils.handleError(error));
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Projects</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenProjectDialog()}
          >
            New Project
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {Array.isArray(projects) && projects.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No projects yet
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Create your first project to start tracking your financial goals
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenProjectDialog()}
            >
              Create Project
            </Button>
          </Paper>
        ) : Array.isArray(projects) ? (
          <Box>
            {projects.filter(p => !p.parent_project).map(project => renderProjectCard(project))}
          </Box>
        ) : (
          <Alert severity="error">
            Error loading projects. Invalid data format.
          </Alert>
        )}

        {/* Project Dialog */}
        <Dialog open={openProjectDialog} onClose={handleCloseProjectDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedProject ? 'Edit Project' : 'New Project'}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Project Name"
                value={projectFormData.name}
                onChange={(e) => handleProjectFormChange('name', e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Description"
                value={projectFormData.description}
                onChange={(e) => handleProjectFormChange('description', e.target.value)}
                margin="normal"
                multiline
                rows={3}
              />
              <TextField
                fullWidth
                label="Budget"
                type="number"
                value={projectFormData.budget}
                onChange={(e) => handleProjectFormChange('budget', e.target.value)}
                margin="normal"
                required
                InputProps={{
                  startAdornment: '$',
                }}
              />
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <DatePicker
                  label="Start Date"
                  value={projectFormData.start_date}
                  onChange={(date) => handleProjectFormChange('start_date', date)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
                <DatePicker
                  label="End Date"
                  value={projectFormData.end_date}
                  onChange={(date) => handleProjectFormChange('end_date', date)}
                  slotProps={{ textField: { fullWidth: true } }}
                  minDate={projectFormData.start_date}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseProjectDialog}>Cancel</Button>
            <Button onClick={handleSubmitProject} variant="contained">
              {selectedProject ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Sub-Project Dialog */}
        <Dialog open={openSubProjectDialog} onClose={handleCloseSubProjectDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            New Sub-Project for {selectedParentProject?.name}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Sub-Project Name"
                value={subProjectFormData.name}
                onChange={(e) => handleSubProjectFormChange('name', e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Description"
                value={subProjectFormData.description}
                onChange={(e) => handleSubProjectFormChange('description', e.target.value)}
                margin="normal"
                multiline
                rows={3}
              />
              <TextField
                fullWidth
                label="Budget"
                type="number"
                value={subProjectFormData.budget}
                onChange={(e) => handleSubProjectFormChange('budget', e.target.value)}
                margin="normal"
                required
                InputProps={{
                  startAdornment: '$',
                }}
              />
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <DatePicker
                  label="Start Date"
                  value={subProjectFormData.start_date}
                  onChange={(date) => handleSubProjectFormChange('start_date', date)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
                <DatePicker
                  label="End Date"
                  value={subProjectFormData.end_date}
                  onChange={(date) => handleSubProjectFormChange('end_date', date)}
                  slotProps={{ textField: { fullWidth: true } }}
                  minDate={subProjectFormData.start_date}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSubProjectDialog}>Cancel</Button>
            <Button onClick={handleSubmitSubProject} variant="contained">
              Create Sub-Project
            </Button>
          </DialogActions>
        </Dialog>

        {/* Upload Document Dialog */}
        <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Upload PDF to {uploadProject?.name}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Document Name"
                value={uploadFormData.name}
                onChange={(e) => setUploadFormData({ ...uploadFormData, name: e.target.value })}
                margin="normal"
                helperText="Leave empty to use file name"
              />
              <Box sx={{ mt: 2 }}>
                <Input
                  type="file"
                  onChange={handleFileSelect}
                  inputProps={{ accept: '.pdf' }}
                  fullWidth
                />
                {uploadFormData.file && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Selected: {uploadFormData.file.name} ({formatFileSize(uploadFormData.file.size)})
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenUploadDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleUploadDocument} 
              variant="contained"
              disabled={!uploadFormData.file || uploading[uploadProject?.id]}
              startIcon={uploading[uploadProject?.id] ? <CircularProgress size={20} /> : <UploadIcon />}
            >
              Upload
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
          <DialogTitle>Delete Project</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{projectToDelete?.name}"?
              {projectToDelete?.sub_projects?.length > 0 && (
                <Box component="span" sx={{ display: 'block', mt: 1, color: 'error.main' }}>
                  This will also delete {projectToDelete.sub_projects.length} sub-project(s).
                </Box>
              )}
              {projectToDelete?.documents?.length > 0 && (
                <Box component="span" sx={{ display: 'block', mt: 1, color: 'error.main' }}>
                  This will also delete {projectToDelete.documents.length} document(s).
                </Box>
              )}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button onClick={handleDeleteProject} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Projects;