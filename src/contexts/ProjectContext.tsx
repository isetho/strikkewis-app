import React, { createContext, useContext, useState } from 'react';

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
const DEFAULT_PROJECTS: Omit<Project, 'id'>[] = [{
  title: 'Nybegynnergenseren',
  description: 'En enkel og fin genser for nybegynnere. Perfekt som ditt første strikkeprosjekt!',
  image: undefined,
  difficulty: 'Nybegynner',
  availableSizes: ['S (36-38)', 'M (40-42)', 'L (44-46)'],
  selectedSize: 'M (40-42)',
  bustWidth: {
    'S (36-38)': 100,
    'M (40-42)': 110,
    'L (44-46)': 120
  },
  length: {
    'S (36-38)': 60,
    'M (40-42)': 62,
    'L (44-46)': 64
  },
  tension: '10 masker X 10 cm',
  ease: 20,
  suggestedNeedles: ['Rundpinne 6 (40cm, 100cm)', 'Rundpinne 7 (40cm, 60cm, 100cm)'],
  yarn: {
    name: 'Alpakka lin',
    amount: {
      'S (36-38)': 350,
      'M (40-42)': 400,
      'L (44-46)': 450
    },
    type: 'dobbel tråd'
  },
  techniques: [
    'Ovenfra og ned',
    'rett',
    'vrang',
    'vridd rett',
    'nedstrikk av hals',
    'raglan',
    'løkkeoppplegg',
    'plukke opp masker',
    'magic loop',
    'strømpepinner'
  ],
  gauge: '22 masker / 10 cm - Tynt garn',
  status: 'Ikke påbegynt',
  currentStep: 0,
  steps: [
    {
      title: 'Legg opp masker',
      description: 'Start med å legge opp 100 masker med pinner nr 4. Pass på at maskene ikke er for stramme.',
      videoUrl: 'https://www.youtube.com/watch?v=example1',
      sizeSpecificValues: [
        {
          placeholder: 'Halskant',
          values: {
            'S (36-38)': 90,
            'M (40-42)': 100,
            'L (44-46)': 110
          }
        }
      ]
    },
    {
      title: 'Strikk vrangbord',
      description: 'Strikk 1 rett, 1 vrang i 5 cm for å lage en fin vrangbord nederst på genseren.',
      videoUrl: 'https://www.youtube.com/watch?v=example2',
      sizeSpecificValues: [
        {
          placeholder: 'Vrangbord',
          values: {
            'S (36-38)': 90,
            'M (40-42)': 100,
            'L (44-46)': 110
          }
        }
      ]
    },
    {
      title: 'Strikk glattstrikk',
      description: 'Fortsett med glattstrikk (rett på retten, vrang på vrangen) til arbeidet måler 40 cm.',
      videoUrl: 'https://www.youtube.com/watch?v=example3',
      sizeSpecificValues: [
        {
          placeholder: 'Kropp',
          values: {
            'S (36-38)': 90,
            'M (40-42)': 100,
            'L (44-46)': 110
          }
        }
      ]
    }
  ]
}, {
  title: 'Cozy Høstvotter',
  description: 'Varme og myke votter med et vakkert mønster. Perfekte for kjølige høstdager!',
  image: undefined,
  difficulty: 'Middels',
  availableSizes: ['S (36-38)', 'M (40-42)', 'L (44-46)'],
  selectedSize: 'M (40-42)',
  bustWidth: {
    'S (36-38)': 20,
    'M (40-42)': 22,
    'L (44-46)': 24
  },
  length: {
    'S (36-38)': 25,
    'M (40-42)': 27,
    'L (44-46)': 29
  },
  tension: '26 masker X 10 cm',
  ease: 2,
  suggestedNeedles: ['Strømpepinner 3.5', 'Strømpepinner 4'],
  yarn: {
    name: 'Merino Soft',
    amount: {
      'S (36-38)': 100,
      'M (40-42)': 120,
      'L (44-46)': 140
    },
    type: 'enkel tråd'
  },
  techniques: [
    'magic loop',
    'strømpepinner',
    'mønsterstrikk',
    'flettestrikk',
    'tommel',
    'ribbestrikk'
  ],
  gauge: '26 masker / 10 cm - Ekstra tynt garn',
  status: 'Ikke påbegynt',
  currentStep: 0,
  steps: [
    {
      title: 'Legg opp masker',
      description: 'Start med å legge opp [Ribbekant] masker på strømpepinner 3.5. Fordel maskene jevnt på pinnene.',
      videoUrl: 'https://www.youtube.com/watch?v=example4',
      sizeSpecificValues: [
        {
          placeholder: 'Ribbekant',
          values: {
            'S (36-38)': 48,
            'M (40-42)': 52,
            'L (44-46)': 56
          }
        }
      ]
    },
    {
      title: 'Strikk ribb',
      description: 'Strikk 2 rett, 2 vrang i 5 cm for å lage en elastisk kant.',
      videoUrl: 'https://www.youtube.com/watch?v=example5',
      sizeSpecificValues: [
        {
          placeholder: 'Ribb',
          values: {
            'S (36-38)': 48,
            'M (40-42)': 52,
            'L (44-46)': 56
          }
        }
      ]
    },
    {
      title: 'Start mønster',
      description: 'Bytt til strømpepinner 4 og start mønsteret. Følg diagrammet for flettene.',
      videoUrl: 'https://www.youtube.com/watch?v=example6',
      sizeSpecificValues: [
        {
          placeholder: 'Mønster',
          values: {
            'S (36-38)': 48,
            'M (40-42)': 52,
            'L (44-46)': 56
          }
        }
      ]
    }
  ]
}];

