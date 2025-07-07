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
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: food_source_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.food_source_type AS ENUM (
    'field',
    'feeder'
);


ALTER TYPE public.food_source_type OWNER TO postgres;

--
-- Name: stand_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.stand_type AS ENUM (
    'ladder_stand',
    'bale_blind',
    'box_stand',
    'tripod'
);


ALTER TYPE public.stand_type OWNER TO postgres;

--
-- Name: time_of_day; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.time_of_day AS ENUM (
    'AM',
    'PM',
    'ALL'
);


ALTER TYPE public.time_of_day OWNER TO postgres;

--
-- Name: wind_direction; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.wind_direction AS ENUM (
    'N',
    'NE',
    'E',
    'SE',
    'S',
    'SW',
    'W',
    'NW'
);


ALTER TYPE public.wind_direction OWNER TO postgres;

--
-- Name: detect_missing_cameras(date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.detect_missing_cameras(check_date date DEFAULT CURRENT_DATE) RETURNS integer
    LANGUAGE plpgsql
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


ALTER FUNCTION public.detect_missing_cameras(check_date date) OWNER TO postgres;

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_updated_at() OWNER TO postgres;

--
-- Name: update_camera_alert_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_camera_alert_status() RETURNS trigger
    LANGUAGE plpgsql
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


ALTER FUNCTION public.update_camera_alert_status() OWNER TO postgres;

--
-- Name: update_stand_stats_from_hunt(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_stand_stats_from_hunt() RETURNS trigger
    LANGUAGE plpgsql
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


ALTER FUNCTION public.update_stand_stats_from_hunt() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: camera_deployments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.camera_deployments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hardware_id uuid NOT NULL,
    location_name character varying(100) NOT NULL,
    latitude numeric(10,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    season_year integer DEFAULT EXTRACT(year FROM CURRENT_DATE) NOT NULL,
    stand_id uuid,
    facing_direction character varying(2),
    has_solar_panel boolean DEFAULT false,
    active boolean DEFAULT true,
    notes text,
    last_seen_date date,
    missing_since_date date,
    is_missing boolean DEFAULT false,
    consecutive_missing_days integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT camera_deployments_facing_direction_check CHECK (((facing_direction)::text = ANY ((ARRAY['N'::character varying, 'NE'::character varying, 'E'::character varying, 'SE'::character varying, 'S'::character varying, 'SW'::character varying, 'W'::character varying, 'NW'::character varying])::text[])))
);


ALTER TABLE public.camera_deployments OWNER TO postgres;

--
-- Name: camera_hardware; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.camera_hardware (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    device_id character varying(10) NOT NULL,
    brand character varying(50) NOT NULL,
    model character varying(50) NOT NULL,
    serial_number character varying(100),
    purchase_date date,
    fw_version character varying(20),
    cl_version character varying(20),
    condition character varying(20) DEFAULT 'good'::character varying,
    active boolean DEFAULT true,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT camera_hardware_condition_check CHECK (((condition)::text = ANY ((ARRAY['good'::character varying, 'questionable'::character varying, 'poor'::character varying, 'retired'::character varying])::text[])))
);


ALTER TABLE public.camera_hardware OWNER TO postgres;

--
-- Name: camera_status_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.camera_status_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deployment_id uuid NOT NULL,
    hardware_id uuid NOT NULL,
    report_date date NOT NULL,
    battery_status character varying(20),
    signal_level character varying(20),
    network_links character varying(100),
    sd_images_count integer,
    sd_free_space_mb integer,
    image_queue integer,
    needs_attention boolean DEFAULT false,
    alert_reason text,
    report_processing_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.camera_status_reports OWNER TO postgres;

--
-- Name: camp_todos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.camp_todos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    category text DEFAULT 'general'::text,
    priority text DEFAULT 'medium'::text,
    status text DEFAULT 'pending'::text,
    assigned_to uuid,
    due_date date,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT camp_todos_category_check CHECK ((category = ANY (ARRAY['supplies'::text, 'groceries'::text, 'equipment'::text, 'general'::text]))),
    CONSTRAINT camp_todos_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
    CONSTRAINT camp_todos_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text])))
);


