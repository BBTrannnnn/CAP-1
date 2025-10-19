import React, { useState } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { Stack, Link } from "expo-router";
export default function AddHabitModal() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHabit, setSelectedHabit] = useState(null);

  const categories = {
    'Sức khỏe': [
      { icon: '🏃', name: 'Ăn uống lành mạnh', category: 'Healthy', color: '#10b981' },
      { icon: '⭐', name: 'Tập thể dục', category: 'Fitness', color: '#f97316' },
      { icon: '💧', name: 'Uống nước đủ', category: 'Health', color: '#a78bfa' }
    ],
    'Tinh thần': [
      { icon: '💗', name: 'Thiền định', category: 'Mindful', color: '#ec4899' },
      { icon: '📖', name: 'Viết nhật ký', category: 'Mindful', color: '#8b5cf6' },
      { icon: '📚', name: 'Đọc sách', category: 'Learning', color: '#10b981' },
      { icon: '🧘', name: 'Cảm ơn', category: 'Mindful', color: '#f59e0b' },
      { icon: '✨', name: 'Học ngoại ngữ', category: 'Learning', color: '#a78bfa' }
    ],
    'Kiểm soát': [
      { icon: '🚭', name: 'Không hút thuốc', category: 'Control', color: '#9ca3af' },
      { icon: '🍷', name: 'Không uống rượu', category: 'Control', color: '#ec4899' },
      { icon: '☕', name: 'Ít coffee', category: 'Control', color: '#f97316' },
      { icon: '💰', name: 'Tiết kiệm tiền', category: 'Finance', color: '#10b981' },
      { icon: '📱', name: 'Không xem điện thoại trước khi ngủ', category: 'Control', color: '#6b7280' }
    ]
  };

  const filteredCategories = {};
  Object.keys(categories).forEach(cat => {
    const filtered = categories[cat].filter(habit => 
      habit.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      filteredCategories[cat] = filtered;
    }
  });

  return (
    <>
    <Stack.Screen options={{ tabBarStyle: { display: 'none' } }} />
    <div style={{
      width: '100%',
      maxWidth: '400px',
      height: '100vh',
      backgroundColor: 'white',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e5e5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Tạo thói quen mới</h2>
        <Link href="/(tabs)/habits">
        <button style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          color: '#666',
          transition: 'color 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.color = '#2563eb'}
        onMouseOut={(e) => e.currentTarget.style.color = '#666'}>
          <X size={24} />
        </button>
        </Link>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#f5f5f5',
          padding: '10px 12px',
          borderRadius: '8px',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#efefef';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#f5f5f5';
        }}>
          <Search size={18} color="#999" />
          <input
            type="text"
            placeholder="Tìm kiếm thói quen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              backgroundColor: 'transparent',
              outline: 'none',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '0 16px'
      }}>
        {Object.keys(filteredCategories).length > 0 ? (
          Object.keys(filteredCategories).map((categoryName) => (
            <div key={categoryName} style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#666',
                marginBottom: '12px'
              }}>
                {categoryName}
              </h3>
              {filteredCategories[categoryName].map((habit, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedHabit(`${categoryName}-${index}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderBottom: '1px solid #f5f5f5',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    backgroundColor: selectedHabit === `${categoryName}-${index}` ? '#f0fdf4' : 'transparent',
                    transition: 'all 0.2s',
                    marginBottom: '4px'
                  }}
                  onMouseOver={(e) => {
                    if (selectedHabit !== `${categoryName}-${index}`) {
                      e.currentTarget.style.backgroundColor = '#f9f9f9';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedHabit !== `${categoryName}-${index}`) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: `${habit.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0
                  }}>
                    {habit.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '2px' }}>
                      {habit.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {habit.category}
                    </div>
                  </div>
                  {selectedHabit === `${categoryName}-${index}` && (
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: '#999',
            fontSize: '14px'
          }}>
            Không tìm thấy thói quen
          </div>
        )}
      </div>

      {/* Bottom Button */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e5e5e5',
        display: 'flex',
        gap: '8px'
      }}>
        <Link href="/(tabs)/habits" style={{
          flex: 1,
          padding: '12px',
          backgroundColor: '#f5f5f5',
          border: 'none',
          borderRadius: '8px',
          color: '#666',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s',
          textAlign:'center'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e5e5'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
        onClick={() => setSelectedHabit(null)}>
          Hủy
        </Link>
        <Link href="/(tabs)/habits/CreateHabitDetail" style={{
          flex: 1,
          padding: '12px',
          backgroundColor: selectedHabit ? '#2563eb' : '#d1d5db',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          fontSize: '14px',
          fontWeight: '500',
          cursor: selectedHabit ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
          textAlign:'center'
        }}
        onMouseOver={(e) => {
          if (selectedHabit) {
            e.currentTarget.style.backgroundColor = '#1d4ed8';
          }
        }}
        onMouseOut={(e) => {
          if (selectedHabit) {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }
        }}>
          Tiếp tục
        </Link>
      </div>

      {/* Custom Habit Button */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e5e5e5'
      }}>
        <Link href="/(tabs)/habits/CreateHabitDetail">
        <button style={{
          width: '100%',
          padding: '12px',
          backgroundColor: 'transparent',
          border: '2px dashed #2563eb',
          borderRadius: '8px',
          color: '#2563eb',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#eff6ff';
          e.currentTarget.style.borderColor = '#1d4ed8';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = '#2563eb';
        }}>
          <Plus size={18} />
          Tạo thói quen tùy chỉnh
        </button>
        </Link>
      </div>
    </div>
    </>
  );
}