import { Button, HStack, Text } from '@chakra-ui/react';

interface PaginationProps {
  offset: number;
  total: number;
  limit: number;
  setOffset: (offset: number) => void;
}

export const DefaultPagination = {
  offset: 0,
  total: 0,
  limit: 10,
};

const Pagination = ({ offset, total, limit, setOffset }: PaginationProps) => {
  return (
    <HStack justify='flex-end' mt={4} spacing={4}>
      <Text mr={2}>Total: {total}</Text>
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
        isDisabled={offset + limit >= total}
      >
        Next
      </Button>
    </HStack>
  );
};

export { Pagination };
