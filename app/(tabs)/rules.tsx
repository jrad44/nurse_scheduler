import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Clock, Calendar, Users, AlertCircle, ChevronRight, CalendarDays, UserCheck, Briefcase, Settings } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useSchedule } from '@/providers/ScheduleProvider';

export default function RulesScreen() {
  const { rules, updateRule, updateNestedRule, isLoading } = useSchedule();
  const [deviationWeight, setDeviationWeight] = useState(50);
  // Local state for staffing templates
  const [templates, setTemplates] = useState<{ id: string; name: string; details: string }[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);

  // Load templates from AsyncStorage once
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const stored = await AsyncStorage.getItem('staffingTemplates');
        if (stored) {
          setTemplates(JSON.parse(stored));
        } else {
          // seed with a couple of defaults similar to the mock UI
          const defaultTemplates = [
            { id: 'temp-1', name: 'ICU Standard', details: 'RN: 6, Tech: 2, ChargeRN: 1' },
            { id: 'temp-2', name: 'ER Weekend', details: 'RN: 8, Tech: 3, ChargeRN: 1' },
            { id: 'temp-3', name: 'Holiday Coverage', details: 'RN: 5, Tech: 2, ChargeRN: 1' },
          ];
          setTemplates(defaultTemplates);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setTemplatesLoaded(true);
      }
    };
    loadTemplates();
  }, []);

  // Save templates to AsyncStorage when changed
  const saveTemplates = async (newTemplates: any[]) => {
    setTemplates(newTemplates);
    try {
      await AsyncStorage.setItem('staffingTemplates', JSON.stringify(newTemplates));
    } catch (error) {
      console.error('Error saving templates:', error);
    }
  };

  const handleAddTemplate = () => {
    const newId = `temp-${Date.now()}`;
    const newTemplate = { id: newId, name: `New Template`, details: 'RN: 0, Tech: 0' };
    const updated = [...templates, newTemplate];
    saveTemplates(updated);
    // Optionally navigate to editing screen or alert
    Alert.alert('Template Added', 'Your new template has been added. Tap it to edit.');
  };

  const handleTemplatePress = (template: { id: string; name: string; details: string }) => {
    // For now, just show an alert with the details. In a full app, navigate to an edit screen.
    Alert.alert(template.name, template.details);
  };

  // Early return if rules are not loaded yet
  if (isLoading || !templatesLoaded) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading rules...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const ruleCategories = [
    {
      title: 'Labor Rules',
      icon: <Clock size={20} color="#4A90E2" />,
      rules: [
        {
          key: 'maxConsecutiveDays',
          label: 'Max Consecutive Days',
          value: rules.maxConsecutiveDays,
          type: 'number' as const,
          min: 1,
          max: 7,
        },
        {
          key: 'minRestHours',
          label: 'Min Rest Hours Between Shifts',
          value: rules.minRestHours,
          type: 'number' as const,
          min: 8,
          max: 16,
        },
        {
          key: 'maxShiftsPerWeek',
          label: 'Max Shifts Per Week',
          value: rules.maxShiftsPerWeek,
          type: 'number' as const,
          min: 3,
          max: 6,
        },
      ],
    },
    {
      title: 'Fairness Rules',
      icon: <Users size={20} color="#7B68EE" />,
      rules: [
        {
          key: 'minWeekendsOff',
          label: 'Min Weekends Off (per 4 weeks)',
          value: rules.minWeekendsOff,
          type: 'number' as const,
          min: 1,
          max: 3,
        },
        {
          key: 'rotateNightsFairly',
          label: 'Rotate Nights Fairly',
          value: rules.rotateNightsFairly,
          type: 'boolean' as const,
        },
        {
          key: 'avoidChargeDuplication',
          label: 'Avoid Consecutive Charge Shifts',
          value: rules.avoidChargeDuplication,
          type: 'boolean' as const,
        },
      ],
    },
    {
      title: 'Weekend & Work Period Rules',
      icon: <CalendarDays size={20} color="#FF6B6B" />,
      rules: [
        {
          key: 'minWeekendsPerPeriod',
          label: 'Min Weekends Per Period',
          value: rules.minWeekendsPerPeriod,
          type: 'number' as const,
          min: 1,
          max: 6,
        },
        {
          key: 'maxWeekendsPerPeriod',
          label: 'Max Weekends Per Period',
          value: rules.maxWeekendsPerPeriod,
          type: 'number' as const,
          min: 2,
          max: 8,
        },
        {
          key: 'weekStartsOnSunday',
          label: 'Week Starts on Sunday',
          value: rules.weekStartsOnSunday,
          type: 'boolean' as const,
        },
      ],
    },
  ];

  const employmentTypeCategories = [
    {
      title: 'Full-Time Rules',
      type: 'fullTimeRules' as const,
      enabled: rules.fullTimeRules?.enabled ?? false,
      rules: rules.fullTimeRules,
    },
    {
      title: 'Part-Time Rules', 
      type: 'partTimeRules' as const,
      enabled: rules.partTimeRules?.enabled ?? false,
      rules: rules.partTimeRules,
    },
    {
      title: 'Per Diem Rules',
      type: 'perDiemRules' as const, 
      enabled: rules.perDiemRules?.enabled ?? false,
      rules: rules.perDiemRules,
    },
  ];

  const roleCategories = Object.entries(rules.roleRules || {}).map(([role, ruleSet]) => ({
    title: `${role} Rules`,
    role,
    enabled: ruleSet?.enabled ?? false,
    rules: ruleSet,
  }));

  const renderRuleControl = (rule: any) => {
    if (rule.type === 'boolean') {
      return (
        <Switch
          value={rule.value}
          onValueChange={(value) => updateRule(rule.key, value)}
          trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
          thumbColor="#ffffff"
        />
      );
    }

    if (rule.type === 'number') {
      return (
        <View style={styles.numberControl}>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => {
              const newValue = Math.max(rule.min, rule.value - 1);
              updateRule(rule.key, newValue);
            }}
          >
            <Text style={styles.numberButtonText}>\uc0\u8722 </Text>
          </TouchableOpacity>
          <Text style={styles.numberValue}>{rule.value}</Text>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => {
              const newValue = Math.min(rule.max, rule.value + 1);
              updateRule(rule.key, newValue);
            }}
          >
            <Text style={styles.numberButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Optimization Weight */}
        <View style={styles.weightSection}>
          <View style={styles.weightHeader}>
            <Shield size={20} color="#FF6B6B" />
            <Text style={styles.weightTitle}>Schedule Optimization</Text>
          </View>
          
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Stick to Original Requests</Text>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderEndLabel}>Flexible</Text>
              <View style={styles.sliderTrack}>
                <View 
                  style={[styles.sliderFill, { width: `${deviationWeight}%` }]}
                />
                <View 
                  style={[styles.sliderThumb, { left: `${deviationWeight}%` }]}
                />
              </View>
              <Text style={styles.sliderEndLabel}>Strict</Text>
            </View>
            <Text style={styles.sliderValue}>{deviationWeight}%</Text>
          </View>

          <View style={styles.presets}>
            <Text style={styles.presetsLabel}>Quick Presets:</Text>
            <View style={styles.presetButtons}>
              <TouchableOpacity 
                style={styles.presetButton}
                onPress={() => setDeviationWeight(25)}
              >
                <Text style={styles.presetButtonText}>Coverage First</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.presetButton}
                onPress={() => setDeviationWeight(50)}
              >
                <Text style={styles.presetButtonText}>Balanced</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.presetButton}
                onPress={() => setDeviationWeight(75)}
              >
                <Text style={styles.presetButtonText}>Honor Requests</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Work Period Settings */}
        <View style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <Calendar size={20} color="#20B2AA" />
            <Text style={styles.categoryTitle}>Work Period Settings</Text>
          </View>
          
          <View style={styles.rulesContainer}>
            <View style={styles.ruleItem}>
              <View style={styles.ruleInfo}>
                <Text style={styles.ruleLabel}>Period Start Date</Text>
                <Text style={styles.ruleHint}>{rules.workPeriodStartDate}</Text>
              </View>
              <TouchableOpacity style={styles.dateButton}>
                <Text style={styles.dateButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
            
            <View style={[styles.ruleItem, styles.ruleItemBorder]}>
              <View style={styles.ruleInfo}>
                <Text style={styles.ruleLabel}>Period End Date</Text>
                <Text style={styles.ruleHint}>{rules.workPeriodEndDate}</Text>
              </View>
              <TouchableOpacity style={styles.dateButton}>
                <Text style={styles.dateButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Rule Categories */}
        {ruleCategories.map((category, idx) => (
          <View key={idx} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              {category.icon}
              <Text style={styles.categoryTitle}>{category.title}</Text>
            </View>
            
            <View style={styles.rulesContainer}>
              {category.rules.map((rule, ruleIdx) => (
                <View 
                  key={ruleIdx} 
                  style={[
                    styles.ruleItem,
                    ruleIdx < category.rules.length - 1 && styles.ruleItemBorder
                  ]}
                >
                  <View style={styles.ruleInfo}>
                    <Text style={styles.ruleLabel}>{rule.label}</Text>
                    {rule.type === 'number' && (
                      <Text style={styles.ruleHint}>
                        Range: {rule.min}-{rule.max}
                      </Text>
                    )}
                  </View>
                  {renderRuleControl(rule)}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Rule Enforcement Toggles */}
        <View style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <Settings size={20} color="#FF9500" />
            <Text style={styles.categoryTitle}>Rule Enforcement</Text>
          </View>
          
          <View style={styles.rulesContainer}>
            <View style={styles.ruleItem}>
              <View style={styles.ruleInfo}>
                <Text style={styles.ruleLabel}>Enforce Employment Type Rules</Text>
                <Text style={styles.ruleHint}>Apply different rules based on FT/PT/Per Diem status</Text>
              </View>
              <Switch
                value={rules.enforceEmploymentTypeRules}
                onValueChange={(value) => updateRule('enforceEmploymentTypeRules', value)}
                trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                thumbColor="#ffffff"
              />
            </View>
            
            <View style={[styles.ruleItem, styles.ruleItemBorder]}>
              <View style={styles.ruleInfo}>
                <Text style={styles.ruleLabel}>Enforce Role-Specific Rules</Text>
                <Text style={styles.ruleHint}>Apply different rules for RN, Tech, Charge, etc.</Text>
              </View>
              <Switch
                value={rules.enforceRoleSpecificRules}
                onValueChange={(value) => updateRule('enforceRoleSpecificRules', value)}
                trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                thumbColor="#ffffff"
              />
            </View>
            
            <View style={[styles.ruleItem, styles.ruleItemBorder]}>
              <View style={styles.ruleInfo}>
                <Text style={styles.ruleLabel}>Enforce Weekend Requirements</Text>
                <Text style={styles.ruleHint}>Ensure fair weekend coverage distribution</Text>
              </View>
              <Switch
                value={rules.enforceWeekendRequirements}
                onValueChange={(value) => updateRule('enforceWeekendRequirements', value)}
                trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                thumbColor="#ffffff"
              />
            </View>
            
            <View style={styles.ruleItem}>
              <View style={styles.ruleInfo}>
                <Text style={styles.ruleLabel}>Enforce Certification Requirements</Text>
                <Text style={styles.ruleHint}>Match staff certifications to shift requirements</Text>
              </View>
              <Switch
                value={rules.enforceCertificationRequirements}
                onValueChange={(value) => updateRule('enforceCertificationRequirements', value)}
                trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Employment Type Rules */}
        {rules.enforceEmploymentTypeRules && (
          <View style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Briefcase size={20} color="#34C759" />
              <Text style={styles.categoryTitle}>Employment Type Rules</Text>
            </View>
            
            {employmentTypeCategories.map((category, idx) => (
              <View key={idx} style={styles.subCategoryContainer}>
                <View style={styles.subCategoryHeader}>
                  <Text style={styles.subCategoryTitle}>{category.title}</Text>
                  <Switch
                    value={category.enabled}
                    onValueChange={(value) => {
                      updateNestedRule([category.type, 'enabled'], value);
                    }}
                    trackColor={{ false: '#E0E0E0', true: '#34C759' }}
                    thumbColor="#ffffff"
                  />
                </View>
                
                {category.enabled && (
                  <View style={styles.rulesContainer}>
                    <View style={styles.ruleItem}>
                      <Text style={styles.ruleLabel}>Min Shifts Per Week: {category.rules.minShiftsPerWeek}</Text>
                    </View>
                    <View style={[styles.ruleItem, styles.ruleItemBorder]}>
                      <Text style={styles.ruleLabel}>Max Shifts Per Week: {category.rules.maxShiftsPerWeek}</Text>
                    </View>
                    <View style={[styles.ruleItem, styles.ruleItemBorder]}>
                      <Text style={styles.ruleLabel}>Weekend Coverage: {category.rules.requiresWeekendCoverage ? 'Required' : 'Optional'}</Text>
                    </View>
                    <View style={styles.ruleItem}>
                      <Text style={styles.ruleLabel}>Max Consecutive Days: {category.rules.maxConsecutiveDays}</Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Role-Specific Rules */}
        {rules.enforceRoleSpecificRules && (
          <View style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <UserCheck size={20} color="#AF52DE" />
              <Text style={styles.categoryTitle}>Role-Specific Rules</Text>
            </View>
            
            {roleCategories.map((category, idx) => (
              <View key={idx} style={styles.subCategoryContainer}>
                <View style={styles.subCategoryHeader}>
                  <Text style={styles.subCategoryTitle}>{category.title}</Text>
                  <Switch
                    value={category.enabled}
                    onValueChange={(value) => {
                      updateNestedRule(['roleRules', category.role, 'enabled'], value);
                    }}
                    trackColor={{ false: '#E0E0E0', true: '#AF52DE' }}
                    thumbColor="#ffffff"
                  />
                </View>
                
                {category.enabled && (
                  <View style={styles.rulesContainer}>
                    <View style={styles.ruleItem}>
                      <Text style={styles.ruleLabel}>Max Consecutive Nights: {category.rules.maxConsecutiveNights}</Text>
                    </View>
                    <View style={[styles.ruleItem, styles.ruleItemBorder]}>
                      <Text style={styles.ruleLabel}>Priority Level: {category.rules.priorityLevel}/5</Text>
                    </View>
                    <View style={[styles.ruleItem, styles.ruleItemBorder]}>
                      <Text style={styles.ruleLabel}>Required Certs: {category.rules.requiresCertification.join(', ') || 'None'}</Text>
                    </View>
                    <View style={styles.ruleItem}>
                      <Text style={styles.ruleLabel}>Can Float To: {category.rules.canFloatToUnits.join(', ')}</Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Staffing Templates */}
        <View style={styles.templateSection}>
          <View style={styles.templateHeader}>
            <Calendar size={20} color="#20B2AA" />
            <Text style={styles.templateTitle}>Staffing Templates</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddTemplate}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.templatesContainer}>
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateItem}
                onPress={() => handleTemplatePress(template)}
              >
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templateDetails}>{template.details}</Text>
                </View>
                <ChevronRight size={20} color="#C7C7CC" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <AlertCircle size={20} color="#4A90E2" />
          <Text style={styles.infoText}>
            Changes to rules will affect future schedule generation. Existing schedules remain unchanged until regenerated.
          </Text>
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
  weightSection: {
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
  weightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  weightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderEndLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#4A90E2',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#4A90E2',
    top: -8,
    marginLeft: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A90E2',
    textAlign: 'center',
    marginTop: 8,
  },
  presets: {
    marginTop: 8,
  },
  presetsLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  presetButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4A90E2',
  },
  categorySection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  rulesContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ruleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  ruleItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  ruleInfo: {
    flex: 1,
  },
  ruleLabel: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  ruleHint: {
    fontSize: 11,
    color: '#8E8E93',
  },
  numberControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  numberButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A90E2',
  },
  numberValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    minWidth: 24,
    textAlign: 'center',
  },
  templateSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  templatesContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  templateDetails: {
    fontSize: 12,
    color: '#8E8E93',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F4FD',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#4A90E2',
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  dateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4A90E2',
  },
  subCategoryContainer: {
    marginBottom: 12,
  },
  subCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  subCategoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});}