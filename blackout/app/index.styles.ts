import { BlackoutColors as C } from '@/constants/theme';
import { Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PADDING = Math.max(24, Math.min(48, SCREEN_WIDTH * 0.06));
const TITLE_FONT_SIZE = Math.round(Math.max(40, Math.min(64, SCREEN_WIDTH * 0.12)));

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },
  container: {
    flex: 1,
    paddingHorizontal: H_PADDING,
    paddingTop: 80,
    paddingBottom: 48,
    justifyContent: 'space-between',
  },
  hero: { alignItems: 'center' },
  title: {
    fontFamily: 'Archivo_900Black',
    fontSize: TITLE_FONT_SIZE,
    marginBottom: 8,
    textAlign: 'center',
    color: C.text,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: C.textMuted,
  },
  actions: { gap: 16, width: '100%' },
  primaryButton: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.text,
    width: '100%',
  },
  secondaryButton: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    width: '100%',
  },
  buttonPressed: { opacity: 0.8 },
  primaryButtonText: { fontSize: 18, fontWeight: '600', color: C.background },
  secondaryButtonText: { fontSize: 18, fontWeight: '500', color: C.textMuted },
  appSelectionLink: {
    marginTop: 16,
    paddingVertical: 12,
  },
  appSelectionLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: C.textMuted,
  },
});
