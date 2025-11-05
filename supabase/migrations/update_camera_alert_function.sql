-- Update camera alert status function to remove solar panel 'OK' vs 'Ext OK' check
-- After firmware update, solar panels may show 'OK' which is now normal behavior

CREATE OR REPLACE FUNCTION "public"."update_camera_alert_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Reset alert status
  NEW.needs_attention = false;
  NEW.alert_reason = NULL;

  -- Check for issues and set alerts
  DECLARE
    issues text[] = '{}';
    has_solar boolean;
  BEGIN
    -- Get solar panel info
    SELECT cd.has_solar_panel INTO has_solar
    FROM camera_deployments cd
    WHERE cd.id = NEW.deployment_id;

    -- Battery alerts (only Low or Critical - post-firmware update behavior)
    -- Note: After firmware update, solar panels may show 'OK' instead of 'Ext OK'
    --       This is now considered normal behavior and not an alert condition
    IF NEW.battery_status = 'Low' OR NEW.battery_status = 'Critical' THEN
      issues = array_append(issues, 'Low battery');
    END IF;

    -- Storage alerts
    IF NEW.sd_free_space_mb IS NOT NULL AND NEW.sd_free_space_mb < 500 THEN
      issues = array_append(issues, 'Low storage');
    END IF;

    -- Connectivity alerts
    IF NEW.signal_level IS NOT NULL AND NEW.signal_level LIKE '%Poor%' THEN
      issues = array_append(issues, 'Poor signal');
    END IF;

    -- Queue backup alerts
    IF NEW.image_queue IS NOT NULL AND NEW.image_queue > 20 THEN
      issues = array_append(issues, 'High image queue');
    END IF;

    -- Set alert if any issues found
    IF array_length(issues, 1) > 0 THEN
      NEW.needs_attention = true;
      NEW.alert_reason = array_to_string(issues, ', ');
    END IF;

    RETURN NEW;
  END;
END;
$$;
