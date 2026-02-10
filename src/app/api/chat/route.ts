import { google } from '@ai-sdk/google';
import { generateText, tool } from 'ai';
import { z } from 'zod';

const growPlantParams = z.object({
  shouldGrow: z.boolean().describe('Whether to grow the plant'),
});

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, gardenStats } = await req.json();

    const lastUserMessage =
      messages[messages.length - 1]?.content?.toLowerCase() ?? '';

    let inferredPlantType: 'typing_bamboo' | 'investor_oak' | 'family_rose' | null =
      null;

    if (lastUserMessage.includes('typing')) {
      inferredPlantType = 'typing_bamboo';
    } else if (lastUserMessage.includes('email')) {
      inferredPlantType = 'investor_oak';
    } else if (lastUserMessage.includes('family')) {
      inferredPlantType = 'family_rose';
    }

    const result = await generateText({
      model: google('gemini-2.5-flash'),
      messages,
      system:
        'You are Grove, a warm and supportive life partner helping users grow their life garden.',
      tools: {
        growPlant: tool<
          { shouldGrow: boolean }, // input
          string                  // output
        >({
          description: 'Grow a plant in the garden',
          parameters: growPlantParams,

          execute: async ({ shouldGrow }) => {
            if (!shouldGrow) {
              return 'The plant did not grow';
            }

            if (!inferredPlantType) {
              return 'Could not determine which plant to grow';
            }

            const columnMapping: Record<
              'typing_bamboo' | 'investor_oak' | 'family_rose',
              string
            > = {
              investor_oak: 'investor_oak_growth',
              typing_bamboo: 'typing_bamboo_growth',
              family_rose: 'family_rose_growth',
            };

            const columnName = columnMapping[inferredPlantType];
            const increment = 10;

            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            const currentValue = gardenStats[columnName] ?? 0;
            const newValue = Math.min(currentValue + increment, 100);

            const { error } = await supabase
              .from('garden_stats')
              .update({ [columnName]: newValue })
              .eq('id', gardenStats.id);

            if (error) {
              throw new Error(error.message);
            }

            return `🌱 ${inferredPlantType} grew from ${currentValue}% → ${newValue}%`;
          },
        }),
      },
      maxSteps: 5,
    });

    return Response.json({
      text: result.text,
      toolCalls: result.toolCalls ?? [],
    });
  } catch (error: any) {
    return new Response(error.message ?? 'Internal Server Error', {
      status: 500,
    });
  }
}
