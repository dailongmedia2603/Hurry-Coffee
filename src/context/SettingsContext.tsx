import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '@/src/integrations/supabase/client';

// Định nghĩa cấu trúc của các cài đặt
interface AppSettings {
  feature_profile_enabled: boolean;
}

// Định nghĩa những gì Context sẽ cung cấp
interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Hook tùy chỉnh để dễ dàng sử dụng context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Provider component: chịu trách nhiệm tải và cung cấp dữ liệu
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  // Mặc định bật tính năng để tránh lỗi nếu không tải được cài đặt
  const [settings, setSettings] = useState<AppSettings>({
    feature_profile_enabled: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('key, value');

        if (error) throw error;

        if (data) {
          // Chuyển đổi mảng dữ liệu từ DB thành một object dễ sử dụng
          const settingsMap = new Map(data.map(s => [s.key, s.value]));
          
          const newSettings: AppSettings = {
            feature_profile_enabled: settingsMap.get('feature_profile_enabled') === 'true',
          };
          setSettings(newSettings);
        }
      } catch (error) {
        console.error('Error fetching app settings:', error);
        // Nếu có lỗi, vẫn sử dụng cài đặt mặc định đã định nghĩa ở trên
      } finally {
        setLoading(false);
      }
    };

    fetchAppSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};