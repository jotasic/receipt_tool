/**
 * FloatingActionBar Component
 *
 * A floating action bar that appears at the bottom-right of the screen.
 * Always renders as circular FAB-style buttons, vertically stacked.
 */

import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';

export interface FloatingAction {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'danger' | 'primary';
}

interface FloatingActionBarProps {
  actions: FloatingAction[];
}

export function FloatingActionBar({ actions }: FloatingActionBarProps) {
  const defaultIconColor = useThemeColor('#374151', '#D1D5DB');
  const dangerIconColor = useThemeColor('#DC2626', '#F87171');

  const getVariantStyles = (variant: FloatingAction['variant'] = 'default') => {
    switch (variant) {
      case 'danger':
        return {
          bg: 'bg-red-50 dark:bg-red-900/30',
          iconColor: dangerIconColor,
        };
      case 'primary':
        return {
          bg: 'bg-blue-600',
          iconColor: '#FFFFFF',
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-700',
          iconColor: defaultIconColor,
        };
    }
  };

  return (
    <View
      className="absolute right-4 flex-col-reverse gap-3"
      style={{
        bottom: 16,
      }}
    >
      {actions.map((action, index) => {
        const styles = getVariantStyles(action.variant);
        const iconColor = styles.iconColor;

        return (
          <TouchableOpacity
            key={index}
            onPress={action.onPress}
            disabled={action.disabled || action.loading}
            className={`w-16 h-16 rounded-full items-center justify-center ${styles.bg}`}
            style={{
              opacity: action.disabled ? 0.5 : 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            }}
            activeOpacity={0.7}
          >
            {action.loading ? (
              <ActivityIndicator size="small" color={iconColor} />
            ) : (
              <Ionicons name={action.icon} size={28} color={iconColor} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
