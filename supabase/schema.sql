--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.5 (Debian 17.5-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";


--
-- Name: EXTENSION "pg_graphql"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "pg_graphql" IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pg_stat_statements"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "pg_stat_statements" IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pgcrypto"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "pgcrypto" IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";


--
-- Name: EXTENSION "supabase_vault"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "supabase_vault" IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: food_source_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."food_source_type" AS ENUM (
    'field',
    'feeder'
);


ALTER TYPE "public"."food_source_type" OWNER TO "postgres";

--
-- Name: stand_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."stand_type" AS ENUM (
    'ladder_stand',
    'bale_blind',
    'box_stand',
    'tripod',
    'ground_blind'
);


ALTER TYPE "public"."stand_type" OWNER TO "postgres";

--
-- Name: time_of_day; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."time_of_day" AS ENUM (
    'AM',
    'PM',
    'ALL'
);


ALTER TYPE "public"."time_of_day" OWNER TO "postgres";

--
-- Name: wind_direction; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."wind_direction" AS ENUM (
    'N',
    'NE',
    'E',
    'SE',
    'S',
    'SW',
    'W',
    'NW'
);


ALTER TYPE "public"."wind_direction" OWNER TO "postgres";

--
-- Name: backfill_hunt_weather_data(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."backfill_hunt_weather_data"() RETURNS TABLE("updated_hunts" integer)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  update_count INTEGER;
BEGIN
  WITH weather_data AS (
    SELECT 
      date,
      tempmax,
      tempmin,
      windspeed,
      winddir,
      moonphase,
      sunrise,
      sunset,
      precip,
      cloudcover,
      humidity,
      CASE 
        WHEN winddir IS NULL THEN NULL
        WHEN winddir >= 337.5 OR winddir < 22.5 THEN 'N'
        WHEN winddir >= 22.5 AND winddir < 67.5 THEN 'NE'
        WHEN winddir >= 67.5 AND winddir < 112.5 THEN 'E'
        WHEN winddir >= 112.5 AND winddir < 157.5 THEN 'SE'
        WHEN winddir >= 157.5 AND winddir < 202.5 THEN 'S'
        WHEN winddir >= 202.5 AND winddir < 247.5 THEN 'SW'
        WHEN winddir >= 247.5 AND winddir < 292.5 THEN 'W'
        WHEN winddir >= 292.5 AND winddir < 337.5 THEN 'NW'
        ELSE 'Variable'
      END as wind_direction_text,
      CASE 
        WHEN moonphase IS NULL THEN NULL
        WHEN moonphase < 0.125 THEN 'New Moon'
        WHEN moonphase < 0.25 THEN 'Waxing Crescent'
        WHEN moonphase < 0.375 THEN 'First Quarter'
        WHEN moonphase < 0.5 THEN 'Waxing Gibbous'
        WHEN moonphase < 0.625 THEN 'Full Moon'
        WHEN moonphase < 0.75 THEN 'Waning Gibbous'
        WHEN moonphase < 0.875 THEN 'Last Quarter'
        ELSE 'Waning Crescent'
      END as moon_phase_name,
      jsonb_build_object(
        'summary', CASE 
          WHEN precip > 0.1 THEN 'Rainy'
          WHEN cloudcover > 80 THEN 'Overcast'
          WHEN cloudcover > 50 THEN 'Mostly Cloudy'
          WHEN cloudcover > 25 THEN 'Partly Cloudy'
          ELSE 'Clear'
        END,
        'cloudcover', cloudcover,
        'humidity', humidity,
        'winddir_degrees', winddir,
        'data_source', 'daily_weather_snapshots'
      ) as weather_conditions
    FROM daily_weather_snapshots
  )
  UPDATE hunt_logs 
  SET 
    weather_conditions = wd.weather_conditions,
    temperature_high = ROUND(wd.tempmax)::integer,
    temperature_low = ROUND(wd.tempmin)::integer,
    wind_speed = ROUND(wd.windspeed)::integer,
    wind_direction = wd.wind_direction_text,
    moon_illumination = wd.moonphase,
    moon_phase = wd.moon_phase_name,
    sunrise_time = wd.sunrise,
    sunset_time = wd.sunset,
    precipitation = wd.precip,
    weather_fetched_at = NOW(),
    updated_at = NOW()
  FROM weather_data wd
  WHERE 
    hunt_logs.hunt_date = wd.date 
    AND hunt_logs.weather_fetched_at IS NULL;
    
  GET DIAGNOSTICS update_count = ROW_COUNT;
  
  RETURN QUERY SELECT update_count;
END;
$$;


ALTER FUNCTION "public"."backfill_hunt_weather_data"() OWNER TO "postgres";

--
-- Name: backfill_legal_hunting_times(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."backfill_legal_hunting_times"() RETURNS TABLE("updated_count" integer)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  update_count INTEGER;
BEGIN
  UPDATE daily_weather_snapshots 
  SET 
    legal_hunting_start = sunrise - INTERVAL '30 minutes',
    legal_hunting_end = sunset + INTERVAL '30 minutes',
    updated_at = NOW()
  WHERE 
    legal_hunting_start IS NULL 
    OR legal_hunting_end IS NULL
    OR legal_hunting_start != (sunrise - INTERVAL '30 minutes')
    OR legal_hunting_end != (sunset + INTERVAL '30 minutes');
    
  GET DIAGNOSTICS update_count = ROW_COUNT;
  
  RETURN QUERY SELECT update_count;
END;
$$;


ALTER FUNCTION "public"."backfill_legal_hunting_times"() OWNER TO "postgres";

--
-- Name: calculate_activity_score(integer, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."calculate_activity_score"("images_added_today" integer, "avg_images_per_day" numeric DEFAULT 50.0) RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  score integer;
BEGIN
  IF images_added_today IS NULL OR images_added_today < 0 THEN
    RETURN 0;
  END IF;
  
  -- Calculate score as percentage of average, capped at 100
  score := LEAST(100, ROUND((images_added_today / GREATEST(avg_images_per_day, 1.0)) * 100));
  
  RETURN GREATEST(0, score);
END;
$$;


ALTER FUNCTION "public"."calculate_activity_score"("images_added_today" integer, "avg_images_per_day" numeric) OWNER TO "postgres";

--
-- Name: calculate_activity_trend(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."calculate_activity_trend"("current_images" integer, "previous_images" integer, "days_back" integer DEFAULT 7) RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  trend text := 'stable';
  image_diff integer;
  change_threshold integer := 10; -- Minimum change to consider significant
BEGIN
  IF previous_images IS NULL OR current_images IS NULL THEN
    RETURN 'insufficient_data';
  END IF;
  
  image_diff := current_images - previous_images;
  
  IF image_diff > change_threshold THEN
    trend := 'increasing';
  ELSIF image_diff < -change_threshold THEN
    trend := 'decreasing';
  ELSE
    trend := 'stable';
  END IF;
  
  RETURN trend;
END;
$$;


ALTER FUNCTION "public"."calculate_activity_trend"("current_images" integer, "previous_images" integer, "days_back" integer) OWNER TO "postgres";

--
-- Name: calculate_legal_hunting_times(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."calculate_legal_hunting_times"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Calculate legal hunting start time (30 minutes before sunrise)
  NEW.legal_hunting_start := NEW.sunrise - INTERVAL '30 minutes';
  
  -- Calculate legal hunting end time (30 minutes after sunset)
  NEW.legal_hunting_end := NEW.sunset + INTERVAL '30 minutes';
  
  -- Update the updated_at timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_legal_hunting_times"() OWNER TO "postgres";

--
-- Name: calculate_weather_quality_score("jsonb"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."calculate_weather_quality_score"("weather_data" "jsonb") RETURNS TABLE("quality_score" integer, "missing_fields" "text"[])
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  score integer := 100;
  missing text[] := '{}';
  required_fields text[] := ARRAY['tempmax', 'tempmin', 'temp', 'humidity', 'precip', 'windspeed', 'sunrise', 'sunset'];
  field text;
BEGIN
  -- Check each required field
  FOREACH field IN ARRAY required_fields LOOP
    IF weather_data->field IS NULL OR weather_data->>field = '' THEN
      score := score - 10;
      missing := array_append(missing, field);
    END IF;
  END LOOP;
  
  -- Additional quality checks
  IF (weather_data->>'tempmax')::numeric < (weather_data->>'tempmin')::numeric THEN
    score := score - 15;
    missing := array_append(missing, 'temp_logic_error');
  END IF;
  
  IF (weather_data->>'humidity')::numeric > 100 OR (weather_data->>'humidity')::numeric < 0 THEN
    score := score - 10;
    missing := array_append(missing, 'humidity_range_error');
  END IF;
  
  RETURN QUERY SELECT GREATEST(score, 0), missing;
END;
$$;


ALTER FUNCTION "public"."calculate_weather_quality_score"("weather_data" "jsonb") OWNER TO "postgres";

--
-- Name: detect_camera_location_change("text", "text", numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."detect_camera_location_change"("current_coordinates" "text", "previous_coordinates" "text", "threshold_meters" numeric DEFAULT 50.0) RETURNS TABLE("changed" boolean, "distance_meters" numeric)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  distance numeric;
  current_lat numeric;
  current_lng numeric;
  prev_lat numeric;
  prev_lng numeric;
BEGIN
  -- Parse coordinates (format: "lat,lng")
  IF current_coordinates IS NULL OR previous_coordinates IS NULL THEN
    RETURN QUERY SELECT false, 0.0;
    RETURN;
  END IF;
  
  -- Extract lat/lng from coordinate strings
  current_lat := split_part(current_coordinates, ',', 1)::numeric;
  current_lng := split_part(current_coordinates, ',', 2)::numeric;
  prev_lat := split_part(previous_coordinates, ',', 1)::numeric;
  prev_lng := split_part(previous_coordinates, ',', 2)::numeric;
  
  -- Calculate distance using Haversine formula (simplified for small distances)
  distance := 111320 * sqrt(
    power(current_lat - prev_lat, 2) + 
    power((current_lng - prev_lng) * cos(radians(current_lat)), 2)
  );
  
  RETURN QUERY SELECT distance > threshold_meters, distance;
END;
$$;


ALTER FUNCTION "public"."detect_camera_location_change"("current_coordinates" "text", "previous_coordinates" "text", "threshold_meters" numeric) OWNER TO "postgres";

--
-- Name: detect_missing_cameras("date"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."detect_missing_cameras"("check_date" "date" DEFAULT CURRENT_DATE) RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  missing_count integer = 0;
  deployment_record RECORD;
  last_report_date date;
BEGIN
  -- Loop through all active deployments
  FOR deployment_record IN 
    SELECT cd.id, cd.hardware_id, cd.last_seen_date, cd.consecutive_missing_days, ch.device_id
    FROM camera_deployments cd
    JOIN camera_hardware ch ON cd.hardware_id = ch.id
    WHERE cd.active = true AND ch.active = true
  LOOP
    -- Find the latest report for this deployment
    SELECT MAX(report_date) INTO last_report_date
    FROM camera_status_reports
    WHERE deployment_id = deployment_record.id;
    
    -- If no reports exist yet, skip
    IF last_report_date IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Check if camera is missing (no report today but had reports before)
    IF last_report_date < check_date THEN
      -- Camera is missing
      UPDATE camera_deployments 
      SET 
        is_missing = true,
        consecutive_missing_days = COALESCE(consecutive_missing_days, 0) + 1,
        missing_since_date = COALESCE(missing_since_date, check_date),
        updated_at = now()
      WHERE id = deployment_record.id;
      
      missing_count = missing_count + 1;
    ELSE
      -- Camera reported today, clear missing status
      UPDATE camera_deployments 
      SET 
        is_missing = false,
        consecutive_missing_days = 0,
        missing_since_date = NULL,
        last_seen_date = last_report_date,
        updated_at = now()
      WHERE id = deployment_record.id;
    END IF;
  END LOOP;
  
  RETURN missing_count;
END;
$$;


ALTER FUNCTION "public"."detect_missing_cameras"("check_date" "date") OWNER TO "postgres";

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.members (
    id, email, full_name, display_name, role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'member'
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";

--
-- Name: interpolate_dawn_dusk_temps(time without time zone, time without time zone, numeric, numeric, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."interpolate_dawn_dusk_temps"("sunrise_time" time without time zone, "sunset_time" time without time zone, "tempmin" numeric, "tempmax" numeric, "current_temp" numeric) RETURNS TABLE("temp_dawn" numeric, "temp_dusk" numeric)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  dawn_temp numeric;
  dusk_temp numeric;
BEGIN
  -- Simple interpolation: dawn closer to min, dusk closer to max
  -- Dawn is typically 30-60 minutes before sunrise
  dawn_temp := tempmin + ((tempmax - tempmin) * 0.1); -- 10% of the way to max
  
  -- Dusk is typically 30-60 minutes after sunset  
  dusk_temp := tempmax - ((tempmax - tempmin) * 0.2); -- 80% of the way to max
  
  RETURN QUERY SELECT dawn_temp, dusk_temp;
END;
$$;


ALTER FUNCTION "public"."interpolate_dawn_dusk_temps"("sunrise_time" time without time zone, "sunset_time" time without time zone, "tempmin" numeric, "tempmax" numeric, "current_temp" numeric) OWNER TO "postgres";

--
-- Name: update_camera_alert_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."update_camera_alert_status"() RETURNS "trigger"
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
    
    -- Battery alerts (solar panels should show "Ext OK" not "OK")
    IF NEW.battery_status = 'Low' OR 
       (has_solar = true AND NEW.battery_status = 'OK') THEN
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


ALTER FUNCTION "public"."update_camera_alert_status"() OWNER TO "postgres";

--
-- Name: update_hunt_logs_weather(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."update_hunt_logs_weather"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  hunt_record RECORD;
  v_wind_direction_text TEXT;
  v_moon_phase_name TEXT;
  v_weather_conditions JSONB;
BEGIN
  -- Convert wind direction from degrees to cardinal direction
  CASE 
    WHEN NEW.winddir IS NULL THEN v_wind_direction_text := NULL;
    WHEN NEW.winddir >= 337.5 OR NEW.winddir < 22.5 THEN v_wind_direction_text := 'N';
    WHEN NEW.winddir >= 22.5 AND NEW.winddir < 67.5 THEN v_wind_direction_text := 'NE';
    WHEN NEW.winddir >= 67.5 AND NEW.winddir < 112.5 THEN v_wind_direction_text := 'E';
    WHEN NEW.winddir >= 112.5 AND NEW.winddir < 157.5 THEN v_wind_direction_text := 'SE';
    WHEN NEW.winddir >= 157.5 AND NEW.winddir < 202.5 THEN v_wind_direction_text := 'S';
    WHEN NEW.winddir >= 202.5 AND NEW.winddir < 247.5 THEN v_wind_direction_text := 'SW';
    WHEN NEW.winddir >= 247.5 AND NEW.winddir < 292.5 THEN v_wind_direction_text := 'W';
    WHEN NEW.winddir >= 292.5 AND NEW.winddir < 337.5 THEN v_wind_direction_text := 'NW';
    ELSE v_wind_direction_text := 'Variable';
  END CASE;

  -- Convert moon phase from decimal to text
  CASE 
    WHEN NEW.moonphase IS NULL THEN v_moon_phase_name := NULL;
    WHEN NEW.moonphase < 0.125 THEN v_moon_phase_name := 'New Moon';
    WHEN NEW.moonphase < 0.25 THEN v_moon_phase_name := 'Waxing Crescent';
    WHEN NEW.moonphase < 0.375 THEN v_moon_phase_name := 'First Quarter';
    WHEN NEW.moonphase < 0.5 THEN v_moon_phase_name := 'Waxing Gibbous';
    WHEN NEW.moonphase < 0.625 THEN v_moon_phase_name := 'Full Moon';
    WHEN NEW.moonphase < 0.75 THEN v_moon_phase_name := 'Waning Gibbous';
    WHEN NEW.moonphase < 0.875 THEN v_moon_phase_name := 'Last Quarter';
    ELSE v_moon_phase_name := 'Waning Crescent';
  END CASE;

  -- Create simplified weather conditions JSON
  v_weather_conditions := jsonb_build_object(
    'summary', CASE 
      WHEN NEW.precip > 0.1 THEN 'Rainy'
      WHEN NEW.cloudcover > 80 THEN 'Overcast'
      WHEN NEW.cloudcover > 50 THEN 'Mostly Cloudy'
      WHEN NEW.cloudcover > 25 THEN 'Partly Cloudy'
      ELSE 'Clear'
    END,
    'cloudcover', NEW.cloudcover,
    'humidity', NEW.humidity,
    'winddir_degrees', NEW.winddir,
    'data_source', 'daily_weather_snapshots'
  );

  -- Update all hunt logs that match this date and don't have weather data yet
  UPDATE hunt_logs 
  SET 
    weather_conditions = v_weather_conditions,
    temperature_high = ROUND(NEW.tempmax)::integer,
    temperature_low = ROUND(NEW.tempmin)::integer,
    wind_speed = ROUND(NEW.windspeed)::integer,
    wind_direction = v_wind_direction_text,
    moon_illumination = NEW.moonphase,
    moon_phase = v_moon_phase_name,
    sunrise_time = NEW.sunrise,
    sunset_time = NEW.sunset,
    precipitation = NEW.precip,
    weather_fetched_at = NOW(),
    updated_at = NOW()
  WHERE 
    hunt_date = NEW.date 
    AND weather_fetched_at IS NULL;  -- Only update hunts without weather data

  -- Log the update for debugging
  RAISE NOTICE 'Updated hunt logs for date % with weather data from daily snapshot', NEW.date;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_hunt_logs_weather"() OWNER TO "postgres";

--
-- Name: update_stand_activity_on_hunt(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."update_stand_activity_on_hunt"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Only update if hunt has a stand assigned
    IF NEW.stand_id IS NOT NULL THEN
        -- Always update last hunted info and increment hunt count
        UPDATE public.stands 
        SET 
            last_hunted = NEW.hunt_date,
            last_hunted_by = NEW.member_id,
            total_hunts = total_hunts + 1,
            updated_at = NOW()
        WHERE id = NEW.stand_id;
        
        -- If they had a harvest, update harvest stats too
        IF NEW.had_harvest = true THEN
            UPDATE public.stands 
            SET 
                total_harvests = total_harvests + 1,
                last_harvest = NEW.hunt_date,
                last_harvest_by = NEW.member_id,
                updated_at = NOW()
            WHERE id = NEW.stand_id;
        END IF;
        
        -- Recalculate success rate (works for both harvest and no-harvest)
        UPDATE public.stands 
        SET 
            success_rate = CASE 
                WHEN total_hunts > 0 THEN 
                    ROUND((total_harvests::NUMERIC / total_hunts::NUMERIC) * 100, 2)
                ELSE 0 
            END,
            updated_at = NOW()
        WHERE id = NEW.stand_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_stand_activity_on_hunt"() OWNER TO "postgres";

--
-- Name: update_stand_stats_from_hunt(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."update_stand_stats_from_hunt"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        IF NEW.stand_id IS NOT NULL THEN
            UPDATE stands SET 
                total_hunts = total_hunts + 1,
                total_harvests = total_harvests + COALESCE(NEW.harvest_count, 0),
                last_used_date = GREATEST(COALESCE(last_used_date, NEW.hunt_date), NEW.hunt_date)
            WHERE id = NEW.stand_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- If stand changed, update both old and new stands
        IF OLD.stand_id IS DISTINCT FROM NEW.stand_id THEN
            -- Remove from old stand
            IF OLD.stand_id IS NOT NULL THEN
                UPDATE stands SET 
                    total_hunts = GREATEST(0, total_hunts - 1),
                    total_harvests = GREATEST(0, total_harvests - COALESCE(OLD.harvest_count, 0))
                WHERE id = OLD.stand_id;
                
                -- Recalculate last_used_date for old stand
                UPDATE stands SET 
                    last_used_date = (
                        SELECT MAX(hunt_date) 
                        FROM hunt_logs 
                        WHERE stand_id = OLD.stand_id
                    )
                WHERE id = OLD.stand_id;
            END IF;
            
            -- Add to new stand
            IF NEW.stand_id IS NOT NULL THEN
                UPDATE stands SET 
                    total_hunts = total_hunts + 1,
                    total_harvests = total_harvests + COALESCE(NEW.harvest_count, 0),
                    last_used_date = GREATEST(COALESCE(last_used_date, NEW.hunt_date), NEW.hunt_date)
                WHERE id = NEW.stand_id;
            END IF;
        ELSE
            -- Same stand, just update harvest count difference
            IF NEW.stand_id IS NOT NULL THEN
                UPDATE stands SET 
                    total_harvests = total_harvests + COALESCE(NEW.harvest_count, 0) - COALESCE(OLD.harvest_count, 0),
                    last_used_date = GREATEST(COALESCE(last_used_date, NEW.hunt_date), NEW.hunt_date)
                WHERE id = NEW.stand_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        IF OLD.stand_id IS NOT NULL THEN
            UPDATE stands SET 
                total_hunts = GREATEST(0, total_hunts - 1),
                total_harvests = GREATEST(0, total_harvests - COALESCE(OLD.harvest_count, 0))
            WHERE id = OLD.stand_id;
            
            -- Recalculate last_used_date
            UPDATE stands SET 
                last_used_date = (
                    SELECT MAX(hunt_date) 
                    FROM hunt_logs 
                    WHERE stand_id = OLD.stand_id
                )
            WHERE id = OLD.stand_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_stand_stats_from_hunt"() OWNER TO "postgres";

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

--
-- Name: validate_coordinates("text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."validate_coordinates"("coordinates" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Check format: "lat,lng" with valid numeric values
  IF coordinates IS NULL OR coordinates = '' THEN
    RETURN false;
  END IF;
  
  -- Must contain exactly one comma
  IF array_length(string_to_array(coordinates, ','), 1) != 2 THEN
    RETURN false;
  END IF;
  
  -- Both parts must be valid numbers
  BEGIN
    PERFORM split_part(coordinates, ',', 1)::numeric;
    PERFORM split_part(coordinates, ',', 2)::numeric;
    RETURN true;
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;
END;
$$;


ALTER FUNCTION "public"."validate_coordinates"("coordinates" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: camera_deployments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."camera_deployments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "hardware_id" "uuid" NOT NULL,
    "location_name" character varying(100) NOT NULL,
    "latitude" numeric(10,8) NOT NULL,
    "longitude" numeric(11,8) NOT NULL,
    "season_year" integer DEFAULT EXTRACT(year FROM CURRENT_DATE) NOT NULL,
    "stand_id" "uuid",
    "facing_direction" character varying(2),
    "has_solar_panel" boolean DEFAULT false,
    "active" boolean DEFAULT true,
    "notes" "text",
    "last_seen_date" "date",
    "missing_since_date" "date",
    "is_missing" boolean DEFAULT false,
    "consecutive_missing_days" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "camera_deployments_facing_direction_check" CHECK ((("facing_direction")::"text" = ANY ((ARRAY['N'::character varying, 'NE'::character varying, 'E'::character varying, 'SE'::character varying, 'S'::character varying, 'SW'::character varying, 'W'::character varying, 'NW'::character varying])::"text"[])))
);


ALTER TABLE "public"."camera_deployments" OWNER TO "postgres";

--
-- Name: camera_hardware; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."camera_hardware" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "device_id" character varying(10) NOT NULL,
    "brand" character varying(50) NOT NULL,
    "model" character varying(50) NOT NULL,
    "serial_number" character varying(100),
    "purchase_date" "date",
    "fw_version" character varying(20),
    "cl_version" character varying(20),
    "condition" character varying(20) DEFAULT 'good'::character varying,
    "active" boolean DEFAULT true,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "camera_hardware_condition_check" CHECK ((("condition")::"text" = ANY ((ARRAY['good'::character varying, 'questionable'::character varying, 'poor'::character varying, 'retired'::character varying])::"text"[])))
);


ALTER TABLE "public"."camera_hardware" OWNER TO "postgres";

--
-- Name: camera_status_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."camera_status_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deployment_id" "uuid" NOT NULL,
    "hardware_id" "uuid" NOT NULL,
    "report_date" "date" NOT NULL,
    "battery_status" character varying(20),
    "signal_level" character varying(20),
    "network_links" character varying(100),
    "sd_images_count" integer,
    "sd_free_space_mb" integer,
    "image_queue" integer,
    "needs_attention" boolean DEFAULT false,
    "alert_reason" "text",
    "report_processing_date" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "cuddeback_report_timestamp" timestamp with time zone
);


ALTER TABLE "public"."camera_status_reports" OWNER TO "postgres";

--
-- Name: TABLE "camera_status_reports"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."camera_status_reports" IS 'Daily camera status reports (15 fields) - includes Cuddeback web scraping data';


--
-- Name: camp_todos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."camp_todos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text" DEFAULT 'general'::"text",
    "priority" "text" DEFAULT 'medium'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "assigned_to" "uuid",
    "due_date" "date",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "camp_todos_category_check" CHECK (("category" = ANY (ARRAY['supplies'::"text", 'groceries'::"text", 'equipment'::"text", 'general'::"text"]))),
    CONSTRAINT "camp_todos_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "camp_todos_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."camp_todos" OWNER TO "postgres";

--
-- Name: club_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."club_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "event_date" "date" NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "event_type" "text" DEFAULT 'meeting'::"text",
    "location" "text",
    "all_day" boolean DEFAULT false,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_public" boolean DEFAULT true,
    CONSTRAINT "club_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['meeting'::"text", 'work_day'::"text", 'social'::"text", 'hunting'::"text", 'maintenance'::"text"])))
);


ALTER TABLE "public"."club_events" OWNER TO "postgres";

--
-- Name: daily_camera_snapshots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."daily_camera_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "camera_device_id" "text" NOT NULL,
    "collection_timestamp" timestamp with time zone DEFAULT "now"(),
    "battery_status" "text",
    "signal_level" integer,
    "temperature" integer,
    "sd_images_count" integer,
    "last_image_timestamp" timestamp with time zone,
    "current_coordinates" "text",
    "previous_coordinates" "text",
    "location_changed" boolean DEFAULT false,
    "distance_moved_meters" numeric(6,2),
    "activity_score" integer,
    "activity_trend" "text",
    "images_added_today" integer,
    "peak_activity_hour" integer,
    "data_source_quality" integer DEFAULT 100,
    "processing_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "seven_day_average" numeric(5,1),
    "weekly_image_change" integer,
    "days_since_last_activity" integer,
    "anomaly_detected" boolean DEFAULT false,
    "anomaly_type" "text",
    "anomaly_severity" "text",
    CONSTRAINT "daily_camera_snapshots_activity_trend_check" CHECK (("activity_trend" = ANY (ARRAY['increasing'::"text", 'decreasing'::"text", 'stable'::"text", 'insufficient_data'::"text", 'strongly_increasing'::"text", 'variable'::"text"]))),
    CONSTRAINT "daily_camera_snapshots_anomaly_severity_check" CHECK (("anomaly_severity" = ANY (ARRAY['moderate'::"text", 'high'::"text"]))),
    CONSTRAINT "daily_camera_snapshots_anomaly_type_check" CHECK (("anomaly_type" = ANY (ARRAY['spike'::"text", 'drop'::"text"])))
);


ALTER TABLE "public"."daily_camera_snapshots" OWNER TO "postgres";

--
-- Name: TABLE "daily_camera_snapshots"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."daily_camera_snapshots" IS 'Daily camera activity snapshots with enhanced trend analysis (25 fields)';


--
-- Name: daily_collection_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."daily_collection_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "collection_date" "date" NOT NULL,
    "collection_type" "text" NOT NULL,
    "status" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "processing_duration_ms" integer,
    "records_processed" integer DEFAULT 0,
    "errors_encountered" integer DEFAULT 0,
    "data_completeness_score" integer DEFAULT 100,
    "alerts_generated" integer DEFAULT 0,
    "error_details" "jsonb",
    "processing_summary" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "daily_collection_log_collection_type_check" CHECK (("collection_type" = ANY (ARRAY['weather'::"text", 'camera'::"text", 'analysis'::"text"]))),
    CONSTRAINT "daily_collection_log_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'partial_success'::"text", 'failed'::"text", 'retrying'::"text"])))
);


ALTER TABLE "public"."daily_collection_log" OWNER TO "postgres";

--
-- Name: daily_weather_snapshots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."daily_weather_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "property_center_lat" numeric(10,8) DEFAULT 36.42723577 NOT NULL,
    "property_center_lng" numeric(11,8) DEFAULT '-79.51088069'::numeric NOT NULL,
    "collection_timestamp" timestamp with time zone DEFAULT "now"(),
    "api_source" "text" DEFAULT 'visual_crossing'::"text",
    "raw_weather_data" "jsonb" NOT NULL,
    "tempmax" numeric(4,1),
    "tempmin" numeric(4,1),
    "temp" numeric(4,1),
    "temp_dawn" numeric(4,1),
    "temp_dusk" numeric(4,1),
    "humidity" numeric(5,2),
    "precip" numeric(5,2),
    "precipprob" numeric(3,0),
    "windspeed" numeric(4,1),
    "winddir" numeric(3,0),
    "cloudcover" numeric(3,0),
    "uvindex" numeric(3,1),
    "moonphase" numeric(3,2),
    "sunrise" time without time zone,
    "sunset" time without time zone,
    "data_quality_score" integer DEFAULT 100,
    "missing_fields" "text"[],
    "quality_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "legal_hunting_start" time without time zone,
    "legal_hunting_end" time without time zone
);


ALTER TABLE "public"."daily_weather_snapshots" OWNER TO "postgres";

--
-- Name: COLUMN "daily_weather_snapshots"."legal_hunting_start"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."daily_weather_snapshots"."legal_hunting_start" IS 'NC legal hunting start time (sunrise - 30 minutes)';


--
-- Name: COLUMN "daily_weather_snapshots"."legal_hunting_end"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."daily_weather_snapshots"."legal_hunting_end" IS 'NC legal hunting end time (sunset + 30 minutes)';


--
-- Name: food_plots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."food_plots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "plot_data" "jsonb",
    "crop_type" character varying(100),
    "planting_date" "date",
    "harvest_date" "date",
    "size_acres" numeric(5,2),
    "notes" "text",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."food_plots" OWNER TO "postgres";

--
-- Name: hunt_harvests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."hunt_harvests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "hunt_log_id" "uuid" NOT NULL,
    "animal_type" character varying(50) NOT NULL,
    "gender" character varying(10),
    "estimated_age" character varying(20),
    "estimated_weight" integer,
    "shot_distance_yards" integer,
    "weapon_used" character varying(100),
    "shot_placement" character varying(100),
    "tracking_time_minutes" integer,
    "tracking_distance_yards" integer,
    "recovery_notes" "text",
    "field_dressed_weight" integer,
    "antler_points" integer,
    "antler_spread_inches" numeric(4,1),
    "hide_condition" character varying(20),
    "meat_condition" character varying(20),
    "photos" "text"[],
    "processor_name" character varying(100),
    "processing_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "hunt_harvests_gender_check" CHECK ((("gender")::"text" = ANY ((ARRAY['Buck'::character varying, 'Doe'::character varying, 'Unknown'::character varying])::"text"[]))),
    CONSTRAINT "hunt_harvests_hide_condition_check" CHECK ((("hide_condition")::"text" = ANY ((ARRAY['Excellent'::character varying, 'Good'::character varying, 'Fair'::character varying, 'Poor'::character varying, 'Damaged'::character varying])::"text"[]))),
    CONSTRAINT "hunt_harvests_meat_condition_check" CHECK ((("meat_condition")::"text" = ANY ((ARRAY['Excellent'::character varying, 'Good'::character varying, 'Fair'::character varying, 'Poor'::character varying, 'Damaged'::character varying])::"text"[])))
);


ALTER TABLE "public"."hunt_harvests" OWNER TO "postgres";

--
-- Name: TABLE "hunt_harvests"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."hunt_harvests" IS 'Detailed harvest information when had_harvest = true';


--
-- Name: hunt_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."hunt_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "stand_id" "uuid",
    "hunt_date" "date" NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "weather_conditions" "jsonb",
    "temperature_high" integer,
    "temperature_low" integer,
    "wind_speed" integer,
    "wind_direction" character varying(10),
    "precipitation" numeric(4,2),
    "moon_phase" character varying(20),
    "harvest_count" integer DEFAULT 0,
    "game_type" character varying(50),
    "notes" "text",
    "photos" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "hunt_type" character varying(20) DEFAULT 'AM'::character varying,
    "moon_illumination" numeric(5,2),
    "sunrise_time" time without time zone,
    "sunset_time" time without time zone,
    "hunting_season" character varying(50),
    "property_sector" character varying(50),
    "hunt_duration_minutes" integer,
    "had_harvest" boolean DEFAULT false,
    "weather_fetched_at" timestamp with time zone,
    "stand_coordinates" "jsonb",
    "season" character varying(10) DEFAULT '2025'::character varying NOT NULL,
    CONSTRAINT "hunt_logs_hunt_type_check" CHECK ((("hunt_type")::"text" = ANY ((ARRAY['AM'::character varying, 'PM'::character varying, 'All Day'::character varying])::"text"[]))),
    CONSTRAINT "hunt_logs_moon_illumination_check" CHECK ((("moon_illumination" >= (0)::numeric) AND ("moon_illumination" <= (100)::numeric)))
);


ALTER TABLE "public"."hunt_logs" OWNER TO "postgres";

--
-- Name: TABLE "hunt_logs"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."hunt_logs" IS 'Enhanced hunt logs with auto-populated weather, astronomical, and season data';


--
-- Name: hunt_logs_with_temperature; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW "public"."hunt_logs_with_temperature" AS
 SELECT "hl"."id",
    "hl"."member_id",
    "hl"."stand_id",
    "hl"."hunt_date",
    "hl"."start_time",
    "hl"."end_time",
    "hl"."weather_conditions",
    "hl"."temperature_high",
    "hl"."temperature_low",
    "hl"."wind_speed",
    "hl"."wind_direction",
    "hl"."precipitation",
    "hl"."moon_phase",
    "hl"."harvest_count",
    "hl"."game_type",
    "hl"."notes",
    "hl"."photos",
    "hl"."hunt_type",
    "hl"."moon_illumination",
    "hl"."sunrise_time",
    "hl"."sunset_time",
    "hl"."hunting_season",
    "hl"."property_sector",
    "hl"."hunt_duration_minutes",
    "hl"."had_harvest",
    "hl"."weather_fetched_at",
    "hl"."stand_coordinates",
    "hl"."created_at",
    "hl"."updated_at",
        CASE
            WHEN ((("hl"."hunt_type")::"text" = 'AM'::"text") AND ("dws"."temp_dawn" IS NOT NULL)) THEN ("round"("dws"."temp_dawn"))::integer
            WHEN ((("hl"."hunt_type")::"text" = 'PM'::"text") AND ("dws"."temp_dusk" IS NOT NULL)) THEN ("round"("dws"."temp_dusk"))::integer
            WHEN ((("hl"."hunt_type")::"text" = 'All Day'::"text") AND ("dws"."tempmax" IS NOT NULL) AND ("dws"."tempmin" IS NOT NULL)) THEN ("round"((("dws"."tempmax" + "dws"."tempmin") / (2)::numeric)))::integer
            WHEN (("dws"."tempmax" IS NOT NULL) AND ("dws"."tempmin" IS NOT NULL)) THEN ("round"((("dws"."tempmax" + "dws"."tempmin") / (2)::numeric)))::integer
            ELSE "hl"."temperature_high"
        END AS "hunt_temperature",
    "dws"."temp_dawn",
    "dws"."temp_dusk",
    "dws"."tempmax" AS "daily_high",
    "dws"."tempmin" AS "daily_low",
    "dws"."temp" AS "daily_average",
    "dws"."legal_hunting_start",
    "dws"."legal_hunting_end",
    "dws"."windspeed",
    "dws"."winddir",
    "dws"."moonphase",
    "dws"."humidity",
    "dws"."precip",
    "dws"."precipprob",
    "dws"."cloudcover",
    "dws"."uvindex",
    "dws"."sunrise",
    "dws"."sunset",
    "dws"."data_quality_score",
    ("dws"."id" IS NOT NULL) AS "has_weather_data",
    (("dws"."temp_dawn" IS NOT NULL) AND ("dws"."temp_dusk" IS NOT NULL)) AS "has_dawn_dusk_temps"
   FROM ("public"."hunt_logs" "hl"
     LEFT JOIN "public"."daily_weather_snapshots" "dws" ON (("hl"."hunt_date" = "dws"."date")));


ALTER VIEW "public"."hunt_logs_with_temperature" OWNER TO "postgres";

--
-- Name: VIEW "hunt_logs_with_temperature"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW "public"."hunt_logs_with_temperature" IS 'Hunt logs enhanced with smart temperature display: AM=dawn, PM=dusk, All Day=average. Includes weather context and availability flags.';


--
-- Name: hunt_sightings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."hunt_sightings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "hunt_log_id" "uuid" NOT NULL,
    "animal_type" character varying(50) NOT NULL,
    "count" integer DEFAULT 1,
    "gender" character varying(10),
    "estimated_age" character varying(20),
    "behavior" "text",
    "distance_yards" integer,
    "direction" character varying(20),
    "time_observed" time without time zone,
    "notes" "text",
    "photos" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "hunt_sightings_count_check" CHECK (("count" > 0)),
    CONSTRAINT "hunt_sightings_direction_check" CHECK ((("direction")::"text" = ANY ((ARRAY['N'::character varying, 'NE'::character varying, 'E'::character varying, 'SE'::character varying, 'S'::character varying, 'SW'::character varying, 'W'::character varying, 'NW'::character varying, 'Unknown'::character varying])::"text"[]))),
    CONSTRAINT "hunt_sightings_gender_check" CHECK ((("gender")::"text" = ANY ((ARRAY['Buck'::character varying, 'Doe'::character varying, 'Mixed'::character varying, 'Unknown'::character varying])::"text"[])))
);


ALTER TABLE "public"."hunt_sightings" OWNER TO "postgres";

--
-- Name: TABLE "hunt_sightings"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."hunt_sightings" IS 'Animal sightings and observations during hunts';


--
-- Name: maintenance_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."maintenance_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "assigned_to" "uuid",
    "priority" "text" DEFAULT 'medium'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "due_date" "date",
    "category" "text" DEFAULT 'general'::"text",
    "location" "text",
    "estimated_hours" integer,
    "actual_hours" integer,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    CONSTRAINT "maintenance_tasks_category_check" CHECK (("category" = ANY (ARRAY['general'::"text", 'equipment'::"text", 'property'::"text", 'safety'::"text", 'feeder'::"text"]))),
    CONSTRAINT "maintenance_tasks_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "maintenance_tasks_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."maintenance_tasks" OWNER TO "postgres";

--
-- Name: members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."members" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "phone" "text",
    "role" "text" DEFAULT 'member'::"text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "display_name" "text",
    CONSTRAINT "members_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'member'::"text", 'guest'::"text", 'commodore'::"text"])))
);


ALTER TABLE "public"."members" OWNER TO "postgres";

--
-- Name: property_boundaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."property_boundaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) DEFAULT 'Main Property'::character varying NOT NULL,
    "boundary_data" "jsonb" NOT NULL,
    "total_acres" numeric(8,2),
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."property_boundaries" OWNER TO "postgres";

--
-- Name: stands; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."stands" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "active" boolean DEFAULT true,
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "trail_name" character varying(100),
    "walking_time_minutes" integer,
    "access_notes" "text",
    "height_feet" integer,
    "capacity" integer DEFAULT 1,
    "type" "public"."stand_type" DEFAULT 'ladder_stand'::"public"."stand_type",
    "time_of_day" "public"."time_of_day" DEFAULT 'ALL'::"public"."time_of_day",
    "view_distance_yards" integer,
    "nearby_water_source" boolean DEFAULT false,
    "total_hunts" integer DEFAULT 0,
    "total_harvests" integer DEFAULT 0,
    "last_used_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "season_hunts" integer DEFAULT 0,
    "food_source" "public"."food_source_type",
    "archery_season" boolean DEFAULT false,
    "trail_camera_name" character varying(100),
    "last_hunted" "date",
    "last_harvest" "date",
    "last_hunted_by" "uuid",
    "last_harvest_by" "uuid",
    "success_rate" numeric(5,2)
);


ALTER TABLE "public"."stands" OWNER TO "postgres";

--
-- Name: TABLE "stands"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."stands" IS 'Hunting stands with automatic activity tracking from hunt logs';


--
-- Name: COLUMN "stands"."total_hunts"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."stands"."total_hunts" IS 'Total number of hunts logged from this stand';


--
-- Name: COLUMN "stands"."total_harvests"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."stands"."total_harvests" IS 'Total number of successful harvests from this stand';


--
-- Name: COLUMN "stands"."last_hunted"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."stands"."last_hunted" IS 'Date someone last hunted from this stand';


--
-- Name: COLUMN "stands"."last_harvest"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."stands"."last_harvest" IS 'Date of last successful harvest from this stand';


--
-- Name: COLUMN "stands"."last_hunted_by"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."stands"."last_hunted_by" IS 'Member who last hunted from this stand';


--
-- Name: COLUMN "stands"."last_harvest_by"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."stands"."last_harvest_by" IS 'Member who had the last harvest from this stand';


--
-- Name: COLUMN "stands"."success_rate"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."stands"."success_rate" IS 'Percentage of hunts that resulted in harvest (total_harvests/total_hunts * 100)';


--
-- Name: trails; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."trails" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "trail_data" "jsonb",
    "difficulty" character varying(20) DEFAULT 'easy'::character varying,
    "distance_miles" numeric(5,2),
    "color" character varying(7) DEFAULT '#3b82f6'::character varying,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."trails" OWNER TO "postgres";

--
-- Name: camera_deployments camera_deployments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."camera_deployments"
    ADD CONSTRAINT "camera_deployments_pkey" PRIMARY KEY ("id");


--
-- Name: camera_hardware camera_hardware_device_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."camera_hardware"
    ADD CONSTRAINT "camera_hardware_device_id_key" UNIQUE ("device_id");


--
-- Name: camera_hardware camera_hardware_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."camera_hardware"
    ADD CONSTRAINT "camera_hardware_pkey" PRIMARY KEY ("id");


--
-- Name: camera_status_reports camera_status_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."camera_status_reports"
    ADD CONSTRAINT "camera_status_reports_pkey" PRIMARY KEY ("id");


--
-- Name: camp_todos camp_todos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."camp_todos"
    ADD CONSTRAINT "camp_todos_pkey" PRIMARY KEY ("id");


--
-- Name: club_events club_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."club_events"
    ADD CONSTRAINT "club_events_pkey" PRIMARY KEY ("id");


--
-- Name: daily_camera_snapshots daily_camera_snapshots_date_camera_device_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."daily_camera_snapshots"
    ADD CONSTRAINT "daily_camera_snapshots_date_camera_device_id_key" UNIQUE ("date", "camera_device_id");


--
-- Name: daily_camera_snapshots daily_camera_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."daily_camera_snapshots"
    ADD CONSTRAINT "daily_camera_snapshots_pkey" PRIMARY KEY ("id");


--
-- Name: daily_collection_log daily_collection_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."daily_collection_log"
    ADD CONSTRAINT "daily_collection_log_pkey" PRIMARY KEY ("id");


--
-- Name: daily_weather_snapshots daily_weather_snapshots_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."daily_weather_snapshots"
    ADD CONSTRAINT "daily_weather_snapshots_date_key" UNIQUE ("date");


--
-- Name: daily_weather_snapshots daily_weather_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."daily_weather_snapshots"
    ADD CONSTRAINT "daily_weather_snapshots_pkey" PRIMARY KEY ("id");


--
-- Name: food_plots food_plots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."food_plots"
    ADD CONSTRAINT "food_plots_pkey" PRIMARY KEY ("id");


--
-- Name: hunt_harvests hunt_harvests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."hunt_harvests"
    ADD CONSTRAINT "hunt_harvests_pkey" PRIMARY KEY ("id");


--
-- Name: hunt_logs hunt_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."hunt_logs"
    ADD CONSTRAINT "hunt_logs_pkey" PRIMARY KEY ("id");


--
-- Name: hunt_sightings hunt_sightings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."hunt_sightings"
    ADD CONSTRAINT "hunt_sightings_pkey" PRIMARY KEY ("id");


--
-- Name: maintenance_tasks maintenance_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."maintenance_tasks"
    ADD CONSTRAINT "maintenance_tasks_pkey" PRIMARY KEY ("id");


--
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_pkey" PRIMARY KEY ("id");


--
-- Name: property_boundaries property_boundaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."property_boundaries"
    ADD CONSTRAINT "property_boundaries_pkey" PRIMARY KEY ("id");


--
-- Name: stands stands_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."stands"
    ADD CONSTRAINT "stands_pkey" PRIMARY KEY ("id");


--
-- Name: trails trails_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."trails"
    ADD CONSTRAINT "trails_pkey" PRIMARY KEY ("id");


--
-- Name: idx_camera_deployments_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_camera_deployments_active" ON "public"."camera_deployments" USING "btree" ("active");


--
-- Name: idx_camera_deployments_consecutive_missing; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_camera_deployments_consecutive_missing" ON "public"."camera_deployments" USING "btree" ("consecutive_missing_days") WHERE ("consecutive_missing_days" > 0);


--
-- Name: idx_camera_deployments_hardware; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_camera_deployments_hardware" ON "public"."camera_deployments" USING "btree" ("hardware_id");


--
-- Name: idx_camera_deployments_last_seen; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_camera_deployments_last_seen" ON "public"."camera_deployments" USING "btree" ("last_seen_date");


--
-- Name: idx_camera_deployments_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_camera_deployments_location" ON "public"."camera_deployments" USING "btree" ("location_name");


--
-- Name: idx_camera_deployments_missing; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_camera_deployments_missing" ON "public"."camera_deployments" USING "btree" ("is_missing") WHERE ("is_missing" = true);


--
-- Name: idx_camera_deployments_season; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_camera_deployments_season" ON "public"."camera_deployments" USING "btree" ("season_year");


--
-- Name: idx_camera_hardware_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_camera_hardware_active" ON "public"."camera_hardware" USING "btree" ("active");


--
-- Name: idx_camera_hardware_device_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_camera_hardware_device_id" ON "public"."camera_hardware" USING "btree" ("device_id");


--
-- Name: idx_camera_reports_alerts; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_camera_reports_alerts" ON "public"."camera_status_reports" USING "btree" ("needs_attention") WHERE ("needs_attention" = true);


--
-- Name: idx_camera_reports_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_camera_reports_date" ON "public"."camera_status_reports" USING "btree" ("report_date");


--
-- Name: idx_camera_reports_deployment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_camera_reports_deployment" ON "public"."camera_status_reports" USING "btree" ("deployment_id");


--
-- Name: idx_camera_reports_hardware; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_camera_reports_hardware" ON "public"."camera_status_reports" USING "btree" ("hardware_id");


--
-- Name: idx_camera_reports_processing_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_camera_reports_processing_date" ON "public"."camera_status_reports" USING "btree" ("report_processing_date");


--
-- Name: idx_camera_snapshots_activity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_camera_snapshots_activity" ON "public"."daily_camera_snapshots" USING "btree" ("activity_score" DESC);


--
-- Name: idx_camera_snapshots_date_device; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_camera_snapshots_date_device" ON "public"."daily_camera_snapshots" USING "btree" ("date" DESC, "camera_device_id");


--
-- Name: idx_camera_snapshots_device; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_camera_snapshots_device" ON "public"."daily_camera_snapshots" USING "btree" ("camera_device_id");


--
-- Name: idx_camera_snapshots_location_changes; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_camera_snapshots_location_changes" ON "public"."daily_camera_snapshots" USING "btree" ("location_changed", "distance_moved_meters");


--
-- Name: idx_camera_status_reports_cuddeback_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_camera_status_reports_cuddeback_timestamp" ON "public"."camera_status_reports" USING "btree" ("cuddeback_report_timestamp" DESC);


--
-- Name: idx_camp_todos_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_camp_todos_status" ON "public"."camp_todos" USING "btree" ("status");


--
-- Name: idx_club_events_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_club_events_date" ON "public"."club_events" USING "btree" ("event_date");


--
-- Name: idx_collection_log_date_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_collection_log_date_type" ON "public"."daily_collection_log" USING "btree" ("collection_date" DESC, "collection_type");


--
-- Name: idx_collection_log_errors; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_collection_log_errors" ON "public"."daily_collection_log" USING "btree" ("errors_encountered") WHERE ("errors_encountered" > 0);


--
-- Name: idx_collection_log_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_collection_log_status" ON "public"."daily_collection_log" USING "btree" ("status", "started_at" DESC);


--
-- Name: idx_daily_camera_snapshots_activity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_daily_camera_snapshots_activity" ON "public"."daily_camera_snapshots" USING "btree" ("days_since_last_activity" DESC) WHERE ("days_since_last_activity" > 3);


--
-- Name: idx_daily_camera_snapshots_anomaly; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_daily_camera_snapshots_anomaly" ON "public"."daily_camera_snapshots" USING "btree" ("anomaly_detected", "date" DESC) WHERE ("anomaly_detected" = true);


--
-- Name: idx_daily_weather_snapshots_legal_times; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_daily_weather_snapshots_legal_times" ON "public"."daily_weather_snapshots" USING "btree" ("date", "legal_hunting_start", "legal_hunting_end");


--
-- Name: idx_hunt_harvests_animal_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_hunt_harvests_animal_type" ON "public"."hunt_harvests" USING "btree" ("animal_type", "created_at" DESC);


--
-- Name: idx_hunt_harvests_hunt_log; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_hunt_harvests_hunt_log" ON "public"."hunt_harvests" USING "btree" ("hunt_log_id");


--
-- Name: idx_hunt_harvests_weight; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_hunt_harvests_weight" ON "public"."hunt_harvests" USING "btree" ("estimated_weight" DESC) WHERE ("estimated_weight" IS NOT NULL);


--
-- Name: idx_hunt_logs_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_hunt_logs_date" ON "public"."hunt_logs" USING "btree" ("hunt_date");


--
-- Name: idx_hunt_logs_harvest; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_hunt_logs_harvest" ON "public"."hunt_logs" USING "btree" ("harvest_count");


--
-- Name: idx_hunt_logs_member; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_hunt_logs_member" ON "public"."hunt_logs" USING "btree" ("member_id");


--
-- Name: idx_hunt_logs_member_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_hunt_logs_member_date" ON "public"."hunt_logs" USING "btree" ("member_id", "hunt_date" DESC);


--
-- Name: idx_hunt_logs_season; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_hunt_logs_season" ON "public"."hunt_logs" USING "btree" ("hunting_season", "hunt_date" DESC);


--
-- Name: idx_hunt_logs_stand; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_hunt_logs_stand" ON "public"."hunt_logs" USING "btree" ("stand_id");


--
-- Name: idx_hunt_logs_stand_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_hunt_logs_stand_date" ON "public"."hunt_logs" USING "btree" ("stand_id", "hunt_date" DESC);


--
-- Name: idx_hunt_logs_weather_conditions; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_hunt_logs_weather_conditions" ON "public"."hunt_logs" USING "gin" ("weather_conditions");


--
-- Name: idx_hunt_sightings_animal_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_hunt_sightings_animal_type" ON "public"."hunt_sightings" USING "btree" ("animal_type", "created_at" DESC);


--
-- Name: idx_hunt_sightings_count; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_hunt_sightings_count" ON "public"."hunt_sightings" USING "btree" ("count" DESC);


--
-- Name: idx_hunt_sightings_hunt_log; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_hunt_sightings_hunt_log" ON "public"."hunt_sightings" USING "btree" ("hunt_log_id");


--
-- Name: idx_maintenance_tasks_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_maintenance_tasks_due_date" ON "public"."maintenance_tasks" USING "btree" ("due_date");


--
-- Name: idx_maintenance_tasks_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_maintenance_tasks_status" ON "public"."maintenance_tasks" USING "btree" ("status");


--
-- Name: idx_stands_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_stands_active" ON "public"."stands" USING "btree" ("active");


--
-- Name: idx_stands_last_hunted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_stands_last_hunted" ON "public"."stands" USING "btree" ("last_hunted" DESC);


--
-- Name: idx_stands_last_hunted_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_stands_last_hunted_by" ON "public"."stands" USING "btree" ("last_hunted_by");


--
-- Name: idx_stands_last_used; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_stands_last_used" ON "public"."stands" USING "btree" ("last_used_date");


--
-- Name: idx_stands_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_stands_location" ON "public"."stands" USING "btree" ("latitude", "longitude");


--
-- Name: idx_stands_success_rate; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_stands_success_rate" ON "public"."stands" USING "btree" ("success_rate" DESC);


--
-- Name: idx_stands_total_hunts; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_stands_total_hunts" ON "public"."stands" USING "btree" ("total_hunts" DESC);


--
-- Name: idx_weather_snapshots_collection_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_weather_snapshots_collection_time" ON "public"."daily_weather_snapshots" USING "btree" ("collection_timestamp" DESC);


--
-- Name: idx_weather_snapshots_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_weather_snapshots_date" ON "public"."daily_weather_snapshots" USING "btree" ("date" DESC);


--
-- Name: idx_weather_snapshots_quality; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_weather_snapshots_quality" ON "public"."daily_weather_snapshots" USING "btree" ("data_quality_score");


--
-- Name: daily_weather_snapshots trigger_calculate_legal_hunting_times; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "trigger_calculate_legal_hunting_times" BEFORE INSERT OR UPDATE ON "public"."daily_weather_snapshots" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_legal_hunting_times"();


--
-- Name: camera_status_reports trigger_camera_alert_status; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "trigger_camera_alert_status" BEFORE INSERT OR UPDATE ON "public"."camera_status_reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_camera_alert_status"();


--
-- Name: camera_deployments trigger_camera_deployments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "trigger_camera_deployments_updated_at" BEFORE UPDATE ON "public"."camera_deployments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: camera_hardware trigger_camera_hardware_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "trigger_camera_hardware_updated_at" BEFORE UPDATE ON "public"."camera_hardware" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: daily_weather_snapshots trigger_update_hunt_logs_weather; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "trigger_update_hunt_logs_weather" AFTER INSERT OR UPDATE ON "public"."daily_weather_snapshots" FOR EACH ROW EXECUTE FUNCTION "public"."update_hunt_logs_weather"();


--
-- Name: hunt_logs trigger_update_stand_activity; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "trigger_update_stand_activity" AFTER INSERT ON "public"."hunt_logs" FOR EACH ROW EXECUTE FUNCTION "public"."update_stand_activity_on_hunt"();


--
-- Name: hunt_logs trigger_update_stand_activity_on_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "trigger_update_stand_activity_on_update" AFTER UPDATE OF "hunt_date", "stand_id", "had_harvest" ON "public"."hunt_logs" FOR EACH ROW WHEN ((("new"."hunt_date" IS DISTINCT FROM "old"."hunt_date") OR ("new"."stand_id" IS DISTINCT FROM "old"."stand_id") OR ("new"."had_harvest" IS DISTINCT FROM "old"."had_harvest"))) EXECUTE FUNCTION "public"."update_stand_activity_on_hunt"();


--
-- Name: property_boundaries update_boundaries_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_boundaries_updated_at" BEFORE UPDATE ON "public"."property_boundaries" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: daily_camera_snapshots update_camera_snapshots_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_camera_snapshots_updated_at" BEFORE UPDATE ON "public"."daily_camera_snapshots" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: camp_todos update_camp_todos_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_camp_todos_updated_at" BEFORE UPDATE ON "public"."camp_todos" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: club_events update_club_events_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_club_events_updated_at" BEFORE UPDATE ON "public"."club_events" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: hunt_harvests update_hunt_harvests_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_hunt_harvests_updated_at" BEFORE UPDATE ON "public"."hunt_harvests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: hunt_logs update_hunt_logs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_hunt_logs_updated_at" BEFORE UPDATE ON "public"."hunt_logs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: hunt_sightings update_hunt_sightings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_hunt_sightings_updated_at" BEFORE UPDATE ON "public"."hunt_sightings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: maintenance_tasks update_maintenance_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_maintenance_tasks_updated_at" BEFORE UPDATE ON "public"."maintenance_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: members update_members_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_members_updated_at" BEFORE UPDATE ON "public"."members" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: food_plots update_plots_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_plots_updated_at" BEFORE UPDATE ON "public"."food_plots" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: hunt_logs update_stand_stats; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_stand_stats" AFTER INSERT OR DELETE OR UPDATE ON "public"."hunt_logs" FOR EACH ROW EXECUTE FUNCTION "public"."update_stand_stats_from_hunt"();


--
-- Name: stands update_stands_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_stands_updated_at" BEFORE UPDATE ON "public"."stands" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: trails update_trails_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_trails_updated_at" BEFORE UPDATE ON "public"."trails" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: daily_weather_snapshots update_weather_snapshots_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_weather_snapshots_updated_at" BEFORE UPDATE ON "public"."daily_weather_snapshots" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: camera_deployments camera_deployments_hardware_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."camera_deployments"
    ADD CONSTRAINT "camera_deployments_hardware_id_fkey" FOREIGN KEY ("hardware_id") REFERENCES "public"."camera_hardware"("id") ON DELETE CASCADE;


--
-- Name: camera_deployments camera_deployments_stand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."camera_deployments"
    ADD CONSTRAINT "camera_deployments_stand_id_fkey" FOREIGN KEY ("stand_id") REFERENCES "public"."stands"("id");


--
-- Name: camera_status_reports camera_status_reports_deployment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."camera_status_reports"
    ADD CONSTRAINT "camera_status_reports_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "public"."camera_deployments"("id") ON DELETE CASCADE;


--
-- Name: camera_status_reports camera_status_reports_hardware_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."camera_status_reports"
    ADD CONSTRAINT "camera_status_reports_hardware_id_fkey" FOREIGN KEY ("hardware_id") REFERENCES "public"."camera_hardware"("id") ON DELETE CASCADE;


--
-- Name: camp_todos camp_todos_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."camp_todos"
    ADD CONSTRAINT "camp_todos_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."members"("id");


--
-- Name: club_events club_events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."club_events"
    ADD CONSTRAINT "club_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."members"("id");


--
-- Name: hunt_harvests hunt_harvests_hunt_log_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."hunt_harvests"
    ADD CONSTRAINT "hunt_harvests_hunt_log_id_fkey" FOREIGN KEY ("hunt_log_id") REFERENCES "public"."hunt_logs"("id") ON DELETE CASCADE;


--
-- Name: hunt_logs hunt_logs_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."hunt_logs"
    ADD CONSTRAINT "hunt_logs_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: hunt_logs hunt_logs_stand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."hunt_logs"
    ADD CONSTRAINT "hunt_logs_stand_id_fkey" FOREIGN KEY ("stand_id") REFERENCES "public"."stands"("id") ON DELETE SET NULL;


--
-- Name: hunt_sightings hunt_sightings_hunt_log_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."hunt_sightings"
    ADD CONSTRAINT "hunt_sightings_hunt_log_id_fkey" FOREIGN KEY ("hunt_log_id") REFERENCES "public"."hunt_logs"("id") ON DELETE CASCADE;


--
-- Name: maintenance_tasks maintenance_tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."maintenance_tasks"
    ADD CONSTRAINT "maintenance_tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."members"("id");


--
-- Name: members members_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: stands stands_last_harvest_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."stands"
    ADD CONSTRAINT "stands_last_harvest_by_fkey" FOREIGN KEY ("last_harvest_by") REFERENCES "public"."members"("id");


--
-- Name: stands stands_last_hunted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."stands"
    ADD CONSTRAINT "stands_last_hunted_by_fkey" FOREIGN KEY ("last_hunted_by") REFERENCES "public"."members"("id");


--
-- Name: camp_todos Allow authenticated users to insert camp todos; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to insert camp todos" ON "public"."camp_todos" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: club_events Allow authenticated users to insert club events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to insert club events" ON "public"."club_events" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: maintenance_tasks Allow authenticated users to insert maintenance tasks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to insert maintenance tasks" ON "public"."maintenance_tasks" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: stands Allow authenticated users to manage stands; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to manage stands" ON "public"."stands" TO "authenticated" USING (true);


--
-- Name: camp_todos Allow authenticated users to update camp todos; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to update camp todos" ON "public"."camp_todos" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: club_events Allow authenticated users to update club events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to update club events" ON "public"."club_events" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: maintenance_tasks Allow authenticated users to update maintenance tasks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to update maintenance tasks" ON "public"."maintenance_tasks" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: camp_todos Allow authenticated users to view all camp todos; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to view all camp todos" ON "public"."camp_todos" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: club_events Allow authenticated users to view all club events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to view all club events" ON "public"."club_events" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: maintenance_tasks Allow authenticated users to view all maintenance tasks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to view all maintenance tasks" ON "public"."maintenance_tasks" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: stands Allow authenticated users to view stands; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to view stands" ON "public"."stands" FOR SELECT TO "authenticated" USING (true);


--
-- Name: hunt_logs Allow users to manage their own hunt logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow users to manage their own hunt logs" ON "public"."hunt_logs" TO "authenticated" USING (("auth"."uid"() = "member_id"));


--
-- Name: hunt_logs Allow users to view hunt logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow users to view hunt logs" ON "public"."hunt_logs" FOR SELECT TO "authenticated" USING (true);


--
-- Name: hunt_harvests Authenticated users can insert harvests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can insert harvests" ON "public"."hunt_harvests" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."hunt_logs"
  WHERE ("hunt_logs"."id" = "hunt_harvests"."hunt_log_id")))));


