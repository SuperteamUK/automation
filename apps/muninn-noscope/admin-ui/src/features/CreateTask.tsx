import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  useToast,
  Text,
} from '@chakra-ui/react';
import { createTask } from '../api/task';
import { SearchInput } from '../components/SearchInput';
import { getObjectDetail, searchObjects } from '../api/muninn';
import { AnimatePresence } from 'framer-motion';
import { ListObjectsRow } from '../types';
import { LoadingModal } from '../components/LoadingModal';
import { composeNoScopeInput } from '../logic';

export function CreateTask() {
  const [objectId, setObjectId] = useState('');
  const [input, setInput] = useState('');
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [foundObjects, setFoundObjects] = useState<ListObjectsRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const inputJson = JSON.parse(input);
      setIsLoading(true);
      await createTask({
        object_id: objectId,
        input: inputJson,
      });

      toast({
        title: 'Task created',
        status: 'success',
        duration: 3000,
      });

      setObjectId('');
      setInput('');
    } catch (error) {
      toast({
        title: 'Error creating task',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const search = async () => {
      setIsLoading(true);
      const data = await searchObjects(1, 10, searchQuery);
      setFoundObjects(data.objects);
      setIsLoading(false);
    };
    search();
  }, [searchQuery]);

  useEffect(() => {
    const getDetail = async () => {
      if (objectId === '') return;
      setIsLoading(true);
      if (objectId === '') return;
      const obj = await getObjectDetail(objectId);
      const params = obj.typeValues.map((tv) => {
        return tv.type_values;
      });
      const ipt = composeNoScopeInput(params, obj.name);
      setInput(JSON.stringify(ipt, null, 2));
      setIsLoading(false);
    };
    getDetail();
  }, [objectId]);

  return (
    <Box bg='white' p={6} rounded='lg' shadow='sm'>
      <VStack spacing={4} align='stretch'>
        <Box position={'relative'}>
          <FormControl>
            <FormLabel>Search</FormLabel>
            <SearchInput
              initialSearchQuery={searchQuery}
              setSearchQuery={(q: string) => {
                setSearchQuery(q);
              }}
            />
          </FormControl>
          <AnimatePresence>
            {foundObjects.length > 0 && (
              <VStack
                spacing={2}
                align='stretch'
                w='100%'
                maxH='200px'
                overflowY='auto'
                position={'absolute'}
                background='white'
                zIndex={100}
                border={'1px solid'}
                borderColor={'gray.200'}
                boxShadow={'md'}
              >
                {foundObjects.map((obj: ListObjectsRow) => (
                  <Flex
                    key={obj.id}
                    p={1}
                    cursor='pointer'
                    _hover={{ bg: 'blue.100' }}
                    onClick={() => {
                      setObjectId(obj.id);
                      setFoundObjects([]);
                      setSearchQuery('');
                    }}
                    direction='column'
                  >
                    <Text>{obj.name}</Text>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: obj.objHeadline || obj.factHeadline,
                      }}
                      style={{ fontWeight: 'lighter' }}
                    />
                  </Flex>
                ))}
              </VStack>
            )}
          </AnimatePresence>
        </Box>

        <FormControl isRequired>
          <FormLabel>Object ID</FormLabel>
          <Input value={objectId} placeholder='Enter UUID' isDisabled={true} />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Input (JSON)</FormLabel>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Enter JSON input'
            minH='200px'
          />
        </FormControl>

        <Button
          type='submit'
          colorScheme='blue'
          isLoading={isLoading}
          onClick={handleSubmit}
        >
          Create Task
        </Button>
      </VStack>
      <LoadingModal isLoading={isLoading} setIsLoading={setIsLoading} />
    </Box>
  );
}
