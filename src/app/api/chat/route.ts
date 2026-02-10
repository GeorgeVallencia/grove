import { google } from '@ai-sdk/google';
import { generateText, tool } from 'ai';
import { z } from 'zod';

// ✅ Tool input schema
const growPlantInput = z.object({
  shouldGrow: z.boolean().describe('Whether to grow the plant'),
});

// Optional: tool output schema (string)
const growPlantOutput = z.string();

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, gardenStats } = await req.json();

    const lastUserMessage =
      messages[messages.length - 1]?.content?.toLowerCase() ?? '';

    let inferredPlantType: 'typing_bamboo' | 'investor_oak' | 'family_rose' | null = null;

    if (lastUserMessage.includes('typing')) inferredPlantType = 'typing_bamboo';
    else if (lastUserMessage.includes('email')) inferredPlantType = 'investor_oak';
    else if (lastUserMessage.includes('family')) inferredPlantType = 'family_rose';

    const result = await generateText({
      model: google('gemini-2.5-flash'),
      messages,
      system:
        'You are Grove, a warm and supportive life partner helping users grow their life garden.',
      tools: {
        growPlant: tool<
          z.infer<typeof growPlantInput>, // input
          z.infer<typeof growPlantOutput> // output
        >({
          description: 'Grow a plant in the garden',
          inputSchema: growPlantInput,
          outputSchema: growPlantOutput,
          execute: async ({ shouldGrow }) => {
            if (!shouldGrow) return 'The plant did not grow';
            if (!inferredPlantType) return 'Could not determine which plant to grow';

            const columnMapping: Record<typeof inferredPlantType, string> = {
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

            if (error) throw new Error(error.message);

            return `🌱 ${inferredPlantType} grew from ${currentValue}% → ${newValue}%`;
          },
        }),
      },
      maxSteps: 5,
    });

    // Fallback response if AI didn’t call the tool
    let responseText = result.text;
    if (!responseText?.trim()) {
      const plantEmojis: Record<string, string> = {
        investor_oak: '🌳',
        typing_bamboo: '🎋',
        family_rose: '🌹',
      };
      const plantNames: Record<string, string> = {
        investor_oak: 'Investor Oak',
        typing_bamboo: 'Typing Bamboo',
        family_rose: 'Family Rose',
      };

      if (inferredPlantType) {
        const emoji = plantEmojis[inferredPlantType] ?? '🌱';
        const name = plantNames[inferredPlantType] ?? 'garden';
        responseText = `Wonderful! ${emoji} Your ${name} just grew! Keep nurturing your garden!`;
      } else {
        responseText = "Thanks for sharing! Keep growing your garden! 🌱";
      }
    }

    return Response.json({
      text: responseText,
      toolCalls: result.toolCalls ?? [],
    });
  } catch (error: any) {
    return new Response(error.message ?? 'Internal Server Error', { status: 500 });
  }
}
