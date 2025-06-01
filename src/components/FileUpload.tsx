import React, { useRef, useState } from 'react';
import { Upload, Camera } from 'lucide-react';
import { Button } from './ui/button';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobileOrTablet = useMediaQuery('(max-width: 1024px)');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    const allowedPdfTypes = ['application/pdf'];
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
    
    if (allowedPdfTypes.includes(file.type) || allowedImageTypes.includes(file.type)) {
      onFileSelect(file);
    } else {
      alert('Please upload a PDF or image file (JPEG, PNG, HEIC)');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.capture = 'environment';
      fileInputRef.current.click();
    }
  };

  return (
    <div 
      className={`relative border-2 border-dashed rounded-lg p-6 text-center ${
        isDragging ? 'border-purple500-regular bg-purple100-light' : 'border-gray-300'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept=".pdf,image/*"
        className="hidden"
      />

      <div className="space-y-4">
        <div className="flex justify-center">
          <Upload className="w-12 h-12 text-gray-400" />
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            Dra og slipp en PDF eller bilde her, eller
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Velg fil
            </Button>
            
            {isMobileOrTablet && (
              <Button
                variant="outline"
                onClick={handleCameraCapture}
              >
                <Camera className="w-4 h-4 mr-2" />
                Ta bilde
              </Button>
            )}
          </div>
        </div>
        
        <p className="text-xs text-gray-500">
          Støtter PDF, JPEG, PNG og HEIC filer
        </p>
      </div>
    </div>
  );
}; 