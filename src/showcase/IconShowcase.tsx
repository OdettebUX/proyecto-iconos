import { useMemo, useState, type ChangeEvent } from 'react';
import { LucideIcon } from '../icons/LucideIcon';
import { iconRegistry } from '../icons/registry';
import './IconShowcase.css';

const sizeOptions = [16, 24, 32, 40, 48] as const;

type IconSize = (typeof sizeOptions)[number];
type StrokeMode = 'auto' | 'custom';
type ShowcaseTheme = 'light' | 'dark';

function getAutoStrokeWidth(size: IconSize) {
  if (size <= 16) {
    return 1;
  }

  if (size <= 24) {
    return 1.5;
  }

  if (size <= 32) {
    return 2;
  }

  return 3;
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function parseStrokeWidth(value: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1;
  }

  return parsed;
}

export function IconShowcase() {
  const [query, setQuery] = useState('');
  const [selectedSize, setSelectedSize] = useState<IconSize>(40);
  const [strokeMode, setStrokeMode] = useState<StrokeMode>('auto');
  const [customStrokeWidth, setCustomStrokeWidth] = useState(3);
  const [color, setColor] = useState('#6475ad');
  const [theme, setTheme] = useState<ShowcaseTheme>('light');

  const normalizedQuery = normalizeSearchValue(query);
  const strokeWidth = strokeMode === 'auto' ? getAutoStrokeWidth(selectedSize) : customStrokeWidth;

  const filteredIcons = useMemo(() => {
    if (!normalizedQuery) {
      return iconRegistry;
    }

    return iconRegistry.filter((entry) => {
      const searchableValue = normalizeSearchValue(
        [
          entry.name,
          entry.descriptionEs,
          entry.descriptionEn,
          entry.keywordsEs,
          entry.keywordsEn,
        ].join(' '),
      );

      return searchableValue.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  const handleSizeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedSize(Number(event.target.value) as IconSize);
  };

  const handleStrokeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setStrokeMode('custom');
    setCustomStrokeWidth(parseStrokeWidth(event.target.value));
  };

  const handleThemeToggle = () => {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <main className={`showcase showcase--${theme}`}>
      <header className="showcase__header">
        <div>
          <p className="showcase__eyebrow">Lucide + Storybook + Vercel</p>
          <h1>Icon showcase</h1>
          <p className="showcase__subtitle">
            shadcn/ui components, tokens y layout dashboard sincronizados con Storybook.
          </p>
        </div>
        <button className="showcase__theme-button" type="button" onClick={handleThemeToggle}>
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </header>

      <section className="showcase__controls" aria-labelledby="showcase-controls-title">
        <div className="showcase__controls-heading">
          <div>
            <h2 id="showcase-controls-title">Controls</h2>
            <p>Busca y ajusta tamaño/stroke/color desde la misma fuente que Storybook.</p>
          </div>
          <span>{filteredIcons.length} iconos</span>
        </div>

        <div className="showcase__control-grid">
          <label className="showcase__field showcase__field--search">
            <span>Buscar</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="activity..."
              aria-label="Buscar iconos"
            />
          </label>

          <label className="showcase__field">
            <span>Tamaño</span>
            <select value={selectedSize} onChange={handleSizeChange} aria-label="Seleccionar tamaño">
              {sizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </label>

          <label className="showcase__field showcase__field--stroke">
            <span>Stroke</span>
            <div className="showcase__stroke-row">
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={strokeWidth}
                onChange={handleStrokeChange}
                aria-label="Grosor del trazo"
              />
              <button type="button" onClick={() => setStrokeMode('auto')}>
                Auto
              </button>
            </div>
            <small>Auto = tabla (16:1; 24:1.5; 32:2; 40:3; 48:3)</small>
          </label>

          <label className="showcase__field showcase__field--color">
            <span>Color</span>
            <input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              aria-label="Color del icono"
            />
          </label>
        </div>
      </section>

      <section className="showcase__grid" aria-live="polite">
        {filteredIcons.map((entry) => (
          <article className="showcase__card" key={entry.name}>
            <div className="showcase__card-header">
              <h2>{entry.name}</h2>
              <span>{selectedSize}px</span>
            </div>
            <div className="showcase__icon-frame">
              <LucideIcon
                aria-hidden="true"
                color={color}
                icon={entry.component}
                size={selectedSize}
                strokeWidth={strokeWidth}
              />
            </div>
            <p>{entry.descriptionEs}</p>
          </article>
        ))}

        {filteredIcons.length === 0 && (
          <div className="showcase__empty">
            <h2>No hay resultados</h2>
            <p>Prueba con el nombre del icono, una descripción o una keyword ES/EN.</p>
          </div>
        )}
      </section>
    </main>
  );
}
