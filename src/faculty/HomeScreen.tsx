import React, { useState, useEffect } from 'react';
import { View, StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal, KeyboardAvoidingView,
  Platform,
  StatusBar,
  RefreshControl } from 'react-native';
import { Text, TextInput } from '../components';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { spacing, fontSize, FONT_SIZES, SPACING } from '../utils/responsive';
import LinearGradient from 'react-native-linear-gradient';

type HomeScreenProps = {
    userEmail: string;
    user: {
        name: string;
        email: string;
    } | null;
    setIsLoggedIn: (value: boolean) => void;
    setUser: (user: { name: string; email: string } | null) => void;
};

type ScheduleItem = {
    id: number;
    subject_name: string;
    year: string;
    department: string;
    section: string;
    venue: string;
    start_time: string;
    end_time: string;
    status: boolean;
    subject_code: string;
    subject_mnemonic?: string;
    otp?: string;
};

type ScheduleData = {
    faculty_name: string;
    schedules: ScheduleItem[];
};

type TimeSlot = {
    start_time: string;
    end_time: string;
};

type Subject = {
    subject_code: string;
    subject_name: string;
    subject_type: string;
};

interface StudentAttendance {
    student_number: number; // 1 to 71 (or actual count from backend)
    status: 'present' | 'absent';
}

const API_BASE_URL = 'http://10.88.141.102:5000';

