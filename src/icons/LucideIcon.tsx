import { type LucideProps } from 'lucide-react';
import { type ComponentType } from 'react';

export interface IconEntry {
  name: string;
  component: ComponentType<LucideProps>;
  descriptionEs: string;
  descriptionEn: string;
  keywordsEs: string;
  keywordsEn: string;
}

export interface LucideIconProps extends LucideProps {
  icon: ComponentType<LucideProps>;
}

export function LucideIcon({ icon: Icon, size = 24, color = '#111827', strokeWidth = 1.5, ...rest }: LucideIconProps) {
  return <Icon size={size} color={color} strokeWidth={strokeWidth} {...rest} />;
}
