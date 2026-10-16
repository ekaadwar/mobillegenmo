import React, {useEffect, useRef, useState} from 'react';
import {Image, ScrollView, StyleSheet, View, useWindowDimensions} from 'react-native';
import {faCarSide} from '@fortawesome/free-solid-svg-icons/faCarSide';
import {faStar} from '@fortawesome/free-solid-svg-icons/faStar';
import {faTrash} from '@fortawesome/free-solid-svg-icons/faTrash';
import {AppButton} from '../ui/AppButton';
import {AppIcon} from '../ui/AppIcon';
import {CarImage} from '../../types/car';
import {resolveImageUrl} from '../../services/carService';
import {colors} from '../../theme/colors';

export const CAROUSEL_IMAGE_WIDTH = 385;
export const CAROUSEL_IMAGE_HEIGHT = 198;
const SPACING = 8;
const PEEK = 8;

export function carouselLayout(containerWidth: number) {
  const itemWidth = Math.max(0, Math.min(CAROUSEL_IMAGE_WIDTH, containerWidth - 2 * (SPACING + PEEK)));
  return {itemWidth, interval: itemWidth + SPACING, sidePadding: (containerWidth - itemWidth) / 2};
}

// Clones the last/first image at both ends so swiping past an edge lands on a real slide.
export function loopSlides(images: CarImage[]): CarImage[] {
  return images.length > 1 ? [images[images.length - 1], ...images, images[0]] : images;
}

export function resolveLoopIndex(slideIndex: number, count: number): number {
  if (count <= 1) {
    return 0;
  }
  if (slideIndex <= 0) {
    return count - 1;
  }
  if (slideIndex >= count + 1) {
    return 0;
  }
  return slideIndex - 1;
}

function TrashIcon({color, size}: {color: string; size: number}) {
  return <AppIcon icon={faTrash} color={color} size={size} />;
}

function StarIcon({color, size}: {color: string; size: number}) {
  return <AppIcon icon={faStar} color={color} size={size} />;
}

interface CarImageCarouselProps {
  images: CarImage[];
  name: string;
  disabled?: boolean;
  onDelete: (image: CarImage) => void;
  onHighlight: (image: CarImage) => void;
}

export function CarImageCarousel({images, name, disabled = false, onDelete, onHighlight}: CarImageCarouselProps) {
  const window = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(window.width);
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, images.findIndex(image => image.highlight)));
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const {itemWidth, interval, sidePadding} = carouselLayout(containerWidth);
  const count = images.length;
  const slides = loopSlides(images);
  const index = Math.min(activeIndex, Math.max(count - 1, 0));
  const active = images[index];
  const slideIndexOf = (realIndex: number) => (count > 1 ? realIndex + 1 : realIndex);
  const slideOffset = (realIndex: number) => slideIndexOf(realIndex) * interval;

  useEffect(() => {
    scroll.current?.scrollTo({x: slideOffset(index), animated: false});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, interval, count]);

  if (!active) {
    return null;
  }

  const settle = (offsetX: number) => {
    const next = resolveLoopIndex(Math.round(offsetX / interval), count);
    setActiveIndex(next);
    scroll.current?.scrollTo({x: slideOffset(next), animated: false});
  };

  return (
    <View onLayout={event => setContainerWidth(event.nativeEvent.layout.width)} style={{height: CAROUSEL_IMAGE_HEIGHT}}>
      <ScrollView
        ref={scroll}
        horizontal
        scrollEnabled={count > 1}
        showsHorizontalScrollIndicator={false}
        snapToInterval={interval}
        decelerationRate="fast"
        disableIntervalMomentum
        contentOffset={{x: slideOffset(index), y: 0}}
        contentContainerStyle={{paddingHorizontal: sidePadding, gap: SPACING}}
        onMomentumScrollEnd={event => settle(event.nativeEvent.contentOffset.x)}>
        {slides.map((image, slideIndex) => {
          const uri = resolveImageUrl(image.url);
          return (
            <View
              key={`${image.id}-${slideIndex}`}
              accessible={slideIndex === slideIndexOf(index)}
              accessibilityLabel={slideIndex === slideIndexOf(index) ? `Foto ${name} ${index + 1} dari ${count}` : undefined}
              style={[styles.slide, {width: itemWidth}]}>
              {uri && !failedUrls.includes(uri) ? (
                <Image
                  source={{uri}}
                  resizeMode="cover"
                  style={StyleSheet.absoluteFill}
                  onError={() => setFailedUrls(previous => (previous.includes(uri) ? previous : [...previous, uri]))}
                />
              ) : (
                <View style={styles.fallback}><AppIcon icon={faCarSide} size={40} color={colors.textSecondary} /></View>
              )}
            </View>
          );
        })}
      </ScrollView>
      <View pointerEvents="box-none" style={[styles.controls, {right: sidePadding + 8}]}>
        <AppButton title="Hapus foto" variant="danger" iconOnly size={32} responsive={false} leftIcon={TrashIcon} disabled={disabled} onPress={() => onDelete(active)} />
        <AppButton
          title="Jadikan foto highlight"
          variant={active.highlight ? 'primary' : 'neutral'}
          iconOnly
          size={32}
          responsive={false}
          leftIcon={StarIcon}
          disabled={disabled}
          onPress={() => onHighlight(active)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {height: CAROUSEL_IMAGE_HEIGHT, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.imagePlaceholder},
  fallback: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  controls: {position: 'absolute', top: 8, flexDirection: 'row', gap: 4},
});
