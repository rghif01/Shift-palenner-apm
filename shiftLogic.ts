
import { ShiftGroup, ShiftType, ShiftAssignment } from '../types';

/**
 * Rotation Pattern: 3 Days Morning -> 3 Days Afternoon -> 3 Days Night -> 3 Days OFF
 * Total Cycle Length: 12 days
 * 
 * Logic Adjustment based on user request:
 * "Today 14 01 2026 is the last morning for shift D"
 * This means Jan 14 is Index 2 (Day 3 of 3) for Shift D.
 * 
 * Consequently, on Jan 13 (our ANCHOR_DATE):
 * - Shift D must be at Index 1 (Day 2 of 3 Morning)
 * - Shift C must be at Index 4 (Day 2 of 3 Afternoon)
 * - Shift B must be at Index 7 (Day 2 of 3 Night)
 * - Shift A must be at Index 10 (Day 2 of 3 OFF)
 */

const ANCHOR_DATE = new Date(2026, 0, 13);
const CYCLE_LENGTH = 12;

// Map 12-day index to ShiftType
// 0,1,2 = Morning
// 3,4,5 = Afternoon
// 6,7,8 = Night
// 9,10,11 = OFF
const getShiftTypeFromIndex = (index: number): ShiftType => {
  if (index >= 0 && index <= 2) return ShiftType.MORNING;
  if (index >= 3 && index <= 5) return ShiftType.AFTERNOON;
  if (index >= 6 && index <= 8) return ShiftType.NIGHT;
  return ShiftType.OFF;
};

export const getShiftsForDate = (date: Date): ShiftAssignment => {
  // Normalize date to midnight
  const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const d2 = new Date(ANCHOR_DATE.getFullYear(), ANCHOR_DATE.getMonth(), ANCHOR_DATE.getDate());
  
  const timeDiff = d1.getTime() - d2.getTime();
  const dayDiff = Math.round(timeDiff / (1000 * 3600 * 24));
  
  // Calculate base offset for the 12-day cycle
  const baseOffset = ((dayDiff % CYCLE_LENGTH) + CYCLE_LENGTH) % CYCLE_LENGTH;

  /**
   * Sequence: A -> D -> C -> B
   * If D is Morning (index 1), C (taking from D) is Afternoon (index 4), 
   * B is Night (index 7), A (who D takes from) is OFF (index 10).
   */
  const assignment: ShiftAssignment = {
    'D': getShiftTypeFromIndex((1 + baseOffset) % CYCLE_LENGTH),
    'C': getShiftTypeFromIndex((4 + baseOffset) % CYCLE_LENGTH),
    'B': getShiftTypeFromIndex((7 + baseOffset) % CYCLE_LENGTH),
    'A': getShiftTypeFromIndex((10 + baseOffset) % CYCLE_LENGTH),
  };

  return assignment;
};
