'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function growPlant(plantType: string, increment: number = 5) {
  console.log(`🔵 Growth action called with: ${plantType}, increment: ${increment}`);

  try {
    // Add _growth suffix if not already present
    const columnName = plantType.includes('_growth')
      ? plantType
      : `${plantType}_growth`;

    console.log(`🌱 Growing ${columnName} by ${increment}`);

    // Get current stats
    const { data: currentData } = await supabase
      .from('garden_stats')
      .select('*')
      .limit(1)
      .single();

    if (!currentData) {
      console.error('❌ No garden stats found');
      return;
    }

    const currentValue = currentData[columnName] || 0;
    const newValue = Math.min(currentValue + increment, 100);

    console.log(`📊 ${columnName}: ${currentValue} → ${newValue}`);

    const { error } = await supabase
      .from('garden_stats')
      .update({ [columnName]: newValue })
      .eq('id', currentData.id);

    if (error) {
      console.error('Growth Error:', error);
      return;
    }

    console.log(`✅ Successfully grew ${columnName}!`);
    return { success: true, oldValue: currentValue, newValue };

  } catch (error) {
    console.error('❌ Growth function error:', error);
  }
}