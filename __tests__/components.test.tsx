import React from 'react';
import {Modal, StyleSheet, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {AppButton, ButtonVariant} from '../android/app/src/components/ui/AppButton';
import {AppBadge} from '../android/app/src/components/ui/AppBadge';
import {AppCard} from '../android/app/src/components/ui/AppCard';
import {AppIcon} from '../android/app/src/components/ui/AppIcon';
import {AppTextInput} from '../android/app/src/components/ui/AppTextInput';
import {AppHeader} from '../android/app/src/components/layout/AppHeader';
import {CarPagination} from '../android/app/src/components/cars/CarPagination';
import {CarCardSkeleton} from '../android/app/src/components/cars/CarCardSkeleton';
import {YearRangeFilter} from '../android/app/src/components/cars/YearRangeFilter';
import {faCar} from '@fortawesome/free-solid-svg-icons/faCar';

let renderer: ReactTestRenderer.ReactTestRenderer;
function render(element: React.ReactElement) {
  act(() => { renderer = ReactTestRenderer.create(element); });
}
function control(label: string) {
  const node = renderer.root.findAll(item => item.props.accessibilityLabel === label && typeof item.props.onPress === 'function')[0];
  if (!node) { throw new Error(`Control not found: ${label}`); }
  return node;
}
afterEach(() => { act(() => renderer.unmount()); });

describe('reusable components', () => {
  const variants: ButtonVariant[] = ['primary', 'danger', 'warning', 'success', 'info', 'neutral', 'primary-outline', 'danger-outline', 'warning-outline', 'success-outline', 'info-outline', 'neutral-outline'];
  it.each(variants)('renders %s buttons and badges', variant => {
    const onPress = jest.fn();
    render(<View><AppButton title="Action" variant={variant} onPress={onPress} /><AppBadge variant={variant} label="Status" /></View>);
    act(() => control('Action').props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
    act(() => control('Action').props.onHoverIn());
    act(() => control('Action').props.onHoverOut());
    expect(JSON.stringify(renderer.toJSON())).toContain('Status');
  });

  it('keeps icon-only controls labelled and disables loading buttons', () => {
    render(<AppButton title="Favorite" iconOnly size={32} loading onPress={jest.fn()} />);
    expect(control('Favorite').props.disabled).toBe(true);
    expect(control('Favorite').props.accessibilityState.disabled).toBe(true);
    expect(renderer.root.findAllByType(Text)).toHaveLength(0);
  });

  it('renders card content, icons, default badges, header and skeleton', () => {
    render(<View><AppCard><Text>Content</Text><AppIcon icon={faCar} /><AppBadge label="Default" /></AppCard><AppHeader /><CarCardSkeleton /></View>);
    expect(JSON.stringify(renderer.toJSON())).toContain('Content');
    expect(renderer.root.findAllByType(AppIcon).length).toBeGreaterThan(3);
  });

  it('keeps the shared header below the system status bar', () => {
    jest.mocked(useSafeAreaInsets).mockReturnValueOnce({top: 24, bottom: 0, left: 0, right: 0});
    render(<AppHeader />);
    const style = StyleSheet.flatten(renderer.root.findAllByType(View)[0].props.style);
    expect(style.paddingTop).toBe(34);
    expect(style.height).toBeGreaterThanOrEqual(24 + 58);
  });

  it('toggles password visibility and renders required-field errors', () => {
    render(<AppTextInput label="Password" password required error="Required" value="secret" />);
    expect(renderer.root.findByType(TextInput).props.secureTextEntry).toBe(true);
    act(() => control('Tampilkan password').props.onPress());
    expect(renderer.root.findByType(TextInput).props.secureTextEntry).toBe(false);
    act(() => control('Sembunyikan password').props.onPress());
    expect(renderer.root.findByType(TextInput).props.secureTextEntry).toBe(true);
    expect(JSON.stringify(renderer.toJSON())).toContain('Required');
  });

  it('supports input icons, clear actions and disabled input', () => {
    const onClear = jest.fn();
    const icon = () => <AppIcon icon={faCar} />;
    render(<AppTextInput disabled rightAction={{label: 'Clear', onPress: onClear}} rightIcon={icon} leftIcon={icon} />);
    expect(renderer.root.findByType(TextInput).props.editable).toBe(false);
    expect(control('Clear').props.disabled).toBe(true);
    act(() => renderer.update(<AppTextInput rightAction={{label: 'Clear', onPress: onClear}} rightIcon={icon} />));
    act(() => control('Clear').props.onPress());
    expect(onClear).toHaveBeenCalledTimes(1);
    act(() => renderer.update(<AppTextInput rightIcon={icon} />));
    expect(renderer.root.findAllByType(AppIcon)).toHaveLength(1);
  });
});

describe('catalog controls', () => {
  it('enforces pagination boundaries and invokes page changes', () => {
    const onPageChange = jest.fn();
    render(<CarPagination page={1} totalPages={3} total={20} perpage={8} onPageChange={onPageChange} />);
    expect(control('Halaman sebelumnya').props.disabled).toBe(true);
    act(() => control('Halaman berikutnya').props.onPress());
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    act(() => renderer.update(<CarPagination page={3} totalPages={3} total={20} perpage={8} onPageChange={onPageChange} />));
    expect(control('Halaman berikutnya').props.disabled).toBe(true);
    act(() => control('Halaman sebelumnya').props.onPress());
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    act(() => renderer.update(<CarPagination page={1} totalPages={0} total={0} perpage={8} disabled onPageChange={onPageChange} />));
    expect(control('Halaman berikutnya').props.disabled).toBe(true);
  });

  it('selects and clears a normalized year range', () => {
    const onChange = jest.fn();
    const year = new Date().getFullYear();
    render(<YearRangeFilter value={null} onChange={onChange} />);
    act(() => control('Filter tahun, Pilih rentang tahun').props.onPress());
    act(() => control(`Tahun ${year}`).props.onPress());
    act(() => control(`Tahun ${year - 2}`).props.onPress());
    expect(onChange).toHaveBeenCalledWith({start_year: year - 2, end_year: year});
    expect(renderer.root.findByType(Modal).props.visible).toBe(false);
    act(() => renderer.update(<YearRangeFilter value={{start_year: year - 2, end_year: year}} onChange={onChange} />));
    act(() => control('Hapus filter tahun').props.onPress());
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('dismisses the year picker with the native back action', () => {
    render(<YearRangeFilter value={null} onChange={jest.fn()} />);
    act(() => control('Filter tahun, Pilih rentang tahun').props.onPress());
    act(() => renderer.root.findByType(Modal).props.onRequestClose());
    expect(renderer.root.findByType(Modal).props.visible).toBe(false);
    act(() => control('Filter tahun, Pilih rentang tahun').props.onPress());
    const cancel = renderer.root.findAll(node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(text => text.props.children === 'Batal'))[0];
    act(() => cancel.props.onPress());
    expect(renderer.root.findByType(Modal).props.visible).toBe(false);
  });
});