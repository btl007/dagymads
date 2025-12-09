CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_changes JSONB := '{}'::JSONB;
    v_target_id TEXT;
    v_actor_id TEXT;
    v_key TEXT;
    v_val_old JSONB;
    v_val_new JSONB;
BEGIN
    -- [수정] time_slots 테이블의 INSERT 작업은 로그 기록 제외 (자동 생성 노이즈 방지)
    IF (TG_TABLE_NAME = 'time_slots' AND TG_OP = 'INSERT') THEN
        RETURN NEW;
    END IF;

    v_actor_id := auth.jwt() ->> 'sub';
    IF v_actor_id IS NULL THEN v_actor_id := 'system'; END IF;

    -- Target ID 추출
    IF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        IF v_old_data ? 'id' THEN
            v_target_id := (v_old_data ->> 'id');
        ELSIF v_old_data ? 'user_id' THEN
            v_target_id := (v_old_data ->> 'user_id');
        ELSE
            v_target_id := 'unknown';
        END IF;
    ELSE
        v_new_data := to_jsonb(NEW);
        IF v_new_data ? 'id' THEN
            v_target_id := (v_new_data ->> 'id');
        ELSIF v_new_data ? 'user_id' THEN
            v_target_id := (v_new_data ->> 'user_id');
        ELSE
            v_target_id := 'unknown';
        END IF;
    END IF;

    IF (TG_OP = 'INSERT') THEN
        v_changes := to_jsonb(NEW);
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        
        FOR v_key IN SELECT jsonb_object_keys(v_new_data)
        LOOP
            v_val_old := v_old_data -> v_key;
            v_val_new := v_new_data -> v_key;
            
            IF (v_val_old IS DISTINCT FROM v_val_new) THEN
                IF v_key != 'updated_at' THEN
                    v_changes := jsonb_set(v_changes, ARRAY[v_key], jsonb_build_object('old', v_val_old, 'new', v_val_new));
                END IF;
            END IF;
        END LOOP;
        
        IF v_changes = '{}'::JSONB THEN RETURN NEW; END IF;

    ELSIF (TG_OP = 'DELETE') THEN
        v_changes := to_jsonb(OLD);
    END IF;

    INSERT INTO public.audit_logs (actor_id, target_table, target_id, action_type, changes)
    VALUES (v_actor_id, TG_TABLE_NAME, v_target_id, TG_OP, v_changes);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
