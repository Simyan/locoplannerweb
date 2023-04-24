import logo from './logo.svg';
import React from "react";
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
    libraries,
  });

  //const [markers, setMarkers] = React.useState([{lat: 41.3996068426308, lng: 2.1803083510313472}]);
  const [markers, setMarkers] = React.useState([{lat: center.lat, lng: center.lng}, {lat: 41.405352765909534, lng: 2.1911230177794083}]);
  


  // React.useEffect(() => {
  //   console.log("intial set up of markers", markers)
  //   setMarkers(() => [{lat: center.lat, lng: center.lng, time: new Data()}]);
  //   console.log("intial set up of markers finished", markers)
  // }, []);


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
