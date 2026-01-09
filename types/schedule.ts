export type ShiftType = 'D' | 'E' | 'N';

export interface ShiftAssignment {
  id: string;
  staffId: string;
  date: string;
  shift: ShiftType;
  unit: string;
}

export interface ShiftConstraint {
  unit: string;
  date: string;
  shift: ShiftType;
  minStaff: number;
  minRoleMix?: Record<string, number>;
  skillRequirements?: Record<string, number>;
  caps?: Record<string, number>;
  notes?: string;
}

export interface EmploymentTypeRules {
  enabled: boolean;
  minShiftsPerWeek: number;
  maxShiftsPerWeek: number;
  minShiftsPerPeriod: number;
  maxShiftsPerPeriod: number;
  requiresWeekendCoverage: boolean;
  maxConsecutiveDays: number;
  minRestHours: number;
}

export interface RoleSpecificRules {
  enabled: boolean;
  maxConsecutiveNights: number;
  requiresCertification: string[];
  canFloatToUnits: string[];
  priorityLevel: number; // 1-5, higher = more priority for preferred shifts
}

export interface ScheduleRules {
  maxConsecutiveDays: number;
  minRestHours: number;
  minWeekendsOff: number;
  minShiftsPerWeek: number;
  maxShiftsPerWeek: number;
  rotateNightsFairly: boolean;
  avoidChargeDuplication: boolean;
  workPeriodStartDate: string;
  workPeriodEndDate: string;
  weekStartsOnSunday: boolean;
  minWeekendsPerPeriod: number;
  maxWeekendsPerPeriod: number;
  
  // Employment type specific rules
  fullTimeRules: EmploymentTypeRules;
  partTimeRules: EmploymentTypeRules;
  perDiemRules: EmploymentTypeRules;
  
  // Role specific rules
  roleRules: Record<string, RoleSpecificRules>;
  
  // Toggle switches for rule enforcement
  enforceEmploymentTypeRules: boolean;
  enforceRoleSpecificRules: boolean;
  enforceWeekendRequirements: boolean;
  enforceCertificationRequirements: boolean;
}

export interface CoverageStatus {
  required: number;
  current: number;
  isMet: boolean;
  roleBreakdown: Record<string, { current: number; required: number }>;
}

export interface WorkPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  weekStartsOnSunday: boolean;
}

export interface WeekendRequirement {
  minWeekendsOff: number;
  maxWeekendsWorked: number;
  fairRotation: boolean;
}