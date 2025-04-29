import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Login } from "./screens/Login/Login";
import { Navbar } from "./components/Navbar";
import { Home } from "./screens/Home/Home";
import { DesignerProjects } from "./screens/DesignerProjects/DesignerProjects";
import { KnitterProjects } from "./screens/KnitterProjects/KnitterProjects";
import { DineProsjekter } from "./screens/DineProsjekter/DineProsjekter";
import { ProjectLanding } from "./screens/ProjectLanding/ProjectLanding";
import { ProjectGuide } from "./screens/ProjectGuide/ProjectGuide";
import { CreateRecipe } from "./screens/CreateRecipe/CreateRecipe";
import { ProjectProvider } from "./contexts/ProjectContext";
import { useAuth } from "./contexts/AuthContext";

const AppContent = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff7ff]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple500-regular border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Laster inn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
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
