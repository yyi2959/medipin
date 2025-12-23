// src/components/Map.jsx
import { useEffect, useRef } from "react";
import { API_BASE_URL } from "../api/config";
/* global kakao */

export default function Map({
  filterType = "all",
  radius = 1000,
  searchQuery = "",
  currentCity = "",
  onResultsChange,
  selectedItem,
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const clustererRef = useRef(null);
  const infoWindowRef = useRef(null);
  const geocoderRef = useRef(null);

  const myLocationRef = useRef(null);
  const radiusCircleRef = useRef(null);

  const markersRef = useRef({
    hospital: [],
    pharmacy: [],
    convenience: [],
  });

  const API_URL = `${API_BASE_URL}/map`;

  const waitForKakao = () =>
    new Promise((resolve, reject) => {
      if (window.kakao && window.kakao.maps) {
        return resolve(window.kakao);
      }

      let count = 0;
      const timer = setInterval(() => {
        count++;
        if (window.kakao && window.kakao.maps) {
          clearInterval(timer);
          resolve(window.kakao);
        }
        if (count > 50) {
          clearInterval(timer);
          reject(new Error("Kakao SDK load timeout"));
        }
      }, 100);
    });

  /* --------------------------------------------------
      거리 계산
  -------------------------------------------------- */
  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const toRad = (v) => (v * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  /* --------------------------------------------------
      마커 생성 함수
  -------------------------------------------------- */
  const createMarkers = (data, type) => {
    const map = mapInstance.current;

    const imageMap = {
      hospital:
        "https://postfiles.pstatic.net/MjAyNTEyMDlfODYg/MDAxNzY1MjU4NTgxMTE3.OR1zSpBxdcgRJ3VwdV_GHl9qojPdx9JQmyy2Bz-XQ8og.aSJDea3drP1B7zcwZc-V02F42kqp3XR9BR7liqI8h40g.PNG/hospital.png?type=w966",
      pharmacy:
        "https://postfiles.pstatic.net/MjAyNTEyMDlfMjY1/MDAxNzY1MjU4ODI0ODI4._p_9MD5vjkfIGL_iIUBCSVHhx5JTAG9wqhRkxrmuei0g.Mo5O6ZABPabGYjuAScmOmCcab_BYlKUwcf-SjEnWVk0g.PNG/pill-removebg-preview.png?type=w966",
      convenience:
        "https://postfiles.pstatic.net/MjAyNTEyMDlfMjUx/MDAxNzY1MjU4NTgxMTE3.Ruq6sQhusMsEEGY4E5bDbIDr5CdgsO3FM9urY0_iykwg.dm7HDIzMQOfLV3zzyl80gPdXdW54XNJWjDEVKuCg6_Qg.PNG/conveni.png?type=w966",
    };

    const markerImage = new kakao.maps.MarkerImage(
      imageMap[type],
      new kakao.maps.Size(32, 37)
    );

    const markers = data.map((item) => {
      const pos = new kakao.maps.LatLng(Number(item.lat), Number(item.lng));

      const marker = new kakao.maps.Marker({
        position: pos,
        image: markerImage,
      });

      marker.data = { ...item, type };

      kakao.maps.event.addListener(marker, "click", () => {
        infoWindowRef.current.setContent(`
          <div style="padding:8px;font-size:13px;">
            <strong>${item.name}</strong><br/>
            ${item.address || ""}
          </div>
        `);
        infoWindowRef.current.open(map, marker);

        onResultsChange([marker.data]);
      });

      return marker;
    });

    markersRef.current[type] = markers;
  };

  /* --------------------------------------------------
      영역 내 데이터 로딩 (Viewport-based Loading)
  -------------------------------------------------- */
  const fetchMarkersInBounds = async () => {
    if (!mapInstance.current) return;

    // 1. 현재 지도의 영역(Bounds) 가져오기
    const bounds = mapInstance.current.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    // 2. 쿼리 파라미터 구성
    const params = `?north=${ne.getLat()}&south=${sw.getLat()}&east=${ne.getLng()}&west=${sw.getLng()}`;

    // 3. API 호출
    const urls = [
      `${API_URL}/hospitals${params}`,
      `${API_URL}/pharmacies${params}`,
      `${API_URL}/convenience-stores`, // 편의점은 좌표계 변환 문제로 전체 / 일부만 가져옴(limit = 200)
    ];

    try {
      // 기존 마커 클러스터 초기화 (새로운 영역 데이터로 갱신)
      // 단, 기존 마커를 전부 지우면 깜빡임이 있을 수 있으나, 1만개 렌더링 방지를 위해 초기화가 유리함.
      if (clustererRef.current) {
        clustererRef.current.clear();
      }
      markersRef.current = { hospital: [], pharmacy: [], convenience: [] };


      const responses = await Promise.all(urls.map((u) => fetch(u)));
      const [hospitals, pharmacies, stores] = await Promise.all(
        responses.map((r) => r.json())
      );

      createMarkers(hospitals, "hospital");
      createMarkers(pharmacies, "pharmacy");
      createMarkers(stores, "convenience");

      applyFilter(); // 필터 재적용 (거리 제한 등)
    } catch (err) {
      console.error("API 로딩 오류:", err);
    }
  };

  // 디바운스 유틸리티 (지도 이동 시 너무 잦은 호출 방지)
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  /* --------------------------------------------------
      지도 초기화
  -------------------------------------------------- */
  useEffect(() => {
    let isMounted = true;

    waitForKakao()
      .then((kakao) => {
        if (!isMounted) return;

        kakao.maps.load(() => {
          const map = new kakao.maps.Map(mapRef.current, {
            center: new kakao.maps.LatLng(36.5, 127.8),
            level: 6,
          });

          mapInstance.current = map;

          infoWindowRef.current = new kakao.maps.InfoWindow({ zIndex: 5 });
          geocoderRef.current = new kakao.maps.services.Geocoder();

          clustererRef.current = new kakao.maps.MarkerClusterer({
            map,
            averageCenter: true,
            minLevel: 5,
            disableClickZoom: true,
          });

          // 이벤트 리스너: 지도 이동/줌 종료 시 데이터 다시 로드
          const handleBoundsChanged = debounce(() => {
            fetchMarkersInBounds();
          }, 500); // 500ms 디바운스

          kakao.maps.event.addListener(map, 'dragend', handleBoundsChanged);
          kakao.maps.event.addListener(map, 'zoom_changed', handleBoundsChanged);

          // 초기 로딩
          moveToMyLocation();

          // moveToMyLocation은 비동기이므로, 약간의 지연 후 초기 데이터 로드 (또는 moveToMyLocation 내부에서 호출 권장)
          // 여기서는 안전하게 초기 1회 bounds 로딩 시도 (단, center가 아직 안 잡혔을 수 있음)
          setTimeout(() => {
            if (mapInstance.current) fetchMarkersInBounds();
          }, 500);

          setTimeout(() => map.relayout(), 100);
        });
      })
      .catch((err) => {
        console.error("❌ Kakao SDK not loaded", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  /* --------------------------------------------------
      현재 위치
  -------------------------------------------------- */
  const moveToMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        myLocationRef.current = { lat: latitude, lng: longitude };

        const loc = new kakao.maps.LatLng(latitude, longitude);
        mapInstance.current.setCenter(loc);

        if (radiusCircleRef.current)
          radiusCircleRef.current.setMap(null);

        radiusCircleRef.current = new kakao.maps.Circle({
          center: loc,
          radius,
          map: mapInstance.current,
          fillColor: "#2979ff",
          fillOpacity: 0.25,
          strokeColor: "#2979ff",
        });

        applyFilter();
      },
      () => {
        // 권한 거부 시 기본 위치
        myLocationRef.current = { lat: 36.5, lng: 127.8 };
        applyFilter();
      }
    );
  };

  /* --------------------------------------------------
      필터 적용
  -------------------------------------------------- */
  const applyFilter = () => {
    if (!clustererRef.current || !myLocationRef.current) return;

    clustererRef.current.clear();

    const { lat, lng } = myLocationRef.current;

    let targets = [];

    if (filterType === "all" || filterType === "hospital")
      targets.push(...markersRef.current.hospital);

    if (filterType === "all" || filterType === "pharmacy")
      targets.push(...markersRef.current.pharmacy);

    if (filterType === "all" || filterType === "convenience")
      targets.push(...markersRef.current.convenience);

    const filtered = targets.filter((m) => {
      if (searchQuery && !m.data.name.includes(searchQuery)) return false;

      if (currentCity && m.data.address && !m.data.address.includes(currentCity))
        return false;

      const dist = getDistance(lat, lng, m.data.lat, m.data.lng);
      return dist <= radius;
    });

    clustererRef.current.addMarkers(filtered);

    onResultsChange(filtered.map((m) => m.data));
  };

  useEffect(() => {
    applyFilter();
  }, [radius, searchQuery, filterType]);

  /* --------------------------------------------------
      도시 변경 시 지도 이동 (Geocoding)
  -------------------------------------------------- */
  /* --------------------------------------------------
      도시 변경 시 지도 이동 (Geocoding)
  -------------------------------------------------- */
  useEffect(() => {
    if (!currentCity || !geocoderRef.current || !mapInstance.current) return;

    geocoderRef.current.addressSearch(currentCity, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
        const lat = parseFloat(result[0].y);
        const lng = parseFloat(result[0].x);

        // 1. 지도 중심 이동
        mapInstance.current.setCenter(coords);
        mapInstance.current.setLevel(7); // 적당한 레벨로 줌아웃

        // 2. 검색 중심점(myLocationRef)을 해당 도시로 변경
        // 그래야 applyFilter가 이 위치를 기준으로 반경 검색을 수행함
        myLocationRef.current = { lat, lng };

        // 3. 반경 원(Circle)도 이동
        if (radiusCircleRef.current) {
          radiusCircleRef.current.setMap(null); // 기존 원 삭제
        }
        radiusCircleRef.current = new kakao.maps.Circle({
          center: coords,
          radius,
          map: mapInstance.current,
          fillColor: "#2979ff",
          fillOpacity: 0.25,
          strokeColor: "#2979ff",
        });

        // 4. 이동 후 데이터 로딩 (약간의 지연 후)
        setTimeout(() => {
          fetchMarkersInBounds();
        }, 100);
      }
    });
  }, [currentCity]);

  /* --------------------------------------------------
      리스트 클릭 → 지도 이동
  -------------------------------------------------- */
  useEffect(() => {
    if (!selectedItem || !mapInstance.current) return;

    const loc = new kakao.maps.LatLng(selectedItem.lat, selectedItem.lng);

    mapInstance.current.setCenter(loc);
    infoWindowRef.current.setContent(`
      <div style="padding:8px;font-size:13px;">
        <strong>${selectedItem.name}</strong><br/>
        ${selectedItem.address || ""}
      </div>
    `);

    infoWindowRef.current.open(mapInstance.current, {
      getPosition: () => loc,
    });
  }, [selectedItem]);

  return <div ref={mapRef} className="map" />;
}
