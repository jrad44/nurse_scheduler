import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ShiftAssignment, 
  ShiftConstraint, 
  ScheduleRules,
  ShiftType,
  CoverageStatus,
  WorkPeriod,
  WeekendRequirement 
} from '@/types/schedule';
import { StaffAvailability } from '@/types/staff';
import { mockAssignments, mockConstraints, defaultRules } from '@/mocks/schedule';
import { format } from '@/utils/dateUtils';

export const [ScheduleProvider, useSchedule] = createContextHook(() => {
  const [assignments, setAssignments] = useState<ShiftAssignment[]>(mockAssignments);
  const [constraints, setConstraints] = useState<ShiftConstraint[]>(mockConstraints);
  const [rules, setRules] = useState<ScheduleRules>(defaultRules);
  const [availability, setAvailability] = useState<StaffAvailability[]>([]);
  const [workPeriods, setWorkPeriods] = useState<WorkPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadScheduleData();
  }, []);

  const loadScheduleData = async () => {
    try {
      const [storedAssignments, storedConstraints, storedRules] = await Promise.all([
        AsyncStorage.getItem('assignments'),
        AsyncStorage.getItem('constraints'),
        AsyncStorage.getItem('rules'),
      ]);

      if (storedAssignments) {
        setAssignments(JSON.parse(storedAssignments));
      }
      if (storedConstraints) {
        setConstraints(JSON.parse(storedConstraints));
      }
      if (storedRules) {
        const parsedRules = JSON.parse(storedRules);
        // Ensure all required properties exist
        const completeRules = {
          ...defaultRules,
          ...parsedRules,
          fullTimeRules: {
            ...defaultRules.fullTimeRules,
            ...parsedRules.fullTimeRules,
          },
          partTimeRules: {
            ...defaultRules.partTimeRules,
            ...parsedRules.partTimeRules,
          },
          perDiemRules: {
            ...defaultRules.perDiemRules,
            ...parsedRules.perDiemRules,
          },
          roleRules: {
            ...defaultRules.roleRules,
            ...parsedRules.roleRules,
          },
        };
        setRules(completeRules);
      } else {
        // No stored rules, use defaults
        setRules(defaultRules);
      }
    } catch (error) {
      console.error('Error loading schedule data:', error);
      // On error, use default rules
      setRules(defaultRules);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAssignments = async (newAssignments: ShiftAssignment[]) => {
    try {
      await AsyncStorage.setItem('assignments', JSON.stringify(newAssignments));
      setAssignments(newAssignments);
    } catch (error) {
      console.error('Error saving assignments:', error);
    }
  };

  const getAssignmentsForDate = (date: Date, unit: string): ShiftAssignment[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return assignments.filter(a => a.date === dateStr && a.unit === unit);
  };

  const getCoverageStatus = (date: Date, unit: string, shift: ShiftType): CoverageStatus => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const constraint = constraints.find(
      c => c.date === dateStr && c.unit === unit && c.shift === shift
    );

    const shiftAssignments = assignments.filter(
      a => a.date === dateStr && a.unit === unit && a.shift === shift
    );

    const roleBreakdown: Record<string, { current: number; required: number }> = {};
    
    if (constraint?.minRoleMix) {
      Object.entries(constraint.minRoleMix).forEach(([role, required]) => {
        const current = shiftAssignments.filter(a => {
          // In a real app, we'd look up the staff member's role
          // For now, we'll simulate it
          return true;
        }).length;
        
        roleBreakdown[role] = {
          current: Math.min(current, required as number),
          required: required as number,
        };
      });
    }

    const required = constraint?.minStaff || 0;
    const current = shiftAssignments.length;

    return {
      required,
      current,
      isMet: current >= required,
      roleBreakdown,
    };
  };

  const addAssignment = (assignment: ShiftAssignment) => {
    const updated = [...assignments, assignment];
    saveAssignments(updated);
  };

  const removeAssignment = (id: string) => {
    const updated = assignments.filter(a => a.id !== id);
    saveAssignments(updated);
  };

  /**
   * Update the minimum required count for a specific role in a given unit/date/shift.
   * This adjusts the minRoleMix for the corresponding constraint and persists it.
   */
  const updateConstraintMinRoleMix = (
    unit: string,
    date: string,
    shift: ShiftType,
    role: string,
    newRequired: number
  ) => {
    setConstraints(prev => {
      const updated = prev.map(c => {
        if (c.unit === unit && c.date === date && c.shift === shift) {
          const mix = { ...(c.minRoleMix || {}) };
          mix[role] = newRequired;
          return { ...c, minRoleMix: mix };
        }
        return c;
      });
      AsyncStorage.setItem('constraints', JSON.stringify(updated));
      return updated;
    });
  };

  /**
   * Update the required count for a specific skill in a given unit/date/shift.
   * Adjusts skillRequirements on the constraint and persists it.
   */
  const updateConstraintSkillRequirement = (
    unit: string,
    date: string,
    shift: ShiftType,
    skill: string,
    newRequired: number
  ) => {
    setConstraints(prev => {
      const updated = prev.map(c => {
        if (c.unit === unit && c.date === date && c.shift === shift) {
          const skills = { ...(c.skillRequirements || {}) };
          if (newRequired > 0) {
            skills[skill] = newRequired;
          } else {
            // remove skill if count is zero or negative
            delete skills[skill];
          }
          return { ...c, skillRequirements: skills };
        }
        return c;
      });
      AsyncStorage.setItem('constraints', JSON.stringify(updated));
      return updated;
    });
  };

  /**
   * Add a new skill requirement to a specific shift. If the skill already exists,
   * it will be updated to the provided count.
   */
  const addConstraintSkill = (
    unit: string,
    date: string,
    shift: ShiftType,
    skill: string,
    required: number
  ) => {
    updateConstraintSkillRequirement(unit, date, shift, skill, required);
  };

  /**
   * Update the minimum total staff required for a specific unit/date/shift.
   * Persists the change to AsyncStorage. Values less than zero will be clamped to zero.
   */
  const updateConstraintMinStaff = (
    unit: string,
    date: string,
    shift: ShiftType,
    newMinStaff: number,
  ) => {
    setConstraints((prev) => {
      const updated = prev.map((c) => {
        if (c.unit === unit && c.date === date && c.shift === shift) {
          return { ...c, minStaff: Math.max(0, newMinStaff) };
        }
        return c;
      });
      AsyncStorage.setItem('constraints', JSON.stringify(updated));
      return updated;
    });
  };

  const updateRule = (key: keyof ScheduleRules, value: any) => {
    const updated = { ...rules, [key]: value };
    setRules(updated);
    AsyncStorage.setItem('rules', JSON.stringify(updated));
  };

  const updateNestedRule = (path: string[], value: any) => {
    const updated = { ...rules };
    let current: any = updated;
    
    // Navigate to the nested property
    for (let i = 0; i < path.length - 1; i++) {
      current[path[i]] = { ...current[path[i]] };
      current = current[path[i]];
    }
    
    // Set the final value
    current[path[path.length - 1]] = value;
    
    setRules(updated);
    AsyncStorage.setItem('rules', JSON.stringify(updated));
  };

  const addAvailability = (staffAvailability: StaffAvailability) => {
    const updated = [...availability, staffAvailability];
    setAvailability(updated);
    AsyncStorage.setItem('availability', JSON.stringify(updated));
  };

  const addWorkPeriod = (workPeriod: WorkPeriod) => {
    const updated = [...workPeriods, workPeriod];
    setWorkPeriods(updated);
    AsyncStorage.setItem('workPeriods', JSON.stringify(updated));
  };

  const getWeekendDays = (startDate: Date, endDate: Date): Date[] => {
    const weekends: Date[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      // If week starts on Sunday (0), weekends are Saturday (6) and Sunday (0)
      // If week starts on Monday, weekends are Saturday (6) and Sunday (0)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekends.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }
    
    return weekends;
  };

  const validateWeekendRequirements = (staffId: string, startDate: Date, endDate: Date): boolean => {
    const weekends = getWeekendDays(startDate, endDate);
    const staffWeekendAssignments = assignments.filter(a => {
      const assignmentDate = new Date(a.date);
      return a.staffId === staffId && 
             weekends.some(w => w.toDateString() === assignmentDate.toDateString());
    });
    
    const weekendsWorked = staffWeekendAssignments.length;
    const totalWeekends = weekends.length;
    
    return weekendsWorked >= rules.minWeekendsPerPeriod && 
           weekendsWorked <= rules.maxWeekendsPerPeriod;
  };

  return {
    assignments,
    constraints,
    rules,
    availability,
    workPeriods,
    isLoading,
    getAssignmentsForDate,
    getCoverageStatus,
    addAssignment,
    removeAssignment,
    updateRule,
    updateNestedRule,
    addAvailability,
    addWorkPeriod,
    getWeekendDays,
    validateWeekendRequirements,
    updateConstraintMinRoleMix,
    updateConstraintSkillRequirement,
    addConstraintSkill,
    updateConstraintMinStaff,
  };
});}