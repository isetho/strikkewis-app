interface ExtractedPattern {
  title: string;
  description: string;
  difficulty: 'Nybegynner' | 'Middels' | 'Avansert';
  sizes: string[];
  measurements: {
    overvidde: string[];
    lengde: string[];
    [key: string]: string[];
  };
  gauge: {
    stitches_per_10cm?: number;
    rows_per_10cm?: number;
    needle_size?: string;
    technique?: string;
  };
  needles: string[];
  yarn: string[];
  yarnAmounts: {
    [yarnName: string]: string[];
  };
  steps: {
    title: string;
    description: string;
    stitchCounts?: Record<string, Record<string, number>>;
  }[];
}

const API_URL = import.meta.env.MODE === 'development' 
  ? 'http://localhost:3000'
  : 'https://api.strikkewis.com';

export async function extractPatternFromText(text: string): Promise<ExtractedPattern> {
  try {
    const response = await fetch(`${API_URL}/api/extract-pattern`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('Failed to extract pattern information');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in pattern extraction:', error);
    throw new Error('Failed to process the pattern text. Please try again.');
  }
} 