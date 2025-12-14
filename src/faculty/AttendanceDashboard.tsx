// src/faculty/screens/AttendanceDashboard.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  StatusBar,
  Alert,
  RefreshControl,
  ActivityIndicator } from 'react-native';
import { Text, TextInput } from '../components';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ClassAssignment } from '../services/Interfaces';
import { spacing, fontSize, FONT_SIZES, SPACING } from '../utils/responsive';

type RootStackParamList = {
  ClassDetails: { classData: any };
  AttendanceReport: { classData: any };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const API_BASE_URL = 'https://ams-server-4eol.onrender.com';

// Define props interface for the component
interface AttendanceDashboardProps {
  userEmail: string;
  user: {
    name: string;
    email: string;
  } | null;
  setIsLoggedIn: (value: boolean) => void;
  setUser: (user: { name: string; email: string } | null) => void;
}

const AttendanceDashboard: React.FC<AttendanceDashboardProps> = ({ 
  userEmail, 
  user, 
  setIsLoggedIn, 
  setUser 
})  => {
  const navigation = useNavigation<NavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [facultyId, setFacultyId] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [classes, setClasses] = useState<ClassAssignment[]>([]);
  const [totalCompletedSessions, setTotalCompletedSessions] = useState<number>(0);
  const [overallAvg, setOverallAvg] = useState<number>(0);

  // Extract faculty ID from email
  useEffect(() => {
    const fetchFacultyId = async () => {
      if (user?.email) {
        try {
          const response = await fetch(`${API_BASE_URL}/faculty/by-email?email=${encodeURIComponent(user.email)}`);
          if (!response.ok) {
            throw new Error('Failed to fetch faculty data');
          }
          const data = await response.json();
          setFacultyId(data.faculty_id || data.id);
        } catch (error) {
          console.error('Error fetching faculty ID:', error);
          // Fallback to email-based ID if backend fails
          const mailId = user.email.split('@')[0];
          setFacultyId(mailId);
        }
      }
    };
    fetchFacultyId();
  }, [user]);

  // Fetch dashboard data function
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      if (!facultyId) {
        // Wait until facultyId is available
        return;
      }
      // Replace with your actual API endpoint
      const response = await fetch(`${API_BASE_URL}/faculty/dashboard/${facultyId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Check if the request was successful
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch dashboard data');
      }
      
      // Set classes data from backend
      setClasses(data.classes || []);
      
      // Extract statistics from backend response
      if (data.stats) {
        setTotalCompletedSessions(data.stats.totalCompletedSessions || 0);
        setOverallAvg(data.stats.overallAttendanceAvg || 0);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Show error message to user
      Alert.alert(
        'Error',
        'Failed to load dashboard data. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
      
      // Fallback to sample data if API fails
      const sampleClasses: ClassAssignment[] = [
        {
          assignmentId: 1,
          subjectCode: 'OS2025',
          subjectName: 'Operating Systems',
          section: 'D',
          completedSessions: 20,
          classAttendanceAvg: 80,
          lastClassDate: '2025-09-18',
          department: 'CSE',
          year: 'E3'
        },
        {
          assignmentId: 2,
          subjectCode: 'OSLAB2025',
          subjectName: 'Operating Systems Lab',
          section: 'D',
          completedSessions: 20,
          classAttendanceAvg: 85,
          lastClassDate: '2025-09-20',
          department: 'CSE',
          year: 'E3'
        },
      ];
      setClasses(sampleClasses);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Trigger fetch when facultyId becomes available
  useEffect(() => {
    if (facultyId) {
      fetchDashboardData();
    }
  }, [facultyId]);
  // Pull to refresh function
  const onRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const renderClassCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.classCard}
      onPress={() => navigation.navigate('ClassDetails', { classData: item })}
    >
      <View style={styles.classHeader}>
        <View>
          <Text style={styles.section}>{item.yearBatch} {item.department} (Section - {item.section})</Text>
          <Text style={styles.subjectCode}>{item.subjectCode} - {item.subjectName}</Text>
        </View>
        <View style={[
          styles.attendanceBadge,
          { backgroundColor: item.classAttendanceAvg >= 75 ? '#28a745' : '#ffc107' }
        ]}>
          <Text style={styles.attendancePercent}>{item.classAttendanceAvg}%</Text>
        </View>
      </View>
      
      <View style={styles.classStats}>
        <View style={styles.statItem}>
          <Icon name="class" size={fontSize(16)} color="#600202" />
          <Text style={styles.statText}>Sessions: {item.completedSessions}</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="calendar-today" size={fontSize(16)} color="#600202" />
          <Text style={styles.statText}>Last: {item.lastClassDate ? new Date(item.lastClassDate).toLocaleDateString('en-GB') : 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('AttendanceReport', { classData: item })}
        >
          <Icon name="bar-chart" size={fontSize(18)} color="#600202" />
          <Text style={styles.actionButtonText}>Report</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Loading Component
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#600202" />
      <Text style={styles.loadingText}>Loading your classes...</Text>
    </View>
  );

  // Empty State Component
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="class" size={fontSize(64)} color="#ccc" />
      <Text style={styles.emptyText}>No classes found</Text>
      <Text style={styles.emptySubtext}>You don't have any classes assigned yet.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#600202" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Attendance Management System</Text>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsOverview}>
        <View style={styles.statCard}>
          <Icon name="class" size={fontSize(24)} color="#600202" />
          <Text style={styles.statNumber}>{classes.length}</Text>
          <Text style={styles.statLabel}>Active Classes</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="assignment-turned-in" size={fontSize(24)} color="#600202" />
          <Text style={styles.statNumber}>{totalCompletedSessions}</Text>
          <Text style={styles.statLabel}>Total Sessions</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="trending-up" size={fontSize(24)} color="#600202" />
          <Text style={styles.statNumber}>{overallAvg}%</Text>
          <Text style={styles.statLabel}>Overall Avg.</Text>
        </View>
      </View>

      {/* Show loading indicator */}
      {isLoading ? (
        renderLoading()
      ) : (
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={['#600202']}
              tintColor="#600202"
            />
          }
        >
          {/* Classes Section */}
          <Text style={styles.sectionTitle}>Your Classes</Text>
          
          {classes.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={classes}
              renderItem={renderClassCard}
              keyExtractor={item => item.assignmentId.toString()}
              scrollEnabled={false}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#600202',
    padding: SPACING.xl,
    paddingTop: spacing(50),
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.lg,
    color: '#FFF',
    textAlign: 'center',
    opacity: 0.9,
    marginTop: SPACING.xs,
  },
  statsOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.xl,
    marginTop: spacing(-30),
  },
  statCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: spacing(15),
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing(5),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: '#600202',
    marginTop: SPACING.sm,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: '#666',
    marginTop: SPACING.xs,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing(50),
  },
  loadingText: {
    marginTop: SPACING.lg,
    fontSize: FONT_SIZES.lg,
    color: '#600202',
    textAlign: 'center',
  },
  // Empty State Styles
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing(40),
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginTop: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.xl,
    color: '#666',
    marginTop: SPACING.lg,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: FONT_SIZES.md,
    color: '#999',
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: '#600202',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  classCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  section: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: '#600202',
  },
  subjectCode: {
    fontSize: FONT_SIZES.md,
    color: '#666',
    marginTop: spacing(2),
  },
  subjectName: {
    fontSize: FONT_SIZES.sm,
    color: '#999',
    marginTop: spacing(2),
  },
  attendanceBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: spacing(6),
    borderRadius: 20,
  },
  attendancePercent: {
    color: '#FFF',
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  classStats: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  statText: {
    fontSize: FONT_SIZES.sm,
    color: '#666',
    marginLeft: SPACING.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: FONT_SIZES.sm,
    color: '#600202',
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
  activityItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  activityClass: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#600202',
  },
  activityDate: {
    fontSize: FONT_SIZES.sm,
    color: '#666',
  },
  activityTopic: {
    fontSize: fontSize(13),
    color: '#333',
    marginBottom: SPACING.sm,
  },
  activityStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendedText: {
    fontSize: FONT_SIZES.sm,
    color: '#666',
    marginLeft: SPACING.xs,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: '#600202',
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#600202',
    marginBottom: SPACING.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONT_SIZES.lg,
    backgroundColor: '#f8f9fa',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xl,
  },
  cancelButton: {
    flex: 1,
    padding: spacing(15),
    borderRadius: 8,
    backgroundColor: '#6c757d',
    marginRight: spacing(10),
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
    padding: spacing(15),
    borderRadius: 8,
    backgroundColor: '#600202',
    marginLeft: spacing(10),
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default AttendanceDashboard;