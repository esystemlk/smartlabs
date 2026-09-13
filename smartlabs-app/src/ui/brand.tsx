import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { C, GRADIENTS } from '@/theme';

/** SmartLabs wordmark. `variant` picks the asset tint context. */
export function Logo({ height = 40 }: { height?: number }) {
  return (
    <Image
      source={require('../../assets/logo.png')}
      style={{ height, width: height * 3.4 }}
      resizeMode="contain"
      accessibilityLabel="SmartLabs"
    />
  );
}

/** Full-width primary button with the brand gradient. */
export function GradientButton({
  label,
  onPress,
  loading,
  disabled,
  icon,
  style,
}: {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}) {
  const off = disabled || loading;
  return (
    <Pressable onPress={onPress} disabled={off} style={({ pressed }) => [{ opacity: off ? 0.55 : pressed ? 0.9 : 1 }, style]}>
      <LinearGradient colors={GRADIENTS.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.gBtn}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={s.gBtnRow}>
            {icon ? <Ionicons name={icon} size={18} color="#fff" /> : null}
            <Text style={s.gBtnText}>{label}</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

/** Secondary / outline button. */
export function OutlineButton({
  label,
  onPress,
  icon,
  color = C.blue,
  style,
}: {
  label: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.outline, { borderColor: color, opacity: pressed ? 0.85 : 1 }, style]}>
      {icon ? <Ionicons name={icon} size={17} color={color} /> : null}
      <Text style={[s.outlineText, { color }]}>{label}</Text>
    </Pressable>
  );
}

/** Labeled input with a leading icon and optional password reveal. */
export function AuthField({
  label,
  icon,
  password,
  style,
  ...rest
}: TextInputProps & { label?: string; icon?: keyof typeof Ionicons.glyphMap; password?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ gap: 7 }}>
      {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
      <View style={s.fieldBox}>
        {icon ? <Ionicons name={icon} size={18} color={C.slateLight} /> : null}
        <TextInput
          placeholderTextColor={C.faint}
          secureTextEntry={password && !show}
          style={[s.fieldInput, style]}
          {...rest}
        />
        {password ? (
          <Pressable onPress={() => setShow((v) => !v)} hitSlop={10}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={19} color={C.slateLight} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** Rounded card container. */
export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

/** Thin progress bar. */
export function ProgressBar({ pct, color = C.blue, track = C.track, height = 8 }: { pct: number; color?: string; track?: string; height?: number }) {
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden', flex: 1 }}>
      <View style={{ height, borderRadius: height / 2, backgroundColor: color, width: `${Math.max(2, Math.min(100, pct))}%` }} />
    </View>
  );
}

/** Circular score ring (SVG). Shows `value` centered, out of `max`. */
export function ScoreRing({
  value,
  max = 90,
  size = 92,
  stroke = 9,
  color = C.blue,
  track = '#E4EBF5',
  label,
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={circ * (1 - pct)}
        />
      </Svg>
      <Text style={{ fontSize: size * 0.3, fontWeight: '800', color: C.navy }}>{value}</Text>
      {label ? <Text style={{ fontSize: 11, color: C.slateLight, fontWeight: '600' }}>{label}</Text> : null}
    </View>
  );
}

/** Pushed-screen header row: back chevron + centered title. */
export function ScreenHeader({
  title,
  right,
  onBack,
}: {
  title?: string;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  const router = useRouter();
  const back = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/(tabs)')));
  return (
    <View style={s.header}>
      <Pressable onPress={back} hitSlop={12} style={s.backBtn}>
        <Ionicons name="chevron-back" size={22} color={C.navy} />
      </Pressable>
      <Text style={s.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={s.headerRight}>{right ?? <View style={{ width: 38 }} />}</View>
    </View>
  );
}

const s = StyleSheet.create({
  gBtn: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  gBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  outline: {
    height: 50, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, backgroundColor: '#fff',
  },
  outlineText: { fontSize: 15, fontWeight: '700' },
  card: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 18 },
  fieldLabel: { color: C.slate, fontSize: 13, fontWeight: '700' },
  fieldBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10, height: 54, borderRadius: 14,
    borderWidth: 1, borderColor: C.borderStrong, backgroundColor: '#fff', paddingHorizontal: 14,
  },
  fieldInput: { flex: 1, fontSize: 15, color: C.navy, height: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 48, marginBottom: 6 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: C.navy },
  headerRight: { minWidth: 38, alignItems: 'flex-end' },
});
