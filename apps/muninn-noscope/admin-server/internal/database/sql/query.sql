-- name: CreateObject :one
INSERT INTO objects (id)
VALUES ($1)
RETURNING *;

-- name: GetObject :one
SELECT * FROM objects
WHERE id = $1;

-- name: ListObjects :many
SELECT *
FROM objects
ORDER BY last_synced_at DESC NULLS LAST
LIMIT $1
OFFSET $2;

-- name: CountObjects :one
SELECT COUNT(*)
FROM objects;

-- name: UpdateObjectLastSyncedAt :one
UPDATE objects
SET last_synced_at = $2
WHERE id = $1
RETURNING *;

-- name: CreateTask :one
INSERT INTO tasks (
    object_id,
    status,
    input
) VALUES (
    $1,
    'pending',
    $2
)
RETURNING *;

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