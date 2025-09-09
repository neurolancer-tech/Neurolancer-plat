// Emoji search mappings for common emotions, feelings, and actions
export const emojiSearchMappings: Record<string, string[]> = {
  // Happiness & Joy
  happiness: ['1F600', '1F601', '1F602', '1F603', '1F604', '1F605', '1F606', '1F607', '1F608', '1F609', '1F60A', '1F60B', '1F60C', '1F60D', '1F60E', '1F60F', '1F970', '1F929', '1F973', '1F389', '1F38A', '1F38B', '1F38C', '1F38D', '1F38E', '1F38F', '1F973'],
  happy: ['1F600', '1F601', '1F603', '1F604', '1F60A', '1F60D', '1F970', '1F929'],
  joy: ['1F602', '1F604', '1F60D', '1F973', '1F389'],
  excited: ['1F929', '1F973', '1F389', '1F38A', '1F60D'],
  cheerful: ['1F600', '1F601', '1F60A', '1F60B'],
  
  // Sadness
  sadness: ['1F614', '1F615', '1F616', '1F617', '1F618', '1F619', '1F61A', '1F61B', '1F61C', '1F61D', '1F61E', '1F61F', '1F620', '1F621', '1F622', '1F623', '1F624', '1F625', '1F626', '1F627', '1F628', '1F629', '1F62A', '1F62B', '1F62C', '1F62D', '1F62E', '1F62F', '1F630', '1F631', '1F632', '1F633', '1F634', '1F635', '1F636', '1F637', '1F641', '1F642', '1F643', '1F644'],
  sad: ['1F614', '1F61E', '1F622', '1F62D', '1F641'],
  crying: ['1F622', '1F62D', '1F625'],
  disappointed: ['1F61E', '1F614', '1F641'],
  
  // Anger
  anger: ['1F620', '1F621', '1F624', '1F92C', '1F47F'],
  angry: ['1F620', '1F621', '1F624', '1F92C'],
  mad: ['1F620', '1F621', '1F624'],
  furious: ['1F621', '1F624', '1F92C'],
  
  // Love & Romance
  love: ['1F60D', '1F618', '1F617', '1F619', '1F970', '2764', '1F496', '1F497', '1F498', '1F499', '1F49A', '1F49B', '1F49C', '1F49D', '1F49E', '1F49F', '1F48B', '1F48C', '1F48D', '1F48E'],
  romance: ['1F60D', '1F618', '1F617', '1F970', '2764', '1F496', '1F48B'],
  kiss: ['1F618', '1F617', '1F619', '1F48B'],
  heart: ['2764', '1F496', '1F497', '1F498', '1F499', '1F49A', '1F49B', '1F49C', '1F49D', '1F49E', '1F49F'],
  
  // Surprise
  surprise: ['1F632', '1F62E', '1F62F', '1F631', '1F92F'],
  shocked: ['1F632', '1F631', '1F92F'],
  amazed: ['1F632', '1F62E', '1F92F'],
  
  // Fear
  fear: ['1F628', '1F630', '1F631', '1F47B', '1F47D', '1F47E', '1F47F', '1F480'],
  scared: ['1F628', '1F630', '1F631'],
  afraid: ['1F628', '1F630', '1F631'],
  
  // Actions
  laugh: ['1F602', '1F923', '1F606'],
  laughing: ['1F602', '1F923', '1F606'],
  wink: ['1F609', '1F60F'],
  thinking: ['1F914', '1F9D0'],
  sleeping: ['1F634', '1F62A', '1F4A4'],
  eating: ['1F37D', '1F374', '1F372', '1F371'],
  drinking: ['1F377', '1F378', '1F379', '1F37A', '1F37B', '1F37C'],
  dancing: ['1F483', '1F57A', '1F46F'],
  running: ['1F3C3', '1F3C3-200D-2642-FE0F', '1F3C3-200D-2640-FE0F'],
  walking: ['1F6B6', '1F6B6-200D-2642-FE0F', '1F6B6-200D-2640-FE0F'],
  working: ['1F4BC', '1F4BB', '1F4CA', '1F4C8'],
  studying: ['1F4DA', '1F4D6', '1F4DD', '270F'],
  
  // Gestures
  thumbsup: ['1F44D'],
  thumbsdown: ['1F44E'],
  clap: ['1F44F'],
  wave: ['1F44B'],
  peace: ['270C', '1F91E'],
  ok: ['1F44C'],
  
  // Weather & Nature
  sun: ['2600', '1F31E', '1F506', '1F31D'],
  rain: ['1F327', '2614', '1F4A7'],
  snow: ['2744', '1F328', '26C4'],
  fire: ['1F525', '1F4A5'],
  water: ['1F4A7', '1F30A', '1F6B0'],
  
  // Animals (common searches)
  cat: ['1F408', '1F431', '1F63A', '1F63B', '1F63C', '1F63D', '1F63E', '1F63F', '1F640'],
  dog: ['1F415', '1F436', '1F429'],
  bird: ['1F426', '1F427', '1F414', '1F413'],
  
  // Food (common searches)
  pizza: ['1F355'],
  burger: ['1F354'],
  coffee: ['2615', '1F375'],
  beer: ['1F37A'],
  cake: ['1F382', '1F370'],
  
  // Celebration
  party: ['1F389', '1F38A', '1F973', '1F37E'],
  celebration: ['1F389', '1F38A', '1F973', '1F37E', '1F386', '1F387'],
  birthday: ['1F382', '1F389', '1F38A', '1F973'],
  
  // Work & Technology
  computer: ['1F4BB', '1F5A5', '1F4F1'],
  phone: ['1F4F1', '1F4DE', '260E'],
  email: ['1F4E7', '1F4E8', '1F4E9'],
  
  // Transportation
  car: ['1F697', '1F695', '1F699'],
  plane: ['2708', '1F6E9'],
  train: ['1F686', '1F687', '1F688'],
  
  // Time
  clock: ['1F550', '1F551', '1F552', '1F553', '1F554', '1F555', '1F556', '1F557', '1F558', '1F559', '1F55A', '1F55B'],
  time: ['1F550', '23F0', '23F1', '23F2'],
  
  // Money
  money: ['1F4B0', '1F4B1', '1F4B2', '1F4B3', '1F4B4', '1F4B5', '1F4B6', '1F4B7', '1F4B8'],
  dollar: ['1F4B2', '1F4B5'],
  
  // Common expressions
  cool: ['1F60E', '1F192', '1F19A'],
  awesome: ['1F60E', '1F929', '1F44D', '1F525'],
  great: ['1F44D', '1F929', '1F389'],
  perfect: ['1F44C', '1F44D', '1F4AF'],
  yes: ['2705', '2714', '1F44D'],
  no: ['274C', '2716', '1F44E'],
  maybe: ['1F937', '1F914'],
  
  // Misc emotions
  confused: ['1F615', '1F914', '1F928'],
  tired: ['1F62A', '1F634', '1F971'],
  sick: ['1F912', '1F915', '1F922'],
  crazy: ['1F92A', '1F913', '1F61C']
};

