import React from 'react';
import SliderComponent from './SliderComponent';
import './styles/filters.css';

export function FiltersPanel({ filters }) {
  return (
    <div className="filters-panel">
      {filters.map((filter, index) => {
        return (
          <React.Fragment key={index}>
            <SliderComponent
              key={index}
              name={filter.name}
              bounds={filter.bounds}
              units={filter.units}
              init={filter.init}
              min-width='100px' />
          </React.Fragment>
        );
      })}
    </div>
  );
};
