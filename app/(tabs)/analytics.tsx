import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, TrendingDown, Users, Clock, Calendar, AlertTriangle } from 'lucide-react-native';
import { useSchedule } from '@/providers/ScheduleProvider';
import { useStaff } from '@/providers/StaffProvider';

const { width: screenWidth } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const { assignments, constraints } = useSchedule();
  const { staff } = useStaff();

  const periods = [
    { key: 'week' as const, label: 'Week' },
    { key: 'month' as const, label: 'Month' },
    { key: 'quarter' as const, label: 'Quarter' },
  ];

  // Mock analytics data
  const coverageRate = 87;
  const requestMatch = 72;
  const avgConsecutiveDays = 3.2;
  const weekendDistribution = { fair: 18, unfair: 4 };

  const fairnessMetrics = [
    { 
      label: 'Night Shifts', 
      distribution: [
        { name: 'Sarah Johnson', value: 8, avg: 6 },
        { name: 'Mike Chen', value: 5, avg: 6 },
        { name: 'Emily Davis', value: 7, avg: 6 },
        { name: 'James Wilson', value: 4, avg: 6 },
      ]
    },
    {
      label: 'Weekend Coverage',
      distribution: [
        { name: 'Sarah Johnson', value: 3, avg: 2 },
        { name: 'Mike Chen', value: 2, avg: 2 },
        { name: 'Emily Davis', value: 2, avg: 2 },
        { name: 'James Wilson', value: 1, avg: 2 },
      ]
    },
  ];

  const violations = [
    { type: 'Consecutive Days', count: 3, severity: 'medium' },
    { type: 'Rest Period', count: 1, severity: 'high' },
    { type: 'Skill Mix', count: 5, severity: 'low' },
    { type: 'Weekend Balance', count: 2, severity: 'medium' },
  ];

  const renderMetricCard = (title: string, value: string | number, trend?: number, icon?: React.ReactNode) => {
    return (
      <View style={styles.metricCard}>
        <View style={styles.metricHeader}>
          {icon}
          <Text style={styles.metricTitle}>{title}</Text>
        </View>
        <Text style={styles.metricValue}>{value}</Text>
        {trend !== undefined && (
          <View style={styles.trendContainer}>
            {trend > 0 ? (
              <TrendingUp size={16} color="#4CAF50" />
            ) : (
              <TrendingDown size={16} color="#F44336" />
            )}
            <Text style={[styles.trendText, { color: trend > 0 ? '#4CAF50' : '#F44336' }]}>
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderDistributionBar = (current: number, average: number, max: number = 10) => {
    const percentage = (current / max) * 100;
    const avgPercentage = (average / max) * 100;
    
    return (
      <View style={styles.distributionBar}>
        <View style={[styles.barFill, { width: `${percentage}%` }]} />
        <View style={[styles.avgMarker, { left: `${avgPercentage}%` }]} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map(period => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text style={[
                styles.periodText,
                selectedPeriod === period.key && styles.periodTextActive,
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          {renderMetricCard('Coverage Rate', `${coverageRate}%`, 5, <Users size={16} color="#4A90E2" />)}
          {renderMetricCard('Request Match', `${requestMatch}%`, -3, <Calendar size={16} color="#7B68EE" />)}
          {renderMetricCard('Avg Consecutive', avgConsecutiveDays.toFixed(1), 0, <Clock size={16} color="#FF6B6B" />)}
          {renderMetricCard('Fair Distribution', `${Math.round((weekendDistribution.fair / (weekendDistribution.fair + weekendDistribution.unfair)) * 100)}%`, 8, <Users size={16} color="#20B2AA" />)}
        </View>

        {/* Fairness Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fairness Distribution</Text>
          {fairnessMetrics.map((metric, idx) => (
            <View key={idx} style={styles.fairnessCard}>
              <Text style={styles.fairnessLabel}>{metric.label}</Text>
              {metric.distribution.map((item, itemIdx) => (
                <View key={itemIdx} style={styles.distributionItem}>
                  <Text style={styles.distributionName}>{item.name}</Text>
                  <View style={styles.distributionBarContainer}>
                    {renderDistributionBar(item.value, item.avg)}
                  </View>
                  <Text style={styles.distributionValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Violations Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rule Violations</Text>
            <AlertTriangle size={20} color="#FF9800" />
          </View>
          <View style={styles.violationsContainer}>
            {violations.map((violation, idx) => {
              const severityColors = {
                low: '#FFC107',
                medium: '#FF9800',
                high: '#F44336',
              };
              
              return (
                <View key={idx} style={styles.violationItem}>
                  <View style={styles.violationInfo}>
                    <View style={[styles.severityDot, { backgroundColor: severityColors[violation.severity] }]} />
                    <Text style={styles.violationType}>{violation.type}</Text>
                  </View>
                  <View style={styles.violationCount}>
                    <Text style={styles.violationCountText}>{violation.count}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Coverage Heatmap Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coverage Heatmap</Text>
          <View style={styles.heatmapContainer}>
            <View style={styles.heatmapLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
                <Text style={styles.legendText}>Under</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#FFC107' }]} />
                <Text style={styles.legendText}>Near</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.legendText}>Met</Text>
              </View>
            </View>
            <View style={styles.heatmapGrid}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dayIdx) => (
                <View key={dayIdx} style={styles.heatmapColumn}>
                  <Text style={styles.heatmapDay}>{day}</Text>
                  {['D', 'E', 'N'].map((shift, shiftIdx) => {
                    const colors = ['#4CAF50', '#FFC107', '#F44336', '#4CAF50', '#4CAF50', '#FFC107', '#4CAF50'];
                    const randomColor = colors[Math.floor(Math.random() * colors.length)];
                    return (
                      <View
                        key={shiftIdx}
                        style={[styles.heatmapCell, { backgroundColor: randomColor }]}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
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
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#4A90E2',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  periodTextActive: {
    color: '#ffffff',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: (screenWidth - 44) / 2,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    marginBottom: 12,
  },
  fairnessCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fairnessLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  distributionName: {
    flex: 1,
    fontSize: 12,
    color: '#1a1a1a',
  },
  distributionBarContainer: {
    flex: 2,
    marginHorizontal: 12,
  },
  distributionBar: {
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 4,
  },
  avgMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#FF6B6B',
  },
  distributionValue: {
    width: 20,
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'right',
  },
  violationsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  violationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  violationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  violationType: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  violationCount: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  violationCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  heatmapContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heatmapLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  heatmapGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heatmapColumn: {
    alignItems: 'center',
    flex: 1,
  },
  heatmapDay: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  heatmapCell: {
    width: 32,
    height: 32,
    borderRadius: 4,
    marginVertical: 2,
  },
});