import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { FileUpload } from './FileUpload';
import { extractTextFromPDF, extractTextFromImage, convertExtractedToProject } from '../services/textExtraction';
import { useProject } from '../contexts/ProjectContext';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle } from 'lucide-react';
import { Progress } from './ui/progress';

type ProcessingStage = 'idle' | 'loading' | 'extracting' | 'analyzing' | 'saving';

export const UploadPatternModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<ProcessingStage>('idle');
  const [progress, setProgress] = useState(0);
  const { addProject } = useProject();

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setProgress(0);
      setStage('idle');
      setIsProcessing(false);
    }
  }, [isOpen]);

  const getProgressPercentage = (stage: ProcessingStage) => {
    switch (stage) {
      case 'idle': return 0;
      case 'loading': return 25;
      case 'extracting': return 50;
      case 'analyzing': return 75;
      case 'saving': return 90;
      default: return 0;
    }
  };

  const getStageMessage = (stage: ProcessingStage) => {
    switch (stage) {
      case 'loading': return 'Laster inn fil...';
      case 'extracting': return 'Henter ut tekst fra fil...';
      case 'analyzing': return 'Analyserer oppskrift...';
      case 'saving': return 'Lagrer oppskrift...';
      default: return 'Prosesserer fil...';
    }
  };

  const handleFileSelect = async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);
      setStage('loading');
      setProgress(getProgressPercentage('loading'));
      
      // Force a re-render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const isPDF = file.type === 'application/pdf';
      setStage('extracting');
      setProgress(getProgressPercentage('extracting'));
      
      const extracted = isPDF
        ? await extractTextFromPDF(file)
        : await extractTextFromImage(file);

      setStage('analyzing');
      setProgress(getProgressPercentage('analyzing'));

      const fileUrl = URL.createObjectURL(file);
      const projectData = convertExtractedToProject(extracted, {
        type: file.type,
        url: fileUrl
      });

      setStage('saving');
      setProgress(getProgressPercentage('saving'));
      await addProject(projectData);
      
      setProgress(100);
      setTimeout(() => setIsOpen(false), 500); // Give user time to see completion
    } catch (error) {
      console.error('Error processing file:', error);
      setError(error instanceof Error ? error.message : 'Det oppstod en feil under prosessering av filen. Vennligst prøv igjen.');
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setError(null);
      setProgress(0);
      setStage('idle');
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setIsOpen(true)}>
          Last opp oppskrift
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Last opp oppskrift</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FileUpload onFileSelect={handleFileSelect} />
          <div className="space-y-3">
            {isProcessing && <Progress value={progress} className="w-full" />}
            <p className="text-center text-sm text-gray-500">
              {isProcessing ? getStageMessage(stage) : 'Støtter PDF, JPEG, PNG og HEIC filer'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 