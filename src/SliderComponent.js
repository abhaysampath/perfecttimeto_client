import React, { useState } from 'react';
import Slider from '@mui/material/Slider';
import MuiInput from '@mui/material/Input';
import { Typography } from '@mui/material';
import './styles/filters.css';

const SliderComponent = ({ name, bounds, units, init }) => {
    const [sliderValue, setSliderValue] = useState([init.lower, init.upper]);
    const sliderMin = bounds.lower;
    const sliderMax = bounds.upper;
    const filterName = name;
    const MARKS_LABEL_COLOR = "white";
    const MARKS_LABEL_STYLE={ color: MARKS_LABEL_COLOR, fontWeight: 'lighter' };
    const getMarks = () => {
        const range = sliderMax - sliderMin;
        const NUMBER_OF_DIVISIONS = 4;
        const marks = [{
            value: bounds.lower,
            label: <Typography style={MARKS_LABEL_STYLE}>{bounds.lower} {units}</Typography>
        }, {
            value: bounds.upper,
            label: <Typography style={MARKS_LABEL_STYLE}>{bounds.upper} {units}</Typography>
        }];
        for (let i = 1; i < NUMBER_OF_DIVISIONS; i++) {
            let markValue = sliderMin + (i * Math.floor(range / NUMBER_OF_DIVISIONS));
            marks.push({
                value: markValue,
                label: <Typography style={MARKS_LABEL_STYLE}>{markValue}</Typography>, markValue
            });
        };
        return marks;
    }
    const handleSliderChange = (event, newValue) => {
        setSliderValue(newValue);
    };
    const handleLowerInputChange = (event) => {
        setSliderValue(sliderValue => ([event.target.value, sliderValue[1]]));
    };
    const handleUpperInputChange = (event) => {
        setSliderValue(sliderValue => ([sliderValue[0], event.target.value]));
    };
    return (
        <div className="slider-container">
            <label>
                <div className="slider-name">
                    {filterName}
                </div>
                <div className="slider-values">
                    <MuiInput className="input-container"
                        value={sliderValue[0]}
                        size="small"
                        onChange={handleLowerInputChange}
                        inputProps={{
                            min: { sliderMin },
                            max: { sliderMax },
                            step: 10,
                            type: 'number', 'aria-labelledby': 'input-slider',
                        }}
                    /><div className="slider-units"> - </div>
                    <MuiInput className="input-container"
                        value={sliderValue[1]}
                        size="small"
                        onChange={handleUpperInputChange}
                        inputProps={{
                            min: { sliderMin },
                            max: { sliderMax },
                            step: Math.floor(({ sliderMax } - { sliderMin }) * 0.1),
                            type: 'number', 'aria-labelledby': 'input-slider',
                        }}
                    />
                    <div className="slider-units">
                        {units}
                    </div>
                </div>
            </label>
            <div className="slider-slider">
                <Slider color='black'
                    value={sliderValue}
                    onChange={handleSliderChange}
                    valueLabelDisplay="auto"
                    min={sliderMin}
                    max={sliderMax}
                    marks={getMarks()}
                    step={5}
                    size='large'
                />
            </div>
        </div>
    );
};
export default SliderComponent;
