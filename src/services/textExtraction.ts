import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { Project } from '../contexts/ProjectContext';
import { extractPatternFromText } from './api';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.js`;

interface Measurements {
  overvidde: string[];
  lengde: string[];
  [key: string]: string[];
}

interface Gauge {
  stitches_per_10cm?: number;
  rows_per_10cm?: number;
  needle_size?: string;
  technique?: string;
}

interface YarnAmount {
  [yarnName: string]: string[];
}

interface ExtractedPattern {
  title: string;
  description: string;
  difficulty: 'Nybegynner' | 'Middels' | 'Avansert';
  sizes: string[];
  measurements: Measurements;
  gauge: Gauge;
  needles: string[];
  yarn: string[];
  yarnAmounts: YarnAmount;
  steps: {
    title: string;
    description: string;
    sizeSpecificValues: Array<{
      placeholder: string;
      values: Record<string, number>;
    }>;
  }[];
}

async function extractTextFromPage(page: pdfjsLib.PDFPageProxy): Promise<string> {
  try {
    // Method 1: Standard text extraction
    const textContent = await page.getTextContent();
    
    let text = textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .trim();

    // Clean up separator lines
    text = text.replace(/[-_=]{3,}/g, '').trim();

    // If we got text, return it
    if (text.length > 0) {
      return text;
    }

    // Method 2: Try getting raw text content
    const operatorList = await page.getOperatorList();
    const textItems = operatorList.fnArray
      .map((fn, index) => {
        if (fn === pdfjsLib.OPS.showText || fn === pdfjsLib.OPS.showSpacedText) {
          return operatorList.argsArray[index][0];
        }
        return '';
      })
      .filter(Boolean)
      .join(' ')
      .replace(/[-_=]{3,}/g, '') // Clean up separator lines
      .trim();

    if (textItems.length > 0) {
      return textItems;
    }

    // Method 3: OCR as last resort
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (context) {
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      const worker = await Tesseract.createWorker('nor');
      try {
        const { data: { text: ocrText } } = await worker.recognize(canvas.toDataURL('image/png'));
        return ocrText.replace(/[-_=]{3,}/g, '').trim(); // Clean up separator lines
      } finally {
        await worker.terminate();
      }
    }

    return '';
  } catch (error) {
    console.error('Error extracting text from page:', error);
    return '';
  }
}

export async function extractTextFromPDF(file: File): Promise<any> {
  try {
    console.log('Starting PDF extraction for file:', file.name);
    const arrayBuffer = await file.arrayBuffer();
    console.log('File loaded as ArrayBuffer');

    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      disableFontFace: true,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.2.133/cmaps/',
      cMapPacked: true,
    });

    const pdf = await loadingTask.promise;
    console.log(`PDF loaded successfully. Number of pages: ${pdf.numPages}`);
    
    let pageTexts: string[] = [];

    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i} of ${pdf.numPages}`);
      const page = await pdf.getPage(i);
      const pageText = await extractTextFromPage(page);
      
      if (pageText.trim()) {
        pageTexts.push(pageText.trim());
        console.log(`Successfully extracted text from page ${i}, length: ${pageText.length}`);
      } else {
        console.log(`No text extracted from page ${i}`);
      }
    }

    // Combine all page texts with proper spacing
    const fullText = pageTexts.join('\n\n');

    if (!fullText.trim()) {
      console.error('No text could be extracted from any page');
      throw new Error('No text could be extracted from the PDF. The file might be protected or in an unsupported format.');
    }

    console.log('Full text extracted successfully. Length:', fullText.length);
    return await extractPatternFromText(fullText);
  } catch (error: unknown) {
    console.error('Detailed error in PDF extraction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Could not process the PDF file: ${errorMessage}`);
  }
}

export async function extractTextFromImage(file: File): Promise<any> {
  const worker = await Tesseract.createWorker('nor');
  
  try {
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    // Clean up separator lines before parsing
    const cleanedText = text.replace(/[-_=]{3,}/g, '').trim();
    return await extractPatternFromText(cleanedText);
  } catch (error) {
    await worker.terminate();
    throw error;
  }
}

