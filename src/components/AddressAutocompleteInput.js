import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../constants/theme';
import { fetchAddressSuggestions } from '../services/googlePlaces';

function generateSessionToken() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export default function AddressAutocompleteInput({ label, placeholder, value, onSelect, onClear }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isSelected, setIsSelected] = useState(Boolean(value));
  const sessionToken = useRef(generateSessionToken());
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (value !== query) {
      setQuery(value || '');
      setIsSelected(Boolean(value));
      setSuggestions([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    return () => clearTimeout(debounceTimer.current);
  }, []);

  const handleChangeText = (text) => {
    setQuery(text);
    setIsSelected(false);
    onClear();

    clearTimeout(debounceTimer.current);

    if (text.length < 2) {
      setSuggestions([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await fetchAddressSuggestions(text, sessionToken.current);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  };

  const handleSelect = (description) => {
    setQuery(description);
    setIsSelected(true);
    setSuggestions([]);
    sessionToken.current = generateSessionToken();
    Keyboard.dismiss();
    onSelect(description);
  };

  const handleClear = () => {
    setQuery('');
    setIsSelected(false);
    setSuggestions([]);
    clearTimeout(debounceTimer.current);
    Keyboard.dismiss();
    onClear();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, query.length > 0 && styles.inputWithClear]}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={handleChangeText}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {query.length > 0 ? (
          <Pressable style={styles.clearButton} onPress={handleClear} hitSlop={8}>
            <MaterialIcons name="close" size={16} color={colors.muted} />
          </Pressable>
        ) : null}
        {suggestions.length > 0 && !isSelected ? (
          <View style={styles.dropdown}>
            {suggestions.slice(0, 5).map((item, index) => (
              <Pressable
                key={item.placeId}
                style={({ pressed }) => [
                  styles.suggestion,
                  index < Math.min(suggestions.length, 5) - 1 && styles.suggestionBorder,
                  pressed && styles.suggestionPressed,
                ]}
                onPress={() => handleSelect(item.description)}
              >
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {item.description}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    zIndex: 999,
  },
  label: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '600',
  },
  inputWrap: {
    position: 'relative',
    zIndex: 999,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingVertical: 14,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 16,
  },
  inputWithClear: {
    paddingRight: 44,
  },
  clearButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    maxHeight: 220,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    zIndex: 999,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  suggestion: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionPressed: {
    backgroundColor: colors.background,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});
