import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { Project } from '../contexts/ProjectContext';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ExtractedPattern {
  title: string;
  description: string;
  difficulty: Project['difficulty'];
  sizes: string[];
  tension?: string;
  needles?: string[];
  yarn?: {
    name: string;
    amount: Record<string, number>;
    type: string;
  };
  techniques: string[];
  steps: {
    title: string;
    description: string;
    stitchCounts?: Record<string, Record<string, number>>;
  }[];
}

export async function extractTextFromPDF(file: File): Promise<ExtractedPattern> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  // Extract text from all pages
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  return parseKnittingPattern(fullText);
}

export async function extractTextFromImage(file: File): Promise<ExtractedPattern> {
  const worker = await Tesseract.createWorker('nor');
  
  try {
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    return parseKnittingPattern(text);
  } catch (error) {
    await worker.terminate();
    throw error;
  }
}

function parseKnittingPattern(text: string): ExtractedPattern {
  // Initialize pattern with default values
  const pattern: ExtractedPattern = {
    title: '',
    description: '',
    difficulty: 'Middels',
    sizes: [],
    techniques: [],
    steps: []
  };

  // Extract title (usually first line or after "Navn:" or similar)
  const titleMatch = text.match(/^(.+?)(?:\n|$)/) || text.match(/Navn:?\s*(.+?)(?:\n|$)/i);
  if (titleMatch) {
    pattern.title = titleMatch[1].trim();
  }

  // Extract sizes
  const sizesMatch = text.match(/Størrelser?:?\s*(.+?)(?:\n|$)/i);
  if (sizesMatch) {
    pattern.sizes = sizesMatch[1]
      .split(/[,/]/)
      .map(size => size.trim())
      .filter(Boolean);
  }

  // Extract tension/gauge
  const tensionMatch = text.match(/Strikkefasthet:?\s*(.+?)(?:\n|$)/i);
  if (tensionMatch) {
    pattern.tension = tensionMatch[1].trim();
  }

  // Extract needles
  const needlesMatch = text.match(/Pinner?:?\s*(.+?)(?:\n|$)/i);
  if (needlesMatch) {
    pattern.needles = needlesMatch[1]
      .split(/[,/]/)
      .map(needle => needle.trim())
      .filter(Boolean);
  }

  // Extract yarn information
  const yarnMatch = text.match(/Garn:?\s*(.+?)(?:\n|$)/i);
  if (yarnMatch) {
    const yarnInfo = yarnMatch[1].trim();
    pattern.yarn = {
      name: yarnInfo.split('(')[0].trim(),
      amount: {},
      type: yarnInfo.includes('(') ? yarnInfo.match(/\((.*?)\)/)?.[1] || '' : ''
    };
  }

  // Extract yarn amounts for each size
  if (pattern.sizes.length > 0 && pattern.yarn) {
    const yarnAmountMatch = text.match(/Garnmengde:?\s*(.+?)(?:\n|$)/i);
    if (yarnAmountMatch) {
      const amounts = yarnAmountMatch[1].split(/[,/]/).map(a => a.trim());
      pattern.sizes.forEach((size, index) => {
        if (amounts[index]) {
          const amount = parseInt(amounts[index].match(/\d+/)?.[0] || '0');
          pattern.yarn!.amount[size] = amount;
        }
      });
    }
  }

  // Extract techniques
  const techniquesMatch = text.match(/Teknikker:?\s*(.+?)(?:\n|$)/i);
  if (techniquesMatch) {
    pattern.techniques = techniquesMatch[1]
      .split(/[,/]/)
      .map(technique => technique.trim())
      .filter(Boolean);
  }

  // Try to determine difficulty based on techniques and keywords
  if (pattern.techniques.length > 0) {
    const advancedTechniques = ['fletting', 'mønsterstrikk', 'intarsia', 'fair isle'];
    const beginnerTechniques = ['rett', 'vrang', 'ribbestrikk'];
    
    const hasAdvanced = pattern.techniques.some(t => 
      advancedTechniques.some(at => t.toLowerCase().includes(at))
    );
    const onlyBeginner = pattern.techniques.every(t =>
      beginnerTechniques.some(bt => t.toLowerCase().includes(bt))
    );

    if (hasAdvanced) {
      pattern.difficulty = 'Avansert';
    } else if (onlyBeginner) {
      pattern.difficulty = 'Nybegynner';
    }
  }

  // Extract description
  const descriptionMatch = text.match(/(?:Beskrivelse|Om oppskriften):?\s*(.+?)(?:\n|$)/i);
  if (descriptionMatch) {
    pattern.description = descriptionMatch[1].trim();
  } else {
    // If no explicit description, use the first paragraph that's not other fields
    const lines = text.split('\n');
    for (const line of lines) {
      if (
        line.trim() &&
        !line.includes(':') &&
        !line.includes(pattern.title) &&
        !pattern.sizes.includes(line.trim())
      ) {
        pattern.description = line.trim();
        break;
      }
    }
  }

  // Extract steps
  const stepsSection = text.match(/(?:Fremgangsmåte|Oppskrift):?\s*(.+?)(?:\n\s*$|$)/is);
  if (stepsSection) {
    const stepsText = stepsSection[1];
    const stepMatches = stepsText.split(/\d+\.|[A-Z]\)/);
    
    pattern.steps = stepMatches
      .map(step => step.trim())
      .filter(Boolean)
      .map(step => ({
        title: step.split('.')[0].trim(),
        description: step,
        stitchCounts: extractStitchCounts(step, pattern.sizes)
      }));
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
  extracted: ExtractedPattern,
  originalFile: { type: string; url: string }
): Omit<Project, 'id'> & { originalFile: { type: string; url: string } } {
  return {
    title: extracted.title,
    description: extracted.description || 'Opplastet oppskrift',
    image: undefined,
    difficulty: extracted.difficulty,
    availableSizes: extracted.sizes.length > 0 ? extracted.sizes : ['One Size'],
    selectedSize: extracted.sizes[0] || 'One Size',
    bustWidth: { 'One Size': 0 },
    length: { 'One Size': 0 },
    tension: extracted.tension || '',
    ease: 0,
    suggestedNeedles: extracted.needles || [],
    yarn: extracted.yarn || {
      name: '',
      amount: { 'One Size': 0 },
      type: ''
    },
    techniques: extracted.techniques,
    gauge: extracted.tension || '',
    status: 'Ikke påbegynt' as const,
    currentStep: 0,
    steps: extracted.steps.length > 0 ? extracted.steps : [{
      title: 'Opplastet oppskrift',
      description: 'Denne oppskriften er opplastet og venter på prosessering.',
      stitchCounts: {}
    }],
    originalFile
  };
} 