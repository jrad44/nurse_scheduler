import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Users, AlertCircle, CheckCircle, Plus } from 'lucide-react-native';
import { useSchedule } from '@/providers/ScheduleProvider';
import { useStaff } from '@/providers/StaffProvider';
import { format } from '@/utils/dateUtils';
import { ShiftType } from '@/types/schedule';

export default function ShiftDetailsScreen() {
  const params = useLocalSearchParams();
  const date = new Date(params.date as string);
  const unit = params.unit as string;
  const shift = params.shift as ShiftType;

  // format date string once for passing into update functions
  const dateStr = format(date, 'yyyy-MM-dd');

  const {
    getAssignmentsForDate,
    getCoverageStatus,
    constraints,
    updateConstraintMinRoleMix,
    updateConstraintSkillRequirement,
    addConstraintSkill,
    updateConstraintMinStaff,
  } = useSchedule();
  const { staff } = useStaff();

  // local state for adding a new skill requirement
  const [addingSkill, setAddingSkill] = React.useState(false);
  const [newSkillName, setNewSkillName] = React.useState('');
  const [newSkillCount, setNewSkillCount] = React.useState(1);

  const assignments = getAssignmentsForDate(date, unit).filter(a => a.shift === shift);
  const coverage = getCoverageStatus(date, unit, shift);
  const constraint = constraints.find(
    (c) => c.unit === unit && c.date === dateStr && c.shift === shift,
  );

  const shiftNames = {
    D: 'Day Shift (7AM-7PM)',
    E: 'Evening Shift (3PM-11PM)',
    N: 'Night Shift (7PM-7AM)',
  };

  const availableStaff = staff.filter((s) => {
    // Filter staff who could work this shift
    const isAssigned = assignments.some((a) => a.staffId === s.id);
    return !isAssigned && (s.primaryUnit === unit || s.secondaryUnits.includes(unit));
  });

  // handler to save a new skill requirement
  const handleSaveNewSkill = () => {
    if (newSkillName.trim()) {
      addConstraintSkill(unit, dateStr, shift, newSkillName.trim(), newSkillCount);
      setNewSkillName('');
      setNewSkillCount(1);
      setAddingSkill(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.date}>{format(date, 'EEEE, MMMM d, yyyy')}</Text>
          <Text style={styles.shiftName}>{shiftNames[shift]}</Text>
          <Text style={styles.unit}>{unit} Unit</Text>
        </View>

        {/* Coverage Status */}
        <View style={[
          styles.coverageCard,
          { borderLeftColor: coverage.isMet ? '#4CAF50' : '#F44336' }
        ]}>
          <View style={styles.coverageHeader}>
            {coverage.isMet ? (
              <CheckCircle size={24} color="#4CAF50" />
            ) : (
              <AlertCircle size={24} color="#F44336" />
            )}
            <Text style={styles.coverageTitle}>
              {coverage.isMet ? 'Coverage Met' : 'Coverage Gap'}
            </Text>
          </View>
          
          <View style={styles.coverageStats}>
            {/* Total staff control */}
            <View style={styles.roleControlRow}>
              <Text style={styles.coverageStatLabel}>Total Staff</Text>
              <View style={styles.roleControlButtons}>
                <TouchableOpacity
                  style={styles.roleControlButton}
                  onPress={() => updateConstraintMinStaff(unit, dateStr, shift, Math.max(0, (constraint?.minStaff || 0) - 1))}
                >
                  <Text style={styles.roleControlButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.roleControlValue}>{constraint?.minStaff || 0}</Text>
                <TouchableOpacity
                  style={styles.roleControlButton}
                  onPress={() => updateConstraintMinStaff(unit, dateStr, shift, (constraint?.minStaff || 0) + 1)}
                >
                  <Text style={styles.roleControlButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text
                style={[
                  styles.coverageStatValue,
                  { color: coverage.current >= (constraint?.minStaff || 0) ? '#4CAF50' : '#F44336' },
                ]}
              >
                {coverage.current}/{constraint?.minStaff || 0}
              </Text>
            </View>
            
            {Object.entries(coverage.roleBreakdown).map(([role, { current, required }]) => {
              return (
                <View key={role} style={styles.roleControlRow}>
                  {/* role label */}
                  <Text style={styles.coverageStatLabel}>{role}</Text>
                  {/* controls for adjusting required count */}
                  <View style={styles.roleControlButtons}>
                    <TouchableOpacity
                      style={styles.roleControlButton}
                      onPress={() => updateConstraintMinRoleMix(unit, dateStr, shift, role, Math.max(0, required - 1))}
                    >
                      <Text style={styles.roleControlButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.roleControlValue}>{required}</Text>
                    <TouchableOpacity
                      style={styles.roleControlButton}
                      onPress={() => updateConstraintMinRoleMix(unit, dateStr, shift, role, required + 1)}
                    >
                      <Text style={styles.roleControlButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  {/* display current/required counts */}
                  <Text style={[
                    styles.coverageStatValue,
                    { color: current >= required ? '#4CAF50' : '#F44336' }
                  ]}>
                    {current}/{required}
                  </Text>
                </View>
              );
            })}
          </View>

          {constraint?.skillRequirements && (
            <View style={styles.skillRequirements}>
              <Text style={styles.skillTitle}>Required Skills:</Text>
              {Object.keys(constraint.skillRequirements).length > 0 &&
                Object.entries(constraint.skillRequirements).map(([skill, reqCount]) => {
                  // count how many assigned staff have this skill
                  const currentCount = assignments.reduce((acc, a) => {
                    const member = staff.find((s) => s.id === a.staffId);
                    if (member?.certifications?.includes(skill)) {
                      return acc + 1;
                    }
                    return acc;
                  }, 0);
                  const filled = currentCount >= (reqCount as number);
                  return (
                    <View key={skill} style={styles.skillControlRow}>
                      <Text style={styles.skillName}>{skill}</Text>
                      <View style={styles.roleControlButtons}>
                        <TouchableOpacity
                          style={styles.roleControlButton}
                          onPress={() =>
                            updateConstraintSkillRequirement(
                              unit,
                              dateStr,
                              shift,
                              skill,
                              Math.max(0, (reqCount as number) - 1),
                            )
                          }
                        >
                          <Text style={styles.roleControlButtonText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.roleControlValue}>{reqCount as number}</Text>
                        <TouchableOpacity
                          style={styles.roleControlButton}
                          onPress={() =>
                            updateConstraintSkillRequirement(
                              unit,
                              dateStr,
                              shift,
                              skill,
                              (reqCount as number) + 1,
                            )
                          }
                        >
                          <Text style={styles.roleControlButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={{ color: filled ? '#4CAF50' : '#F44336', fontSize: 12 }}>
                        {filled ? 'Filled' : 'Needed'}
                      </Text>
                    </View>
                  );
                })}

              {/* Add Skill Section */}
              {addingSkill ? (
                <View style={styles.newSkillSection}>
                  <TextInput
                    style={styles.newSkillInput}
                    value={newSkillName}
                    onChangeText={setNewSkillName}
                    placeholder="Skill name"
                    placeholderTextColor="#8E8E93"
                  />
                  <View style={styles.roleControlButtons}>
                    <TouchableOpacity
                      style={styles.roleControlButton}
                      onPress={() => setNewSkillCount(Math.max(1, newSkillCount - 1))}
                    >
                      <Text style={styles.roleControlButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.roleControlValue}>{newSkillCount}</Text>
                    <TouchableOpacity
                      style={styles.roleControlButton}
                      onPress={() => setNewSkillCount(newSkillCount + 1)}
                    >
                      <Text style={styles.roleControlButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.newSkillActions}>
                    <TouchableOpacity
                      style={[styles.saveButton, { marginRight: 8 }]}
                      onPress={handleSaveNewSkill}
                    >
                      <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setAddingSkill(false);
                        setNewSkillName('');
                        setNewSkillCount(1);
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addSkillButton}
                  onPress={() => setAddingSkill(true)}
                >
                  <Text style={styles.addSkillButtonText}>+ Add Skill</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Assigned Staff */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Assigned Staff ({assignments.length})</Text>
            <TouchableOpacity style={styles.addButton}>
              <Plus size={16} color="#ffffff" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {assignments.length > 0 ? (
            <View style={styles.staffList}>
              {assignments.map((assignment, idx) => {
                const staffMember = staff.find(s => s.id === assignment.staffId);
                if (!staffMember) return null;

                return (
                  <TouchableOpacity key={idx} style={styles.staffCard}>
                    <View style={styles.staffInfo}>
                      <Text style={styles.staffName}>{staffMember.name}</Text>
                      <View style={styles.staffMeta}>
                        <View style={styles.roleBadge}>
                          <Text style={styles.roleText}>{staffMember.role}</Text>
                        </View>
                        <Text style={styles.fteText}>FTE: {staffMember.fte}</Text>
                      </View>
                      {staffMember.certifications.length > 0 && (
                        <View style={styles.certList}>
                          {staffMember.certifications.slice(0, 3).map((cert, certIdx) => (
                            <View key={certIdx} style={styles.certChip}>
                              <Text style={styles.certText}>{cert}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                    <TouchableOpacity style={styles.removeButton}>
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Users size={32} color="#C7C7CC" />
              <Text style={styles.emptyText}>No staff assigned yet</Text>
            </View>
          )}
        </View>

        {/* Available Staff */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Staff ({availableStaff.length})</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.availableList}
          >
            {availableStaff.map((staffMember, idx) => (
              <TouchableOpacity key={idx} style={styles.availableCard}>
                <Text style={styles.availableName}>{staffMember.name}</Text>
                <Text style={styles.availableRole}>{staffMember.role}</Text>
                <TouchableOpacity style={styles.assignButton}>
                  <Text style={styles.assignButtonText}>Assign</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Notes */}
        {constraint?.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{constraint.notes}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  date: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  shiftName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  unit: {
    fontSize: 16,
    color: '#4A90E2',
  },
  coverageCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  coverageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  coverageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  coverageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  coverageStat: {
    alignItems: 'center',
  },
  coverageStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  coverageStatLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  skillRequirements: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  skillTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  skillItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  skillName: {
    fontSize: 13,
    color: '#1a1a1a',
  },
  skillCount: {
    fontSize: 13,
    color: '#8E8E93',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  staffList: {
    gap: 12,
  },
  staffCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  staffMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 11,
    color: '#4A90E2',
    fontWeight: '500',
  },
  fteText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  certList: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  certChip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  certText: {
    fontSize: 10,
    color: '#1a1a1a',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  removeButtonText: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  availableList: {
    paddingVertical: 8,
    gap: 12,
  },
  availableCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    width: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  availableName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  availableRole: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 8,
  },
  assignButton: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 4,
  },
  assignButtonText: {
    fontSize: 11,
    color: '#4A90E2',
    fontWeight: '500',
  },
  notesSection: {
    margin: 16,
    padding: 12,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  /* Added styles for role controls and new skill section */
  roleControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  roleControlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  roleControlButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E5EEF7',
  },
  roleControlButtonText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
  },
  roleControlValue: {
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  skillControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  /* New skill addition styles */
  newSkillSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  newSkillInput: {
    borderWidth: 1,
    borderColor: '#E0E6EC',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8,
    fontSize: 14,
    color: '#1a1a1a',
  },
  newSkillActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  addSkillButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addSkillButtonText: {
    fontSize: 13,
    color: '#4A90E2',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveButtonText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelButtonText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
});