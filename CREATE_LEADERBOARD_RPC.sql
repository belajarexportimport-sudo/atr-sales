-- RPC Function: Get Leaderboard Data (Public, Bypasses RLS)
-- This function aggregates revenue per sales rep without exposing customer details

CREATE OR REPLACE FUNCTION get_leaderboard_data()
RETURNS TABLE (
    user_id UUID,
    total_revenue NUMERIC,
    total_gp NUMERIC,
    total_deals BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.user_id,
        COALESCE(SUM(i.est_revenue), 0) as total_revenue,
        COALESCE(SUM(i.est_gp), 0) as total_gp,
        COUNT(*)::BIGINT as total_deals
    FROM inquiries i
    WHERE i.status IN ('Won', 'Won - Verification at WHS', 'Invoiced', 'Paid')
    GROUP BY i.user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_leaderboard_data() TO authenticated;

-- Test the function
SELECT * FROM get_leaderboard_data();
