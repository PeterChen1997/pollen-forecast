import { useMemo, useState, type KeyboardEventHandler } from 'react';

import { filterCityOptions, type CityOptionLike } from '../lib/cityReference';

interface CitySwitcherProps {
  options: CityOptionLike[];
  activeCity: CityOptionLike | null;
  onSelect: (city: CityOptionLike) => void;
  onClear: () => void;
}

export default function CitySwitcher({ options, activeCity, onSelect, onClear }: CitySwitcherProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () => filterCityOptions(options, query, 10),
    [options, query],
  );

  const handleSelect = (city: CityOptionLike) => {
    onSelect(city);
    setQuery('');
    setOpen(false);
  };

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter' && filtered[0]) {
      event.preventDefault();
      handleSelect(filtered[0]);
    }

    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="city-switcher">
      <div className="city-switcher-row">
        <input
          className="city-switcher-input"
          value={query}
          placeholder="切换城市，查看附近花粉"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        {activeCity && (
          <button className="city-switcher-reset" type="button" onClick={onClear}>
            回到定位
          </button>
        )}
      </div>

      {activeCity && (
        <div className="city-switcher-active">
          当前参考城市：
          {' '}
          <strong>{activeCity.cn}</strong>
          <span className="city-switcher-active-tag">
            {activeCity.inList ? '已监测' : '附近参考'}
          </span>
        </div>
      )}

      {open && filtered.length > 0 && (
        <div className="city-switcher-panel">
          {filtered.map((city) => (
            <button
              key={`${city.en}-${city.cn}`}
              className="city-switcher-option"
              type="button"
              onClick={() => handleSelect(city)}
            >
              <span>{city.cn}</span>
              <span className="city-switcher-option-meta">
                {city.inList ? '已监测' : '附近参考'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
