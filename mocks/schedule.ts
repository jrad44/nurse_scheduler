import { format } from '@/utils/dateUtils';
import { ShiftAssignment, ShiftConstraint, ScheduleRules } from '@/types/schedule';

const today = new Date();
const todayStr = format(today, 'yyyy-MM-dd');

export const mockAssignments: ShiftAssignment[] = [
  {
    id: '1',
    staffId: 'RN001',
    date: todayStr,
    shift: 'D',
    unit: 'ICU',
  },
  {
    id: '2',
    staffId: 'RN002',
    date: todayStr,
    shift: 'D',
    unit: 'ICU',
  },
  {
    id: '3',
    staffId: 'TECH001',
    date: todayStr,
    shift: 'D',
    unit: 'ICU',
  },
  {
    id: '4',
    staffId: 'RN003',
    date: todayStr,
    shift: 'N',
    unit: 'ICU',
  },
  {
    id: '5',
    staffId: 'RN004',
    date: todayStr,
    shift: 'N',
    unit: 'ICU',
  },
];

export const mockConstraints: ShiftConstraint[] = [
  {
    unit: 'ICU',
    date: todayStr,
    shift: 'D',
    minStaff: 6,
    minRoleMix: {
      'RN': 4,
      'Tech': 1,
      'ChargeRN': 1,
    },
    skillRequirements: {
      'ACLS': 3,
      'CCRN': 2,
    },
    notes: 'High acuity expected - ensure experienced staff',
  },
  {
    unit: 'ICU',
    date: todayStr,
    shift: 'E',
    minStaff: 5,
    minRoleMix: {
      'RN': 3,
      'Tech': 1,
      'ChargeRN': 1,
    },
    skillRequirements: {
      'ACLS': 2,
    },
  },
  {
    unit: 'ICU',
    date: todayStr,
    shift: 'N',
    minStaff: 5,
    minRoleMix: {
      'RN': 3,
      'Tech': 1,
      'ChargeRN': 1,
    },
    skillRequirements: {
      'ACLS': 2,
      'NIHSS': 1,
    },
  },
  {
    unit: 'ER',
    date: todayStr,
    shift: 'D',
    minStaff: 8,
    minRoleMix: {
      'RN': 5,
      'Tech': 2,
      'ChargeRN': 1,
    },
    skillRequirements: {
      'ACLS': 4,
      'TNCC': 2,
    },
  },
  {
    unit: 'Med-Surg',
    date: todayStr,
    shift: 'D',
    minStaff: 6,
    minRoleMix: {
      'RN': 3,
      'LVN': 2,
      'Tech': 1,
    },
  },
];

export const defaultRules: ScheduleRules = {
  maxConsecutiveDays: 3,
  minRestHours: 12,
  minWeekendsOff: 2,
  minShiftsPerWeek: 3,
  maxShiftsPerWeek: 5,
  rotateNightsFairly: true,
  avoidChargeDuplication: true,
  workPeriodStartDate: format(today, 'yyyy-MM-dd'),
  workPeriodEndDate: format(new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  weekStartsOnSunday: true,
  minWeekendsPerPeriod: 2,
  maxWeekendsPerPeriod: 4,
  
  // Employment type specific rules
  fullTimeRules: {
    enabled: true,
    minShiftsPerWeek: 3,
    maxShiftsPerWeek: 5,
    minShiftsPerPeriod: 12,
    maxShiftsPerPeriod: 20,
    requiresWeekendCoverage: true,
    maxConsecutiveDays: 5,
    minRestHours: 12,
  },
  partTimeRules: {
    enabled: true,
    minShiftsPerWeek: 2,
    maxShiftsPerWeek: 4,
    minShiftsPerPeriod: 8,
    maxShiftsPerPeriod: 16,
    requiresWeekendCoverage: true,
    maxConsecutiveDays: 4,
    minRestHours: 12,
  },
  perDiemRules: {
    enabled: true,
    minShiftsPerWeek: 0,
    maxShiftsPerWeek: 3,
    minShiftsPerPeriod: 0,
    maxShiftsPerPeriod: 12,
    requiresWeekendCoverage: false,
    maxConsecutiveDays: 3,
    minRestHours: 12,
  },
  
  // Role specific rules
  roleRules: {
    'RN': {
      enabled: true,
      maxConsecutiveNights: 3,
      requiresCertification: ['BLS'],
      canFloatToUnits: ['ICU', 'ER', 'Med-Surg'],
      priorityLevel: 4,
    },
    'ChargeRN': {
      enabled: true,
      maxConsecutiveNights: 2,
      requiresCertification: ['BLS', 'ACLS', 'Leadership'],
      canFloatToUnits: ['ICU', 'ER'],
      priorityLevel: 5,
    },
    'LVN': {
      enabled: true,
      maxConsecutiveNights: 4,
      requiresCertification: ['BLS'],
      canFloatToUnits: ['Med-Surg', 'Pediatrics'],
      priorityLevel: 3,
    },
    'Tech': {
      enabled: true,
      maxConsecutiveNights: 4,
      requiresCertification: ['BLS'],
      canFloatToUnits: ['ICU', 'ER', 'Med-Surg'],
      priorityLevel: 2,
    },
    'FloatRN': {
      enabled: true,
      maxConsecutiveNights: 3,
      requiresCertification: ['BLS', 'ACLS'],
      canFloatToUnits: ['ICU', 'ER', 'Med-Surg', 'OR', 'Pediatrics'],
      priorityLevel: 4,
    },
    'IVNurse': {
      enabled: true,
      maxConsecutiveNights: 2,
      requiresCertification: ['IV Therapy'],
      canFloatToUnits: ['ICU', 'ER', 'Med-Surg', 'OR'],
      priorityLevel: 3,
    },
    'UnitSecretary': {
      enabled: true,
      maxConsecutiveNights: 5,
      requiresCertification: [],
      canFloatToUnits: ['ICU', 'ER', 'Med-Surg'],
      priorityLevel: 1,
    },
  },
  
  // Toggle switches for rule enforcement
  enforceEmploymentTypeRules: true,
  enforceRoleSpecificRules: true,
  enforceWeekendRequirements: true,
  enforceCertificationRequirements: true,
};