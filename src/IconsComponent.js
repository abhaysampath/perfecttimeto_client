import React, { useState } from 'react';
import './styles/icons.css';
import alertIcon from './icons/alert-icon.png';
import cardsIcon from './icons/cards-icon.png';
import clockIcon from './icons/clock-icon.png';
import filterIcon from './icons/filter-icon.png';

export function IconsComponent() {
    const [selectedIcons, setSelectedIcons] = useState([]);
    const [popupInfo, setPopupInfo] = useState({});

    const footerOptions = {
        alertIcon: "Create Alert",
        cardsIcon: "View Parks List",
        clockIcon: "Filter By Time",
        filterIcon: "Filter By Weather"
    };

    const toggleIcon = (icon) => {
        const newSelection = selectedIcons.includes(icon)
            ? selectedIcons.filter(i => i !== icon)
            : [...selectedIcons, icon];
        setSelectedIcons(newSelection);
        // Update popup information
        if (!selectedIcons.includes(icon)) {
            setPopupInfo({
                ...popupInfo,
                [icon]: footerOptions[icon]
            });
        } else {
            const newPopupInfo = { ...popupInfo };
            delete newPopupInfo[icon];
            setPopupInfo(newPopupInfo);
        }
    };
    const renderPopup = (icon) => {
        if (selectedIcons.includes(icon)) {
            return (
                <div className="popup">
                    {popupInfo[icon]}
                </div>
            );
        }
    };

    return (
        <div className="icon-container">
            <div
                className={`icon ${selectedIcons.includes('alertIcon') ? 'selected' : ''}`}
                onClick={() => toggleIcon('alertIcon')}
            >
                <img src={alertIcon} alt="Alert" />
                {renderPopup('alertIcon')}
            </div>
            <div
                className={`icon ${selectedIcons.includes('cardsIcon') ? 'selected' : ''}`}
                onClick={() => toggleIcon('cardsIcon')}
            >
                <img src={cardsIcon} alt="Cards" />
                {renderPopup('cardsIcon')}
            </div>
            <div
                className={`icon ${selectedIcons.includes('clockIcon') ? 'selected' : ''}`}
                onClick={() => toggleIcon('clockIcon')}
            >
                <img src={clockIcon} alt="Clock" />
                {renderPopup('clockIcon')}
            </div>
            <div
                className={`icon ${selectedIcons.includes('filterIcon') ? 'selected' : ''}`}
                onClick={() => toggleIcon('filterIcon')}
            >
                <img src={filterIcon} alt="Filter" />
                {renderPopup('filterIcon')}
            </div>
        </div>
    );
}