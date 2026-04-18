CREATE OR REPLACE FUNCTION public.create_ticket_comment_notifications()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_ticket_raised_user_id bigint;
    v_ticket_assigned_user_id bigint;
    v_author_type_id bigint;
    v_assigned_type_id bigint;
    v_author_name text;
    v_actor_label text;
    v_comment_preview text;
    v_message text;
BEGIN
    SELECT t.raised_user_id, t.assigned_user_id
    INTO v_ticket_raised_user_id, v_ticket_assigned_user_id
    FROM public."Tickets" t
    WHERE t.ticket_id = NEW.ticket_id;

    IF v_ticket_raised_user_id IS NULL AND v_ticket_assigned_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT u.type_id, COALESCE(NULLIF(BTRIM(u.name), ''), NULLIF(BTRIM(u.email), ''), NULLIF(BTRIM(u.username), ''), 'User')
    INTO v_author_type_id, v_author_name
    FROM public."Users" u
    WHERE u.user_id = NEW.user_id;

    IF v_author_name IS NULL THEN
        v_author_name := 'User';
    END IF;

    IF v_author_type_id = 5 THEN
        v_actor_label := 'Admin ' || v_author_name;
    ELSIF v_author_type_id = 4 THEN
        v_actor_label := 'Technician ' || v_author_name;
    ELSE
        v_actor_label := v_author_name;
    END IF;

    v_comment_preview := regexp_replace(COALESCE(NEW.comment, ''), '\s+', ' ', 'g');
    v_comment_preview := BTRIM(v_comment_preview);

    IF v_comment_preview = '' THEN
        v_comment_preview := 'View the latest ticket reply.';
    ELSIF length(v_comment_preview) > 120 THEN
        v_comment_preview := left(v_comment_preview, 117) || '...';
    END IF;

    v_message := 'New comment on ticket '
        || NEW.ticket_id
        || ' from '
        || v_actor_label
        || ' (comment '
        || NEW.ticket_comment_id
        || '): '
        || v_comment_preview;

    IF v_author_type_id = 5 THEN
        IF v_ticket_raised_user_id IS NOT NULL
           AND v_ticket_raised_user_id <> NEW.user_id THEN
            INSERT INTO public."Notifications" (notification_type, notification, user_id)
            SELECT 'Ticket', v_message, v_ticket_raised_user_id
            WHERE NOT EXISTS (
                SELECT 1
                FROM public."Notifications" n
                WHERE n.user_id = v_ticket_raised_user_id
                  AND n.notification_type = 'Ticket'
                  AND n.notification = v_message
            );
        END IF;

        IF v_ticket_assigned_user_id IS NOT NULL
           AND v_ticket_assigned_user_id <> NEW.user_id THEN
            SELECT u.type_id
            INTO v_assigned_type_id
            FROM public."Users" u
            WHERE u.user_id = v_ticket_assigned_user_id;

            IF v_assigned_type_id = 4 THEN
                INSERT INTO public."Notifications" (notification_type, notification, user_id)
                SELECT 'Ticket', v_message, v_ticket_assigned_user_id
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM public."Notifications" n
                    WHERE n.user_id = v_ticket_assigned_user_id
                      AND n.notification_type = 'Ticket'
                      AND n.notification = v_message
                );
            END IF;
        END IF;
    ELSIF v_author_type_id = 4 THEN
        IF v_ticket_raised_user_id IS NOT NULL
           AND v_ticket_raised_user_id <> NEW.user_id THEN
            INSERT INTO public."Notifications" (notification_type, notification, user_id)
            SELECT 'Ticket', v_message, v_ticket_raised_user_id
            WHERE NOT EXISTS (
                SELECT 1
                FROM public."Notifications" n
                WHERE n.user_id = v_ticket_raised_user_id
                  AND n.notification_type = 'Ticket'
                  AND n.notification = v_message
            );
        END IF;
    ELSE
        IF v_ticket_assigned_user_id IS NOT NULL
           AND v_ticket_assigned_user_id <> NEW.user_id THEN
            SELECT u.type_id
            INTO v_assigned_type_id
            FROM public."Users" u
            WHERE u.user_id = v_ticket_assigned_user_id;

            IF v_assigned_type_id = 4 THEN
                INSERT INTO public."Notifications" (notification_type, notification, user_id)
                SELECT 'Ticket', v_message, v_ticket_assigned_user_id
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM public."Notifications" n
                    WHERE n.user_id = v_ticket_assigned_user_id
                      AND n.notification_type = 'Ticket'
                      AND n.notification = v_message
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ticket_comment_notifications ON public."Ticket_comments";

CREATE TRIGGER trg_ticket_comment_notifications
AFTER INSERT ON public."Ticket_comments"
FOR EACH ROW
EXECUTE FUNCTION public.create_ticket_comment_notifications();
