import { google } from '@ai-sdk/google';
import { generateText, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

// ✅ Define schema ONCE
const growPlantParams = z.object({
  shouldGrow: z.boolean().describe('Whether to grow the plant'),
});

export async function POST(req: Request) {
  try {
    const { messages, gardenStats } = await req.json();

    console.log('🌳 Grove is analyzing stats:', gardenStats);

    // Get the last user message
    const lastUserMessage =
      messages[messages.length - 1]?.content?.toLowerCase() || '';

    // Infer plant type
    let inferredPlantType: string | null = null;

    if (
      lastUserMessage.includes('typing') ||
      lastUserMessage.includes('type') ||
      lastUserMessage.includes('keyboard')
    ) {
      inferredPlantType = 'typing_bamboo';
    } else if (
      lastUserMessage.includes('email') ||
      lastUserMessage.includes('investor') ||
      lastUserMessage.includes('pitch')
    ) {
      inferredPlantType = 'investor_oak';
    } else if (
      lastUserMessage.includes('family') ||
      lastUserMessage.includes('call') ||
      lastUserMessage.includes('mom') ||
      lastUserMessage.includes('dad')
    ) {
      inferredPlantType = 'family_rose';
    }

    console.log(`🔍 Inferred plant type: ${inferredPlantType}`);

    const result = await generateText({
      model: google('gemini-2.5-flash'),
      messages,
      system: `You are Grove, a warm and supportive life partner helping users grow their life garden.

Current Garden Status:
- Investor Oak: ${gardenStats.investor_oak_growth}%
- Typing Bamboo: ${gardenStats.typing_bamboo_growth}%
- Family Rose: ${gardenStats.family_rose_growth}%

When the user mentions completing a task, use the growPlant tool and celebrate warmly.

IMPORTANT: Always call the growPlant tool when the user mentions doing something productive.`,
      tools: {
        growPlant: tool({
          description: 'Grow a plant in the garden',
          parameters: growPlantParams,
          execute: async (args) => {
            const { shouldGrow } = args;

            if (!shouldGrow) {
              return 'No growth triggered.';
            }

            if (!inferredPlantType) {
              console.log('❌ Could not infer plant type');
              return 'Could not determine which plant to grow';
            }

            const increment = 10;

            const columnMapping: Record<string, string> = {
              investor_oak: 'investor_oak_growth',
              typing_bamboo: 'typing_bamboo_growth',
              family_rose: 'family_rose_growth',
            };

            const columnName = columnMapping[inferredPlantType];
            console.log(
              `🌱 Growing ${inferredPlantType} (${columnName}) by ${increment}`
            );

            try {
              const { createClient } = await import('@supabase/supabase-js');

              const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
              );

              const recordId = gardenStats.id;
              const currentValue = gardenStats[columnName] || 0;
              const newValue = Math.min(currentValue + increment, 100);

              const { error } = await supabase
                .from('garden_stats')
                .update({ [columnName]: newValue })
                .eq('id', recordId);

              if (error) {
                console.error('❌ Supabase update error:', error);
                return `Error updating garden: ${error.message}`;
              }

              return `Grew ${inferredPlantType} from ${currentValue}% to ${newValue}%`;
            } catch (err: any) {
              console.error('🔥 Tool execution error:', err.message);
              return `Error: ${err.message}`;
            }
          },
        }),
      },
      maxSteps: 5,
    });

    let responseText = result.text;

    // Fallback response
    if (!responseText || responseText.trim().length === 0) {
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
        responseText = `Wonderful! ${plantEmojis[inferredPlantType]
          } Your ${plantNames[inferredPlantType]} just grew! Keep nurturing your garden!`;
      } else {
        responseText = 'Thanks for sharing! Keep growing your garden! 🌱';
      }
    }

    return Response.json({
      text: responseText,
      toolCalls: result.toolCalls ?? [],
    });
  } catch (error: any) {
    console.error('❌ API ROUTE ERROR:', error.message);
    return new Response(error.message, { status: 500 });
  }
}
