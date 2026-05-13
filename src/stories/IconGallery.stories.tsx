import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconShowcase } from '../showcase/IconShowcase';

const meta = {
  title: 'Icons/Gallery',
  component: IconShowcase,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Showcase de iconos Lucide sincronizado con la app Vite. Source of truth: `svgs/` + `iconRegistry`.',
      },
    },
  },
} satisfies Meta<typeof IconShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  name: 'Showcase sincronizado',
};
