export interface AppLanguage {
  code: string; // ISO 639-1
  name: string;
  native?: string;
}

// A comprehensive, but not exhaustive, list of common languages
export const LANGUAGES: AppLanguage[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'zh', name: 'Chinese (Simplified)', native: '中文(简体)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', native: '中文(繁體)' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  { code: 'pl', name: 'Polish', native: 'Polski' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands' },
  { code: 'sv', name: 'Swedish', native: 'Svenska' },
  { code: 'fi', name: 'Finnish', native: 'Suomi' },
  { code: 'no', name: 'Norwegian', native: 'Norsk' },
  { code: 'da', name: 'Danish', native: 'Dansk' },
  { code: 'cs', name: 'Czech', native: 'Čeština' },
  { code: 'sk', name: 'Slovak', native: 'Slovenčina' },
  { code: 'ro', name: 'Romanian', native: 'Română' },
  { code: 'hu', name: 'Hungarian', native: 'Magyar' },
  { code: 'el', name: 'Greek', native: 'Ελληνικά' },
  { code: 'he', name: 'Hebrew', native: 'עברית' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', native: 'ไทย' },
  { code: 'fa', name: 'Persian', native: 'فارسی' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
  { code: 'am', name: 'Amharic', native: 'አማርኛ' },
  { code: 'ig', name: 'Igbo' },
  { code: 'yo', name: 'Yoruba', native: 'Yorùbá' },
  { code: 'ha', name: 'Hausa' },
  { code: 'zu', name: 'Zulu', native: 'isiZulu' },
  { code: 'xh', name: 'Xhosa', native: 'isiXhosa' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'uk', name: 'Ukrainian', native: 'Українська' },
  { code: 'sr', name: 'Serbian', native: 'Српски' },
  { code: 'hr', name: 'Croatian', native: 'Hrvatski' },
  { code: 'bg', name: 'Bulgarian', native: 'Български' },
  { code: 'et', name: 'Estonian', native: 'Eesti' },
  { code: 'lv', name: 'Latvian', native: 'Latviešu' },
  { code: 'lt', name: 'Lithuanian', native: 'Lietuvių' },
];

export function findLanguageName(code: string): string {
  const match = LANGUAGES.find(l => l.code === code);
  return match ? (match.native || match.name) : code;
}

