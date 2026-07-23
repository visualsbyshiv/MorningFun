/**
 * Timer Utilities for SolarHero (Morning Task)
 * Calculates formatted time taken to complete quests.
 */

/**
 * Formats a duration in seconds to a human-readable string (e.g. "4 mins 32 secs")
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 0) return '0 secs';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins > 0) {
    return `${mins} min${mins !== 1 ? 's' : ''} ${secs} sec${secs !== 1 ? 's' : ''}`;
  }
  return `${secs} sec${secs !== 1 ? 's' : ''}`;
};

/**
 * Calculates current time of day in minutes from midnight (0 to 1439)
 */
export const getTimeOfDayMinutes = (): number => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};
