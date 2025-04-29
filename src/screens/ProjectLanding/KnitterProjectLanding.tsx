import React from 'react';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Project, useProject } from '../../contexts/ProjectContext';
import { defaultKnittingImage } from '../../constants';

const SpecificationRow = ({ label, value }: { label: string; value: React.ReactNode | undefined | null }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 py-3 border-b border-gray-100 last:border-0">
    <span className="text-gray-600 shrink-0">{label}</span>
    <span className="font-medium text-right break-words">{value || 'Ikke definert'}</span>
  </div>
);

interface Props {
  project: Project;
}

const statusOptions = ['På pinnene', 'Ikke påbegynt', 'Ferdig'] as const;

export const KnitterProjectLanding = ({ project }: Props) => {
  const navigate = useNavigate();
  const { updateProject } = useProject();

  const handleSizeSelect = (size: string) => {
    updateProject({
      ...project,
      selectedSize: size
    });
  };

  return (
    <div className="min-h-screen bg-[#fff7ff] p-4 sm:p-6 md:p-8">
      <div className="max-w-[640px] mx-auto">
        <button
          className="flex items-center gap-2 -ml-2 text-gray-600 hover:text-black mb-8"
          onClick={() => navigate('/knitter-projects')}
        >
          <ChevronLeft className="w-4 h-4" />
          Tilbake til oversikt
        </button>

        <div className="mb-8">
          <img
            src={project.image || defaultKnittingImage}
            alt={project.title}
            className="w-full h-64 object-cover rounded-xl"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6 mb-8">
          <h1 className="font-text-5xl text-black">{project.title}</h1>
          <div className="flex w-full sm:w-auto gap-2">
            <div className="relative">
              <select
                value={project.status}
                onChange={(e) => {
                  updateProject({
                    ...project,
                    status: e.target.value as typeof statusOptions[number],
                    currentStep: ['På pinnene', 'Ikke påbegynt'].includes(e.target.value) ? 0 : project.currentStep
                  });
                }}
                className="appearance-none bg-white border rounded-lg px-4 py-2 pr-8 hover:border-purple500-regular focus:border-purple500-regular focus:outline-none cursor-pointer"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-500" />
            </div>
            
            <Button
              onClick={() => navigate(`/project-guide?id=${project.id}`)}
              variant="default"
            >
              {project.status === 'På pinnene' ? 'Fortsett' : 'Start guiden'}
            </Button>
          </div>
        </div>

        <div className="bg-[#FFFFF0] rounded-xl p-8 space-y-8">
          <div>
            <h2 className="font-text-xl text-black mb-4">Om prosjektet</h2>
            <p className="text-gray-600">{project.description}</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge 
              className={`rounded-[100px] px-2 py-1 ${
                project.difficulty === "Nybegynner" ? "bg-[#C7F7AE]" :
                project.difficulty === "Middels" ? "bg-[#C8EBFD]" :
                "bg-[#FEE9FE]"
              } text-neutralsblack`}
            >
              {project.difficulty}
            </Badge>
            
            <Badge 
              className="bg-[#ccc3ff] text-neutralsblack rounded-[100px] px-2 py-1"
            >
              {project.status}
            </Badge>
          </div>

          <div>
            <h2 className="font-text-xl text-black mb-4">Velg størrelse</h2>
            <div className="grid grid-cols-2 gap-2">
              {project.availableSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeSelect(size)}
                  className={`p-3 rounded-lg border transition-colors ${
                    size === project.selectedSize
                      ? 'border-purple500-regular bg-purple200-light'
                      : 'border-gray-200 hover:border-purple500-regular'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-text-xl text-black mb-4">Spesifikasjoner</h2>
            <div className="bg-white rounded-lg p-4 sm:p-6 space-y-2">
              <SpecificationRow 
                label="Strikkefasthet"
                value={project.tension}
              />
              <SpecificationRow 
                label="Bevegelsevidde"
                value={project.ease ? `${project.ease} cm` : null}
              />
              <SpecificationRow 
                label="Garn"
                value={project.yarn?.name ? `${project.yarn.name} (${project.yarn.type})` : null}
              />
              <SpecificationRow 
                label="Pinner"
                value={project.suggestedNeedles?.length ? project.suggestedNeedles.join(', ') : null}
              />
              <SpecificationRow 
                label="Teknikker"
                value={project.techniques?.length ? project.techniques.join(', ') : null}
              />
              
              {project.selectedSize && (
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <h3 className="font-medium mb-4">Mål for størrelse {project.selectedSize}</h3>
                  <div className="space-y-2">
                    <SpecificationRow 
                      label="Overvidde"
                      value={project.bustWidth?.[project.selectedSize] ? `${project.bustWidth[project.selectedSize]} cm` : null}
                    />
                    <SpecificationRow 
                      label="Lengde"
                      value={project.length?.[project.selectedSize] ? `${project.length[project.selectedSize]} cm` : null}
                    />
                    <SpecificationRow 
                      label="Garnmengde"
                      value={project.yarn?.amount?.[project.selectedSize] ? `${project.yarn.amount[project.selectedSize]} g` : null}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-text-xl text-black mb-4">Steg-for-steg guide</h2>
            <div className="space-y-4">
              {project.steps.map((step, index) => (
                <div key={index} className="bg-white rounded-lg p-6 relative">
                  <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-purple500-regular text-white flex items-center justify-center">
                    {index + 1}
                  </div>
                  <h3 className="font-text-base mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {Object.entries(step.stitchCounts || {}).reduce((text, [name, counts]) => {
                      const count = project.selectedSize && counts[project.selectedSize];
                      return text.replace(new RegExp(`\\[${name}\\]`, 'g'), count?.toString() || `[${name}]`);
                    }, step.description)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};