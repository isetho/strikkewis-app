import React from 'react';
import { ChevronLeft, Pencil, Trash2, ChevronDown, Link as LinkIcon } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
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

export const DesignerProjectLanding = ({ project }: Props) => {
  const navigate = useNavigate();
  const { updateProject, deleteProject } = useProject();

  const handlePublishToggle = () => {
    updateProject({
      ...project,
      isPublished: !project.isPublished
    });
  };

  const handleGenerateMagicLink = () => {
    // This is a placeholder - implement actual magic link generation
    const magicLink = `${window.location.origin}/pattern/${project.id}`;
    navigator.clipboard.writeText(magicLink);
    alert('Magic link copied to clipboard!');
  };

  const replaceStitchCounts = (text: string, sizeSpecificValues?: Array<{
    placeholder: string;
    values: Record<string, number>;
  }>, stitchCounts?: Record<string, Record<string, number>>) => {
    if (!project.selectedSize) return text;
    
    let result = text;

    // Handle imported pattern format (sizeSpecificValues)
    if (sizeSpecificValues) {
      sizeSpecificValues.forEach(({ placeholder, values }) => {
        const value = values[project.selectedSize];
        if (value !== undefined) {
          result = result.replace(placeholder, value.toString());
        }
      });
    }

    // Handle manually created pattern format (stitchCounts)
    if (stitchCounts) {
      Object.entries(stitchCounts).forEach(([name, counts]) => {
        const count = counts[project.selectedSize];
        if (count !== undefined) {
          result = result.replace(new RegExp(`\\[${name}\\]`, 'g'), count.toString());
        }
      });
    }
    
    return result;
  };

  return (
    <div className="min-h-screen bg-[#fff7ff] p-4 sm:p-6 md:p-8">
      <div className="max-w-[640px] mx-auto">
        <button
          className="flex items-center gap-2 -ml-2 text-gray-600 hover:text-black mb-8"
          onClick={() => navigate('/designer-projects')}
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
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handlePublishToggle}
            >
              {project.isPublished ? 'Avpubliser' : 'Publiser'}
            </Button>
            
            {project.isPublished && (
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleGenerateMagicLink}
              >
                <LinkIcon className="w-4 h-4" />
                Kopier lenke
              </Button>
            )}

            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => navigate(`/create-recipe?edit=${project.id}`)}
            >
              <Pencil className="w-4 h-4" />
              Rediger
            </Button>
          </div>
        </div>

        <div className="bg-[#FFFFF0] rounded-xl p-8 space-y-8">
          <div>
            <h2 className="font-text-xl text-black mb-4">Tilgjengelige størrelser</h2>
            <div className="grid grid-cols-2 gap-2">
              {project.availableSizes.map((size) => (
                <div
                  key={size}
                  className="p-3 rounded-lg border border-gray-200"
                >
                  {size}
                </div>
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
                    {replaceStitchCounts(step.description, step.sizeSpecificValues, step.stitchCounts)}
                  </p>
                  {step.stitchCounts && Object.keys(step.stitchCounts).length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {Object.entries(step.stitchCounts).map(([name, counts]) => (
                        <div key={name}>
                          {name}: {Object.entries(counts)
                            .map(([size, count]) => `${size}: ${count}`)
                            .join(', ')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Fjern oppskrift
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Dette vil permanent fjerne oppskriften fra dine prosjekter. Denne handlingen kan ikke angres.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      deleteProject(project.id);
                      navigate('/designer-projects');
                    }}
                  >
                    Fjern
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
};