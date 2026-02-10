import { google } from '@ai-sdk/google';
import { generateText, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, gardenStats } = await req.json();

    console.log("🌳 Grove is analyzing stats:", gardenStats);

    // Get the last user message to infer which plant to grow
    const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';

    // Determine plant type from message
    let inferredPlantType: string | null = null;
    if (lastUserMessage.includes('typing') || lastUserMessage.includes('type') || lastUserMessage.includes('keyboard')) {
      inferredPlantType = 'typing_bamboo';
    } else if (lastUserMessage.includes('email') || lastUserMessage.includes('investor') || lastUserMessage.includes('pitch')) {
      inferredPlantType = 'investor_oak';
    } else if (lastUserMessage.includes('family') || lastUserMessage.includes('call') || lastUserMessage.includes('mom') || lastUserMessage.includes('dad')) {
      inferredPlantType = 'family_rose';
    }

    console.log(`🔍 Inferred plant type from message: ${inferredPlantType}`);

    const result = await generateText({
      model: google('gemini-2.5-flash'),
      messages,
      system: `You are Grove, a warm and supportive life partner helping users grow their life garden.

Current Garden Status:
- Investor Oak: ${gardenStats.investor_oak_growth}%
- Typing Bamboo: ${gardenStats.typing_bamboo_growth}%
- Family Rose: ${gardenStats.family_rose_growth}%

When the user mentions completing a task, use the growPlant tool and celebrate warmly!

IMPORTANT: Always call the growPlant tool when the user mentions doing something productive.`,
      tools: {
        growPlant: tool({
          description: 'Grow a plant in the garden',
          parameters: z.object({
            shouldGrow: z.boolean().describe('Whether to grow the plant'),
          }),
          execute: async () => {
            if (!inferredPlantType) {
              console.log('❌ Could not infer plant type from message');
              return 'Could not determine which plant to grow';
            }

            const plantType = inferredPlantType;
            const increment = 10;

            const columnMapping: Record<string, string> = {
              'investor_oak': 'investor_oak_growth',
              'typing_bamboo': 'typing_bamboo_growth',
              'family_rose': 'family_rose_growth',
            };

            const columnName = columnMapping[plantType];
            console.log(`🌱 Growing ${plantType} (column: ${columnName}) by ${increment}`);

            try {
              const { createClient } = await import('@supabase/supabase-js');
              const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
              );

              const recordId = gardenStats.id;
              const currentValue = gardenStats[columnName] || 0;
              const newValue = Math.min(currentValue + increment, 100);

              console.log(`📊 ${columnName}: ${currentValue} → ${newValue}`);

              const { error } = await supabase
                .from('garden_stats')
                .update({ [columnName]: newValue })
                .eq('id', recordId);

              if (error) {
                console.error('❌ Update error:', error);
                return `Error updating: ${error.message}`;
              }

              console.log('✅ Successfully updated database!');
              return `Grew ${plantType} from ${currentValue}% to ${newValue}%`;
            } catch (error: any) {
              console.error('🔥 Tool execution error:', error.message);
              return `Error: ${error.message}`;
            }
          },
        }),
      },
      maxSteps: 5,
    });

    console.log("✅ Final response:", result.text);

    let responseText = result.text;

    // Fallback response
    if (!responseText || responseText.trim().length === 0) {
      const plantEmojis: Record<string, string> = {
        'investor_oak': '🌳',
        'typing_bamboo': '🎋',
        'family_rose': '🌹'
      };

      const plantNames: Record<string, string> = {
        'investor_oak': 'Investor Oak',
        'typing_bamboo': 'Typing Bamboo',
        'family_rose': 'Family Rose'
      };

      if (inferredPlantType) {
        const emoji = plantEmojis[inferredPlantType] || '🌱';
        const name = plantNames[inferredPlantType] || 'garden';
        responseText = `Wonderful! ${emoji} Your ${name} just grew! Keep nurturing your garden!`;
      } else {
        responseText = "Thanks for sharing! Keep growing your garden! 🌱";
      }
    }

    console.log("📤 Sending response:", responseText);

    return Response.json({
      text: responseText,
      toolCalls: result.toolCalls || [],
    });

  } catch (error: any) {
    console.error("❌ API ROUTE ERROR:", error.message);
    return new Response(error.message, { status: 500 });
  }
}