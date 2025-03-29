-- Create the email_errors table to track failures
CREATE TABLE IF NOT EXISTS public.email_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    attempted_action TEXT NOT NULL,
    email_id UUID,
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolution_notes TEXT,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ
);

-- Create index for efficient timestamp-based queries
CREATE INDEX IF NOT EXISTS email_errors_timestamp_idx ON public.email_errors (timestamp DESC);

-- Create index for finding errors by type
CREATE INDEX IF NOT EXISTS email_errors_type_idx ON public.email_errors (error_type);

-- Create a view for analytics on error frequency
CREATE OR REPLACE VIEW public.email_error_analytics AS
SELECT 
    date_trunc('hour', timestamp) as time_bucket,
    error_type,
    COUNT(*) as error_count,
    COUNT(CASE WHEN resolved THEN 1 END) as resolved_count
FROM 
    public.email_errors
GROUP BY 
    date_trunc('hour', timestamp),
    error_type
ORDER BY 
    time_bucket DESC;

-- Create a function to record email errors
CREATE OR REPLACE FUNCTION public.record_email_error(
    p_error_type TEXT,
    p_error_message TEXT,
    p_attempted_action TEXT,
    p_email_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_error_id UUID;
BEGIN
    INSERT INTO public.email_errors (
        error_type,
        error_message,
        attempted_action,
        email_id
    ) VALUES (
        p_error_type,
        p_error_message,
        p_attempted_action,
        p_email_id
    )
    RETURNING id INTO v_error_id;
    
    RETURN v_error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to mark errors as resolved
CREATE OR REPLACE FUNCTION public.resolve_email_error(
    p_error_id UUID,
    p_resolved_by UUID,
    p_resolution_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.email_errors
    SET 
        resolved = true,
        resolved_by = p_resolved_by,
        resolved_at = now(),
        resolution_notes = p_resolution_notes
    WHERE 
        id = p_error_id;
        
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a table to track database connectivity
CREATE TABLE IF NOT EXISTS public.db_connection_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL CHECK (status IN ('connected', 'disconnected', 'degraded')),
    latency_ms INTEGER,
    connection_source TEXT,
    details JSONB
);

-- Create a function to log database connectivity
CREATE OR REPLACE FUNCTION public.log_db_connection(
    p_status TEXT,
    p_latency_ms INTEGER DEFAULT NULL,
    p_connection_source TEXT DEFAULT 'admin-dashboard',
    p_details JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.db_connection_logs (
        status,
        latency_ms,
        connection_source,
        details
    ) VALUES (
        p_status,
        p_latency_ms,
        p_connection_source,
        p_details
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies
ALTER TABLE public.email_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.db_connection_logs ENABLE ROW LEVEL SECURITY;

-- Policies for email_errors
CREATE POLICY "Employees can view all email errors"
    ON public.email_errors FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and managers can insert email errors"
    ON public.email_errors FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'manager')
        )
    );

CREATE POLICY "Admins and managers can update email errors"
    ON public.email_errors FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'manager')
        )
    );

-- Policies for db_connection_logs
CREATE POLICY "Employees can view all connection logs"
    ON public.db_connection_logs FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admin dashboard can insert connection logs"
    ON public.db_connection_logs FOR INSERT
    WITH CHECK (TRUE);

-- Add a trigger to notify on new email errors
CREATE OR REPLACE FUNCTION public.notify_email_error() RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'email_error',
        json_build_object(
            'id', NEW.id,
            'timestamp', NEW.timestamp,
            'error_type', NEW.error_type,
            'email_id', NEW.email_id
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_email_error
AFTER INSERT ON public.email_errors
FOR EACH ROW EXECUTE FUNCTION public.notify_email_error();
