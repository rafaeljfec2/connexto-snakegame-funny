import { useCallback, useId, useMemo, type CSSProperties, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSkin } from '@/contexts/SkinContext';
import { SKIN_CATALOG } from '@/constants/skins';
import { SKIN_IDS, type SkinId, type SkinPalette } from '@/types/skin';
import styles from './SkinSelector.module.css';

const ORDERED_SKINS: readonly SkinPalette[] = SKIN_IDS.map((id) => SKIN_CATALOG[id]);

interface SkinPreviewStyle extends CSSProperties {
  readonly '--skin-preview-head': string;
  readonly '--skin-preview-body': string;
  readonly '--skin-preview-shadow': string;
}

function buildPreviewStyle(palette: SkinPalette): SkinPreviewStyle {
  return {
    '--skin-preview-head': palette.head.highlight,
    '--skin-preview-body': palette.body.mid,
    '--skin-preview-shadow': palette.body.shadow,
  };
}

export function SkinSelector() {
  const { skinId, setSkin } = useSkin();
  const { t } = useTranslation();
  const groupId = useId();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const index = SKIN_IDS.indexOf(skinId);
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (index + delta + SKIN_IDS.length) % SKIN_IDS.length;
      const next: SkinId | undefined = SKIN_IDS[nextIndex];
      if (next) setSkin(next);
    },
    [skinId, setSkin],
  );

  const options = useMemo(
    () =>
      ORDERED_SKINS.map((palette) => ({
        palette,
        previewStyle: buildPreviewStyle(palette),
      })),
    [],
  );

  return (
    <div
      id={groupId}
      className={styles.segmented}
      role='radiogroup'
      aria-label={t('skin.groupLabel')}
      data-testid='skin-selector'
      onKeyDown={handleKeyDown}
    >
      {options.map(({ palette, previewStyle }) => {
        const selected = palette.id === skinId;
        const label = t(palette.labelKey);
        return (
          <button
            key={palette.id}
            type='button'
            role='radio'
            aria-checked={selected}
            aria-label={label}
            tabIndex={selected ? 0 : -1}
            className={styles.option}
            data-selected={selected}
            data-testid={`skin-selector-${palette.id}`}
            onClick={() => setSkin(palette.id)}
          >
            <span className={styles.preview} style={previewStyle} aria-hidden='true' />
            <span className={styles.label}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
