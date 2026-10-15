import React, {useEffect, useRef, useState} from 'react';
import {Image, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {faCamera} from '@fortawesome/free-solid-svg-icons/faCamera';
import {faCarSide} from '@fortawesome/free-solid-svg-icons/faCarSide';
import {faPen} from '@fortawesome/free-solid-svg-icons/faPen';
import {faStar} from '@fortawesome/free-solid-svg-icons/faStar';
import {AppIcon} from '../ui/AppIcon';
import {AppButton} from '../ui/AppButton';
import {CarImage} from '../../types/car';
import {resolveImageUrl} from '../../services/carService';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';

interface CarImageGalleryProps {
  images: CarImage[];
  name: string;
  updating?: boolean;
  onHighlight: (image: CarImage) => void;
  onEdit: () => void;
}

function StarIcon({color, size}: {color: string; size: number}) {
  return <AppIcon icon={faStar} color={color} size={size} />;
}

function EditIcon({color, size}: {color: string; size: number}) {
  return <AppIcon icon={faPen} color={color} size={size} />;
}

export function CarImageGallery({images, name, updating = false, onHighlight, onEdit}: CarImageGalleryProps) {
  const [selectedId, setSelectedId] = useState(() => (images.find(image => image.highlight) ?? images[0])?.id);
  const [frameWidth, setFrameWidth] = useState(0);
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const carousel = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const selectedIndex = Math.max(0, images.findIndex(image => image.id === selectedId));
  const selected = images[selectedIndex];
  const thumbnailStart = Math.min(Math.max(selectedIndex - 2, 0), Math.max(images.length - 5, 0));

  useEffect(() => {
    carousel.current?.scrollTo({x: selectedIndex * frameWidth, animated: false});
  }, [frameWidth, selectedIndex]);

  const renderImage = (image: CarImage, thumbnail = false) => {
    const uri = resolveImageUrl(image.url);
    return uri && !failedUrls.includes(uri) ? (
      <Image
        source={{uri}}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessibilityLabel={thumbnail ? undefined : `Foto ${name}`}
        accessible={!thumbnail}
        onError={() => setFailedUrls(previous => previous.includes(uri) ? previous : [...previous, uri])}
      />
    ) : <View style={styles.fallback}><AppIcon icon={faCarSide} size={thumbnail ? 18 : 40} color={colors.textSecondary} /></View>;
  };

  return (
    <View style={styles.gallery}>
      <View style={styles.frame} onLayout={event => setFrameWidth(event.nativeEvent.layout.width)}>
        {images.length > 0 ? (
          <ScrollView
            ref={carousel}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={event => {
              if (frameWidth > 0) {
                const index = Math.max(0, Math.min(images.length - 1, Math.round(event.nativeEvent.contentOffset.x / frameWidth)));
                setSelectedId(images[index].id);
              }
            }}>
            {images.map(image => <View key={image.id} style={[styles.slide, {width: frameWidth}]}>{renderImage(image)}</View>)}
          </ScrollView>
        ) : <View style={styles.fallback}><AppIcon icon={faCarSide} size={40} color={colors.textSecondary} /><Text style={styles.empty}>Foto belum tersedia</Text></View>}
        <View style={styles.controls}>
          {selected ? <AppButton
            title="Ubah highlight foto"
            variant={selected.highlight ? 'primary' : 'neutral'}
            iconOnly
            size={32}
            responsive={false}
            leftIcon={StarIcon}
            loading={updating}
            onPress={() => onHighlight(selected)}
          /> : null}
          <AppButton title="Edit foto mobil" variant="warning" iconOnly responsive={false} leftIcon={EditIcon} onPress={onEdit} />
        </View>
        <View style={styles.counter}>
          <AppIcon icon={faCamera} color={colors.white} size={14} />
          <Text style={styles.counterText}>{images.length ? selectedIndex + 1 : 0} / {images.length} Foto</Text>
        </View>
      </View>
      {images.length > 0 ? <View style={styles.thumbnails}>
        {images.slice(thumbnailStart, thumbnailStart + 5).map((image, offset) => (
          <Pressable
            key={image.id}
            accessibilityRole="button"
            accessibilityLabel={`Tampilkan foto ${thumbnailStart + offset + 1}`}
            accessibilityState={{selected: image.id === selected?.id}}
            onPress={() => setSelectedId(image.id)}
            style={styles.thumbnail}>
            {renderImage(image, true)}
            {image.id !== selected?.id && <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.inactive]} />}
            {image.highlight ? <View style={styles.star}><AppIcon icon={faStar} color={colors.primary} size={14} /></View> : null}
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.innerBorder, image.id === selected?.id && styles.activeBorder]} />
          </Pressable>
        ))}
      </View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gallery: {gap: 8},
  slide: {height: '100%'},
  frame: {width: '100%', aspectRatio: 358 / 198, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.imagePlaceholder},
  fallback: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8},
  empty: {fontFamily: typography.regular, fontSize: 12, color: colors.textSecondary},
  controls: {position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 4},
  counter: {position: 'absolute', left: 12, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: colors.neutralActive},
  counterText: {fontFamily: typography.regular, fontSize: 10, color: colors.white},
  thumbnails: {flexDirection: 'row', gap: 4},
  thumbnail: {width: '19%', flexShrink: 1, aspectRatio: 68 / 48, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.imagePlaceholder},
  inactive: {backgroundColor: 'rgba(255,255,255,0.65)'},
  innerBorder: {borderRadius: 8, borderWidth: 2, borderColor: 'transparent'},
  activeBorder: {borderColor: colors.primary},
  star: {position: 'absolute', left: 2, bottom: 2},
});