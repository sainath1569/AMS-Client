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
    otp?: string; // Add OTP field
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

const API_BASE_URL = 'https://ams-server-4eol.onrender.com';

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
  
  // ✅ FIX: Use local date formatting instead of toISOString()
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

  // Helper function to compare dates (ignoring time)
  const isSameDate = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // ✅ FIX: Use local date formatting for comparisons
  const isUpcoming = () => {
    const currentDateTime = new Date();
    const scheduleDateStr = formatDateForComparison(scheduleDate);
    const classStartDateTime = parseDateTime(scheduleDateStr, item.start_time);
    
    // If it's not today, it's always upcoming
    if (!isSameDate(currentDateTime, scheduleDate)) {
      return true;
    }
    
    // If it's today, check if current time is before class start time
    return currentDateTime < classStartDateTime;
  };

  const isOngoing = () => {
    const currentDateTime = new Date();
    
    // Can only be ongoing if it's today
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
    
    // If it's a past date, it's expired
    if (scheduleDate < new Date(currentDateTime.getFullYear(), currentDateTime.getMonth(), currentDateTime.getDate())) {
      return true;
    }
    
    // If it's today, check if class end time has passed (with buffer)
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

    // PRIORITY 1: Completed classes (highest priority)
    if (completed) {
      return {
        status: 'completed',
        badge: { text: 'Completed', color: '#4ECDC4', bgColor: '#E8F5E9' },
        message: '✓ Attendance marked successfully',
        showMarkAttendance: false,
        showCancel: false
      };
    }

    // PRIORITY 2: Class is ongoing (can mark attendance)
    if (ongoing) {
      return {
        status: 'ongoing',
        badge: { text: 'Ongoing', color: '#4ECDC4', bgColor: '#E8F5E9' },
        message: 'Class in progress - Ready for attendance',
        showMarkAttendance: true,
        showCancel: true
      };
    }

    // PRIORITY 3: Upcoming class
    if (upcoming) {
      return {
        status: 'upcoming',
        badge: { text: 'Upcoming', color: '#15d2f8ff', bgColor: '#e1fffeff' },
        message: 'Class is scheduled - Not started yet',
        showMarkAttendance: false,
        showCancel: true
      };
    }

    // PRIORITY 4: Expired class (missed attendance)
    if (expired) {
      return {
        status: 'expired',
        badge: { text: 'Expired', color: '#FF6B6B', bgColor: '#FFEBEE' },
        message: 'Class completed - Attendance not marked',
        showMarkAttendance: false,
        showCancel: false
      };
    }

    // Default case
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
  const upcoming = isUpcoming();

  // Generate subject mnemonic from subject name
  const getSubjectMnemonic = (subjectName: string): string => {
    if (item.subject_mnemonic) return item.subject_mnemonic;
    
    // Extract first letters of major words
    const words = subjectName.split(' ');
    if (words.length === 1) {
      return subjectName.substring(0, 3).toUpperCase();
    }
    
    // Take first letter of each word (max 3 letters)
    return words
      .slice(0, 3)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  };

  const subjectMnemonic = getSubjectMnemonic(item.subject_name);

  return (
    <View style={styles.card}>
      {/* Status badge - top right corner */}
      {classStatus.badge.text ? (
        <View style={[styles.statusBadgeTopRight, { backgroundColor: classStatus.badge.bgColor }]}>
          <Text style={[styles.statusBadgeText, { color: classStatus.badge.color }]}>
            {classStatus.badge.text}
          </Text>
        </View>
      ) : null}
      
      {/* Subject Header with colored badge and Cancel button */}
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
            
            {/* Cancel Button - Clean design in header */}
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

      {/* Class Details */}
      {/* Class Details */}
<View style={styles.cardDetails}>
  {/* Timing and Venue */}
  <View style={{ marginBottom: SPACING.md }}>
    {/* Time */}
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
    
    {/* Location */}
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
    
    {/* Class Info */}
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

    {/* OTP Display - Show alongside other details */}
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
  
  {/* Status Messages */}
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

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {/* Mark Attendance Button */}
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
    const [generatedOTP, setGeneratedOTP] = useState<string>('');
    const [isGeneratingOTP, setIsGeneratingOTP] = useState<boolean>(false);
    const [attendanceReason, setAttendanceReason] = useState<string>('');
    
    const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow'>('today');

    // Filter options
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

    // Helper function to get date strings
    // ✅ FIX: Uses local date methods
const getDateStrings = () => {
    const now = new Date();
    
    // Get current date in local timezone
    const today = new Date(now);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format dates as YYYY-MM-DD (local timezone)
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

    // ✅ FIX: Comprehensive logging for debugging
const fetchSchedules = async () => {
    if (!actualFacultyId) return;

    try {
        setLoading(true);
        
        const { todayStr, tomorrowStr } = getDateStrings();
        

        
        const [todayResponse, tomorrowResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/faculty/${actualFacultyId}/schedule?date=${todayStr}`),
            fetch(`${API_BASE_URL}/faculty/${actualFacultyId}/schedule?date=${tomorrowStr}`)
        ]);
        
        
        
        // Process today's schedule
        if (todayResponse.ok) {
            const todayData: ScheduleData = await todayResponse.json();
            
            setTodaySchedule(todayData.schedules || []);
        } else {
            const errorText = await todayResponse.text();
            setTodaySchedule([]);
        }
        
        // Process tomorrow's schedule
        if (tomorrowResponse.ok) {
            const tomorrowData: ScheduleData = await tomorrowResponse.json();
            
            setTomorrowSchedule(tomorrowData.schedules || []);
        } else {
            const errorText = await tomorrowResponse.text();
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

    // ✅ FIX: Better error handling
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

    // Enhanced sorting function that prioritizes ongoing classes
    const sortSchedule = (schedule: ScheduleItem[], scheduleDate: Date) => {
        return schedule.sort((a, b) => {
            // Helper function to determine class priority
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

                // Priority 1: Ongoing classes (highest priority)
                if (currentTime >= startTime && currentTime <= endTimeWithBuffer && !item.status) {
                    return 1;
                }
                // Priority 2: Upcoming classes
                else if (currentTime < startTime && !item.status) {
                    return 2;
                }
                // Priority 3: Completed classes
                else if (item.status){
                    return 3;
                }
                // Priority 4: Expired classes
                else {
                    return 4;
                }
            };

            const priorityA = getClassPriority(a);
            const priorityB = getClassPriority(b);

            // If same priority, sort by start time
            if (priorityA === priorityB) {
                const [aHours, aMinutes] = a.start_time.split(':').map(Number);
                const [bHours, bMinutes] = b.start_time.split(':').map(Number);
                return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
            }

            // Sort by priority (ongoing first, then upcoming, then completed, then expired)
            return priorityA - priorityB;
        });
    };

    // ✅ FIX: Better logging and consistent dates
const getCurrentSchedule = () => {
    const schedule = selectedDate === 'today' ? todaySchedule : tomorrowSchedule;
    const now = new Date();
    const scheduleDate = selectedDate === 'today' ? now : new Date(now.setDate(now.getDate() + 1));
    
    
    return sortSchedule([...schedule], scheduleDate);
};

    // ✅ FIX: Shows actual dates for clarity
const getScheduleTitle = () => {
    const now = new Date();
    const today = now.toLocaleDateString();
    const tomorrow = new Date(now.setDate(now.getDate() + 1)).toLocaleDateString();
    
    return selectedDate === 'today' 
        ? `Today's Schedule ` 
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

    const handleMarkAttendance = (schedule: ScheduleItem) => {
        setSelectedSchedule(schedule);
        setShowAttendanceModal(true);
        setGeneratedOTP('');
        setAttendanceReason('');
    };

    const generateOTP = async () => {
        if (!selectedSchedule) return;

        if (!attendanceReason.trim()) {
            Alert.alert('Error', 'Please enter topic for marking attendance');
            return;
        }

        try {
            setIsGeneratingOTP(true);
            
            // Generate OTP with 2 capital letters, 2 small letters, 2 digits
            const capitals = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const smalls = 'abcdefghijklmnopqrstuvwxyz';
            const digits = '0123456789';
            
            const getRandomChar = (str: string) => str[Math.floor(Math.random() * str.length)];
            
            const otp = 
                getRandomChar(capitals) + 
                getRandomChar(smalls) +
                getRandomChar(digits) +
                getRandomChar(capitals) +
                getRandomChar(digits) + 
                getRandomChar(smalls);
            
            const shuffledOTP = otp.split('').sort(() => 0.5 - Math.random()).join('');
            
            const response = await fetch(`${API_BASE_URL}/generate-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    schedule_id: selectedSchedule.id,
                    faculty_id: actualFacultyId,
                    otp: shuffledOTP,
                    otp_created_at: new Date().toISOString(),
                    topic_discussed: attendanceReason.trim()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate OTP');
            }

            setGeneratedOTP(shuffledOTP);
                    await fetchSchedules();

        } catch (err) {
            console.error('Generate OTP error:', err);
            Alert.alert('Error', 'Failed to generate OTP');
        } finally {
            setIsGeneratingOTP(false);
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
               // ✅ FIX: Consistent date creation
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

                {/* Rest of your modal content remains the same */}
                {/* Subject Dropdown */}
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

                {/* Fetch Time Slots Button */}
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

                {/* Available Time Slots */}
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

                {/* Venue Input */}
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

                {/* Selected Time Display */}
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
        setGeneratedOTP('');
        setAttendanceReason('');
    }}
>
    <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.modalContainer}
    >
        <View style={[styles.modalContent, { height: '80%' }]}>
            {/* Updated Header - Same as Schedule New Class */}
            <View>
                <Text style={styles.modalTitle}>Mark Attendance</Text>
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
                        <View style={styles.classDetailRow}>
                            <Text style={styles.classDetailLabel}>Venue:</Text>
                            <Text style={styles.classDetailValue}>
                                {selectedSchedule.venue || 'Not specified'}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Attendance Reason Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Topic Discussed *</Text>
                    <TextInput
                        style={styles.textArea}
                        placeholder="Enter the topics you have discussed today..."
                        value={attendanceReason}
                        onChangeText={setAttendanceReason}
                        placeholderTextColor="#999"
                        multiline={true}
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                {/* OTP Display Section */}
                <View style={styles.otpSection}>
                    <Text style={styles.otpTitle}>Attendance OTP</Text>
                    
                    {/* Show existing OTP if available */}
                    {selectedSchedule?.otp && (
                        <View style={styles.existingOtpContainer}>
                            <Text style={styles.existingOtpLabel}>Current OTP:</Text>
                            <Text style={styles.existingOtpValue}>{selectedSchedule.otp}</Text>
                            
                            <Text style={styles.otpInstruction}>
                                Share this OTP with your students. They need to enter this in their app to mark attendance.
                            </Text>
                        </View>
                    )}

                    {/* Show newly generated OTP */}
                    {generatedOTP && (
                        <View style={styles.generatedOtpContainer}>
                            <Text style={styles.generatedOtpLabel}>New OTP Generated:</Text>
                            <Text style={styles.generatedOtpValue}>{generatedOTP}</Text>
                            <Text style={styles.otpInstruction}>
                                Share this OTP with your students. They need to enter this in their app to mark attendance.
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Footer with Action Buttons */}
            <View style={styles.modalFooter}>
                <TouchableOpacity 
                    style={[styles.modalCancelButton, styles.modalButton]}
                    onPress={() => {
                        setShowAttendanceModal(false);
                        setSelectedSchedule(null);
                        setGeneratedOTP('');
                        setAttendanceReason('');
                    }}
                >
                    <Text style={styles.modalCancelButtonText}>Close</Text>
                </TouchableOpacity>
                {!selectedSchedule?.otp && !generatedOTP && (
                    <TouchableOpacity 
                        style={[styles.modalSubmitButton, styles.modalButton, (!attendanceReason.trim()) && styles.modalSubmitButtonDisabled]}
                        onPress={generateOTP}
                        disabled={!attendanceReason.trim() || isGeneratingOTP}
                    >
                        {isGeneratingOTP ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Text style={styles.modalSubmitButtonText}>Generate OTP</Text>
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

// Helper function for formatting time
const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
};

// Use the exact same styles from the student app
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
    // Add to your styles object
noOtpContainer: {
  backgroundColor: '#F5F5F5',
  padding: spacing(20),
  borderRadius: 8,
  alignItems: 'center',
  marginBottom: spacing(10),
  borderWidth: 1,
  borderColor: '#E0E0E0',
},
noOtpText: {
  fontSize: FONT_SIZES.lg,
  color: '#757575',
  fontWeight: '600',
  marginTop: spacing(10),
  textAlign: 'center',
},
noOtpSubtext: {
  fontSize: FONT_SIZES.sm,
  color: '#9E9E9E',
  textAlign: 'center',
  marginTop: spacing(5),
  fontStyle: 'italic',
},
// Add these missing styles to your styles object
existingOtpContainer: {
    backgroundColor: '#FFF3CD',
    padding: spacing(15),
    borderRadius: 8,
    marginBottom: spacing(10),
    borderWidth: 1,
    borderColor: '#FFC107',
},
existingOtpLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#856404',
    marginBottom: spacing(5),
},
existingOtpValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: '#600202',
    textAlign: 'center',
    marginVertical: spacing(5),
    letterSpacing: 2,
},
otpTime: {
    fontSize: FONT_SIZES.sm,
    color: '#856404',
    textAlign: 'center',
    marginBottom: spacing(5),
    fontStyle: 'italic',
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
    upcomingPlaceholder: {
        backgroundColor: '#F5F5F5',
        paddingVertical: spacing(10),
        paddingHorizontal: SPACING.xl,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    upcomingPlaceholderText: {
        color: '#9E9E9E',
        fontSize: fontSize(13),
        fontWeight: '500',
        marginLeft: SPACING.sm,
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
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.xl,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    formContainer: {
        padding: SPACING.xl,
    },
    // Filter Styles
    filterSection: {
        marginBottom: spacing(25),
    },
    filterLabel: {
        color: '#600202',
        fontSize: FONT_SIZES.lg,
        fontWeight: '600',
        marginBottom: SPACING.md,
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
    // Input Groups
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
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        backgroundColor: '#FFF',
    },
    modalButton: {
        backgroundColor: "#600202",
        paddingVertical: spacing(14),
        paddingHorizontal: SPACING.xxxl,
        borderRadius: 10,
        minWidth: 120,
        alignItems: 'center',
        elevation: 2,
    },
    modalCancelButton: {
        backgroundColor: '#757575',
    },
    modalSubmitButton: {
        backgroundColor: '#28a745',
    },
    modalSubmitButtonDisabled: {
        backgroundColor: '#6c757d',
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
    otpSection: {
        backgroundColor: '#E8F5E8',
        padding: spacing(15),
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#28A745',
        marginBottom: spacing(30),
    },
    otpTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: 'bold',
        color: '#28A745',
        marginBottom: spacing(5),
    },
    generateOtpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#28A745',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: 8,
        justifyContent: 'center',
        gap: 8,
        marginBottom: spacing(10),
    },
    generateOtpButtonText: {
        color: '#FFF',
        fontSize: FONT_SIZES.lg,
        fontWeight: '600',
    },
    generatedOtpContainer: {
        backgroundColor: '#FFF',
        padding: spacing(15),
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#28A745',
    },
    generatedOtpLabel: {
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        color: '#28A745',
        marginBottom: spacing(5),
    },
    generatedOtpValue: {
        fontSize: FONT_SIZES.xxxl,
        fontWeight: 'bold',
        color: '#600202',
        textAlign: 'center',
        marginVertical: spacing(10),
        letterSpacing: 3,
    },
    otpInstruction: {
        fontSize: FONT_SIZES.sm,
        color: '#6C757D',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    cancelButtonHeader: { 
        position: 'absolute',
        top: spacing(10), 
        right: spacing(13),
       
    },
});

export default HomeScreen;