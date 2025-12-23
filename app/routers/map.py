# app/routers/map.py (수정된 최종 코드)

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import get_db
from pyproj import Transformer


transformer = Transformer.from_crs(
    "EPSG:5181",  # 또는 5179 / 실제 좌표계 확인
    "EPSG:4326",  # 위경도
    always_xy=True
)

# 🚨 수정: 라우터 변수 이름을 map_router로 변경합니다.
map_router = APIRouter(prefix="/map", tags=["Map"])

# 🚨 데코레이터도 map_router로 변경합니다.
@map_router.get("/hospitals")
def get_hospitals(
    db: Session = Depends(get_db),
    north: float = Query(None), # max_lat
    south: float = Query(None), # min_lat
    east: float = Query(None),  # max_lng
    west: float = Query(None)   # min_lng
):
    query_str = """
        SELECT
            name,
            y AS lat,
            x AS lng,
            address,
            tel,
            homepage
        FROM master_medical
        WHERE x IS NOT NULL
          AND y IS NOT NULL
    """
    params = {}
    
    if north is not None and south is not None and east is not None and west is not None:
        query_str += " AND y BETWEEN :south AND :north AND x BETWEEN :west AND :east"
        params = {"south": south, "north": north, "west": west, "east": east}
    
    # LIMIT to prevent overload
    query_str += " LIMIT 500"

    rows = db.execute(text(query_str), params).fetchall()

    return [
        {
            "name": r.name,
            "lat": float(r.lat),
            "lng": float(r.lng),
            "address": r.address,
            "tel": r.tel,
            "homepage": r.homepage if hasattr(r, 'homepage') else "",
        }
        for r in rows
    ]

transformer_reverse = Transformer.from_crs(
    "EPSG:4326",
    "EPSG:5181",
    always_xy=True
)

@map_router.get("/convenience-stores")
def get_convenience_stores(
    db: Session = Depends(get_db),
    north: float = Query(None),
    south: float = Query(None),
    east: float = Query(None),
    west: float = Query(None)
):
    query_str = """
        SELECT
            name,
            address,
            tel,
            x_coord,
            y_coord
        FROM safe_pharmacy
        WHERE x_coord IS NOT NULL
          AND y_coord IS NOT NULL
    """
    params = {}

    if north is not None and south is not None and east is not None and west is not None:
        # Front (WGS84) -> DB (EPSG:5181)
        # min_x, min_y = transformer_reverse.transform(west, south)
        # max_x, max_y = transformer_reverse.transform(east, north)
        # Note: 5181 y increases northwards, x increases eastwards usually.
        # But to be safe, we take min/max of the transformed corner points.
        
        x1, y1 = transformer_reverse.transform(west, south)
        x2, y2 = transformer_reverse.transform(east, north)
        
        min_x, max_x = sorted([x1, x2])
        min_y, max_y = sorted([y1, y2])

        query_str += " AND x_coord BETWEEN :min_x AND :max_x AND y_coord BETWEEN :min_y AND :max_y"
        params = {"min_x": min_x, "max_x": max_x, "min_y": min_y, "max_y": max_y}
    else:
        query_str += " LIMIT 200"

    rows = db.execute(text(query_str), params).fetchall()

    results = []
    for r in rows:
        try:
            lng, lat = transformer.transform(
                float(r.x_coord),
                float(r.y_coord)
            )

            results.append({
                "name": r.name,
                "lat": lat,
                "lng": lng,
                "address": r.address,
                "tel": r.tel,
            })
        except Exception:
            continue

    return results

@map_router.get("/pharmacies")
def get_pharmacies(
    db: Session = Depends(get_db),
    north: float = Query(None),
    south: float = Query(None),
    east: float = Query(None),
    west: float = Query(None)
):
    query_str = """
        SELECT
            `약국명`   AS name,
            `y`        AS lat,
            `x`        AS lng,
            `주소`     AS address,
            `전화번호` AS tel
        FROM pharmacy
        WHERE x IS NOT NULL
          AND y IS NOT NULL
    """
    params = {}

    if north is not None and south is not None and east is not None and west is not None:
        query_str += " AND y BETWEEN :south AND :north AND x BETWEEN :west AND :east"
        params = {"south": south, "north": north, "west": west, "east": east}
    
    query_str += " LIMIT 500"

    rows = db.execute(text(query_str), params).fetchall()

    return [
        {
            "name": r.name,
            "lat": float(r.lat),
            "lng": float(r.lng),
            "address": r.address,
            "tel": r.tel,
        }
        for r in rows

    ]

@map_router.get("/hospitals/emergency")
def get_emergency_hospitals(
    db: Session = Depends(get_db),
    north: float = Query(None),
    south: float = Query(None),
    east: float = Query(None),
    west: float = Query(None)
):
    # SQL Query optimized for 'LIKE' search on departments
    query_str = """
        SELECT
            name,
            y AS lat,
            x AS lng,
            address,
            tel,
            homepage,
            departments
        FROM master_medical
        WHERE x IS NOT NULL
          AND y IS NOT NULL
          AND (departments LIKE :kw1 OR departments LIKE :kw2)
    """
    params = {
        "kw1": "%응급의학과%",
        "kw2": "%한방응급%"
    }
    
    if north is not None and south is not None and east is not None and west is not None:
        query_str += " AND y BETWEEN :south AND :north AND x BETWEEN :west AND :east"
        params.update({"south": south, "north": north, "west": west, "east": east})
    
    query_str += " LIMIT 500"

    try:
        rows = db.execute(text(query_str), params).fetchall()
        
        results = []
        for r in rows:
            results.append({
                "name": r.name.strip() if r.name else "",
                "lat": float(r.lat),
                "lng": float(r.lng),
                "address": r.address.strip() if r.address else "",
                "tel": r.tel.strip() if r.tel else "",
                "homepage": r.homepage.strip() if hasattr(r, 'homepage') and r.homepage else "",
                # 'departments': r.departments # Optional: include if needed on frontend
            })
        return results

    except Exception as e:
        print(f"Error fetching emergency hospitals: {e}")
        return []