-- AUTOMATION TRIGGER
-- This ensures that if a user changes status to 'Lost' or 'Cancelled',
-- the system AUTOMATICALLY wipes the commission values instantly.
-- No need to run manual scripts ever again.

-- 1. Create the Function
CREATE OR REPLACE FUNCTION public.handle_lost_inquiry()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if status is changed to Lost or Cancelled
    IF NEW.status IN ('Lost', 'Cancelled') AND (OLD.status NOT IN ('Lost', 'Cancelled') OR OLD.status IS NULL) THEN
        NEW.est_commission := 0;
        NEW.commission_amount := 0;
        NEW.commission_status := 'Cancelled';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the Trigger
DROP TRIGGER IF EXISTS on_inquiry_lost ON public.inquiries;

CREATE TRIGGER on_inquiry_lost
BEFORE UPDATE ON public.inquiries
FOR EACH ROW
EXECUTE FUNCTION public.handle_lost_inquiry();
