import React, { useState } from 'react';
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
import { v4 as uuidv4 } from 'uuid';

export const UploadPatternModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { addProject } = useProject();

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    try {
      const isPDF = file.type === 'application/pdf';
      const extracted = isPDF
        ? await extractTextFromPDF(file)
        : await extractTextFromImage(file);

      const fileUrl = URL.createObjectURL(file);
      const projectData = convertExtractedToProject(extracted, {
        type: file.type,
        url: fileUrl
      });

      addProject({
        id: uuidv4(),
        ...projectData
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Det oppstod en feil under prosessering av filen. Vennligst prøv igjen.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Last opp oppskrift</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Last opp oppskrift</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <FileUpload onFileSelect={handleFileSelect} />
          {isProcessing && (
            <div className="text-center text-sm text-gray-500">
              Prosesserer fil...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 