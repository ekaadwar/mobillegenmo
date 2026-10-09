import React, {useEffect, useRef, useState} from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {useNavigation} from '@react-navigation/native';
import {
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
import {
  faXmark,
} from '@fortawesome/free-solid-svg-icons/faXmark';

import {AppTextInput} from '../../components/ui/AppTextInput';
import {AppIcon} from '../../components/ui/AppIcon';
import {CarCard} from '../../components/cars/CarCard';
import {CarCardSkeleton} from '../../components/cars/CarCardSkeleton';
import {CarPagination} from '../../components/cars/CarPagination';
import {YearRangeFilter} from '../../components/cars/YearRangeFilter';
import {useDebounce} from '../../hooks/useDebounce';
import {useResponsive} from '../../hooks/useResponsive';
import {Car, CarListParams, CarListResponse} from '../../types/car';
import {AppTabParamList} from '../../navigation/types';
import {getCachedCars, getCars} from '../../services/carService';
import {ApiError} from '../../services/apiClient';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';

const PER_PAGE = 8;

function SearchIcon({color, size}: {color: string; size: number}) {
  return <AppIcon icon={faMagnifyingGlass} size={size} color={color} />;
}

function ClearIcon({color, size}: {color: string; size: number}) {
  return <AppIcon icon={faXmark} size={size} color={color} />;
}

export function CatalogScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
  const {r, contentWidth} = useResponsive();
  const listRef = useRef<FlatList<Car>>(null);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput.trim(), 1000);
  const [yearRange, setYearRange] = useState<Pick<CarListParams, 'start_year' | 'end_year'> | null>(null);
  const [page, setPage] = useState(1);
  const [response, setResponse] = useState<CarListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const lastRetry = useRef(0);

  useEffect(() => {
    const searchIsPending = searchInput.trim() !== debouncedSearch;
    if (searchIsPending) {
      return;
    }

    const params: CarListParams = {
      page,
      perpage: PER_PAGE,
      ...(debouncedSearch ? {name: debouncedSearch} : {}),
      ...(yearRange ?? {}),
    };
    const cached = getCachedCars(params);
    const forceRequest = retryCount !== lastRetry.current;
    lastRetry.current = retryCount;
    if (cached && !forceRequest) {
      setResponse(cached);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(null);
    getCars(params, controller.signal)
      .then(result => {
        if (active) {
          setResponse(result);
        }
      })
      .catch((requestError: unknown) => {
        if (!active || (requestError instanceof Error && requestError.name === 'AbortError')) {
          return;
        }
        const message = requestError instanceof ApiError
          ? requestError.message
          : 'Data katalog gagal dimuat. Silakan coba kembali.';
        setError(message);
        setResponse(null);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [page, retryCount, searchInput, debouncedSearch, yearRange]);

  const clearSearch = () => {
    const unfilteredParams: CarListParams = {
      page: 1,
      perpage: PER_PAGE,
      ...(yearRange ?? {}),
    };
    const cached = getCachedCars(unfilteredParams);
    setSearchInput('');
    setPage(1);
    setError(null);
    setResponse(cached ?? null);
    setLoading(!cached);
  };

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    listRef.current?.scrollToOffset({offset: 0, animated: false});
  };

  const renderHeader = () => (
    <View style={[styles.contentColumn, {width: contentWidth, paddingTop: r(20), paddingBottom: r(16)}]}>
      <Text style={[styles.title, {fontSize: r(26)}]}>Katalog Mobil</Text>
      <Text style={[styles.description, {fontSize: r(14), marginTop: r(2), marginBottom: r(18)}]}>
        Kelola seluruh katalog mobil bekas Mobil Legend.
      </Text>
      <AppTextInput
        accessibilityLabel="Cari berdasarkan nama atau merek mobil"
        value={searchInput}
        onChangeText={value => {
          setSearchInput(value);
          setPage(1);
        }}
        disabled={loading}
        placeholder="Cari mobil"
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        leftIcon={SearchIcon}
        rightIcon={searchInput ? ClearIcon : undefined}
        rightAction={searchInput ? {label: 'Hapus pencarian', onPress: clearSearch} : undefined}
        containerStyle={{marginBottom: r(8)}}
        inputStyle={{minHeight: r(44)}}
      />
      <YearRangeFilter
        value={yearRange}
        disabled={loading}
        onChange={range => {
          setYearRange(range);
          setPage(1);
        }}
      />
    </View>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={[styles.contentColumn, {width: contentWidth}]}>
          <CarCardSkeleton />
          <CarCardSkeleton />
        </View>
      );
    }
    if (error) {
      return (
        <View style={[styles.state, {padding: r(24)}]}>
          <Text style={styles.stateTitle}>Katalog tidak dapat dimuat</Text>
          <Text style={styles.stateText}>{error}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Coba lagi memuat katalog" onPress={() => setRetryCount(count => count + 1)} style={styles.retry}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </Pressable>
        </View>
      );
    }
    const hasFilter = Boolean(debouncedSearch || yearRange);
    return (
      <View style={[styles.state, {padding: r(24)}]}>
        <Text style={styles.stateTitle}>{hasFilter ? 'Mobil tidak ditemukan' : 'Katalog masih kosong'}</Text>
        <Text style={styles.stateText}>
          {hasFilter ? 'Coba ubah kata pencarian atau rentang tahun.' : 'Belum ada mobil yang tersedia.'}
        </Text>
      </View>
    );
  };

  return (
    <FlatList
      ref={listRef}
      style={styles.list}
      contentContainerStyle={{paddingBottom: r(18)}}
      data={loading || error ? [] : response?.data ?? []}
      keyExtractor={car => car.id}
      renderItem={({item}) => (
        <View style={[styles.contentColumn, {width: contentWidth}]}>
          <CarCard car={item} onDetail={() => navigation.navigate('Dashboard')} />
        </View>
      )}
      ListHeaderComponent={renderHeader()}
      ListEmptyComponent={renderEmpty()}
      ListFooterComponent={
        response && response.data.length > 0 && !loading && !error ? (
          <CarPagination
            page={response.page}
            totalPages={response.totalPages}
            total={response.total}
            perpage={response.perpage}
            disabled={loading}
            onPageChange={changePage}
          />
        ) : undefined
      }
      initialNumToRender={4}
      maxToRenderPerBatch={4}
      windowSize={5}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      accessibilityLabel="Daftar katalog mobil"
    />
  );
}

const styles = StyleSheet.create({
  list: {flex: 1, backgroundColor: colors.background},
  contentColumn: {alignSelf: 'center'},
  title: {color: colors.primary, fontFamily: typography.bold},
  description: {color: colors.textPrimary, fontFamily: typography.regular},
  state: {minHeight: 220, justifyContent: 'center', alignItems: 'center'},
  stateTitle: {textAlign: 'center', color: colors.textPrimary, fontFamily: typography.semiBold, fontSize: 16},
  stateText: {marginTop: 8, textAlign: 'center', color: colors.textSecondary, fontFamily: typography.regular, fontSize: 13},
  retry: {marginTop: 16, minHeight: 44, paddingHorizontal: 18, justifyContent: 'center', borderRadius: 8, backgroundColor: colors.primary},
  retryText: {color: colors.white, fontFamily: typography.semiBold},
});