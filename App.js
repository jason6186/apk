import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Alert,
  StatusBar,
  SafeAreaView,
  Platform,
  Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

const HomeworkTracker = () => {
  const [subjects, setSubjects] = useState([
    {
      id: 1,
      name: '數學',
      dueDate: new Date('2025-06-05T23:59:00'),
      reminderDate: new Date('2025-06-03T09:00:00'),
      status: 'pending',
      submittedDate: null,
      isNoLimit: false
    }
  ]);
  
  const [darkMode, setDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [showFullscreenReminder, setShowFullscreenReminder] = useState(false);
  const [upcomingSubjects, setUpcomingSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState({
    name: '',
    dueDate: new Date(),
    reminderDate: new Date(),
    isNoLimit: false
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('date');
  const [currentDateField, setCurrentDateField] = useState('');

  const statusConfig = {
    submitted: { icon: 'checkmark-circle', color: '#10B981', label: '已繳交' },
    unknown: { icon: 'help-circle', color: '#F59E0B', label: '未知' },
    pending: { icon: 'close-circle', color: '#EF4444', label: '未繳交' }
  };

  // 檢查是否需要顯示提醒
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const upcoming = subjects.filter(subject => {
        if (subject.isNoLimit || subject.status === 'submitted') return false;
        
        const timeDiff = subject.dueDate - now;
        const daysLeft = timeDiff / (1000 * 60 * 60 * 24);
        
        return daysLeft <= 3 && daysLeft > 0;
      });
      
      if (upcoming.length > 0) {
        setUpcomingSubjects(upcoming);
        setShowFullscreenReminder(true);
      }
    };

    const interval = setInterval(checkReminders, 60000);
    checkReminders();

    return () => clearInterval(interval);
  }, [subjects]);

  const addSubject = () => {
    if (newSubject.name && (newSubject.dueDate || newSubject.isNoLimit)) {
      const newId = subjects.length > 0 ? Math.max(...subjects.map(s => s.id)) + 1 : 1;
      setSubjects([...subjects, {
        id: newId,
        ...newSubject,
        status: 'pending',
        submittedDate: null
      }]);
      setNewSubject({
        name: '',
        dueDate: new Date(),
        reminderDate: new Date(),
        isNoLimit: false
      });
      setShowAddForm(false);
    }
  };

  const deleteSubject = (id) => {
    Alert.alert(
      '確認刪除',
      '確定要刪除這個科目嗎？',
      [
        { text: '取消', style: 'cancel' },
        { text: '刪除', style: 'destructive', onPress: () => {
          setSubjects(subjects.filter(s => s.id !== id));
        }}
      ]
    );
  };

  const updateSubjectStatus = (id, status, submittedDate = null) => {
    setSubjects(subjects.map(subject => 
      subject.id === id 
        ? { ...subject, status, submittedDate }
        : subject
    ));
  };

  const markAllAsPending = () => {
    Alert.alert(
      '確認重設',
      '確定要將所有科目設為未繳交嗎？',
      [
        { text: '取消', style: 'cancel' },
        { text: '確認', onPress: () => {
          setSubjects(subjects.map(subject => ({
            ...subject,
            status: 'pending',
            submittedDate: null
          })));
        }}
      ]
    );
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      weekday: 'short'
    });
  };

  const formatDateTime = (date) => {
    return date.toLocaleString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (dueDate, isNoLimit) => {
    if (isNoLimit) return null;
    
    const now = new Date();
    const diffTime = dueDate - now;
    
    if (diffTime <= 0) {
      const pastDays = Math.ceil(Math.abs(diffTime) / (1000 * 60 * 60 * 24));
      return { type: 'overdue', days: pastDays, hours: 0 };
    }
    
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    if (diffDays < 1) {
      const hours = Math.ceil(diffTime / (1000 * 60 * 60));
      return { type: 'hours', days: 0, hours };
    } else {
      const days = Math.ceil(diffDays);
      return { type: 'days', days, hours: 0 };
    }
  };

  const openDatePicker = (field, mode = 'date') => {
    setCurrentDateField(field);
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');

    if (currentDateField.includes('new')) {
      const field = currentDateField.replace('new', '').toLowerCase();
      setNewSubject({ ...newSubject, [field + 'Date']: currentDate });
    } else if (currentDateField.includes('edit')) {
      const field = currentDateField.replace('edit', '').toLowerCase();
      setEditingSubject({ ...editingSubject, [field + 'Date']: currentDate });
    }
  };

  const styles = getStyles(darkMode);

  // 全螢幕提醒組件
  const FullscreenReminder = () => (
    <Modal
      visible={showFullscreenReminder}
      animationType="fade"
      transparent={false}
      statusBarTranslucent={true}
    >
      <StatusBar backgroundColor="#DC2626" barStyle="light-content" />
      <View style={styles.fullscreenModal}>
        <SafeAreaView style={styles.fullscreenContent}>
          <View style={styles.reminderHeader}>
            <Ionicons name="warning" size={64} color="#FFF" />
            <Text style={styles.reminderTitle}>以下科目繳交時間快到了</Text>
          </View>
          
          <ScrollView style={styles.reminderList}>
            {upcomingSubjects.map(subject => {
              const timeRemaining = getTimeRemaining(subject.dueDate, subject.isNoLimit);
              
              return (
                <View key={subject.id} style={styles.reminderItem}>
                  <View style={styles.reminderItemHeader}>
                    <Text style={styles.reminderItemTitle}>{subject.name}</Text>
                    <Text style={styles.reminderItemTime}>
                      {timeRemaining && timeRemaining.type === 'hours' && 
                        `剩餘 ${timeRemaining.hours} 小時`}
                      {timeRemaining && timeRemaining.type === 'days' && 
                        `剩餘 ${timeRemaining.days} 天`}
                      {timeRemaining && timeRemaining.type === 'overdue' && 
                        `已過期 ${timeRemaining.days} 天`}
                    </Text>
                  </View>
                  <Text style={styles.reminderItemDue}>
                    截止時間: {formatDateTime(subject.dueDate)}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
          
          <TouchableOpacity
            style={styles.reminderButton}
            onPress={() => setShowFullscreenReminder(false)}
          >
            <Text style={styles.reminderButtonText}>我知道了</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        backgroundColor={darkMode ? '#1F2937' : '#FFFFFF'} 
        barStyle={darkMode ? 'light-content' : 'dark-content'} 
      />
      
      {/* 全螢幕提醒 */}
      <FullscreenReminder />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>習作繳交狀況</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setDarkMode(!darkMode)}
          >
            <Ionicons 
              name={darkMode ? 'sunny' : 'moon'} 
              size={20} 
              color={darkMode ? '#FFF' : '#000'} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSettings(!showSettings)}
          >
            <Ionicons 
              name="settings" 
              size={20} 
              color={darkMode ? '#FFF' : '#000'} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings Panel */}
      {showSettings && (
        <View style={styles.settingsPanel}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddForm(true)}
            >
              <Ionicons name="add" size={16} color="#FFF" />
              <Text style={styles.buttonText}>新增科目</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={markAllAsPending}
            >
              <Ionicons name="refresh" size={16} color="#FFF" />
              <Text style={styles.buttonText}>一鍵設為未繳交</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.settingsInfo}>
            <Text style={styles.infoText}>• 可設定無期限作業</Text>
            <Text style={styles.infoText}>• 剩餘3天內每日提醒（全螢幕）</Text>
            <Text style={styles.infoText}>• 長按科目可編輯或刪除</Text>
          </View>
        </View>
      )}

      {/* Subject List */}
      <ScrollView style={styles.subjectList}>
        {subjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>尚未新增任何科目</Text>
            <Text style={styles.emptySubText}>點擊右上角齒輪來新增科目</Text>
          </View>
        ) : (
          subjects.map((subject) => {
            const config = statusConfig[subject.status];
            const timeRemaining = getTimeRemaining(subject.dueDate, subject.isNoLimit);
            
            return (
              <TouchableOpacity
                key={subject.id}
                style={[styles.subjectCard, { borderLeftColor: config.color }]}
                onLongPress={() => {
                  Alert.alert(
                    subject.name,
                    '選擇操作',
                    [
                      { text: '取消', style: 'cancel' },
                      { text: '編輯', onPress: () => setEditingSubject({...subject}) },
                      { text: '刪除', style: 'destructive', onPress: () => deleteSubject(subject.id) }
                    ]
                  );
                }}
              >
                <View style={styles.subjectHeader}>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                  <Ionicons name={config.icon} size={24} color={config.color} />
                </View>
                
                <View style={styles.subjectInfo}>
                  {subject.isNoLimit ? (
                    <View style={styles.infoRow}>
                      <Ionicons name="infinite" size={16} color={styles.infoText.color} />
                      <Text style={styles.infoText}>無期限</Text>
                    </View>
                  ) : (
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar" size={16} color={styles.infoText.color} />
                      <Text style={styles.infoText}>截止: {formatDateTime(subject.dueDate)}</Text>
                    </View>
                  )}
                  
                  {subject.status === 'submitted' && subject.submittedDate && (
                    <View style={styles.infoRow}>
                      <Ionicons name="checkmark" size={16} color="#10B981" />
                      <Text style={[styles.infoText, { color: '#10B981' }]}>
                        已交: {formatDateTime(subject.submittedDate)}
                      </Text>
                    </View>
                  )}
                </View>
                
                {/* Time remaining indicator */}
                {subject.status !== 'submitted' && !subject.isNoLimit && timeRemaining && (
                  <View style={styles.timeRemaining}>
                    <Text style={[
                      styles.timeRemainingText,
                      { color: timeRemaining.days <= 3 ? '#EF4444' : '#F59E0B' }
                    ]}>
                      {timeRemaining.type === 'hours' && `剩餘 ${timeRemaining.hours} 小時`}
                      {timeRemaining.type === 'days' && `剩餘 ${timeRemaining.days} 天`}
                      {timeRemaining.type === 'overdue' && `已過期 ${timeRemaining.days} 天`}
                    </Text>
                  </View>
                )}
                
                <View style={styles.statusButtons}>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      { backgroundColor: subject.status === 'submitted' ? '#10B981' : '#FFF' }
                    ]}
                    onPress={() => updateSubjectStatus(subject.id, 'submitted', new Date())}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      { color: subject.status === 'submitted' ? '#FFF' : '#10B981' }
                    ]}>
                      已繳交
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      { backgroundColor: subject.status === 'unknown' ? '#F59E0B' : '#FFF' }
                    ]}
                    onPress={() => updateSubjectStatus(subject.id, 'unknown')}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      { color: subject.status === 'unknown' ? '#FFF' : '#F59E0B' }
                    ]}>
                      未知
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      { backgroundColor: subject.status === 'pending' ? '#EF4444' : '#FFF' }
                    ]}
                    onPress={() => updateSubjectStatus(subject.id, 'pending')}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      { color: subject.status === 'pending' ? '#FFF' : '#EF4444' }
                    ]}>
                      未繳交
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Add/Edit Subject Modal */}
      <Modal
        visible={showAddForm || editingSubject !== null}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {showAddForm ? '新增科目' : '編輯科目'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="科目名稱"
              placeholderTextColor={darkMode ? '#9CA3AF' : '#6B7280'}
              value={showAddForm ? newSubject.name : editingSubject?.name || ''}
              onChangeText={(text) => {
                if (showAddForm) {
                  setNewSubject({...newSubject, name: text});
                } else {
                  setEditingSubject({...editingSubject, name: text});
                }
              }}
            />
            
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>無期限作業</Text>
              <Switch
                value={showAddForm ? newSubject.isNoLimit : editingSubject?.isNoLimit || false}
                onValueChange={(value) => {
                  if (showAddForm) {
                    setNewSubject({...newSubject, isNoLimit: value});
                  } else {
                    setEditingSubject({...editingSubject, isNoLimit: value});
                  }
                }}
              />
            </View>
            
            {!(showAddForm ? newSubject.isNoLimit : editingSubject?.isNoLimit) && (
              <>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => openDatePicker(showAddForm ? 'newDue' : 'editDue', 'datetime')}
                >
                  <Text style={styles.dateButtonText}>
                    繳交時間: {formatDateTime(showAddForm ? newSubject.dueDate : editingSubject?.dueDate || new Date())}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => openDatePicker(showAddForm ? 'newReminder' : 'editReminder', 'datetime')}
                >
                  <Text style={styles.dateButtonText}>
                    提醒時間: {formatDateTime(showAddForm ? newSubject.reminderDate : editingSubject?.reminderDate || new Date())}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  if (showAddForm) {
                    addSubject();
                  } else {
                    setSubjects(subjects.map(s => 
                      s.id === editingSubject.id ? editingSubject : s
                    ));
                    setEditingSubject(null);
                  }
                }}
              >
                <Text style={styles.buttonText}>確認</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddForm(false);
                  setEditingSubject(null);
                }}
              >
                <Text style={styles.buttonText}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Time Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode={datePickerMode}
          display="default"
          onChange={handleDateChange}
        />
      )}
    </SafeAreaView>
  );
};

