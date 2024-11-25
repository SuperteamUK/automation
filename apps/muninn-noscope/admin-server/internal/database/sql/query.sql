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
WHERE CASE WHEN $1::uuid IS NOT NULL THEN id = $1 ELSE TRUE END
ORDER BY last_synced_at DESC NULLS LAST
LIMIT $2
OFFSET $3;

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
    CASE WHEN $1::uuid IS NOT NULL THEN object_id = $1 ELSE TRUE END AND
    CASE WHEN $2::text IS NOT NULL THEN status = $2 ELSE TRUE END
ORDER BY created_at DESC
LIMIT $3
OFFSET $4;