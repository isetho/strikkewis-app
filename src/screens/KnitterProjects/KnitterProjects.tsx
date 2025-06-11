import { ArrowRight, Upload } from "lucide-react";
import React, { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { useNavigate } from "react-router-dom";
import { useProject, Project } from "../../contexts/ProjectContext";
import { defaultKnittingImage } from '../../constants';
import { Button } from "../../components/ui/button";
import { UploadPatternModal } from "../../components/UploadPatternModal";

const groupProjectsByStatus = (projects: Project[]): Record<string, Project[]> => ({
  "På pinnene 🧶": [
    ...projects.filter(p => p.status === "På pinnene"),
  ],
  "Ikke påbegynt": [
    ...projects.filter(p => p.status === "Ikke påbegynt"),
  ],
  "Ferdig": [
    ...projects.filter(p => p.status === "Ferdig"),
  ],
});

export const KnitterProjects = (): JSX.Element => {
  const navigate = useNavigate();
  const { projects } = useProject();
  const projectsData = groupProjectsByStatus(projects);

  const [expandedSections, setExpandedSections] = useState<string[]>([
    "På pinnene 🧶",
    "Ikke påbegynt",
    "Ferdig",
  ]);

  const ProjectCard = ({ project }: { project: Project }) => (
    <Card 
      className="w-full sm:w-[308px] bg-white rounded-xl overflow-hidden border border-solid border-[#e7e7e7] shadow-[0px_14px_28px_#0000000d] cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(project.status === 'På pinnene' ? `/project-guide?id=${project.id}` : `/project/${project.id}`)}
    >
      <CardContent className="flex flex-col items-start justify-end gap-6 p-8">
        <div className="flex flex-col items-center justify-center gap-2 w-full">
          <div className="w-full sm:w-[250px] h-[180px]">
            {project.image ? (
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <img
                src={defaultKnittingImage}
                alt="Default knitting"
                className="w-full h-full object-cover rounded-lg"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 w-full">
          <div className="inline-flex items-center justify-center gap-2">
            <h3 className="font-text-2xl text-black text-[length:var(--text-2xl-font-size)] tracking-[var(--text-2xl-letter-spacing)] leading-[var(--text-2xl-line-height)] [font-style:var(--text-2xl-font-style)]">
              {project.title}
            </h3>
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <main className="min-h-screen bg-[#fff7ff] p-4 sm:p-6 md:p-8">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="font-text-5xl text-black">Mine strikkeprosjekter</h1>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate('/create-recipe')}
              variant="outline"
            >
              Lag ny oppskrift
            </Button>
            <UploadPatternModal />
          </div>
        </div>

        <section className="flex flex-col gap-6">
          {Object.entries(projectsData).map(([category, projects], index) => (
            <div key={category} className="flex flex-col gap-4 sm:gap-6">
              {index === 0 ? (
                <h2 className="font-text-xl text-black text-[length:var(--text-xl-font-size)] tracking-[var(--text-xl-letter-spacing)] leading-[var(--text-xl-line-height)] [font-style:var(--text-xl-font-style)]">
                  {category} ({projects.length})
                </h2>
              ) : (
                <Accordion
                  type="single"
                  collapsible
                  value={expandedSections.includes(category) ? category : ""}
                  onValueChange={(value) => {
                    if (value === category) {
                      setExpandedSections([...expandedSections, category]);
                    } else {
                      setExpandedSections(
                        expandedSections.filter((item) => item !== category),
                      );
                    }
                  }}
                  className="border-none"
                >
                  <AccordionItem value={category} className="border-none">
                    <AccordionTrigger className="p-0 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span className="font-text-base text-neutralsblack text-[length:var(--text-base-font-size)] tracking-[var(--text-base-letter-spacing)] leading-[var(--text-base-line-height)] [font-style:var(--text-base-font-style)]">
                          {category} ({projects.length})
                        </span>
                      </div>
                    </AccordionTrigger>
                    <div className="h-0.5 bg-purple500-regular mt-0.5" />
                  </AccordionItem>
                </Accordion>
              )}

              {expandedSections.includes(category) && (
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-6">
                  {projects.map((project, idx) => (
                    <ProjectCard key={`${category}-${idx}`} project={project} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
};