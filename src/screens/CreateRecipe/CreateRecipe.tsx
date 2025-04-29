import React, { useState } from 'react';
import { ChevronLeft, Trash2, X, Pencil, Save } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProject, Project } from '../../contexts/ProjectContext';
import { defaultKnittingImage } from '../../constants';

const sizes = [
  'XS (32-34)',
  'S (36-38)',
  'M (40-42)',
  'L (44-46)',
  'XL (48-50)',
  'XXL (52-54)',
];

const gauges = [
  '14 masker / 10 cm - Ekstra tykt garn',
  '12 masker / 10 cm - Tykt garn',
  '10 masker / 10 cm - Tykt garn',
  '8 masker / 10 cm - Ekstra tykt garn',
  '18 masker / 10 cm - Middels tykt garn',
  '22 masker / 10 cm - Tynt garn',
  '26 masker / 10 cm - Ekstra tynt garn',
  '30 masker / 10 cm - Fingering garn',
];

interface Step {
  title: string;
  description: string;
  videoUrl?: string;
  stitchCounts?: Record<string, Record<string, number>>;
}

export const CreateRecipe = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addProject, projects, updateProject } = useProject();
  const editId = searchParams.get('edit');
  const isEditing = Boolean(editId);

  const defaultFormData = {
    title: '',
    description: '',
    image: undefined as string | undefined,
    difficulty: 'Nybegynner' as Project['difficulty'],
    availableSizes: [] as string[],
    selectedSize: sizes[1],
    gauge: gauges[0],
    bustWidth: {} as Record<string, number>,
    length: {} as Record<string, number>,
    tension: '',
    ease: 0,
    suggestedNeedles: [] as string[],
    yarn: {
      name: '',
      amount: {} as Record<string, number>,
      type: ''
    },
    techniques: [] as string[],
    steps: [
      {
        title: '',
        description: '',
        videoUrl: '',
        stitchCounts: {}
      }
    ] as Step[],
  };

  interface EditingState {
    [key: string]: boolean;
  }

  const [formData, setFormData] = useState(defaultFormData);
  const [error, setError] = useState<string | null>(null);
  const [editingStitchCounts, setEditingStitchCounts] = useState<EditingState>({});
  const [initialStitchValues, setInitialStitchValues] = useState<Record<string, any>>({});
  const nameInputRef = React.useRef<HTMLInputElement>(null);
  const saveButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (editId) {
      const projectToEdit = projects.find(p => p.id === editId);
      if (projectToEdit) {
        setFormData({
          ...defaultFormData,
          ...projectToEdit,
          availableSizes: projectToEdit.availableSizes || [],
          selectedSize: projectToEdit.selectedSize || sizes[1],
          gauge: projectToEdit.gauge || gauges[2],
          bustWidth: projectToEdit.bustWidth || {},
          length: projectToEdit.length || {},
          steps: projectToEdit.steps?.length > 0 
            ? projectToEdit.steps 
            : [{ title: '', description: '', videoUrl: '' }],
          yarn: {
            name: projectToEdit.yarn?.name || '',
            amount: projectToEdit.yarn?.amount || {},
            type: projectToEdit.yarn?.type || 'dobbel tråd'
          }
        });
      }
    }
  }, [editId, projects]);

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { title: '', description: '', videoUrl: '', stitchCounts: {} }]
    }));
  };

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const updateStep = (index: number, field: keyof Step, value: string) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => {
        if (i === index) {
          return {
            ...step,
            [field]: value
          };
        }
        return step;
      })
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (isEditing && editId) {
        const existingProject = projects.find(p => p.id === editId);
        if (existingProject) {
          const updatedProject = {
            ...existingProject,
            ...formData,
          };
          updateProject(updatedProject);
          navigate(`/project/${editId}`);
        }
      } else {
        const newProject = addProject({
          ...formData,
          status: 'Ikke påbegynt',
          currentStep: 0,
        });
        navigate(`/project/${newProject.id}`);
      }
    } catch (err) {
      setError((err as Error).message);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff7ff] p-4 sm:p-6 md:p-8">
      <div className="max-w-[640px] mx-auto">
        <button
          className="flex items-center gap-2 -ml-2 text-gray-600 hover:text-black mb-8"
          onClick={() => navigate('/')}
        >
          <ChevronLeft className="w-4 h-4" />
          Tilbake til oversikt
        </button>

        <h1 className="font-text-5xl text-black mb-8">
          {isEditing ? 'Rediger strikkeoppskrift ✨' : 'Lag ny strikkeoppskrift ✨'}
        </h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#FFFFF0] rounded-xl p-4 sm:p-6 md:p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Last opp et bilde
              </label>
              <div className="flex flex-col items-center justify-center w-full">
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50"
                >
                  {formData.image ? (
                    <img
                      src={formData.image}
                      alt="Project preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Velg fra filer</span>
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG opp til 2MB</p>
                    </div>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          setError('Image size exceeds 2MB limit. Please choose a smaller image.');
                          e.target.value = '';
                          return;
                        }
                        setError(null);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData(prev => ({
                            ...prev,
                            image: reader.result as string
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Navn på prosjekt
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-3 border rounded-lg bg-white hover:border-purple500-regular focus:border-purple500-regular focus:outline-none"
                placeholder="F.eks. Enkel raglanjakke 🌸"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Beskrivelse
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 border rounded-lg bg-white hover:border-purple500-regular focus:border-purple500-regular focus:outline-none min-h-[100px]"
                placeholder="Beskriv strikkeprosjektet. F.eks: En enkel og fin raglanjakke strikket ovenfra og ned..."
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:flex-1">
                <label className="block text-sm text-gray-600 mb-2">
                  Vanskelighetsgrad
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as Project['difficulty'] })}
                  className="w-full p-3 border rounded-lg bg-white hover:border-purple500-regular focus:border-purple500-regular focus:outline-none"
                >
                  <option value="Nybegynner">Nybegynner</option>
                  <option value="Middels">Middels</option>
                  <option value="Avansert">Avansert</option>
                </select>
              </div>

              <div className="w-full sm:flex-1">
                <label className="block text-sm text-gray-600 mb-2">
                  Tilgjengelige størrelser
                </label>
                <div className="space-y-2">
                  {sizes.map((size) => (
                    <label key={size} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.availableSizes.includes(size)}
                        onChange={(e) => {
                          const newSizes = e.target.checked
                            ? [...formData.availableSizes, size]
                            : formData.availableSizes.filter(s => s !== size);
                          setFormData({ ...formData, availableSizes: newSizes });
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-purple500-regular focus:ring-purple500-regular"
                      />
                      <span className="text-gray-700">{size}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Velg hvilke størrelser denne oppskriften er tilgjengelig i
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Strikkefasthet
              </label>
              <select
                value={formData.gauge}
                onChange={(e) => setFormData({ ...formData, gauge: e.target.value })}
                className="w-full p-3 border rounded-lg bg-white hover:border-purple500-regular focus:border-purple500-regular focus:outline-none"
              >
                {gauges.map((gauge) => (
                  <option key={gauge} value={gauge}>{gauge}</option>
                ))}
              </select>
            </div>

            <div className="space-y-6 border-t border-gray-200 pt-6">
              <h3 className="font-text-xl text-black">Mål og spesifikasjoner</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.availableSizes.map(size => (
                  <div key={size} className="space-y-4">
                    <h4 className="font-semibold">{size}</h4>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">
                        Overvidde (cm)
                      </label>
                      <input
                        type="number"
                        value={formData.bustWidth[size] || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          setFormData(prev => ({
                            ...prev,
                            bustWidth: {
                              ...prev.bustWidth,
                              [size]: value
                            }
                          }));
                        }}
                        className="w-full p-3 border rounded-lg"
                        placeholder="F.eks. 100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-2">
                        Lengde (cm)
                      </label>
                      <input
                        type="number"
                        value={formData.length[size] || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          setFormData(prev => ({
                            ...prev,
                            length: {
                              ...prev.length,
                              [size]: value
                            }
                          }));
                        }}
                        className="w-full p-3 border rounded-lg"
                        placeholder="F.eks. 60"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-2">
                        Garnmengde (g)
                      </label>
                      <input
                        type="number"
                        value={formData.yarn.amount[size] || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          setFormData(prev => ({
                            ...prev,
                            yarn: {
                              ...prev.yarn,
                              amount: {
                                ...prev.yarn.amount,
                                [size]: value
                              }
                            }
                          }));
                        }}
                        className="w-full p-3 border rounded-lg"
                        placeholder="F.eks. 350"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Bevegelsevidde (cm)
                </label>
                <input
                  type="number"
                  value={formData.ease}
                  onChange={(e) => setFormData({ ...formData, ease: parseInt(e.target.value) })}
                  className="w-full p-3 border rounded-lg"
                  placeholder="F.eks. 20"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Plagget sin overvidde skal bli ca. dette antall cm videre enn ditt brystmål
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Garn
                </label>
                <input
                  type="text"
                  value={formData.yarn.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    yarn: {
                      ...prev.yarn,
                      name: e.target.value
                    }
                  }))}
                  className="w-full p-3 border rounded-lg"
                  placeholder="F.eks. Alpakka lin"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Foreslåtte pinner
                </label>
                <input
                  type="text"
                  value={formData.suggestedNeedles.join(', ')}
                  onChange={(e) => setFormData({
                    ...formData,
                    suggestedNeedles: e.target.value.split(',').map(s => s.trim())
                  })}
                  className="w-full p-3 border rounded-lg"
                  placeholder="F.eks. Rundpinne 6 (40cm, 100cm), Rundpinne 7 (40cm, 60cm, 100cm)"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Teknikker
                </label>
                <input
                  type="text"
                  value={formData.techniques.join(', ')}
                  onChange={(e) => setFormData({
                    ...formData,
                    techniques: e.target.value.split(',').map(s => s.trim())
                  })}
                  className="w-full p-3 border rounded-lg"
                  placeholder="F.eks. rett, vrang, raglan"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Skriv inn teknikkene separert med komma
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-text-xl text-black">Steg-for-steg guide</h3>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={addStep}
                  className="text-sm"
                >
                  Legg til steg +
                </Button>
              </div>
              
              <div className="space-y-6">
                {formData.steps.map((step, index) => (
                  <div key={index} className="bg-white rounded-lg p-6 relative">
                    <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-purple500-regular text-white flex items-center justify-center">
                      {index + 1}
                    </div>
                    
                    {formData.steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">
                          Tittel på steg
                        </label>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => updateStep(index, 'title', e.target.value)}
                          className="w-full p-3 border rounded-lg bg-white hover:border-purple500-regular focus:border-purple500-regular focus:outline-none"
                          placeholder={`F.eks. Steg ${index + 1}: Legg opp masker`}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">
                          Beskrivelse
                        </label>
                        <p className="text-xs text-gray-500 mb-2 italic">
                          Tips: Bruk [navn] i teksten for å vise antall masker for valgt størrelse, der "navn" er navnet på maskegruppen
                        </p>
                        <textarea
                          value={step.description}
                          onChange={(e) => updateStep(index, 'description', e.target.value)}
                          className="w-full p-3 border rounded-lg bg-white hover:border-purple500-regular focus:border-purple500-regular focus:outline-none min-h-[100px]"
                          placeholder="Beskriv hva som skal gjøres i dette steget..."
                          required
                        />
                        
                        <div className="mt-4">
                          <label className="block text-sm text-gray-600 mb-2">
                            Maskegrupper
                          </label>
                          <div className="space-y-4">
                            {Object.entries(step.stitchCounts || {}).map(([name, counts]) => (
                              <div key={name} className="bg-gray-50 p-3 sm:p-4 rounded-lg relative">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex-1 mr-2 sm:mr-4">
                                  {editingStitchCounts[`${index}-${name}`] ? (
                                    <input
                                      ref={nameInputRef}
                                      type="text"
                                      defaultValue={name}
                                      className="w-full p-3 border rounded-lg bg-white focus:border-purple500-regular focus:ring-1 focus:ring-purple500-regular focus:outline-none transition-colors"
                                      placeholder="Navn på maskegruppe (f.eks. 'Halskant')"
                                    />
                                  ) : (
                                    <span className="block p-3 text-gray-700">{name}</span>
                                  )}
                                  </div>
                                  <div className="flex gap-3">
                                    {editingStitchCounts[`${index}-${name}`] ? (
                                      <Button
                                        ref={saveButtonRef}
                                        type="button"
                                        variant="outline"
                                        className="shrink-0"
                                        onClick={() => {
                                          if (nameInputRef.current) {
                                            const newName = nameInputRef.current.value;
                                            const newStitchCounts = { ...step.stitchCounts };
                                            delete newStitchCounts[name];
                                            newStitchCounts[newName] = counts;
                                            setFormData(prev => ({
                                              ...prev,
                                              steps: prev.steps.map((s, i) => 
                                                i === index ? { ...s, stitchCounts: newStitchCounts } : s
                                              )
                                            }));
                                            setEditingStitchCounts(prev => ({
                                              ...prev,
                                              [`${index}-${newName}`]: false
                                            }));
                                          }
                                        }}
                                      >
                                        <Save className="w-4 h-4 mr-2" />
                                        Lagre
                                      </Button>
                                    ) : (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="shrink-0"
                                        onClick={() => {
                                          setEditingStitchCounts(prev => ({
                                            ...prev,
                                            [`${index}-${name}`]: true
                                          }));
                                          setInitialStitchValues({
                                            name,
                                            counts: { ...counts }
                                          });
                                          // Focus the input after a short delay to ensure it's mounted
                                          setTimeout(() => {
                                            if (nameInputRef.current) {
                                              nameInputRef.current.focus();
                                            }
                                          }, 0);
                                        }}
                                      >
                                        <Pencil className="w-4 h-4 mr-2" />
                                        Rediger
                                      </Button>
                                    )}
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="shrink-0 hover:bg-red-100 hover:text-red-500 hover:border-red-500"
                                      onClick={() => {
                                        const newStitchCounts = { ...step.stitchCounts };
                                        delete newStitchCounts[name];
                                        setFormData(prev => ({
                                          ...prev,
                                          steps: prev.steps.map((s, i) => 
                                            i === index ? { ...s, stitchCounts: newStitchCounts } : s
                                          )
                                        }));
                                        setEditingStitchCounts(prev => {
                                          const next = { ...prev };
                                          delete next[`${index}-${name}`];
                                          return next;
                                        });
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  {formData.availableSizes.map((size) => (
                                    <div key={size}>
                                      <label className="block text-sm text-gray-600 mb-2">{size}</label>
                                      <input
                                        type="number"
                                        value={counts[size] || ''}
                                        onChange={(e) => {
                                          const value = e.target.value ? parseInt(e.target.value) : undefined;
                                          // Create a new copy of the counts object
                                          const newCounts = { ...counts };
                                          if (value === undefined) {
                                            delete newCounts[size];
                                          } else {
                                            newCounts[size] = value;
                                          }
                                          setFormData(prev => ({
                                            ...prev,
                                            steps: prev.steps.map((s, i) => 
                                              i === index ? {
                                                ...s,
                                                stitchCounts: {
                                                  ...s.stitchCounts,
                                                 [name]: newCounts
                                                }
                                              } : s
                                            )
                                          }));
                                        }}
                                        className={`w-full p-3 border rounded-lg transition-colors ${
                                          editingStitchCounts[`${index}-${name}`]
                                            ? 'bg-white focus:border-purple500-regular focus:ring-1 focus:ring-purple500-regular focus:outline-none'
                                            : 'bg-gray-100'
                                
                                        }`}
                                        readOnly={!editingStitchCounts[`${index}-${name}`]}
                                        placeholder="Antall"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full p-3 border rounded-lg bg-white hover:border-purple500-regular focus:border-purple500-regular focus:outline-none"
                              onClick={() => {
                                const newStitchCounts = { ...step.stitchCounts };
                                const newName = `Gruppe ${Object.keys(newStitchCounts).length + 1}`;
                                newStitchCounts[newName] = {};
                                setFormData(prev => ({
                                  ...prev,
                                  steps: prev.steps.map((s, i) => 
                                    i === index ? { ...s, stitchCounts: newStitchCounts } : s
                                  )
                                }));
                                setEditingStitchCounts(prev => ({
                                  ...prev,
                                  [`${index}-${newName}`]: true
                                }));
                              }}
                            >
                              Legg til maskegruppe +
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <Button type="submit" className="w-full md:w-auto">
                {isEditing ? 'Lagre endringer' : 'Lagre oppskrift'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};