import React, { useEffect, useRef, useState } from "react";
import { InputBar } from "../../components/InputBar/InputBar";
import FilterIconGroup from "../../components/FilterIconGroup/FilterIconGroup";
import MapList from "../../components/MapList/MapList";
import { HomeBar } from "../../components/HomeBar/HomeBar";
import { API_BASE_URL } from "../../api/config";

import hospitalIcon from "../../components/FilterIconGroup/Hospital_icon.svg";
import pharmacyIcon from "../../components/FilterIconGroup/Pharmacy_icon.svg";
import convIcon from "../../components/FilterIconGroup/Constore_icon.svg";
import sosIcon from "../../components/FilterIconGroup/Sos_icon.svg";

import "./style.css";

const SHEET = {
  CLOSED: "CLOSED",
  MIN: "MIN",
  FULL: "FULL",
};

export const MapMain = () => {
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const clustererRef = useRef(null);
  const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // 서울시청 기준
  const markersRef = useRef({
    hospital: [],
    pharmacy: [],
    convenience: [],
    emergency: [], // 응급실
  });
  const myLocationOverlayRef = useRef(null); // 내 위치 오버레이
  const timerRef = useRef(null); // 디바운스 타이머 Refs

  // 데이터 상태
  const [searchText, setSearchText] = useState(""); // 검색창 입력값
  const [keyword, setKeyword] = useState("");      // 실제 필터링 키워드
  const [sheetState, setSheetState] = useState(SHEET.CLOSED);
  const [visiblePlaces, setVisiblePlaces] = useState([]); // 리스트에 보여줄 데이터
  const [selectedPlace, setSelectedPlace] = useState(null); // 선택된 장소 상세 정보

  // 필터 상태
  const [filters, setFilters] = useState({
    hospital: true,
    pharmacy: true,
    sos: false,
    constore: false, // 편의점
    now: false,
    favorites: false,
  });

  // Sidebar States - REMOVED
  // const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [radius, setRadius] = useState(1000);
  const [currentCity, setCurrentCity] = useState("");
  const geocoderRef = useRef(null);
  const radiusCircleRef = useRef(null); // 반경 원 Overlay

  // 클로저 문제 해결을 위한 Refs
  const filtersRef = useRef(filters);
  const keywordRef = useRef(keyword);

  // 상태 동기화
  useEffect(() => { filtersRef.current = filters; }, [filters]);
  useEffect(() => { keywordRef.current = keyword; }, [keyword]);


  const API_URL = `${API_BASE_URL}/map`;

  /* 필터 토글 */
  const toggleFilter = (key) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // 상태 업데이트 후 로직은 useEffect[filters]에서 처리됨
      return next;
    });

    // 편의상 병원/약국 필터 켜면 시트 살짝 열기 (UX 결정사항)
    if (key === "hospital" || key === "pharmacy") {
      setSheetState(SHEET.MIN);
    }
  };

  /* ------------------------------------------------------------------
     Kakao Map 초기화
     ------------------------------------------------------------------ */
  const waitForKakao = () =>
    new Promise((resolve, reject) => {
      if (window.kakao && window.kakao.maps) {
        return resolve(window.kakao);
      }
      let count = 0;
      const timer = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          clearInterval(timer);
          resolve(window.kakao);
        }
        if (count++ > 50) {
          clearInterval(timer);
          reject(new Error("Kakao SDK load timeout"));
        }
      }, 100);
    });

  useEffect(() => {
    let isMounted = true;

    waitForKakao()
      .then((kakao) => {
        if (!isMounted) return;

        const container = mapContainerRef.current;
        kakao.maps.load(() => {
          const options = {
            center: new kakao.maps.LatLng(37.5665, 126.978),
            level: 4,
          };
          const map = new kakao.maps.Map(container, options);
          mapInstance.current = map;

          // 클러스터러 설정 보완 (모바일 밀집도 고려)
          clustererRef.current = new kakao.maps.MarkerClusterer({
            map: map,
            averageCenter: true,
            minLevel: 6, // 클러스터링 시작 레벨 조정
            disableClickZoom: false, // 클릭 시 줌인 허용
            styles: [{
              width: '40px', height: '40px',
              background: 'rgba(51, 204, 255, .8)',
              borderRadius: '20px',
              color: '#000',
              textAlign: 'center',
              fontWeight: 'bold',
              lineHeight: '40px'
            }]
          });

          geocoderRef.current = new kakao.maps.services.Geocoder();

          // 모바일 최적화 이벤트: 드래그 종료 및 확대/축소 시 즉시 갱신
          const handleMapIdle = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
              fetchMarkersInBounds();
            }, 100); // 반응성 상향 (300ms -> 100ms)
          };

          kakao.maps.event.addListener(map, 'dragend', handleMapIdle);
          kakao.maps.event.addListener(map, 'zoom_changed', handleMapIdle);

          // 이동할 때마다 마지막 위치 저장
          kakao.maps.event.addListener(map, 'idle', () => {
            const center = map.getCenter();
            localStorage.setItem("last_map_lat", center.getLat());
            localStorage.setItem("last_map_lng", center.getLng());
          });

          kakao.maps.event.addListener(map, 'click', () => {
            setSheetState(SHEET.CLOSED);
            setSelectedPlace(null);
          });

          // 초기 로드 시퀀스 개선
          const initUserLocation = async () => {
            await moveToMyLocation();
            // moveToMyLocation 내부에서 fetchMarkersInBounds 호출함
          };

          initUserLocation();
          updateRadiusCircle();
        });
      })
      .catch((err) => {
        console.error("Kakao SDK loading failed", err);
      });

    return () => {
      isMounted = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      // 리스너 제거는 카카오맵 API 특성상 인스턴스가 사라지면 자동 해제되거나,
      // 명시적으로 removeListener를 해야하지만 여기서는 mapInstance가 ref로 관리되므로 생략하거나 추후 보강
    };
  }, []); // Mount 시 1회

  /* ------------------------------------------------------------------
     데이터 Fetching (Viewport Based)
     ------------------------------------------------------------------ */
  const fetchMarkersInBounds = async () => {
    if (!mapInstance.current) return;

    const bounds = mapInstance.current.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    // 쿼리 파라미터
    const params = `?north=${ne.getLat()}&south=${sw.getLat()}&east=${ne.getLng()}&west=${sw.getLng()}`;

    // API 호출 목록 (필터에 따라 요청 최소화 가능하지만, 일단 다 불러와서 클라이언트 필터링)
    // 실제로는 서버 부하 줄이려면 filters 상태 보고 요청 여부 결정 권장
    const urls = [
      `${API_URL}/hospitals${params}`,
      `${API_URL}/pharmacies${params}`,
      `${API_URL}/convenience-stores${params}`,
      `${API_URL}/hospitals/emergency${params}`, // 응급실 추가
    ];

    try {
      console.log("Fetching map data with params:", params);
      const responses = await Promise.all(urls.map(u => fetch(u, {
        headers: { "Accept": "application/json" }
      }).catch(err => {
        console.error(`Fetch failed for ${u}:`, err);
        return { ok: false };
      })));

      const data = await Promise.all(responses.map(r => {
        if (r.ok) return r.json();
        return [];
      }));

      const [hospitals, pharmacies, stores, emergencies] = data;
      console.log(`Loaded: H(${hospitals.length}), P(${pharmacies.length}), S(${stores.length}), E(${emergencies.length})`);

      // 기존 마커 데이터 갱신
      clearMarkers(); // 기존 마커 객체 제거 (메모리 관리)

      // 새 마커 생성 (지도에 바로 올리지 않고 배열에 저장)
      const newMarkers = {
        hospital: createMarkerObjects(hospitals, "hospital"),
        pharmacy: createMarkerObjects(pharmacies, "pharmacy"),
        convenience: createMarkerObjects(stores, "convenience"),
        emergency: createMarkerObjects(emergencies, "emergency"),
      };

      markersRef.current = newMarkers;

      // 필터 적용하여 지도 및 리스트에 반영
      applyFilter();

    } catch (err) {
      console.error("Map Data Fetch Error:", err);
    }
  };

  /* 마커 객체 생성 헬퍼 */
  const createMarkerObjects = (data, type) => {
    if (!Array.isArray(data)) return [];

    if (!window.kakao || !window.kakao.maps) return [];

    const imageMap = {
      hospital: hospitalIcon,
      pharmacy: pharmacyIcon,
      convenience: convIcon,
      emergency: sosIcon,
    };

    const markerImage = new window.kakao.maps.MarkerImage(
      imageMap[type],
      new window.kakao.maps.Size(32, 32), // 모바일에서 클릭하기 쉽게 크기 상향 (24 -> 32)
      { offset: new window.kakao.maps.Point(16, 16) }
    );

    return data.map((item) => {
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(item.lat, item.lng),
        image: markerImage,
      });
      marker.data = { ...item, type }; // 데이터 바인딩

      // 마커 클릭 시 상세 정보 바텀시트 열기
      window.kakao.maps.event.addListener(marker, 'click', () => {
        setSelectedPlace({ ...item, type });
        setSheetState(SHEET.MIN);
      });

      return marker;
    });
  };

  /* 마커 초기화 */
  const clearMarkers = () => {
    if (clustererRef.current) {
      clustererRef.current.clear();
    }
  };

  /* ------------------------------------------------------------------
     필터링 & 렌더링
     ------------------------------------------------------------------ */
  const applyFilter = () => {
    if (!clustererRef.current) return;

    clustererRef.current.clear(); // 클러스터 비우기

    let targets = [];
    const currentFilters = filtersRef.current; // Ref에서 최신 상태 참조

    // 필터 체크
    if (currentFilters.hospital) targets.push(...markersRef.current.hospital);
    if (currentFilters.pharmacy) targets.push(...markersRef.current.pharmacy);
    if (currentFilters.constore) targets.push(...markersRef.current.convenience);
    if (currentFilters.sos) targets.push(...markersRef.current.emergency);

    // (선택) 키워드 검색 필터링
    const currentKeyword = keywordRef.current;
    if (currentKeyword && currentKeyword.trim()) {
      targets = targets.filter(m => m.data.name.includes(currentKeyword) || (m.data.address && m.data.address.includes(currentKeyword)));
    }

    // 클러스터에 추가
    clustererRef.current.addMarkers(targets);

    // BottomSheet(리스트)에 전달할 데이터 추출
    const visibleData = targets.map(m => m.data);
    setVisiblePlaces(visibleData);
  };

  // 필터나 키워드 변경 시 재적용
  useEffect(() => {
    applyFilter();
  }, [filters, keyword]);


  const moveToMyLocation = () => {
    const handleLocationSuccess = (lat, lng) => {
      const loc = new window.kakao.maps.LatLng(lat, lng);
      if (mapInstance.current) {
        mapInstance.current.setCenter(loc);
        mapInstance.current.setLevel(4);

        if (myLocationOverlayRef.current) {
          myLocationOverlayRef.current.setMap(null);
        }
        const content = `<div class="my-location-dot"></div>`;
        myLocationOverlayRef.current = new window.kakao.maps.CustomOverlay({
          position: loc,
          content: content,
          zIndex: 5 // 마커보다 위에 표시
        });
        myLocationOverlayRef.current.setMap(mapInstance.current);

        fetchMarkersInBounds();
      }
    };

    const handleLocationError = (error) => {
      console.warn("Geolocation failed or denied. Using fallback center.", error);

      // 1. 마지막 검색 위치 확인
      const lastLat = localStorage.getItem("last_map_lat");
      const lastLng = localStorage.getItem("last_map_lng");

      let fallbackLoc;
      if (lastLat && lastLng) {
        fallbackLoc = new window.kakao.maps.LatLng(Number(lastLat), Number(lastLng));
      } else {
        // 2. 기본값 (서울시청)
        fallbackLoc = new window.kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
      }

      if (mapInstance.current) {
        mapInstance.current.setCenter(fallbackLoc);
        mapInstance.current.setLevel(4);
        fetchMarkersInBounds();
      }
    };

    // HTTPS 보안 환경 확인
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      console.warn("Geolocation requires HTTPS environment.");
      handleLocationError(new Error("Insecure Context"));
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => handleLocationSuccess(pos.coords.latitude, pos.coords.longitude),
        (err) => handleLocationError(err),
        {
          timeout: 5000,
          enableHighAccuracy: true,
          maximumAge: 0 // 항상 새로운 위치 정보 요청
        }
      );
    } else {
      handleLocationError(new Error("Not supported"));
    }
  };

  /* 도시 변경 핸들러 */
  const handleCityChange = (cityName) => {
    setCurrentCity(cityName);
    if (!cityName) {
      moveToMyLocation(); // 도시 해제 시 내 위치로
      return;
    }

    if (!geocoderRef.current || !mapInstance.current) return;

    geocoderRef.current.addressSearch(cityName, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
        mapInstance.current.setCenter(coords);
        mapInstance.current.setLevel(6); // 적당한 줌 레벨
        fetchMarkersInBounds(); // 이동 후 데이터 로딩
      }
    });
  };

  /* 반경 원 그리기 */
  const updateRadiusCircle = () => {
    if (!mapInstance.current) return;

    // 기존 원 제거
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setMap(null);
    }

    // 현재 지도 중심 기준 원 그리기
    const center = mapInstance.current.getCenter();

    radiusCircleRef.current = new window.kakao.maps.Circle({
      center: center,
      radius: radius, // m 단위
      strokeWeight: 1,
      strokeColor: '#75B8FA',
      strokeOpacity: 0.8,
      strokeStyle: 'solid',
      fillColor: '#CFE7FF',
      fillOpacity: 0.3
    });
    radiusCircleRef.current.setMap(mapInstance.current);
  };

  // Radius 변경 시 원 업데이트
  useEffect(() => {
    updateRadiusCircle();
  }, [radius]);

  // 선택된 장소로 지도 이동
  useEffect(() => {
    if (selectedPlace && mapInstance.current) {
      const moveLatLon = new window.kakao.maps.LatLng(selectedPlace.lat, selectedPlace.lng);
      mapInstance.current.panTo(moveLatLon);
      // 필요 시 줌 레벨 조정
      // mapInstance.current.setLevel(3); 
    }
  }, [selectedPlace]);

  return (
    <div className="map-main">
      {/* 상단 UI */}
      <div className="map-top-ui">
        <div className="map-ui-inner">
          <InputBar
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={() => setKeyword(searchText)} // 엔터/아이콘 클릭 시 필터 적용
            placeholder="병원, 약국 검색"
          />
          <FilterIconGroup
            filters={filters}
            onToggle={toggleFilter}
          />
        </div>
      </div>

      {/* 내 위치 이동 버튼 */}

      {/* 내 위치 이동 버튼 */}
      <button
        onClick={moveToMyLocation}
        style={{
          position: 'absolute',
          bottom: '180px', // MapList 위쪽
          right: '20px',
          zIndex: 20,
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '24px'
        }}
        title="내 위치로 이동"
      >
        🎯
      </button>

      {/* 지도 */}
      <div ref={mapContainerRef} className="kakao-map-layer" />

      {/* ⭐ Bottom Sheet */}
      <MapList
        sheetState={sheetState}
        setSheetState={setSheetState}
        places={visiblePlaces} // 데이터 전달
        selectedPlace={selectedPlace}
        setSelectedPlace={setSelectedPlace}
      />

      {/* 하단 네비게이션 */}
      <div className="bottom-nav-container">
        <HomeBar />
      </div>
    </div>
  );
};

export default MapMain;
