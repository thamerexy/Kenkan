import { RoundResult, RoundType, FallahEntry } from './gameLogic';

const KEYWORDS = {
  Kan: ['kan', 'gan', 'kaan', 'khan', 'can', 'kann', 'كان', 'قان', 'خان'],
  Double: ['double', 'duble', 'dabel', 'دبل', 'دوبل'],
  DoubleColor: ['double color', 'color', 'coloured', 'coloured', 'ملون', 'الوان'],
  DoubleRoyal: ['double royal', 'royal', 'رويال'],
  Fallah: ['fallah', 'fallh', 'fall', 'falla', 'فلاح', 'فله'],
};

/**
 * Simple fuzzy matching by check if the segment contains or is very similar to a name.
 */
function findBestPlayerMatch(segment: string, players: string[]): string | null {
  const normSegment = segment.toLowerCase();
  
  // 1. Direct match or contains
  for (const player of players) {
    const normPlayer = player.toLowerCase();
    if (normSegment.includes(normPlayer)) return player;
  }

  // 2. Simple fallback for common phonetic mistakes or short names
  // (In a real app, we might use Levenshtein distance here)
  return null;
}

export function parseVoiceInput(
  text: string,
  players: string[]
): RoundResult | null {
  const normalizedText = text.toLowerCase().replace(/[^\w\s\u0600-\u06FF]/g, ' ');
  
  let type: RoundType = 'Kan';
  let achieverName = '';
  const fallahs: FallahEntry[] = [];

  // Determine Round Type (highest priority first)
  if (KEYWORDS.DoubleRoyal.some(k => normalizedText.includes(k))) type = 'DoubleRoyal';
  else if (KEYWORDS.DoubleColor.some(k => normalizedText.includes(k))) type = 'DoubleColor';
  else if (KEYWORDS.Double.some(k => normalizedText.includes(k))) type = 'Double';
  else if (KEYWORDS.Kan.some(k => normalizedText.includes(k))) type = 'Kan';

  // Split text by common separators and keywords
  // We use a regex that handles "and", "then", and Arabic connectors
  const segments = normalizedText.split(/\s+(?:and|then|ثم|و)\s+|\s*[.,!]\s*/).map(s => s.trim()).filter(Boolean);

  segments.forEach(segment => {
    const isFallah = KEYWORDS.Fallah.some(k => segment.includes(k));
    const mentionedPlayer = findBestPlayerMatch(segment, players);

    if (mentionedPlayer) {
      if (isFallah) {
        // Extract number - look for digits or common words
        const numberMatch = segment.match(/\d+/);
        if (numberMatch) {
          fallahs.push({
            playerName: mentionedPlayer,
            handValue: parseInt(numberMatch[0], 10)
          });
        }
      } else {
        // Check if this segment refers to the round winner
        const isWinner = [...KEYWORDS.Kan, ...KEYWORDS.Double, ...KEYWORDS.DoubleColor, ...KEYWORDS.DoubleRoyal]
          .some(k => segment.includes(k));
        
        if (isWinner && !achieverName) {
          achieverName = mentionedPlayer;
        }
      }
    }
  });

  // Fallback: If no achiever found but a player is mentioned without "fallah", 
  // and we have a winner keyword somewhere in the text, assume that player is the achiever.
  if (!achieverName) {
    const hasWinnerKeyword = segments.some(seg => 
      [...KEYWORDS.Kan, ...KEYWORDS.Double, ...KEYWORDS.DoubleColor, ...KEYWORDS.DoubleRoyal].some(k => seg.includes(k))
    );
    
    if (hasWinnerKeyword) {
      for (const segment of segments) {
        if (!KEYWORDS.Fallah.some(k => segment.includes(k))) {
          const player = findBestPlayerMatch(segment, players);
          if (player) {
            achieverName = player;
            break;
          }
        }
      }
    }
  }

  if (!achieverName) return null;

  return { achieverName, type, fallahs };
}