function extractSizesArray(text: string): string[] {
  const sizesMatch = text.match(/(?:Størrelser|Størrelse):?\s*([^\n]+)/i);
  if (!sizesMatch) return [];

  const sizesText = sizesMatch[1].trim();
  return sizesText
    .split(/[,\s]+/)
    .map(size => size.trim())
    .filter(size => size && !/^(?:cm|år|mnd)$/i.test(size));
}

function extractNumberArray(text: string, sizes: string[]): string[] {
  if (!text || !sizes.length) return [];

  // Split the measurements while preserving the alternating pattern
  const measurements: string[] = [];
  let currentNumber = '';
  let inParentheses = false;
  let numberCount = 0;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '(') {
      inParentheses = true;
      currentNumber = '';
    } else if (char === ')') {
      inParentheses = false;
      if (currentNumber.trim()) {
        measurements.push(currentNumber.trim());
        numberCount++;
        if (numberCount >= sizes.length) break; // Stop if we have enough numbers
      }
      currentNumber = '';
    } else if (/\s/.test(char) && !inParentheses && currentNumber.trim()) {
      measurements.push(currentNumber.trim());
      numberCount++;
      if (numberCount >= sizes.length) break; // Stop if we have enough numbers
      currentNumber = '';
    } else if (/[\d.-]/.test(char)) { // Also allow hyphens for ranges like "450-500"
      currentNumber += char;
    }
  }
  
  // Add the last measurement if there is one and we still need more
  if (currentNumber.trim() && numberCount < sizes.length) {
    measurements.push(currentNumber.trim());
  }

  // Only return the exact number of measurements we need
  return measurements.slice(0, sizes.length);
}

function extractGauge(text: string): Gauge {
  const gauge: Gauge = {};
  
  // Look for stitch and row gauge
  const gaugePattern = /Strikkefasthet:?\s*(\d+)\s*m\s*[xX]\s*(\d+)\s*p/i;
  const gaugeMatch = text.match(gaugePattern);
  if (gaugeMatch) {
    gauge.stitches_per_10cm = parseInt(gaugeMatch[1]);
    gauge.rows_per_10cm = parseInt(gaugeMatch[2]);
  }
  
  // Look for needle size
  const needlePattern = /(?:på|med)\s*p(?:inne)?\s*(\d+(?:[,.]\d+)?)\s*(?:mm)/i;
  const needleMatch = text.match(needlePattern);
  if (needleMatch) {
    gauge.needle_size = needleMatch[1] + ' mm';
  }
  
  // Look for technique
  const techniquePattern = /(?:i|med)\s*(glattstrikk|rillestrikk|mønster)/i;
  const techniqueMatch = text.match(techniquePattern);
  if (techniqueMatch) {
    gauge.technique = techniqueMatch[1].toLowerCase();
  }
  
  return gauge;
}

