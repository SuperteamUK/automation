import React, { useEffect, useState } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  HStack,
  Button,
  Text,
} from '@chakra-ui/react';
import { listObjects } from '../api/object';
import { Object } from '../types';

export function ObjectsList() {
  const [objects, setObjects] = useState<Object[]>([]);
  const [offset, setOffset] = useState(0);
  const limit = 10;

  const loadObjects = async () => {
    try {
      const data = await listObjects({ limit, offset });
      setObjects(data);
    } catch (error) {}
  };
  console.log('objects: ', objects);
  useEffect(() => {
    loadObjects();
  }, [offset]);

  return (
    <Box>
      <Table variant='simple' bg='white' shadow='sm' rounded='lg'>
        <Thead>
          <Tr>
            <Th>ID</Th>
            <Th>Created</Th>
            <Th>Last Synced</Th>
          </Tr>
        </Thead>
        <Tbody>
          {objects?.map((obj: Object) => (
            <Tr key={obj.id}>
              <Td fontSize='sm'>{obj.id}</Td>
              <Td fontSize='sm'>
                {new Date(obj.created_at).toLocaleDateString()}
              </Td>
              <Td fontSize='sm'>
                {obj.last_synced_at
                  ? new Date(obj.last_synced_at).toLocaleDateString()
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
          isDisabled={objects.length < limit}
        >
          Next
        </Button>
      </HStack>
    </Box>
  );
}