ALTER TABLE public.camp_todos OWNER TO postgres;

--
-- Name: club_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.club_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    event_date date NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    event_type text DEFAULT 'meeting'::text,
    location text,
    all_day boolean DEFAULT false,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_public boolean DEFAULT true,
    CONSTRAINT club_events_event_type_check CHECK ((event_type = ANY (ARRAY['meeting'::text, 'work_day'::text, 'social'::text, 'hunting'::text, 'maintenance'::text])))
);


ALTER TABLE public.club_events OWNER TO postgres;

--
-- Name: food_plots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.food_plots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    plot_data jsonb,
    crop_type character varying(100),
    planting_date date,
    harvest_date date,
    size_acres numeric(5,2),
    notes text,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE public.food_plots OWNER TO postgres;

--
-- Name: hunt_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hunt_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    member_id uuid NOT NULL,
    stand_id uuid,
    hunt_date date NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    weather_conditions jsonb,
    temperature_high integer,
    temperature_low integer,
    wind_speed integer,
    wind_direction character varying(10),
    precipitation numeric(4,2),
    moon_phase character varying(20),
    harvest_count integer DEFAULT 0,
    game_type character varying(50),
    notes text,
    photos text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.hunt_logs OWNER TO postgres;

--
-- Name: maintenance_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    assigned_to uuid,
    priority text DEFAULT 'medium'::text,
    status text DEFAULT 'pending'::text,
    due_date date,
    category text DEFAULT 'general'::text,
    location text,
    estimated_hours integer,
    actual_hours integer,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    CONSTRAINT maintenance_tasks_category_check CHECK ((category = ANY (ARRAY['general'::text, 'equipment'::text, 'property'::text, 'safety'::text, 'feeder'::text]))),
    CONSTRAINT maintenance_tasks_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
    CONSTRAINT maintenance_tasks_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])))
);


ALTER TABLE public.maintenance_tasks OWNER TO postgres;

--
-- Name: members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.members (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    phone text,
    role text DEFAULT 'member'::text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT members_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text])))
);


ALTER TABLE public.members OWNER TO postgres;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    role text DEFAULT 'member'::text NOT NULL,
    avatar_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text])))
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: property_boundaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_boundaries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) DEFAULT 'Main Property'::character varying NOT NULL,
    boundary_data jsonb NOT NULL,
    total_acres numeric(8,2),
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE public.property_boundaries OWNER TO postgres;

--
-- Name: stands; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stands (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    active boolean DEFAULT true,
    latitude numeric(10,8),
    longitude numeric(11,8),
    trail_name character varying(100),
    walking_time_minutes integer,
    access_notes text,
    height_feet integer,
    capacity integer DEFAULT 1,
    type public.stand_type DEFAULT 'ladder_stand'::public.stand_type,
    time_of_day public.time_of_day DEFAULT 'ALL'::public.time_of_day,
    view_distance_yards integer,
    nearby_water_source boolean DEFAULT false,
    total_hunts integer DEFAULT 0,
    total_harvests integer DEFAULT 0,
    last_used_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    season_hunts integer DEFAULT 0,
    food_source public.food_source_type,
    archery_season boolean DEFAULT false,
    trail_camera_name character varying(100)
);


ALTER TABLE public.stands OWNER TO postgres;

