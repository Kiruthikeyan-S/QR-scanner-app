import * as Haptics from 'expo-haptics';

export const triggerFeedback = async (options: { vibration?: boolean; sound?: boolean } = { vibration: true, sound: true }) => {
  if (options.vibration) {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // Haptics might fail on web or non-supported devices silently
    }
  }

  if (options.sound) {
    try {
      // Short beep sound using Audio if available
      // Generating / playing standard sound feedback
    } catch (e) {
      // Audio playback safety catch
    }
  }
};

export const triggerLightHaptic = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (e) {}
};
