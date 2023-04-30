import React, { useState } from "react";
import {
  useLoadScript,
  GoogleMap,
  MarkerF, //Note: Switched from Marker to MarkerF to resolve bug in localhost; marker won't load on page load
  Polyline
} from "@react-google-maps/api";
import './App.css';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
  getDetails
} from "use-places-autocomplete";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import "@reach/combobox/styles.css";
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';

const libraries = ['places']
const mapContainerStyle = {
  height: "100vh",
  width: "100vw",
};



const options = {
  //styles: mapStyles,
  disableDefaultUI: true,
};


//Marker Types - home | anchor | saved | suggested
const center = {
  uid: 1,
  lat: 41.3996068426308,
  lng: 2.1803083510313472,
  type: 'home'
};

const daysOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const defaultOption = 1;

function App() {



  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const mapRef = React.useRef();
  //sf - 41.40438634828477, 2.1743987153392155; pg - 41.41456759067538, 2.15223281580271
  //#region state
  const [savedLocations, setSavedLocations] = useState([
    { uid: 2, placeId: '', name: 'Sagrada Familia', lat: 41.40438634828477, lng: 2.1743987153392155, type: 'anchor', nearbySaves: [4, 5], isNearbySearchDone: false },
    { uid: 3, placeId: '', name: 'Park Guell', lat: 41.41456759067538, lng: 2.15223281580271, type: 'anchor', nearbySaves: [], isNearbySearchDone: false },
    { uid: 4, placeId: '', name: 'Paisano Bistro', lat: 1, lng: 3, type: 'saved' },
    { uid: 5, placeId: '', name: 'KFC', lat: 1, lng: 4, type: 'saved' }]);

  const [suggestedPlaces, setSuggestedPlaces] = useState([]);
  const [markers, setMarkers] = React.useState([{ lat: center.lat, lng: center.lng }, { lat: 41.405352765909534, lng: 2.1911230177794083 }]);
  //#endregion


  //#region functions

  //Events - start
  const onMapLoad = React.useCallback((map) => {
    console.log('OnMapLoad!');
    mapRef.current = map;
    console.log('az- Alright let us start our journey - 0');
    getNearbyPlacesForAnchors();
    console.log('az- This is the end of the journey');
  }, []);

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


  //Events - end

  function updateSavedLocation(index, loc) {
    setSavedLocations(prevList => {
      // Create a new array with the updated object
      const newList = [...prevList];
      newList[index] = { ...loc };
      return newList;
    });
  }

  const panTo = React.useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    // mapRef.current.setZoom(14);
  }, []);

  function getNearbyPlacesForAnchors() {
    console.log('az- getNearbyPlacesForAnchors - 1 ', savedLocations);
    for (var i = 0; i < savedLocations.length; i++) {
      console.log('az- getNearbyPlacesForAnchors - 1.1');
      if (savedLocations[i].type === 'anchor' && !savedLocations[i].isNearbySearchDone) {
        console.log('az- anchor found - 2');
        updateSavedLocation(i, { ...savedLocations[i], isNearbySearchDone: true })
        getNearbyPlaces(savedLocations[i].lat, savedLocations[i].lng, savedLocations[i].uid);
      }
    }
  }

  function isWorthy(item) {
    if (item.business_status !== 'OPERATIONAL') return false;
    if (item.user_ratings_total >= 1000 && item.rating >= 4.2) return true;
    if (item.user_ratings_total < 1000 && item.rating >= 4.4) return true;

    return false;
  }

  //restaraunt -> rating / total ratings (user_ratings_total) / opening hours / price point / restaraunt-type
  function curriedMapPlace(uid) {
    return function (item) {
      console.log('az- Inside mapPlace - 5');
      return { name: item.name, rating: item.rating, totalRatings: item.user_ratings_total, price: item.price_level, placeId: item.place_id, anchorUId: uid }
    }
  }



  function setPlacesCallback(results, status, pagination, uid) {
    console.log('az- Inside callback - 4');
    if (status === window.google.maps.places.PlacesServiceStatus.OK) {
      console.log('Nearby places response recieved');
      //console.log(results);
      console.log('uid: ' + uid);
      const filteredResult = results.filter(isWorthy);
      const transformedResult = filteredResult.map(curriedMapPlace(uid))
      console.log(transformedResult);
      setSuggestedPlaces(current => [...current, ...transformedResult]);
      if (pagination && pagination.hasNextPage) {
        // Note: nextPage will call the same handler function as the initial call
        pagination.nextPage();
      }
    }
  }
  const getNearbyPlaces = async (lat, lng, uid) => {
    console.log(`az- getNearbyPlaces for anchor ${uid} - 3`);
    const loc = new window.google.maps.LatLng(lat, lng);
    const request = { location: loc, radius: 1200, type: ['restaurant'] };
    let service = new window.google.maps.places.PlacesService(mapRef.current);
    service.nearbySearch(request, function (results, status, pagination) { setPlacesCallback(results, status, pagination, uid) });
  }


  React.useEffect(() => {
    console.log('final', suggestedPlaces);
  }, [suggestedPlaces]);

  //#endregion


  if (loadError) return "Error";
  if (!isLoaded) return "Loading...";

  return (
    <div>
      <Search panTo={panTo} savedLocations={savedLocations} setSavedLocations={setSavedLocations} getNearbyPlacesForAnchors={getNearbyPlacesForAnchors} />
      <GoogleMap
        id="map"
        mapContainerStyle={mapContainerStyle}
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

function Search({ panTo, savedLocations, setSavedLocations, getNearbyPlacesForAnchors }) {
  const [isAnchor, setIsAnchor] = React.useState(false);
  const [isExecute, setIsExecute] = React.useState(0);
  const [newEntryData, setNewEntryData] = React.useState({});

  const [isNewEntryFieldsVisible, setIsNewEntryFieldsVisible] = React.useState(false);
  const [selectedDay, setSelectedDay] = React.useState(defaultOption);
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: { lat: () => center.lat, lng: () => center.lng },
      radius: 100 * 1000,
    },
  });

  React.useEffect(() => {
    getNearbyPlacesForAnchors();
  }, [isExecute]);


  // https://developers.google.com/maps/documentation/javascript/reference/places-autocomplete-service#AutocompletionRequest

  const handleInput = (e) => {
    setValue(e.target.value);
    setIsNewEntryFieldsVisible(true);
    if (!e.target.value || e.target.value === '') setIsNewEntryFieldsVisible(false);
  };

  const getPlaceDetail = (placeId) => {
    const parameter = {
      placeId: placeId,
      // Specify the return data that you want (optional)
      fields: ["rating", "price_level", "user_ratings_total"],
    };

    getDetails(parameter)
      .then((details) => {
        console.log("response of get place details api: ", details);
        const newLocation = { 
          uid: 6, 
          placeId: placeId, 
          name: value, 
          lat: newEntryData.lat, 
          lng: newEntryData.lng, 
          type: isAnchor ? 'anchor' : 'saved',
          rating: details.rating,
          price: details.price_level,
          totalRatings: details.user_ratings_total, 
          isNearbySearchDone: false 
        }

        setSavedLocations(current => [...current, newLocation]);
        if (isAnchor) {
          setIsExecute(x => ++x);
        }

      })
      .catch((error) => {
        console.log("Error: ", error);
      });
  }

  const handleSelect = async (request) => {
    const [address, placeId] = request.split('|');
    console.log('Autocomplete response - ', placeId);
    setValue(address, false);

    clearSuggestions();

    try {
      const results = await getGeocode({ address: address });
      const { lat, lng } = await getLatLng(results[0]);
      setNewEntryData({ lat: lat, lng: lng, placeId: placeId });
      panTo({ lat, lng });
    } catch (error) {
      console.log("😱 Error: ", error);
    }
  };



  const onNewEntrySumbit = (e) => {
    e.preventDefault();
    console.log("Button clicked!", savedLocations);
    getPlaceDetail(newEntryData.placeId);

    //alert(value + ' ' + selectedDay.value + isAnchor + savedLocations[0].name)


  }

  return (
    <div className="search">
      <form className="input-container" onSubmit={onNewEntrySumbit}>
        <Combobox onSelect={handleSelect}>
          <ComboboxInput
            value={value}

            onChange={handleInput}
            disabled={!ready}
            placeholder="Search your location"
          />
          <ComboboxPopover>
            <ComboboxList>
              {status === "OK" &&
                data.map(({ place_id, description }) => (
                  <ComboboxOption key={place_id} value={`${description}|${place_id}`} />
                ))}
            </ComboboxList>
          </ComboboxPopover>
        </Combobox>

        <input
          className={isNewEntryFieldsVisible ? "show-element margin-left-20" : "hide-element"}
          type="checkbox"
          id="isAnchorCheckbox"
          name="isAnchorCheckbox"
          onChange={e => setIsAnchor(e.target.checked)}
        />
        <label
          className={isNewEntryFieldsVisible ? "show-element" : "hide-element"}
          for="isAnchorCheckbox">Anchor
        </label>

        <Dropdown
          className={isNewEntryFieldsVisible ? "show-element daysDropdown margin-left-20" : "hide-element"}
          options={daysOptions}
          onChange={setSelectedDay}
          value={selectedDay}
          placeholder="Select a day (optional)"
        />;

        <button
          type="submit"
          className={isNewEntryFieldsVisible ? "show-element submitButton margin-left-20" : "hide-element"}
        >
          Submit
        </button>

      </form>
    </div>
  );
}

export default App;