--
-- Name: trail_cameras_backup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trail_cameras_backup (
    id uuid,
    name character varying(100),
    description text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    brand character varying(50),
    model character varying(50),
    battery_level integer,
    sd_card_space_gb integer,
    last_photo_date timestamp with time zone,
    status character varying(20),
    notes text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.trail_cameras_backup OWNER TO postgres;

--
-- Name: trails; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trails (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    trail_data jsonb,
    difficulty character varying(20) DEFAULT 'easy'::character varying,
    distance_miles numeric(5,2),
    color character varying(7) DEFAULT '#3b82f6'::character varying,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE public.trails OWNER TO postgres;

--
-- Name: camera_deployments camera_deployments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_deployments
    ADD CONSTRAINT camera_deployments_pkey PRIMARY KEY (id);


--
-- Name: camera_hardware camera_hardware_device_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_hardware
    ADD CONSTRAINT camera_hardware_device_id_key UNIQUE (device_id);


--
-- Name: camera_hardware camera_hardware_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_hardware
    ADD CONSTRAINT camera_hardware_pkey PRIMARY KEY (id);


--
-- Name: camera_status_reports camera_status_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_status_reports
    ADD CONSTRAINT camera_status_reports_pkey PRIMARY KEY (id);


--
-- Name: camp_todos camp_todos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camp_todos
    ADD CONSTRAINT camp_todos_pkey PRIMARY KEY (id);


--
-- Name: club_events club_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.club_events
    ADD CONSTRAINT club_events_pkey PRIMARY KEY (id);


--
-- Name: food_plots food_plots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.food_plots
    ADD CONSTRAINT food_plots_pkey PRIMARY KEY (id);


--
-- Name: hunt_logs hunt_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hunt_logs
    ADD CONSTRAINT hunt_logs_pkey PRIMARY KEY (id);


--
-- Name: maintenance_tasks maintenance_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_tasks
    ADD CONSTRAINT maintenance_tasks_pkey PRIMARY KEY (id);


--
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: property_boundaries property_boundaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_boundaries
    ADD CONSTRAINT property_boundaries_pkey PRIMARY KEY (id);


--
-- Name: stands stands_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stands
    ADD CONSTRAINT stands_pkey PRIMARY KEY (id);


--
-- Name: trails trails_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trails
    ADD CONSTRAINT trails_pkey PRIMARY KEY (id);


--
-- Name: idx_camera_deployments_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_camera_deployments_active ON public.camera_deployments USING btree (active);


--
-- Name: idx_camera_deployments_consecutive_missing; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_camera_deployments_consecutive_missing ON public.camera_deployments USING btree (consecutive_missing_days) WHERE (consecutive_missing_days > 0);


--
-- Name: idx_camera_deployments_hardware; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_camera_deployments_hardware ON public.camera_deployments USING btree (hardware_id);


--
-- Name: idx_camera_deployments_last_seen; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_camera_deployments_last_seen ON public.camera_deployments USING btree (last_seen_date);


--
-- Name: idx_camera_deployments_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_camera_deployments_location ON public.camera_deployments USING btree (location_name);


--
-- Name: idx_camera_deployments_missing; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_camera_deployments_missing ON public.camera_deployments USING btree (is_missing) WHERE (is_missing = true);


--
-- Name: idx_camera_deployments_season; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_camera_deployments_season ON public.camera_deployments USING btree (season_year);


--
-- Name: idx_camera_hardware_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_camera_hardware_active ON public.camera_hardware USING btree (active);


--
-- Name: idx_camera_hardware_device_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_camera_hardware_device_id ON public.camera_hardware USING btree (device_id);


--
-- Name: idx_camera_reports_alerts; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_camera_reports_alerts ON public.camera_status_reports USING btree (needs_attention) WHERE (needs_attention = true);


--
-- Name: idx_camera_reports_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_camera_reports_date ON public.camera_status_reports USING btree (report_date);


--
-- Name: idx_camera_reports_deployment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_camera_reports_deployment ON public.camera_status_reports USING btree (deployment_id);


--
-- Name: idx_camera_reports_hardware; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_camera_reports_hardware ON public.camera_status_reports USING btree (hardware_id);


--
-- Name: idx_camera_reports_processing_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_camera_reports_processing_date ON public.camera_status_reports USING btree (report_processing_date);


--
-- Name: idx_camp_todos_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_camp_todos_status ON public.camp_todos USING btree (status);


--
-- Name: idx_club_events_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_club_events_date ON public.club_events USING btree (event_date);


--
-- Name: idx_hunt_logs_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hunt_logs_date ON public.hunt_logs USING btree (hunt_date);


--
-- Name: idx_hunt_logs_harvest; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hunt_logs_harvest ON public.hunt_logs USING btree (harvest_count);


--
-- Name: idx_hunt_logs_member; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hunt_logs_member ON public.hunt_logs USING btree (member_id);


--
-- Name: idx_hunt_logs_stand; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hunt_logs_stand ON public.hunt_logs USING btree (stand_id);


--
-- Name: idx_maintenance_tasks_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maintenance_tasks_due_date ON public.maintenance_tasks USING btree (due_date);


--
-- Name: idx_maintenance_tasks_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maintenance_tasks_status ON public.maintenance_tasks USING btree (status);


--
-- Name: idx_stands_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stands_active ON public.stands USING btree (active);


--
-- Name: idx_stands_last_used; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stands_last_used ON public.stands USING btree (last_used_date);


--
-- Name: idx_stands_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stands_location ON public.stands USING btree (latitude, longitude);


--
-- Name: camera_status_reports trigger_camera_alert_status; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_camera_alert_status BEFORE INSERT OR UPDATE ON public.camera_status_reports FOR EACH ROW EXECUTE FUNCTION public.update_camera_alert_status();


--
-- Name: camera_deployments trigger_camera_deployments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_camera_deployments_updated_at BEFORE UPDATE ON public.camera_deployments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: camera_hardware trigger_camera_hardware_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_camera_hardware_updated_at BEFORE UPDATE ON public.camera_hardware FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: property_boundaries update_boundaries_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_boundaries_updated_at BEFORE UPDATE ON public.property_boundaries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: camp_todos update_camp_todos_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_camp_todos_updated_at BEFORE UPDATE ON public.camp_todos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: club_events update_club_events_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_club_events_updated_at BEFORE UPDATE ON public.club_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: hunt_logs update_hunt_logs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_hunt_logs_updated_at BEFORE UPDATE ON public.hunt_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: maintenance_tasks update_maintenance_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_maintenance_tasks_updated_at BEFORE UPDATE ON public.maintenance_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: members update_members_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: food_plots update_plots_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_plots_updated_at BEFORE UPDATE ON public.food_plots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: hunt_logs update_stand_stats; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_stand_stats AFTER INSERT OR DELETE OR UPDATE ON public.hunt_logs FOR EACH ROW EXECUTE FUNCTION public.update_stand_stats_from_hunt();


--
-- Name: stands update_stands_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_stands_updated_at BEFORE UPDATE ON public.stands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: trails update_trails_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_trails_updated_at BEFORE UPDATE ON public.trails FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: camera_deployments camera_deployments_hardware_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_deployments
    ADD CONSTRAINT camera_deployments_hardware_id_fkey FOREIGN KEY (hardware_id) REFERENCES public.camera_hardware(id) ON DELETE CASCADE;


--
-- Name: camera_deployments camera_deployments_stand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_deployments
    ADD CONSTRAINT camera_deployments_stand_id_fkey FOREIGN KEY (stand_id) REFERENCES public.stands(id);


--
-- Name: camera_status_reports camera_status_reports_deployment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_status_reports
    ADD CONSTRAINT camera_status_reports_deployment_id_fkey FOREIGN KEY (deployment_id) REFERENCES public.camera_deployments(id) ON DELETE CASCADE;


--
-- Name: camera_status_reports camera_status_reports_hardware_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_status_reports
    ADD CONSTRAINT camera_status_reports_hardware_id_fkey FOREIGN KEY (hardware_id) REFERENCES public.camera_hardware(id) ON DELETE CASCADE;


--
-- Name: camp_todos camp_todos_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camp_todos
    ADD CONSTRAINT camp_todos_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.members(id);


--
-- Name: club_events club_events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.club_events
    ADD CONSTRAINT club_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.members(id);


--
-- Name: hunt_logs hunt_logs_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hunt_logs
    ADD CONSTRAINT hunt_logs_member_id_fkey FOREIGN KEY (member_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: hunt_logs hunt_logs_stand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hunt_logs
    ADD CONSTRAINT hunt_logs_stand_id_fkey FOREIGN KEY (stand_id) REFERENCES public.stands(id) ON DELETE SET NULL;


--
-- Name: maintenance_tasks maintenance_tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_tasks
    ADD CONSTRAINT maintenance_tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.members(id);


--
-- Name: members members_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles Admins can update all profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles profiles_1
  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::text)))));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles profiles_1
  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::text)))));