function extractSizeSpecificNumbers(text: string, sizes: string[]): { 
  originalText: string, 
  numberMappings: Array<{
    placeholder: string,
    values: Record<string, number>
  }>
} {
  const numberMappings: Array<{
    placeholder: string,
    values: Record<string, number>
  }> = [];
  
  let modifiedText = text;
  let mappingIndex = 0;

  // First, find all measurement patterns (number followed by 'cm')
  const measurementRegex = /\d+(?:\s*\(\s*\d+(?:\s*,\s*\d+)*\s*\))+(?:\s+\d+)?\s*(?:cm|m|mm|g|meter)?/g;
  let match;

  while ((match = measurementRegex.exec(text)) !== null) {
    const numberSequence = match[0];
    const numbers = numberSequence.match(/\d+/g)?.map(Number) || [];
    
    // Only process if we have enough numbers for all sizes
    if (numbers.length >= sizes.length) {
      const values: Record<string, number> = {};
      
      // Map numbers to sizes
      sizes.forEach((size, i) => {
        if (i < numbers.length) {
          values[size] = numbers[i];
        }
      });

      const placeholder = `{count_${mappingIndex}}`;
      numberMappings.push({
        placeholder,
        values
      });

      // Replace the number sequence with the placeholder, preserving any units
      const unit = numberSequence.match(/(cm|m|mm|g|meter)$/)?.[0] || '';
      modifiedText = modifiedText.replace(
        new RegExp(`(?<=[\\s\\n]|^)${numberSequence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[\\s\\n]|$)`),
        `${placeholder}${unit ? ' ' + unit : ''}`
      );
      mappingIndex++;
    }
  }

  // Then find all other number sequences (like stitch counts)
  const stitchRegex = /\d+(?:\s*\(\s*\d+(?:\s*,\s*\d+)*\s*\))+(?:\s+\d+)?(?!\s*(?:cm|m|mm|g|meter))/g;
  
  while ((match = stitchRegex.exec(text)) !== null) {
    const numberSequence = match[0];
    const numbers = numberSequence.match(/\d+/g)?.map(Number) || [];
    
    if (numbers.length >= sizes.length) {
      const values: Record<string, number> = {};
      
      sizes.forEach((size, i) => {
        if (i < numbers.length) {
          values[size] = numbers[i];
        }
      });

      const placeholder = `{count_${mappingIndex}}`;
      numberMappings.push({
        placeholder,
        values
      });

      modifiedText = modifiedText.replace(
        new RegExp(`(?<=[\\s\\n]|^)${numberSequence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[\\s\\n]|$)`),
        placeholder
      );
      mappingIndex++;
    }
  }

  // Preserve line breaks but normalize to single newlines
  modifiedText = modifiedText.replace(/\r\n/g, '\n').replace(/\n\n+/g, '\n');

  return {
    originalText: modifiedText,
    numberMappings
  };
}

function parseKnittingPattern(text: string): ExtractedPattern {
  // Initialize pattern with default values
  const pattern: ExtractedPattern = {
    title: '',
    description: '',
    difficulty: 'Middels',
    sizes: [],
    measurements: {
      overvidde: [],
      lengde: []
    },
    gauge: {},
    needles: [],
    yarn: [],
    yarnAmounts: {},
    steps: []
  };

  // Split text into sections while preserving original line breaks
  const sections = text.split(/(?:\r?\n){2,}/).map(section => section.trim()).filter(Boolean);
  
  // Extract title (first non-empty line)
  for (const section of sections) {
    const lines = section.trim().split(/\r?\n/);
    if (lines[0] && !pattern.title) {
      pattern.title = lines[0].trim();
      break;
    }
  }

  // Extract sizes from the "Størrelser" section if present
  const sizesSection = sections.find(section => 
    section.toLowerCase().startsWith('størrelser') ||
    section.toLowerCase().includes('størrelse:')
  );
  if (sizesSection) {
    pattern.sizes = extractSizesArray(sizesSection);
  }

  // Process sections into steps, preserving original text and formatting
  let currentStep: typeof pattern.steps[0] | null = null;
  
  for (const section of sections) {
    const lines = section.split(/\r?\n/);
    const firstLine = lines[0].trim();
    
    // Check if this looks like a step header
    if (
      firstLine &&
      (firstLine.endsWith(':') ||
       /^[A-ZÆØÅ]/.test(firstLine) ||
       /^(?:Bærestykke|Bol|Ermer|Montering|Halskant|Vrangbord|Ermekant)/i.test(firstLine))
    ) {
      // If we have a current step, process its numbers and add it
      if (currentStep) {
        const { originalText, numberMappings } = extractSizeSpecificNumbers(
          currentStep.description,
          pattern.sizes
        );
        currentStep.description = originalText;
        currentStep.sizeSpecificValues = numberMappings;
        pattern.steps.push(currentStep);
      }
      
      // Start a new step, preserving the exact original text
      currentStep = {
        title: firstLine,
        description: lines.slice(1).join('\n').trim(),
        sizeSpecificValues: []
      };
    } else if (currentStep) {
      // Append to current step, preserving exact formatting including single line breaks
      currentStep.description += '\n' + section.trim();
    }
  }

  // Process and add the last step if we have one
  if (currentStep) {
    const { originalText, numberMappings } = extractSizeSpecificNumbers(
      currentStep.description,
      pattern.sizes
    );
    currentStep.description = originalText;
    currentStep.sizeSpecificValues = numberMappings;
    pattern.steps.push(currentStep);
  }

  // If no steps were found, use all content as a single step
  if (pattern.steps.length === 0 && sections.length > 0) {
    const { originalText, numberMappings } = extractSizeSpecificNumbers(
      sections.join('\n'),
      pattern.sizes
    );
    pattern.steps.push({
      title: 'Fremgangsmåte',
      description: originalText,
      sizeSpecificValues: numberMappings
    });
  }

  return pattern;
}

