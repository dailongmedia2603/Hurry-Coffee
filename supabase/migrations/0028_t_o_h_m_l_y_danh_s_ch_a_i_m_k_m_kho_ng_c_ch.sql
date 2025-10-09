CREATE OR REPLACE FUNCTION get_locations_with_distance(
    p_lat double precision,
    p_lon double precision
)
RETURNS TABLE (
    id uuid,
    name text,
    address text,
    image_url text,
    opening_hours text,
    google_maps_url text,
    latitude double precision,
    longitude double precision,
    distance double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.name,
        l.address,
        l.image_url,
        l.opening_hours,
        l.google_maps_url,
        l.latitude,
        l.longitude,
        haversine_distance(p_lat, p_lon, l.latitude, l.longitude) as distance
    FROM
        public.locations l
    ORDER BY
        distance;
END;
$$;