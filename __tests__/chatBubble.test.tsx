import { render } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ChatBubble } from '@/components/ChatBubble';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { themes } from '@/theme/tokens';
import type { Message } from '@/types';

const mockMarkdownProps: Array<{ children?: ReactNode; style?: unknown }> = [];

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
}));

jest.mock('react-native-markdown-display', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    __esModule: true,
    default: (props: { children?: ReactNode; style?: unknown }) => {
      mockMarkdownProps.push(props);
      return React.createElement(Text, null, props.children);
    },
  };
});

const assistantMessage: Message = {
  id: 'm1',
  role: 'assistant',
  content: 'สวัสดีค่ะ',
  createdAt: 0,
  status: 'done',
};

describe('ChatBubble', () => {
  test('passes the dark theme text color to the markdown renderer', async () => {
    mockMarkdownProps.length = 0;

    await render(
      <ThemeProvider mode="dark">
        <ChatBubble message={assistantMessage} />
      </ThemeProvider>
    );

    expect(mockMarkdownProps).toHaveLength(1);

    const style = mockMarkdownProps[0].style as {
      body?: { color?: string };
    };

    expect(Array.isArray(style)).toBe(false);
    expect(style.body?.color).toBe(themes.dark.text);
  });
});
