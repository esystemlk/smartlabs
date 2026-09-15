import { useWindowDimensions, type ViewStyle } from 'react-native';
export function useAppLayout(maxWidth = 960) {
  const { width, height, fontScale } = useWindowDimensions();
  const gutter = width < 360 ? 16 : width < 600 ? 22 : 32;
  return { width, height, gutter, compact: width < 360 || fontScale > 1.25, wide: width >= 760 && fontScale <= 1.25,
    content: { width: '100%', maxWidth, alignSelf: 'center', paddingHorizontal: gutter } as ViewStyle };
}
