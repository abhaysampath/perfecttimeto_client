import React, { useState } from 'react';
import Slider from '@mui/material/Slider';
import MuiInput from '@mui/material/Input';
import { Typography, Checkbox, FormControlLabel, Box } from '@mui/material';
import './styles/filters.css';

const SliderComponent = ({ name, bounds, units, init }) => {
    const [sliderValue, setSliderValue] = useState([init.lower, init.upper]);
    const [isEnabled, setIsEnabled] = useState(true);
    const sliderMin = bounds.lower;
    const sliderMax = bounds.upper;
    const range = sliderMax - sliderMin;
    const filterName = name;
    const steps = range > 65 ? 5 : 1;
    const MARKS_LABEL_COLOR = "white";
    const MARKS_LABEL_STYLE = { color: MARKS_LABEL_COLOR, fontWeight: 'lighter' };
    const getMarks = () => {
        const NUMBER_OF_DIVISIONS = 5
        const marks = [];
        for (let i = 0; i <= NUMBER_OF_DIVISIONS; i++) {
            let markValue = sliderMin + (i * Math.floor(range / NUMBER_OF_DIVISIONS));
            if (markValue == bounds.lower || markValue == bounds.upper) {
                marks.push({
                    value: markValue,
                    label: <Typography style={MARKS_LABEL_STYLE}>{markValue} {units}</Typography>
                })
            } else {
                marks.push({
                    value: markValue,
                    label: <Typography style={MARKS_LABEL_STYLE}>{markValue}</Typography>//, markValue
                });
            }
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
    const handleComponentClick = () => {
        if (!isEnabled) setIsEnabled(true);
    };
    const handleCheckboxChange = (event) => {
        setIsEnabled(event.target.checked);
    };
    return (
        <Box className="slider-container" onClick={handleComponentClick} sx={{ opacity: isEnabled ? 1 : 0.7, color: isEnabled ? 'inherit' : 'gray' }}>
            <label className='slider-top-row'>
                <div>
                    <FormControlLabel
                        control={<Checkbox checked={isEnabled} onChange={handleCheckboxChange} />}
                        sx={{ marginRight: 0 }}
                        labelPlacement="end"
                        FormControlLabelProps={{
                            style: {
                                color: isEnabled ? 'white' : 'gray',  // Example color change based on the enabled state
                                fontSize: '1rem'                   // Set font size here
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
                            <MuiInput className="input-container"
                                value={sliderValue[0]}
                                size="small"
                                onChange={handleLowerInputChange}
                                inputProps={{
                                    min: { sliderMin },
                                    max: { sliderMax },
                                    step: steps,
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
                                    step: steps,
                                    type: 'number', 'aria-labelledby': 'input-slider',
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
                            value={sliderValue}
                            onChange={handleSliderChange}
                            valueLabelDisplay="auto"
                            min={sliderMin}
                            max={sliderMax}
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