--
-- Name: hunt_sightings Authenticated users can insert sightings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can insert sightings" ON "public"."hunt_sightings" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."hunt_logs"
  WHERE ("hunt_logs"."id" = "hunt_sightings"."hunt_log_id")))));


--
-- Name: camera_deployments Camera deployments accessible to authenticated users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Camera deployments accessible to authenticated users" ON "public"."camera_deployments" USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: camera_hardware Camera hardware accessible to authenticated users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Camera hardware accessible to authenticated users" ON "public"."camera_hardware" USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: camera_status_reports Camera reports accessible to authenticated users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Camera reports accessible to authenticated users" ON "public"."camera_status_reports" USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: property_boundaries Public can view boundaries; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can view boundaries" ON "public"."property_boundaries" FOR SELECT USING (true);


--
-- Name: hunt_harvests Users and admins can delete harvests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users and admins can delete harvests" ON "public"."hunt_harvests" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."hunt_logs"
  WHERE (("hunt_logs"."id" = "hunt_harvests"."hunt_log_id") AND (("hunt_logs"."member_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."members"
          WHERE (("members"."id" = "auth"."uid"()) AND ("members"."role" = 'admin'::"text")))))))));


--
-- Name: hunt_logs Users and admins can delete hunt logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users and admins can delete hunt logs" ON "public"."hunt_logs" FOR DELETE USING ((("auth"."uid"() = "member_id") OR (EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "auth"."uid"()) AND ("members"."role" = 'admin'::"text"))))));


