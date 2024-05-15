# PerfectTimeTo.com

Perfect Time To is a web application that helps users find the perfect time to do various activities based on forecasted weather conditions. This repository contains the React JavaScript frontend layer that renders a map using the Google Maps API, then uses location information to fetch weather information from the NWS Weather API, which is then checked against user-defined filters and presented. Users will also have the option to subscribe to text alerts to be notified as soon as upcoming forecasts for selected locations show ideal weather conditions.
The live website is available at [perfecttimeto.com](http://perfecttimeto.com)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.
This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Prerequisites

Install [Node.js](https://nodejs.org/en/download) and [Yarn](https://classic.yarnpkg.com/lang/en/docs/install/) on your machine.

Get a [Google Maps API key](https://developers.google.com/maps/documentation/embed/get-api-key)

Add the Google Maps API key to your environment:

`export REACT_APP_GOOGLE_MAPS_API_KEY="<enter your key here>`

### Installation

1. Clone repository

`git clone https://github.com/abhaysampath/perfecttimeto_client.git`

1. Navigate into project directory

`cd perfecttimeto_client`

1. Install dependencies

`yarn install`

### Local Deployment

Start development server

`yarn start`

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Built With

* [React](https://reactjs.org/) - The web framework used
* [Yarn](https://yarnpkg.com/) - Dependency Management
* [Google Maps API](https://developers.google.com/maps/documentation) - Used to generate maps and place markers
* [NWS Weather API](https://www.weather.gov/documentation/services-web-api) - Used for fetching weather forecast data
* [OpenStreetMap API](https://nominatim.openstreetmap.org) - Used for looking up location information

## Author

Abhay Sampath: [GitHub](https://github.com/abhaysampath/) [LinkedIn](https://www.linkedin.com/in/abhaysampath/)
