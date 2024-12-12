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

-- name: ObjectsSyncLast60days :many
SELECT *
FROM objects
WHERE last_synced_at > NOW() - INTERVAL '60 days';

-- name: GetLatestScanTime :one
SELECT latest 
FROM object_scan_logs 
ORDER BY created_at DESC 
LIMIT 1;

-- name: CreateScanLog :exec
INSERT INTO object_scan_logs (latest) 
VALUES ($1);

-- name: HealthCheck :one
Select 1;