--
-- Name: hunt_sightings Users and admins can delete sightings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users and admins can delete sightings" ON "public"."hunt_sightings" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."hunt_logs"
  WHERE (("hunt_logs"."id" = "hunt_sightings"."hunt_log_id") AND (("hunt_logs"."member_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."members"
          WHERE (("members"."id" = "auth"."uid"()) AND ("members"."role" = 'admin'::"text")))))))));


--
-- Name: hunt_logs Users and admins can insert hunt logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users and admins can insert hunt logs" ON "public"."hunt_logs" FOR INSERT WITH CHECK ((("auth"."uid"() = "member_id") OR (EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "auth"."uid"()) AND ("members"."role" = 'admin'::"text"))))));


--
-- Name: hunt_harvests Users and admins can update harvests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users and admins can update harvests" ON "public"."hunt_harvests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."hunt_logs"
  WHERE (("hunt_logs"."id" = "hunt_harvests"."hunt_log_id") AND (("hunt_logs"."member_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."members"
          WHERE (("members"."id" = "auth"."uid"()) AND ("members"."role" = 'admin'::"text")))))))));


--
-- Name: hunt_logs Users and admins can update hunt logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users and admins can update hunt logs" ON "public"."hunt_logs" FOR UPDATE USING ((("auth"."uid"() = "member_id") OR (EXISTS ( SELECT 1
   FROM "public"."members"
  WHERE (("members"."id" = "auth"."uid"()) AND ("members"."role" = 'admin'::"text"))))));


