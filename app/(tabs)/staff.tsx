import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, User, Award, Clock, Calendar } from 'lucide-react-native';
import { useStaff } from '@/providers/StaffProvider';
import { router } from 'expo-router';
import { StaffMember, Role } from '@/types/staff';

export default function StaffScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | 'All'>('All');
  const { staff } = useStaff();

  const roles: (Role | 'All')[] = ['All', 'RN', 'LVN', 'Tech', 'ChargeRN', 'FloatRN'];

  const filteredStaff = useMemo(() => {
    return staff.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           member.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = selectedRole === 'All' || member.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [staff, searchQuery, selectedRole]);

  const renderStaffCard = ({ item }: { item: StaffMember }) => {
    const roleColors: Record<Role, string> = {
      RN: '#4A90E2',
      LVN: '#7B68EE',
      Tech: '#FF6B6B',
      ChargeRN: '#FFD700',
      FloatRN: '#20B2AA',
      UnitSecretary: '#FF69B4',
    };

    return (
      <TouchableOpacity
        style={styles.staffCard}
        onPress={() => router.push(`/staff/${item.id}`)}
        testID={`staff-card-${item.id}`}
      >
        <View style={styles.staffHeader}>
          <View style={[styles.avatar, { backgroundColor: roleColors[item.role] + '20' }]}>
            <User size={24} color={roleColors[item.role]} />
          </View>
          <View style={styles.staffInfo}>
            <Text style={styles.staffName}>{item.name}</Text>
            <View style={styles.staffMeta}>
              <View style={[styles.roleBadge, { backgroundColor: roleColors[item.role] + '20' }]}>
                <Text style={[styles.roleText, { color: roleColors[item.role] }]}>
                  {item.role}
                </Text>
              </View>
              <Text style={styles.unitText}>{item.primaryUnit}</Text>
            </View>
          </View>
          <View style={styles.fteContainer}>
            <Text style={styles.fteLabel}>FTE</Text>
            <Text style={styles.fteValue}>{item.fte}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Clock size={14} color="#8E8E93" />
            <Text style={styles.statText}>40h/week</Text>
          </View>
          <View style={styles.statItem}>
            <Calendar size={14} color="#8E8E93" />
            <Text style={styles.statText}>2 weekends</Text>
          </View>
          <View style={styles.statItem}>
            <Award size={14} color="#8E8E93" />
            <Text style={styles.statText}>{item.certifications.length} certs</Text>
          </View>
        </View>

        {item.certifications.length > 0 && (
          <View style={styles.certifications}>
            {item.certifications.slice(0, 3).map((cert, idx) => (
              <View key={idx} style={styles.certChip}>
                <Text style={styles.certText}>{cert}</Text>
              </View>
            ))}
            {item.certifications.length > 3 && (
              <Text style={styles.moreCerts}>+{item.certifications.length - 3}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff by name or ID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#8E8E93"
          />
        </View>
      </View>

      {/* Role Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {roles.map(role => (
          <TouchableOpacity
            key={role}
            style={[
              styles.filterButton,
              selectedRole === role && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedRole(role)}
          >
            <Text style={[
              styles.filterText,
              selectedRole === role && styles.filterTextActive,
            ]}>
              {role}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{filteredStaff.length}</Text>
          <Text style={styles.summaryLabel}>Total Staff</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {filteredStaff.filter(s => s.fte >= 1).length}
          </Text>
          <Text style={styles.summaryLabel}>Full Time</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {filteredStaff.filter(s => s.fte < 1).length}
          </Text>
          <Text style={styles.summaryLabel}>Part Time</Text>
        </View>
      </View>

      {/* Staff List */}
      <FlatList
        data={filteredStaff}
        renderItem={renderStaffCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <User size={48} color="#C7C7CC" />
            <Text style={styles.emptyText}>No staff members found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1a1a1a',
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    maxHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 4,
  },
  filterButtonActive: {
    backgroundColor: '#4A90E2',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4A90E2',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  separator: {
    height: 12,
  },
  staffCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffInfo: {
    flex: 1,
    marginLeft: 12,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  staffMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  unitText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  fteContainer: {
    alignItems: 'center',
  },
  fteLabel: {
    fontSize: 10,
    color: '#8E8E93',
    marginBottom: 2,
  },
  fteValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  certifications: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  certChip: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  certText: {
    fontSize: 11,
    color: '#4A90E2',
    fontWeight: '500',
  },
  moreCerts: {
    fontSize: 11,
    color: '#8E8E93',
    alignSelf: 'center',
    paddingHorizontal: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
});}