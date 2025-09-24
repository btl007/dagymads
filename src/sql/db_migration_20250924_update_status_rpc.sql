CREATE OR REPLACE FUNCTION public.update_project_status(
    p_project_id uuid,
    p_new_status text -- Accept TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $FUNCTION_BODY$
BEGIN
    UPDATE public.projects
    SET status = p_new_status::public.project_status -- Explicitly CAST to the enum type
    WHERE id = p_project_id;
END;
$FUNCTION_BODY$;

COMMENT ON FUNCTION public.update_project_status(uuid, text) IS 'Updates the status of a single project.';
