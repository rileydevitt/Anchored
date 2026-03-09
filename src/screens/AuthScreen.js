import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing } from '../constants/theme';

export default function AuthScreen({ mode, setMode, onSubmit }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRegister = mode === 'register';
  const canContinue = useMemo(() => {
    if (!email.trim() || !password.trim()) {
      return false;
    }
    if (isRegister && !fullName.trim()) {
      return false;
    }
    return true;
  }, [email, password, fullName, isRegister]);

  useEffect(() => {
    setError('');
  }, [mode]);

  const submit = async () => {
    if (!canContinue) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit({
        mode,
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });
    } catch (submitError) {
      setError(submitError.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.brandRow}>
        <MaterialCommunityIcons name="anchor" size={30} color={colors.halifaxBlue} />
        <Text style={styles.brand}>Anchored</Text>
      </View>

      <Text style={styles.title}>{isRegister ? 'Create your account' : 'Welcome back'}</Text>
      <Text style={styles.subtitle}>Your personalized Halifax civic dashboard starts here.</Text>

      <View style={styles.form}>
        {isRegister ? (
          <InputField
            label="Full name"
            placeholder="Riley Devitt"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        ) : null}

        <InputField
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <InputField
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <PrimaryButton
          title={isRegister ? 'Create Account' : 'Sign In'}
          onPress={submit}
          disabled={!canContinue}
          loading={loading}
        />

        <View style={styles.switcher}>
          <Text style={styles.switchText}>{isRegister ? 'Already have an account?' : 'Need an account?'}</Text>
          <Pressable onPress={() => setMode(isRegister ? 'login' : 'register')}>
            <Text style={styles.switchAction}>{isRegister ? 'Sign In' : 'Register'}</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    backgroundColor: colors.background,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
  },
  form: {
    marginTop: 28,
    gap: spacing.md,
  },
  switcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  switchText: {
    color: colors.muted,
    fontSize: 14,
  },
  switchAction: {
    color: colors.halifaxBlue,
    fontWeight: '700',
    fontSize: 14,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
});