--
-- Name: hunt_sightings Users and admins can update sightings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users and admins can update sightings" ON "public"."hunt_sightings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."hunt_logs"
  WHERE (("hunt_logs"."id" = "hunt_sightings"."hunt_log_id") AND (("hunt_logs"."member_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."members"
          WHERE (("members"."id" = "auth"."uid"()) AND ("members"."role" = 'admin'::"text")))))))));


--
-- Name: daily_camera_snapshots Users can insert camera snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert camera snapshots" ON "public"."daily_camera_snapshots" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: daily_collection_log Users can insert collection log; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert collection log" ON "public"."daily_collection_log" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: daily_weather_snapshots Users can insert weather snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert weather snapshots" ON "public"."daily_weather_snapshots" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: daily_camera_snapshots Users can update camera snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update camera snapshots" ON "public"."daily_camera_snapshots" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: daily_collection_log Users can update collection log; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update collection log" ON "public"."daily_collection_log" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: daily_weather_snapshots Users can update weather snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update weather snapshots" ON "public"."daily_weather_snapshots" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: hunt_harvests Users can view all harvests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view all harvests" ON "public"."hunt_harvests" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: hunt_sightings Users can view all sightings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view all sightings" ON "public"."hunt_sightings" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: daily_camera_snapshots Users can view camera snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view camera snapshots" ON "public"."daily_camera_snapshots" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: daily_collection_log Users can view collection log; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view collection log" ON "public"."daily_collection_log" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: hunt_logs Users can view their own hunt logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own hunt logs" ON "public"."hunt_logs" FOR SELECT USING (("auth"."uid"() = "member_id"));


