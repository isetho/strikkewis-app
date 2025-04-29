import React from 'react';
import { ArrowLeft, ArrowRight, ChevronLeft, Plus, Minus, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Project, useProject } from '../../contexts/ProjectContext';

function getYouTubeEmbedUrl(url: string) {
  try {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

export const ProjectGuide = () => {
  const [activeStep, setActiveStep] = React.useState<number | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [newCounterName, setNewCounterName] = React.useState('');
  const [showNewCounter, setShowNewCounter] = React.useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { projects, updateProject } = useProject();
  const id = searchParams.get('id');
  const currentProject = projects.find(p => p.id === id);
  
  React.useEffect(() => {
    if (currentProject && activeStep === null) {
      setActiveStep(currentProject.currentStep);
      setProgress(currentProject.currentStep * (100 / (currentProject.steps.length - 1)));
    }
  }, [currentProject, activeStep]);

  React.useEffect(() => {
    if (currentProject && currentProject.status !== 'På pinnene') {
      updateProject({
        ...currentProject,
        status: 'På pinnene'
      });
    }
  }, [currentProject, updateProject]);
  const replaceStitchCounts = (text: string, stitchCounts?: Record<string, Record<string, number>>) => {
    if (!stitchCounts || !currentProject?.selectedSize) return text;
    
    let result = text;
    Object.entries(stitchCounts).forEach(([name, counts]) => {
      const count = counts[currentProject.selectedSize];
      if (count !== undefined) {
        result = result.replace(new RegExp(`\\[${name}\\]`, 'g'), count.toString());
      }
    });
    
    return result;
  };

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-[#fff7ff] p-4 sm:p-6 md:p-8">
        <div className="max-w-[640px] mx-auto">
          <h1 className="font-text-5xl text-black mb-8">Prosjekt ikke funnet</h1>
          <Button onClick={() => navigate('/')}>Tilbake til oversikt</Button>
        </div>
      </div>
    );
  }

  const steps = currentProject.steps;
  const currentStep = steps[activeStep ?? 0];

  if (!currentStep) {
    return <div>Step not found</div>;
  }

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
      const nextStep = activeStep + 1;
      setProgress(nextStep * (100 / (steps.length - 1)));
      if (currentProject) {
        updateProject({
          ...currentProject,
          currentStep: nextStep
        });
      }
    } else if (activeStep === steps.length - 1) {
      updateProject({
        ...currentProject,
        status: 'Ferdig'
      });
      navigate(`/project/${currentProject.id}`);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
      const prevStep = activeStep - 1;
      setProgress(prevStep * (100 / (steps.length - 1)));
      if (currentProject) {
        updateProject({
          ...currentProject,
          currentStep: prevStep
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fff7ff] p-4 sm:p-6 md:p-8">
      <div className="max-w-[640px] mx-auto">
        <button
          className="flex items-center gap-2 -ml-2 text-gray-600 hover:text-black mb-8"
          onClick={() => navigate(`/project/${id}`)}
        >
          <ChevronLeft className="w-4 h-4" />
          Tilbake til prosjekt
        </button>

        <h1 className="font-text-5xl text-black mb-8">
          {currentProject.title} 💜
        </h1>

        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-text-xl text-black">
              Progresjon
            </h2>
            <span className="text-sm text-gray-600">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex flex-wrap gap-4 mb-8 sm:mb-12">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`flex flex-col items-center gap-2 basis-1/2 sm:basis-auto sm:flex-1 ${
                index === (activeStep ?? 0) ? 'opacity-100' : 'opacity-50'
              }`}
              onClick={() => setActiveStep(index)}
              style={{ cursor: 'pointer' }}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index === (activeStep ?? 0)
                    ? 'bg-purple500-regular text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              <span className="text-sm text-center line-clamp-1" title={steps[index].title}>
                {steps[index].title}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 md:p-8 mb-8 min-h-[300px]">
          <h3 className="font-text-2xl mb-4">
            {currentStep.title}
          </h3>
          <p className="text-gray-600 mb-6 whitespace-pre-wrap">
            {replaceStitchCounts(currentStep.description, currentStep.stitchCounts)}
          </p>
          
          {/* Counters section */}
          <div className="space-y-4 mb-6">
            {currentStep.counters?.map((counter) => (
              <div key={counter.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 bg-gray-50 p-3 rounded-lg">
                <span className="font-medium flex-1">{counter.name}</span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      const updatedProject = { ...currentProject };
                      const counterIndex = updatedProject.steps[activeStep].counters?.findIndex(c => c.id === counter.id) ?? -1;
                      if (counterIndex !== -1 && updatedProject.steps[activeStep].counters) {
                        updatedProject.steps[activeStep].counters[counterIndex].value -= 1;
                        updateProject(updatedProject);
                      }
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{counter.value}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      const updatedProject = { ...currentProject };
                      const counterIndex = updatedProject.steps[activeStep].counters?.findIndex(c => c.id === counter.id) ?? -1;
                      if (counterIndex !== -1 && updatedProject.steps[activeStep].counters) {
                        updatedProject.steps[activeStep].counters[counterIndex].value += 1;
                        updateProject(updatedProject);
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                    onClick={() => {
                      const updatedProject = { ...currentProject };
                      updatedProject.steps[activeStep].counters = updatedProject.steps[activeStep].counters?.filter(c => c.id !== counter.id);
                      updateProject(updatedProject);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {showNewCounter ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCounterName}
                  onChange={(e) => setNewCounterName(e.target.value)}
                  placeholder="Navn på teller (f.eks. Raglanøkninger)"
                  className="flex-1 p-2 border rounded-lg"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (newCounterName.trim()) {
                      const updatedProject = { ...currentProject };
                      if (!updatedProject.steps[activeStep].counters) {
                        updatedProject.steps[activeStep].counters = [];
                      }
                      updatedProject.steps[activeStep].counters.push({
                        id: crypto.randomUUID(),
                        name: newCounterName.trim(),
                        value: 0
                      });
                      updateProject(updatedProject);
                      setNewCounterName('');
                      setShowNewCounter(false);
                    }
                  }}
                >
                  Legg til
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setNewCounterName('');
                    setShowNewCounter(false);
                  }}
                >
                  Avbryt
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowNewCounter(true)}
              >
                Legg til teller +
              </Button>
            )}
          </div>
          
          {currentStep.videoUrl && (
            <div className="aspect-video w-full rounded-lg overflow-hidden">
              <iframe
                src={getYouTubeEmbedUrl(currentStep.videoUrl)}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            disabled={(activeStep ?? 0) === 0}
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake
          </Button>
          <Button
            variant="default"
            onClick={handleNext}
          >
            {(activeStep ?? 0) === steps.length - 1 ? 'Fullfør prosjekt' : 'Neste'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};