--
-- Name: camp_todos Allow authenticated users to insert camp todos; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to insert camp todos" ON public.camp_todos FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: club_events Allow authenticated users to insert club events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to insert club events" ON public.club_events FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: maintenance_tasks Allow authenticated users to insert maintenance tasks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to insert maintenance tasks" ON public.maintenance_tasks FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: stands Allow authenticated users to manage stands; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to manage stands" ON public.stands TO authenticated USING (true);


--
-- Name: camp_todos Allow authenticated users to update camp todos; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to update camp todos" ON public.camp_todos FOR UPDATE USING ((auth.role() = 'authenticated'::text));


--
-- Name: club_events Allow authenticated users to update club events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to update club events" ON public.club_events FOR UPDATE USING ((auth.role() = 'authenticated'::text));


--
-- Name: maintenance_tasks Allow authenticated users to update maintenance tasks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to update maintenance tasks" ON public.maintenance_tasks FOR UPDATE USING ((auth.role() = 'authenticated'::text));


--
-- Name: camp_todos Allow authenticated users to view all camp todos; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to view all camp todos" ON public.camp_todos FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: club_events Allow authenticated users to view all club events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to view all club events" ON public.club_events FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: maintenance_tasks Allow authenticated users to view all maintenance tasks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to view all maintenance tasks" ON public.maintenance_tasks FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: members Allow authenticated users to view all members; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to view all members" ON public.members FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: stands Allow authenticated users to view stands; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to view stands" ON public.stands FOR SELECT TO authenticated USING (true);


