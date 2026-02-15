import { View } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <View
      className={`
        bg-white dark:bg-gray-800
        rounded-lg
        shadow-md
        p-4
        border border-gray-100 dark:border-gray-700
        ${className}
      `}
      style={{
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
      }}
    >
      {children}
    </View>
  );
}
