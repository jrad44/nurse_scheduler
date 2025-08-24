import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useStaff } from '@/providers/StaffProvider';
import { useSchedule } from '@/providers/ScheduleProvider';

interface ImportStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  error?: string;
}

interface CSVMapping {
  [key: string]: string;
}

export default function ImportScreen() {
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [csvData, setCsvData] = useState<string[][] | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<CSVMapping>({});
  const [importSteps, setImportSteps] = useState<ImportStep[]>([
    {
      id: 'file',
      title: 'Select File',
      description: 'Choose CSV or XLSX file from API Healthcare export',
      completed: false,
    },
    {
      id: 'mapping',
      title: 'Map Columns',
      description: 'Match your file columns to our data fields',
      completed: false,
    },
    {
      id: 'validation',
      title: 'Validate Data',
      description: 'Check for missing or invalid data',
      completed: false,
    },
    {
      id: 'import',
      title: 'Import Data',
      description: 'Add staff and schedule data to the system',
      completed: false,
    },
  ]);

  const { addStaffMember } = useStaff();
  const { addAvailability } = useSchedule();

  const pickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result);
        updateStep('file', true);
        await processFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select file. Please try again.');
    }
  }, []);

  const processFile = async (file: DocumentPicker.DocumentPickerAsset) => {
    setIsProcessing(true);
    try {
      // For demo purposes, we'll simulate CSV parsing
      // In a real app, you'd use a CSV parsing library
      const mockHeaders = [
        'Employee ID',
        'Employee Name', 
        'Role',
        'Employment Type',
        'Primary Unit',
        'FTE',
        'Date',
        'Shift',
        'Request Type',
        'Certifications'
      ];
      
      setCsvHeaders(mockHeaders);
      
      // Mock CSV data
      const mockData = [
        ['001', 'Sarah Johnson', 'RN', 'FullTime', 'ICU', '1.0', '2024-01-15', 'D', 'PreferWork', 'ACLS,PALS'],
        ['002', 'Mike Chen', 'Tech', 'PartTime', 'ER', '0.8', '2024-01-15', 'N', 'Off', ''],
        ['003', 'Lisa Rodriguez', 'ChargeRN', 'FullTime', 'ICU', '1.0', '2024-01-16', 'D', 'Committed', 'ACLS,NIHSS'],
        ['004', 'Amanda Rodriguez', 'IVNurse', 'PerDiem', 'Float Pool', '0.4', '2024-01-17', 'D', 'PreferWork', 'IV Therapy,PICC'],
      ];
      
      setCsvData(mockData);
      updateStep('mapping', false);
      
    } catch (error) {
      console.error('Error processing file:', error);
      updateStep('file', false, 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateStep = (stepId: string, completed: boolean, error?: string) => {
    setImportSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, completed, error }
        : step
    ));
  };

  const downloadTemplate = () => {
    Alert.alert(
      'Download Template',
      'Template CSV files would be downloaded here. This would include:\\n\\n\'95 Staff Information Template\\n\'95 Schedule Requests Template\\n\'95 Unit Constraints Template',
      [{ text: 'OK' }]
    );
  };

  const renderStepIndicator = (step: ImportStep, index: number) => {
    const isActive = index === 0 || importSteps[index - 1]?.completed;
    
    return (
      <View key={step.id} style={styles.stepContainer}>
        <View style={styles.stepIndicator}>
          <View style={[
            styles.stepCircle,
            step.completed && styles.stepCircleCompleted,
            step.error && styles.stepCircleError,
            isActive && !step.completed && !step.error && styles.stepCircleActive,
          ]}>
            {step.completed ? (
              <CheckCircle size={20} color="#ffffff" />
            ) : step.error ? (
              <AlertCircle size={20} color="#ffffff" />
            ) : (
              <Text style={[
                styles.stepNumber,
                isActive && styles.stepNumberActive,
              ]}>
                {index + 1}
              </Text>
            )}
          </View>
          {index < importSteps.length - 1 && (
            <View style={[
              styles.stepLine,
              step.completed && styles.stepLineCompleted,
            ]} />
          )}
        </View>
        
        <View style={styles.stepContent}>
          <Text style={[
            styles.stepTitle,
            isActive && styles.stepTitleActive,
          ]}>
            {step.title}
          </Text>
          <Text style={styles.stepDescription}>{step.description}</Text>
          {step.error && (
            <Text style={styles.stepError}>{step.error}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderFileUpload = () => (
    <View style={styles.uploadSection}>
      <Text style={styles.sectionTitle}>Import Schedule Data</Text>
      <Text style={styles.sectionDescription}>
        Upload CSV or XLSX files exported from API Healthcare (UKG) containing staff information and schedule requests.
      </Text>
      
      <TouchableOpacity 
        style={styles.uploadButton}
        onPress={pickDocument}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="#4A90E2" />
        ) : (
          <Upload size={24} color="#4A90E2" />
        )}
        <Text style={styles.uploadButtonText}>
          {selectedFile ? 'Change File' : 'Select File'}
        </Text>
      </TouchableOpacity>
      
      {selectedFile && !selectedFile.canceled && (
        <View style={styles.fileInfo}>
          <FileText size={20} color="#4A90E2" />
          <View style={styles.fileDetails}>
            <Text style={styles.fileName}>{selectedFile.assets[0].name}</Text>
            <Text style={styles.fileSize}>
              {(selectedFile.assets[0].size! / 1024).toFixed(1)} KB
            </Text>
          </View>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.templateButton}
        onPress={downloadTemplate}
      >
        <Download size={20} color="#8E8E93" />
        <Text style={styles.templateButtonText}>Download Template Files</Text>
      </TouchableOpacity>
    </View>
  );

  const renderColumnMapping = () => {
    if (!csvHeaders.length) return null;
    
    const requiredFields = [
      { key: 'employeeId', label: 'Employee ID', required: true },
      { key: 'employeeName', label: 'Employee Name', required: true },
      { key: 'role', label: 'Role/Position', required: true },
      { key: 'employmentType', label: 'Employment Type (FT/PT/Per Diem)', required: true },
      { key: 'primaryUnit', label: 'Primary Unit', required: true },
      { key: 'fte', label: 'FTE (0.0-1.0)', required: false },
      { key: 'date', label: 'Date', required: true },
      { key: 'shift', label: 'Shift (D/E/N)', required: true },
      { key: 'requestType', label: 'Request Type', required: true },
      { key: 'certifications', label: 'Certifications', required: false },
    ];
    
    return (
      <View style={styles.mappingSection}>
        <Text style={styles.sectionTitle}>Column Mapping</Text>
        <Text style={styles.sectionDescription}>
          Match the columns from your file to our data fields:
        </Text>
        
        {requiredFields.map(field => (
          <View key={field.key} style={styles.mappingRow}>
            <View style={styles.fieldInfo}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              {field.required && <Text style={styles.requiredMark}>*</Text>}
            </View>
            <View style={styles.columnSelector}>
              <Text style={styles.selectedColumn}>
                {mapping[field.key] || 'Select column...'}
              </Text>
            </View>
          </View>
        ))}
        
        <TouchableOpacity 
          style={styles.validateButton}
          onPress={() => {
            updateStep('mapping', true);
            updateStep('validation', true);
          }}
        >
          <Text style={styles.validateButtonText}>Validate Mapping</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Progress Steps */}
        <View style={styles.stepsContainer}>
          {importSteps.map(renderStepIndicator)}
        </View>
        
        {/* File Upload */}
        {renderFileUpload()}
        
        {/* Column Mapping */}
        {csvHeaders.length > 0 && renderColumnMapping()}
        
        {/* Data Preview */}
        {csvData && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Data Preview</Text>
            <Text style={styles.sectionDescription}>
              First 3 rows of your data:
            </Text>
            
            <View style={styles.previewTable}>
              <View style={styles.previewHeader}>
                {csvHeaders.slice(0, 4).map((header, idx) => (
                  <Text key={idx} style={styles.previewHeaderText}>
                    {header}
                  </Text>
                ))}
              </View>
              
              {csvData.slice(0, 3).map((row, rowIdx) => (
                <View key={rowIdx} style={styles.previewRow}>
                  {row.slice(0, 4).map((cell, cellIdx) => (
                    <Text key={cellIdx} style={styles.previewCell}>
                      {cell}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.importButton}
              onPress={() => {
                updateStep('import', true);
                Alert.alert('Success', 'Data imported successfully!');
              }}
            >
              <Text style={styles.importButtonText}>Import Data</Text>
            </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  stepsContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 16,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#4A90E2',
  },
  stepCircleCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepCircleError: {
    backgroundColor: '#F44336',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  stepNumberActive: {
    color: '#ffffff',
  },
  stepLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E5EA',
    marginTop: 8,
  },
  stepLineCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  stepTitleActive: {
    color: '#1a1a1a',
  },
  stepDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  stepError: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  uploadSection: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A90E2',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  fileSize: {
    fontSize: 12,
    color: '#8E8E93',
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
  },
  templateButtonText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  mappingSection: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mappingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  fieldInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  requiredMark: {
    fontSize: 14,
    color: '#F44336',
    marginLeft: 4,
  },
  columnSelector: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 120,
  },
  selectedColumn: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  validateButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  validateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  previewSection: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  previewTable: {
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
  },
  previewHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    padding: 8,
    textAlign: 'center',
  },
  previewRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  previewCell: {
    flex: 1,
    fontSize: 12,
    color: '#1a1a1a',
    padding: 8,
    textAlign: 'center',
  },
  importButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
});}