import React, { useCallback, useEffect, useState } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Box,
  Select,
  HStack,
  Button,
  Text,
} from '@chakra-ui/react';
import { listTasks } from '../api/task';
import { Task } from '../types';

export function TasksList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<Task['status'] | ''>('');
  const [offset, setOffset] = useState(0);
  const limit = 10;

  const loadTasks = useCallback(async () => {
    const params: any = { limit, offset };
    if (status) params.status = status;
    try {
      const data = await listTasks(params);
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }, [status, offset]);

  useEffect(() => {
    loadTasks();
  });

  const getStatusColor = (status: Task['status']) => {
    const colors = {
      pending: 'yellow',
      processing: 'blue',
      completed: 'green',
      failed: 'red',
    };
    return colors[status];
  };

  return (
    <Box>
      <HStack mb={4}>
        <Select
          placeholder='Filter by status'
          value={status}
          onChange={(e) => setStatus(e.target.value as Task['status'])}
          maxW='200px'
        >
          <option value='pending'>Pending</option>
          <option value='processing'>Processing</option>
          <option value='completed'>Completed</option>
          <option value='failed'>Failed</option>
        </Select>
      </HStack>

      <Table variant='simple' bg='white' shadow='sm' rounded='lg'>
        <Thead>
          <Tr>
            <Th>ID</Th>
            <Th>Object ID</Th>
            <Th>Status</Th>
            <Th>Created</Th>
            <Th>Started</Th>
            <Th>Completed</Th>
          </Tr>
        </Thead>
        <Tbody>
          {tasks?.map((task) => (
            <Tr key={task.id}>
              <Td fontSize='sm'>{task.id}</Td>
              <Td fontSize='sm'>{task.object_id}</Td>
              <Td>
                <Badge colorScheme={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
              </Td>
              <Td fontSize='sm'>
                {new Date(task.created_at).toLocaleDateString()}
              </Td>
              <Td fontSize='sm'>
                {task.started_at
                  ? new Date(task.started_at).toLocaleDateString()
                  : '-'}
              </Td>
              <Td fontSize='sm'>
                {task.completed_at
                  ? new Date(task.completed_at).toLocaleDateString()
                  : '-'}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <HStack justify='flex-end' mt={4} spacing={4}>
        <Button
          size='sm'
          onClick={() => setOffset(Math.max(0, offset - limit))}
          isDisabled={offset === 0}
        >
          Previous
        </Button>
        <Text fontSize='sm'>Page {Math.floor(offset / limit) + 1}</Text>
        <Button
          size='sm'
          onClick={() => setOffset(offset + limit)}
          isDisabled={tasks?.length < limit}
        >
          Next
        </Button>
      </HStack>
    </Box>
  );
}