// Function to search emojis with enhanced mapping
export function searchEmojisWithMapping(query: string, allEmojis: Array<{unicode: string, code: string, name: string}>): Array<{unicode: string, code: string, name: string}> {
  if (!query.trim()) return allEmojis;
  
  const lowerQuery = query.toLowerCase().trim();
  const results = new Set<string>();
  
  // First, check if query matches any mapping keywords
  for (const [keyword, codes] of Object.entries(emojiSearchMappings)) {
    if (keyword.includes(lowerQuery) || lowerQuery.includes(keyword)) {
      codes.forEach(code => results.add(code));
    }
  }
  
  // Then search in actual emoji names
  const nameMatches = allEmojis.filter(emoji => 
    emoji.name.toLowerCase().includes(lowerQuery)
  );
  
  nameMatches.forEach(emoji => results.add(emoji.code));
  
  // Return matched emojis, prioritizing mapping results
  const mappingResults = Array.from(results)
    .map(code => allEmojis.find(e => e.code === code))
    .filter(Boolean) as Array<{unicode: string, code: string, name: string}>;
  
  // Add name matches that weren't already included
  const finalResults = [...mappingResults];
  nameMatches.forEach(emoji => {
    if (!results.has(emoji.code)) {
      finalResults.push(emoji);
    }
  });
  
  return finalResults;
}