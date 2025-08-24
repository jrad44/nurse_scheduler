import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react-native';
import { useSchedule } from '@/providers/ScheduleProvider';
import { useStaff } from '@/providers/StaffProvider';
import { format, addDays, startOfWeek, isSameDay } from '@/utils/dateUtils';
import { ShiftType, ShiftAssignment } from '@/types/schedule';
import { router } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

export default function ScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedUnit, setSelectedUnit] = useState('ICU');
  const { assignments, constraints, getAssignmentsForDate, getCoverageStatus } = useSchedule();
  const { staff } = useStaff();

  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const units = ['ICU', 'ER', 'Med-Surg', 'Pediatrics', 'OR'];
  const shifts: ShiftType[] = ['D', 'E', 'N'];

  const currentAssignments = useMemo(() => {
    return getAssignmentsForDate(selectedDate, selectedUnit);
  }, [selectedDate, selectedUnit, assignments]);

  const coverageByShift = useMemo(() => {
    const coverage: Record<ShiftType, ReturnType<typeof getCoverageStatus>> = {
      D: getCoverageStatus(selectedDate, selectedUnit, 'D'),
      E: getCoverageStatus(selectedDate, selectedUnit, 'E'),
      N: getCoverageStatus(selectedDate, selectedUnit, 'N'),
    };
    return coverage;
  }, [selectedDate, selectedUnit, constraints]);

  const navigateWeek = (direction: number) => {
    setSelectedDate(prev => addDays(prev, direction * 7));
  };

  const renderShiftCard = (shift: ShiftType) => {
    const shiftAssignments = currentAssignments.filter(a => a.shift === shift);
    const coverage = coverageByShift[shift];
    
    const shiftNames = {
      D: 'Day (7AM-7PM)',
      E: 'Evening (3PM-11PM)',
      N: 'Night (7PM-7AM)',
    };

    const statusColor = coverage.isMet ? '#4CAF50' : coverage.current > 0 ? '#FF9800' : '#F44336';

    return (
      <TouchableOpacity
        key={shift}
        style={styles.shiftCard}
        onPress={() => router.push({
          pathname: '/shift-details',
          params: { date: selectedDate.toISOString(), unit: selectedUnit, shift }
        })}
        testID={`shift-card-${shift}`}
      >
        <View style={styles.shiftHeader}>
          <Text style={styles.shiftTitle}>{shiftNames[shift]}</Text>
          <View style={[styles.coverageBadge, { backgroundColor: statusColor + '20' }]}>
            {coverage.isMet ? (
              <CheckCircle size={16} color={statusColor} />
            ) : (
              <AlertCircle size={16} color={statusColor} />
            )}
            <Text style={[styles.coverageText, { color: statusColor }]}>
              {coverage.current}/{coverage.required}
            </Text>
          </View>
        </View>

        <View style={styles.roleBreakdown}>
          {Object.entries(coverage.roleBreakdown).map(([role, { current, required }]) => (
            <View key={role} style={styles.roleItem}>
              <Text style={styles.roleLabel}>{role}:</Text>
              <Text style={[
                styles.roleCount,
                { color: current >= required ? '#4CAF50' : '#F44336' }
              ]}>
                {current}/{required}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.assignedStaff}>
          {shiftAssignments.slice(0, 3).map((assignment, idx) => {
            const staffMember = staff.find(s => s.id === assignment.staffId);
            return (
              <View key={idx} style={styles.staffChip}>
                <Text style={styles.staffName} numberOfLines={1}>
                  {staffMember?.name || 'Unknown'}
                </Text>
                <Text style={styles.staffRole}>{staffMember?.role}</Text>
              </View>
            );
          })}
          {shiftAssignments.length > 3 && (
            <Text style={styles.moreStaff}>+{shiftAssignments.length - 3} more</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Week Navigation */}
        <View style={styles.weekNav}>
          <TouchableOpacity onPress={() => navigateWeek(-1)} style={styles.navButton}>
            <ChevronLeft size={24} color="#4A90E2" />
          </TouchableOpacity>
          <Text style={styles.weekTitle}>
            {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </Text>
          <TouchableOpacity onPress={() => navigateWeek(1)} style={styles.navButton}>
            <ChevronRight size={24} color="#4A90E2" />
          </TouchableOpacity>
        </View>

        {/* Day Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.daySelector}
          contentContainerStyle={styles.daySelectorContent}
        >
          {weekDays.map(day => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            
            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={[
                  styles.dayButton,
                  isSelected && styles.dayButtonSelected,
                  isToday && styles.dayButtonToday,
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text style={[
                  styles.dayName,
                  isSelected && styles.dayTextSelected,
                ]}>
                  {format(day, 'EEE')}
                </Text>
                <Text style={[
                  styles.dayNumber,
                  isSelected && styles.dayTextSelected,
                ]}>
                  {format(day, 'd')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Unit Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.unitSelector}
          contentContainerStyle={styles.unitSelectorContent}
        >
          {units.map(unit => (
            <TouchableOpacity
              key={unit}
              style={[
                styles.unitButton,
                selectedUnit === unit && styles.unitButtonSelected,
              ]}
              onPress={() => setSelectedUnit(unit)}
            >
              <Text style={[
                styles.unitText,
                selectedUnit === unit && styles.unitTextSelected,
              ]}>
                {unit}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Coverage Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {format(selectedDate, 'EEEE, MMMM d')} - {selectedUnit}
          </Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Object.values(coverageByShift).filter(c => c.isMet).length}/3
              </Text>
              <Text style={styles.statLabel}>Shifts Covered</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {currentAssignments.length}
              </Text>
              <Text style={styles.statLabel}>Staff Assigned</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#FF9800' }]}>
                {Object.values(coverageByShift).reduce((acc, c) => 
                  acc + Math.max(0, c.required - c.current), 0
                )}
              </Text>
              <Text style={styles.statLabel}>Gaps</Text>
            </View>
          </View>
        </View>

        {/* Shift Cards */}
        <View style={styles.shiftsContainer}>
          {shifts.map(renderShiftCard)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  navButton: {
    padding: 8,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  daySelector: {
    backgroundColor: '#ffffff',
    maxHeight: 80,
  },
  daySelectorContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  dayButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  dayButtonSelected: {
    backgroundColor: '#4A90E2',
  },
  dayButtonToday: {
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  dayName: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  dayTextSelected: {
    color: '#ffffff',
  },
  unitSelector: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  unitSelectorContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  unitButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 4,
  },
  unitButtonSelected: {
    backgroundColor: '#4A90E2',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  unitTextSelected: {
    color: '#ffffff',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4A90E2',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  shiftsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  shiftCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shiftTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  coverageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  coverageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  roleBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  roleCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  assignedStaff: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  staffChip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: 100,
  },
  staffName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  staffRole: {
    fontSize: 10,
    color: '#8E8E93',
  },
  moreStaff: {
    fontSize: 12,
    color: '#4A90E2',
    alignSelf: 'center',
    paddingHorizontal: 8,
  },
});}