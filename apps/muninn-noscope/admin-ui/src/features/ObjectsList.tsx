import React, { useEffect, useState } from 'react';
import { Table, Thead, Tbody, Tr, Th, Td, Box, Text } from '@chakra-ui/react';
import { listObjects } from '../api/object';
import { Object } from '../types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { DefaultPagination, Pagination } from '../components/Pagination';

dayjs.extend(relativeTime);
export function ObjectsList() {
  const [objects, setObjects] = useState<Object[]>([]);
  const [pagination, setPagination] = useState(DefaultPagination);

  const loadData = async () => {
    try {
      const data = await listObjects({
        limit: pagination.limit,
        offset: pagination.offset,
      });
      if (
        data.pagination.offset !== pagination.offset ||
        data.pagination.limit !== pagination.limit ||
        data.pagination.total !== pagination.total
      ) {
        setPagination(data.pagination);
      }
      setObjects(data.objects);
    } catch (error) {}
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.offset]);

  return (
    <Box>
      <Text>Total {}</Text>
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
                {obj.created_at && obj.created_at.Valid
                  ? dayjs(obj.created_at.Time).format('YYYY-MM-DD')
                  : '-'}
              </Td>
              <Td fontSize='sm'>
                {obj.last_synced_at && obj.last_synced_at.Valid ? (
                  dayjs(obj.last_synced_at.Time).fromNow()
                ) : (
                  <></>
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Pagination
        offset={pagination.offset}
        total={pagination.total}
        limit={pagination.limit}
        setOffset={(offset: number) => setPagination({ ...pagination, offset })}
      />
    </Box>
  );
}
