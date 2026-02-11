-- ENABLE EXTENSION FOR HTTP REQUESTS
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- FUNCTION TO SYNC TO GOOGLE SHEET
CREATE OR REPLACE FUNCTION public.sync_awb_to_gsheet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payload JSONB;
  v_url TEXT := 'https://script.google.com/macros/s/AKfycbxGWqAOKQTuBnFtCjEq5CczzqcjS1mKjuM26VqYA0c8ioaZFmtj4JgwpfTZ3s3tNHoX/exec';
  v_request_id BIGINT;
BEGIN
  -- Only trigger if AWB Number is NEWLY added or CHANGED
  IF (OLD.awb_number IS NULL AND NEW.awb_number IS NOT NULL) OR 
     (OLD.awb_number <> NEW.awb_number) THEN
     
     -- Construct Payload
     v_payload := jsonb_build_object(
        'action', 'sync_shipment',
        'awb', NEW.awb_number,
        'customer', NEW.customer_name,
        'origin', COALESCE(NEW.origin, ''),
        'destination', COALESCE(NEW.destination, ''),
        'service', COALESCE(NEW.service_type, 'Air Freight'),
        'weight', COALESCE(NEW.weight, 0),
        'pieces', COALESCE(jsonb_array_length(NEW.packages), 1),
        'shipper', COALESCE(NEW.shipper_name, ''),
        'consignee', COALESCE(NEW.consignee_name, ''),
        'phone', COALESCE(NEW.consignee_phone, NEW.shipper_phone, ''), -- Added Phone
        'est_revenue', COALESCE(NEW.est_revenue, 0),
        'est_gp', COALESCE(NEW.est_gp, 0),
        'status', 'Created',
        'timestamp', NOW()
     );

     -- Send Async HTTP Request via pg_net
     -- Note: pg_net sends request asynchronously. Check net.http_request_queue for status.
     SELECT net.http_post(
        url := v_url,
        body := v_payload,
        headers := '{"Content-Type": "application/json"}'::jsonb
     ) INTO v_request_id;
     
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'GSheet Sync Failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- CREATE TRIGGER
DROP TRIGGER IF EXISTS trigger_sync_awb_gsheet ON inquiries;

CREATE TRIGGER trigger_sync_awb_gsheet
AFTER UPDATE ON inquiries
FOR EACH ROW
EXECUTE FUNCTION public.sync_awb_to_gsheet();