--
-- Name: daily_weather_snapshots Users can view weather snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view weather snapshots" ON "public"."daily_weather_snapshots" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: property_boundaries authenticated_users_all_access_boundaries; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "authenticated_users_all_access_boundaries" ON "public"."property_boundaries" USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: food_plots authenticated_users_all_access_plots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "authenticated_users_all_access_plots" ON "public"."food_plots" USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: trails authenticated_users_all_access_trails; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "authenticated_users_all_access_trails" ON "public"."trails" USING (("auth"."role"() = 'authenticated'::"text"));


--
-- Name: camera_deployments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."camera_deployments" ENABLE ROW LEVEL SECURITY;

--
-- Name: camera_hardware; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."camera_hardware" ENABLE ROW LEVEL SECURITY;

--
-- Name: camera_status_reports; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."camera_status_reports" ENABLE ROW LEVEL SECURITY;

--
-- Name: camp_todos; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."camp_todos" ENABLE ROW LEVEL SECURITY;

--
-- Name: club_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."club_events" ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_camera_snapshots; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."daily_camera_snapshots" ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_collection_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."daily_collection_log" ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_weather_snapshots; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."daily_weather_snapshots" ENABLE ROW LEVEL SECURITY;

--
-- Name: food_plots; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."food_plots" ENABLE ROW LEVEL SECURITY;

