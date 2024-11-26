-- name: UpdateTaskProcessing :one
UPDATE tasks 
SET status = 'processing', 
  started_at = $1 
WHERE id = (
  SELECT id 
  FROM tasks 
  WHERE status = 'pending' 
  ORDER BY created_at 
  FOR UPDATE SKIP LOCKED 
  LIMIT 1
)
RETURNING id, object_id, input;

-- name: UpdateTaskStatus :exec
UPDATE tasks 
SET status = $1, 
  output = $2, 
  error = $3, 
  completed_at = $4 
WHERE id = $5;