const ClassScheduleCard = ({
  item,
  onCancel,
  onMarkAttendance,
  scheduleDate,
}: {
  item: ScheduleItem;
  onCancel?: (item: ScheduleItem) => void;
  onMarkAttendance?: (item: ScheduleItem) => void;
  scheduleDate: Date;
}) => {
  const getSubjectColor = (subject: string) => {
    const colors = {
      'Data Structures': { bg: '#1976D2', text: '#FFF' },
      'Algorithms': { bg: '#1565C0', text: '#FFF' },
      'Database': { bg: '#0277BD', text: '#FFF' },
      'DBMS': { bg: '#0277BD', text: '#FFF' },
      'OS': { bg: '#01579B', text: '#FFF' },
      'Operating System': { bg: '#01579B', text: '#FFF' },
      'Networks': { bg: '#0288D1', text: '#FFF' },
      'Computer Networks': { bg: '#0288D1', text: '#FFF' },
      'Software Engineering': { bg: '#0097A7', text: '#FFF' },
      'SE': { bg: '#0097A7', text: '#FFF' },
      'Java': { bg: '#6A1B9A', text: '#FFF' },
      'Python': { bg: '#7B1FA2', text: '#FFF' },
      'C': { bg: '#4A148C', text: '#FFF' },
      'C++': { bg: '#6200EA', text: '#FFF' },
      'Web Development': { bg: '#5E35B1', text: '#FFF' },
      'Mathematics': { bg: '#00796B', text: '#FFF' },
      'Maths': { bg: '#00796B', text: '#FFF' },
      'Discrete Mathematics': { bg: '#00897B', text: '#FFF' },
      'Linear Algebra': { bg: '#00695C', text: '#FFF' },
      'Probability': { bg: '#009688', text: '#FFF' },
      'Digital Logic': { bg: '#E65100', text: '#FFF' },
      'COA': { bg: '#EF6C00', text: '#FFF' },
      'Computer Organization': { bg: '#EF6C00', text: '#FFF' },
      'Microprocessors': { bg: '#F57C00', text: '#FFF' },
      'Theory of Computation': { bg: '#512DA8', text: '#FFF' },
      'TOC': { bg: '#512DA8', text: '#FFF' },
      'Compiler Design': { bg: '#4527A0', text: '#FFF' },
      'Machine Learning': { bg: '#C2185B', text: '#FFF' },
      'ML': { bg: '#C2185B', text: '#FFF' },
      'AI': { bg: '#AD1457', text: '#FFF' },
      'Artificial Intelligence': { bg: '#AD1457', text: '#FFF' },
      'Data Mining': { bg: '#880E4F', text: '#FFF' },
      'Electronics': { bg: '#388E3C', text: '#FFF' },
      'Digital Electronics': { bg: '#2E7D32', text: '#FFF' },
      'Signals': { bg: '#43A047', text: '#FFF' },
      'Management': { bg: '#303F9F', text: '#FFF' },
      'Economics': { bg: '#3949AB', text: '#FFF' },
      'Communication': { bg: '#3F51B5', text: '#FFF' },
      'default': { bg: '#546E7A', text: '#FFF' }
    };

    for (const [key, color] of Object.entries(colors)) {
      if (subject.toLowerCase().includes(key.toLowerCase())) {
        return color;
      }
    }
    return colors.default;
  };

  const subjectColor = getSubjectColor(item.subject_name);
  
  const formatDateForComparison = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateTime = (dateStr: string, timeStr: string) => {
    try {
      if (!dateStr || !timeStr) return new Date();
      
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      const localDate = new Date(year, month - 1, day, hours, minutes, 0);
      
      if (isNaN(localDate.getTime())) {
        return new Date();
      }
      
      return localDate;
    } catch (error) {
      return new Date();
    }
  };

  const isSameDate = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isUpcoming = () => {
    const currentDateTime = new Date();
    const scheduleDateStr = formatDateForComparison(scheduleDate);
    const classStartDateTime = parseDateTime(scheduleDateStr, item.start_time);
    
    if (!isSameDate(currentDateTime, scheduleDate)) {
      return true;
    }
    
    return currentDateTime < classStartDateTime;
  };

  const isOngoing = () => {
    const currentDateTime = new Date();
    
    if (!isSameDate(currentDateTime, scheduleDate)) {
      return false;
    }
    
    const scheduleDateStr = formatDateForComparison(scheduleDate);
    const classStartDateTime = parseDateTime(scheduleDateStr, item.start_time);
    const classEndDateTime = parseDateTime(scheduleDateStr, item.end_time);
    
    const bufferMs = 3000 * 60 * 1000;
    const classEndWithBuffer = new Date(classEndDateTime.getTime() + bufferMs);
    
    return (
      currentDateTime >= classStartDateTime && 
      currentDateTime <= classEndWithBuffer
    );
  };

  const isExpired = () => {
    const currentDateTime = new Date();
    
    if (scheduleDate < new Date(currentDateTime.getFullYear(), currentDateTime.getMonth(), currentDateTime.getDate())) {
      return true;
    }
    
    if (isSameDate(currentDateTime, scheduleDate)) {
      const scheduleDateStr = formatDateForComparison(scheduleDate);
      const classEndDateTime = parseDateTime(scheduleDateStr, item.end_time);
      const bufferMs = 3000 * 60 * 1000;
      const classEndWithBuffer = new Date(classEndDateTime.getTime() + bufferMs);
      
      return currentDateTime > classEndWithBuffer;
    }
    
    return false;
  };

  const isCompleted = () => {
    return item.status === true;
  };

  const getClassStatus = () => {
    const completed = isCompleted();
    const ongoing = isOngoing();
    const upcoming = isUpcoming();
    const expired = isExpired();

    if (completed) {
      return {
        status: 'completed',
        badge: { text: 'Completed', color: '#4ECDC4', bgColor: '#E8F5E9' },
        message: '✓ Attendance marked successfully',
        showMarkAttendance: false,
        showCancel: false
      };
    }

    if (ongoing) {
      return {
        status: 'ongoing',
        badge: { text: 'Ongoing', color: '#4ECDC4', bgColor: '#E8F5E9' },
        message: 'Class in progress - Ready for attendance',
        showMarkAttendance: true,
        showCancel: true
      };
    }

    if (upcoming) {
      return {
        status: 'upcoming',
        badge: { text: 'Upcoming', color: '#15d2f8ff', bgColor: '#e1fffeff' },
        message: 'Class is scheduled - Not started yet',
        showMarkAttendance: true,
        showCancel: true
      };
    }

    if (expired) {
      return {
        status: 'expired',
        badge: { text: 'Expired', color: '#FF6B6B', bgColor: '#FFEBEE' },
        message: 'Class completed - Attendance not marked',
        showMarkAttendance: false,
        showCancel: false
      };
    }

    return {
      status: 'scheduled',
      badge: { text: 'Scheduled', color: '#9E9E9E', bgColor: '#F5F5F5' },
      message: 'Class is scheduled',
      showMarkAttendance: false,
      showCancel: true
    };
  };

  const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const classStatus = getClassStatus();

  const getSubjectMnemonic = (subjectName: string): string => {
    if (item.subject_mnemonic) return item.subject_mnemonic;
    
    const words = subjectName.split(' ');
    if (words.length === 1) {
      return subjectName.substring(0, 3).toUpperCase();
    }
    
    return words
      .slice(0, 3)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  };

  const subjectMnemonic = getSubjectMnemonic(item.subject_name);

  return (
    <View style={styles.card}>
      {classStatus.badge.text ? (
        <View style={[styles.statusBadgeTopRight, { backgroundColor: classStatus.badge.bgColor }]}>
          <Text style={[styles.statusBadgeText, { color: classStatus.badge.color }]}>
            {classStatus.badge.text}
          </Text>
        </View>
      ) : null}
      
      <View style={styles.subjectCircle}>
        <View style={[styles.subjectBadge, { backgroundColor: subjectColor.bg }]}>
          <Text style={[styles.subjectInitial, { color: subjectColor.text }]} numberOfLines={1} adjustsFontSizeToFit>
            {subjectMnemonic}
          </Text>
        </View>
        
        <View style={{ flex: 1, marginLeft: spacing(14) }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Text style={[styles.subjectText, { flex: 1, paddingRight: 8 }]} numberOfLines={2}>
              {item.subject_name}
            </Text>
            
            {classStatus.showCancel && (
              <TouchableOpacity
                style={styles.cancelButtonHeader}
                onPress={() => onCancel && onCancel(item)}
              >
                <Icon name="close-circle-outline" size={fontSize(30)} color="#F44336" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={{ marginBottom: SPACING.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm }}>
            <Icon name="clock-outline" size={fontSize(20)} color="#1976D2" style={{ marginRight: SPACING.sm }} />
            <Text 
              style={[styles.detailText, { fontSize: FONT_SIZES.lg, fontWeight: '600' }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {formatTime(item.start_time)} - {formatTime(item.end_time)}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm }}>
            <Icon name="map-marker" size={fontSize(20)} color="#E65100" style={{ marginRight: SPACING.sm }} />
            <Text 
              style={[styles.detailText, { fontSize: FONT_SIZES.lg, fontWeight: '600', flex: 1 }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.venue || 'Venue not specified'}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm }}>
            <Icon name="school" size={fontSize(20)} color="#600202" style={{ marginRight: SPACING.sm }} />
            <Text 
              style={[styles.detailText, { fontSize: FONT_SIZES.lg, fontWeight: '600', flex: 1 }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              E{item.year} {item.department} - {item.section}
            </Text>
          </View>

          {item.otp && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="key" size={fontSize(20)} color="#4CAF50" style={{ marginRight: SPACING.sm }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailText, { fontSize: FONT_SIZES.lg, fontWeight: '600', color: '#4CAF50' }]}>
                  OTP: {item.otp}
                </Text>
              </View>
            </View>
          )}
        </View>
        
        {classStatus.message && (
          <View style={[
            styles.infoContainer,
            { backgroundColor: classStatus.badge.bgColor }
          ]}>
            <Icon 
              name={
                classStatus.status === 'completed' ? "check-circle" :
                classStatus.status === 'ongoing' ? "play-circle-outline" :
                classStatus.status === 'upcoming' ? "calendar-clock" :
                "close-circle-outline"
              } 
              size={fontSize(16)} 
              color={classStatus.badge.color}
            />
            <Text style={[styles.infoText, { color: classStatus.badge.color }]}>
              {classStatus.message}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        {classStatus.showMarkAttendance && (
          <TouchableOpacity
            style={styles.attendanceButton}
            onPress={() => onMarkAttendance && onMarkAttendance(item)}
          >
            <Icon name="check-circle-outline" size={fontSize(20)} color="#FFF" />
            <Text style={[styles.buttonText, { marginLeft: SPACING.sm }]}>Mark Attendance</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const HomeScreen: React.FC<HomeScreenProps> = ({ userEmail, user, setIsLoggedIn, setUser }) => {
    const [actualFacultyId, setActualFacultyId] = useState<string>('');
    const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);
    const [tomorrowSchedule, setTomorrowSchedule] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [showAttendanceModal, setShowAttendanceModal] = useState<boolean>(false);
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [fetchingSlots, setFetchingSlots] = useState<boolean>(false);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
    const [attendanceReason, setAttendanceReason] = useState<string>('');
    const [attendanceData, setAttendanceData] = useState<StudentAttendance[]>([]);
    const [selectAllState, setSelectAllState] = useState<'allPresent' | 'allAbsent'>('allPresent');
    const [isSubmittingAttendance, setIsSubmittingAttendance] = useState<boolean>(false);
    const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow'>('today');
    const [studentCount, setStudentCount] = useState<number>(71); // Default 71 for testing
    const [isFetchingStudents, setIsFetchingStudents] = useState<boolean>(false);

    const yearOptions = ['E1', 'E2', 'E3', 'E4'];
    const departmentOptions = ['CSE', 'ECE', 'EEE', "CHEM",'MECH', 'CIVIL',"MME"];
    const sectionOptions = ['A', 'B', 'C', 'D', 'E'];
    
    const [newSchedule, setNewSchedule] = useState({
        year: '',
        department: '',
        section: '',
        venue: '',
        start_time: '',
        end_time: '',
        subject_code: ''
    });

    useEffect(() => {
        if (user?.email) {
            setActualFacultyId("F001");
        }
    }, [user]);

    useEffect(() => {
        if (actualFacultyId) {
            fetchSchedules();
        }
    }, [actualFacultyId]);

    const getDateStrings = () => {
        const now = new Date();
        const today = new Date(now);
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const formatDate = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        const todayStr = formatDate(today);
        const tomorrowStr = formatDate(tomorrow);
        
        return { todayStr, tomorrowStr };
    };

    const fetchSchedules = async () => {
        if (!actualFacultyId) return;

        try {
            setLoading(true);
            
            const { todayStr, tomorrowStr } = getDateStrings();
            
            const [todayResponse, tomorrowResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/faculty/${actualFacultyId}/schedule?date=${todayStr}`),
                fetch(`${API_BASE_URL}/faculty/${actualFacultyId}/schedule?date=${tomorrowStr}`)
            ]);
            
            if (todayResponse.ok) {
                const todayData: ScheduleData = await todayResponse.json();
                setTodaySchedule(todayData.schedules || []);
            } else {
                setTodaySchedule([]);
            }
            
            if (tomorrowResponse.ok) {
                const tomorrowData: ScheduleData = await tomorrowResponse.json();
                setTomorrowSchedule(tomorrowData.schedules || []);
            } else {
                setTomorrowSchedule([]);
            }
            
        } catch (err) {
            console.error('❌ Fetch schedules error:', err);
            Alert.alert('Error', 'Failed to fetch schedules. Please check your connection.');
            setTodaySchedule([]);
            setTomorrowSchedule([]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        try {
            setRefreshing(true);
            await fetchSchedules();
        } catch (error) {
            console.error("Error during refresh:", error);
            Alert.alert('Error', 'Failed to refresh schedules');
        } finally {
            setRefreshing(false);
        }
    };

    const sortSchedule = (schedule: ScheduleItem[], scheduleDate: Date) => {
        return schedule.sort((a, b) => {
            const getClassPriority = (item: ScheduleItem) => {
                const parseDateTime = (timeStr: string) => {
                    const [hours, minutes] = timeStr.split(':').map(Number);
                    const date = new Date(scheduleDate);
                    date.setHours(hours, minutes, 0, 0);
                    return date;
                };

                const currentTime = new Date();
                const startTime = parseDateTime(item.start_time);
                const endTime = parseDateTime(item.end_time);
                const bufferMs = 3000 * 60 * 1000;
                const endTimeWithBuffer = new Date(endTime.getTime() + bufferMs);

                if (currentTime >= startTime && currentTime <= endTimeWithBuffer && !item.status) {
                    return 1;
                }
                else if (currentTime < startTime && !item.status) {
                    return 2;
                }
                else if (item.status) {
                    return 3;
                }
                else {
                    return 4;
                }
            };

            const priorityA = getClassPriority(a);
            const priorityB = getClassPriority(b);

            if (priorityA === priorityB) {
                const [aHours, aMinutes] = a.start_time.split(':').map(Number);
                const [bHours, bMinutes] = b.start_time.split(':').map(Number);
                return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
            }

            return priorityA - priorityB;
        });
    };

    const getCurrentSchedule = () => {
        const schedule = selectedDate === 'today' ? todaySchedule : tomorrowSchedule;
        const now = new Date();
        const scheduleDate = selectedDate === 'today' ? now : new Date(now.setDate(now.getDate() + 1));
        
        return sortSchedule([...schedule], scheduleDate);
    };

    const getScheduleTitle = () => {
        const now = new Date();
        const today = now.toLocaleDateString();
        const tomorrow = new Date(now.setDate(now.getDate() + 1)).toLocaleDateString();
        
        return selectedDate === 'today' 
            ? `Today's Schedule` 
            : `Tomorrow's Schedule`;
    };

    const handleCancelSchedule = (schedule: ScheduleItem) => {
        Alert.alert(
            'Cancel Class',
            `Are you sure you want to cancel ${schedule.subject_name} class?`,
            [
                { text: 'No', style: 'cancel' },
                { 
                    text: 'Yes', 
                    style: 'destructive',
                    onPress: () => cancelSchedule(schedule.id)
                }
            ]
        );
    };

    const cancelSchedule = async (scheduleId: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/schedule/${scheduleId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to cancel schedule');
            }
            
            Alert.alert('Success', 'Class cancelled successfully');
            fetchSchedules();
        } catch (err) {
            console.error('Cancel schedule error:', err);
            Alert.alert('Error', (err as Error).message);
        }
    };

    const handleMarkAttendance = async (schedule: ScheduleItem) => {
        setSelectedSchedule(schedule);
        setShowAttendanceModal(true);
        setAttendanceReason('');
        setAttendanceData([]);
        setSelectAllState('allPresent');
        
        // Check if attendance already exists
        try {
            const response = await fetch(
                `${API_BASE_URL}/attendance/${schedule.id}`
            );

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.attendance && data.attendance.length > 0) {
                    // Pre-fill the topic if it exists
                    if (data.topic) {
                        setAttendanceReason(data.topic);
                    }
                    
                    // Convert backend data to our format (student numbers 1 to 71)
                    const existingAttendance: StudentAttendance[] = data.attendance.map((att: any, index: number) => ({
                        student_number: index + 1, // Using index as student number for now
                        status: att.status === 'present' ? 'present' : 'absent'
                    }));
                    
                    setAttendanceData(existingAttendance);
                    
                    // Set selectAllState based on existing attendance
                    const allPresent = existingAttendance.every(s => s.status === 'present');
                    const allAbsent = existingAttendance.every(s => s.status === 'absent');
                    
                    if (allPresent) {
                        setSelectAllState('allPresent');
                    } else if (allAbsent) {
                        setSelectAllState('allAbsent');
                    } else {
                        setSelectAllState('allPresent');
                    }
                    
                    Alert.alert(
                        'Attendance Exists',
                        'Attendance has already been marked for this class. You can view or modify it.',
                        [{ text: 'OK' }]
                    );
                    
                    return;
                }
            }
        } catch (err) {
            console.error('Check existing attendance error:', err);
            // Continue normally if check fails
        }
    };

    const initializeAttendanceData = async () => {
    if (!selectedSchedule) return;

    try {
        setIsFetchingStudents(true);
        
        // Option 1: Get just count
        const countResponse = await fetch(
            `${API_BASE_URL}/class/${selectedSchedule.year}/${selectedSchedule.department}/${selectedSchedule.section}/student-count`
        );
        
        if (countResponse.ok) {
            const countData = await countResponse.json();
            const studentCount = countData.count || 71;
            
            // Create attendance data with roll numbers 1..studentCount
            const initialAttendance: StudentAttendance[] = Array.from({ length: studentCount }, (_, i) => ({
                student_number: i + 1,  // This matches roll_number in DB
                status: 'present'
            }));
            
            setAttendanceData(initialAttendance);
            setStudentCount(studentCount);
        }
        
        // Option 2: Get full student list (for better UI)
        const studentsResponse = await fetch(
            `${API_BASE_URL}/class/${selectedSchedule.year}/${selectedSchedule.department}/${selectedSchedule.section}/students`
        );
        
        if (studentsResponse.ok) {
            const studentsData = await studentsResponse.json();
            const initialAttendance: StudentAttendance[] = studentsData.students.map((student: any) => ({
                student_number: student.roll_number,  // Use actual roll_number
                student_id: student.id,
                student_name: student.name,
                status: 'present'
            }));
            
            setAttendanceData(initialAttendance);
            setStudentCount(studentsData.count);
        }
        
        setSelectAllState('allPresent');
        
    } catch (err) {
        console.error('Initialize attendance error:', err);
        // Fallback
        const initialAttendance: StudentAttendance[] = Array.from({ length: 71 }, (_, i) => ({
            student_number: i + 1,
            status: 'present'
        }));
        setAttendanceData(initialAttendance);
        setStudentCount(71);
    } finally {
        setIsFetchingStudents(false);
    }
};

    const toggleStudentAttendance = (index: number) => {
        setAttendanceData(prev => {
            const newData = [...prev];
            newData[index].status = newData[index].status === 'present' ? 'absent' : 'present';
            return newData;
        });
        
        const allPresent = attendanceData.every(s => s.status === 'present');
        const allAbsent = attendanceData.every(s => s.status === 'absent');
        
        if (allPresent) {
            setSelectAllState('allPresent');
        } else if (allAbsent) {
            setSelectAllState('allAbsent');
        }
    };

    const toggleAllAttendance = () => {
        setAttendanceData(prev => {
            const newStatus = selectAllState === 'allPresent' ? 'absent' : 'present';
            return prev.map(student => ({
                ...student,
                status: newStatus
            }));
        });
        
        setSelectAllState(prev => prev === 'allPresent' ? 'allAbsent' : 'allPresent');
    };

    const submitAttendance = async () => {
        if (!selectedSchedule || attendanceData.length === 0) {
            Alert.alert('Error', 'No attendance data to submit');
            return;
        }

        if (!attendanceReason.trim()) {
            Alert.alert('Error', 'Please enter topic for the session');
            return;
        }

        try {
            setIsSubmittingAttendance(true);

            const response = await fetch(`${API_BASE_URL}/submit-attendance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    schedule_id: selectedSchedule.id,
                    faculty_id: actualFacultyId,
                    topic: attendanceReason.trim(),
                    attendance_date: new Date().toISOString().split('T')[0],
                    students: attendanceData,
                    mark_class_completed: true // Tell backend to mark class as completed
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit attendance');
            }

            const result = await response.json();
            
            if (result.success) {
                Alert.alert('Success', 'Attendance marked successfully!');
                setShowAttendanceModal(false);
                setSelectedSchedule(null);
                setAttendanceReason('');
                setAttendanceData([]);
                setSelectAllState('allPresent');
                
                // Refresh schedules to show updated status
                await fetchSchedules();
            } else {
                throw new Error(result.error || 'Failed to submit attendance');
            }
        } catch (err) {
            console.error('Submit attendance error:', err);
            Alert.alert('Error', (err as Error).message);
        } finally {
            setIsSubmittingAttendance(false);
        }
    };

    const handleCreateSchedule = () => {
        setShowCreateModal(true);
        setAvailableSlots([]);
        fetchFacultySubjects();
    };

    const fetchFacultySubjects = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/faculty/${actualFacultyId}/subjects`);
            if (!response.ok) {
                throw new Error('Failed to fetch subjects');
            }
            const data = await response.json();
            setSubjects(data.subjects || []);
        } catch (err) {
            console.error('Fetch subjects error:', err);
            Alert.alert('Error', 'Failed to fetch subjects');
        }
    };

    const fetchAvailableSlots = async () => {
        if (!newSchedule.year || !newSchedule.department || !newSchedule.section || !newSchedule.subject_code) {
            Alert.alert('Error', 'Please select Year, Department, Section and Subject first');
            return;
        }

        try {
            setFetchingSlots(true);
            const { todayStr, tomorrowStr } = getDateStrings();
            const dateStr = selectedDate === 'today' ? todayStr : tomorrowStr;
            
            const selectedSubject = subjects.find(sub => sub.subject_code === newSchedule.subject_code);
            const subjectType = selectedSubject?.subject_type || 'normal';

            const response = await fetch(
                `${API_BASE_URL}/faculty/${actualFacultyId}/available-slots?date=${dateStr}&year=${newSchedule.year}&department=${newSchedule.department}&section=${newSchedule.section}&subject_type=${subjectType}`
            );
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch available slots');
            }
            
            const data = await response.json();
            
            if (data.success) {
                setAvailableSlots(data.available_slots || []);
                if (data.available_slots.length === 0) {
                    Alert.alert('Info', 'No available time slots found for the selected criteria.');
                }
            } else {
                throw new Error(data.error || 'Failed to fetch available slots');
            }
        } catch (err) {
            console.error('Fetch slots error:', err);
            Alert.alert('Error', (err as Error).message);
            setAvailableSlots([]);
        } finally {
            setFetchingSlots(false);
        }
    };

    const handleCreateSubmit = async () => {
        if (!newSchedule.year || !newSchedule.department || !newSchedule.section || 
            !newSchedule.start_time || !newSchedule.end_time || !newSchedule.subject_code) {
            Alert.alert('Error', 'Please fill all required fields including subject and time slot');
            return;
        }

        try {
            const { todayStr, tomorrowStr } = getDateStrings();
            const dateStr = selectedDate === 'today' ? todayStr : tomorrowStr;
            
            const payload = {
                faculty_id: actualFacultyId,
                date: dateStr,
                year: newSchedule.year,
                department: newSchedule.department,
                section: newSchedule.section,
                start_time: newSchedule.start_time,
                end_time: newSchedule.end_time,
                venue: newSchedule.venue || '',
                subject_code: newSchedule.subject_code
            };

            const response = await fetch(`${API_BASE_URL}/schedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to create schedule');
            }
            
            setShowCreateModal(false);
            resetNewSchedule();
            fetchSchedules();
        } catch (err) {
            console.error('Create schedule error:', err);
            Alert.alert('Error', (err as Error).message);
        }
    };

    const resetNewSchedule = () => {
        setNewSchedule({
            year: '',
            department: '',
            section: '',
            venue: '',
            start_time: '',
            end_time: '',
            subject_code: ''
        });
        setAvailableSlots([]);
    };

    const renderFilterButtons = (options: string[], selectedValue: string, setValue: (value: string) => void) => (
        <View style={styles.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterButtonsContainer}>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.filterButton,
                                selectedValue === option && styles.filterButtonSelected
                            ]}
                            onPress={() => {
                                setValue(option);
                                if (availableSlots.length > 0) {
                                    setAvailableSlots([]);
                                }
                            }}
                        >
                            <Text style={[
                                styles.filterButtonText,
                                selectedValue === option && styles.filterButtonTextSelected
                            ]}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );

    if (!actualFacultyId && user?.email) {
        return (
            <LinearGradient colors={["#900a02", "#600202"]} style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={{ color: "#FFF", marginTop: spacing(10) }}>Loading today's schedule...</Text>
            </LinearGradient>
        );
    }

    const currentSchedule = getCurrentSchedule();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.greetingContainer}>
                <Text style={styles.greetingHello}>Hello,</Text>
                <Text style={styles.greetingName}>{user?.name || 'Faculty'}!</Text>
            </View>

            <View style={styles.calendarNav}>
                <TouchableOpacity 
                    style={[
                        styles.dateButton, 
                        selectedDate === 'today' && styles.dateButtonActive
                    ]}
                    onPress={() => setSelectedDate('today')}
                >
                    <Text style={[
                        styles.dateButtonText,
                        selectedDate === 'today' && styles.dateButtonTextActive
                    ]}>
                        Today
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[
                        styles.dateButton, 
                        selectedDate === 'tomorrow' && styles.dateButtonActive
                    ]}
                    onPress={() => setSelectedDate('tomorrow')}
                >
                    <Text style={[
                        styles.dateButtonText,
                        selectedDate === 'tomorrow' && styles.dateButtonTextActive
                    ]}>
                        Tomorrow
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing(14) }}>
                <Text style={styles.scheduleTitle}>{getScheduleTitle()}</Text>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity style={{ marginRight: spacing(15) }} onPress={handleCreateSchedule}>
                        <Icon name="plus-circle" size={fontSize(32)} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#FFF" style={{ marginTop: SPACING.xl }} />
            ) : currentSchedule.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No classes scheduled.</Text>
                    <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                        <Icon name="refresh" size={fontSize(20)} color="#600202" />
                        <Text style={styles.refreshText}>Click to refresh</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={currentSchedule}
                    renderItem={({ item }) => {
                        const now = new Date();
                        const scheduleDate = selectedDate === 'today' 
                            ? now 
                            : new Date(now.setDate(now.getDate() + 1));
                        
                        return (
                            <ClassScheduleCard
                                item={item}
                                scheduleDate={scheduleDate}
                                onCancel={handleCancelSchedule}
                                onMarkAttendance={handleMarkAttendance}
                            />
                        );
                    }}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#600202", "#900a02", "#ff6b6b"]}
                            tintColor="#600202"
                            title="Refreshing..."
                            titleColor="#FFF"
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Create Schedule Modal */}
            <Modal
                visible={showCreateModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setShowCreateModal(false);
                    resetNewSchedule();
                }}
            >
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                    style={styles.modalContainer}
                >
                    <View style={[styles.modalContent, { height: '80%' }]}>
                        <View>
                            <Text style={styles.modalTitle}>Schedule New Class</Text>
                        </View>
                        
                        <ScrollView 
                            style={{ flex: 1 }}
                            contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.xl }}
                            showsVerticalScrollIndicator={true}
                            nestedScrollEnabled={true}
                        >
                            <Text style={styles.label}>Academic Year *</Text>
                            {renderFilterButtons(yearOptions, newSchedule.year, 
                                (value) => setNewSchedule({...newSchedule, year: value}))}
                            
                            <Text style={styles.label}>Department *</Text>
                            {renderFilterButtons(departmentOptions, newSchedule.department, 
                                (value) => setNewSchedule({...newSchedule, department: value}))}
                            
                            <Text style={styles.label}>Section *</Text>
                            {renderFilterButtons(sectionOptions, newSchedule.section, 
                                (value) => setNewSchedule({...newSchedule, section: value}))}

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Subject *</Text>
                                <ScrollView style={styles.subjectDropdown}>
                                    {subjects.map((subject) => (
                                        <TouchableOpacity
                                            key={subject.subject_code}
                                            style={[
                                                styles.subjectItem,
                                                newSchedule.subject_code === subject.subject_code && styles.subjectItemSelected
                                            ]}
                                            onPress={() => setNewSchedule({
                                                ...newSchedule, 
                                                subject_code: subject.subject_code
                                            })}
                                        >
                                            <Text style={styles.subjectText}>
                                                {subject.subject_code} - {subject.subject_name}
                                            </Text>
                                            <Text style={styles.subjectType}>
                                                ({subject.subject_type})
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {newSchedule.year && newSchedule.department && newSchedule.section && newSchedule.subject_code && (
                                <TouchableOpacity 
                                    style={[styles.fetchSlotsButton, fetchingSlots && styles.buttonDisabled]}
                                    onPress={fetchAvailableSlots}
                                    disabled={fetchingSlots}
                                >
                                    {fetchingSlots ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <>
                                            <Text style={styles.fetchSlotsButtonText}>
                                                Fetch Available Time Slots
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}

                            {availableSlots.length > 0 && (
                                <View style={styles.slotsSection}>
                                    <Text style={styles.slotsTitle}>Available Time Slots</Text>
                                    {availableSlots.map((slot, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.slotItem,
                                                newSchedule.start_time === slot.start_time && styles.slotItemSelected
                                            ]}
                                            onPress={() => setNewSchedule({
                                                ...newSchedule,
                                                start_time: slot.start_time,
                                                end_time: slot.end_time
                                            })}
                                        >
                                            <Text style={styles.slotText}>
                                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Venue (Optional)</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter venue"
                                    value={newSchedule.venue}
                                    onChangeText={(text) => setNewSchedule({...newSchedule, venue: text})}
                                    placeholderTextColor="#999"
                                />
                            </View>

                            {newSchedule.start_time && (
                                <View style={styles.selectedTimeContainer}>
                                    <Text style={styles.selectedTime}>
                                        Selected: {formatTime(newSchedule.start_time)} - {formatTime(newSchedule.end_time)}
                                    </Text>
                                </View>
                            )}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity 
                                style={[styles.modalCancelButton, styles.modalButton]}
                                onPress={() => {
                                    setShowCreateModal(false);
                                    resetNewSchedule();
                                }}
                            >
                                <Text style={styles.modalCancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalSubmitButton, styles.modalButton, (!newSchedule.start_time) && styles.modalSubmitButtonDisabled]}
                                onPress={handleCreateSubmit}
                                disabled={!newSchedule.start_time}
                            >
                                <Text style={styles.modalSubmitButtonText}>Schedule Class</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Mark Attendance Modal */}
            <Modal
                visible={showAttendanceModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setShowAttendanceModal(false);
                    setSelectedSchedule(null);
                    setAttendanceReason('');
                    setAttendanceData([]);
                    setSelectAllState('allPresent');
                }}
            >
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                    style={styles.modalContainer}
                >
                    <View style={[styles.modalContent, { height: '90%' }]}>
                        <View>
                            <Text style={styles.modalTitle}>
                                {attendanceData.length > 0 
                                    ? selectedSchedule?.status 
                                        ? 'View Attendance' 
                                        : 'Mark Attendance'
                                    : 'Enter Topic for Session'
                                }
                            </Text>
                        </View>
                        
                        <ScrollView 
                            style={{ flex: 1 }}
                            contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.xl }}
                            showsVerticalScrollIndicator={true}
                            nestedScrollEnabled={true}
                        >
                            {selectedSchedule && (
                                <View style={styles.classInfoContainer}>
                                    <Text style={styles.classInfoTitle}>Class Details</Text>
                                    <View style={styles.classDetailRow}>
                                        <Text style={styles.classDetailLabel}>Subject:</Text>
                                        <Text style={styles.classDetailValue}>{selectedSchedule.subject_name}</Text>
                                    </View>
                                    <View style={styles.classDetailRow}>
                                        <Text style={styles.classDetailLabel}>Class:</Text>
                                        <Text style={styles.classDetailValue}>
                                            E-{selectedSchedule.year} {selectedSchedule.department} - {selectedSchedule.section}
                                        </Text>
                                    </View>
                                    <View style={styles.classDetailRow}>
                                        <Text style={styles.classDetailLabel}>Time:</Text>
                                        <Text style={styles.classDetailValue}>
                                            {formatTime(selectedSchedule.start_time)} - {formatTime(selectedSchedule.end_time)}
                                        </Text>
                                    </View>
                                    
                                    {attendanceData.length > 0 && (
                                        <View style={[styles.classDetailRow, { marginTop: spacing(8) }]}>
                                            <Text style={[styles.classDetailLabel, { color: '#4CAF50' }]}>Status:</Text>
                                            <Text style={[styles.classDetailValue, { color: '#4CAF50', fontWeight: 'bold' }]}>
                                                {attendanceData.filter(s => s.status === 'present').length}/{attendanceData.length} Present
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Topic Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Topic Discussed Today *</Text>
                                <TextInput
                                    style={styles.textArea}
                                    placeholder="Enter the topics you have discussed today..."
                                    value={attendanceReason}
                                    onChangeText={setAttendanceReason}
                                    placeholderTextColor="#999"
                                    multiline={true}
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                    editable={!selectedSchedule?.status} // Disable if class completed
                                />
                            </View>

                            {/* Enter Attendance Button - Only show if no attendance data loaded */}
                            

                            {/* Attendance Grid Section */}
                            {attendanceData.length > 0 && (
                                <View style={styles.attendanceGridSection}>
                                    <View style={styles.attendanceHeader}>
                                        <Text style={styles.attendanceTitle}>
                                            Attendance ({attendanceData.filter(s => s.status === 'present').length}/{attendanceData.length})
                                        </Text>
                                        
                                        {/* Show invert button only if class is not completed */}
                                        {!selectedSchedule?.status && (
                                            <TouchableOpacity 
                                                style={styles.invertButton}
                                                onPress={toggleAllAttendance}
                                            >
                                                <Icon 
                                                    name={selectAllState === 'allPresent' ? "checkbox-multiple-marked-outline" : "checkbox-multiple-blank-outline"} 
                                                    size={fontSize(18)} 
                                                    color="#FFF" 
                                                />
                                                <Text style={styles.invertButtonText}>
                                                    {selectAllState === 'allPresent' ? 'Mark All Absent' : 'Mark All Present'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {/* Show message if attendance is already marked as completed */}
                                    {selectedSchedule?.status && (
                                        <View style={[styles.infoContainer, { backgroundColor: '#E8F5E9', marginBottom: SPACING.lg }]}>
                                            <Icon name="check-circle" size={fontSize(16)} color="#4CAF50" />
                                            <Text style={[styles.infoText, { color: '#2E7D32' }]}>
                                                Attendance already marked as completed. View only mode.
                                            </Text>
                                        </View>
                                    )}

                                    {/* Attendance Grid */}
                                    <View style={styles.gridContainer}>
                                        {attendanceData.map((student, index) => (
                                            <TouchableOpacity
                                                key={student.student_number}
                                                style={[
                                                    styles.gridItem,
                                                    student.status === 'present' ? styles.gridItemPresent : styles.gridItemAbsent,
                                                    selectedSchedule?.status && styles.gridItemDisabled
                                                ]}
                                                onPress={() => !selectedSchedule?.status && toggleStudentAttendance(index)}
                                                disabled={selectedSchedule?.status}
                                            >
                                                <Text style={styles.gridItemNumber}>
                                                    {student.student_number}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Attendance Summary */}
                                    <View style={styles.attendanceSummary}>
                                        <View style={styles.summaryItem}>
                                            <View style={[styles.summaryDot, { backgroundColor: '#4CAF50' }]} />
                                            <Text style={styles.summaryText}>
                                                Present: {attendanceData.filter(s => s.status === 'present').length}
                                            </Text>
                                        </View>
                                        <View style={styles.summaryItem}>
                                            <View style={[styles.summaryDot, { backgroundColor: '#F44336' }]} />
                                            <Text style={styles.summaryText}>
                                                Absent: {attendanceData.filter(s => s.status === 'absent').length}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        {/* Footer with Action Buttons */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity 
                                style={[styles.modalCancelButton, styles.modalButton]}
                                onPress={() => {
                                    setShowAttendanceModal(false);
                                    setSelectedSchedule(null);
                                    setAttendanceReason('');
                                    setAttendanceData([]);
                                    setSelectAllState('allPresent');
                                }}
                            >
                                <Text style={styles.modalCancelButtonText}>
                                    {attendanceData.length > 0 ? 'Close' : 'Cancel'}
                                </Text>
                            </TouchableOpacity>
                            
                            {/* Show "Enter Attendance" button on right side when only topic is entered */}
                            {attendanceData.length === 0 && attendanceReason.trim() && !selectedSchedule?.status && (
                                <TouchableOpacity 
                                    style={[styles.modalSubmitButton, styles.modalButton]}
                                    onPress={initializeAttendanceData}
                                    disabled={isFetchingStudents}
                                >
                                    {isFetchingStudents ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <Text style={styles.modalSubmitButtonText}>
                                        <Icon name ="account-check-outline" size={fontSize(18)} color="#FFF" />
                                            Enter
                                        </Text>
                                    )}  
                                </TouchableOpacity>
                            )}
                            
                            {/* Show submit button only if class is not completed and we have attendance data */}
                            {attendanceData.length > 0 && !selectedSchedule?.status && (
                                <TouchableOpacity 
                                    style={[styles.modalSubmitButton, styles.modalButton]}
                                    onPress={submitAttendance}
                                    disabled={isSubmittingAttendance || !attendanceReason.trim()}
                                >
                                    {isSubmittingAttendance ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <Text style={styles.modalSubmitButtonText}>
                                            Submit 
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: "#600202", 
        paddingHorizontal: SPACING.lg, 
        paddingTop: spacing(6) 
    },
    greetingContainer: { 
        marginTop: SPACING.lg,
        marginBottom: SPACING.md,
    },
    greetingHello: { 
        color: "rgba(255, 255, 255, 0.85)", 
        fontSize: fontSize(15),
        fontWeight: '500',
    },
    greetingName: { 
        color: "#FFF", 
        fontSize: FONT_SIZES.xxxl, 
        fontWeight: "700",
        marginTop: spacing(2),
    },
    calendarNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.lg,
        gap: 10,
    },
    dateButton: {
        flex: 1,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    dateButtonActive: {
        backgroundColor: '#FFF',
        borderColor: '#FFF',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    dateButtonText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: fontSize(15),
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    dateButtonTextActive: {
        color: '#900a02',
        fontWeight: '700',
    },
    scheduleTitle: { 
        color: "#FFF", 
        fontSize: FONT_SIZES.xl, 
        fontWeight: "700", 
        marginBottom: SPACING.md,
        letterSpacing: 0.5,
    },
    listContainer: { 
        paddingBottom: SPACING.xl 
    },
    card: { 
        marginBottom: SPACING.md, 
        backgroundColor: "#FFF", 
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        overflow: 'hidden',
        minHeight: 180,
    },
    subjectCircle: { 
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing(14),
        paddingHorizontal: spacing(14),
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        backgroundColor: '#FAFAFA',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    subjectBadge: {
        width: 95,
        height: 70,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    subjectInitial: {
        fontSize: fontSize(22),
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    subjectText: { 
        color: "#212121", 
        fontWeight: "700", 
        fontSize: fontSize(17),
    },
    statusBadgeTopRight: {
        position: 'absolute',
        top: 8,
        right: 10,
        backgroundColor: '#E8F5E9',
        paddingHorizontal: spacing(10),
        paddingVertical: spacing(5),
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        zIndex: 10,
    },
    statusBadgeText: {
        color: '#2E7D32',
        fontSize: FONT_SIZES.xs,
        fontWeight: '600',
    },
    cardDetails: { 
        padding: SPACING.md,
    },
    detailText: { 
        color: "#424242", 
        fontSize: FONT_SIZES.md,
        lineHeight: 20,
        fontWeight: '600',
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        padding: spacing(10),
        borderRadius: 8,
        marginTop: SPACING.sm,
    },
    infoText: {
        color: '#1565C0',
        fontSize: fontSize(13),
        marginLeft: SPACING.sm,
        fontWeight: '500',
        flex: 1,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 6,
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md,
        flexWrap: 'wrap',
    },
    attendanceButton: { 
        backgroundColor: "#2196F3", 
        paddingVertical: spacing(10),
        paddingHorizontal: SPACING.xl,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        flex: 1,
        justifyContent: 'center',
    },
    buttonText: { 
        color: "#FFF", 
        fontWeight: "600", 
        fontSize: FONT_SIZES.md,
    },
    cancelButton: { 
        backgroundColor: "#F44336", 
        padding: spacing(6),
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        elevation: 2,
    },
    cancelButtonHeader: { 
        position: 'absolute',
        top: spacing(10), 
        right: spacing(13),
    },
    emptyContainer: { 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center",
        marginTop: spacing(100),
        paddingHorizontal: spacing(40),
    },
    emptyText: { 
        color: 'rgba(255, 255, 255, 0.9)', 
        fontSize: FONT_SIZES.lg,
        marginBottom: SPACING.xxl,
        textAlign: 'center',
        fontWeight: '600',
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: SPACING.xxl,
        paddingVertical: spacing(14),
        borderRadius: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    refreshText: {
        color: '#900a02',
        marginLeft: SPACING.sm,
        fontWeight: '700',
        fontSize: fontSize(15),
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: SPACING.xl,
    },
    modalContent: {
        width: "100%",
        maxHeight: "85%",
        backgroundColor: "#FFF",
        borderRadius: 16,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    modalTitle: { 
        fontSize: FONT_SIZES.xxl, 
        fontWeight: "700", 
        textAlign: "center",
        paddingVertical: spacing(18),
        paddingHorizontal: SPACING.xl,
        backgroundColor: '#600202',
        color: '#FFF',
    },
    filterSection: {
        marginBottom: spacing(25),
    },
    filterButtonsContainer: {
        flexDirection: 'row',
    },
    filterButton: {
        backgroundColor: '#e9ecef',
        paddingHorizontal: SPACING.lg,
        paddingVertical: spacing(10),
        borderRadius: 20,
        marginRight: spacing(10),
        borderWidth: 1,
        borderColor: '#dee2e6',
        minWidth: 60,
        alignItems: 'center',
    },
    filterButtonSelected: {
        backgroundColor: '#600202',
        borderColor: '#600202',
    },
    filterButtonText: {
        color: '#495057',
        fontWeight: '500',
        fontSize: FONT_SIZES.md,
    },
    filterButtonTextSelected: {
        color: '#FFF',
        fontWeight: '600',
    },
    inputGroup: {
        marginBottom: SPACING.xl,
    },
    label: {
        fontSize: FONT_SIZES.lg,
        fontWeight: '600',
        color: '#600202',
        marginBottom: SPACING.sm,
    },
    subjectDropdown: {
        maxHeight: 150,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
    },
    subjectItem: {
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    subjectItemSelected: {
        backgroundColor: '#D4EDDA',
        borderLeftWidth: 4,
        borderLeftColor: '#28A745',
    },
    subjectType: {
        fontSize: FONT_SIZES.sm,
        color: '#6C757D',
        marginTop: spacing(2),
    },
    textArea: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: SPACING.md,
        fontSize: FONT_SIZES.lg,
        backgroundColor: '#f8f9fa',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    fetchSlotsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ff6b35',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: 8,
        marginBottom: SPACING.xl,
        justifyContent: 'center',
        gap: 8,
    },
    fetchSlotsButtonText: {
        color: '#FFF',
        fontSize: FONT_SIZES.lg,
        fontWeight: '600',
    },
    slotsSection: {
        backgroundColor: '#F8F9FA',
        padding: spacing(15),
        borderRadius: 12,
        marginBottom: spacing(15),
        borderLeftWidth: 4,
        borderLeftColor: '#28A745',
    },
    slotsTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: '600',
        color: '#600202',
        marginBottom: spacing(10),
    },
    slotItem: {
        padding: SPACING.md,
        backgroundColor: '#FFF',
        borderRadius: 8,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    slotItemSelected: {
        backgroundColor: '#D4EDDA',
        borderColor: '#28A745',
    },
    slotText: {
        fontSize: FONT_SIZES.md,
        color: '#28A745',
        fontWeight: '500',
        textAlign: 'center',
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: SPACING.md,
        fontSize: FONT_SIZES.lg,
        backgroundColor: '#f8f9fa',
    },
    selectedTimeContainer: {
        backgroundColor: '#FFF3CD',
        padding: spacing(15),
        borderRadius: 8,
        marginTop: spacing(10),
    },
    selectedTime: {
        fontSize: fontSize(15),
        color: '#600202',
        fontWeight: '600',
        textAlign: 'center',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        backgroundColor: '#FFF',
        gap: 10,
    },
    modalButton: {
        paddingVertical: spacing(14),
        paddingHorizontal: SPACING.xl,
        borderRadius: 10,
        minWidth: 120,
        alignItems: 'center',
        elevation: 2,
        flex: 1,
    },
    modalCancelButton: {
        backgroundColor: '#757575',
    },
    modalSubmitButton: {
        backgroundColor: '#28a745',
        height: '100%',
    },
    modalSubmitButtonDisabled: {
        backgroundColor: '#6c757d',
        opacity: 0.6,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    modalCancelButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: FONT_SIZES.lg,
    },
    modalSubmitButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: FONT_SIZES.lg,
    },
    classInfoContainer: {
        backgroundColor: '#F8F9FA',
        padding: spacing(15),
        borderRadius: 12,
        marginBottom: SPACING.xl,
        borderLeftWidth: 4,
        borderLeftColor: '#600202',
    },
    classInfoTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: 'bold',
        color: '#600202',
        marginBottom: spacing(10),
    },
    classDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing(6),
    },
    classDetailLabel: {
        fontSize: FONT_SIZES.md,
        color: '#600202',
        fontWeight: '600',
    },
    classDetailValue: {
        fontSize: FONT_SIZES.md,
        color: '#495057',
        fontWeight: '500',
    },
    enterAttendanceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#600202',
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xxl,
        borderRadius: 10,
        justifyContent: 'center',
        gap: 10,
        marginVertical: SPACING.xl,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    enterAttendanceButtonText: {
        color: '#FFF',
        fontSize: FONT_SIZES.lg,
        fontWeight: 'bold',
    },
    attendanceGridSection: {
        marginTop: SPACING.lg,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: spacing(15),
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    attendanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    attendanceTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: 'bold',
        color: '#600202',
    },
    invertButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B35',
        paddingVertical: spacing(8),
        paddingHorizontal: spacing(12),
        borderRadius: 8,
        gap: 6,
    },
    invertButtonText: {
        color: '#FFF',
        fontSize: FONT_SIZES.sm,
        fontWeight: '600',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 8,
        marginBottom: SPACING.lg,
    },
    gridItem: {
        width: '11%', // Adjust based on screen size for 71 items
        aspectRatio: 1,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    gridItemPresent: {
        backgroundColor: '#4CAF50',
    },
    gridItemAbsent: {
        backgroundColor: '#F44336',
    },
    gridItemDisabled: {
        opacity: 0.7,
    },
    gridItemNumber: {
        color: '#FFF',
        fontSize: FONT_SIZES.md,
        fontWeight: 'bold',
    },
    attendanceSummary: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: spacing(12),
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    summaryDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    summaryText: {
        fontSize: FONT_SIZES.md,
        color: '#424242',
        fontWeight: '600',
    },
});

export default HomeScreen;