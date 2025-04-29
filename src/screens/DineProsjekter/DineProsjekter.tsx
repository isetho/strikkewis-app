import React from "react";
import { Navigate } from "react-router-dom";
import { useProject, Project } from "../../contexts/ProjectContext";
import { useAuth } from "../../contexts/AuthContext";

export const DineProsjekter = (): JSX.Element => {
  const { userRole } = useAuth();
  
  return userRole === 'designer' ? (
    <Navigate to="/designer-projects" replace />
  ) : (
    <Navigate to="/knitter-projects" replace />
  );
};