import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  IconButton,
  Input,
  SkeletonText,
  Text,
} from "@chakra-ui/react";
import { FaLocationArrow, FaTimes } from "react-icons/fa";

import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
  InfoBox,
} from "@react-google-maps/api";

import React, { useEffect, useState, useRef } from "react";

const center = { lat: 42.698334, lng: 23.319941 };

const setCenter = (lat, long) => {
  if (lat) {
    center.lat = lat;
  }
  if (long) {
    center.lng = long;
  }
};

window.navigator.geolocation.getCurrentPosition((pos) =>
  setCenter(pos.coords.latitude, pos.coords.longitude)
);

const libraries = ["places"];
const options = {
  googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  libraries,
};
function App() {
  const { isLoaded } = useJsApiLoader(options);
  const [autocompleteOrigin, setAutocompleteOrigin] = useState(null);
  const [autocompleteDestination, setAutocompleteDestination] = useState(null);
  const [map, setMap] = useState(/** @type google.maps.Map */ (null));
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");

  const [markers, setMarkers] = useState([]);
  const [showInfo, setShowInfo] = useState(false);
  const [currentMarker, setCurrentMarker] = useState(null);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const originRef = useRef("");
  const destinationRef = useRef("");

  if (!isLoaded) {
    return <SkeletonText />;
  }

  async function calculateRoute() {
    if (origin === "" || destination === "") {
      return;
    }
    const originCoord = origin.latLng;
    const destinationCoord = destination.latLng;
    console.log(destination);
    // eslint-disable-next-line no-undef
    const directionsService = new google.maps.DirectionsService();
    const results = await directionsService.route({
      origin: originCoord,
      destination: destinationCoord,
      // eslint-disable-next-line no-undef
      travelMode: google.maps.TravelMode.DRIVING,
    });
    setDirectionsResponse(results);
    setDistance(results.routes[0].legs[0].distance.text);
    setDuration(results.routes[0].legs[0].duration.text);
  }

  function clearRoute() {
    setDirectionsResponse(null);
    setDistance("");
    setDuration("");
    setOrigin("");
    setDestination("");
  }

  const getMapOptions = (maps) => {
    return {
      streetViewControl: false,
      scaleControl: true,
      fullscreenControl: false,
      styles: [
        {
          featureType: "poi.business",
          elementType: "labels",
          stylers: [
            {
              visibility: "off",
            },
          ],
        },
      ],
      gestureHandling: "greedy",
      disableDoubleClickZoom: true,
      minZoom: 11,
      maxZoom: 18,

      mapTypeControl: true,
      mapTypeId: maps.MapTypeId.SATELLITE,
      mapTypeControlOptions: {
        style: maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: maps.ControlPosition.BOTTOM_CENTER,
        mapTypeIds: [
          maps.MapTypeId.ROADMAP,
          maps.MapTypeId.SATELLITE,
          maps.MapTypeId.HYBRID,
        ],
      },

      zoomControl: true,
      clickableIcons: false,
    };
  };

  const showClicks = (place) => {
    const latLng = place.latLng;

    const marker = <Marker position={latLng} />;
    setMarkers((state) => [...state, marker]);
    setOrigin({
      latLng: { lat: center.lat, lng: center.lng },
    });
    setDestination({
      name: place,
      latLng: place.latLng,
    });
  };

  const removeMarker = (markerToRemove) => {
    setMarkers((state) => [
      ...state.filter((m) => {
        return m.props.position !== markerToRemove.latLng;
      }),
    ]);
  };

  const showInfoBox = (marker) => {
    setCurrentMarker(marker);
    setShowInfo(true);
  };

  return (
    <Flex
      position="relative"
      flexDirection="column"
      alignItems="center"
      h="100vh"
      w="100vw"
    >
      <Box position="absolute" left={0} top={0} h="100%" w="100%">
        {/* Google Map Box */}
        <GoogleMap
          center={center}
          zoom={15}
          mapContainerStyle={{ width: "100%", height: "100%" }}
          options={(map) => getMapOptions(map)}
          onLoad={(map) => setMap(map)}
          onClick={showClicks}
        >
          <Marker
            icon={{
              path: "M8 12l-4.7023 2.4721.898-5.236L.3916 5.5279l5.2574-.764L8 0l2.3511 4.764 5.2574.7639-3.8043 3.7082.898 5.236z",
              fillColor: "yellow",
              fillOpacity: 0.9,
              scale: 2,
              strokeColor: "gold",
              strokeWeight: 2,
            }}
            position={center}
          />
          {markers.map((m) => {
            return (
              <Marker
                key={m.id}
                onDblClick={removeMarker}
                onClick={(marker) => showInfoBox(marker)}
                icon={
                  "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png"
                }
                position={m.props.position}
              />
            );
          })}

          {directionsResponse && (
            <DirectionsRenderer directions={directionsResponse} />
          )}
          {showInfo && (
            <InfoBox
              position={currentMarker.latLng}
              onCloseClick={() => setShowInfo(false)}
              onUnmount={() => setCurrentMarker(null)}
            >
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  background: "#fff",
                  padding: "10px",
                }}
              >
                <div>Position: {JSON.stringify(currentMarker.latLng)}</div>
              </div>
            </InfoBox>
          )}
        </GoogleMap>
      </Box>
      <Box
        p={4}
        borderRadius="lg"
        m={4}
        bgColor="white"
        shadow="base"
        minW="container.md"
        zIndex="1"
      >
        <HStack spacing={2} justifyContent="space-between">
          <Box flexGrow={1}>
            <Autocomplete
              onLoad={(a) => !autocompleteOrigin && setAutocompleteOrigin(a)}
              onPlaceChanged={() => {
                const place = autocompleteOrigin.getPlace();
                originRef.current = place.formatted_address;
                setOrigin({
                  name: place?.formatted_address,
                  latLng: place?.geometry.location,
                });
              }}
            >
              <Input type="text" placeholder="Origin" ref={originRef} />
            </Autocomplete>
          </Box>
          <Box flexGrow={1}>
            <Autocomplete
              onLoad={(a) =>
                !autocompleteDestination && setAutocompleteDestination(a)
              }
              onPlaceChanged={() => {
                const place = autocompleteDestination.getPlace();
                destinationRef.current = place.formatted_address;
                setDestination({
                  name: place.formatted_address,
                  latLng: place.geometry.location,
                });
              }}
            >
              <Input
                type="text"
                placeholder="Destination"
                ref={destinationRef}
              />
            </Autocomplete>
          </Box>

          <ButtonGroup>
            <Button colorScheme="pink" type="submit" onClick={calculateRoute}>
              Calculate Route
            </Button>
            <IconButton
              aria-label="center back"
              icon={<FaTimes />}
              onClick={clearRoute}
            />
          </ButtonGroup>
        </HStack>
        <HStack spacing={4} mt={4} justifyContent="space-between">
          <Text>Distance: {distance} </Text>
          <Text>Duration: {duration} </Text>
          <IconButton
            aria-label="center back"
            icon={<FaLocationArrow />}
            isRound
            onClick={() => {
              map.panTo(center);
              map.setZoom(15);
            }}
          />
        </HStack>
      </Box>
    </Flex>
  );
}

export default App;
