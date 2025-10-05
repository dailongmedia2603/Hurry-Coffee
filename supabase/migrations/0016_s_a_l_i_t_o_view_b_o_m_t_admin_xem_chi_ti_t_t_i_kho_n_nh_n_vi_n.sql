-- Create a view to join user and profile information
CREATE OR REPLACE VIEW public.staff_details AS
SELECT
    p.id,
    p.full_name,
    p.role,
    p.location_id,
    u.email,
    l.name as location_name
FROM
    public.profiles p
JOIN
    auth.users u ON p.id = u.id
LEFT JOIN
    public.locations l ON p.location_id = l.id
WHERE
    p.role IN ('staff', 'admin');

-- Grant SELECT permission on the view to authenticated users.
-- The underlying RLS policies on the 'profiles' table will handle security.
GRANT SELECT ON public.staff_details TO authenticated;