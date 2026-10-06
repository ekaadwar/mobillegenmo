import * as Keychain from 'react-native-keychain';

import {AuthSession} from '../types/auth';

const AUTH_SERVICE = 'mobillegend.auth.session';

export async function saveAuthSession(
  session: AuthSession,
): Promise<void> {
  await Keychain.setGenericPassword(
    'session',
    JSON.stringify(session),
    {
      service: AUTH_SERVICE,
    },
  );
}

export async function getAuthSession():
  Promise<AuthSession | null> {
  const credentials =
    await Keychain.getGenericPassword({
      service: AUTH_SERVICE,
    });

  if (!credentials) {
    return null;
  }

  try {
    const session = JSON.parse(
      credentials.password,
    ) as AuthSession;

    if (Date.now() >= session.expiresAt) {
      await clearAuthSession();
      return null;
    }

    return session;
  } catch {
    await clearAuthSession();
    return null;
  }
}

export async function clearAuthSession():
  Promise<void> {
  await Keychain.resetGenericPassword({
    service: AUTH_SERVICE,
  });
}