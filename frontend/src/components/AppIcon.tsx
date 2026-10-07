import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

export type IconName =
  | 'home'
  | 'home-outline'
  | 'history'
  | 'time'
  | 'time-outline'
  | 'saved'
  | 'bookmark'
  | 'bookmark-outline'
  | 'settings'
  | 'settings-outline'
  | 'camera'
  | 'scan'
  | 'scan-outline'
  | 'qr-code'
  | 'qr-code-outline'
  | 'wifi'
  | 'wifi-outline'
  | 'wifi-off'
  | 'globe'
  | 'globe-outline'
  | 'person'
  | 'person-outline'
  | 'mail'
  | 'mail-outline'
  | 'call'
  | 'call-outline'
  | 'location'
  | 'location-outline'
  | 'chatbubble'
  | 'chatbubble-outline'
  | 'chatbubble-ellipses-outline'
  | 'flash'
  | 'flash-outline'
  | 'images'
  | 'images-outline'
  | 'copy'
  | 'copy-outline'
  | 'share'
  | 'share-social-outline'
  | 'trash'
  | 'trash-outline'
  | 'shield-checkmark'
  | 'shield-checkmark-outline'
  | 'alert-circle'
  | 'cloud-offline-outline'
  | 'refresh-outline'
  | 'close'
  | 'add'
  | 'bell'
  | 'bell-outline'
  | 'notifications'
  | 'notifications-outline'
  | 'checkmark-circle'
  | 'information-circle';

interface AppIconProps {
  name: IconName | string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 22,
  color = '#059669',
  style,
}) => {
  // Direct SVG Fallbacks for core icons to guarantee 100% crisp vector rendering
  switch (name) {
    case 'home':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <Path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </Svg>
        </View>
      );
    case 'home-outline':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <Path d="M9 22V12h6v10" />
          </Svg>
        </View>
      );

    case 'history':
    case 'time':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <Path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z" />
          </Svg>
        </View>
      );
    case 'time-outline':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="12" cy="12" r="10" />
            <Path d="M12 6v6l4 2" />
          </Svg>
        </View>
      );

    case 'saved':
    case 'bookmark':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </Svg>
        </View>
      );
    case 'bookmark-outline':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </Svg>
        </View>
      );

    case 'settings':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <Path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </Svg>
        </View>
      );
    case 'settings-outline':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="12" cy="12" r="3" />
            <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </Svg>
        </View>
      );

    case 'bell':
    case 'notifications':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <Path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
          </Svg>
        </View>
      );
    case 'bell-outline':
    case 'notifications-outline':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </Svg>
        </View>
      );

    case 'qr-code':
    case 'qr-code-outline':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <Rect x="3" y="3" width="7" height="7" rx="1.5" />
            <Rect x="14" y="3" width="7" height="7" rx="1.5" />
            <Rect x="3" y="14" width="7" height="7" rx="1.5" />
            <Rect x="14" y="14" width="3" height="3" rx="0.5" />
            <Rect x="18" y="14" width="3" height="3" rx="0.5" />
            <Rect x="14" y="18" width="3" height="3" rx="0.5" />
            <Rect x="18" y="18" width="3" height="3" rx="0.5" />
          </Svg>
        </View>
      );

    case 'wifi':
    case 'wifi-outline':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <Path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <Path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <Circle cx="12" cy="20" r="1" fill={color} />
          </Svg>
        </View>
      );

    case 'wifi-off':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M1 1l22 22" />
            <Path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <Path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <Path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <Path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <Path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <Circle cx="12" cy="20" r="1" fill={color} />
          </Svg>
        </View>
      );

    case 'camera':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <Circle cx="12" cy="13" r="4" />
          </Svg>
        </View>
      );

    case 'globe':
    case 'globe-outline':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="12" cy="12" r="10" />
            <Path d="M2 12h20" />
            <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </Svg>
        </View>
      );

    case 'person':
    case 'person-outline':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <Circle cx="12" cy="7" r="4" />
          </Svg>
        </View>
      );

    default:
      return (
        <Ionicons
          name={name as any}
          size={size}
          color={color}
          style={style}
        />
      );
  }
};
