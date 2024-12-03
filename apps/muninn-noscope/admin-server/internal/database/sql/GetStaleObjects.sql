-- name: GetStaleObjects :many
SELECT o.id 
FROM objects o
WHERE (o.last_synced_at < $1 OR o.last_synced_at IS NULL)
AND NOT EXISTS (
  SELECT 1 
  FROM tasks t 
  WHERE t.object_id = o.id 
  AND t.status = 'pending' OR t.status = 'processing'
);