/**
 * FloatingActionBar Component
 *
 * A floating action bar that appears at the bottom of the screen.
 * Used for action buttons like edit, delete, etc. in detail pages.
 */

import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface FloatingAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'danger' | 'primary';
}

interface FloatingActionBarProps {
  actions: FloatingAction[];
}

export function FloatingActionBar({ actions }: FloatingActionBarProps) {
  const insets = useSafeAreaInsets();

  const getVariantStyles = (variant: FloatingAction['variant'] = 'default') => {
    switch (variant) {
      case 'danger':
        return {
          bg: 'bg-red-50 dark:bg-red-900/30',
          text: 'text-red-600 dark:text-red-400',
          iconColor: '#DC2626',
        };
      case 'primary':
        return {
          bg: 'bg-blue-600',
          text: 'text-white',
          iconColor: '#FFFFFF',
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-700',
          text: 'text-gray-700 dark:text-gray-300',
          iconColor: '#374151',
        };
    }
  };

  return (
    <View
      className="absolute left-4 right-4 flex-row gap-3"
      style={{
        bottom: insets.bottom + 16,
      }}
    >
      {actions.map((action, index) => {
        const styles = getVariantStyles(action.variant);
        const iconColor = action.color || styles.iconColor;

        return (
          <TouchableOpacity
            key={index}
            onPress={action.onPress}
            disabled={action.disabled || action.loading}
            className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-xl ${styles.bg}`}
            style={{
              opacity: action.disabled ? 0.5 : 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
            }}
            activeOpacity={0.7}
          >
            {action.loading ? (
              <ActivityIndicator size="small" color={iconColor} />
            ) : (
              <Ionicons name={action.icon} size={20} color={iconColor} />
            )}
            <Text className={`ml-2 font-semibold ${styles.text}`}>
              {action.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