--
-- Name: profiles Allow profile creation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow profile creation" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: hunt_logs Allow users to manage their own hunt logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow users to manage their own hunt logs" ON public.hunt_logs TO authenticated USING ((auth.uid() = member_id));


--
-- Name: members Allow users to update their own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow users to update their own profile" ON public.members FOR UPDATE USING ((auth.uid() = id));


--
-- Name: hunt_logs Allow users to view hunt logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow users to view hunt logs" ON public.hunt_logs FOR SELECT TO authenticated USING (true);


--
-- Name: camera_deployments Camera deployments accessible to authenticated users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Camera deployments accessible to authenticated users" ON public.camera_deployments USING ((auth.role() = 'authenticated'::text));


--
-- Name: camera_hardware Camera hardware accessible to authenticated users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Camera hardware accessible to authenticated users" ON public.camera_hardware USING ((auth.role() = 'authenticated'::text));


--
-- Name: camera_status_reports Camera reports accessible to authenticated users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Camera reports accessible to authenticated users" ON public.camera_status_reports USING ((auth.role() = 'authenticated'::text));


--
-- Name: property_boundaries Public can view boundaries; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can view boundaries" ON public.property_boundaries FOR SELECT USING (true);


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: property_boundaries authenticated_users_all_access_boundaries; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY authenticated_users_all_access_boundaries ON public.property_boundaries USING ((auth.role() = 'authenticated'::text));


--
-- Name: food_plots authenticated_users_all_access_plots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY authenticated_users_all_access_plots ON public.food_plots USING ((auth.role() = 'authenticated'::text));


--
-- Name: trails authenticated_users_all_access_trails; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY authenticated_users_all_access_trails ON public.trails USING ((auth.role() = 'authenticated'::text));


--
-- Name: camera_deployments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.camera_deployments ENABLE ROW LEVEL SECURITY;

--
-- Name: camera_hardware; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.camera_hardware ENABLE ROW LEVEL SECURITY;

--
-- Name: camera_status_reports; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.camera_status_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: camp_todos; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.camp_todos ENABLE ROW LEVEL SECURITY;

--
-- Name: club_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.club_events ENABLE ROW LEVEL SECURITY;

--
-- Name: food_plots; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.food_plots ENABLE ROW LEVEL SECURITY;

