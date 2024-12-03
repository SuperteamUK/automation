-- name: CreateTask :one
WITH new_task AS (
  INSERT INTO tasks (
    object_id,
    status,
    input
  )
  SELECT 
    $1,
    'pending',
    $2
  WHERE NOT EXISTS (
    SELECT 1 
    FROM tasks 
    WHERE object_id = $1 
    AND status = 'pending'
  )
  RETURNING *
)
SELECT * FROM new_task;