import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = theme.colors.primaryText,
}) => {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
};