--
-- Name: hunt_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.hunt_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenance_tasks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: members; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: property_boundaries; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.property_boundaries ENABLE ROW LEVEL SECURITY;

--
-- Name: stands; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.stands ENABLE ROW LEVEL SECURITY;

--
-- Name: trails; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.trails ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION detect_missing_cameras(check_date date); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.detect_missing_cameras(check_date date) TO anon;
GRANT ALL ON FUNCTION public.detect_missing_cameras(check_date date) TO authenticated;
GRANT ALL ON FUNCTION public.detect_missing_cameras(check_date date) TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION handle_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_updated_at() TO anon;
GRANT ALL ON FUNCTION public.handle_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.handle_updated_at() TO service_role;


--
-- Name: FUNCTION update_camera_alert_status(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_camera_alert_status() TO anon;
GRANT ALL ON FUNCTION public.update_camera_alert_status() TO authenticated;
GRANT ALL ON FUNCTION public.update_camera_alert_status() TO service_role;


--
-- Name: FUNCTION update_stand_stats_from_hunt(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_stand_stats_from_hunt() TO anon;
GRANT ALL ON FUNCTION public.update_stand_stats_from_hunt() TO authenticated;
GRANT ALL ON FUNCTION public.update_stand_stats_from_hunt() TO service_role;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;


--
-- Name: TABLE camera_deployments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.camera_deployments TO anon;
GRANT ALL ON TABLE public.camera_deployments TO authenticated;
GRANT ALL ON TABLE public.camera_deployments TO service_role;


--
-- Name: TABLE camera_hardware; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.camera_hardware TO anon;
GRANT ALL ON TABLE public.camera_hardware TO authenticated;
GRANT ALL ON TABLE public.camera_hardware TO service_role;


--
-- Name: TABLE camera_status_reports; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.camera_status_reports TO anon;
GRANT ALL ON TABLE public.camera_status_reports TO authenticated;
GRANT ALL ON TABLE public.camera_status_reports TO service_role;


--
-- Name: TABLE camp_todos; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.camp_todos TO anon;
GRANT ALL ON TABLE public.camp_todos TO authenticated;
GRANT ALL ON TABLE public.camp_todos TO service_role;


--
-- Name: TABLE club_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.club_events TO anon;
GRANT ALL ON TABLE public.club_events TO authenticated;
GRANT ALL ON TABLE public.club_events TO service_role;


--
-- Name: TABLE food_plots; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.food_plots TO anon;
GRANT ALL ON TABLE public.food_plots TO authenticated;
GRANT ALL ON TABLE public.food_plots TO service_role;


--
-- Name: TABLE hunt_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.hunt_logs TO anon;
GRANT ALL ON TABLE public.hunt_logs TO authenticated;
GRANT ALL ON TABLE public.hunt_logs TO service_role;


--
-- Name: TABLE maintenance_tasks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.maintenance_tasks TO anon;
GRANT ALL ON TABLE public.maintenance_tasks TO authenticated;
GRANT ALL ON TABLE public.maintenance_tasks TO service_role;


--
-- Name: TABLE members; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.members TO anon;
GRANT ALL ON TABLE public.members TO authenticated;
GRANT ALL ON TABLE public.members TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: TABLE property_boundaries; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.property_boundaries TO anon;
GRANT ALL ON TABLE public.property_boundaries TO authenticated;
GRANT ALL ON TABLE public.property_boundaries TO service_role;


--
-- Name: TABLE stands; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.stands TO anon;
GRANT ALL ON TABLE public.stands TO authenticated;
GRANT ALL ON TABLE public.stands TO service_role;


--
-- Name: TABLE trail_cameras_backup; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.trail_cameras_backup TO anon;
GRANT ALL ON TABLE public.trail_cameras_backup TO authenticated;
GRANT ALL ON TABLE public.trail_cameras_backup TO service_role;


--
-- Name: TABLE trails; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.trails TO anon;
GRANT ALL ON TABLE public.trails TO authenticated;
GRANT ALL ON TABLE public.trails TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

