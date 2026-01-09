import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { User, Award, Clock, Calendar, MapPin, Star, Plus, X } from 'lucide-react-native';
import { useStaff } from '@/providers/StaffProvider';
import React from 'react';
import { TextInput } from 'react-native';

export default function StaffDetailScreen() {
  const { id } = useLocalSearchParams();
  const { staff, updateStaffRole, updateStaffCertifications } = useStaff();
  
  const staffMember = staff.find(s => s.id === id);

  if (!staffMember) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Staff member not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Local state for editing role and certifications
  const [roleInput, setRoleInput] = React.useState(staffMember.role);
  const [certs, setCerts] = React.useState<string[]>([...staffMember.certifications]);
  const [newCert, setNewCert] = React.useState('');

  // Handlers for adding/removing certifications
  const handleAddCert = () => {
    const trimmed = newCert.trim();
    if (trimmed && !certs.includes(trimmed)) {
      setCerts([...certs, trimmed]);
      setNewCert('');
    }
  };
  const handleRemoveCert = (cert: string) => {
    setCerts(certs.filter(c => c !== cert));
  };
  // Save edits to provider
  const handleSaveEdits = () => {
    if (roleInput.trim()) {
      updateStaffRole(staffMember.id, roleInput.trim());
    }
    updateStaffCertifications(staffMember.id, certs);
    // navigate back or show success? For now nothing extra.
  };

  const roleColors: Record<string, string> = {
    RN: '#4A90E2',
    LVN: '#7B68EE',
    Tech: '#FF6B6B',
    ChargeRN: '#FFD700',
    FloatRN: '#20B2AA',
    UnitSecretary: '#FF69B4',
  };

  const roleColor = roleColors[staffMember.role] || '#4A90E2';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: roleColor + '20' }]}>
            <User size={48} color={roleColor} />
          </View>
          <Text style={styles.name}>{staffMember.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleColor + '20' }]}>
            <Text style={[styles.roleText, { color: roleColor }]}>
              {staffMember.role}
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Clock size={20} color="#4A90E2" />
            <Text style={styles.statValue}>{staffMember.fte}</Text>
            <Text style={styles.statLabel}>FTE</Text>
          </View>
          <View style={styles.statCard}>
            <Star size={20} color="#FFD700" />
            <Text style={styles.statValue}>{staffMember.seniority}</Text>
            <Text style={styles.statLabel}>Seniority</Text>
          </View>
          <View style={styles.statCard}>
            <Award size={20} color="#20B2AA" />
            <Text style={styles.statValue}>{staffMember.certifications.length}</Text>
            <Text style={styles.statLabel}>Certs</Text>
          </View>
        </View>

        {/* Details Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Information</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Employee ID</Text>
              <Text style={styles.detailValue}>{staffMember.id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Primary Unit</Text>
              <Text style={styles.detailValue}>{staffMember.primaryUnit}</Text>
            </View>
            {staffMember.secondaryUnits.length > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Float Units</Text>
                <Text style={styles.detailValue}>
                  {staffMember.secondaryUnits.join(', ')}
                </Text>
              </View>
            )}
            {staffMember.unionGroup && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Union Group</Text>
                <Text style={styles.detailValue}>{staffMember.unionGroup}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          <View style={styles.certGrid}>
            {staffMember.certifications.map((cert, idx) => (
              <View key={idx} style={styles.certCard}>
                <Award size={16} color="#4A90E2" />
                <Text style={styles.certName}>{cert}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Edit Role & Skills Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Edit Role & Skills</Text>
          <View style={styles.detailsCard}>
            {/* Role input */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Role</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={roleInput}
                onChangeText={setRoleInput}
                placeholder="Enter role"
                placeholderTextColor="#8E8E93"
              />
            </View>
            {/* Certifications editor */}
            <View style={{ paddingVertical: 8 }}>
              <Text style={[styles.detailLabel, { marginBottom: 6 }]}>Certifications</Text>
              <View style={styles.certEditList}>
                {certs.map((cert, idx) => (
                  <View key={idx} style={styles.certEditChip}>
                    <Text style={styles.certEditText}>{cert}</Text>
                    <TouchableOpacity onPress={() => handleRemoveCert(cert)}>
                      <X size={12} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.newCertRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={newCert}
                  onChangeText={setNewCert}
                  placeholder="Add certification"
                  placeholderTextColor="#8E8E93"
                />
                <TouchableOpacity
                  style={styles.addCertButton}
                  onPress={handleAddCert}
                >
                  <Plus size={14} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
            {/* Save button */}
            <TouchableOpacity
              style={styles.saveEditsButton}
              onPress={handleSaveEdits}
            >
              <Text style={styles.saveEditsText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule Preferences</Text>
          <View style={styles.detailsCard}>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Preferred Shifts</Text>
              <View style={styles.shiftTags}>
                <View style={styles.shiftTag}>
                  <Text style={styles.shiftTagText}>Day</Text>
                </View>
                <View style={styles.shiftTag}>
                  <Text style={styles.shiftTagText}>Evening</Text>
                </View>
              </View>
            </View>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Weekend Availability</Text>
              <Text style={styles.preferenceValue}>Every other weekend</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Schedule</Text>
          <View style={styles.scheduleCard}>
            <Text style={styles.scheduleText}>Last 4 weeks:</Text>
            <View style={styles.scheduleStats}>
              <View style={styles.scheduleStat}>
                <Text style={styles.scheduleStatValue}>32</Text>
                <Text style={styles.scheduleStatLabel}>Hours/Week</Text>
              </View>
              <View style={styles.scheduleStat}>
                <Text style={styles.scheduleStatValue}>4</Text>
                <Text style={styles.scheduleStatLabel}>Night Shifts</Text>
              </View>
              <View style={styles.scheduleStat}>
                <Text style={styles.scheduleStatValue}>2</Text>
                <Text style={styles.scheduleStatLabel}>Weekends</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Calendar size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>View Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
            <MapPin size={20} color="#4A90E2" />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              Edit Preferences
            </Text>
          </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  certGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  certCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  certName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  preferenceRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  preferenceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  shiftTags: {
    flexDirection: 'row',
    gap: 8,
  },
  shiftTag: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  shiftTagText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
  },
  scheduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  scheduleStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scheduleStat: {
    alignItems: 'center',
  },
  scheduleStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A90E2',
  },
  scheduleStatLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  actions: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  secondaryButtonText: {
    color: '#4A90E2',
  },
  /* Input used in edit section */
  input: {
    borderWidth: 1,
    borderColor: '#E0E6EC',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    color: '#1a1a1a',
  },
  certEditList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  certEditChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  certEditText: {
    fontSize: 13,
    color: '#1a1a1a',
    marginRight: 4,
  },
  newCertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addCertButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveEditsButton: {
    marginTop: 12,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveEditsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});