import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';

const TABS = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'map', label: 'Map', icon: 'map' },
  { key: 'services', label: 'Services', icon: 'apps' },
  { key: 'profile', label: 'Profile', icon: 'person' },
];

export default function BottomTabBar({ activeTab, onTabPress }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Pressable key={tab.key} style={styles.item} onPress={() => onTabPress(tab.key)}>
              <MaterialIcons
                name={tab.icon}
                size={26}
                color={isActive ? colors.halifaxBlue : colors.muted}
              />
              <Text style={[styles.label, isActive ? styles.active : styles.inactive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 58,
    paddingBottom: 2,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    minWidth: 70,
  },
  label: {
    fontSize: 11,
  },
  active: {
    color: colors.halifaxBlue,
    fontWeight: '700',
  },
  inactive: {
    color: colors.muted,
    fontWeight: '500',
  },
});
