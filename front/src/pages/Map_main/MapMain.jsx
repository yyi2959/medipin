import React, { useEffect, useRef, useState } from "react";
import { InputBar } from "../../components/InputBar/InputBar";
import FilterIconGroup from "../../components/FilterIconGroup/FilterIconGroup";
import MapList from "../../components/MapList/MapList";
import { HomeBar } from "../../components/HomeBar/HomeBar";
import { API_BASE_URL } from "../../api/config"; // HomeBar 추가
import ambulanceIcon from "../../assets/ambulance.svg";

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

          clustererRef.current = new kakao.maps.MarkerClusterer({
            map: map,
            averageCenter: true,
            minLevel: 5,
            disableClickZoom: true,
          });

          // 디바운스 처리된 이벤트 핸들러
          const handleMapEvent = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
              fetchMarkersInBounds();
            }, 300); // 300ms 디바운스
          };

          kakao.maps.event.addListener(map, 'dragend', handleMapEvent);
          kakao.maps.event.addListener(map, 'zoom_changed', handleMapEvent);

          // ⭐ 지도 빈 곳 클릭 시 바텀시트 닫기 & 선택 해제
          kakao.maps.event.addListener(map, 'click', () => {
            setSheetState(SHEET.CLOSED);
            setSelectedPlace(null);
          });

          fetchMarkersInBounds();
          moveToMyLocation();
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
      const responses = await Promise.all(urls.map(u => fetch(u)));
      const [hospitals, pharmacies, stores, emergencies] = await Promise.all(responses.map(r => r.json()));



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
      hospital: "https://postfiles.pstatic.net/MjAyNTEyMDlfODYg/MDAxNzY1MjU4NTgxMTE3.OR1zSpBxdcgRJ3VwdV_GHl9qojPdx9JQmyy2Bz-XQ8og.aSJDea3drP1B7zcwZc-V02F42kqp3XR9BR7liqI8h40g.PNG/hospital.png?type=w966",
      pharmacy: "https://postfiles.pstatic.net/MjAyNTEyMDlfMjY1/MDAxNzY1MjU4ODI0ODI4._p_9MD5vjkfIGL_iIUBCSVHhx5JTAG9wqhRkxrmuei0g.Mo5O6ZABPabGYjuAScmOmCcab_BYlKUwcf-SjEnWVk0g.PNG/pill-removebg-preview.png?type=w966",
      convenience: "https://postfiles.pstatic.net/MjAyNTEyMDlfMjUx/MDAxNzY1MjU4NTgxMTE3.Ruq6sQhusMsEEGY4E5bDbIDr5CdgsO3FM9urY0_iykwg.dm7HDIzMQOfLV3zzyl80gPdXdW54XNJWjDEVKuCg6_Qg.PNG/conveni.png?type=w966",
      emergency: ambulanceIcon,
    };

    const markerImage = new window.kakao.maps.MarkerImage(
      imageMap[type],
      new window.kakao.maps.Size(32, 32)
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

    // 필터 체크
    if (filters.hospital) targets.push(...markersRef.current.hospital);
    if (filters.pharmacy) targets.push(...markersRef.current.pharmacy);
    if (filters.constore) targets.push(...markersRef.current.convenience);
    if (filters.sos) targets.push(...markersRef.current.emergency);

    // (선택) 키워드 검색 필터링
    if (keyword.trim()) {
      targets = targets.filter(m => m.data.name.includes(keyword) || (m.data.address && m.data.address.includes(keyword)));
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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const loc = new window.kakao.maps.LatLng(lat, lng);
        if (mapInstance.current) {
          mapInstance.current.setCenter(loc);
          mapInstance.current.setLevel(4);

          // 내 위치 마커 표시
          if (myLocationOverlayRef.current) {
            myLocationOverlayRef.current.setMap(null);
          }
          const content = `<div class="my-location-dot"></div>`;
          myLocationOverlayRef.current = new window.kakao.maps.CustomOverlay({
            position: loc,
            content: content,
            zIndex: 1
          });
          myLocationOverlayRef.current.setMap(mapInstance.current);
        }
      });
    }
  };

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
