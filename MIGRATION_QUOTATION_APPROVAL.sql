-- Add quote_status column to inquiries table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiries' AND column_name = 'quote_status') THEN
        ALTER TABLE inquiries ADD COLUMN quote_status TEXT DEFAULT 'Draft';
    END IF;
END $$;

-- Drop function if exists to update it
DROP FUNCTION IF EXISTS get_pending_quotes;

-- Create function to get pending quotes
CREATE OR REPLACE FUNCTION get_pending_quotes()
RETURNS TABLE (
    inquiry_id UUID,
    sales_rep TEXT,
    customer_name TEXT,
    est_revenue NUMERIC,
    est_gp NUMERIC,
    service_type TEXT,
    quote_status TEXT,
    created_at TIMESTAMPTZ,
    origin TEXT,
    destination TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id as inquiry_id,
        p.full_name as sales_rep,
        i.customer_name,
        i.est_revenue,
        i.est_gp,
        i.service_type,
        i.quote_status,
        i.created_at,
        i.origin,
        i.destination
    FROM inquiries i
    JOIN profiles p ON i.user_id = p.id
    WHERE i.quote_status = 'Pending Approval'
    ORDER BY i.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to approve quote
CREATE OR REPLACE FUNCTION approve_quote(p_inquiry_id UUID, p_approved_by UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE inquiries
    SET quote_status = 'Approved'
    WHERE id = p_inquiry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to reject quote
CREATE OR REPLACE FUNCTION reject_quote(p_inquiry_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE inquiries
    SET quote_status = 'Rejected' -- Or back to Draft
    WHERE id = p_inquiry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to request approval
CREATE OR REPLACE FUNCTION request_quote_approval(p_inquiry_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE inquiries
    SET quote_status = 'Pending Approval'
    WHERE id = p_inquiry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
