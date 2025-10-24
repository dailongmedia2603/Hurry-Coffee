import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Ionicons } from '@expo/vector-icons';
import { vi } from 'date-fns/locale/vi';

// Đăng ký ngôn ngữ tiếng Việt
registerLocale('vi', vi);

// Tùy chỉnh giao diện cho react-datepicker để phù hợp với ứng dụng
const customDatePickerStyles = `
  .react-datepicker {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  .react-datepicker__header {
    background-color: #73509c;
    border-bottom: none;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }
  .react-datepicker__current-month,
  .react-datepicker-time__header,
  .react-datepicker-year-header {
    color: #fff;
    font-weight: bold;
  }
  .react-datepicker__day-name,
  .react-datepicker__day,
  .react-datepicker__time-name {
    color: #333;
  }
  .react-datepicker__navigation-icon::before {
    border-color: #fff;
  }
  .react-datepicker__day--selected,
  .react-datepicker__day--in-selecting-range,
  .react-datepicker__day--in-range,
  .react-datepicker__month-text--selected,
  .react-datepicker__month-text--in-selecting-range,
  .react-datepicker__month-text--in-range {
    background-color: #73509c;
    color: #fff;
  }
  .react-datepicker__day:hover {
    background-color: #f0eaf8;
  }
  .react-datepicker__day--keyboard-selected {
    background-color: #a489c8;
  }
`;

type WebDatePickerProps = {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (dates: [Date | null, Date | null]) => void;
};

const WebDatePicker = ({ startDate, endDate, onChange }: WebDatePickerProps) => {
  const CustomInput = React.forwardRef<any, { value?: string; onClick?: () => void }>(
    ({ value, onClick }, ref) => {
      const formatDateShort = (date: Date | null) => {
        if (!date) return '';
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}`;
      };
      
      let displayText = 'Chọn ngày';
      if (startDate && !endDate) {
        displayText = `${formatDateShort(startDate)} - ...`;
      } else if (startDate && endDate) {
        if (startDate.getFullYear() !== endDate.getFullYear()) {
            const startYear = startDate.getFullYear().toString().slice(-2);
            const endYear = endDate.getFullYear().toString().slice(-2);
            displayText = `${formatDateShort(startDate)}/${startYear} - ${formatDateShort(endDate)}/${endYear}`;
        } else {
            displayText = `${formatDateShort(startDate)} - ${formatDateShort(endDate)}`;
        }
      }

      return (
        <TouchableOpacity style={styles.datePickerButton} onPress={onClick} ref={ref}>
          <Ionicons name="calendar-outline" size={20} color="#666" />
          <Text style={styles.datePickerButtonText} numberOfLines={1}>
            {displayText}
          </Text>
        </TouchableOpacity>
      );
    }
  );

  return (
    <View>
      <style>{customDatePickerStyles}</style>
      <DatePicker
        startDate={startDate}
        endDate={endDate}
        onChange={onChange}
        selectsRange
        customInput={<CustomInput />}
        dateFormat="dd/MM/yyyy"
        popperPlacement="bottom-start"
        locale="vi"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 12,
  },
  datePickerButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
    flex: 1,
    minWidth: 0,
  },
});

export default WebDatePicker;