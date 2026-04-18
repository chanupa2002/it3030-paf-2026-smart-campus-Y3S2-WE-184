WITH comment_context AS (
    SELECT
        tc.ticket_comment_id,
        tc.ticket_id,
        tc.user_id AS author_user_id,
        COALESCE(author.type_id, 0) AS author_type_id,
        t.raised_user_id,
        t.assigned_user_id,
        assigned.type_id AS assigned_type_id,
        CASE
            WHEN author.type_id = 5 THEN 'Admin '
            WHEN author.type_id = 4 THEN 'Technician '
            ELSE ''
        END
        || COALESCE(NULLIF(BTRIM(author.name), ''), NULLIF(BTRIM(author.email), ''), NULLIF(BTRIM(author.username), ''), 'User')
            AS actor_label,
        CASE
            WHEN cleaned.comment_preview = '' THEN 'View the latest ticket reply.'
            WHEN length(cleaned.comment_preview) > 120 THEN left(cleaned.comment_preview, 117) || '...'
            ELSE cleaned.comment_preview
        END AS comment_preview
    FROM public."Ticket_comments" tc
    JOIN public."Tickets" t
      ON t.ticket_id = tc.ticket_id
    JOIN public."Users" author
      ON author.user_id = tc.user_id
    LEFT JOIN public."Users" assigned
      ON assigned.user_id = t.assigned_user_id
    CROSS JOIN LATERAL (
        SELECT BTRIM(regexp_replace(COALESCE(tc.comment, ''), '\s+', ' ', 'g')) AS comment_preview
    ) cleaned
),
candidate_notifications AS (
    SELECT
        cc.ticket_comment_id,
        cc.ticket_id,
        cc.raised_user_id AS recipient_user_id,
        'New comment on ticket '
            || cc.ticket_id
            || ' from '
            || cc.actor_label
            || ' (comment '
            || cc.ticket_comment_id
            || '): '
            || cc.comment_preview AS notification_message
    FROM comment_context cc
    WHERE cc.author_type_id = 5
      AND cc.raised_user_id IS NOT NULL
      AND cc.raised_user_id <> cc.author_user_id

    UNION ALL

    SELECT
        cc.ticket_comment_id,
        cc.ticket_id,
        cc.assigned_user_id AS recipient_user_id,
        'New comment on ticket '
            || cc.ticket_id
            || ' from '
            || cc.actor_label
            || ' (comment '
            || cc.ticket_comment_id
            || '): '
            || cc.comment_preview AS notification_message
    FROM comment_context cc
    WHERE cc.author_type_id = 5
      AND cc.assigned_user_id IS NOT NULL
      AND cc.assigned_user_id <> cc.author_user_id
      AND cc.assigned_type_id = 4

    UNION ALL

    SELECT
        cc.ticket_comment_id,
        cc.ticket_id,
        cc.raised_user_id AS recipient_user_id,
        'New comment on ticket '
            || cc.ticket_id
            || ' from '
            || cc.actor_label
            || ' (comment '
            || cc.ticket_comment_id
            || '): '
            || cc.comment_preview AS notification_message
    FROM comment_context cc
    WHERE cc.author_type_id = 4
      AND cc.raised_user_id IS NOT NULL
      AND cc.raised_user_id <> cc.author_user_id

    UNION ALL

    SELECT
        cc.ticket_comment_id,
        cc.ticket_id,
        cc.assigned_user_id AS recipient_user_id,
        'New comment on ticket '
            || cc.ticket_id
            || ' from '
            || cc.actor_label
            || ' (comment '
            || cc.ticket_comment_id
            || '): '
            || cc.comment_preview AS notification_message
    FROM comment_context cc
    WHERE cc.author_type_id NOT IN (4, 5)
      AND cc.assigned_user_id IS NOT NULL
      AND cc.assigned_user_id <> cc.author_user_id
      AND cc.assigned_type_id = 4
)
INSERT INTO public."Notifications" (notification_type, notification, user_id)
SELECT DISTINCT
    'Ticket',
    cn.notification_message,
    cn.recipient_user_id
FROM candidate_notifications cn
WHERE cn.recipient_user_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM public."Notifications" n
      WHERE n.user_id = cn.recipient_user_id
        AND n.notification_type = 'Ticket'
        AND n.notification = cn.notification_message
  );
