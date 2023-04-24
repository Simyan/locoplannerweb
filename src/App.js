import logo from './logo.svg';
import React, { useState } from "react";
import axios from "axios";
import { 
  useLoadScript, 
  GoogleMap, 
  MarkerF, //Note: Switched from Marker to MarkerF to resolve bug in localhost; marker won't load on page load
  Data,
  Polyline
} from "@react-google-maps/api";
import './App.css';

const libraries = ['places']
const mapContainerStyle = {
  height: "100vh",
  width: "100vw",
};
const options = {
  //styles: mapStyles,
  disableDefaultUI: true,
  zoomControl: true,
};

//Marker Types - home | anchor | tentative | suggested
const center = {
  lat: 41.3996068426308,
  lng: 2.1803083510313472,
  type: 'home'
};

function App() {
  

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const [places, setPlaces] = useState([]);
  const mapRef = React.useRef();
  const onMapLoad = React.useCallback((map) => {
    console.log('OnMapLoad!', {places});
    mapRef.current = map;
    getNearbyPlaces(center.lat, center.lng);
  }, []);

  //const [markers, setMarkers] = React.useState([{lat: 41.3996068426308, lng: 2.1803083510313472}]);
  const [markers, setMarkers] = React.useState([{lat: center.lat, lng: center.lng}, {lat: 41.405352765909534, lng: 2.1911230177794083}]);
  

  function callback(results, status) {
    if (status === window.google.maps.places.PlacesServiceStatus.OK) {
      console.log('Nearby places response recieved');
      console.log(results);
      setPlaces(results);
    }
  }
  const getNearbyPlaces = async (lat, lng) => {
    const loc = new window.google.maps.LatLng(lat,lng);
    const request = {location: loc, radius: 1200,  type: ['restaurant']};
    let service = new window.google.maps.places.PlacesService(mapRef.current);
    service.nearbySearch(request, callback);
  }


  

  const onMapClick = React.useCallback((e) => {
    setMarkers((current) => [
      ...current, 
      {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
        time: new Date(),
      },
    ]);
  }, []);

  if (loadError) return "Error";
  if (!isLoaded) return "Loading...";
  
  return (
    <div>
      <GoogleMap
      id = "map"
      mapContainerStyle = {mapContainerStyle}
      zoom={15}
      center={center}
      options={options}
      onClick={onMapClick}
      onLoad={onMapLoad}
      >

        {markers.map((marker) => (
          <MarkerF
            key={`${marker.lat}-${marker.lng}`}
            position={{ lat: marker.lat, lng: marker.lng }}
            
          />
        ))}
        <Polyline path={markers}></Polyline>

      </GoogleMap>
    </div>
  );
}

export default App;
