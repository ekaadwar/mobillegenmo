import React from 'react';
import {Text} from 'react-native';
import ReactTestRenderer, {act} from 'react-test-renderer';
import * as Keychain from 'react-native-keychain';
import {AuthProvider, useAuth} from '../android/app/src/contexts/AuthContext';
import {clearAuthSession, getAuthSession, saveAuthSession} from '../android/app/src/storage/authStorage';
import {loginApi} from '../android/app/src/services/authService';
import {configureApiClient} from '../android/app/src/services/apiClient';
import {LoginScreen} from '../android/app/src/screens/auth/LoginScreen';
import {WelcomeScreen} from '../android/app/src/screens/home/WelcomeScreen';
import {AppButton} from '../android/app/src/components/ui/AppButton';
import {AppTextInput} from '../android/app/src/components/ui/AppTextInput';
import {ApiError} from '../android/app/src/services/apiClient';

jest.mock('react-native-keychain', () => ({setGenericPassword: jest.fn(), getGenericPassword: jest.fn(), resetGenericPassword: jest.fn()}));
jest.mock('../android/app/src/services/authService', () => ({...jest.requireActual('../android/app/src/services/authService'), loginApi: jest.fn()}));
jest.mock('../android/app/src/services/apiClient', () => ({...jest.requireActual('../android/app/src/services/apiClient'), configureApiClient: jest.fn()}));

const session = {accessToken: 'test-token', tokenType: 'Bearer', expiresAt: Date.now() + 60000};
let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
let auth: ReturnType<typeof useAuth>;

function AuthProbe() {
  auth = useAuth();
  return <Text>{auth.isAuthenticated ? 'signed-in' : 'signed-out'}</Text>;
}

async function render(children: React.ReactNode = <AuthProbe />) {
  await act(async () => { renderer = ReactTestRenderer.create(<AuthProvider>{children}<AuthProbe /></AuthProvider>); });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(loginApi).mockReset();
  jest.mocked(Keychain.getGenericPassword).mockResolvedValue(false);
  jest.mocked(Keychain.resetGenericPassword).mockResolvedValue(true);
});
afterEach(() => { if (renderer) { act(() => renderer?.unmount()); renderer = undefined; } });

describe('secure session storage', () => {
  it('stores, restores, and clears an authenticated session', async () => {
    await saveAuthSession(session);
    expect(Keychain.setGenericPassword).toHaveBeenCalledWith('session', JSON.stringify(session), {service: 'mobillegend.auth.session'});
    jest.mocked(Keychain.getGenericPassword).mockResolvedValue({username: 'session', password: JSON.stringify(session), service: 'mobillegend.auth.session', storage: Keychain.STORAGE_TYPE?.AES_GCM_NO_AUTH});
    await expect(getAuthSession()).resolves.toEqual(session);
    await clearAuthSession();
    expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({service: 'mobillegend.auth.session'});
  });

  it.each(['invalid-json', JSON.stringify({...session, expiresAt: 0})])('discards invalid or expired stored data', async password => {
    jest.mocked(Keychain.getGenericPassword).mockResolvedValue({username: 'session', password, service: 'mobillegend.auth.session', storage: Keychain.STORAGE_TYPE?.AES_GCM_NO_AUTH});
    await expect(getAuthSession()).resolves.toBeNull();
    expect(Keychain.resetGenericPassword).toHaveBeenCalledTimes(1);
  });

  it('returns null when there are no credentials', async () => {
    await expect(getAuthSession()).resolves.toBeNull();
  });
});

describe('authentication context and screens', () => {
  it('bootstraps, logs in, provides a bearer token, and logs out', async () => {
    await render();
    expect(auth.isBootstrapping).toBe(false);
    expect(auth.isAuthenticated).toBe(false);
    jest.mocked(loginApi).mockResolvedValueOnce({accessToken: 'new-token', tokenType: 'Bearer', expiresIn: 3600});
    await act(async () => { await auth.login({username: 'admin', password: 'test-password'}); });
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.session?.accessToken).toBe('new-token');
    const handlers = jest.mocked(configureApiClient).mock.calls[0][0];
    await expect(handlers.getAccessToken()).resolves.toBeNull();
    await act(async () => { await auth.logout(); });
    expect(auth.isAuthenticated).toBe(false);
  });

  it('clears authentication through the shared unauthorized handler', async () => {
    await render();
    const handlers = jest.mocked(configureApiClient).mock.calls[0][0];
    await act(async () => { await handlers.onUnauthorized(); });
    expect(Keychain.resetGenericPassword).toHaveBeenCalledTimes(1);
    expect(auth.session).toBeNull();
  });

  it('validates login fields, submits trimmed usernames, and shows server errors', async () => {
    await render(<LoginScreen />);
    await act(async () => { await renderer!.root.findByType(AppButton).props.onPress(); });
    expect(JSON.stringify(renderer!.toJSON())).toContain('Username wajib diisi.');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Password wajib diisi.');
    expect(loginApi).not.toHaveBeenCalled();
    act(() => {
      const fields = renderer!.root.findAllByType(AppTextInput);
      fields[0].props.onSubmitEditing();
      fields[0].props.onChangeText('  admin  ');
      fields[1].props.onChangeText('test-password');
    });
    jest.mocked(loginApi).mockRejectedValueOnce(new ApiError('Username atau password salah', 401));
    await act(async () => { await renderer!.root.findByType(AppButton).props.onPress(); });
    expect(loginApi).toHaveBeenCalledWith({username: 'admin', password: 'test-password'});
    expect(JSON.stringify(renderer!.toJSON())).toContain('Username atau password salah');
    act(() => renderer!.root.findAllByType(AppTextInput)[1].props.onChangeText('corrected'));
    expect(JSON.stringify(renderer!.toJSON())).not.toContain('Username atau password salah');
  });

  it('handles generic login failures and restores the submit button', async () => {
    await render(<LoginScreen />);
    act(() => {
      const fields = renderer!.root.findAllByType(AppTextInput);
      fields[0].props.onChangeText('admin');
      fields[1].props.onChangeText('test-password');
    });
    jest.mocked(loginApi).mockRejectedValueOnce(new Error('Network'));
    await act(async () => { await renderer!.root.findByType(AppButton).props.onPress(); });
    expect(JSON.stringify(renderer!.toJSON())).toContain('Terjadi kesalahan. Silakan coba kembali.');
    expect(renderer!.root.findByType(AppButton).props.loading).toBe(false);
  });

  it('connects the welcome screen logout button to session removal', async () => {
    await render(<WelcomeScreen />);
    await act(async () => { await renderer!.root.findByType(AppButton).props.onPress(); });
    expect(Keychain.resetGenericPassword).toHaveBeenCalledTimes(1);
    expect(renderer!.root.findByType(AppButton).props.loading).toBe(false);
  });
});