import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { theme } from '@/theme';

export function Button({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
}) {
  const isDisabled = disabled || loading;
  const bg =
    variant === 'primary' ? theme.colors.accent : variant === 'danger' ? theme.colors.danger : 'transparent';
  const fg = variant === 'primary' ? theme.colors.onAccent : variant === 'danger' ? '#fff' : theme.colors.accent;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === 'ghost' && styles.btnGhost,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.btnLabel, { color: fg }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label?: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={theme.colors.textFaint}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Pill({ text, color }: { text: string; color?: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: (color ?? theme.colors.accent) + '22' }]}>
      <Text style={[styles.pillText, { color: color ?? theme.colors.accent }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  btnGhost: { borderWidth: 1, borderColor: theme.colors.accent },
  btnLabel: { fontSize: 16, fontWeight: '700' },
  fieldLabel: { color: theme.colors.textMuted, fontSize: theme.font.small, fontWeight: '600' },
  input: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 18,
  },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.pill },
  pillText: { fontSize: theme.font.tiny, fontWeight: '700' },
});