const getStyles = (darkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkMode ? '#111827' : '#F3F4F6',
  },
  fullscreenModal: {
    flex: 1,
    backgroundColor: '#DC2626',
  },
  fullscreenContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reminderHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  reminderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginTop: 20,
  },
  reminderList: {
    flex: 1,
    width: '100%',
  },
  reminderItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  reminderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  reminderItemTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  reminderItemDue: {
    fontSize: 14,
    color: '#6B7280',
  },
  reminderButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  reminderButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: darkMode ? '#374151' : '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: darkMode ? '#F9FAFB' : '#1F2937',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: darkMode ? '#374151' : '#F3F4F6',
  },
  settingsPanel: {
    backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: darkMode ? '#374151' : '#E5E7EB',
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  settingsInfo: {
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    color: darkMode ? '#9CA3AF' : '#6B7280',
    marginBottom: 2,
  },
  subjectList: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: darkMode ? '#9CA3AF' : '#6B7280',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: darkMode ? '#6B7280' : '#9CA3AF',
  },
  subjectCard: {
    backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: darkMode ? '#F9FAFB' : '#1F2937',
  },
  subjectInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeRemaining: {
    marginBottom: 12,
  },
  timeRemainingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: darkMode ? '#F9FAFB' : '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: darkMode ? '#374151' : '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: darkMode ? '#F9FAFB' : '#1F2937',
    backgroundColor: darkMode ? '#374151' : '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: darkMode ? '#F9FAFB' : '#1F2937',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: darkMode ? '#374151' : '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: darkMode ? '#374151' : '#F9FAFB',
  },
  dateButtonText: {
    color: darkMode ? '#F9FAFB' : '#1F2937',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6B7280',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
});

export default HomeworkTracker;