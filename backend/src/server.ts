import express, { Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase payload limit for large texts

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types
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
    sizeSpecificValues: Array<{
      placeholder: string;
      values: Record<string, number>;
    }>;
  }[];
}

interface PatternRequest {
  text: string;
}

// Pattern extraction endpoint
const extractPattern: RequestHandler = async (req, res) => {
  try {
    const { text } = req.body as PatternRequest;

    if (!text) {
      res.status(400).json({ error: 'No text provided' });
      return;
    }

    console.log('Received text length:', text.length);
    console.log('Sample of received text:', text.substring(0, 200));

    // Truncate text if it's too long (OpenAI has a token limit)
    const maxLength = 6000; // Conservative limit to ensure we stay within token bounds
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) : text;

    if (text.length > maxLength) {
      console.log(`Text was truncated from ${text.length} to ${maxLength} characters`);
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are a knitting pattern analyzer. Your task is to extract structured information from knitting patterns while preserving the original text exactly as written.

CRITICAL RULES:
1. DO NOT modify, rephrase, or rewrite any instructional text. The original Norwegian text must be preserved exactly as provided.
2. DO NOT change formatting, line breaks, or punctuation.
3. DO NOT interpret or modify any knitting terminology or instructions.
4. ONLY convert parenthetical number sequences that represent size-specific values.
5. Use consistent placeholder format: {count_0}, {count_1}, etc.
6. Each number sequence MUST be mapped to predefined size labels.

STEP IDENTIFICATION RULES:
1. A new step typically starts with a header/title that is:
   - On its own line (separated by line breaks)
   - Often in bold or larger text
   - Often a single word or short phrase
   - Often numbered or contains a section number
2. All text following a header, until the next header, belongs to that step
3. Common header indicators:
   - Text formatting (bold, larger size)
   - Standalone positioning (text on its own line)
   - Numbering patterns (1., 2., etc. or Step 1, Step 2, etc.)
   - Capitalization patterns
   - Section names like "MONTERING", "BÆRESTYKKE", "ERMENE", etc.

FORMATTING PRESERVATION:
1. Preserve any text formatting indicators from the PDF:
   - Bold text markers
   - Text size differences
   - Special characters or symbols
   - Line breaks and paragraph spacing
2. Use these formatting hints to identify section headers
3. Include formatting information in the step titles

The ONLY content you should interpret and convert are parenthetical number sequences indicating different sizes, such as:
44 (43) 46 (45) 47 (44) 47 (48) 51 or 4 (7) 6 (9) 9 (14) 15 (16) 17

These number sequences represent stitch counts or measurements for different sizes and should be extracted as structured data.

Example of how to handle size-specific numbers:
Original text: "Legg opp 44 (43) 46 (45) 47 (44) 47 (48) 51 masker på rundpinne 6 mm"
Should become:
{
  description: "Legg opp {count_0} masker på rundpinne 6 mm",
  sizeSpecificValues: [{
    placeholder: "{count_0}",
    values: {
      "XS": 44,
      "S": 43,
      "M": 46,
      "L": 45,
      "XL": 47,
      "XXL": 44,
      "3XL": 47,
      "4XL": 48,
      "5XL": 51
    }
  }]
}

Extract and structure the information according to this TypeScript interface:

interface ExtractedPattern {
  title: string;                    // Pattern title, exactly as written
  description: string;              // Pattern description, exactly as written
  difficulty: 'Nybegynner' | 'Middels' | 'Avansert';  // Pattern difficulty
  sizes: string[];                  // Available sizes (e.g., ["XS", "S", "M", "L", "XL"])
  measurements: {
    overvidde: string[];           // Bust measurements for each size
    lengde: string[];              // Length measurements for each size
    [key: string]: string[];       // Other measurements
  };
  gauge: {
    stitches_per_10cm?: number;    // Number of stitches per 10cm
    rows_per_10cm?: number;        // Number of rows per 10cm
    needle_size?: string;          // Recommended needle size
    technique?: string;            // Knitting technique for gauge
  };
  needles: string[];               // Required needles
  yarn: string[];                  // Required yarn types
  yarnAmounts: {                   // Amount of yarn needed for each size
    [yarnName: string]: string[];
  };
  steps: {                         // Step by step instructions
    title: string;                 // Section title with any formatting indicators
    description: string;           // Section text, exactly as written
    sizeSpecificValues: Array<{    // Extracted size-specific numbers
      placeholder: string;         // Where in the text this number appears
      values: Record<string, number>; // Values for each size
    }>;
  }[];
}

Return the data in valid JSON format matching the interface exactly.`
          },
          {
            role: "user",
            content: truncatedText
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1, // Lower temperature for more consistent output
        max_tokens: 4000 // Ensure we have enough tokens for the response
      });

      const result = response.choices[0].message.content;
      if (!result) {
        throw new Error("Failed to extract pattern information");
      }

      console.log('OpenAI response received');
      
      try {
        const pattern = JSON.parse(result) as ExtractedPattern;
        console.log('Successfully parsed pattern:', pattern.title);
        res.json(pattern);
        return;
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        console.log('Raw response:', result);
        throw new Error('Failed to parse OpenAI response');
      }
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      throw new Error(`OpenAI API error: ${openaiError instanceof Error ? openaiError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error processing pattern:', error);
    res.status(500).json({ 
      error: 'Failed to process the pattern',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};

app.post('/api/extract-pattern', extractPattern);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 