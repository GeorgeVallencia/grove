import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export async function POST(req: Request) {
  try {
    const { messages, gardenStats } = await req.json();

    const result = await streamText({
      model: google('gemini-1.5-flash'),
      messages,
      system: `You are Grove, a supportive life partner. Stats: Oak ${gardenStats?.investor_oak_growth}%, Bamboo ${gardenStats?.typing_bamboo_growth}%, Rose ${gardenStats?.family_rose_growth}%. Be warm and brief.`,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI Route Error:", error);
    return new Response(JSON.stringify({ error: "Failed to connect to Grove" }), { status: 500 });
  }
}






// import { google } from '@ai-sdk/google'; // Import Google instead of OpenAI
// import { streamText } from 'ai';

// export const maxDuration = 30;

// export async function POST(req: Request) {
//   const { messages, gardenStats } = await req.json();

//   return streamText({
//     model: google('gemini-1.5-flash'), // Use the fast, free Gemini model
//     system: `You are Grove, a supportive, nature-inspired life partner.
//     User's Garden: Oak ${gardenStats.investor_oak_growth}%, Bamboo ${gardenStats.typing_bamboo_growth}%, Rose ${gardenStats.family_rose_growth}%.
//     Be brief, warm, and encourage watering the low-growth plants.`,
//     messages,
//   });
// }
