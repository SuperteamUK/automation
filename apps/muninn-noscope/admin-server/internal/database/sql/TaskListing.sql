-- name: ListTasks :many
SELECT *
FROM tasks
WHERE 
    ($1::uuid IS NULL OR object_id = $1::uuid) AND
    ($2::text = '' OR status = $2::text)
ORDER BY created_at DESC
LIMIT $3
OFFSET $4;

-- name: CountTasks :one
SELECT COUNT(*)
FROM tasks
WHERE 
    ($1::uuid IS NULL OR object_id = $1::uuid) AND
    ($2::text = '' OR status = $2::text);