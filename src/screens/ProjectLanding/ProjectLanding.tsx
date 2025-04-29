import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';
import { DesignerProjectLanding } from './DesignerProjectLanding';
import { KnitterProjectLanding } from './KnitterProjectLanding';

export const ProjectLanding = () => {
  const { id } = useParams();
  const { userRole } = useAuth();
  const { projects } = useProject();
  const project = projects.find(p => p.id === id);

  if (!project) {
    return <Navigate to="/" replace />;
  }

  if (userRole === 'designer') {
    return <DesignerProjectLanding project={project} />;
  }

  return <KnitterProjectLanding project={project} />;
};