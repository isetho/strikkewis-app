import { ArrowRight, PlusIcon } from "lucide-react";
import React, { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { useNavigate } from "react-router-dom";
import { useProject, Project } from "../../contexts/ProjectContext";
import { defaultKnittingImage } from '../../constants';

const groupProjectsByStatus = (projects: Project[]): Record<string, Project[]> => ({
  "Kladd": [
    ...projects.filter(p => !p.isPublished),
  ],
  "Publiserte": [
    ...projects.filter(p => p.isPublished),
  ],
});

export const DesignerProjects = (): JSX.Element => {
  const navigate = useNavigate();
  const { projects } = useProject();
  const projectsData = groupProjectsByStatus(projects);

  const [expandedSections, setExpandedSections] = useState<string[]>([
    "Kladd",
    "Publiserte",
  ]);

  const ProjectCard = ({ project }: { project: Project }) => (
    <Card 
      className="w-full sm:w-[308px] bg-white rounded-xl overflow-hidden border border-solid border-[#e7e7e7] shadow-[0px_14px_28px_#0000000d] cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/project/${project.id}`)}
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

          <p className="font-text-base text-grey-900 text-[length:var(--text-base-font-size)] tracking-[var(--text-base-letter-spacing)] leading-[var(--text-base-line-height)] [font-style:var(--text-base-font-style)]">
            {project.description}
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Badge 
              className={`rounded-[100px] px-2 py-1 font-text-xs text-[length:var(--text-xs-font-size)] tracking-[var(--text-xs-letter-spacing)] leading-[var(--text-xs-line-height)] [font-style:var(--text-xs-font-style)] ${
                project.difficulty === "Nybegynner" ? "bg-[#C7F7AE] text-neutralsblack" :
                project.difficulty === "Middels" ? "bg-[#C8EBFD] text-neutralsblack" :
                "bg-[#FEE9FE] text-neutralsblack"
              }`}
            >
              {project.difficulty}
            </Badge>
            
            <Badge 
              className="bg-[#ccc3ff] text-neutralsblack rounded-[100px] px-2 py-1 font-text-xs text-[length:var(--text-xs-font-size)] tracking-[var(--text-xs-letter-spacing)] leading-[var(--text-xs-line-height)] [font-style:var(--text-xs-font-style)]"
            >
              {project.isPublished ? 'Publisert' : 'Kladd'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <main className="bg-[#fff7ff] min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-[640px] mx-auto">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
          <h1 className="font-text-5xl text-black text-[length:var(--text-5xl-font-size)] tracking-[var(--text-5xl-letter-spacing)] leading-[var(--text-5xl-line-height)] [font-style:var(--text-5xl-font-style)]">
            Dine oppskrifter 💜
          </h1>

          <Button 
            className="w-full sm:w-auto bg-neutralsblack rounded-[48px] px-4 py-2 flex items-center justify-center gap-2"
            onClick={() => navigate('/create-recipe')}
          >
            <span className="font-text-base text-neutralswhite text-[length:var(--text-base-font-size)] tracking-[var(--text-base-letter-spacing)] leading-[var(--text-base-line-height)] [font-style:var(--text-base-font-style)]">
              Lag ny strikkeoppskrift
            </span>
            <PlusIcon className="w-4 h-4 text-white" />
          </Button>
        </header>

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