--
-- Name: hunt_harvests; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."hunt_harvests" ENABLE ROW LEVEL SECURITY;

--
-- Name: hunt_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."hunt_logs" ENABLE ROW LEVEL SECURITY;

--
-- Name: hunt_sightings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."hunt_sightings" ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenance_tasks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."maintenance_tasks" ENABLE ROW LEVEL SECURITY;

--
-- Name: members; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."members" ENABLE ROW LEVEL SECURITY;

--
-- Name: members members_insert_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "members_insert_own" ON "public"."members" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));


--
-- Name: members members_select_authenticated; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "members_select_authenticated" ON "public"."members" FOR SELECT TO "authenticated" USING (true);


--
-- Name: members members_update_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "members_update_own" ON "public"."members" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));


--
-- Name: property_boundaries; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."property_boundaries" ENABLE ROW LEVEL SECURITY;

--
-- Name: stands; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."stands" ENABLE ROW LEVEL SECURITY;

--
-- Name: trails; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."trails" ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION "supabase_realtime" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: supabase_admin
--

CREATE PUBLICATION "supabase_realtime_messages_publication" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "supabase_realtime_messages_publication" OWNER TO "supabase_admin";

--
-- Name: SCHEMA "public"; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


--
-- Name: FUNCTION "armor"("bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."armor"("bytea") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."armor"("bytea") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."armor"("bytea") TO "dashboard_user";


--
-- Name: FUNCTION "armor"("bytea", "text"[], "text"[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) TO "dashboard_user";


--
-- Name: FUNCTION "crypt"("text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."crypt"("text", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."crypt"("text", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."crypt"("text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "dearmor"("text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."dearmor"("text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."dearmor"("text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."dearmor"("text") TO "dashboard_user";


--
-- Name: FUNCTION "decrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "decrypt_iv"("bytea", "bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "digest"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."digest"("bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."digest"("bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."digest"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "digest"("text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."digest"("text", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."digest"("text", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."digest"("text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "encrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "encrypt_iv"("bytea", "bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "gen_random_bytes"(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) TO "dashboard_user";


--
-- Name: FUNCTION "gen_random_uuid"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."gen_random_uuid"() FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."gen_random_uuid"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."gen_random_uuid"() TO "dashboard_user";


--
-- Name: FUNCTION "gen_salt"("text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."gen_salt"("text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."gen_salt"("text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."gen_salt"("text") TO "dashboard_user";


--
-- Name: FUNCTION "gen_salt"("text", integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."gen_salt"("text", integer) FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."gen_salt"("text", integer) TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."gen_salt"("text", integer) TO "dashboard_user";


--
-- Name: FUNCTION "hmac"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "hmac"("text", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "shared_blk_read_time" double precision, OUT "shared_blk_write_time" double precision, OUT "local_blk_read_time" double precision, OUT "local_blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision, OUT "jit_deform_count" bigint, OUT "jit_deform_time" double precision, OUT "stats_since" timestamp with time zone, OUT "minmax_stats_since" timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "shared_blk_read_time" double precision, OUT "shared_blk_write_time" double precision, OUT "local_blk_read_time" double precision, OUT "local_blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision, OUT "jit_deform_count" bigint, OUT "jit_deform_time" double precision, OUT "stats_since" timestamp with time zone, OUT "minmax_stats_since" timestamp with time zone) FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "shared_blk_read_time" double precision, OUT "shared_blk_write_time" double precision, OUT "local_blk_read_time" double precision, OUT "local_blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision, OUT "jit_deform_count" bigint, OUT "jit_deform_time" double precision, OUT "stats_since" timestamp with time zone, OUT "minmax_stats_since" timestamp with time zone) TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "shared_blk_read_time" double precision, OUT "shared_blk_write_time" double precision, OUT "local_blk_read_time" double precision, OUT "local_blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision, OUT "jit_deform_count" bigint, OUT "jit_deform_time" double precision, OUT "stats_since" timestamp with time zone, OUT "minmax_stats_since" timestamp with time zone) TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone) FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone) TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone) TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint, "minmax_only" boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint, "minmax_only" boolean) FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint, "minmax_only" boolean) TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint, "minmax_only" boolean) TO "dashboard_user";


--
-- Name: FUNCTION "pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_key_id"("bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_key_id"("bytea") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_key_id"("bytea") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_key_id"("bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt"("text", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt"("text", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt_bytea"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt_bytea"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt_bytea"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt_bytea"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt"("text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt"("text", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt_bytea"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt_bytea"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v1"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v1"() FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v1mc"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v3"("namespace" "uuid", "name" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v4"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v4"() FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v4"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v4"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v5"("namespace" "uuid", "name" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_nil"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_nil"() FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."uuid_nil"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."uuid_nil"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_dns"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_ns_dns"() FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."uuid_ns_dns"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."uuid_ns_dns"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_oid"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_ns_oid"() FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."uuid_ns_oid"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."uuid_ns_oid"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_url"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_ns_url"() FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."uuid_ns_url"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."uuid_ns_url"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_x500"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_ns_x500"() FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."uuid_ns_x500"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."uuid_ns_x500"() TO "dashboard_user";


--
-- Name: FUNCTION "graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb"); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "service_role";


--
-- Name: FUNCTION "backfill_hunt_weather_data"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."backfill_hunt_weather_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."backfill_hunt_weather_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."backfill_hunt_weather_data"() TO "service_role";


--
-- Name: FUNCTION "backfill_legal_hunting_times"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."backfill_legal_hunting_times"() TO "anon";
GRANT ALL ON FUNCTION "public"."backfill_legal_hunting_times"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."backfill_legal_hunting_times"() TO "service_role";


--
-- Name: FUNCTION "calculate_activity_score"("images_added_today" integer, "avg_images_per_day" numeric); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."calculate_activity_score"("images_added_today" integer, "avg_images_per_day" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_activity_score"("images_added_today" integer, "avg_images_per_day" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_activity_score"("images_added_today" integer, "avg_images_per_day" numeric) TO "service_role";


--
-- Name: FUNCTION "calculate_activity_trend"("current_images" integer, "previous_images" integer, "days_back" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."calculate_activity_trend"("current_images" integer, "previous_images" integer, "days_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_activity_trend"("current_images" integer, "previous_images" integer, "days_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_activity_trend"("current_images" integer, "previous_images" integer, "days_back" integer) TO "service_role";


--
-- Name: FUNCTION "calculate_legal_hunting_times"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."calculate_legal_hunting_times"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_legal_hunting_times"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_legal_hunting_times"() TO "service_role";


--
-- Name: FUNCTION "calculate_weather_quality_score"("weather_data" "jsonb"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."calculate_weather_quality_score"("weather_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_weather_quality_score"("weather_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_weather_quality_score"("weather_data" "jsonb") TO "service_role";


--
-- Name: FUNCTION "detect_camera_location_change"("current_coordinates" "text", "previous_coordinates" "text", "threshold_meters" numeric); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."detect_camera_location_change"("current_coordinates" "text", "previous_coordinates" "text", "threshold_meters" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."detect_camera_location_change"("current_coordinates" "text", "previous_coordinates" "text", "threshold_meters" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."detect_camera_location_change"("current_coordinates" "text", "previous_coordinates" "text", "threshold_meters" numeric) TO "service_role";


--
-- Name: FUNCTION "detect_missing_cameras"("check_date" "date"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."detect_missing_cameras"("check_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."detect_missing_cameras"("check_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."detect_missing_cameras"("check_date" "date") TO "service_role";


--
-- Name: FUNCTION "handle_new_user"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";


--
-- Name: FUNCTION "handle_updated_at"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";


--
-- Name: FUNCTION "interpolate_dawn_dusk_temps"("sunrise_time" time without time zone, "sunset_time" time without time zone, "tempmin" numeric, "tempmax" numeric, "current_temp" numeric); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."interpolate_dawn_dusk_temps"("sunrise_time" time without time zone, "sunset_time" time without time zone, "tempmin" numeric, "tempmax" numeric, "current_temp" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."interpolate_dawn_dusk_temps"("sunrise_time" time without time zone, "sunset_time" time without time zone, "tempmin" numeric, "tempmax" numeric, "current_temp" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."interpolate_dawn_dusk_temps"("sunrise_time" time without time zone, "sunset_time" time without time zone, "tempmin" numeric, "tempmax" numeric, "current_temp" numeric) TO "service_role";


--
-- Name: FUNCTION "update_camera_alert_status"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_camera_alert_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_camera_alert_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_camera_alert_status"() TO "service_role";


--
-- Name: FUNCTION "update_hunt_logs_weather"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_hunt_logs_weather"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_hunt_logs_weather"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_hunt_logs_weather"() TO "service_role";


--
-- Name: FUNCTION "update_stand_activity_on_hunt"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_stand_activity_on_hunt"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_stand_activity_on_hunt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_stand_activity_on_hunt"() TO "service_role";


--
-- Name: FUNCTION "update_stand_stats_from_hunt"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_stand_stats_from_hunt"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_stand_stats_from_hunt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_stand_stats_from_hunt"() TO "service_role";


--
-- Name: FUNCTION "update_updated_at_column"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


--
-- Name: FUNCTION "validate_coordinates"("coordinates" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."validate_coordinates"("coordinates" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_coordinates"("coordinates" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_coordinates"("coordinates" "text") TO "service_role";


--
-- Name: FUNCTION "_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea"); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "vault"."_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "vault"."_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea") TO "service_role";


--
-- Name: FUNCTION "create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid"); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "vault"."create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "vault"."create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid"); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "vault"."update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "vault"."update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "service_role";


--
-- Name: TABLE "pg_stat_statements"; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE "extensions"."pg_stat_statements" FROM "postgres";
GRANT ALL ON TABLE "extensions"."pg_stat_statements" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "extensions"."pg_stat_statements" TO "dashboard_user";


--
-- Name: TABLE "pg_stat_statements_info"; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE "extensions"."pg_stat_statements_info" FROM "postgres";
GRANT ALL ON TABLE "extensions"."pg_stat_statements_info" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "extensions"."pg_stat_statements_info" TO "dashboard_user";


--
-- Name: TABLE "camera_deployments"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."camera_deployments" TO "anon";
GRANT ALL ON TABLE "public"."camera_deployments" TO "authenticated";
GRANT ALL ON TABLE "public"."camera_deployments" TO "service_role";


--
-- Name: TABLE "camera_hardware"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."camera_hardware" TO "anon";
GRANT ALL ON TABLE "public"."camera_hardware" TO "authenticated";
GRANT ALL ON TABLE "public"."camera_hardware" TO "service_role";


--
-- Name: TABLE "camera_status_reports"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."camera_status_reports" TO "anon";
GRANT ALL ON TABLE "public"."camera_status_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."camera_status_reports" TO "service_role";


--
-- Name: TABLE "camp_todos"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."camp_todos" TO "anon";
GRANT ALL ON TABLE "public"."camp_todos" TO "authenticated";
GRANT ALL ON TABLE "public"."camp_todos" TO "service_role";


--
-- Name: TABLE "club_events"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."club_events" TO "anon";
GRANT ALL ON TABLE "public"."club_events" TO "authenticated";
GRANT ALL ON TABLE "public"."club_events" TO "service_role";


--
-- Name: TABLE "daily_camera_snapshots"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."daily_camera_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."daily_camera_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_camera_snapshots" TO "service_role";


--
-- Name: TABLE "daily_collection_log"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."daily_collection_log" TO "anon";
GRANT ALL ON TABLE "public"."daily_collection_log" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_collection_log" TO "service_role";


--
-- Name: TABLE "daily_weather_snapshots"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."daily_weather_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."daily_weather_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_weather_snapshots" TO "service_role";


--
-- Name: TABLE "food_plots"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."food_plots" TO "anon";
GRANT ALL ON TABLE "public"."food_plots" TO "authenticated";
GRANT ALL ON TABLE "public"."food_plots" TO "service_role";


--
-- Name: TABLE "hunt_harvests"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."hunt_harvests" TO "anon";
GRANT ALL ON TABLE "public"."hunt_harvests" TO "authenticated";
GRANT ALL ON TABLE "public"."hunt_harvests" TO "service_role";


--
-- Name: TABLE "hunt_logs"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."hunt_logs" TO "anon";
GRANT ALL ON TABLE "public"."hunt_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."hunt_logs" TO "service_role";


--
-- Name: TABLE "hunt_logs_with_temperature"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."hunt_logs_with_temperature" TO "anon";
GRANT ALL ON TABLE "public"."hunt_logs_with_temperature" TO "authenticated";
GRANT ALL ON TABLE "public"."hunt_logs_with_temperature" TO "service_role";


--
-- Name: TABLE "hunt_sightings"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."hunt_sightings" TO "anon";
GRANT ALL ON TABLE "public"."hunt_sightings" TO "authenticated";
GRANT ALL ON TABLE "public"."hunt_sightings" TO "service_role";


--
-- Name: TABLE "maintenance_tasks"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."maintenance_tasks" TO "anon";
GRANT ALL ON TABLE "public"."maintenance_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."maintenance_tasks" TO "service_role";


--
-- Name: TABLE "members"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."members" TO "anon";
GRANT ALL ON TABLE "public"."members" TO "authenticated";
GRANT ALL ON TABLE "public"."members" TO "service_role";


--
-- Name: TABLE "property_boundaries"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."property_boundaries" TO "anon";
GRANT ALL ON TABLE "public"."property_boundaries" TO "authenticated";
GRANT ALL ON TABLE "public"."property_boundaries" TO "service_role";


--
-- Name: TABLE "stands"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."stands" TO "anon";
GRANT ALL ON TABLE "public"."stands" TO "authenticated";
GRANT ALL ON TABLE "public"."stands" TO "service_role";


--
-- Name: TABLE "trails"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."trails" TO "anon";
GRANT ALL ON TABLE "public"."trails" TO "authenticated";
GRANT ALL ON TABLE "public"."trails" TO "service_role";


--
-- Name: TABLE "secrets"; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE "vault"."secrets" TO "postgres" WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE "vault"."secrets" TO "service_role";


--
-- Name: TABLE "decrypted_secrets"; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE "vault"."decrypted_secrets" TO "postgres" WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE "vault"."decrypted_secrets" TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "issue_graphql_placeholder" ON "sql_drop"
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION "extensions"."set_graphql_placeholder"();


ALTER EVENT TRIGGER "issue_graphql_placeholder" OWNER TO "supabase_admin";

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "issue_pg_cron_access" ON "ddl_command_end"
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION "extensions"."grant_pg_cron_access"();


ALTER EVENT TRIGGER "issue_pg_cron_access" OWNER TO "supabase_admin";

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "issue_pg_graphql_access" ON "ddl_command_end"
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION "extensions"."grant_pg_graphql_access"();


ALTER EVENT TRIGGER "issue_pg_graphql_access" OWNER TO "supabase_admin";

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "issue_pg_net_access" ON "ddl_command_end"
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION "extensions"."grant_pg_net_access"();


ALTER EVENT TRIGGER "issue_pg_net_access" OWNER TO "supabase_admin";

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "pgrst_ddl_watch" ON "ddl_command_end"
   EXECUTE FUNCTION "extensions"."pgrst_ddl_watch"();


ALTER EVENT TRIGGER "pgrst_ddl_watch" OWNER TO "supabase_admin";

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "pgrst_drop_watch" ON "sql_drop"
   EXECUTE FUNCTION "extensions"."pgrst_drop_watch"();


ALTER EVENT TRIGGER "pgrst_drop_watch" OWNER TO "supabase_admin";

--
-- PostgreSQL database dump complete
--

