import '../styles/contactInfo.css';
import React from 'react';
import { Box } from '@mui/material';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Button, InputLabel, MenuItem, Select, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@material-ui/core';
// import Text from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Grid from '@mui/material/Grid';

const ContactInfoComponent = ({ geoData, filterValues }) => {
    const [useEmail, setUseEmail] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        locations: geoData,
        filters: filterValues,
    });
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        const formElement = document.querySelector('#contactForm');
        const formData = new FormData(formElement);
        fetch('/', {
            method: 'POST',
            body: formData,
        })
            .then(() => alert('Form successfully submitted'))
            .catch((error) => alert('Form submission error: ' + error.message));
    };
    const handleInputTypeChange = (e, newInputType) => {
        if (newInputType === "Email") {
            setUseEmail(true);
        }
        else {
            setUseEmail(false);
        }
    };
    return (
        <div className="contact-info-panel">
            <Box>
                <Grid container spacing={2} className='contact-info-title'>
                    <Grid item xs={6}>
                        <h2 className='create-alert-title'>Create Alert</h2>
                    </Grid>
                    <Grid item xs={6} className='contact-input-type'>
                        <ToggleButtonGroup className="phone-email-selector" aria-label="contained primary button group"
                            value="Phone" size="small" color="primary" exclusive onChange={handleInputTypeChange}>
                            <ToggleButton value="Phone">Phone</ToggleButton>
                            <ToggleButton value="Email">Email</ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>
                </Grid>
                <div className='contact-info-box'>
                    <form id="contactForm" name="contact" method="POST" data-netlify="true" onSubmit={handleSubmit}>
                        <input type="hidden" name="form-name" value="contact" />
                        <TextField className="contact-text-field" variant="filled" size="small"
                            label="Name" name="username" required onChange={handleInputChange} />
                        <br />
                        {!useEmail &&
                            <div>
                                <Grid container spacing={2} alignItems="flex-end">
                                    <Grid item xs={7}>
                                        <TextField className="contact-text-field" variant="filled" size="small"
                                            label="Phone Number" name="phone" required onChange={handleInputChange} />
                                    </Grid>
                                    <Grid item xs={5}>
                                        <FormControl variant="filled" size="small" fullWidth>
                                            <InputLabel id="carrier-label" className='contact-carrier-label' required>Carrier</InputLabel>
                                            <Select className="contact-text-field2" variant="filled" size="small" value={"Select Carrier"}
                                                label="Carrier" name="carrier" required onChange={handleInputChange}>
                                                <MenuItem value="Select Carrier">Select Carrier</MenuItem>
                                                <MenuItem value="AT&T">AT&T</MenuItem>
                                                <MenuItem value="Verizon">Verizon</MenuItem>
                                                <MenuItem value="T-Mobile">T-Mobile</MenuItem>
                                                <MenuItem value="Sprint">Sprint</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </div>
                        }
                        {useEmail &&
                            <TextField className="contact-text-field2" variant="filled" size="small"
                                label="Email Address" name="email" required onChange={handleInputChange} />
                        }
                        <br />
                        <Accordion defaultExpanded className='locations-accordion'>
                            <AccordionSummary className='locations-accordion-summary' expandIcon={<ExpandMoreIcon />}>
                                <h3 className='contact-info-subtitle'>Locations</h3>
                            </AccordionSummary>
                            <AccordionDetails>
                                {formData.locations.map((location, index) => {
                                    console.log(index, "location", location);
                                    return (
                                        <Stack key={index} direction="column" spacing={1} className='locations-accordion-details'>
                                            <Stack key={index} direction="row" spacing={1}>
                                                <abbr className='contact-location-index'>{index + 1}</abbr>
                                                <TextField className="contact-text-field" variant="filled" size="small" value={location.fullAddress}
                                                    label="Label" name="label" onChange={handleInputChange} />
                                            </Stack>
                                            <Stack key={index + 100000} direction="row" spacing={2}>
                                                <TextField className="contact-text-field" variant="filled" size="small" value={location.lat}
                                                    label="Latitude" name="latitude" onChange={handleInputChange} required />
                                                <TextField className="contact-text-field" variant="filled" size="small" value={location.lng}
                                                    label="Longitude" name="longitude" onChange={handleInputChange} required />
                                            </Stack>
                                        </Stack>
                                    );
                                })}
                            </AccordionDetails>
                        </Accordion>
                        <Accordion className='locations-accordion'>
                            <AccordionSummary className='locations-accordion-summary' expandIcon={<ExpandMoreIcon />}>
                                <h3 className='contact-info-subtitle'>Filter Conditions</h3>
                            </AccordionSummary>
                            <AccordionDetails>
                                {formData.filters.map((filter, index) => {
                                    console.log(index, "filter", filter);
                                    return (
                                        <Stack key={index} direction="column" spacing={2} className='locations-accordion-details'>
                                            <Stack key={index} direction="row" spacing={1} flex={"fill"}>
                                                <Typography className="contact-filter-label" style={{ width: '150px' }}>{filter.name}</Typography>
                                                {/* <TextField className="contact-text-field" variant="filled" size="small" value={filter.name}
                                                    label="Name" name="name" onChange={handleInputChange} /> */}
                                                <TextField className="contact-text-field2" variant="filled" size="small" style={{ width: '80px' }}
                                                    label="Min" name="min" value={filter.sliderValue[0]} onChange={handleInputChange} required />
                                                <TextField className="contact-text-field2" variant="filled" size="small" style={{ width: '80px' }}
                                                    label="Max" name="max" value={filter.sliderValue[1]} onChange={handleInputChange} required />
                                            </Stack>
                                        </Stack>
                                    );
                                })}
                                <br />
                            </AccordionDetails>
                        </Accordion>
                        <br />
                        <Button className="contact-info-submit-button" size='large'
                            style={{ backgroundColor: '#192044', color: 'white', borderRadius: '4px' }}
                            fullWidth hovercolor='black'
                            type="submit">Subscribe to Alerts</Button>
                    </form>
                </div>
            </Box>
        </div>
    );
};

export default ContactInfoComponent;