function extractStitchCounts(
  stepText: string,
  sizes: string[]
): Record<string, Record<string, number>> | undefined {
  const counts: Record<string, Record<string, number>> = {};
  
  // Look for numbers followed by size indicators
  const numberPatterns = stepText.match(/(\d+)\s*(?:m(?:asker)?)?(?:\s*\((.*?)\))?/g);
  if (!numberPatterns) return undefined;

  numberPatterns.forEach(pattern => {
    const number = parseInt(pattern.match(/\d+/)?.[0] || '0');
    const label = `Masker${Object.keys(counts).length + 1}`;
    
    counts[label] = {};
    if (pattern.includes('(') && sizes.length > 0) {
      // If there are size-specific numbers
      const sizeNumbers = pattern
        .match(/\((.*?)\)/)?.[1]
        .split(/[,/]/)
        .map(n => parseInt(n.trim()));
      
      if (sizeNumbers) {
        sizes.forEach((size, i) => {
          counts[label][size] = sizeNumbers[i] || number;
        });
      }
    } else {
      // If it's the same number for all sizes
      sizes.forEach(size => {
        counts[label][size] = number;
      });
    }
  });

  return Object.keys(counts).length > 0 ? counts : undefined;
}

export function convertExtractedToProject(
  extracted: any,
  originalFile: { type: string; url: string }
): Omit<Project, 'id'> & { originalFile: { type: string; url: string } } {
  // Convert yarn information
  const defaultYarn = {
    name: '',
    amount: { 'One Size': 0 },
    type: ''
  };

  const yarn = extracted.yarn.length > 0 
    ? {
        name: extracted.yarn[0],
        amount: extracted.yarnAmounts[extracted.yarn[0]]?.reduce((acc: Record<string, number>, amount: string, index: number) => {
          acc[extracted.sizes[index] || 'One Size'] = parseInt(amount.match(/\d+/)?.[0] || '0');
          return acc;
        }, {} as Record<string, number>) || { 'One Size': 0 },
        type: ''
      }
    : defaultYarn;

  return {
    title: extracted.title,
    description: extracted.description,
    image: undefined,
    difficulty: extracted.difficulty,
    availableSizes: extracted.sizes.length > 0 ? extracted.sizes : ['One Size'],
    selectedSize: extracted.sizes[0] || 'One Size',
    bustWidth: extracted.measurements.overvidde?.reduce((acc: Record<string, number>, width: string, index: number) => {
      acc[extracted.sizes[index] || 'One Size'] = parseInt(width) || 0;
      return acc;
    }, {} as Record<string, number>) || { 'One Size': 0 },
    length: extracted.measurements.lengde?.reduce((acc: Record<string, number>, length: string, index: number) => {
      acc[extracted.sizes[index] || 'One Size'] = parseInt(length) || 0;
      return acc;
    }, {} as Record<string, number>) || { 'One Size': 0 },
    tension: `${extracted.gauge.stitches_per_10cm || 0} m x ${extracted.gauge.rows_per_10cm || 0} p på ${extracted.gauge.needle_size || '0 mm'}`,
    ease: 0,
    suggestedNeedles: extracted.needles,
    yarn,
    techniques: [],
    gauge: `${extracted.gauge.stitches_per_10cm || 0} m x ${extracted.gauge.rows_per_10cm || 0} p på ${extracted.gauge.needle_size || '0 mm'}`,
    status: 'Ikke påbegynt' as const,
    currentStep: 0,
    steps: extracted.steps.map((step: any) => ({
      title: step.title,
      description: step.description,
      sizeSpecificValues: step.sizeSpecificValues || []
    })),
    originalFile
  };
} 