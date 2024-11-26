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
  Text,
  Modal,
  ModalHeader,
  ModalContent,
  ModalBody,
  Divider,
} from '@chakra-ui/react';
import { listTasks } from '../api/task';
import { Task } from '../types';
import { shortenText } from '../utils/text';
import dayjs from 'dayjs';
import { DefaultPagination, Pagination } from '../components/Pagination';

const MUNINN_URL = process.env.REACT_APP_MUNINN_URL;

const inputToText = (keyValues: any) => {
  return window.Object.keys(keyValues)
    .map((key) => (keyValues[key] ? `${keyValues[key]}` : ''))
    .filter((v) => v && v !== ' ')
    .join(', ');
};

export function TasksList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState(DefaultPagination);
  const [status, setStatus] = useState<Task['status'] | ''>('');
  const [showOutput, setShowOutput] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  useEffect(() => {
    const loadTasks = async () => {
      const params: any = {
        limit: pagination.limit,
        offset: pagination.offset,
      };
      if (status) params.status = status;
      try {
        const data = await listTasks(params);
        setTasks(data.tasks);
        if (
          data.pagination.offset !== pagination.offset ||
          data.pagination.limit !== pagination.limit ||
          data.pagination.total !== pagination.total
        ) {
          setPagination(data.pagination);
        }
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    };
    loadTasks();
  }, [pagination, status]);

  const getStatusColor = (status: Task['status']) => {
    const colors = {
      pending: 'yellow',
      processing: 'blue',
      completed: 'green',
      failed: 'red',
    };
    return colors[status];
  };
  const handleTaskClick = useCallback((task: Task) => {
    if (['completed', 'failed'].includes(task.status)) {
      setCurrentTask(task);
      setShowOutput(true);
    }
  }, []);
  return (
    <Box>
      <HStack mb={4}>
        <Text>Total: {}</Text>
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
              <Td
                fontSize='sm'
                onClick={() => {
                  handleTaskClick(task);
                }}
                cursor={
                  ['completed', 'failed'].includes(task.status)
                    ? 'pointer'
                    : 'default'
                }
                _hover={
                  ['completed', 'failed'].includes(task.status)
                    ? { color: 'blue.500' }
                    : {}
                }
              >
                {task.id}
              </Td>
              <Td
                fontSize='sm'
                title={inputToText(task.input || {})}
                _hover={{
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  background: 'yellow.100',
                }}
                onClick={() => {
                  window.open(
                    `${MUNINN_URL}/objects/${task.object_id}`,
                    '_blank'
                  );
                }}
              >
                {shortenText(inputToText(task.input || {}), 50)}
              </Td>
              <Td>
                <Badge
                  onClick={() => {
                    handleTaskClick(task);
                  }}
                  colorScheme={getStatusColor(task.status)}
                  cursor={task.status === 'completed' ? 'pointer' : 'default'}
                >
                  {task.status}
                </Badge>
              </Td>
              <Td fontSize='sm'>
                {task.created_at && task.created_at.Valid
                  ? dayjs(task.created_at.Time).format('YYYY-MM-DD HH:mm')
                  : '-'}
              </Td>
              <Td fontSize='sm'>
                {task.started_at && task.started_at.Valid
                  ? new Date(task.started_at.Time).toLocaleDateString()
                  : '-'}
              </Td>
              <Td fontSize='sm'>
                {task.completed_at && task.completed_at.Valid
                  ? new Date(task.completed_at.Time).toLocaleDateString()
                  : '-'}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Pagination
        offset={pagination.offset}
        total={pagination.total}
        limit={pagination.limit}
        setOffset={(newoffset: number) => {
          setPagination({ ...pagination, offset: newoffset });
        }}
      />
      <TaskOutputModal
        isOpen={showOutput}
        onClose={() => setShowOutput(false)}
        task={currentTask}
        failed={currentTask?.status === 'failed'}
      />
    </Box>
  );
}

interface TaskOutputModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  failed?: boolean;
}

const TaskOutputModal = ({
  isOpen,
  onClose,
  task,
  failed = false,
}: TaskOutputModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={'lg'}>
      <ModalContent>
        <ModalHeader>
          <Text>Task Process</Text>
        </ModalHeader>
        <ModalBody>
          <Box width={'100%'} overflow={'scroll'}>
            <Text fontWeight={'bold'}>Input</Text>
            <pre>{JSON.stringify(task?.input, null, 2)}</pre>
          </Box>
          <Divider my={4} />
          <Box width={'100%'} overflow={'scroll'}>
            <Text fontWeight={'bold'}>Output</Text>
            <pre>
              {JSON.stringify(failed ? task?.error : task?.output, null, 2)}
            </pre>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