export interface Project {
  id: string;
  title: string;
  description: string;
  image?: string;
  difficulty: 'Nybegynner' | 'Middels' | 'Avansert';
  availableSizes: string[];
  selectedSize: string;
  bustWidth: Record<string, number>;
  length: Record<string, number>;
  tension: string;
  ease: number;
  suggestedNeedles: string[];
  yarn: {
    name: string;
    amount: Record<string, number>;
    type: string;
  };
  techniques: string[];
  gauge: string;
  status: 'Ikke påbegynt' | 'På pinnene' | 'Ferdig';
  currentStep: number;
  isPublished?: boolean;
  steps: {
    title: string;
    description: string;
    videoUrl?: string;
    sizeSpecificValues: Array<{
      placeholder: string;
      values: Record<string, number>;
    }>;
    counters?: Array<{
      id: string;
      name: string;
      value: number;
    }>;
    stitchCounts?: Record<string, Record<string, number>>;
  }[];
}

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project) => void;
  addProject: (project: Omit<Project, 'id'>) => Project;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const MAX_PROJECTS = 10;
const MAX_RETRIES = 3;

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const savedProjects = localStorage.getItem('projects');
      if (savedProjects) {
        return JSON.parse(savedProjects);
      }
      return DEFAULT_PROJECTS.map(project => ({
        ...project,
        id: crypto.randomUUID()
      }));
    } catch (error) {
      console.error('Error loading projects from localStorage:', error);
      return [];
    }
  });
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  const addProject = (project: Omit<Project, 'id'>) => {
    // Check image size if present
    if (project.image) {
      const base64Size = (project.image.length * 3) / 4 - 
        (project.image.endsWith('==') ? 2 : project.image.endsWith('=') ? 1 : 0);
      
      if (base64Size > MAX_IMAGE_SIZE) {
        throw new Error('Image size exceeds 2MB limit. Please choose a smaller image.');
      }
    }

    const newProject = {
      ...project,
      id: crypto.randomUUID(),
    };

    let retryCount = 0;
    let success = false;

    while (retryCount < MAX_RETRIES && !success) {
      try {
        let updatedProjects = [...projects, newProject];
        
        // If we exceed the maximum number of projects, remove the oldest ones
        if (updatedProjects.length > MAX_PROJECTS) {
          updatedProjects = updatedProjects.slice(-MAX_PROJECTS);
        }

        localStorage.setItem('projects', JSON.stringify(updatedProjects));
        setProjects(updatedProjects);
        success = true;
        return newProject;
      } catch (error) {
        retryCount++;
        if (retryCount === MAX_RETRIES) {
          throw new Error('Could not save project. Storage limit reached. Try removing some existing projects.');
        }
        // Remove the oldest project and try again
        const reducedProjects = projects.slice(1);
        setProjects(reducedProjects);
      }
    }
    
    throw new Error('Could not save project after multiple attempts.');
  };

  const updateProject = (project: Project) => {
    // Check image size if present
    if (project.image) {
      const base64Size = (project.image.length * 3) / 4 - 
        (project.image.endsWith('==') ? 2 : project.image.endsWith('=') ? 1 : 0);
      
      if (base64Size > MAX_IMAGE_SIZE) {
        throw new Error('Image size exceeds 2MB limit. Please choose a smaller image.');
      }
    }

    try {
      const updatedProjects = projects.map(p => p.id === project.id ? project : p);
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
      setProjects(updatedProjects);
    } catch (error) {
      console.error('Error updating project:', error);
      throw new Error('Could not update project. Storage limit reached.');
    }
  };

  const deleteProject = (id: string) => {
    try {
      const updatedProjects = projects.filter(p => p.id !== id);
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
      setProjects(updatedProjects);
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw new Error('Could not delete project.');
    }
  };

  return (
    <ProjectContext.Provider value={{ projects, currentProject, setCurrentProject, addProject, updateProject, deleteProject }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};