import React from 'react';
import Slider from '@mui/material/Slider';
import MuiInput from '@mui/material/Input';
import { Typography, Checkbox, FormControlLabel, Box } from '@mui/material';
import './styles/filters.css';

export const SliderComponent = ({ index, slider, onSliderChange }) => {
    const { name, bounds, units, sliderValue, isEnabled } = slider;
    const range = bounds.upper - bounds.lower;
    const filterName = name;
    const steps = range > 65 ? 5 : 1;
    const MARKS_LABEL_COLOR = "white";
    const MARKS_LABEL_STYLE = { color: MARKS_LABEL_COLOR, fontWeight: 'lighter' };
    const getMarks = () => {
        const NUMBER_OF_DIVISIONS = 5
        const marks = [];
        for (let i = 0; i <= NUMBER_OF_DIVISIONS; i++) {
            let markValue = bounds.lower + (i * Math.floor(range / NUMBER_OF_DIVISIONS));
            marks.push({
                value: markValue,
                label: <Typography style={MARKS_LABEL_STYLE}>{markValue}</Typography>
            });
        };
        return marks;
    }
    const handleSliderChange = (event, newValue) => {
        onSliderChange(index, newValue);
    };
    const handleInputChange = (event, newIndex) => {
        const value = parseInt(event.target.value, 10);
        const newSliderValue = newIndex === 0 ? [value, slider.sliderValue[1]] : [slider.sliderValue[0], value];
        onSliderChange(index, newSliderValue);
    };
    const handleComponentClick = () => {
        if (!slider.isEnabled)
            onSliderChange(index, { ...slider, isEnabled: !slider.isEnabled });
    };
    const handleCheckboxChange = (event) => {
        onSliderChange(index, { ...slider, isEnabled: event.target.checked });
    };
    return (
        <Box className="slider-container" onClick={handleComponentClick} sx={{ opacity: isEnabled ? 1 : 0.7, color: isEnabled ? 'inherit' : 'gray' }}>
            <label className='slider-top-row'>
                <div>
                    <FormControlLabel
                        control={<Checkbox id={filterName + "-checkbox"} checked={isEnabled} onChange={handleCheckboxChange} />}
                        sx={{ marginRight: 0 }}
                        labelPlacement="end"
                        formcontrollabelprops={{
                            style: {
                                color: isEnabled ? 'white' : 'gray',
                                fontSize: '1rem'
                            }
                        }}
                    />
                </div>
                <div className="slider-name">
                    {filterName}
                </div>
                {isEnabled && (
                    <>
                        <div className="slider-values">
                            <MuiInput id={filterName + "-input-lower"} className="input-container"
                                value={sliderValue[0]}
                                size="small"
                                onChange={(event) => handleInputChange(event, 0)}
                                inputProps={{
                                    min: (bounds.lower),
                                    max: (bounds.upper),
                                    step: steps,
                                    type: 'number', 'attr.aria-labelledby': { filterName } + "-input-upper"
                                }}
                            /><div className="slider-units"> - </div>
                            <MuiInput id={filterName + "-input-upper"} className="input-container"
                                value={sliderValue[1]}
                                size="small"
                                onChange={(event) => handleInputChange(event, 1)}
                                inputProps={{
                                    min: (bounds.lower),
                                    max: (bounds.upper),
                                    step: steps,
                                    type: 'number', 'attr.aria-labelledby': { filterName } + "-input-upper"
                                }}
                            />
                            <div className="slider-units">
                                {units}
                            </div>
                        </div>
                    </>
                )}
            </label>
            {isEnabled && (
                <>
                    <div className="slider-slider">
                        <Slider color='black'
                            disabled={!isEnabled}
                            value={slider.sliderValue}
                            onChange={handleSliderChange}
                            valueLabelDisplay="auto"
                            min={bounds.lower}
                            max={bounds.upper}
                            marks={getMarks()}
                            step={steps}
                            size='large'
                        />
                    </div>
                </>
            )}
        </Box>
    );
};
export default SliderComponent;
