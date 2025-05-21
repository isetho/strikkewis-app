import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Navbar } from "./components/Navbar";
import { Home } from "./screens/Home/Home";
import { DesignerProjects } from "./screens/DesignerProjects/DesignerProjects";
import { KnitterProjects } from "./screens/KnitterProjects/KnitterProjects";
import { DineProsjekter } from "./screens/DineProsjekter/DineProsjekter";
import { ProjectLanding } from "./screens/ProjectLanding/ProjectLanding";
import { ProjectGuide } from "./screens/ProjectGuide/ProjectGuide";
import { CreateRecipe } from "./screens/CreateRecipe/CreateRecipe";
import { ProjectProvider } from "./contexts/ProjectContext";

const AppContent = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/designer" element={<DineProsjekter />} />
        <Route path="/designer-projects" element={<DesignerProjects />} />
        <Route path="/knitter-projects" element={<KnitterProjects />} />
        <Route path="/knitter" element={<DineProsjekter />} />
        <Route path="/project/:id" element={<ProjectLanding />} />
        <Route path="/project-guide" element={<ProjectGuide />} />
        <Route path="/create-recipe" element={<CreateRecipe />} />
      </Routes>
    </div>
  );
};

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <AppContent />
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
