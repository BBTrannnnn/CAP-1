import React from 'react';
import { ChevronLeft, Flame, Calendar, TrendingUp } from 'lucide-react';
import { Link, Stack } from "expo-router";
export default function HabitStreak() {
  const [selectedHabit, setSelectedHabit] = React.useState(1);
  const [currentDate, setCurrentDate] = React.useState(new Date(2025, 9, 17)); // October 17, 2025

  const habits = [
    {
      id: 1,
      title: 'Thiền 10 phút',
      tag: 'Mindful',
      tagColor: '#10b981',
      streak: 12,
      bestStreak: 25,
      stats: {
        completed: 24,
        failed: 3,
        skipped: 2,
        total: 29
      },
      completedDates: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 17], // Day of month
      failedDates: [6, 13, 16],
      skippedDates: [7, 14]
    },
    {
      id: 2,
      title: 'Đi bộ 30 phút',
      tag: 'Energy',
      tagColor: '#10b981',
      streak: 5,
      bestStreak: 18,
      stats: {
        completed: 18,
        failed: 5,
        skipped: 6,
        total: 29
      },
      completedDates: [1, 2, 4, 5, 8, 10, 11, 12, 15, 16, 17],
      failedDates: [3, 6, 9, 13, 14],
      skippedDates: [7, 12, 18, 19, 20]
    },
    {
      id: 3,
      title: 'Ngủ đúng giờ',
      tag: 'Sleep',
      tagColor: '#10b981',
      streak: 20,
      bestStreak: 20,
      stats: {
        completed: 26,
        failed: 1,
        skipped: 2,
        total: 29
      },
      completedDates: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17],
      failedDates: [14],
      skippedDates: [18, 19]
    }
  ];

  const habit = habits.find(h => h.id === selectedHabit);

  // Get calendar days for current month
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const calendarDays = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  // Add days of month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const getStatusForDay = (day) => {
    if (!day) return null;
    if (habit.completedDates.includes(day)) return 'completed';
    if (habit.failedDates.includes(day)) return 'failed';
    if (habit.skippedDates.includes(day)) return 'skipped';
    return 'none';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return habit.tagColor;
      case 'failed':
        return '#ef4444';
      case 'skipped':
        return '#f59e0b';
      default:
        return '#e5e5e5';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'failed':
        return '✗';
      case 'skipped':
        return '-';
      default:
        return '';
    }
  };

  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <>
    <Stack.Screen options={{ tabBarStyle: { display: 'none' } }} />
    
    <div style={{
      width: '100%',
      height: '100vh',
      overflow: 'auto',
      backgroundColor: '#fff',
      color: '#333'
    }}>
      <div style={{
        maxWidth: '400px',
        margin: '0 auto',
        paddingBottom: '20px'
      }}>
        
        {/* Header */}
        <div style={{
          backgroundColor: '#fff',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid #f0f0f0',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <Link href="/(tabs)/habits">
          <ChevronLeft size={24} style={{ cursor: 'pointer' }} />
          </Link>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>Chuỗi Thành Công</div>
            <div style={{ fontSize: '12px', color: '#999' }}>Theo dõi chuỗi ngày liên tiếp</div>
          </div>
        </div>

        {/* Habit Selector */}
        <div style={{
          backgroundColor: '#fff',
          padding: '16px',
          margin: '8px 0',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          borderBottom: '1px solid #f0f0f0'
        }}>
          {habits.map((h) => (
            <button
              key={h.id}
              onClick={() => setSelectedHabit(h.id)}
              style={{
                padding: '8px 12px',
                border: selectedHabit === h.id ? `2px solid ${h.tagColor}` : '1px solid #e5e5e5',
                backgroundColor: selectedHabit === h.id ? `${h.tagColor}08` : '#fff',
                borderRadius: '8px',
                color: selectedHabit === h.id ? h.tagColor : '#999',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {h.title}
            </button>
          ))}
        </div>

        {habit && (
          <>
            {/* Main Streak Card */}
            <div style={{
              backgroundColor: '#fff',
              padding: '24px',
              margin: '8px 0',
              borderRadius: '12px',
              textAlign: 'center',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <Flame size={32} color={habit.tagColor} fill={habit.tagColor} />
                <div style={{
                  fontSize: '48px',
                  fontWeight: '700',
                  color: habit.tagColor
                }}>
                  {habit.streak}
                </div>
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                Chuỗi Hiện Tại
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
                Chuỗi tốt nhất: {habit.bestStreak} ngày
              </div>

              {/* Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px'
              }}>
                <div style={{
                  backgroundColor: 'transparent',
                  padding: '12px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>
                    Hoàn Thành
                  </div>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#10b981'
                  }}>
                    {habit.stats.completed}
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'transparent',
                  padding: '12px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>
                    Thất Bại
                  </div>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#ef4444'
                  }}>
                    {habit.stats.failed}
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'transparent',
                  padding: '12px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>
                    Bỏ Qua
                  </div>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#f59e0b'
                  }}>
                    {habit.stats.skipped}
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'transparent',
                  padding: '12px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>
                    Tổng
                  </div>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#6b7280'
                  }}>
                    {habit.stats.total}
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar View */}
            <div style={{
              backgroundColor: '#fff',
              padding: '16px',
              margin: '8px 0',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={16} />
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                    style={{
                      width: '32px',
                      height: '32px',
                      border: '1px solid #e5e5e5',
                      borderRadius: '6px',
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: '#666'
                    }}>←</button>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                    style={{
                      width: '32px',
                      height: '32px',
                      border: '1px solid #e5e5e5',
                      borderRadius: '6px',
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: '#666'
                    }}>→</button>
                </div>
              </div>

              {/* Day headers */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '4px',
                marginBottom: '8px'
              }}>
                {dayNames.map((day) => (
                  <div key={day} style={{
                    textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#999',
                    padding: '4px'
                  }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '4px',
                marginBottom: '16px'
              }}>
                {calendarDays.map((day, idx) => {
                  const status = getStatusForDay(day);
                  const color = getStatusColor(status);
                  const label = getStatusLabel(status);

                  return (
                    <div
                      key={idx}
                      title={day && `${day} ${monthNames[currentDate.getMonth()]}`}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: '50%',
                        backgroundColor: day ? (status === 'none' ? '#f5f5f5' : color) : 'transparent',
                        boxShadow: day && status !== 'none' ? '0 2px 6px rgba(0, 0, 0, 0.15)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: day ? '12px' : '0',
                        fontWeight: '600',
                        color: day ? (status === 'none' ? '#999' : 'white') : 'transparent',
                        cursor: day ? 'pointer' : 'default',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        if (day) e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseOut={(e) => {
                        if (day) e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {day && (
                        <div>
                          <div style={{ fontSize: '14px' }}>{label}</div>
                          <div style={{ fontSize: '10px', marginTop: '2px' }}>{day}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{
                backgroundColor: '#f9f9f9',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '12px'
              }}>
                <div style={{ marginBottom: '4px', color: '#10b981', fontWeight: '600' }}>✓ = Hoàn thành</div>
                <div style={{ marginBottom: '4px', color: '#ef4444', fontWeight: '600' }}>✗ = Thất bại</div>
                <div style={{ marginBottom: '4px', color: '#f59e0b', fontWeight: '600' }}>- = Bỏ qua</div>
                <div style={{ color: '#999', fontWeight: '600' }}>Trắng = Chưa ghi nhận</div>
              </div>
            </div>

            {/* Statistics Summary */}
            <div style={{
              backgroundColor: 'white',
              padding: '16px',
              margin: '8px 0'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <TrendingUp size={16} />
                Thống Kê Tổng
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px'
              }}>
                <div style={{
                  backgroundColor: 'transparent',
                  padding: '12px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                    Tỷ Lệ Hoàn Thành
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                    {Math.round((habit.stats.completed / habit.stats.total) * 100)}%
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'transparent',
                  padding: '12px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                    Tỷ Lệ Thất Bại
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#ef4444' }}>
                    {Math.round((habit.stats.failed / habit.stats.total) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
}